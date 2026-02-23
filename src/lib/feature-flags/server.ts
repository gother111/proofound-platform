import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { featureFlags } from '@/db/schema';

type Audience = {
  userIds?: string[];
  userEmails?: string[];
  percentage?: number;
  orgIds?: string[];
  roles?: string[];
  environments?: Array<'development' | 'staging' | 'production'>;
};

export type FeatureFlagContext = {
  userId?: string | null;
  userEmail?: string | null;
  orgId?: string | null;
  orgIds?: string[] | null;
  roles?: string[] | null;
  environment?: 'development' | 'staging' | 'production';
};

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { value: boolean; expiresAt: number }>();

function currentEnvironment(): 'development' | 'staging' | 'production' {
  const vercel = process.env.VERCEL_ENV;
  if (vercel === 'production') return 'production';
  if (vercel === 'preview') return 'staging';
  if (process.env.NODE_ENV === 'production') return 'production';
  return 'development';
}

function hashToBucket(input: string): number {
  // FNV-1a style hash -> deterministic rollout bucket [1..100].
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (Math.abs(hash >>> 0) % 100) + 1;
}

function matchesAudience(
  audience: Audience | null | undefined,
  context: FeatureFlagContext
): boolean {
  if (!audience) return true;

  const environment = context.environment ?? currentEnvironment();
  if (Array.isArray(audience.environments) && audience.environments.length > 0) {
    if (!audience.environments.includes(environment)) return false;
  }

  const userId = context.userId ?? undefined;
  if (Array.isArray(audience.userIds) && audience.userIds.length > 0) {
    if (!userId || !audience.userIds.includes(userId)) return false;
  }

  const userEmail = context.userEmail ?? undefined;
  if (Array.isArray(audience.userEmails) && audience.userEmails.length > 0) {
    const normalized = userEmail?.toLowerCase();
    const allowed = audience.userEmails.map((email) => email.toLowerCase());
    if (!normalized || !allowed.includes(normalized)) return false;
  }

  const orgIds = new Set([...(context.orgIds ?? []), ...(context.orgId ? [context.orgId] : [])]);
  if (Array.isArray(audience.orgIds) && audience.orgIds.length > 0) {
    const hasOrgMatch = audience.orgIds.some((orgId) => orgIds.has(orgId));
    if (!hasOrgMatch) return false;
  }

  const roles = new Set(context.roles ?? []);
  if (Array.isArray(audience.roles) && audience.roles.length > 0) {
    const hasRoleMatch = audience.roles.some((role) => roles.has(role));
    if (!hasRoleMatch) return false;
  }

  if (typeof audience.percentage === 'number') {
    const percentage = Math.max(0, Math.min(100, audience.percentage));
    if (percentage <= 0) return false;
    if (percentage >= 100) return true;
    const seed = context.userId ?? context.userEmail ?? context.orgId;
    if (!seed) return false;
    return hashToBucket(seed) <= percentage;
  }

  return true;
}

function envForceOverride(key: string): boolean | null {
  const raw = process.env[key];
  if (raw == null) return null;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return null;
}

export async function isFeatureEnabled(
  key: string,
  context: FeatureFlagContext = {},
  defaultEnabled = true
): Promise<boolean> {
  const forced = envForceOverride(`FEATURE_FLAG_FORCE_${key}`);
  if (forced != null) return forced;

  const cacheKey = `${key}:${context.userId ?? ''}:${context.userEmail ?? ''}:${context.orgId ?? ''}:${(context.orgIds ?? []).join('|')}:${(context.roles ?? []).join('|')}:${context.environment ?? ''}`;
  const cached = cache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const featureFlagsQuery = (db as any)?.query?.featureFlags;
  if (!featureFlagsQuery?.findFirst) {
    cache.set(cacheKey, {
      value: defaultEnabled,
      expiresAt: now + CACHE_TTL_MS,
    });
    return defaultEnabled;
  }

  let record: { enabled: boolean; audience: unknown } | null = null;
  try {
    record = await featureFlagsQuery.findFirst({
      where: eq(featureFlags.key, key),
    });
  } catch (_error) {
    cache.set(cacheKey, {
      value: defaultEnabled,
      expiresAt: now + CACHE_TTL_MS,
    });
    return defaultEnabled;
  }

  const value =
    record == null
      ? defaultEnabled
      : record.enabled &&
        matchesAudience((record.audience as Audience | null | undefined) ?? null, context);

  cache.set(cacheKey, {
    value,
    expiresAt: now + CACHE_TTL_MS,
  });

  return value;
}

export async function resolveFeatureFlags(
  keys: string[],
  context: FeatureFlagContext = {},
  defaultEnabled = true
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};
  for (const key of keys) {
    results[key] = await isFeatureEnabled(key, context, defaultEnabled);
  }
  return results;
}
