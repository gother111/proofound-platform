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
    vi.unstubAllEnvs();
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

  it('confirms the individual interview visual fixture without touching the database', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_SUPABASE', 'true');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'true');
    vi.stubEnv('PROOFOUND_INTERVIEWS_VISUAL_STATE', 'filled');
    vi.stubEnv('VERCEL_ENV', 'development');

    const response = await PATCH(
      new NextRequest(
        'https://example.com/api/engagement-verifications/visual-individual-engagement-verification-1',
        {
          method: 'PATCH',
          body: JSON.stringify({
            confirm: true,
            engagementType: 'full_time',
          }),
        }
      ),
      {
        params: Promise.resolve({ id: 'visual-individual-engagement-verification-1' }),
      }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.engagementVerification).toEqual(
      expect.objectContaining({
        id: 'visual-individual-engagement-verification-1',
        decisionId: 'visual-individual-decision-1',
        status: 'pending_organization_confirmation',
        statusLabel: 'Awaiting organization confirmation',
        engagementType: 'full_time',
        organizationConfirmedAt: null,
        uploadedEvidencePresent: false,
        proofHookStatus: 'not_ready',
        verifiedAt: null,
      })
    );
    expect(body.engagementVerification.candidateConfirmedAt).toEqual(expect.any(String));
    expect(body.engagementVerification.workflow).toEqual(
      expect.objectContaining({
        state: 'pending_organization_confirmation',
        displayState: 'Awaiting organization confirmation',
      })
    );
    expect(mocks.findEngagementVerification).not.toHaveBeenCalled();
    expect(mocks.confirmEngagementVerification).not.toHaveBeenCalled();
  });

  it('confirms the organization interview visual fixture without touching the database', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_SUPABASE', 'true');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'true');
    vi.stubEnv('PROOFOUND_INTERVIEWS_VISUAL_STATE', 'filled');
    vi.stubEnv('VERCEL_ENV', 'development');

    const response = await PATCH(
      new NextRequest(
        'https://example.com/api/engagement-verifications/visual-engagement-verification-1',
        {
          method: 'PATCH',
          body: JSON.stringify({
            confirm: true,
            engagementType: 'contract',
          }),
        }
      ),
      {
        params: Promise.resolve({ id: 'visual-engagement-verification-1' }),
      }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.engagementVerification).toEqual(
      expect.objectContaining({
        id: 'visual-engagement-verification-1',
        decisionId: 'visual-decision-1',
        status: 'pending_candidate_confirmation',
        statusLabel: 'Awaiting proof-review participant confirmation',
        engagementType: 'contract_consulting',
        candidateConfirmedAt: null,
        uploadedEvidencePresent: false,
        proofHookStatus: 'not_ready',
        verifiedAt: null,
      })
    );
    expect(body.engagementVerification.organizationConfirmedAt).toEqual(expect.any(String));
    expect(body.engagementVerification.workflow).toEqual(
      expect.objectContaining({
        state: 'pending_candidate_confirmation',
        displayState: 'Awaiting proof-review participant confirmation',
      })
    );
    expect(mocks.findEngagementVerification).not.toHaveBeenCalled();
    expect(mocks.confirmEngagementVerification).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed JSON without treating it as a server error', async () => {
    const response = await PATCH(
      new NextRequest('https://example.com/api/engagement-verifications/engagement-1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: '{',
      }),
      {
        params: Promise.resolve({ id: 'engagement-1' }),
      }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid JSON body' });
    expect(mocks.findEngagementVerification).not.toHaveBeenCalled();
    expect(mocks.confirmEngagementVerification).not.toHaveBeenCalled();
  });

  it('returns 400 for missing JSON bodies without treating them as server errors', async () => {
    const response = await PATCH(
      new NextRequest('https://example.com/api/engagement-verifications/engagement-1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
      }),
      {
        params: Promise.resolve({ id: 'engagement-1' }),
      }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid JSON body' });
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

  it('does not expose raw service error details when confirmation fails unexpectedly', async () => {
    mocks.confirmEngagementVerification.mockRejectedValueOnce(
      new Error('relation "engagement_verifications" does not exist for verifier@example.com')
    );

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

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to update engagement verification' });
    expect(JSON.stringify(body)).not.toContain('engagement_verifications');
    expect(JSON.stringify(body)).not.toContain('verifier@example.com');
    expect(JSON.stringify(mocks.logError.mock.calls)).not.toContain('engagement_verifications');
    expect(JSON.stringify(mocks.logError.mock.calls)).not.toContain('verifier@example.com');
  });
});
