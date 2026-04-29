import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

import { db } from '@/db';
import {
  CAPABILITY_BINDINGS,
  CAPABILITY_TOKEN_CLASSES,
  CAPABILITY_TOKEN_STATES,
  hashCapabilityRedeemSessionNonce,
  issueCapabilityToken,
  redeemCapabilityToken,
} from '@/lib/security/capability-tokens';

function tokenRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cap-token-1',
    token_class: CAPABILITY_TOKEN_CLASSES.CANDIDATE_INVITE_CLAIM,
    token_hash: 'hashed-token',
    source_table: 'org_candidate_invites',
    source_id: 'invite-1',
    action_scope: 'candidate_invite.claim',
    subject_type: 'org_candidate_invite',
    subject_id: 'invite-1',
    actor_binding: CAPABILITY_BINDINGS.NONE,
    actor_email_hash: null,
    actor_profile_id: null,
    actor_org_id: null,
    principal_type: null,
    state: CAPABILITY_TOKEN_STATES.ISSUED,
    single_use: true,
    max_uses: 1,
    redeemed_count: 0,
    attempt_count: 0,
    last_attempt_at: null,
    suspicious_flag: false,
    scope_key: 'candidate_invite:org-1:proof_card:none:candidate@example.com',
    redeem_session_nonce_hash: null,
    redeem_session_nonce_expires_at: null,
    issued_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 60_000).toISOString(),
    first_redeemed_at: null,
    last_redeemed_at: null,
    revoked_at: null,
    revoked_reason: null,
    last_seen_at: null,
    last_seen_ip_hash: null,
    last_seen_user_agent_hash: null,
    metadata: {},
    ...overrides,
  };
}

describe('capability token contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockExecuteRows(rowSets: any[][]) {
    let index = 0;
    (db.execute as any).mockImplementation(async () => ({ rows: rowSets[index++] ?? [] }));
  }

  it('redeems a single-use token once and rejects replay', async () => {
    const nonce = 'nonce-value';
    const redeemedToken = tokenRow({
      state: CAPABILITY_TOKEN_STATES.REDEEMED,
      redeemed_count: 1,
      redeem_session_nonce_hash: null,
      redeem_session_nonce_expires_at: null,
    });

    mockExecuteRows([[redeemedToken], [], [], [], [redeemedToken], []]);

    const firstRedeem = await redeemCapabilityToken('raw-token', {
      tokenClass: CAPABILITY_TOKEN_CLASSES.CANDIDATE_INVITE_CLAIM,
      requireRedeemSessionNonce: true,
      redeemSessionNonce: nonce,
    });

    expect(firstRedeem.ok).toBe(true);
    if (firstRedeem.ok) {
      expect(firstRedeem.token.state).toBe(CAPABILITY_TOKEN_STATES.REDEEMED);
    }

    const secondRedeem = await redeemCapabilityToken('raw-token', {
      tokenClass: CAPABILITY_TOKEN_CLASSES.CANDIDATE_INVITE_CLAIM,
      requireRedeemSessionNonce: true,
      redeemSessionNonce: nonce,
    });

    expect(secondRedeem).toEqual({ ok: false, reason: 'replayed' });
  });

  it('allows exactly one of two concurrent single-use redemption attempts to succeed', async () => {
    const nonce = 'nonce-value';
    const redeemedToken = tokenRow({
      state: CAPABILITY_TOKEN_STATES.REDEEMED,
      redeemed_count: 1,
    });

    mockExecuteRows([[redeemedToken], [], [], [redeemedToken], [], []]);

    const attempts = await Promise.all([
      redeemCapabilityToken('raw-token', {
        tokenClass: CAPABILITY_TOKEN_CLASSES.CANDIDATE_INVITE_CLAIM,
        requireRedeemSessionNonce: true,
        redeemSessionNonce: nonce,
      }),
      redeemCapabilityToken('raw-token', {
        tokenClass: CAPABILITY_TOKEN_CLASSES.CANDIDATE_INVITE_CLAIM,
        requireRedeemSessionNonce: true,
        redeemSessionNonce: nonce,
      }),
    ]);

    expect(attempts.filter((attempt) => attempt.ok)).toHaveLength(1);
    expect(attempts.filter((attempt) => !attempt.ok)).toEqual([{ ok: false, reason: 'replayed' }]);
  });

  it('fails closed when the redeem session nonce is missing or mismatched', async () => {
    mockExecuteRows([
      [],
      [
        tokenRow({
          attempt_count: 5,
          suspicious_flag: true,
          redeem_session_nonce_hash: hashCapabilityRedeemSessionNonce('expected-nonce'),
          redeem_session_nonce_expires_at: new Date(Date.now() + 60_000).toISOString(),
        }),
      ],
      [],
    ]);

    const redeemed = await redeemCapabilityToken('raw-token', {
      tokenClass: CAPABILITY_TOKEN_CLASSES.CANDIDATE_INVITE_CLAIM,
      requireRedeemSessionNonce: true,
      redeemSessionNonce: 'wrong-nonce',
    });

    expect(redeemed).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects expired tokens and records a failed redemption attempt', async () => {
    mockExecuteRows([
      [],
      [
        tokenRow({
          state: CAPABILITY_TOKEN_STATES.EXPIRED,
          expires_at: new Date(Date.now() - 60_000).toISOString(),
          attempt_count: 1,
        }),
      ],
      [],
    ]);

    const redeemed = await redeemCapabilityToken('raw-token', {
      tokenClass: CAPABILITY_TOKEN_CLASSES.CANDIDATE_INVITE_CLAIM,
    });

    expect(redeemed).toEqual({ ok: false, reason: 'expired' });
  });

  it('rejects revoked tokens and records a failed redemption attempt', async () => {
    mockExecuteRows([
      [],
      [
        tokenRow({
          state: CAPABILITY_TOKEN_STATES.REVOKED,
          revoked_at: new Date().toISOString(),
          revoked_reason: 'manual_revocation',
          attempt_count: 1,
        }),
      ],
      [],
    ]);

    const redeemed = await redeemCapabilityToken('raw-token', {
      tokenClass: CAPABILITY_TOKEN_CLASSES.CANDIDATE_INVITE_CLAIM,
    });

    expect(redeemed).toEqual({ ok: false, reason: 'revoked' });
  });

  it('rejects wrong actors when profile binding is required', async () => {
    mockExecuteRows([
      [],
      [
        tokenRow({
          actor_binding: CAPABILITY_BINDINGS.AUTHENTICATED_PROFILE,
          actor_profile_id: 'profile-owner',
          attempt_count: 1,
        }),
      ],
      [],
    ]);

    const redeemed = await redeemCapabilityToken('raw-token', {
      tokenClass: CAPABILITY_TOKEN_CLASSES.CANDIDATE_INVITE_CLAIM,
      actor: { profileId: 'different-profile', principalType: 'user_account' },
    });

    expect(redeemed).toEqual({ ok: false, reason: 'actor_mismatch' });
  });

  it('rejects tokens once the attempt limit has been exceeded', async () => {
    mockExecuteRows([
      [],
      [
        tokenRow({
          attempt_count: 6,
          suspicious_flag: true,
        }),
      ],
      [],
    ]);

    const redeemed = await redeemCapabilityToken('raw-token', {
      tokenClass: CAPABILITY_TOKEN_CLASSES.CANDIDATE_INVITE_CLAIM,
    });

    expect(redeemed).toEqual({ ok: false, reason: 'invalid' });
  });

  it('uses the same outward failure shape for missing tokens', async () => {
    mockExecuteRows([[], [], []]);

    const redeemed = await redeemCapabilityToken('missing-token', {
      tokenClass: CAPABILITY_TOKEN_CLASSES.CANDIDATE_INVITE_CLAIM,
    });

    expect(redeemed).toEqual({ ok: false, reason: 'invalid' });
  });

  it('revokes prior active tokens when regenerating the same scope and target', async () => {
    (db.execute as any).mockResolvedValue({ rows: [] });
    (db.execute as any)
      .mockResolvedValueOnce({ rows: [{ id: 'old-token-1' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          tokenRow({
            id: 'new-token-1',
            token_hash: 'new-hash',
            actor_email_hash: 'email-hash',
          }),
        ],
      });

    const issued = await issueCapabilityToken({
      tokenClass: CAPABILITY_TOKEN_CLASSES.CANDIDATE_INVITE_CLAIM,
      sourceTable: 'org_candidate_invites',
      sourceId: 'invite-2',
      actionScope: 'candidate_invite.claim',
      scopeKey: 'candidate_invite:org-1:proof_card:none:candidate@example.com',
      subjectType: 'org_candidate_invite',
      subjectId: 'invite-2',
      actorBinding: CAPABILITY_BINDINGS.EMAIL_HASH,
      actorEmail: 'candidate@example.com',
      expiresAt: new Date(Date.now() + 60_000),
      revokePriorActiveTokensForScope: true,
    });

    expect(issued.token.id).toBe('new-token-1');
    expect(db.execute).toHaveBeenCalled();
  });
});
