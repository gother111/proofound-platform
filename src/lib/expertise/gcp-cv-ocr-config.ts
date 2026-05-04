export type GcpCvOcrAuthMode = 'hmac' | 'oidc';

export type GcpCvOcrUnavailableReason =
  | 'disabled'
  | 'missing_expiry'
  | 'invalid_expiry'
  | 'expired'
  | 'missing_base_url'
  | 'invalid_base_url'
  | 'missing_auth_mode'
  | 'invalid_auth_mode'
  | 'missing_shared_secret'
  | 'missing_oidc_config'
  | 'invalid_oidc_config';

export type GcpCvOcrAllowedMimeType =
  | 'application/pdf'
  | 'image/jpeg'
  | 'image/png'
  | 'image/tiff'
  | 'image/webp';

export type GcpCvOcrConfig = {
  enabled: boolean;
  available: boolean;
  unavailableReason: GcpCvOcrUnavailableReason | null;
  expiresAt: Date | null;
  baseUrl: string | null;
  authMode: GcpCvOcrAuthMode | null;
  maxFileSizeMb: number;
  maxFileSizeBytes: number;
  maxPages: number;
  maxFilesPerRequest: number;
  allowedMimeTypes: GcpCvOcrAllowedMimeType[];
  retentionHours: number;
  userDailyLimit: number;
  globalDailyLimit: number;
  hasAuthSecret: boolean;
  oidcAudience: string | null;
  oidcProjectNumber: string | null;
  oidcWorkloadIdentityPoolId: string | null;
  oidcWorkloadIdentityProviderId: string | null;
  oidcServiceAccountEmail: string | null;
  hasOidcConfig: boolean;
};

type EnvReader = Record<string, string | undefined>;

const DEFAULT_MAX_FILE_SIZE_MB = 5;
const DEFAULT_MAX_PAGES = 4;
const DEFAULT_MAX_FILES_PER_REQUEST = 1;
const DEFAULT_RETENTION_HOURS = 24;
const DEFAULT_USER_DAILY_LIMIT = 5;
const DEFAULT_GLOBAL_DAILY_LIMIT = 50;
const DEFAULT_ALLOWED_MIME_TYPES: GcpCvOcrAllowedMimeType[] = ['application/pdf'];
const TRUE_VALUES = new Set(['true', '1', 'yes', 'on']);
const FALSE_VALUES = new Set(['false', '0', 'no', 'off']);
const ALLOWED_MIME_TYPES = new Set<GcpCvOcrAllowedMimeType>([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/tiff',
  'image/webp',
]);

export const GCP_CV_OCR_ENV_KEYS = [
  'GCP_CV_OCR_ENABLED',
  'GCP_CV_OCR_EXPIRES_AT',
  'GCP_CV_OCR_BASE_URL',
  'GCP_CV_OCR_AUTH_MODE',
  'GCP_CV_OCR_SHARED_SECRET',
  'GCP_CV_OCR_MAX_FILE_SIZE_MB',
  'GCP_CV_OCR_MAX_PAGES',
  'GCP_CV_OCR_MAX_FILES_PER_REQUEST',
  'GCP_CV_OCR_ALLOWED_MIME_TYPES',
  'GCP_CV_OCR_RETENTION_HOURS',
  'GCP_CV_OCR_USER_DAILY_LIMIT',
  'GCP_CV_OCR_GLOBAL_DAILY_LIMIT',
  'GCP_CV_OCR_OIDC_AUDIENCE',
  'GCP_CV_OCR_OIDC_PROJECT_NUMBER',
  'GCP_CV_OCR_OIDC_WORKLOAD_IDENTITY_POOL_ID',
  'GCP_CV_OCR_OIDC_WORKLOAD_IDENTITY_PROVIDER_ID',
  'GCP_CV_OCR_OIDC_SERVICE_ACCOUNT_EMAIL',
] as const;

const GCP_PROJECT_NUMBER_PATTERN = /^\d{6,20}$/;
const WORKLOAD_IDENTITY_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/;
const SERVICE_ACCOUNT_EMAIL_PATTERN =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.iam\.gserviceaccount\.com$/;

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) {
    return true;
  }
  if (FALSE_VALUES.has(normalized)) {
    return false;
  }

  return fallback;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function parseExpiry(value: string | undefined): {
  expiresAt: Date | null;
  reason: GcpCvOcrUnavailableReason | null;
} {
  const trimmed = value?.trim();
  if (!trimmed) {
    return { expiresAt: null, reason: 'missing_expiry' };
  }

  const expiresAt = new Date(trimmed);
  if (Number.isNaN(expiresAt.getTime())) {
    return { expiresAt: null, reason: 'invalid_expiry' };
  }

  return { expiresAt, reason: null };
}

function normalizeBaseUrl(value: string | undefined): {
  baseUrl: string | null;
  reason: GcpCvOcrUnavailableReason | null;
} {
  const trimmed = value?.trim();
  if (!trimmed) {
    return { baseUrl: null, reason: 'missing_base_url' };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') {
      return { baseUrl: null, reason: 'invalid_base_url' };
    }
    return { baseUrl: parsed.origin, reason: null };
  } catch {
    return { baseUrl: null, reason: 'invalid_base_url' };
  }
}

function parseAuthMode(value: string | undefined): {
  authMode: GcpCvOcrAuthMode | null;
  reason: GcpCvOcrUnavailableReason | null;
} {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return { authMode: null, reason: 'missing_auth_mode' };
  }

  if (normalized === 'hmac' || normalized === 'oidc') {
    return { authMode: normalized, reason: null };
  }

  return { authMode: null, reason: 'invalid_auth_mode' };
}

function parseOptionalHttpsOrigin(value: string | undefined): {
  origin: string | null;
  reason: GcpCvOcrUnavailableReason | null;
} {
  const trimmed = value?.trim();
  if (!trimmed) {
    return { origin: null, reason: null };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') {
      return { origin: null, reason: 'invalid_oidc_config' };
    }
    return { origin: parsed.origin, reason: null };
  } catch {
    return { origin: null, reason: 'invalid_oidc_config' };
  }
}

function parseOidcConfig(
  env: EnvReader,
  defaultAudience: string | null
): Pick<
  GcpCvOcrConfig,
  | 'oidcAudience'
  | 'oidcProjectNumber'
  | 'oidcWorkloadIdentityPoolId'
  | 'oidcWorkloadIdentityProviderId'
  | 'oidcServiceAccountEmail'
  | 'hasOidcConfig'
> & {
  reason: GcpCvOcrUnavailableReason | null;
} {
  const audience = parseOptionalHttpsOrigin(env.GCP_CV_OCR_OIDC_AUDIENCE);
  if (audience.reason) {
    return emptyOidcConfig(audience.reason);
  }

  const oidcAudience = audience.origin ?? defaultAudience;
  const oidcProjectNumber = env.GCP_CV_OCR_OIDC_PROJECT_NUMBER?.trim() || null;
  const oidcWorkloadIdentityPoolId = env.GCP_CV_OCR_OIDC_WORKLOAD_IDENTITY_POOL_ID?.trim() || null;
  const oidcWorkloadIdentityProviderId =
    env.GCP_CV_OCR_OIDC_WORKLOAD_IDENTITY_PROVIDER_ID?.trim() || null;
  const oidcServiceAccountEmail = env.GCP_CV_OCR_OIDC_SERVICE_ACCOUNT_EMAIL?.trim() || null;

  const values = {
    oidcAudience,
    oidcProjectNumber,
    oidcWorkloadIdentityPoolId,
    oidcWorkloadIdentityProviderId,
    oidcServiceAccountEmail,
  };

  if (Object.values(values).some((value) => !value)) {
    return {
      ...values,
      hasOidcConfig: false,
      reason: 'missing_oidc_config',
    };
  }

  if (
    !GCP_PROJECT_NUMBER_PATTERN.test(oidcProjectNumber ?? '') ||
    !WORKLOAD_IDENTITY_ID_PATTERN.test(oidcWorkloadIdentityPoolId ?? '') ||
    !WORKLOAD_IDENTITY_ID_PATTERN.test(oidcWorkloadIdentityProviderId ?? '') ||
    !SERVICE_ACCOUNT_EMAIL_PATTERN.test(oidcServiceAccountEmail ?? '')
  ) {
    return {
      ...values,
      hasOidcConfig: false,
      reason: 'invalid_oidc_config',
    };
  }

  return {
    ...values,
    hasOidcConfig: true,
    reason: null,
  };
}

function emptyOidcConfig(reason: GcpCvOcrUnavailableReason): ReturnType<typeof parseOidcConfig> {
  return {
    oidcAudience: null,
    oidcProjectNumber: null,
    oidcWorkloadIdentityPoolId: null,
    oidcWorkloadIdentityProviderId: null,
    oidcServiceAccountEmail: null,
    hasOidcConfig: false,
    reason,
  };
}

function parseAllowedMimeTypes(value: string | undefined): GcpCvOcrAllowedMimeType[] {
  const rawTypes = value
    ?.split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (!rawTypes?.length) {
    return [...DEFAULT_ALLOWED_MIME_TYPES];
  }

  const parsed = rawTypes.filter((entry): entry is GcpCvOcrAllowedMimeType =>
    ALLOWED_MIME_TYPES.has(entry as GcpCvOcrAllowedMimeType)
  );

  return parsed.length > 0 ? Array.from(new Set(parsed)) : [...DEFAULT_ALLOWED_MIME_TYPES];
}

function unavailableConfig(
  params: Omit<GcpCvOcrConfig, 'available' | 'unavailableReason'> & {
    reason: GcpCvOcrUnavailableReason;
  }
): GcpCvOcrConfig {
  const { reason, ...config } = params;
  return {
    ...config,
    available: false,
    unavailableReason: reason,
  };
}

export function getGcpCvOcrAuthSecret(env: EnvReader = process.env): string | null {
  const secret = env.GCP_CV_OCR_SHARED_SECRET?.trim();
  return secret || null;
}

export function resolveGcpCvOcrConfig(
  env: EnvReader = process.env,
  now: Date = new Date()
): GcpCvOcrConfig {
  const enabled = parseBoolean(env.GCP_CV_OCR_ENABLED, false);
  const maxFileSizeMb = parsePositiveInt(env.GCP_CV_OCR_MAX_FILE_SIZE_MB, DEFAULT_MAX_FILE_SIZE_MB);
  const baseConfig = {
    enabled,
    expiresAt: null,
    baseUrl: null,
    authMode: null,
    maxFileSizeMb,
    maxFileSizeBytes: maxFileSizeMb * 1024 * 1024,
    maxPages: parsePositiveInt(env.GCP_CV_OCR_MAX_PAGES, DEFAULT_MAX_PAGES),
    maxFilesPerRequest: parsePositiveInt(
      env.GCP_CV_OCR_MAX_FILES_PER_REQUEST,
      DEFAULT_MAX_FILES_PER_REQUEST
    ),
    allowedMimeTypes: parseAllowedMimeTypes(env.GCP_CV_OCR_ALLOWED_MIME_TYPES),
    retentionHours: parsePositiveInt(env.GCP_CV_OCR_RETENTION_HOURS, DEFAULT_RETENTION_HOURS),
    userDailyLimit: parsePositiveInt(env.GCP_CV_OCR_USER_DAILY_LIMIT, DEFAULT_USER_DAILY_LIMIT),
    globalDailyLimit: parsePositiveInt(
      env.GCP_CV_OCR_GLOBAL_DAILY_LIMIT,
      DEFAULT_GLOBAL_DAILY_LIMIT
    ),
    hasAuthSecret: Boolean(getGcpCvOcrAuthSecret(env)),
    oidcAudience: null,
    oidcProjectNumber: null,
    oidcWorkloadIdentityPoolId: null,
    oidcWorkloadIdentityProviderId: null,
    oidcServiceAccountEmail: null,
    hasOidcConfig: false,
  } satisfies Omit<GcpCvOcrConfig, 'available' | 'unavailableReason'>;

  if (!enabled) {
    return unavailableConfig({ ...baseConfig, reason: 'disabled' });
  }

  const expiry = parseExpiry(env.GCP_CV_OCR_EXPIRES_AT);
  if (expiry.reason) {
    return unavailableConfig({ ...baseConfig, expiresAt: expiry.expiresAt, reason: expiry.reason });
  }

  if (!expiry.expiresAt || expiry.expiresAt.getTime() <= now.getTime()) {
    return unavailableConfig({ ...baseConfig, expiresAt: expiry.expiresAt, reason: 'expired' });
  }

  const baseUrl = normalizeBaseUrl(env.GCP_CV_OCR_BASE_URL);
  if (baseUrl.reason) {
    return unavailableConfig({
      ...baseConfig,
      expiresAt: expiry.expiresAt,
      reason: baseUrl.reason,
    });
  }

  const authMode = parseAuthMode(env.GCP_CV_OCR_AUTH_MODE);
  if (authMode.reason) {
    return unavailableConfig({
      ...baseConfig,
      expiresAt: expiry.expiresAt,
      baseUrl: baseUrl.baseUrl,
      reason: authMode.reason,
    });
  }

  if (authMode.authMode === 'hmac' && !baseConfig.hasAuthSecret) {
    return unavailableConfig({
      ...baseConfig,
      expiresAt: expiry.expiresAt,
      baseUrl: baseUrl.baseUrl,
      authMode: authMode.authMode,
      reason: 'missing_shared_secret',
    });
  }

  const oidcConfig = parseOidcConfig(env, baseUrl.baseUrl);
  if (authMode.authMode === 'oidc' && oidcConfig.reason) {
    const { reason, ...parsedOidcConfig } = oidcConfig;
    return unavailableConfig({
      ...baseConfig,
      ...parsedOidcConfig,
      expiresAt: expiry.expiresAt,
      baseUrl: baseUrl.baseUrl,
      authMode: authMode.authMode,
      reason,
    });
  }

  const { reason: _oidcReason, ...parsedOidcConfig } = oidcConfig;

  return {
    ...baseConfig,
    ...parsedOidcConfig,
    available: true,
    unavailableReason: null,
    expiresAt: expiry.expiresAt,
    baseUrl: baseUrl.baseUrl,
    authMode: authMode.authMode,
  };
}
