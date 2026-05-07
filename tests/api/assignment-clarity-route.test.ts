import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/ai/assignments/clarify/route';
import { db } from '@/db';
import { generateJson } from '@/lib/ai/provider';
import { AiProviderError } from '@/lib/ai/provider/types';
import { verifyExplicitAssignmentMutationAccess } from '@/lib/assignments/access';
import { requireApiAuthContext, requireAuth } from '@/lib/auth';

const assignmentId = '11111111-1111-4111-8111-111111111111';
const orgId = '22222222-2222-4222-8222-222222222222';
const userId = '33333333-3333-4333-8333-333333333333';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/assignments/access', () => ({
  verifyExplicitAssignmentMutationAccess: vi.fn(),
}));

vi.mock('@/lib/ai/provider', () => ({
  generateJson: vi.fn(),
}));

vi.mock('@/lib/ai/usage-ledger', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/ai/usage-ledger')>('@/lib/ai/usage-ledger');
  return {
    ...actual,
    findAiSuggestionReplay: vi.fn().mockResolvedValue(null),
    recordAiSuggestionEvent: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('@/db', () => ({
  db: {
    query: {
      assignments: { findFirst: vi.fn() },
      assignmentOutcomes: { findMany: vi.fn() },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    })),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

function request(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/ai/assignments/clarify', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function baseBody(overrides: Record<string, unknown> = {}) {
  return {
    assignmentId,
    orgId,
    title: 'Launch operator',
    outcomeSummary: 'Make an impact.',
    proofExpectations: '',
    engagementType: 'contract_consulting',
    constraints: { locationMode: 'remote', compMin: 100000, compMax: 120000, currency: 'USD' },
    mustHaveSkills: [],
    verificationRequirements: [],
    ...overrides,
  };
}

describe('assignment clarity assistant route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (requireApiAuthContext as any).mockImplementation(async () => {
      const user = await (requireAuth as any)();
      return user ? { user, supabase: {} } : null;
    });
    (requireAuth as any).mockResolvedValue({ id: userId });
    (verifyExplicitAssignmentMutationAccess as any).mockResolvedValue({
      status: 'ok',
      orgId,
      role: 'org_manager',
      membershipId: 'membership-1',
    });
    (db.query.assignments.findFirst as any).mockResolvedValue({
      id: assignmentId,
      orgId,
      role: 'Launch operator',
      businessValue: 'Help launch the pilot corridor.',
      description: 'Make an impact.',
      expectedImpact: '',
      engagementType: 'contract_consulting',
      status: 'draft',
      mustHaveSkills: [],
      verificationGates: [],
      locationMode: 'remote',
      city: null,
      country: null,
      compMin: 100000,
      compMax: 120000,
      currency: 'USD',
      hoursMin: null,
      hoursMax: null,
      startEarliest: null,
      startLatest: null,
    });
    (db.query.assignmentOutcomes.findMany as any).mockResolvedValue([]);
    (generateJson as any).mockRejectedValue(
      new AiProviderError('AI assistants are disabled.', 'assistants_disabled', 503, false)
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns 403 for org reviewers', async () => {
    (verifyExplicitAssignmentMutationAccess as any).mockResolvedValue({
      status: 'insufficient_role',
      role: 'org_reviewer',
      orgId,
    });

    const res = await POST(request(baseBody()));
    const payload = await res.json();

    expect(res.status).toBe(403);
    expect(payload.error).toBe('Forbidden');
    expect(generateJson).not.toHaveBeenCalled();
  });

  it('honors the feature-level assignment clarity kill switch before model calls', async () => {
    vi.stubEnv('AI_KILL_SWITCH_ASSIGNMENT_CLARITY', 'true');

    const res = await POST(request(baseBody()));
    const payload = await res.json();

    expect(res.status).toBe(503);
    expect(payload.code).toBe('ai_feature_kill_switch');
    expect(generateJson).not.toHaveBeenCalled();
  });

  it('returns 403 for non-members', async () => {
    (verifyExplicitAssignmentMutationAccess as any).mockResolvedValue({
      status: 'membership_not_found',
    });

    const res = await POST(request(baseBody()));

    expect(res.status).toBe(403);
    expect(generateJson).not.toHaveBeenCalled();
  });

  it('rejects full file payload fields before assignment access or model calls', async () => {
    const res = await POST(request(baseBody({ fullFilePayload: 'raw job attachment bytes' })));

    expect(res.status).toBe(400);
    expect(verifyExplicitAssignmentMutationAccess).not.toHaveBeenCalled();
    expect(generateJson).not.toHaveBeenCalled();
  });

  it('rejects signed URLs and tokenized links before assignment access or model calls', async () => {
    const res = await POST(
      request(
        baseBody({
          outcomeSummary:
            'Review the private attachment https://storage.googleapis.com/cv.pdf?X-Goog-Signature=abc',
        })
      )
    );

    expect(res.status).toBe(400);
    expect(verifyExplicitAssignmentMutationAccess).not.toHaveBeenCalled();
    expect(generateJson).not.toHaveBeenCalled();
  });

  it('flags vague outcomes and missing proof expectations with deterministic fallback', async () => {
    const res = await POST(request(baseBody()));
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.fallback).toBe(true);
    expect(payload.promptVersion).toBe('ai-assignment-clarity-v1');
    expect(payload.ambiguityFlags).toEqual(
      expect.arrayContaining([
        'Outcome summary is vague or missing concrete deliverables.',
        'Proof expectations are missing or too generic.',
      ])
    );
  });

  it('treats an explicitly blank proof expectation as missing instead of falling back to stored text', async () => {
    (db.query.assignments.findFirst as any).mockResolvedValueOnce({
      id: assignmentId,
      orgId,
      role: 'Launch operator',
      businessValue: 'Help launch the pilot corridor.',
      description: 'Publish a launch assignment with concrete milestones.',
      expectedImpact: 'Stored proof expectations that should not override the blank request.',
      engagementType: 'contract_consulting',
      status: 'draft',
      mustHaveSkills: [],
      verificationGates: [],
      locationMode: 'remote',
      city: null,
      country: null,
      compMin: 100000,
      compMax: 120000,
      currency: 'USD',
      hoursMin: null,
      hoursMax: null,
      startEarliest: null,
      startLatest: null,
    });

    const res = await POST(request(baseBody({ proofExpectations: '' })));
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.fallback).toBe(true);
    expect(payload.ambiguityFlags).toEqual(
      expect.arrayContaining(['Proof expectations are missing or too generic.'])
    );
  });

  it('removes candidate scoring language from model output', async () => {
    (generateJson as any).mockResolvedValue({
      data: {
        ambiguityFlags: ['Do not use candidate ranking.'],
        suggestedRewrite: {
          outcomeSummary: 'Rank the top candidate with a fit score.',
          proofExpectations: 'Evidence of shipped work and ownership tradeoffs.',
        },
        reviewQuestions: ['Which candidate should be shortlisted?'],
        excludedOrRiskyCriteria: [],
      },
    });

    const res = await POST(
      request(baseBody({ outcomeSummary: 'Launch the pilot corridor in 90 days.' }))
    );
    const payload = await res.json();
    const responseJsonSchema = (generateJson as any).mock.calls[0]?.[0]?.responseJsonSchema as any;
    const serialized = JSON.stringify(payload).toLowerCase();

    expect(res.status).toBe(200);
    expect(responseJsonSchema?.required).toEqual([
      'ambiguityFlags',
      'suggestedRewrite',
      'reviewQuestions',
      'excludedOrRiskyCriteria',
    ]);
    expect(
      responseJsonSchema?.properties?.suggestedRewrite?.properties?.verificationRequirements
        ?.maxItems
    ).toBe(10);
    expect(payload.suggestedRewrite.outcomeSummary).toBeNull();
    expect(serialized).not.toContain('fit score');
    expect(serialized).not.toContain('shortlisted');
    expect(payload.excludedOrRiskyCriteria).toEqual(
      expect.arrayContaining(['Removed prohibited review criteria from a suggested field.'])
    );
  });

  it('redacts protected-trait terms before assignment context reaches the model', async () => {
    (generateJson as any).mockResolvedValue({
      data: {
        ambiguityFlags: [],
        suggestedRewrite: {
          outcomeSummary: 'Coordinate launch milestones.',
          proofExpectations: 'Show shipped work and ownership tradeoffs.',
        },
        reviewQuestions: [],
        excludedOrRiskyCriteria: [],
      },
    });

    const res = await POST(
      request(
        baseBody({
          outcomeSummary: 'Need a native speaker with visa status for the launch corridor.',
          proofExpectations: 'Show previous ownership without disability accommodations.',
        })
      )
    );
    const payload = await res.json();
    const prompt = (generateJson as any).mock.calls[0]?.[0]?.prompt as string;

    expect(res.status).toBe(200);
    expect(prompt).toContain('[redacted protected trait]');
    expect(prompt).not.toContain('native speaker');
    expect(prompt).not.toContain('visa status');
    expect(prompt).not.toContain('disability');
    expect(payload.excludedOrRiskyCriteria).toEqual(
      expect.arrayContaining([
        'Removed protected or discriminatory criteria from the assistant scope.',
      ])
    );
  });

  it('does not publish or update the assignment', async () => {
    const res = await POST(request(baseBody()));

    expect(res.status).toBe(200);
    expect(db.update).not.toHaveBeenCalled();
    expect(db.query.assignments.findFirst).toHaveBeenCalled();
  });
});
