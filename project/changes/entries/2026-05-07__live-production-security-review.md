# Live Production Security, Infra, and Dependency Review - 2026-05-07

## Scope

- Target: `https://proofound.io` plus the local repository in `/Users/yuriibakurov/proofound`.
- Production testing was non-destructive and low-rate: no brute force, no fuzzing, no account creation, no form submission, no private-data access attempts, no load testing, and no production configuration mutation.
- Reviewed: public headers/routes, protected-route behavior, cron/auth posture, Vercel env presence, CI/deploy workflow evidence, tracked secrets posture, dependency advisories, and source-level security hotspots.

## Bottom line

- No critical/high live exposure was confirmed in the sampled production checks.
- Root production and all-dependency npm audits returned `found 0 vulnerabilities`.
- The separate OCR service npm audit also returned `found 0 vulnerabilities`.
- Two plausible source-level security/privacy issues were found and fixed locally in this pass.
- Production has not been redeployed by this review, so live `proofound.io` may still reflect the pre-fix deployment until the new local commits are pushed/deployed.

## Fixed locally in this pass

1. Start-from-CV oversized upload pre-parse work
   - Risk: authenticated eligible users could force body parsing and base64/materialization work before the configured 5 MB cap was enforced.
   - Fix: `Content-Length` is preflighted before parsing multipart or JSON uploads; the deeper file-size check remains as defense-in-depth.
   - Files:
     - `src/app/api/ai/start-from-cv/_route-helpers.ts`
     - `src/app/api/ai/start-from-cv/sessions/[sessionId]/extract/route.ts`
     - `tests/api/start-from-cv-route.test.ts`

2. Break-glass reason in URL query strings
   - Risk: sensitive incident/admin context could leak through browser history, CDN/proxy logs, referrers, screenshots, or analytics.
   - Fix: break-glass reasons are accepted only from headers.
   - Files:
     - `src/lib/authz/admin-break-glass.ts`
     - `tests/lib/admin-break-glass.test.ts`

3. Framework hint header
   - Risk: live responses expose `x-powered-by: Next.js`.
   - Fix: `poweredByHeader: false` added for future deployments.
   - File: `next.config.js`

4. OCR service deterministic install
   - Risk: the Cloud Run OCR service Docker build used `npm install --omit=dev` and optional lockfile handling.
   - Fix: Docker build now copies the lockfile explicitly and uses `npm ci --omit=dev`.
   - File: `services/gcp-cv-ocr/Dockerfile`

5. Missing vulnerability disclosure contact
   - Risk: `/.well-known/security.txt` and `/security.txt` returned `404` in production.
   - Fix: both routes now serve a text security contact file with a canonical URL, expiry, preferred language, and policy link.
   - Files:
     - `src/lib/security-txt.ts`
     - `src/app/.well-known/security.txt/route.ts`
     - `src/app/security.txt/route.ts`
     - `tests/api/security-txt-route.test.ts`

6. Broad production CSP allowances
   - Risk: production CSP allowed broad `img-src https:`, `connect-src https: wss:`, and `font-src https:` sources.
   - Fix: production CSP now names the known launch providers for Supabase, Crisp, Google Fonts, and the current landing image host instead of blanket HTTPS/WSS allowances.
   - Files:
     - `src/middleware.ts`
     - `src/lib/__tests__/security-headers.test.ts`
     - `e2e/csp-production.spec.ts`

7. Duplicate CSRF cookie on admin redirect
   - Risk: `/admin` returned duplicate identical `Set-Cookie: csrf_token=...` headers while redirecting to `/403`.
   - Fix: middleware no longer mints page-load CSRF cookies for the admin corridor and no longer re-issues unchanged CSRF cookies on page/API pass-through.
   - Files:
     - `src/middleware.ts`
     - `src/lib/__tests__/middleware-csrf.test.ts`

8. Production deploy workflow gate
   - Risk: repo-visible production retry deploy workflow did not rerun the strict MVP release gate before deploying prebuilt output.
   - Fix: `retry-vercel-deploy.yml` now runs `scripts/run-mvp-strict-gates.mjs` before the production build/deploy path.
   - File: `.github/workflows/retry-vercel-deploy.yml`

9. GitHub Actions mutable tag pinning
   - Risk: workflow actions were pinned to mutable major tags.
   - Fix: workflow actions are pinned to current upstream `v4` commit SHAs for `actions/checkout`, `actions/setup-node`, and `actions/upload-artifact`.
   - Files:
     - `.github/workflows/accessibility.yml`
     - `.github/workflows/cancel-stale-vercel-deployments.yml`
     - `.github/workflows/ci.yml`
     - `.github/workflows/playwright.yml`
     - `.github/workflows/release-candidate.yml`
     - `.github/workflows/retry-vercel-deploy.yml`
     - `.github/workflows/strict-quality.yml`

10. Migration source-of-truth confusion
    - Risk: `supabase/migrations` could be mistaken for the current RLS/migration authority.
    - Fix: a README now marks that directory as a legacy Supabase CLI snapshot and points to canonical runtime migration sources.
    - File: `supabase/migrations/README.md`

## Live production evidence

- `GET /` returned `200` on Vercel with HSTS preload, CSP, frame denial, `nosniff`, strict referrer policy, restrictive permissions policy, and a secure `HttpOnly` `SameSite=strict` CSRF cookie.
- `GET /api/health` returned only `{"status":"ok","timestamp":"..."}` with no build id, secrets, or env data.
- Protected unauthenticated checks returned closed states:
  - `/app/i/profile`, `/app/i/verifications`, `/app/i/portfolio`: `307` to `/login`
  - `/admin`: `307` to `/403`
  - `/api/user/export`, `/api/data-export`: `401`
  - archived/non-launch APIs such as `/api/mobile/v1/bootstrap`: `410`
  - `GET /api/upload/document`: `405`
- Cron endpoints returned `401` without an internal secret. Vercel preflight confirmed required production env presence, including `CRON_SECRET`; official Vercel docs state `CRON_SECRET` is sent as the `Authorization` bearer header for cron invocations: https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs.
- CORS spot checks on protected/upload APIs did not echo a permissive `Access-Control-Allow-Origin`.

## Remaining findings / risks

1. Production deployment pending
   - Local fixes are not automatically live. `proofound.io` still reflected the pre-fix deployment during the review.

2. CSP provider compatibility should be watched after deploy
   - The tightened CSP intentionally removes blanket HTTPS/WSS allowances. Browser verification should confirm that Crisp, Supabase-backed images, public portfolio images, and any intentionally supported external logo/avatar sources still render/connect as expected.

3. GitHub branch protection remains unverified
   - Repo-visible checks are stronger after this pass, but local `gh` auth is invalid, so live required-check/branch-protection settings could not be verified.

## Dependency and secrets review

- `npm run audit:prod`: passed, `found 0 vulnerabilities`.
- `npm run audit:all`: passed, `found 0 vulnerabilities`.
- `services/gcp-cv-ocr npm audit --omit=dev --audit-level=high`: passed, `found 0 vulnerabilities`.
- Tracked env exposure:
  - Only `.env.example` is tracked from `.env*`.
  - `.env`, `.env.local`, `.env.test`, and `.vercel` are ignored.
  - Secret-pattern search found placeholder/example strings in docs and seed/reference material, not tracked local env files.

## Verification run

- `npm run test -- tests/api/start-from-cv-route.test.ts tests/lib/admin-break-glass.test.ts tests/api/admin-organizations-verify-route.test.ts tests/api/org-audit-export-routes.test.ts` - passed, 15 tests.
- `npm run test:launch:ai` - passed, 116 tests.
- `npm run test -- tests/api/security-txt-route.test.ts src/lib/__tests__/middleware-csrf.test.ts src/lib/__tests__/security-headers.test.ts tests/ui/pilot-packaging-guardrails.test.tsx tests/ui/step4-practicals-location-autocomplete.test.tsx tests/ui/volunteer-form-skill-picker.test.tsx` - passed, 36 tests.
- `npm run lint` - passed.
- `npm run typecheck` - passed.
- `npm run docs:freshness` - passed.
- `npm run vercel:preflight` - passed after network approval; verified project link, production branch, and required env key presence without printing secret values.
- `git ls-remote` checks confirmed the pinned `actions/checkout`, `actions/setup-node`, and `actions/upload-artifact` SHAs match the current upstream `v4` tags as of 2026-05-07.

## Not performed

- No destructive/live exploit testing.
- No authenticated real-user journey pentest against production accounts.
- No brute force, rate-limit stress, fuzzing, or load testing.
- No direct inspection of production database rows or private user data.
- No GitHub branch-protection API verification because the local `gh` token is invalid.
