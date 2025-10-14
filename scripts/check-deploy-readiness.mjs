/**
 * Prints a friendly checklist of missing env vars. Never exits non-zero
 * unless FORCE_STRICT_DEPLOY_CHECK=true (so restricted CI won’t break).
 */
const required = [
  'NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY)',
  'NEXT_PUBLIC_SITE_URL',
  'DATABASE_URL'
];

const env = process.env;
const missing = [];

if (!(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL)) missing.push('NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL');
if (!(env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY)) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY/SUPABASE_ANON_KEY');
if (!env.NEXT_PUBLIC_SITE_URL) missing.push('NEXT_PUBLIC_SITE_URL');
if (!env.DATABASE_URL) missing.push('DATABASE_URL');

if (missing.length) {
  console.warn('⚠️ Deploy readiness check: missing env vars:\n - ' + missing.join('\n - '));
  console.warn('See DEPLOYMENT_GUIDE.md for setup steps.');
  if (process.env.FORCE_STRICT_DEPLOY_CHECK === 'true') process.exit(1);
} else {
  console.log('✅ Deploy readiness: all required env vars present.');
}
