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
import { upsertCanonicalProofCardSubmission } from '@/lib/canonical/submissions';

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
      body: JSON.stringify({
        proofPackId: '22222222-2222-4222-8222-222222222222',
        reviewConfirmed: true,
      }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request, { params: Promise.resolve({ token: 'token-value' }) });
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.code).toBe('INVITE_PROOF_SUBMISSION_BLOCKED');
    expect(payload.details.reasons).toContain('org_trust_restricted');
  });

  it('requires explicit final visibility review confirmation', async () => {
    const request = new NextRequest('http://localhost/api/candidate-invites/token/proof-card', {
      method: 'POST',
      body: JSON.stringify({ proofPackId: '22222222-2222-4222-8222-222222222222' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request, { params: Promise.resolve({ token: 'token-value' }) });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.details.fieldErrors.reviewConfirmed).toContain(
      'Confirm the final visibility review before submitting.'
    );
    expect(db.select).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed JSON before invite lookup or submission writes', async () => {
    const request = new NextRequest('http://localhost/api/candidate-invites/token/proof-card', {
      method: 'POST',
      body: '{"proofPackId":',
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request, { params: Promise.resolve({ token: 'token-value' }) });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: 'Invalid JSON body' });
    expect(db.select).not.toHaveBeenCalled();
    expect(upsertCanonicalProofCardSubmission).not.toHaveBeenCalled();
  });

  it('submits an owner-only Proof Pack without requiring a legacy public snippet', async () => {
    mockSelectWithLimit([
      {
        id: 'invite-1',
        orgId: 'org-1',
        flowType: 'proof_card',
        status: 'claimed',
        expiresAt: new Date(Date.now() + 60_000),
        claimedByProfileId: '11111111-1111-1111-1111-111111111111',
        assignmentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        matchId: null,
        conversationId: null,
      },
    ]);
    mockSelectWithLimit([
      {
        id: '22222222-2222-4222-8222-222222222222',
        visibility: 'owner_only',
        revealGate: 'none',
        publishedAt: null,
      },
    ]);
    (resolveCandidateInvitePolicyContext as any).mockResolvedValueOnce({
      organization: { id: 'org-1', orgTrustTier: 'reviewed', trustStatus: 'platform_reviewed' },
      assignment: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
      policyEvaluation: {
        decision: 'allow',
        orgTrustTier: 'reviewed',
        reasons: [],
      },
    });
    (db.execute as any).mockResolvedValue({ rows: [] });
    (upsertCanonicalProofCardSubmission as any).mockResolvedValue({
      id: 'submission-1',
    });

    const request = new NextRequest('http://localhost/api/candidate-invites/token/proof-card', {
      method: 'POST',
      body: JSON.stringify({
        proofPackId: '22222222-2222-4222-8222-222222222222',
        reviewConfirmed: true,
      }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request, { params: Promise.resolve({ token: 'token-value' }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual(
      expect.objectContaining({
        success: true,
        canonicalPackId: '22222222-2222-4222-8222-222222222222',
        canonicalSubmissionId: 'submission-1',
      })
    );
    expect(db.query.proofPacks.findFirst).not.toHaveBeenCalled();
    expect(upsertCanonicalProofCardSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        inviteId: 'invite-1',
        assignmentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        proofPackId: '22222222-2222-4222-8222-222222222222',
        proofSnippetId: null,
      })
    );
  });
});
