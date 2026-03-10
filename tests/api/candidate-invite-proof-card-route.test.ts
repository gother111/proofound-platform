import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    execute: vi.fn(),
    query: {
      proofPacks: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock('@/lib/security/capability-tokens', () => ({
  CAPABILITY_TOKEN_CLASSES: {
    CANDIDATE_INVITE_CLAIM: 'candidate_invite_claim',
    PROFILE_SNIPPET_SHARE: 'profile_snippet_share',
  },
  inspectCapabilityToken: vi.fn().mockResolvedValue({
    ok: true,
    token: { id: 'cap-token-1' },
  }),
  redeemCapabilityToken: vi.fn(),
}));

vi.mock('@/lib/canonical/submissions', () => ({
  upsertCanonicalProofCardSubmission: vi.fn(),
}));

vi.mock('@/lib/analytics/events', () => ({
  emitAnalyticsEventAsync: vi.fn(),
}));

vi.mock('@/lib/candidate-invite-policy', () => ({
  buildCandidateInvitePolicyError: vi.fn((decision: 'hold' | 'blocked') =>
    decision === 'blocked'
      ? 'This invite is unavailable because the organization is currently restricted.'
      : 'This invite is temporarily unavailable pending policy review.'
  ),
  resolveCandidateInvitePolicyContext: vi.fn().mockResolvedValue({
    organization: { id: 'org-1', orgTrustTier: 'reviewed', trustStatus: 'platform_reviewed' },
    assignment: null,
    policyEvaluation: {
      decision: 'allow',
      orgTrustTier: 'reviewed',
      reasons: [],
    },
  }),
}));

import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { POST } from '@/app/api/candidate-invites/[token]/proof-card/route';
import { resolveCandidateInvitePolicyContext } from '@/lib/candidate-invite-policy';

function mockAuthUser(user: { id: string; email: string } | null) {
  (createClient as any).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
      }),
    },
  });
}

function mockSelectWithLimit(result: any[]) {
  const limit = vi.fn().mockResolvedValue(result);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  (db.select as any).mockReturnValueOnce({ from });
}

describe('POST /api/candidate-invites/[token]/proof-card', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthUser({
      id: '11111111-1111-1111-1111-111111111111',
      email: 'candidate@example.com',
    });
    (resolveCandidateInvitePolicyContext as any).mockResolvedValue({
      organization: { id: 'org-1', orgTrustTier: 'reviewed', trustStatus: 'platform_reviewed' },
      assignment: null,
      policyEvaluation: {
        decision: 'allow',
        orgTrustTier: 'reviewed',
        reasons: [],
      },
    });
  });

  it('blocks proof-card submission when policy evaluation blocks the invite', async () => {
    mockSelectWithLimit([
      {
        id: 'invite-1',
        orgId: 'org-1',
        flowType: 'proof_card',
        status: 'claimed',
        expiresAt: new Date(Date.now() + 60_000),
        claimedByProfileId: '11111111-1111-1111-1111-111111111111',
        assignmentId: null,
        matchId: null,
        conversationId: null,
      },
    ]);
    (resolveCandidateInvitePolicyContext as any).mockResolvedValueOnce({
      organization: { id: 'org-1', orgTrustTier: 'restricted', trustStatus: 'platform_reviewed' },
      assignment: null,
      policyEvaluation: {
        decision: 'blocked',
        orgTrustTier: 'restricted',
        reasons: [{ code: 'org_trust_restricted' }],
      },
    });

    const request = new NextRequest('http://localhost/api/candidate-invites/token/proof-card', {
      method: 'POST',
      body: JSON.stringify({ shareToken: 'snippet-token' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request, { params: Promise.resolve({ token: 'token-value' }) });
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.code).toBe('INVITE_PROOF_SUBMISSION_BLOCKED');
    expect(payload.details.reasons).toContain('org_trust_restricted');
  });
});
