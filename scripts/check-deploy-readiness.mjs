/**
 * Prints a friendly checklist of missing env vars. Exits non-zero in strict
 * mode or production deploys so launch cannot proceed with mock DB/admin modes.
 */
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
const strict = env.FORCE_STRICT_DEPLOY_CHECK === 'true' || productionDeployDetected;

const enabledMockModes = [];
if (truthy(env.NEXT_PUBLIC_USE_MOCK_SUPABASE))
  enabledMockModes.push('NEXT_PUBLIC_USE_MOCK_SUPABASE');
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

if (productionDeployDetected && enabledMockModes.length) {
  failures.push(
    `Production deploys must not enable mock database/admin/auth modes: ${enabledMockModes.join(', ')}`
  );
}

const hasLinkedInCreds = Boolean(env.LINKEDIN_CLIENT_ID) && Boolean(env.LINKEDIN_CLIENT_SECRET);
const hasGoogleCreds = Boolean(env.GOOGLE_CLIENT_ID) && Boolean(env.GOOGLE_CLIENT_SECRET);
const hasZoomCreds = Boolean(env.ZOOM_CLIENT_ID) && Boolean(env.ZOOM_CLIENT_SECRET);

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

if (hasLinkedInCreds && !env.LINKEDIN_REDIRECT_URI) {
  warnings.push(
    'LINKEDIN_REDIRECT_URI is not set. LinkedIn OAuth may fail with redirect_uri mismatch.'
  );
}

if (hasGoogleCreds && !env.GOOGLE_REDIRECT_URI) {
  warnings.push(
    'GOOGLE_REDIRECT_URI is not set. Google OAuth may fail with redirect_uri mismatch.'
  );
}

if (hasZoomCreds && !env.ZOOM_REDIRECT_URI) {
  warnings.push('ZOOM_REDIRECT_URI is not set. Zoom OAuth may fail with redirect_uri mismatch.');
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
