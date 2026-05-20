import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/security/capability-tokens', () => ({
  beginCapabilityTokenRedeemSession: vi.fn(),
  CAPABILITY_REDEEM_SESSION_MAX_AGE_SECONDS: 600,
  CAPABILITY_TOKEN_CLASSES: {
    CANDIDATE_INVITE_CLAIM: 'candidate_invite_claim',
  },
  getCapabilityRedeemSessionCookieName: vi.fn(() => 'pf_rsn_candidate_invite_claim'),
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
    organization: { id: 'org-1', slug: 'acme', displayName: 'Acme Org', logoUrl: null },
    assignment: null,
    policyEvaluation: {
      decision: 'allow',
      orgTrustTier: 'reviewed',
      reasons: [],
    },
  }),
}));

import { db } from '@/db';
import { GET } from '@/app/api/candidate-invites/[token]/route';
import { createClient } from '@/lib/supabase/server';
import { beginCapabilityTokenRedeemSession } from '@/lib/security/capability-tokens';

function mockAuthUser(user: { id: string; email: string } | null) {
  (createClient as any).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
      }),
    },
  });
}

function mockInviteSelect(result: any[]) {
  const limit = vi.fn().mockResolvedValue(result);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  (db.select as any).mockReturnValueOnce({ from });
}

function mockInviteUpdate() {
  const where = vi.fn().mockResolvedValue(undefined);
  const set = vi.fn().mockReturnValue({ where });
  (db.update as any).mockReturnValueOnce({ set });
  return { set, where };
}

describe('GET /api/candidate-invites/[token]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (beginCapabilityTokenRedeemSession as any).mockResolvedValue({
      ok: true,
      token: { id: 'cap-token-1' },
      redeemSessionNonce: 'redeem-nonce-1',
      maxAgeSeconds: 600,
    });
  });

  it('does not expose raw workflow identifiers to unauthenticated preview requests', async () => {
    mockAuthUser(null);
    mockInviteSelect([
      {
        id: 'invite-1',
        orgId: 'org-1',
        inviteeEmail: 'candidate@example.com',
        status: 'claimed',
        flowType: 'test_match',
        assignmentId: 'assignment-1',
        expiresAt: new Date(Date.now() + 60_000),
        claimedByProfileId: '11111111-1111-1111-1111-111111111111',
        claimedAt: new Date(),
        acceptedByProfileId: '11111111-1111-1111-1111-111111111111',
        acceptedAt: new Date(),
        matchId: '22222222-2222-4222-8222-222222222222',
        conversationId: '33333333-3333-4333-8333-333333333333',
        proofSubmittedAt: null,
      },
    ]);

    const response = await GET(new NextRequest('http://localhost/api/candidate-invites/token'), {
      params: Promise.resolve({ token: 'token-value' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.invite.claimedByCurrentUser).toBe(false);
    expect(payload.invite.acceptedByCurrentUser).toBe(false);
    expect(payload.invite.communicationsUrl).toBeNull();
    expect(payload.invite).not.toHaveProperty('claimedByProfileId');
    expect(payload.invite).not.toHaveProperty('acceptedByProfileId');
    expect(payload.invite).not.toHaveProperty('matchId');
    expect(payload.invite).not.toHaveProperty('conversationId');
  });

  it('returns a derived communications URL to the claimant without exposing raw workflow identifiers', async () => {
    mockAuthUser({ id: '11111111-1111-1111-1111-111111111111', email: 'candidate@example.com' });
    mockInviteSelect([
      {
        id: 'invite-1',
        orgId: 'org-1',
        inviteeEmail: 'candidate@example.com',
        status: 'claimed',
        flowType: 'test_match',
        assignmentId: 'assignment-1',
        expiresAt: new Date(Date.now() + 60_000),
        claimedByProfileId: '11111111-1111-1111-1111-111111111111',
        claimedAt: new Date(),
        acceptedByProfileId: null,
        acceptedAt: null,
        matchId: '22222222-2222-4222-8222-222222222222',
        conversationId: '33333333-3333-4333-8333-333333333333',
        proofSubmittedAt: null,
      },
    ]);

    const response = await GET(new NextRequest('http://localhost/api/candidate-invites/token'), {
      params: Promise.resolve({ token: 'token-value' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.invite.claimedByCurrentUser).toBe(true);
    expect(payload.invite.acceptedByCurrentUser).toBe(false);
    expect(payload.invite.communicationsUrl).toBe(
      '/app/i/communications?section=messages&conversation=33333333-3333-4333-8333-333333333333'
    );
    expect(payload.invite).not.toHaveProperty('claimedByProfileId');
    expect(payload.invite).not.toHaveProperty('acceptedByProfileId');
    expect(payload.invite).not.toHaveProperty('matchId');
    expect(payload.invite).not.toHaveProperty('conversationId');
  });

  it('reuses an existing preview redeem-session nonce instead of rotating blindly', async () => {
    mockAuthUser(null);
    mockInviteSelect([
      {
        id: 'invite-1',
        orgId: 'org-1',
        inviteeEmail: 'candidate@example.com',
        status: 'pending',
        flowType: 'test_match',
        assignmentId: 'assignment-1',
        expiresAt: new Date(Date.now() + 60_000),
        claimedByProfileId: null,
        claimedAt: null,
        acceptedByProfileId: null,
        acceptedAt: null,
        matchId: null,
        conversationId: null,
        proofSubmittedAt: null,
      },
    ]);

    const response = await GET(
      new NextRequest('http://localhost/api/candidate-invites/token', {
        headers: {
          cookie: 'pf_rsn_candidate_invite_claim=existing-nonce',
        },
      }),
      {
        params: Promise.resolve({ token: 'token-value' }),
      }
    );

    expect(response.status).toBe(200);
    expect(beginCapabilityTokenRedeemSession).toHaveBeenCalledWith(
      'token-value',
      expect.objectContaining({
        existingRedeemSessionNonce: 'existing-nonce',
      })
    );
  });

  it('does not overwrite a claimed invite with expired during preview', async () => {
    mockAuthUser({ id: '11111111-1111-1111-1111-111111111111', email: 'candidate@example.com' });
    mockInviteSelect([
      {
        id: 'invite-1',
        orgId: 'org-1',
        inviteeEmail: 'candidate@example.com',
        status: 'claimed',
        flowType: 'proof_card',
        assignmentId: 'assignment-1',
        expiresAt: new Date(Date.now() - 60_000),
        claimedByProfileId: '11111111-1111-1111-1111-111111111111',
        claimedAt: new Date(),
        acceptedByProfileId: null,
        acceptedAt: null,
        matchId: null,
        conversationId: null,
        proofSubmittedAt: null,
      },
    ]);

    const response = await GET(new NextRequest('http://localhost/api/candidate-invites/token'), {
      params: Promise.resolve({ token: 'token-value' }),
    });

    expect(response.status).toBe(404);
    expect(db.update).not.toHaveBeenCalled();
  });

  it('marks only pending unclaimed preview invites as expired', async () => {
    mockAuthUser(null);
    mockInviteSelect([
      {
        id: 'invite-1',
        orgId: 'org-1',
        inviteeEmail: 'candidate@example.com',
        status: 'pending',
        flowType: 'test_match',
        assignmentId: 'assignment-1',
        expiresAt: new Date(Date.now() - 60_000),
        claimedByProfileId: null,
        claimedAt: null,
        acceptedByProfileId: null,
        acceptedAt: null,
        matchId: null,
        conversationId: null,
        proofSubmittedAt: null,
      },
    ]);
    const update = mockInviteUpdate();

    const response = await GET(new NextRequest('http://localhost/api/candidate-invites/token'), {
      params: Promise.resolve({ token: 'token-value' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload).toEqual({ error: 'Invite not found' });
    expect(update.set).toHaveBeenCalledWith({
      status: 'expired',
      updatedAt: expect.any(Date),
    });
    expect(update.where).toHaveBeenCalledWith(expect.anything());
  });
});
