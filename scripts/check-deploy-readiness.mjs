/**
 * Prints a friendly checklist of missing env vars. Exits non-zero in strict
 * mode or production deploys so launch cannot proceed with mock DB/admin modes.
 */
import { config as loadEnv } from 'dotenv';
import { listClientExposedAiSecretKeys } from './lib/client-exposed-ai-secrets.mjs';

loadEnv({ path: '.env.local', quiet: true });
loadEnv({ quiet: true });

const env = process.env;
const missing = [];
const failures = [];
const warnings = [];

const truthy = (value) =>
  ['true', '1', 'yes', 'on'].includes(
    String(value ?? '')
      .trim()
      .toLowerCase()
  );
const positiveNumber = (value) => {
  const parsed = Number(String(value ?? '').trim());
  return Number.isFinite(parsed) && parsed > 0;
};
const productionDeployDetected =
  String(env.NODE_ENV ?? '')
    .trim()
    .toLowerCase() === 'production' ||
  String(env.VERCEL_ENV ?? '')
    .trim()
    .toLowerCase() === 'production' ||
  String(env.NEXT_PUBLIC_APP_ENV ?? '')
    .trim()
    .toLowerCase() === 'production' ||
  String(env.APP_ENV ?? '')
    .trim()
    .toLowerCase() === 'production';
const stagingDeployDetected =
  String(env.VERCEL_ENV ?? '')
    .trim()
    .toLowerCase() === 'preview' ||
  String(env.NEXT_PUBLIC_APP_ENV ?? '')
    .trim()
    .toLowerCase() === 'staging' ||
  String(env.APP_ENV ?? '')
    .trim()
    .toLowerCase() === 'staging';
const strict =
  env.FORCE_STRICT_DEPLOY_CHECK === 'true' || productionDeployDetected || stagingDeployDetected;
const liveDeployDetected = productionDeployDetected || stagingDeployDetected;
const exposedAiSecretKeys = listClientExposedAiSecretKeys(env);

const enabledMockModes = [];
if (truthy(env.NEXT_PUBLIC_USE_MOCK_SUPABASE))
  enabledMockModes.push('NEXT_PUBLIC_USE_MOCK_SUPABASE');
if (truthy(env.MOCK_ORG_MODE)) enabledMockModes.push('MOCK_ORG_MODE');
if (truthy(env.MOCK_ADMIN_MODE)) enabledMockModes.push('MOCK_ADMIN_MODE');
if (truthy(env.MOBILE_MOCK_AUTH)) enabledMockModes.push('MOBILE_MOCK_AUTH');
const mockPlatformRole = String(env.MOCK_PLATFORM_ROLE ?? '').trim();
if (mockPlatformRole === 'platform_admin' || mockPlatformRole === 'super_admin') {
  enabledMockModes.push('MOCK_PLATFORM_ROLE');
}

if (!(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL))
  missing.push('NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL');
if (!(env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY))
  missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY/SUPABASE_ANON_KEY');
if (!env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
if (!(env.NEXT_PUBLIC_SITE_URL || env.SITE_URL)) missing.push('NEXT_PUBLIC_SITE_URL/SITE_URL');
if (!env.DATABASE_URL) missing.push('DATABASE_URL');

if (strict && !env.RESEND_API_KEY) {
  missing.push('RESEND_API_KEY');
}

if ((productionDeployDetected || stagingDeployDetected) && !env.KV_REST_API_URL) {
  missing.push('KV_REST_API_URL');
}

if ((productionDeployDetected || stagingDeployDetected) && !env.KV_REST_API_TOKEN) {
  missing.push('KV_REST_API_TOKEN');
}

if (strict && enabledMockModes.length) {
  failures.push(
    `Strict deploy checks must not enable mock database/admin/auth modes: ${enabledMockModes.join(', ')}`
  );
}

if (strict && exposedAiSecretKeys.length) {
  failures.push(
    `Strict deploy checks must not configure client-exposed AI provider secrets: ${exposedAiSecretKeys.join(', ')}`
  );
}

if (strict && truthy(env.PROOFOUND_SKIP_TRANSACTIONAL_EMAIL_DELIVERY)) {
  failures.push(
    'Strict deploy checks must not skip transactional email delivery: PROOFOUND_SKIP_TRANSACTIONAL_EMAIL_DELIVERY'
  );
}

const enabledDebugIngest = [
  truthy(env.DEBUG_INGEST_ENABLED) ? 'DEBUG_INGEST_ENABLED' : null,
  env.DEBUG_INGEST_URL ? 'DEBUG_INGEST_URL' : null,
  env.NEXT_PUBLIC_DEBUG_INGEST_URL ? 'NEXT_PUBLIC_DEBUG_INGEST_URL' : null,
].filter(Boolean);

if (strict && enabledDebugIngest.length) {
  failures.push(
    `Strict deploy checks must not enable debug ingest sinks: ${enabledDebugIngest.join(', ')}`
  );
}

const enabledLocalSmokeFlags = [
  truthy(env.PROOFOUND_LOCAL_SMOKE_RATE_LIMIT_FALLBACK)
    ? 'PROOFOUND_LOCAL_SMOKE_RATE_LIMIT_FALLBACK'
    : null,
  truthy(env.PROOFOUND_LOCAL_SMOKE_ALLOW_INSECURE_CSRF_COOKIE)
    ? 'PROOFOUND_LOCAL_SMOKE_ALLOW_INSECURE_CSRF_COOKIE'
    : null,
].filter(Boolean);

if (liveDeployDetected && enabledLocalSmokeFlags.length) {
  failures.push(
    `Live deploy checks must not enable local smoke fallbacks: ${enabledLocalSmokeFlags.join(', ')}`
  );
}

if (truthy(env.GCP_CV_OCR_ENABLED)) {
  const requiredGcpOcr = [
    'GCP_CV_OCR_EXPIRES_AT',
    'GCP_CV_OCR_MAX_PAGES',
    'GCP_CV_OCR_MAX_FILE_SIZE_MB',
    'GCP_CV_OCR_MAX_FILES_PER_REQUEST',
    'GCP_CV_OCR_USER_DAILY_LIMIT',
    'GCP_CV_OCR_GLOBAL_DAILY_LIMIT',
    'GCP_CV_OCR_HARD_BUDGET_CAP_SEK',
    'GCP_CV_OCR_AUTH_MODE',
    'GCP_CV_OCR_RETENTION_HOURS',
    'GCP_CV_OCR_CLOUD_RUN_MAX_INSTANCES',
  ];

  for (const key of requiredGcpOcr) {
    if (!env[key]) missing.push(key);
  }

  if (!truthy(env.GCP_CV_OCR_BUDGET_ALERT_CONFIGURED)) {
    failures.push('GCP OCR is enabled without budget alert confirmation.');
  }

  if (!truthy(env.GCP_CV_OCR_CLOUD_RUN_MAX_INSTANCES_DOCUMENTED)) {
    failures.push('GCP OCR is enabled without Cloud Run max instance documentation.');
  }

  if (truthy(env.GCP_CV_OCR_CLOUD_RUN_PUBLIC_INVOCATION)) {
    failures.push('GCP OCR Cloud Run public invocation must be disabled.');
  }

  if (['vision', 'gcp_vision', 'cloud_vision'].includes(String(env.GCP_CV_OCR_PROVIDER ?? '').trim().toLowerCase())) {
    failures.push('GCP OCR must not use the Cloud Vision provider for this beta.');
  }

  if (truthy(env.GCP_CV_OCR_BUDGET_CAP_EXHAUSTED)) {
    failures.push('GCP OCR hard budget cap is exhausted; keep OCR disabled.');
  }

  if (env.GCP_CV_OCR_CLOUD_RUN_MAX_INSTANCES && Number(env.GCP_CV_OCR_CLOUD_RUN_MAX_INSTANCES) > 3) {
    failures.push('GCP OCR Cloud Run max instances must be 3 or lower during beta.');
  }

  if (env.GCP_CV_OCR_HARD_BUDGET_CAP_SEK && !positiveNumber(env.GCP_CV_OCR_HARD_BUDGET_CAP_SEK)) {
    failures.push('GCP_CV_OCR_HARD_BUDGET_CAP_SEK must be a positive number.');
  }
}

const hasGoogleCreds = Boolean(env.GOOGLE_CLIENT_ID) && Boolean(env.GOOGLE_CLIENT_SECRET);

const googleRedirectPath = (() => {
  try {
    const value = env.GOOGLE_REDIRECT_URI;
    if (!value) return null;
    if (value.startsWith('/')) return value;
    return new URL(value).pathname;
  } catch {
    return null;
  }
})();

if (hasGoogleCreds && !env.GOOGLE_REDIRECT_URI) {
  warnings.push(
    'GOOGLE_REDIRECT_URI is not set. Google OAuth may fail with redirect_uri mismatch.'
  );
}

if (googleRedirectPath === '/api/auth/google/callback') {
  warnings.push(
    'GOOGLE_REDIRECT_URI points to legacy /api/auth/google/callback. Prefer /api/integrations/google/callback.'
  );
}

if (missing.length) {
  console.warn('⚠️ Deploy readiness check: missing env vars:\n - ' + missing.join('\n - '));
  console.warn('See docs/deployment-guide.md for setup steps.');
} else {
  console.log('✅ Deploy readiness: all required env vars present.');
}

if (failures.length) {
  console.error('❌ Deploy readiness failure:\n - ' + failures.join('\n - '));
}

if (warnings.length) {
  console.warn('⚠️ Deploy readiness warning:\n - ' + warnings.join('\n - '));
}

if (strict && (missing.length || failures.length)) {
  process.exit(1);
}
