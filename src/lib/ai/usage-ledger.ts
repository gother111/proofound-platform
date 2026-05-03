import { createHash } from 'node:crypto';
import { and, eq, isNull, sql } from 'drizzle-orm';

import { db } from '@/db';
import {
  aiMonthlyBudgets,
  aiSuggestionCache,
  aiSuggestionEvents,
  aiUsageLogs,
  organizationMembers,
} from '@/db/schema';
import { getRows } from '@/lib/db/rows';

export type AiUsageStatus =
  | 'in_progress'
  | 'success'
  | 'cache_hit'
  | 'budget_blocked'
  | 'rate_limited'
  | 'model_error'
  | 'invalid_json'
  | 'validation_failed'
  | 'failed';

export type AiUsageContext = {
  userId: string;
  orgId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  inputHash?: string;
  sanitizedInputChars?: number;
  redactionSummary?: Record<string, unknown>;
  safeMetadata?: Record<string, unknown>;
  cacheTtlSeconds?: number;
  bypassCache?: boolean;
};

export type AiUsageReservation = {
  budgetIds: string[];
  estimatedCostOre: number;
  monthStart: string;
};

export type AiBudgetDecision =
  | { ok: true; reservation: AiUsageReservation | null }
  | {
      ok: false;
      reason: 'budget_exceeded' | 'disabled';
      scopeType: string;
      scopeKey: string;
      limitOre: number;
      spentOre: number;
      reservedOre: number;
    };

export type AiRateLimitDecision =
  | { ok: true }
  | { ok: false; scope: 'user' | 'organization' | 'feature'; limit: number; count: number };

export type AiSuggestionReplay = {
  cacheId: string;
  payload: unknown;
  outputHash: string;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  model: string;
  costOre: number;
};

export type AiSuggestionEventType =
  | 'cache_hit'
  | 'cache_miss'
  | 'reservation_created'
  | 'reservation_released'
  | 'finalized'
  | 'generated'
  | 'viewed'
  | 'accepted'
  | 'edited'
  | 'dismissed'
  | 'published'
  | 'budget_blocked'
  | 'rate_limited'
  | 'provider_failed';

export type AiLaunchBudgetState =
  | 'disabled'
  | 'ok'
  | 'cap_not_configured'
  | 'exhausted'
  | 'raw_prompt_logging_blocked';

export type AiLaunchOperationalSummary = {
  aiAssistantsEnabled: boolean;
  aiMonthlyCapSek: number | null;
  aiSpendThisMonthSek: number;
  aiBudgetState: AiLaunchBudgetState;
  aiRawPromptLoggingEnabled: boolean;
};

const AI_PROVIDER = 'gemini' as const;
const AI_CURRENCY = 'SEK' as const;
export const DEFAULT_AI_SUGGESTION_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60;
const DEFAULT_USER_DAILY_LIMIT = 50;
const DEFAULT_ORG_DAILY_LIMIT = 200;
const DEFAULT_FEATURE_DAILY_LIMIT = 500;

type BudgetScope = {
  scopeType: 'global' | 'production';
  scopeKey: string;
  monthlyLimitOre: number;
};

function asNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function parseNonNegativeNumber(value: string | undefined): number | null {
  if (value === undefined || value.trim().length === 0) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.max(1, Math.floor(parsed));
}

function isProductionLike(env: Pick<NodeJS.ProcessEnv, string> = process.env): boolean {
  const nodeEnv = env.NODE_ENV?.trim().toLowerCase();
  const vercelEnv = env.VERCEL_ENV?.trim().toLowerCase();
  const appEnv = (env.NEXT_PUBLIC_APP_ENV || env.APP_ENV)?.trim().toLowerCase();
  return nodeEnv === 'production' || vercelEnv === 'production' || appEnv === 'production';
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }
  return fallback;
}

function toOre(sek: number): number {
  return Math.max(0, Math.round(sek * 100));
}

function normalizeFeature(feature: string): string {
  return (
    feature
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_.:-]+/g, '_')
      .slice(0, 80) || 'unknown'
  );
}

function scopedValue(value: string | null | undefined): string {
  return value && value.trim().length > 0 ? value.trim().slice(0, 160) : '__none__';
}

function normalizeOptionalScope(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function omitSensitiveMetadata(
  value: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!value) {
    return {};
  }

  const blockedKey = /(prompt|input|text|document|candidate|payload|response|email|name|phone)/i;
  const sanitizeValue = (entryValue: unknown, depth = 0): unknown => {
    if (entryValue === null || typeof entryValue === 'boolean' || typeof entryValue === 'number') {
      return entryValue;
    }

    if (typeof entryValue === 'string') {
      return entryValue.slice(0, 120);
    }

    if (Array.isArray(entryValue) && depth < 2) {
      return entryValue.slice(0, 30).map((item) => sanitizeValue(item, depth + 1));
    }

    if (entryValue && typeof entryValue === 'object' && !Array.isArray(entryValue) && depth < 2) {
      const record = entryValue as Record<string, unknown>;
      return Object.fromEntries(
        Object.entries(record)
          .filter(([key]) => !blockedKey.test(key))
          .map(([key, item]) => [key, sanitizeValue(item, depth + 1)])
          .filter(([, item]) => item !== undefined)
      );
    }

    return undefined;
  };
  const safeEntries: Array<[string, unknown]> = [];

  for (const [key, entryValue] of Object.entries(value)) {
    if (blockedKey.test(key)) {
      safeEntries.push([key, '[redacted]']);
      continue;
    }

    const sanitized = sanitizeValue(entryValue);
    if (sanitized !== undefined) {
      safeEntries.push([key, sanitized]);
    }
  }

  return Object.fromEntries(safeEntries);
}

export function hashAiContent(value: unknown): string {
  const payload = typeof value === 'string' ? value : JSON.stringify(value);
  return createHash('sha256')
    .update(payload || '')
    .digest('hex');
}

export function buildAiIdempotencyKey(params: {
  userId: string;
  orgId?: string | null;
  feature: string;
  entityType?: string | null;
  entityId?: string | null;
  inputHash: string;
}): string {
  return hashAiContent(
    [
      params.userId,
      scopedValue(params.orgId),
      normalizeFeature(params.feature),
      scopedValue(params.entityType),
      scopedValue(params.entityId),
      params.inputHash,
    ].join(':')
  ).slice(0, 64);
}

export function buildAiSuggestionCacheKey(params: {
  userId: string;
  orgId?: string | null;
  feature: string;
  entityType?: string | null;
  entityId?: string | null;
  inputHash: string;
  promptVersion: string;
}): string {
  return hashAiContent(
    [
      params.userId,
      scopedValue(params.orgId),
      normalizeFeature(params.feature),
      scopedValue(params.entityType),
      scopedValue(params.entityId),
      params.promptVersion,
      params.inputHash,
    ].join(':')
  ).slice(0, 96);
}

async function userCanAccessSuggestionScope(params: {
  userId: string;
  orgId?: string | null;
}): Promise<boolean> {
  const orgId = normalizeOptionalScope(params.orgId);
  if (!orgId) {
    return true;
  }

  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, params.userId),
      eq(organizationMembers.orgId, orgId),
      eq(organizationMembers.state, 'active')
    ),
    columns: { id: true },
  });

  return Boolean(membership);
}

export function resolveAiMonthStart(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Stockholm',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);

  const year = parts.find((part) => part.type === 'year')?.value || '1970';
  const month = parts.find((part) => part.type === 'month')?.value || '01';
  return `${year}-${month}-01`;
}

function resolveAiDayStart(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Stockholm',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = parts.find((part) => part.type === 'year')?.value || '1970';
  const month = parts.find((part) => part.type === 'month')?.value || '01';
  const day = parts.find((part) => part.type === 'day')?.value || '01';
  return `${year}-${month}-${day}`;
}

function resolveBudgetScopes(env: Pick<NodeJS.ProcessEnv, string> = process.env): BudgetScope[] {
  const scopes: BudgetScope[] = [];
  const globalCapSek = parseNonNegativeNumber(env.AI_MONTHLY_HARD_CAP_SEK);
  const productionCapSek = parseNonNegativeNumber(env.AI_PROD_MONTHLY_HARD_CAP_SEK);

  if (globalCapSek !== null) {
    scopes.push({
      scopeType: 'global',
      scopeKey: 'all',
      monthlyLimitOre: toOre(globalCapSek),
    });
  }

  if (productionCapSek !== null && isProductionLike(env)) {
    scopes.push({
      scopeType: 'production',
      scopeKey: 'all',
      monthlyLimitOre: toOre(productionCapSek),
    });
  }

  return scopes;
}

function resolveConfiguredLaunchMonthlyCapSek(
  env: Pick<NodeJS.ProcessEnv, string> = process.env
): number | null {
  const caps = [
    parseNonNegativeNumber(env.AI_MONTHLY_HARD_CAP_SEK),
    isProductionLike(env) ? parseNonNegativeNumber(env.AI_PROD_MONTHLY_HARD_CAP_SEK) : null,
  ].filter((value): value is number => value !== null);

  if (caps.length === 0) {
    return null;
  }

  return Math.min(...caps);
}

export function resolveAiRawPromptLoggingEnabled(
  env: Pick<NodeJS.ProcessEnv, string> = process.env
): boolean {
  return parseBoolean(env.AI_RAW_PROMPT_LOGGING_ENABLED, false);
}

export function assertAiRawPromptLoggingAllowed(
  env: Pick<NodeJS.ProcessEnv, string> = process.env
): void {
  if (isProductionLike(env) && resolveAiRawPromptLoggingEnabled(env)) {
    throw new Error('AI_RAW_PROMPT_LOGGING_ENABLED must be false in production.');
  }
}

export async function getAiLaunchOperationalSummary(
  env: Pick<NodeJS.ProcessEnv, string> = process.env
): Promise<AiLaunchOperationalSummary> {
  const aiAssistantsEnabled = parseBoolean(env.AI_ASSISTANTS_ENABLED, false);
  const aiRawPromptLoggingEnabled = resolveAiRawPromptLoggingEnabled(env);
  const aiMonthlyCapSek = resolveConfiguredLaunchMonthlyCapSek(env);
  const monthStart = resolveAiMonthStart();
  const result = await db.execute(sql`
    SELECT
      COALESCE(SUM(spent_ore), 0)::int AS spent_ore,
      COALESCE(SUM(reserved_ore), 0)::int AS reserved_ore,
      BOOL_OR(status = 'exhausted') AS exhausted
    FROM public.ai_monthly_budgets
    WHERE provider = 'gemini'
      AND month_start = ${monthStart}
      AND scope_type IN ('global', 'production')
  `);
  const [row] = getRows(result) as Array<{
    spent_ore?: number | string | null;
    reserved_ore?: number | string | null;
    exhausted?: boolean | string | null;
  }>;
  const spentOre = asNumber(row?.spent_ore);
  const reservedOre = asNumber(row?.reserved_ore);
  const exhausted = row?.exhausted === true || row?.exhausted === 'true' || row?.exhausted === 't';

  let aiBudgetState: AiLaunchBudgetState = 'ok';
  if (!aiAssistantsEnabled) {
    aiBudgetState = 'disabled';
  } else if (isProductionLike(env) && aiRawPromptLoggingEnabled) {
    aiBudgetState = 'raw_prompt_logging_blocked';
  } else if (aiMonthlyCapSek === null) {
    aiBudgetState = 'cap_not_configured';
  } else if (exhausted || spentOre + reservedOre >= toOre(aiMonthlyCapSek)) {
    aiBudgetState = 'exhausted';
  }

  return {
    aiAssistantsEnabled,
    aiMonthlyCapSek,
    aiSpendThisMonthSek: spentOre / 100,
    aiBudgetState,
    aiRawPromptLoggingEnabled,
  };
}

function resolveFeatureDailyLimit(feature: string): number {
  const envKey = `AI_${normalizeFeature(feature)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')}_DAILY_LIMIT`;
  return parsePositiveInteger(process.env[envKey], DEFAULT_FEATURE_DAILY_LIMIT);
}

async function countUsageSince(params: {
  whereSql: ReturnType<typeof sql>;
  dayStart: string;
}): Promise<number> {
  const result = await db.execute(sql`
    SELECT count(*)::int AS count
    FROM public.ai_usage_logs
    WHERE ${params.whereSql}
      AND created_at >= (${params.dayStart}::date AT TIME ZONE 'Europe/Stockholm')
      AND status <> 'cache_hit'
  `);
  const rows = getRows(result) as Array<{ count: number | string }>;
  return asNumber(rows[0]?.count);
}

export async function enforceAiDailyRateLimits(params: {
  userId: string;
  orgId?: string | null;
  feature: string;
  now?: Date;
}): Promise<AiRateLimitDecision> {
  const dayStart = resolveAiDayStart(params.now);
  const userLimit = parsePositiveInteger(process.env.AI_USER_DAILY_LIMIT, DEFAULT_USER_DAILY_LIMIT);
  const orgLimit = parsePositiveInteger(process.env.AI_ORG_DAILY_LIMIT, DEFAULT_ORG_DAILY_LIMIT);
  const featureLimit = resolveFeatureDailyLimit(params.feature);

  const userCount = await countUsageSince({
    whereSql: sql`user_id = ${params.userId}`,
    dayStart,
  });
  if (userCount >= userLimit) {
    return { ok: false, scope: 'user', limit: userLimit, count: userCount };
  }

  if (params.orgId) {
    const orgCount = await countUsageSince({
      whereSql: sql`org_id = ${params.orgId}`,
      dayStart,
    });
    if (orgCount >= orgLimit) {
      return { ok: false, scope: 'organization', limit: orgLimit, count: orgCount };
    }
  }

  const featureCount = await countUsageSince({
    whereSql: sql`feature = ${normalizeFeature(params.feature)}`,
    dayStart,
  });
  if (featureCount >= featureLimit) {
    return { ok: false, scope: 'feature', limit: featureLimit, count: featureCount };
  }

  return { ok: true };
}

export async function getCachedSuggestion(params: {
  cacheKey: string;
  userId: string;
  orgId?: string | null;
}): Promise<AiSuggestionReplay | null> {
  const orgId = normalizeOptionalScope(params.orgId);
  const hasScopeAccess = await userCanAccessSuggestionScope({
    userId: params.userId,
    orgId,
  });
  if (!hasScopeAccess) {
    return null;
  }

  const [row] = await db
    .select({
      id: aiSuggestionCache.id,
      userId: aiSuggestionCache.userId,
      orgId: aiSuggestionCache.orgId,
      responsePayload: aiSuggestionCache.responsePayload,
      outputHash: aiSuggestionCache.outputHash,
      tokenUsage: aiSuggestionCache.tokenUsage,
      model: aiSuggestionCache.model,
      costOre: aiSuggestionCache.costOre,
    })
    .from(aiSuggestionCache)
    .where(
      and(
        eq(aiSuggestionCache.cacheKey, params.cacheKey),
        eq(aiSuggestionCache.userId, params.userId),
        orgId ? eq(aiSuggestionCache.orgId, orgId) : isNull(aiSuggestionCache.orgId),
        sql`(${aiSuggestionCache.expiresAt} IS NULL OR ${aiSuggestionCache.expiresAt} > now())`
      )
    )
    .limit(1);

  if (!row) {
    return null;
  }
  if (row.userId !== params.userId || (row.orgId ?? null) !== (orgId ?? null)) {
    return null;
  }

  const tokenUsage =
    row.tokenUsage && typeof row.tokenUsage === 'object'
      ? (row.tokenUsage as Partial<AiSuggestionReplay['tokenUsage']>)
      : {};

  return {
    cacheId: row.id,
    payload: row.responsePayload,
    outputHash: row.outputHash,
    model: row.model,
    costOre: row.costOre,
    tokenUsage: {
      inputTokens: asNumber(tokenUsage.inputTokens),
      outputTokens: asNumber(tokenUsage.outputTokens),
      totalTokens: asNumber(tokenUsage.totalTokens),
    },
  };
}

export async function findAiSuggestionReplay(params: {
  cacheKey: string;
  userId: string;
  orgId?: string | null;
}): Promise<AiSuggestionReplay | null> {
  return getCachedSuggestion(params);
}

export async function createAiUsageLog(params: {
  requestId: string;
  idempotencyKey: string;
  userId: string;
  orgId?: string | null;
  feature: string;
  entityType?: string | null;
  entityId?: string | null;
  provider?: 'gemini';
  model?: string | null;
  promptVersion: string;
  inputHash: string;
  status?: AiUsageStatus;
  estimatedCostOre?: number;
  reservedOre?: number;
  redactionSummary?: Record<string, unknown>;
  safeMetadata?: Record<string, unknown>;
}): Promise<string> {
  const [row] = await db
    .insert(aiUsageLogs)
    .values({
      requestId: params.requestId,
      idempotencyKey: params.idempotencyKey,
      userId: params.userId,
      orgId: params.orgId || null,
      feature: normalizeFeature(params.feature),
      entityType: params.entityType || null,
      entityId: params.entityId || null,
      provider: params.provider || AI_PROVIDER,
      model: params.model || null,
      promptVersion: params.promptVersion,
      inputHash: params.inputHash,
      status: params.status || 'in_progress',
      estimatedCostOre: Math.max(0, params.estimatedCostOre || 0),
      reservedOre: Math.max(0, params.reservedOre || 0),
      currency: AI_CURRENCY,
      redactionSummary: omitSensitiveMetadata(params.redactionSummary),
      safeMetadata: omitSensitiveMetadata(params.safeMetadata),
      updatedAt: new Date(),
    })
    .returning({ id: aiUsageLogs.id });

  if (!row) {
    throw new Error('Failed to create AI usage log.');
  }

  return row.id;
}

export async function updateAiUsageLog(
  logId: string,
  patch: {
    status?: AiUsageStatus;
    model?: string | null;
    outputHash?: string | null;
    promptTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
    estimatedCostOre?: number;
    reservedOre?: number;
    costOre?: number;
    errorCode?: string | null;
    latencyMs?: number | null;
    safeMetadata?: Record<string, unknown>;
  }
): Promise<void> {
  await db
    .update(aiUsageLogs)
    .set({
      ...('status' in patch ? { status: patch.status } : {}),
      ...('model' in patch ? { model: patch.model } : {}),
      ...('outputHash' in patch ? { outputHash: patch.outputHash } : {}),
      ...('promptTokens' in patch ? { promptTokens: patch.promptTokens } : {}),
      ...('outputTokens' in patch ? { outputTokens: patch.outputTokens } : {}),
      ...('totalTokens' in patch ? { totalTokens: patch.totalTokens } : {}),
      ...('estimatedCostOre' in patch ? { estimatedCostOre: patch.estimatedCostOre } : {}),
      ...('reservedOre' in patch ? { reservedOre: patch.reservedOre } : {}),
      ...('costOre' in patch ? { costOre: patch.costOre } : {}),
      ...('errorCode' in patch ? { errorCode: patch.errorCode } : {}),
      ...('latencyMs' in patch ? { latencyMs: patch.latencyMs } : {}),
      ...('safeMetadata' in patch
        ? { safeMetadata: omitSensitiveMetadata(patch.safeMetadata) }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(aiUsageLogs.id, logId));
}

export async function reserveAiBudget(params: {
  estimatedCostOre: number;
  env?: Pick<NodeJS.ProcessEnv, string>;
}): Promise<AiBudgetDecision> {
  const estimatedCostOre = Math.max(0, Math.round(params.estimatedCostOre));
  const scopes = resolveBudgetScopes(params.env);

  if (scopes.length === 0) {
    return { ok: true, reservation: null };
  }

  return db.transaction(async (tx) => {
    const monthStart = resolveAiMonthStart();
    const lockedRows: Array<{
      id: string;
      scope_type: string;
      scope_key: string;
      monthly_limit_ore: number | string;
      spent_ore: number | string;
      reserved_ore: number | string;
      status: string;
    }> = [];

    for (const scope of scopes) {
      await tx
        .insert(aiMonthlyBudgets)
        .values({
          provider: AI_PROVIDER,
          scopeType: scope.scopeType,
          scopeKey: scope.scopeKey,
          monthStart,
          currency: AI_CURRENCY,
          monthlyLimitOre: scope.monthlyLimitOre,
          spentOre: 0,
          reservedOre: 0,
          status: 'active',
        })
        .onConflictDoUpdate({
          target: [
            aiMonthlyBudgets.provider,
            aiMonthlyBudgets.scopeType,
            aiMonthlyBudgets.scopeKey,
            aiMonthlyBudgets.monthStart,
          ],
          set: {
            monthlyLimitOre: scope.monthlyLimitOre,
            updatedAt: new Date(),
          },
        });

      const lockedResult = await tx.execute(sql`
        SELECT id, scope_type, scope_key, monthly_limit_ore, spent_ore, reserved_ore, status
        FROM public.ai_monthly_budgets
        WHERE provider = ${AI_PROVIDER}
          AND scope_type = ${scope.scopeType}
          AND scope_key = ${scope.scopeKey}
          AND month_start = ${monthStart}
        FOR UPDATE
      `);
      const [row] = getRows(lockedResult) as typeof lockedRows;
      if (!row) {
        throw new Error('AI monthly budget row could not be locked.');
      }
      lockedRows.push(row);
    }

    for (const row of lockedRows) {
      const limitOre = asNumber(row.monthly_limit_ore);
      const spentOre = asNumber(row.spent_ore);
      const reservedOre = asNumber(row.reserved_ore);
      const projected = spentOre + reservedOre + estimatedCostOre;

      if (row.status === 'disabled') {
        return {
          ok: false as const,
          reason: 'disabled' as const,
          scopeType: row.scope_type,
          scopeKey: row.scope_key,
          limitOre,
          spentOre,
          reservedOre,
        };
      }

      if (projected > limitOre) {
        await tx
          .update(aiMonthlyBudgets)
          .set({
            status: 'exhausted',
            updatedAt: new Date(),
          })
          .where(eq(aiMonthlyBudgets.id, row.id));

        return {
          ok: false as const,
          reason: 'budget_exceeded' as const,
          scopeType: row.scope_type,
          scopeKey: row.scope_key,
          limitOre,
          spentOre,
          reservedOre,
        };
      }
    }

    for (const row of lockedRows) {
      await tx
        .update(aiMonthlyBudgets)
        .set({
          reservedOre: asNumber(row.reserved_ore) + estimatedCostOre,
          status: 'active',
          updatedAt: new Date(),
        })
        .where(eq(aiMonthlyBudgets.id, row.id));
    }

    return {
      ok: true as const,
      reservation: {
        budgetIds: lockedRows.map((row) => row.id),
        estimatedCostOre,
        monthStart,
      },
    };
  });
}

export async function releaseAiBudgetReservation(reservation: AiUsageReservation | null) {
  if (!reservation || reservation.budgetIds.length === 0) {
    return;
  }

  await db.transaction(async (tx) => {
    for (const budgetId of reservation.budgetIds) {
      const lockedResult = await tx.execute(sql`
        SELECT id, reserved_ore
        FROM public.ai_monthly_budgets
        WHERE id = ${budgetId}
        FOR UPDATE
      `);
      const [row] = getRows(lockedResult) as Array<{ id: string; reserved_ore: number | string }>;
      if (!row) {
        continue;
      }

      await tx
        .update(aiMonthlyBudgets)
        .set({
          reservedOre: Math.max(0, asNumber(row.reserved_ore) - reservation.estimatedCostOre),
          updatedAt: new Date(),
        })
        .where(eq(aiMonthlyBudgets.id, row.id));
    }
  });
}

export async function finalizeAiBudgetReservation(params: {
  reservation: AiUsageReservation | null;
  actualCostOre: number;
}) {
  if (!params.reservation || params.reservation.budgetIds.length === 0) {
    return;
  }

  const actualCostOre = Math.max(0, Math.round(params.actualCostOre));

  await db.transaction(async (tx) => {
    for (const budgetId of params.reservation!.budgetIds) {
      const lockedResult = await tx.execute(sql`
        SELECT id, monthly_limit_ore, spent_ore, reserved_ore, status
        FROM public.ai_monthly_budgets
        WHERE id = ${budgetId}
        FOR UPDATE
      `);
      const [row] = getRows(lockedResult) as Array<{
        id: string;
        monthly_limit_ore: number | string;
        spent_ore: number | string;
        reserved_ore: number | string;
        status: string;
      }>;
      if (!row) {
        continue;
      }

      const nextSpent = asNumber(row.spent_ore) + actualCostOre;
      const nextReserved = Math.max(
        0,
        asNumber(row.reserved_ore) - params.reservation!.estimatedCostOre
      );
      const limitOre = asNumber(row.monthly_limit_ore);

      await tx
        .update(aiMonthlyBudgets)
        .set({
          spentOre: nextSpent,
          reservedOre: nextReserved,
          status:
            row.status === 'disabled' ? 'disabled' : nextSpent >= limitOre ? 'exhausted' : 'active',
          updatedAt: new Date(),
        })
        .where(eq(aiMonthlyBudgets.id, row.id));
    }
  });
}

export async function saveSuggestion(params: {
  cacheKey: string;
  userId: string;
  orgId?: string | null;
  feature: string;
  entityType?: string | null;
  entityId?: string | null;
  model: string;
  promptVersion: string;
  inputHash: string;
  outputHash: string;
  responsePayload: unknown;
  tokenUsage: AiSuggestionReplay['tokenUsage'];
  costOre: number;
  redactionSummary?: Record<string, unknown>;
  cacheTtlSeconds?: number;
}): Promise<string | null> {
  const orgId = normalizeOptionalScope(params.orgId);
  const hasScopeAccess = await userCanAccessSuggestionScope({
    userId: params.userId,
    orgId,
  });
  if (!hasScopeAccess) {
    return null;
  }

  const ttlSeconds =
    params.cacheTtlSeconds === undefined
      ? DEFAULT_AI_SUGGESTION_CACHE_TTL_SECONDS
      : params.cacheTtlSeconds;
  const expiresAt = ttlSeconds && ttlSeconds > 0 ? new Date(Date.now() + ttlSeconds * 1000) : null;

  await db
    .insert(aiSuggestionCache)
    .values({
      cacheKey: params.cacheKey,
      userId: params.userId,
      orgId,
      feature: normalizeFeature(params.feature),
      entityType: params.entityType || null,
      entityId: params.entityId || null,
      provider: AI_PROVIDER,
      model: params.model,
      promptVersion: params.promptVersion,
      inputHash: params.inputHash,
      outputHash: params.outputHash,
      responsePayload: params.responsePayload,
      tokenUsage: params.tokenUsage,
      costOre: Math.max(0, params.costOre),
      currency: AI_CURRENCY,
      redactionSummary: omitSensitiveMetadata(params.redactionSummary),
      expiresAt,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: aiSuggestionCache.cacheKey,
      set: {
        model: params.model,
        outputHash: params.outputHash,
        responsePayload: params.responsePayload,
        tokenUsage: params.tokenUsage,
        costOre: Math.max(0, params.costOre),
        redactionSummary: omitSensitiveMetadata(params.redactionSummary),
        expiresAt,
        updatedAt: new Date(),
      },
    });

  const [row] = await db
    .select({ id: aiSuggestionCache.id })
    .from(aiSuggestionCache)
    .where(eq(aiSuggestionCache.cacheKey, params.cacheKey))
    .limit(1);

  return row?.id || null;
}

export async function upsertAiSuggestionCache(params: {
  cacheKey: string;
  userId: string;
  orgId?: string | null;
  feature: string;
  entityType?: string | null;
  entityId?: string | null;
  model: string;
  promptVersion: string;
  inputHash: string;
  outputHash: string;
  responsePayload: unknown;
  tokenUsage: AiSuggestionReplay['tokenUsage'];
  costOre: number;
  redactionSummary?: Record<string, unknown>;
  cacheTtlSeconds?: number;
}): Promise<string | null> {
  return saveSuggestion(params);
}

export async function recordSuggestionEvent(params: {
  usageLogId?: string | null;
  cacheId?: string | null;
  eventType: AiSuggestionEventType;
  userId: string;
  orgId?: string | null;
  feature?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  inputHash?: string | null;
  safeMetadata?: Record<string, unknown>;
}): Promise<void> {
  let cacheContext: {
    id: string;
    userId: string | null;
    orgId: string | null;
    feature: string;
    entityType: string | null;
    entityId: string | null;
    inputHash: string;
  } | null = null;

  if (params.cacheId) {
    const [row] = await db
      .select({
        id: aiSuggestionCache.id,
        userId: aiSuggestionCache.userId,
        orgId: aiSuggestionCache.orgId,
        feature: aiSuggestionCache.feature,
        entityType: aiSuggestionCache.entityType,
        entityId: aiSuggestionCache.entityId,
        inputHash: aiSuggestionCache.inputHash,
      })
      .from(aiSuggestionCache)
      .where(eq(aiSuggestionCache.id, params.cacheId))
      .limit(1);

    if (!row || row.userId !== params.userId) {
      throw new Error('AI_SUGGESTION_CACHE_FORBIDDEN');
    }

    const hasScopeAccess = await userCanAccessSuggestionScope({
      userId: params.userId,
      orgId: row.orgId,
    });
    if (!hasScopeAccess) {
      throw new Error('AI_SUGGESTION_CACHE_FORBIDDEN');
    }

    cacheContext = row;
  }

  const orgId = normalizeOptionalScope(params.orgId ?? cacheContext?.orgId ?? null);
  if (orgId) {
    const hasScopeAccess = await userCanAccessSuggestionScope({
      userId: params.userId,
      orgId,
    });
    if (!hasScopeAccess) {
      throw new Error('AI_SUGGESTION_CACHE_FORBIDDEN');
    }
  }

  const feature = normalizeOptionalScope(params.feature ?? cacheContext?.feature ?? null);
  const inputHash = normalizeOptionalScope(params.inputHash ?? cacheContext?.inputHash ?? null);

  if (!feature || !inputHash) {
    throw new Error('AI_SUGGESTION_EVENT_CONTEXT_REQUIRED');
  }

  await db.insert(aiSuggestionEvents).values({
    usageLogId: params.usageLogId || null,
    cacheId: params.cacheId || cacheContext?.id || null,
    eventType: params.eventType,
    userId: params.userId,
    orgId,
    feature: normalizeFeature(feature),
    entityType: params.entityType ?? cacheContext?.entityType ?? null,
    entityId: params.entityId ?? cacheContext?.entityId ?? null,
    inputHash,
    safeMetadata: omitSensitiveMetadata(params.safeMetadata),
  });
}

export async function recordAiSuggestionEvent(
  params: Parameters<typeof recordSuggestionEvent>[0]
): Promise<void> {
  await recordSuggestionEvent(params);
}
