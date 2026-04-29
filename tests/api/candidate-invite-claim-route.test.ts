import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
  },
}));

vi.mock('@/lib/analytics/events', () => ({
  emitAnalyticsEventAsync: vi.fn(),
}));

vi.mock('@/lib/security/capability-tokens', () => ({
  CAPABILITY_TOKEN_CLASSES: {
    CANDIDATE_INVITE_CLAIM: 'candidate_invite_claim',
  },
  getCapabilityRedeemSessionCookieName: vi.fn(() => 'pf_rsn_candidate_invite_claim'),
  redeemCapabilityToken: vi.fn(),
}));

vi.mock('@/lib/candidate-invite-policy', () => ({
  buildCandidateInvitePolicyError: vi.fn((decision: 'hold' | 'blocked') =>
    decision === 'blocked'
      ? 'This invite is unavailable because the organization or assignment is currently restricted.'
      : 'This invite is temporarily on hold pending policy review.'
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
import { POST } from '@/app/api/candidate-invites/[token]/claim/route';
import { redeemCapabilityToken } from '@/lib/security/capability-tokens';
import { resolveCandidateInvitePolicyContext } from '@/lib/candidate-invite-policy';

function mockAuthUser(user: { id: string; email: string } | null) {
  (createClient as any).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user,
        },
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

describe('POST /api/candidate-invites/[token]/claim', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (redeemCapabilityToken as any).mockResolvedValue({
      ok: true,
      token: { id: 'cap-token-1' },
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

  it('returns 401 for unauthenticated user', async () => {
    mockAuthUser(null);

    const request = new NextRequest('http://localhost/api/candidate-invites/token/claim', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ token: 'token-value' }) });
    expect(response.status).toBe(401);
  });

  it('returns 403 when user email does not match invite email', async () => {
    mockAuthUser({
      id: '11111111-1111-1111-1111-111111111111',
      email: 'different@example.com',
    });

    mockSelectWithLimit([
      {
        id: 'invite-1',
        orgId: 'org-1',
        inviteeEmailNormalized: 'candidate@example.com',
        status: 'pending',
        expiresAt: new Date(Date.now() + 60_000),
        claimedByProfileId: null,
      },
    ]);

    const request = new NextRequest('http://localhost/api/candidate-invites/token/claim', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ token: 'token-value' }) });
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Invite not found' });
  });

  it('claims invite when email matches and persona is individual', async () => {
    mockAuthUser({
      id: '11111111-1111-1111-1111-111111111111',
      email: 'candidate@example.com',
    });

    mockSelectWithLimit([
      {
        id: 'invite-1',
        orgId: 'org-1',
        inviteeEmailNormalized: 'candidate@example.com',
        status: 'pending',
        expiresAt: new Date(Date.now() + 60_000),
        claimedByProfileId: null,
      },
    ]);
    mockSelectWithLimit([
      {
        id: '11111111-1111-1111-1111-111111111111',
        persona: 'individual',
      },
    ]);

    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
    (db.update as any).mockReturnValue({ set: updateSet });

    const request = new NextRequest('http://localhost/api/candidate-invites/token/claim', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ token: 'token-value' }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.status).toBe('claimed');
    expect(updateSet).toHaveBeenCalledTimes(1);
    expect(redeemCapabilityToken).toHaveBeenCalledWith(
      'token-value',
      expect.objectContaining({
        requireRedeemSessionNonce: true,
        redeemSessionNonce: null,
      })
    );
  });

  it('creates test match and conversation for test_match invite acceptance', async () => {
    mockAuthUser({
      id: '11111111-1111-1111-1111-111111111111',
      email: 'candidate@example.com',
    });

    mockSelectWithLimit([
      {
        id: 'invite-1',
        orgId: 'org-1',
        assignmentId: 'assignment-1',
        flowType: 'test_match',
        inviteeEmailNormalized: 'candidate@example.com',
        status: 'pending',
        expiresAt: new Date(Date.now() + 60_000),
        invitedBy: 'org-rep-1',
        claimedByProfileId: null,
        claimedAt: null,
        acceptedAt: null,
        matchId: null,
        conversationId: null,
      },
    ]);
    mockSelectWithLimit([
      {
        id: '11111111-1111-1111-1111-111111111111',
        persona: 'individual',
      },
    ]);
    (resolveCandidateInvitePolicyContext as any).mockResolvedValueOnce({
      organization: { id: 'org-1', orgTrustTier: 'reviewed', trustStatus: 'platform_reviewed' },
      assignment: { id: 'assignment-1' },
      policyEvaluation: {
        decision: 'allow',
        orgTrustTier: 'reviewed',
        reasons: [],
      },
    });

    const txSelect = vi
      .fn()
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi
              .fn()
              .mockResolvedValue([{ userId: 'org-rep-1', role: 'org_owner', state: 'active' }]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

    const matchReturning = vi.fn().mockResolvedValue([{ id: 'match-1' }]);
    const matchOnConflict = vi.fn().mockReturnValue({ returning: matchReturning });
    const matchValues = vi.fn().mockReturnValue({ onConflictDoUpdate: matchOnConflict });

    const conversationReturning = vi.fn().mockResolvedValue([{ id: 'conversation-1' }]);
    const conversationValues = vi.fn().mockReturnValue({ returning: conversationReturning });

    const txInsert = vi
      .fn()
      .mockReturnValueOnce({ values: matchValues })
      .mockReturnValueOnce({ values: conversationValues });

    const txUpdateWhere = vi.fn().mockResolvedValue(undefined);
    const txUpdateSet = vi.fn().mockReturnValue({ where: txUpdateWhere });
    const txUpdate = vi.fn().mockReturnValue({ set: txUpdateSet });

    (db.transaction as any).mockImplementation(async (callback: any) =>
      callback({
        select: txSelect,
        insert: txInsert,
        update: txUpdate,
      })
    );

    const request = new NextRequest('http://localhost/api/candidate-invites/token/claim', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ token: 'token-value' }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.matchId).toBe('match-1');
    expect(payload.conversationId).toBe('conversation-1');
    expect(matchOnConflict).toHaveBeenCalled();
    expect(txUpdateSet).toHaveBeenCalled();
  });

  it('fails closed when capability redemption rejects the invite recipient', async () => {
    mockAuthUser({
      id: '11111111-1111-1111-1111-111111111111',
      email: 'different@example.com',
    });
    (redeemCapabilityToken as any).mockResolvedValueOnce({
      ok: false,
      reason: 'actor_mismatch',
    });

    const request = new NextRequest('http://localhost/api/candidate-invites/token/claim', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ token: 'token-value' }) });
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Invite not found' });
  });

  it('returns replay failure on second redemption attempt', async () => {
    mockAuthUser({
      id: '11111111-1111-1111-1111-111111111111',
      email: 'candidate@example.com',
    });
    (redeemCapabilityToken as any).mockResolvedValueOnce({
      ok: false,
      reason: 'replayed',
    });

    const request = new NextRequest('http://localhost/api/candidate-invites/token/claim', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ token: 'token-value' }) });
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Invite not found' });
  });

  it.each(['invalid', 'expired', 'revoked', 'replayed', 'actor_mismatch'])(
    'uses one generic response when token redemption fails with %s',
    async (reason) => {
      mockAuthUser({
        id: '11111111-1111-1111-1111-111111111111',
        email: 'candidate@example.com',
      });
      (redeemCapabilityToken as any).mockResolvedValueOnce({
        ok: false,
        reason,
      });

      const request = new NextRequest('http://localhost/api/candidate-invites/token/claim', {
        method: 'POST',
      });

      const response = await POST(request, { params: Promise.resolve({ token: 'token-value' }) });
      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({ error: 'Invite not found' });
    }
  );

  it('blocks invite claim when policy evaluation blocks the invite', async () => {
    mockAuthUser({
      id: '11111111-1111-1111-1111-111111111111',
      email: 'candidate@example.com',
    });

    mockSelectWithLimit([
      {
        id: 'invite-1',
        orgId: 'org-1',
        assignmentId: 'assignment-1',
        flowType: 'test_match',
        inviteeEmailNormalized: 'candidate@example.com',
        status: 'pending',
        expiresAt: new Date(Date.now() + 60_000),
        claimedByProfileId: null,
        claimedAt: null,
        acceptedAt: null,
        matchId: null,
        conversationId: null,
      },
    ]);
    mockSelectWithLimit([
      {
        id: '11111111-1111-1111-1111-111111111111',
        persona: 'individual',
      },
    ]);
    (resolveCandidateInvitePolicyContext as any).mockResolvedValueOnce({
      organization: { id: 'org-1', orgTrustTier: 'restricted', trustStatus: 'platform_reviewed' },
      assignment: { id: 'assignment-1' },
      policyEvaluation: {
        decision: 'blocked',
        orgTrustTier: 'restricted',
        reasons: [{ code: 'org_trust_restricted' }],
      },
    });

    const request = new NextRequest('http://localhost/api/candidate-invites/token/claim', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ token: 'token-value' }) });
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.code).toBe('INVITE_CLAIM_BLOCKED');
    expect(payload.details.reasons).toContain('org_trust_restricted');
  });
});
