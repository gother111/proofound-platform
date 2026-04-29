import crypto from 'crypto';
import { sql } from 'drizzle-orm';

import { db } from '@/db';
import { getRows } from '@/lib/db/rows';
import { hashOpaqueToken } from '@/lib/contracts/canonical-domain';
import { anonymizeIP, anonymizeUserAgent } from '@/lib/utils/privacy';

export const CAPABILITY_TOKEN_CLASSES = {
  ORG_MEMBER_INVITE: 'org_member_invite',
  CANDIDATE_INVITE_CLAIM: 'candidate_invite_claim',
  SKILL_VERIFICATION_RESPONSE: 'skill_verification_response',
  IMPACT_VERIFICATION_RESPONSE: 'impact_verification_response',
  CUSTOM_VERIFICATION_RESPONSE: 'custom_verification_response',
  FEEDBACK_RESPONSE: 'feedback_response',
  PROFILE_SNIPPET_SHARE: 'profile_snippet_share',
  PROOF_PACK_SHARE: 'proof_pack_share',
  CONSENT_REVEAL: 'consent_reveal',
} as const;

export const CAPABILITY_BINDINGS = {
  NONE: 'none',
  EMAIL_HASH: 'email_hash',
  AUTHENTICATED_PROFILE: 'authenticated_profile',
  AUTHENTICATED_PRINCIPAL: 'authenticated_principal',
  EMAIL_THEN_PROFILE_LOCK: 'email_then_profile_lock',
} as const;

export const CAPABILITY_TOKEN_STATES = {
  ISSUED: 'issued',
  REDEEMED: 'redeemed',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
} as const;

export const CAPABILITY_REDEEM_SESSION_MAX_AGE_SECONDS = 10 * 60;
const CAPABILITY_TOKEN_ATTEMPT_THRESHOLD = 5;
const CAPABILITY_IP_ATTEMPT_THRESHOLD = 10;
const CAPABILITY_IP_ATTEMPT_WINDOW_MS = 60 * 60 * 1000;

export type CapabilityTokenClass =
  (typeof CAPABILITY_TOKEN_CLASSES)[keyof typeof CAPABILITY_TOKEN_CLASSES];

export type CapabilityBinding = (typeof CAPABILITY_BINDINGS)[keyof typeof CAPABILITY_BINDINGS];
export type CapabilityTokenState =
  (typeof CAPABILITY_TOKEN_STATES)[keyof typeof CAPABILITY_TOKEN_STATES];

export type CapabilityActorContext = {
  email?: string | null;
  profileId?: string | null;
  orgId?: string | null;
  principalType?: string | null;
  ip?: string | null;
  userAgent?: string | null;
};

export type CapabilityTokenRow = {
  id: string;
  token_class: CapabilityTokenClass;
  token_hash: string;
  source_table: string | null;
  source_id: string | null;
  action_scope: string;
  subject_type: string;
  subject_id: string | null;
  actor_binding: CapabilityBinding;
  actor_email_hash: string | null;
  actor_profile_id: string | null;
  actor_org_id: string | null;
  principal_type: string | null;
  state: CapabilityTokenState;
  single_use: boolean;
  max_uses: number;
  redeemed_count: number;
  attempt_count: number;
  last_attempt_at: string | null;
  suspicious_flag: boolean;
  scope_key: string | null;
  redeem_session_nonce_hash: string | null;
  redeem_session_nonce_expires_at: string | null;
  issued_at: string;
  expires_at: string;
  first_redeemed_at: string | null;
  last_redeemed_at: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
  last_seen_at: string | null;
  last_seen_ip_hash: string | null;
  last_seen_user_agent_hash: string | null;
  metadata: Record<string, unknown>;
};

type IssueCapabilityTokenParams = {
  tokenClass: CapabilityTokenClass;
  sourceTable: string;
  sourceId: string;
  actionScope: string;
  subjectType: string;
  subjectId?: string | null;
  actorBinding: CapabilityBinding;
  actorEmail?: string | null;
  actorProfileId?: string | null;
  actorOrgId?: string | null;
  principalType?: string | null;
  singleUse?: boolean;
  maxUses?: number;
  scopeKey?: string | null;
  revokePriorActiveTokensForScope?: boolean;
  expiresAt: Date;
  metadata?: Record<string, unknown>;
};

type TrackCapabilityEventParams = {
  capabilityTokenId?: string | null;
  eventType:
    | 'issued'
    | 'inspected'
    | 'redeem_attempted'
    | 'redeemed'
    | 'expired'
    | 'revoked'
    | 'replay_blocked'
    | 'invalid_blocked'
    | 'actor_mismatch_blocked';
  actor?: CapabilityActorContext;
  metadata?: Record<string, unknown>;
};

export type InspectCapabilityTokenResult =
  | { ok: true; token: CapabilityTokenRow }
  | { ok: false; reason: 'invalid' | 'expired' | 'revoked' };

export type BeginCapabilityTokenRedeemSessionResult =
  | { ok: true; token: CapabilityTokenRow; redeemSessionNonce: string; maxAgeSeconds: number }
  | { ok: false; reason: 'invalid' | 'expired' | 'revoked' };

export type RedeemCapabilityTokenResult =
  | { ok: true; token: CapabilityTokenRow }
  | {
      ok: false;
      reason: 'invalid' | 'expired' | 'revoked' | 'replayed' | 'actor_mismatch';
    };

function normalizeEmail(value?: string | null): string | null {
  const normalized = value?.trim().toLowerCase() ?? '';
  return normalized.length > 0 ? normalized : null;
}

function hashEmail(value?: string | null): string | null {
  const normalized = normalizeEmail(value);
  return normalized ? hashOpaqueToken(normalized) : null;
}

function hashIp(value?: string | null): string | null {
  if (!value) return null;
  try {
    return anonymizeIP(value);
  } catch {
    return hashOpaqueToken(value);
  }
}

function hashUserAgent(value?: string | null): string | null {
  if (!value) return null;
  try {
    return anonymizeUserAgent(value);
  } catch {
    return hashOpaqueToken(value);
  }
}

export function generateOpaqueCapabilityToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashCapabilityToken(rawToken: string): string {
  return hashOpaqueToken(rawToken.trim());
}

export function hashCapabilityRedeemSessionNonce(rawNonce: string): string {
  return hashOpaqueToken(rawNonce.trim());
}

export function generateCapabilityRedeemSessionNonce(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function getCapabilityRedeemSessionCookieName(tokenClass: CapabilityTokenClass | string) {
  const safeClass = tokenClass.replace(/[^a-z0-9_]+/gi, '_').toLowerCase();
  return `pf_rsn_${safeClass}`;
}

function buildCapabilityIpThrottleKey(tokenClass?: CapabilityTokenClass, ip?: string | null) {
  const ipHash = hashIp(ip);
  if (!ipHash) return null;
  return `capability:${tokenClass ?? 'any'}:${ipHash}`;
}

async function trackCapabilityTokenEvent(params: TrackCapabilityEventParams) {
  const actorEmailHash = hashEmail(params.actor?.email);
  const ipHash = hashIp(params.actor?.ip);
  const userAgentHash = hashUserAgent(params.actor?.userAgent);

  await db.execute(sql`
    INSERT INTO capability_token_events (
      capability_token_id,
      event_type,
      actor_profile_id,
      actor_org_id,
      actor_email_hash,
      ip_hash,
      user_agent_hash,
      metadata
    ) VALUES (
      ${params.capabilityTokenId ?? null},
      ${params.eventType},
      ${params.actor?.profileId ?? null},
      ${params.actor?.orgId ?? null},
      ${actorEmailHash},
      ${ipHash},
      ${userAgentHash},
      ${JSON.stringify(params.metadata ?? {})}::jsonb
    )
  `);
}

async function getCapabilityIpThrottleState(key: string) {
  const result = await db.execute(sql`
    SELECT attempts, reset_at
    FROM rate_limits
    WHERE id = ${key}
    LIMIT 1
  `);

  const [row] = getRows<{ attempts: number; reset_at: string }>(result as any);
  if (!row) {
    return { blocked: false, attempts: 0 };
  }

  if (new Date(row.reset_at).getTime() <= Date.now()) {
    return { blocked: false, attempts: 0 };
  }

  return {
    blocked: row.attempts >= CAPABILITY_IP_ATTEMPT_THRESHOLD,
    attempts: row.attempts,
  };
}

async function recordCapabilityIpFailure(key: string) {
  const resetAt = new Date(Date.now() + CAPABILITY_IP_ATTEMPT_WINDOW_MS).toISOString();
  const result = await db.execute(sql`
    INSERT INTO rate_limits (id, attempts, reset_at)
    VALUES (${key}, 1, ${resetAt})
    ON CONFLICT (id) DO UPDATE
    SET
      attempts = CASE
        WHEN rate_limits.reset_at <= NOW() THEN 1
        ELSE rate_limits.attempts + 1
      END,
      reset_at = CASE
        WHEN rate_limits.reset_at <= NOW() THEN ${resetAt}
        ELSE rate_limits.reset_at
      END
    RETURNING attempts, reset_at
  `);

  const [row] = getRows<{ attempts: number; reset_at: string }>(result as any);
  return {
    blocked:
      Boolean(row) &&
      new Date(row.reset_at).getTime() > Date.now() &&
      row.attempts >= CAPABILITY_IP_ATTEMPT_THRESHOLD,
    attempts: row?.attempts ?? 0,
  };
}

async function recordCapabilityTokenFailure(
  tokenId: string,
  metadata?: Record<string, unknown>
): Promise<{ suspicious: boolean; attemptCount: number }> {
  const result = await db.execute(sql`
    UPDATE capability_tokens
    SET
      attempt_count = CASE
        WHEN last_attempt_at IS NULL
          OR last_attempt_at <= NOW() - INTERVAL '15 minutes'
          THEN 1
        ELSE attempt_count + 1
      END,
      last_attempt_at = NOW(),
      suspicious_flag = CASE
        WHEN (
          CASE
            WHEN last_attempt_at IS NULL
              OR last_attempt_at <= NOW() - INTERVAL '15 minutes'
              THEN 1
            ELSE attempt_count + 1
          END
        ) >= ${CAPABILITY_TOKEN_ATTEMPT_THRESHOLD}
          THEN TRUE
        ELSE suspicious_flag
      END,
      updated_at = NOW()
    WHERE id = ${tokenId}
    RETURNING attempt_count, suspicious_flag
  `);

  const [row] = getRows<{ attempt_count: number; suspicious_flag: boolean }>(result as any);

  await trackCapabilityTokenEvent({
    capabilityTokenId: tokenId,
    eventType: 'invalid_blocked',
    metadata,
  });

  return {
    suspicious: row?.suspicious_flag ?? false,
    attemptCount: row?.attempt_count ?? 0,
  };
}

async function loadCapabilityTokenByHash(
  tokenHash: string,
  tokenClass?: CapabilityTokenClass
): Promise<CapabilityTokenRow | null> {
  const result = tokenClass
    ? await db.execute(sql`
        SELECT *
        FROM capability_tokens
        WHERE token_hash = ${tokenHash}
          AND token_class = ${tokenClass}
        LIMIT 1
      `)
    : await db.execute(sql`
        SELECT *
        FROM capability_tokens
        WHERE token_hash = ${tokenHash}
        LIMIT 1
      `);

  const [row] = getRows<CapabilityTokenRow>(result as any);
  return row ?? null;
}

function isExpiredToken(token: CapabilityTokenRow): boolean {
  return (
    token.state === CAPABILITY_TOKEN_STATES.EXPIRED ||
    Boolean(token.expires_at && new Date(token.expires_at).getTime() <= Date.now())
  );
}

function isReplayBlocked(token: CapabilityTokenRow): boolean {
  if (token.state === CAPABILITY_TOKEN_STATES.REDEEMED && token.single_use) {
    return true;
  }

  if (token.single_use) {
    return token.redeemed_count >= 1;
  }

  return token.max_uses > 0 && token.redeemed_count >= token.max_uses;
}

async function updateCapabilityTokenSeen(tokenId: string, actor?: CapabilityActorContext) {
  const ipHash = hashIp(actor?.ip);
  const userAgentHash = hashUserAgent(actor?.userAgent);

  await db.execute(sql`
    UPDATE capability_tokens
    SET
      last_seen_at = NOW(),
      last_seen_ip_hash = COALESCE(${ipHash}, last_seen_ip_hash),
      last_seen_user_agent_hash = COALESCE(${userAgentHash}, last_seen_user_agent_hash),
      updated_at = NOW()
    WHERE id = ${tokenId}
  `);
}

async function markCapabilityTokenExpired(
  token: CapabilityTokenRow,
  actor?: CapabilityActorContext
) {
  await db.execute(sql`
    UPDATE capability_tokens
    SET
      state = ${CAPABILITY_TOKEN_STATES.EXPIRED},
      updated_at = NOW()
    WHERE id = ${token.id}
  `);

  await trackCapabilityTokenEvent({
    capabilityTokenId: token.id,
    eventType: 'expired',
    actor,
    metadata: { tokenClass: token.token_class },
  });
}

function isActorAuthorized(token: CapabilityTokenRow, actor?: CapabilityActorContext): boolean {
  const emailHash = hashEmail(actor?.email);

  switch (token.actor_binding) {
    case CAPABILITY_BINDINGS.NONE:
      return true;
    case CAPABILITY_BINDINGS.EMAIL_HASH:
      return Boolean(token.actor_email_hash && emailHash && token.actor_email_hash === emailHash);
    case CAPABILITY_BINDINGS.AUTHENTICATED_PROFILE:
      return Boolean(token.actor_profile_id && actor?.profileId === token.actor_profile_id);
    case CAPABILITY_BINDINGS.AUTHENTICATED_PRINCIPAL:
      return Boolean(
        token.principal_type &&
          actor?.principalType &&
          token.principal_type === actor.principalType &&
          ((token.actor_profile_id && token.actor_profile_id === actor.profileId) ||
            (token.actor_org_id && token.actor_org_id === actor.orgId))
      );
    case CAPABILITY_BINDINGS.EMAIL_THEN_PROFILE_LOCK:
      if (token.actor_profile_id && actor?.profileId) {
        return token.actor_profile_id === actor.profileId;
      }
      return Boolean(token.actor_email_hash && emailHash && token.actor_email_hash === emailHash);
    default:
      return false;
  }
}

function buildCapabilityTokenClassCondition(tokenClass?: CapabilityTokenClass) {
  return tokenClass ? sql`AND token_class = ${tokenClass}` : sql``;
}

function buildCapabilityActorCondition(actor?: CapabilityActorContext) {
  const emailHash = hashEmail(actor?.email);

  return sql`(
    actor_binding = ${CAPABILITY_BINDINGS.NONE}
    OR (
      actor_binding = ${CAPABILITY_BINDINGS.EMAIL_HASH}
      AND actor_email_hash IS NOT NULL
      AND actor_email_hash = ${emailHash}
    )
    OR (
      actor_binding = ${CAPABILITY_BINDINGS.AUTHENTICATED_PROFILE}
      AND actor_profile_id IS NOT NULL
      AND actor_profile_id = ${actor?.profileId ?? null}
    )
    OR (
      actor_binding = ${CAPABILITY_BINDINGS.AUTHENTICATED_PRINCIPAL}
      AND principal_type IS NOT NULL
      AND principal_type = ${actor?.principalType ?? null}
      AND (
        (
          actor_profile_id IS NOT NULL
          AND actor_profile_id = ${actor?.profileId ?? null}
        )
        OR (
          actor_org_id IS NOT NULL
          AND actor_org_id = ${actor?.orgId ?? null}
        )
      )
    )
    OR (
      actor_binding = ${CAPABILITY_BINDINGS.EMAIL_THEN_PROFILE_LOCK}
      AND (
        (
          actor_profile_id IS NOT NULL
          AND actor_profile_id = ${actor?.profileId ?? null}
        )
        OR (
          actor_profile_id IS NULL
          AND actor_email_hash IS NOT NULL
          AND actor_email_hash = ${emailHash}
        )
      )
    )
  )`;
}

function buildCapabilityRedeemSessionCondition(params: {
  requireRedeemSessionNonce?: boolean;
  redeemSessionNonce?: string | null;
}) {
  if (!params.requireRedeemSessionNonce) {
    return sql`TRUE`;
  }

  const nonce = params.redeemSessionNonce?.trim() ?? '';
  const nonceHash = nonce.length > 0 ? hashCapabilityRedeemSessionNonce(nonce) : null;

  return sql`(
    redeem_session_nonce_hash IS NOT NULL
    AND redeem_session_nonce_hash = ${nonceHash}
    AND redeem_session_nonce_expires_at IS NOT NULL
    AND redeem_session_nonce_expires_at > NOW()
  )`;
}

async function consumeCapabilityTokenAtomically(
  tokenHash: string,
  params: {
    tokenClass?: CapabilityTokenClass;
    actor?: CapabilityActorContext;
    requireRedeemSessionNonce?: boolean;
    redeemSessionNonce?: string | null;
  }
): Promise<CapabilityTokenRow | null> {
  const ipHash = hashIp(params.actor?.ip);
  const userAgentHash = hashUserAgent(params.actor?.userAgent);
  const actorProfileId = params.actor?.profileId ?? null;

  const result = await db.execute(sql`
    UPDATE capability_tokens
    SET
      state = CASE
        WHEN single_use OR redeemed_count + 1 >= max_uses THEN ${CAPABILITY_TOKEN_STATES.REDEEMED}
        ELSE state
      END,
      redeemed_count = redeemed_count + 1,
      actor_profile_id = CASE
        WHEN actor_binding = ${CAPABILITY_BINDINGS.EMAIL_THEN_PROFILE_LOCK}
          AND actor_profile_id IS NULL
          AND ${actorProfileId}::uuid IS NOT NULL
          THEN ${actorProfileId}::uuid
        ELSE actor_profile_id
      END,
      first_redeemed_at = COALESCE(first_redeemed_at, NOW()),
      last_redeemed_at = NOW(),
      last_seen_at = NOW(),
      last_seen_ip_hash = COALESCE(${ipHash}, last_seen_ip_hash),
      last_seen_user_agent_hash = COALESCE(${userAgentHash}, last_seen_user_agent_hash),
      redeem_session_nonce_hash = NULL,
      redeem_session_nonce_expires_at = NULL,
      updated_at = NOW()
    WHERE token_hash = ${tokenHash}
      ${buildCapabilityTokenClassCondition(params.tokenClass)}
      AND state = ${CAPABILITY_TOKEN_STATES.ISSUED}
      AND revoked_at IS NULL
      AND expires_at > NOW()
      AND redeemed_count < max_uses
      AND (
        attempt_count < ${CAPABILITY_TOKEN_ATTEMPT_THRESHOLD}
        OR last_attempt_at IS NULL
        OR last_attempt_at <= NOW() - INTERVAL '15 minutes'
      )
      AND ${buildCapabilityActorCondition(params.actor)}
      AND ${buildCapabilityRedeemSessionCondition(params)}
    RETURNING *
  `);

  const [token] = getRows<CapabilityTokenRow>(result as any);
  return token ?? null;
}

async function recordAtomicCapabilityRedemptionFailure(
  tokenHash: string,
  params: {
    tokenClass?: CapabilityTokenClass;
    actor?: CapabilityActorContext;
    metadata?: Record<string, unknown>;
  }
): Promise<RedeemCapabilityTokenResult> {
  const result = await db.execute(sql`
    UPDATE capability_tokens
    SET
      attempt_count = CASE
        WHEN last_attempt_at IS NULL
          OR last_attempt_at <= NOW() - INTERVAL '15 minutes'
          THEN 1
        ELSE attempt_count + 1
      END,
      last_attempt_at = NOW(),
      suspicious_flag = CASE
        WHEN (
          CASE
            WHEN last_attempt_at IS NULL
              OR last_attempt_at <= NOW() - INTERVAL '15 minutes'
              THEN 1
            ELSE attempt_count + 1
          END
        ) >= ${CAPABILITY_TOKEN_ATTEMPT_THRESHOLD}
          THEN TRUE
        ELSE suspicious_flag
      END,
      state = CASE
        WHEN state = ${CAPABILITY_TOKEN_STATES.ISSUED}
          AND expires_at <= NOW()
          THEN ${CAPABILITY_TOKEN_STATES.EXPIRED}
        ELSE state
      END,
      updated_at = NOW()
    WHERE token_hash = ${tokenHash}
      ${buildCapabilityTokenClassCondition(params.tokenClass)}
    RETURNING *
  `);

  const [token] = getRows<CapabilityTokenRow>(result as any);
  if (!token) {
    await trackCapabilityTokenEvent({
      eventType: 'invalid_blocked',
      actor: params.actor,
      metadata: {
        tokenClass: params.tokenClass ?? null,
        ...params.metadata,
      },
    });
    return { ok: false, reason: 'invalid' };
  }

  const baseMetadata = {
    tokenClass: token.token_class,
    attemptCount: token.attempt_count,
    ...params.metadata,
  };

  if (token.revoked_at || token.state === CAPABILITY_TOKEN_STATES.REVOKED) {
    await trackCapabilityTokenEvent({
      capabilityTokenId: token.id,
      eventType: 'revoked',
      actor: params.actor,
      metadata: baseMetadata,
    });
    return { ok: false, reason: 'revoked' };
  }

  if (isExpiredToken(token)) {
    await trackCapabilityTokenEvent({
      capabilityTokenId: token.id,
      eventType: 'expired',
      actor: params.actor,
      metadata: baseMetadata,
    });
    return { ok: false, reason: 'expired' };
  }

  if (isReplayBlocked(token)) {
    await trackCapabilityTokenEvent({
      capabilityTokenId: token.id,
      eventType: 'replay_blocked',
      actor: params.actor,
      metadata: {
        ...baseMetadata,
        redeemedCount: token.redeemed_count,
      },
    });
    return { ok: false, reason: 'replayed' };
  }

  if (!isActorAuthorized(token, params.actor)) {
    await trackCapabilityTokenEvent({
      capabilityTokenId: token.id,
      eventType: 'actor_mismatch_blocked',
      actor: params.actor,
      metadata: {
        ...baseMetadata,
        actorBinding: token.actor_binding,
      },
    });
    return { ok: false, reason: 'actor_mismatch' };
  }

  await trackCapabilityTokenEvent({
    capabilityTokenId: token.id,
    eventType: 'invalid_blocked',
    actor: params.actor,
    metadata: baseMetadata,
  });
  return { ok: false, reason: 'invalid' };
}

async function maybeLockProfileBoundToken(
  token: CapabilityTokenRow,
  actor?: CapabilityActorContext
) {
  if (
    token.actor_binding !== CAPABILITY_BINDINGS.EMAIL_THEN_PROFILE_LOCK ||
    token.actor_profile_id ||
    !actor?.profileId
  ) {
    return;
  }

  await db.execute(sql`
    UPDATE capability_tokens
    SET
      actor_profile_id = ${actor.profileId},
      updated_at = NOW()
    WHERE id = ${token.id}
      AND actor_profile_id IS NULL
  `);
}

export async function issueCapabilityToken(params: IssueCapabilityTokenParams) {
  const rawToken = generateOpaqueCapabilityToken();
  const tokenHash = hashCapabilityToken(rawToken);
  const actorEmailHash = hashEmail(params.actorEmail);
  const singleUse = params.singleUse ?? true;
  const maxUses = params.maxUses ?? (singleUse ? 1 : 2147483647);

  if (params.revokePriorActiveTokensForScope && params.scopeKey) {
    const revokedResult = await db.execute(sql`
      UPDATE capability_tokens
      SET
        state = ${CAPABILITY_TOKEN_STATES.REVOKED},
        revoked_at = COALESCE(revoked_at, NOW()),
        revoked_reason = COALESCE(revoked_reason, 'regenerated'),
        updated_at = NOW()
      WHERE token_class = ${params.tokenClass}
        AND scope_key = ${params.scopeKey}
        AND COALESCE(actor_email_hash, '') = COALESCE(${actorEmailHash}, '')
        AND state = ${CAPABILITY_TOKEN_STATES.ISSUED}
        AND revoked_at IS NULL
        AND expires_at > NOW()
      RETURNING id
    `);

    const revokedRows = getRows<{ id: string }>(revokedResult as any);
    for (const row of revokedRows) {
      await trackCapabilityTokenEvent({
        capabilityTokenId: row.id,
        eventType: 'revoked',
        actor: {
          email: params.actorEmail,
          profileId: params.actorProfileId,
          orgId: params.actorOrgId,
          principalType: params.principalType,
        },
        metadata: {
          reason: 'regenerated',
          tokenClass: params.tokenClass,
          scopeKey: params.scopeKey,
        },
      });
    }
  }

  const result = await db.execute(sql`
    INSERT INTO capability_tokens (
      token_class,
      token_hash,
      state,
      source_table,
      source_id,
      action_scope,
      scope_key,
      subject_type,
      subject_id,
      actor_binding,
      actor_email_hash,
      actor_profile_id,
      actor_org_id,
      principal_type,
      single_use,
      max_uses,
      expires_at,
      metadata
    ) VALUES (
      ${params.tokenClass},
      ${tokenHash},
      ${CAPABILITY_TOKEN_STATES.ISSUED},
      ${params.sourceTable},
      ${params.sourceId},
      ${params.actionScope},
      ${params.scopeKey ?? null},
      ${params.subjectType},
      ${params.subjectId ?? null},
      ${params.actorBinding},
      ${actorEmailHash},
      ${params.actorProfileId ?? null},
      ${params.actorOrgId ?? null},
      ${params.principalType ?? null},
      ${singleUse},
      ${maxUses},
      ${params.expiresAt.toISOString()},
      ${JSON.stringify(params.metadata ?? {})}::jsonb
    )
    RETURNING *
  `);

  const [token] = getRows<CapabilityTokenRow>(result as any);
  await trackCapabilityTokenEvent({
    capabilityTokenId: token.id,
    eventType: 'issued',
    actor: {
      email: params.actorEmail,
      profileId: params.actorProfileId,
      orgId: params.actorOrgId,
      principalType: params.principalType,
    },
    metadata: {
      tokenClass: params.tokenClass,
      sourceTable: params.sourceTable,
      sourceId: params.sourceId,
    },
  });

  return {
    rawToken,
    tokenHash,
    token,
  };
}

export async function inspectCapabilityToken(
  rawToken: string,
  params: {
    tokenClass?: CapabilityTokenClass;
    actor?: CapabilityActorContext;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<InspectCapabilityTokenResult> {
  const ipThrottleKey = buildCapabilityIpThrottleKey(params.tokenClass, params.actor?.ip);
  if (ipThrottleKey) {
    const throttleState = await getCapabilityIpThrottleState(ipThrottleKey);
    if (throttleState.blocked) {
      await trackCapabilityTokenEvent({
        eventType: 'invalid_blocked',
        actor: params.actor,
        metadata: {
          tokenClass: params.tokenClass ?? null,
          reason: 'ip_rate_limited',
          ...params.metadata,
        },
      });
      return { ok: false, reason: 'invalid' };
    }
  }

  const tokenHash = hashCapabilityToken(rawToken);
  const token = await loadCapabilityTokenByHash(tokenHash, params.tokenClass);

  if (!token) {
    if (ipThrottleKey) {
      await recordCapabilityIpFailure(ipThrottleKey);
    }
    await trackCapabilityTokenEvent({
      eventType: 'invalid_blocked',
      actor: params.actor,
      metadata: {
        tokenClass: params.tokenClass ?? null,
        ...params.metadata,
      },
    });
    return { ok: false, reason: 'invalid' };
  }

  if (token.revoked_at) {
    await trackCapabilityTokenEvent({
      capabilityTokenId: token.id,
      eventType: 'revoked',
      actor: params.actor,
      metadata: {
        tokenClass: token.token_class,
        revokedReason: token.revoked_reason,
        ...params.metadata,
      },
    });
    return { ok: false, reason: 'revoked' };
  }

  if (isExpiredToken(token)) {
    await markCapabilityTokenExpired(token, params.actor);
    return { ok: false, reason: 'expired' };
  }

  await updateCapabilityTokenSeen(token.id, params.actor);
  await trackCapabilityTokenEvent({
    capabilityTokenId: token.id,
    eventType: 'inspected',
    actor: params.actor,
    metadata: {
      tokenClass: token.token_class,
      ...params.metadata,
    },
  });

  return { ok: true, token };
}

export async function redeemCapabilityToken(
  rawToken: string,
  params: {
    tokenClass?: CapabilityTokenClass;
    actor?: CapabilityActorContext;
    consume?: boolean;
    requireRedeemSessionNonce?: boolean;
    redeemSessionNonce?: string | null;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<RedeemCapabilityTokenResult> {
  const tokenHash = hashCapabilityToken(rawToken);
  const ipThrottleKey = buildCapabilityIpThrottleKey(params.tokenClass, params.actor?.ip);
  if (ipThrottleKey) {
    const throttleState = await getCapabilityIpThrottleState(ipThrottleKey);
    if (throttleState.blocked) {
      await trackCapabilityTokenEvent({
        eventType: 'invalid_blocked',
        actor: params.actor,
        metadata: {
          tokenClass: params.tokenClass ?? null,
          reason: 'ip_rate_limited',
          ...params.metadata,
        },
      });
      return { ok: false, reason: 'invalid' };
    }
  }

  const shouldConsume = params.consume ?? true;
  if (!shouldConsume) {
    const inspected = await inspectCapabilityToken(rawToken, params);
    if (!inspected.ok) {
      return inspected;
    }

    const token = inspected.token;
    const classScopedThrottleKey = buildCapabilityIpThrottleKey(
      token.token_class,
      params.actor?.ip
    );
    if (!isActorAuthorized(token, params.actor)) {
      await recordCapabilityTokenFailure(token.id, {
        tokenClass: token.token_class,
        reason: 'actor_mismatch',
        ...params.metadata,
      });
      if (classScopedThrottleKey) {
        await recordCapabilityIpFailure(classScopedThrottleKey);
      }
      await trackCapabilityTokenEvent({
        capabilityTokenId: token.id,
        eventType: 'actor_mismatch_blocked',
        actor: params.actor,
        metadata: {
          tokenClass: token.token_class,
          actorBinding: token.actor_binding,
          ...params.metadata,
        },
      });
      return { ok: false, reason: 'actor_mismatch' };
    }

    await maybeLockProfileBoundToken(token, params.actor);
    if (params.requireRedeemSessionNonce) {
      const nonce = params.redeemSessionNonce?.trim() ?? '';
      const nonceValid =
        nonce.length > 0 &&
        Boolean(token.redeem_session_nonce_hash) &&
        Boolean(token.redeem_session_nonce_expires_at) &&
        new Date(token.redeem_session_nonce_expires_at as string).getTime() > Date.now() &&
        token.redeem_session_nonce_hash === hashCapabilityRedeemSessionNonce(nonce);

      if (!nonceValid) {
        await recordCapabilityTokenFailure(token.id, {
          tokenClass: token.token_class,
          reason: 'redeem_session_nonce_invalid',
          ...params.metadata,
        });
        if (classScopedThrottleKey) {
          await recordCapabilityIpFailure(classScopedThrottleKey);
        }
        return { ok: false, reason: 'invalid' };
      }
    }

    await trackCapabilityTokenEvent({
      capabilityTokenId: token.id,
      eventType: 'redeem_attempted',
      actor: params.actor,
      metadata: {
        tokenClass: token.token_class,
        shouldConsume,
        ...params.metadata,
      },
    });
    await updateCapabilityTokenSeen(token.id, params.actor);
    await trackCapabilityTokenEvent({
      capabilityTokenId: token.id,
      eventType: 'redeemed',
      actor: params.actor,
      metadata: {
        tokenClass: token.token_class,
        consumed: false,
        ...params.metadata,
      },
    });
    return { ok: true, token };
  }

  const token = await consumeCapabilityTokenAtomically(tokenHash, params);
  if (!token) {
    if (ipThrottleKey) {
      await recordCapabilityIpFailure(ipThrottleKey);
    }
    return recordAtomicCapabilityRedemptionFailure(tokenHash, params);
  }

  await trackCapabilityTokenEvent({
    capabilityTokenId: token.id,
    eventType: 'redeem_attempted',
    actor: params.actor,
    metadata: {
      tokenClass: token.token_class,
      shouldConsume,
      ...params.metadata,
    },
  });

  await trackCapabilityTokenEvent({
    capabilityTokenId: token.id,
    eventType: 'redeemed',
    actor: params.actor,
    metadata: {
      tokenClass: token.token_class,
      consumed: true,
      ...params.metadata,
    },
  });

  return { ok: true, token };
}

export async function beginCapabilityTokenRedeemSession(
  rawToken: string,
  params: {
    tokenClass?: CapabilityTokenClass;
    actor?: CapabilityActorContext;
    metadata?: Record<string, unknown>;
    maxAgeSeconds?: number;
  } = {}
): Promise<BeginCapabilityTokenRedeemSessionResult> {
  const inspected = await inspectCapabilityToken(rawToken, params);
  if (!inspected.ok) {
    return inspected;
  }

  const redeemSessionNonce = generateCapabilityRedeemSessionNonce();
  const maxAgeSeconds = params.maxAgeSeconds ?? CAPABILITY_REDEEM_SESSION_MAX_AGE_SECONDS;
  const redeemSessionNonceHash = hashCapabilityRedeemSessionNonce(redeemSessionNonce);
  const redeemSessionNonceExpiresAt = new Date(Date.now() + maxAgeSeconds * 1000).toISOString();

  await db.execute(sql`
    UPDATE capability_tokens
    SET
      redeem_session_nonce_hash = ${redeemSessionNonceHash},
      redeem_session_nonce_expires_at = ${redeemSessionNonceExpiresAt},
      updated_at = NOW()
    WHERE id = ${inspected.token.id}
  `);

  const freshToken = await loadCapabilityTokenByHash(
    hashCapabilityToken(rawToken),
    params.tokenClass
  );

  return {
    ok: true,
    token: freshToken ?? inspected.token,
    redeemSessionNonce,
    maxAgeSeconds,
  };
}

export async function revokeCapabilityTokenById(
  capabilityTokenId: string,
  params: {
    actor?: CapabilityActorContext;
    reason: string;
    metadata?: Record<string, unknown>;
  }
) {
  await db.execute(sql`
    UPDATE capability_tokens
    SET
      state = ${CAPABILITY_TOKEN_STATES.REVOKED},
      revoked_at = COALESCE(revoked_at, NOW()),
      revoked_reason = ${params.reason},
      redeem_session_nonce_hash = NULL,
      redeem_session_nonce_expires_at = NULL,
      updated_at = NOW()
    WHERE id = ${capabilityTokenId}
  `);

  await trackCapabilityTokenEvent({
    capabilityTokenId,
    eventType: 'revoked',
    actor: params.actor,
    metadata: {
      reason: params.reason,
      ...params.metadata,
    },
  });
}

export async function revokeCapabilityTokensBySource(
  sourceTable: string,
  sourceId: string,
  params: {
    actor?: CapabilityActorContext;
    reason: string;
    metadata?: Record<string, unknown>;
  }
) {
  const result = await db.execute(sql`
    SELECT id
    FROM capability_tokens
    WHERE source_table = ${sourceTable}
      AND source_id = ${sourceId}::uuid
      AND revoked_at IS NULL
  `);

  const rows = getRows<{ id: string }>(result as any);
  for (const row of rows) {
    await revokeCapabilityTokenById(row.id, params);
  }
}

export async function expireDueCapabilityTokens(limit = 200) {
  const result = await db.execute(sql`
    SELECT id
    FROM capability_tokens
    WHERE revoked_at IS NULL
      AND state = ${CAPABILITY_TOKEN_STATES.ISSUED}
      AND expires_at <= NOW()
    ORDER BY expires_at ASC
    LIMIT ${limit}
  `);

  const rows = getRows<{ id: string }>(result as any);
  for (const row of rows) {
    await db.execute(sql`
      UPDATE capability_tokens
      SET
        state = ${CAPABILITY_TOKEN_STATES.EXPIRED},
        updated_at = NOW()
      WHERE id = ${row.id}
    `);
    await trackCapabilityTokenEvent({
      capabilityTokenId: row.id,
      eventType: 'expired',
      metadata: { reconciler: true },
    });
  }

  return rows.length;
}
