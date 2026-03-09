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

export type CapabilityTokenClass =
  (typeof CAPABILITY_TOKEN_CLASSES)[keyof typeof CAPABILITY_TOKEN_CLASSES];

export type CapabilityBinding = (typeof CAPABILITY_BINDINGS)[keyof typeof CAPABILITY_BINDINGS];

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
  single_use: boolean;
  max_uses: number;
  redeemed_count: number;
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
  return Boolean(token.expires_at && new Date(token.expires_at).getTime() <= Date.now());
}

function isReplayBlocked(token: CapabilityTokenRow): boolean {
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
    SET updated_at = NOW()
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

async function consumeCapabilityToken(token: CapabilityTokenRow, actor?: CapabilityActorContext) {
  const ipHash = hashIp(actor?.ip);
  const userAgentHash = hashUserAgent(actor?.userAgent);

  await db.execute(sql`
    UPDATE capability_tokens
    SET
      redeemed_count = redeemed_count + 1,
      first_redeemed_at = COALESCE(first_redeemed_at, NOW()),
      last_redeemed_at = NOW(),
      last_seen_at = NOW(),
      last_seen_ip_hash = COALESCE(${ipHash}, last_seen_ip_hash),
      last_seen_user_agent_hash = COALESCE(${userAgentHash}, last_seen_user_agent_hash),
      updated_at = NOW()
    WHERE id = ${token.id}
  `);
}

export async function issueCapabilityToken(params: IssueCapabilityTokenParams) {
  const rawToken = generateOpaqueCapabilityToken();
  const tokenHash = hashCapabilityToken(rawToken);
  const actorEmailHash = hashEmail(params.actorEmail);
  const singleUse = params.singleUse ?? true;
  const maxUses = params.maxUses ?? (singleUse ? 1 : 2147483647);

  const result = await db.execute(sql`
    INSERT INTO capability_tokens (
      token_class,
      token_hash,
      source_table,
      source_id,
      action_scope,
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
      ${params.sourceTable},
      ${params.sourceId},
      ${params.actionScope},
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
  const tokenHash = hashCapabilityToken(rawToken);
  const token = await loadCapabilityTokenByHash(tokenHash, params.tokenClass);

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
    metadata?: Record<string, unknown>;
  } = {}
): Promise<RedeemCapabilityTokenResult> {
  const inspected = await inspectCapabilityToken(rawToken, params);
  if (!inspected.ok) {
    return inspected;
  }

  const token = inspected.token;

  if (!isActorAuthorized(token, params.actor)) {
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

  const shouldConsume = params.consume ?? token.single_use;
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

  if (shouldConsume && isReplayBlocked(token)) {
    await trackCapabilityTokenEvent({
      capabilityTokenId: token.id,
      eventType: 'replay_blocked',
      actor: params.actor,
      metadata: {
        tokenClass: token.token_class,
        redeemedCount: token.redeemed_count,
        ...params.metadata,
      },
    });
    return { ok: false, reason: 'replayed' };
  }

  if (shouldConsume) {
    await consumeCapabilityToken(token, params.actor);
  } else {
    await updateCapabilityTokenSeen(token.id, params.actor);
  }

  await trackCapabilityTokenEvent({
    capabilityTokenId: token.id,
    eventType: 'redeemed',
    actor: params.actor,
    metadata: {
      tokenClass: token.token_class,
      consumed: shouldConsume,
      ...params.metadata,
    },
  });

  const freshToken = await loadCapabilityTokenByHash(
    hashCapabilityToken(rawToken),
    params.tokenClass
  );
  return { ok: true, token: freshToken ?? token };
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
      revoked_at = COALESCE(revoked_at, NOW()),
      revoked_reason = ${params.reason},
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
      AND expires_at <= NOW()
    ORDER BY expires_at ASC
    LIMIT ${limit}
  `);

  const rows = getRows<{ id: string }>(result as any);
  for (const row of rows) {
    await trackCapabilityTokenEvent({
      capabilityTokenId: row.id,
      eventType: 'expired',
      metadata: { reconciler: true },
    });
  }

  return rows.length;
}
