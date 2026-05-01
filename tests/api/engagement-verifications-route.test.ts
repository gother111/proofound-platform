import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireApiAuth: vi.fn(),
  isActiveOrgMember: vi.fn(),
  findEngagementVerification: vi.fn(),
  confirmEngagementVerification: vi.fn(),
  withWorkflowMutationIdempotency: vi.fn(),
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: mocks.requireApiAuth,
  isActiveOrgMember: mocks.isActiveOrgMember,
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      engagementVerifications: {
        findFirst: mocks.findEngagementVerification,
      },
    },
  },
}));

vi.mock('@/lib/engagement-verifications/service', () => ({
  confirmEngagementVerification: mocks.confirmEngagementVerification,
  normalizeEngagementType: (value: string | null | undefined) => {
    if (!value) {
      return null;
    }

    const normalized = value.trim().toLowerCase();
    if (
      ['full_time', 'part_time', 'contract_consulting', 'fractional_project'].includes(normalized)
    ) {
      return normalized;
    }

    if (normalized === 'contract') {
      return 'contract_consulting';
    }

    if (normalized === 'fractional' || normalized === 'project_based') {
      return 'fractional_project';
    }

    return null;
  },
}));

vi.mock('@/lib/api/workflow-idempotency', () => ({
  withWorkflowMutationIdempotency: mocks.withWorkflowMutationIdempotency,
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: mocks.logInfo,
    error: mocks.logError,
  },
}));

import { PATCH } from '@/app/api/engagement-verifications/[id]/route';

describe('PATCH /api/engagement-verifications/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiAuth.mockResolvedValue({
      user: { id: 'candidate-1' },
      supabase: { id: 'supabase' },
    });
    mocks.findEngagementVerification.mockResolvedValue({
      id: 'engagement-1',
      decisionId: 'decision-1',
      candidateProfileId: 'candidate-1',
      orgId: 'org-1',
    });
    mocks.confirmEngagementVerification.mockResolvedValue({
      id: 'engagement-1',
      status: 'pending_organization_confirmation',
      statusLabel: 'Awaiting organization confirmation',
      engagementType: 'contract_consulting',
      createdAt: '2026-03-12T09:55:00.000Z',
      candidateConfirmedAt: '2026-03-12T10:00:00.000Z',
      organizationConfirmedAt: null,
      uploadedEvidencePresent: false,
      proofHookStatus: 'not_ready',
      verifiedAt: null,
      workflow: {
        state: 'pending_organization_confirmation',
        displayState: 'Awaiting organization confirmation',
        allowedActions: ['verified'],
      },
    });
    mocks.withWorkflowMutationIdempotency.mockImplementation(
      async (
        _request: unknown,
        _scope: unknown,
        _payload: unknown,
        handler: () => Promise<Response>
      ) => handler()
    );
  });

  it('allows the matched candidate to confirm engagement', async () => {
    const response = await PATCH(
      new NextRequest('https://example.com/api/engagement-verifications/engagement-1', {
        method: 'PATCH',
        body: JSON.stringify({
          confirm: true,
          engagementType: 'contract',
        }),
      }),
      {
        params: Promise.resolve({ id: 'engagement-1' }),
      }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.confirmEngagementVerification).toHaveBeenCalledWith(
      expect.objectContaining({
        engagementVerificationId: 'engagement-1',
        actorType: 'candidate',
        actorId: 'candidate-1',
        engagementType: 'contract',
      })
    );
  });

  it('rejects unrelated users who are neither the candidate nor an authorized org member', async () => {
    mocks.requireApiAuth.mockResolvedValue({
      user: { id: 'outsider-1' },
      supabase: { id: 'supabase' },
    });
    mocks.isActiveOrgMember.mockResolvedValue(false);

    const response = await PATCH(
      new NextRequest('https://example.com/api/engagement-verifications/engagement-1', {
        method: 'PATCH',
        body: JSON.stringify({
          confirm: true,
          engagementType: 'full_time',
        }),
      }),
      {
        params: Promise.resolve({ id: 'engagement-1' }),
      }
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toMatch(/unauthorized/i);
    expect(mocks.confirmEngagementVerification).not.toHaveBeenCalled();
  });

  it('rejects unsupported engagement types before updating the workflow', async () => {
    const response = await PATCH(
      new NextRequest('https://example.com/api/engagement-verifications/engagement-1', {
        method: 'PATCH',
        body: JSON.stringify({
          confirm: true,
          engagementType: 'volunteer',
        }),
      }),
      {
        params: Promise.resolve({ id: 'engagement-1' }),
      }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Unsupported engagement type');
    expect(mocks.findEngagementVerification).not.toHaveBeenCalled();
    expect(mocks.confirmEngagementVerification).not.toHaveBeenCalled();
  });

  it('replays duplicate engagement confirmations without recording another transition', async () => {
    mocks.withWorkflowMutationIdempotency.mockResolvedValue(
      Response.json(
        {
          success: true,
          engagementVerification: {
            id: 'engagement-1',
            status: 'pending_organization_confirmation',
          },
        },
        {
          headers: {
            'Idempotency-Replayed': 'true',
          },
        }
      )
    );

    const response = await PATCH(
      new NextRequest('https://example.com/api/engagement-verifications/engagement-1', {
        method: 'PATCH',
        headers: { 'Idempotency-Key': 'wf-engagement-duplicate-1' },
        body: JSON.stringify({
          confirm: true,
          engagementType: 'contract',
        }),
      }),
      {
        params: Promise.resolve({ id: 'engagement-1' }),
      }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Idempotency-Replayed')).toBe('true');
    expect(body.engagementVerification.id).toBe('engagement-1');
    expect(mocks.confirmEngagementVerification).not.toHaveBeenCalled();
  });
});
