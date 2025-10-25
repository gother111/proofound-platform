# Authentication & Database Connectivity Checkup

## Summary

- Email/password and Google sign-in are currently failing before reaching Supabase because the server client throws when Supabase environment variables are missing.
- All authentication and onboarding flows require a configured site URL and Supabase redirect URLs so that the auth callback (`/auth/callback`) can complete successfully.
- Database-backed features (rate limiting, profiles, org membership, onboarding) depend on a `DATABASE_URL` connection string; without it, the Drizzle client throws and the app cannot read or write data.

## Findings

### 1. Supabase environment variables are mandatory

The Supabase server/browser helpers throw an error when either `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` (or their non-public fallbacks) are absent. Any server action that calls `createClient()` will surface the same "Authentication service is not configured correctly" message you are seeing in the UI because the thrown error matches the pattern handled in `mapUnexpectedAuthError`/`mapUnexpectedOAuthError`.【F:src/lib/supabase/server.ts†L4-L42】【F:src/lib/supabase/client.ts†L3-L21】【F:src/actions/auth.ts†L250-L265】【F:src/actions/auth.ts†L400-L416】

**What to verify:**

- In Vercel (or your hosting provider), confirm that **Production**, **Preview**, and **Development** environments each define `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- If you prefer not to expose the values to the client, you can additionally set `SUPABASE_URL` and `SUPABASE_ANON_KEY`; the helpers accept either set.
- Redeploy after adding the env vars so Next.js picks them up.

### 2. Site URL & Supabase redirect configuration

Sign-up, password reset, and OAuth flows derive their redirect target from `resolveSiteUrl`, which prefers `NEXT_PUBLIC_SITE_URL` but falls back to request headers. Missing or incorrect values lead to Supabase rejecting the OAuth redirect (Google sign-in) or the email confirmation links. The deployment guide documents the expected Supabase Auth URL configuration.【F:src/actions/auth.ts†L40-L114】【F:DEPLOYMENT_GUIDE.md†L253-L265】

**What to verify:**

- Set `NEXT_PUBLIC_SITE_URL` to your deployed domain (e.g., `https://app.proofound.io`). This avoids relying on proxy headers that might be stripped by certain CDNs.
- In Supabase → Authentication → URL Configuration, ensure the Site URL matches `NEXT_PUBLIC_SITE_URL` and that `/auth/callback`, `/reset-password/confirm`, and `/verify-email` are listed under Redirect URLs.
- For Google OAuth, double-check that the provider is enabled in Supabase and that the OAuth consent screen lists the same callback URL.

### 3. Database connection string is required for every request

The shared Drizzle client throws immediately when `DATABASE_URL` is unset. Because rate limiting, onboarding, profile fetching, and organization membership queries all import the shared client, a missing connection string will cause runtime failures even after auth succeeds.【F:src/db/index.ts†L1-L19】【F:src/actions/auth.ts†L70-L139】【F:src/lib/rate-limit.ts†L1-L40】【F:README.md†L67-L113】

**What to verify:**

- Populate `DATABASE_URL` with the "Connection string" from Supabase (use the `?sslmode=require` variant if provided).
- Confirm the value is set in every deploy environment and that it includes credentials for a user with access to your Supabase project's database.
- After configuring the connection, run the migrations/policies outlined in the README to ensure the schema and RLS rules exist in the target database.

### 4. Service role usage & background jobs

While the current codebase does not instantiate a Supabase service-role client directly, some deployment scripts and future features rely on `SUPABASE_SERVICE_ROLE_KEY` (see environment docs). Ensure it is stored securely for upcoming automation and cron jobs, even if unused right now.【F:README.md†L67-L113】【F:DEPLOYMENT_GUIDE.md†L163-L183】

## Next Steps

1. Audit environment variables in your hosting provider for the keys listed above and redeploy after filling any gaps.
2. Validate Supabase Auth settings (Site URL + Redirect URLs) and provider enablement, then retry Google sign-in.
3. Run through the Supabase SQL policies/triggers if the database was recently recreated to guarantee onboarding and organization flows function once auth succeeds.

Let me know once you've had a chance to address these items, and I can help verify or dig deeper if issues persist.
