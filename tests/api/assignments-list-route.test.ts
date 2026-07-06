import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const requireApiAuthContextMock = vi.fn();
const resolveExplicitUserOrgContextMock = vi.fn();
const emitAnalyticsEventMock = vi.fn();
const dbSelectMock = vi.fn();

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: (...args: any[]) => requireApiAuthContextMock(...args),
}));

vi.mock('@/lib/assignments/access', () => ({
  ASSIGNMENT_MUTATION_ROLES: ['org_owner', 'org_manager'],
  resolveExplicitUserOrgContext: (...args: any[]) => resolveExplicitUserOrgContextMock(...args),
}));

vi.mock('@/lib/analytics/events', () => ({
  emitAnalyticsEvent: (...args: any[]) => emitAnalyticsEventMock(...args),
}));

vi.mock('@/lib/env', () => ({
  isMockSupabaseEnabled: () => false,
}));

vi.mock('@/lib/api/observability', () => ({
  jsonErrorWithRequest: (requestId: string, error: string, status = 400, message?: string) =>
    Response.json({ requestId, error, message }, { status }),
  withApiObservability: async (_request: Request, _route: string, handler: any) =>
    handler({ requestId: 'req-assignments-list' }),
}));

vi.mock('@/lib/api/errors', () => ({
  safeApiErrorResponse: ({ publicMessage, status = 500 }: any) =>
    Response.json({ error: publicMessage }, { status }),
  safeValidationErrorResponse: ({ publicMessage, status = 400 }: any) =>
    Response.json({ error: publicMessage }, { status }),
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/db', () => ({
  db: {
    select: (...args: any[]) => dbSelectMock(...args),
  },
}));

vi.mock('drizzle-orm', () => ({
  and: (...args: any[]) => ({ op: 'and', args }),
  eq: (...args: any[]) => ({ op: 'eq', args }),
  inArray: (...args: any[]) => ({ op: 'inArray', args }),
  sql: (strings: TemplateStringsArray) => ({ sql: strings.join('?') }),
}));

vi.mock('@/db/schema', () => ({
  assignments: {
    id: 'assignments.id',
    orgId: 'assignments.org_id',
    status: 'assignments.status',
    createdAt: 'assignments.created_at',
  },
  matches: {
    id: 'matches.id',
    assignmentId: 'matches.assignment_id',
    updatedAt: 'matches.updated_at',
  },
  matchReviewStates: {
    matchId: 'match_review_states.match_id',
    reviewStage: 'match_review_states.review_stage',
    updatedAt: 'match_review_states.updated_at',
  },
  assignmentExpertiseMatrix: {},
  canonicalEngagementTypeValues: ['full_time', 'contract_consulting'],
  skillsTaxonomy: {},
}));

vi.mock('@/lib/feature-flags/server', () => ({
  isFeatureEnabled: vi.fn(),
}));

vi.mock('@/lib/authz', () => ({
  PrincipalContextSchema: {
    optional: () => ({
      parse: (value: unknown) => value,
      safeParse: (value: unknown) => ({ success: true, data: value }),
    }),
  },
  ensureOrganizationPrincipal: vi.fn(),
}));

vi.mock('@/lib/assignments/activation', () => ({
  checkAndEmitAssignmentActivation: vi.fn(),
  evaluateAssignmentActivationCriteria: vi.fn(),
}));

vi.mock('@/lib/assignments/expertise-matrix', () => ({
  buildMatrixRowsFromRequirements: vi.fn(() => []),
  deriveRequirementsFromMatrix: vi.fn(() => ({ mustHaveSkills: [], niceToHaveSkills: [] })),
}));

vi.mock('@/lib/featureFlags', () => ({
  FEATURE_FLAG_KEYS: {
    ASSIGNMENT_BASIC_MODE: 'assignment_basic_mode',
  },
}));

vi.mock('@/lib/privacy/log-redaction', () => ({
  sanitizeErrorForLog: (error: unknown) => error,
}));

import { GET } from '@/app/api/assignments/route';

describe('GET /api/assignments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiAuthContextMock.mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {},
    });
    resolveExplicitUserOrgContextMock.mockResolvedValue('org-1');
    emitAnalyticsEventMock.mockResolvedValue(undefined);
  });

  it('derives low-match warnings from the matching summary query without a second match count query', async () => {
    const oldActiveAssignment = {
      id: 'assignment-old-active',
      orgId: 'org-1',
      status: 'active',
      createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000),
    };
    const freshDraftAssignment = {
      id: 'assignment-fresh-draft',
      orgId: 'org-1',
      status: 'draft',
      createdAt: new Date(),
    };

    const assignmentQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      $dynamic: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockResolvedValue([oldActiveAssignment, freshDraftAssignment]),
    };
    const summaryQuery = {
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockResolvedValue([
        {
          assignmentId: oldActiveAssignment.id,
          candidateCount: 3,
          reviewChangeCount: 1,
          lastCandidateAt: new Date('2026-05-18T10:00:00.000Z'),
          lastReviewChangeAt: new Date('2026-05-18T11:00:00.000Z'),
        },
      ]),
    };

    dbSelectMock.mockReturnValueOnce(assignmentQuery).mockReturnValueOnce(summaryQuery);

    const response = await GET(
      new NextRequest('http://localhost/api/assignments?orgSlug=proofound&limit=20')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(dbSelectMock).toHaveBeenCalledTimes(2);
    expect(body.items).toHaveLength(2);
    expect(body.items[0].matchingSummary.candidateCount).toBe(3);
    expect(body.items[0].ttfqiWarning).toMatchObject({
      code: 'ttfqi_warning',
      matchesCount: 3,
    });
    expect(body.items[1].ttfqiWarning).toBeNull();
    expect(emitAnalyticsEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'ttfqi_warning_emitted',
        entityId: oldActiveAssignment.id,
      })
    );
  });
});
