/**
 * Prints a friendly checklist of missing env vars. Never exits non-zero
 * unless FORCE_STRICT_DEPLOY_CHECK=true (so restricted CI won’t break).
 */
const env = process.env;
const missing = [];
const warnings = [];

if (!(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL)) missing.push('NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL');
if (!(env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY)) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY/SUPABASE_ANON_KEY');
if (!(env.NEXT_PUBLIC_SITE_URL || env.SITE_URL)) missing.push('NEXT_PUBLIC_SITE_URL/SITE_URL');
if (!env.DATABASE_URL) missing.push('DATABASE_URL');

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
  if (process.env.FORCE_STRICT_DEPLOY_CHECK === 'true') process.exit(1);
} else {
  console.log('✅ Deploy readiness: all required env vars present.');
}

if (warnings.length) {
  console.warn('⚠️ Deploy readiness warning:\n - ' + warnings.join('\n - '));
}
