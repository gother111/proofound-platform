import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/email', () => ({
  sendCandidateInviteEmail: vi.fn(),
}));

vi.mock('@/lib/analytics/events', () => ({
  emitAnalyticsEventAsync: vi.fn(),
}));

vi.mock('@/lib/security/capability-tokens', () => ({
  CAPABILITY_BINDINGS: {
    EMAIL_HASH: 'email_hash',
  },
  CAPABILITY_TOKEN_CLASSES: {
    CANDIDATE_INVITE_CLAIM: 'candidate_invite_claim',
  },
  issueCapabilityToken: vi.fn().mockResolvedValue({
    rawToken: 'opaque-token',
    tokenHash: 'hashed-token',
    token: {
      id: 'cap-token-1',
    },
  }),
}));

vi.mock('@/lib/candidate-invite-policy', () => ({
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
import { sendCandidateInviteEmail } from '@/lib/email';
import { POST } from '@/app/api/organizations/[orgId]/candidate-invites/route';
import { PATCH } from '@/app/api/organizations/[orgId]/candidate-invites/[inviteId]/route';
import { resolveCandidateInvitePolicyContext } from '@/lib/candidate-invite-policy';

function mockAuthenticatedUser(
  membership: { role: string; state?: string | null; status?: string | null } | null,
  userId = '11111111-1111-1111-1111-111111111111'
) {
  (createClient as any).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: 'owner@proofound.io',
          },
        },
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: membership,
              error: null,
            }),
          })),
        })),
      })),
    })),
  });
}

function mockSelectWithLimit(result: any[]) {
  const limit = vi.fn().mockResolvedValue(result);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  (db.select as any).mockReturnValueOnce({ from });
}

function mockSelectWithWhere(result: any[]) {
  const where = vi.fn().mockResolvedValue(result);
  const from = vi.fn().mockReturnValue({ where });
  (db.select as any).mockReturnValueOnce({ from });
}

function mockUpdateWithWhere() {
  const where = vi.fn().mockResolvedValue(undefined);
  const set = vi.fn().mockReturnValue({ where });
  (db.update as any).mockReturnValueOnce({ set });
  return { set, where };
}

describe('POST /api/organizations/[orgId]/candidate-invites', () => {
  const orgId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticatedUser({ role: 'org_owner', state: 'active', status: null });
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

  it('returns 403 when user is not a canonical org owner or manager', async () => {
    mockAuthenticatedUser({ role: 'org_reviewer', state: 'active', status: null });

    const request = new NextRequest('http://localhost/api/organizations/org/candidate-invites', {
      method: 'POST',
      body: JSON.stringify({
        emails: ['candidate@example.com'],
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ orgId }) });
    expect(response.status).toBe(403);
  });

  it('returns 400 for malformed JSON request bodies', async () => {
    mockSelectWithLimit([{ id: orgId, displayName: 'Acme', slug: 'acme' }]); // org

    const request = new NextRequest('http://localhost/api/organizations/org/candidate-invites', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: '{',
    });

    const response = await POST(request, { params: Promise.resolve({ orgId }) });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: 'Invalid JSON body' });
    expect(resolveCandidateInvitePolicyContext).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it.each(['inactive', 'suspended', 'unknown_state', null, undefined])(
    'returns 403 when manager membership state is %s',
    async (state) => {
      mockAuthenticatedUser({
        role: 'org_manager',
        state,
        status: state === null ? 'active' : null,
      });

      const request = new NextRequest('http://localhost/api/organizations/org/candidate-invites', {
        method: 'POST',
        body: JSON.stringify({
          emails: ['candidate@example.com'],
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ orgId }) });
      expect(response.status).toBe(403);
      expect(sendCandidateInviteEmail).not.toHaveBeenCalled();
    }
  );

  it('returns 409 when all recipients already have active invites', async () => {
    mockSelectWithLimit([{ id: orgId, displayName: 'Acme', slug: 'acme' }]); // org
    mockSelectWithWhere([{ inviteeEmailNormalized: 'candidate@example.com' }]); // existing invite

    const request = new NextRequest('http://localhost/api/organizations/org/candidate-invites', {
      method: 'POST',
      body: JSON.stringify({
        emails: ['candidate@example.com'],
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ orgId }) });
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error).toMatch(/active invites/i);
  });

  it('creates invite and sends email for canonical org manager', async () => {
    mockAuthenticatedUser({ role: 'org_manager', state: 'active', status: null });
    mockSelectWithLimit([{ id: orgId, displayName: 'Acme', slug: 'acme' }]); // org
    mockSelectWithWhere([]); // no existing invite

    const insertValues = vi.fn().mockResolvedValue(undefined);
    (db.insert as any).mockReturnValue({
      values: insertValues,
    });
    (sendCandidateInviteEmail as any).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/organizations/org/candidate-invites', {
      method: 'POST',
      body: JSON.stringify({
        emails: ['candidate@example.com'],
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ orgId }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.createdCount).toBe(1);
    expect(insertValues).toHaveBeenCalledTimes(1);
    expect(sendCandidateInviteEmail).toHaveBeenCalledTimes(1);
  });

  it('keeps proof-card invites tied to an assignment when provided', async () => {
    const assignmentId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

    mockAuthenticatedUser({ role: 'org_manager', state: 'active', status: null });
    mockSelectWithLimit([{ id: orgId, displayName: 'Acme', slug: 'acme' }]); // org
    mockSelectWithWhere([]); // no existing invite
    (resolveCandidateInvitePolicyContext as any).mockResolvedValueOnce({
      organization: { id: orgId, orgTrustTier: 'reviewed', trustStatus: 'platform_reviewed' },
      assignment: { id: assignmentId },
      policyEvaluation: {
        decision: 'allow',
        orgTrustTier: 'reviewed',
        reasons: [],
      },
    });

    const insertValues = vi.fn().mockResolvedValue(undefined);
    (db.insert as any).mockReturnValue({ values: insertValues });
    (sendCandidateInviteEmail as any).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/organizations/org/candidate-invites', {
      method: 'POST',
      body: JSON.stringify({
        email: 'candidate@example.com',
        flowType: 'proof_card',
        assignmentId,
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ orgId }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.flowType).toBe('proof_card');
    expect(payload.assignmentId).toBe(assignmentId);
    expect(insertValues).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          flowType: 'proof_card',
          assignmentId,
        }),
      ])
    );
  });

  it('rejects test_match invite creation for non-beta users', async () => {
    mockSelectWithLimit([{ id: orgId, displayName: 'Acme', slug: 'acme' }]); // org
    mockSelectWithLimit([{ isBetaTesting: false }]); // inviter profile flags

    const request = new NextRequest('http://localhost/api/organizations/org/candidate-invites', {
      method: 'POST',
      body: JSON.stringify({
        email: 'candidate@example.com',
        flowType: 'test_match',
        assignmentId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ orgId }) });
    expect(response.status).toBe(403);
  });

  it('creates test_match invite when user is beta and assignment belongs to org', async () => {
    const assignmentId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

    mockSelectWithLimit([{ id: orgId, displayName: 'Acme', slug: 'acme' }]); // org
    mockSelectWithLimit([{ isBetaTesting: true }]); // inviter profile flags
    mockSelectWithWhere([]); // existing invite check
    (resolveCandidateInvitePolicyContext as any).mockResolvedValueOnce({
      organization: { id: orgId, orgTrustTier: 'reviewed', trustStatus: 'platform_reviewed' },
      assignment: { id: assignmentId },
      policyEvaluation: {
        decision: 'allow',
        orgTrustTier: 'reviewed',
        reasons: [],
      },
    });

    const insertValues = vi.fn().mockResolvedValue(undefined);
    (db.insert as any).mockReturnValue({ values: insertValues });
    (sendCandidateInviteEmail as any).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/organizations/org/candidate-invites', {
      method: 'POST',
      body: JSON.stringify({
        email: 'candidate@example.com',
        flowType: 'test_match',
        assignmentId,
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ orgId }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.flowType).toBe('test_match');
    expect(payload.assignmentId).toBe(assignmentId);
    expect(insertValues).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          flowType: 'test_match',
          assignmentId,
        }),
      ])
    );
  });

  it('blocks invite creation when assignment policy blocks the workflow', async () => {
    const assignmentId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

    mockSelectWithLimit([{ id: orgId, displayName: 'Acme', slug: 'acme' }]); // org
    mockSelectWithLimit([{ isBetaTesting: true }]); // inviter profile flags
    (resolveCandidateInvitePolicyContext as any).mockClear();
    (resolveCandidateInvitePolicyContext as any).mockResolvedValueOnce({
      organization: { id: orgId, orgTrustTier: 'basic_trusted', trustStatus: 'domain_verified' },
      assignment: { id: assignmentId },
      policyEvaluation: {
        decision: 'blocked',
        orgTrustTier: 'basic_trusted',
        reasons: [{ code: 'sponsor_commercial_path_required' }],
      },
    });

    const request = new NextRequest('http://localhost/api/organizations/org/candidate-invites', {
      method: 'POST',
      body: JSON.stringify({
        email: 'candidate@example.com',
        flowType: 'test_match',
        assignmentId,
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ orgId }) });
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toBe('CANDIDATE_INVITE_BLOCKED');
    expect(payload.details.reasons).toContain('sponsor_commercial_path_required');
  });
});

describe('PATCH /api/organizations/[orgId]/candidate-invites/[inviteId]', () => {
  const orgId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const inviteId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticatedUser({ role: 'org_manager', state: 'active', status: null });
  });

  it('returns 400 for malformed JSON before invite lookup or mutation', async () => {
    mockUpdateWithWhere(); // expire stale invites
    mockSelectWithLimit([{ id: orgId, displayName: 'Acme', slug: 'acme' }]); // org

    const request = new NextRequest(
      'http://localhost/api/organizations/org/candidate-invites/invite',
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
        },
        body: '{"action":',
      }
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ orgId, inviteId }),
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: 'Invalid JSON body' });
    expect(db.select).toHaveBeenCalledTimes(1);
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(sendCandidateInviteEmail).not.toHaveBeenCalled();
  });
});
