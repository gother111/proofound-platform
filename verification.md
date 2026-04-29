> Doc Class: `governance`
> Sync Pair: `verification.md`
> Last Verified: `2026-04-29`

# Verification Checklist (Before Merging)

Repo Truth items include citations like `(source: README.md)`. Anything else is guidance/policy.

## Always (Most PRs)

- Ensure the diff is scoped and intentional.
- Lint: `npm run lint` (source: package.json)
  - Note: lint uses `scripts/lint-or-skip.js`; ensure lint actually ran when required. (source: scripts/lint-or-skip.js)
- Typecheck: `npm run typecheck` (source: package.json)
- Unit tests: `npm run test` (source: package.json)
- Build: `npm run build` (source: package.json)
- If changes touch `/api/mobile/v1/*` routes, run focused contract tests in addition to full unit tests:
  - `npm run test -- tests/api/mobile-bootstrap-route.test.ts tests/api/mobile-device-token-route.test.ts`
- If changes touch auth, RLS, policies, migrations, or privacy-sensitive API contracts:
  - Run `npm run db:migrate` first when there are unapplied SQL migrations so privacy tests validate current policy/trigger state.
  - Run `npm run test:privacy` and `npm run test:privacy:extended` sequentially (not in parallel) to avoid shared test-infra contention.

## Branch Governance (master)

- Merge policy: use pull requests only, no direct pushes.
- Required checks on `master`: `ci`, `a11y`.
- Require branch to be up-to-date with `master` before merge.
- Require at least 1 approval and dismiss stale approvals after new commits.
- Require conversation resolution before merge.
- Enforce for administrators, block force pushes, block branch deletion.
- Merge strategy: squash only, with branch auto-delete on merge.

## PR Scope Discipline

- Keep default PR scope at `<=20` files unless explicitly declared as a large change.
- Legacy shared log files are history/index surfaces and should stay out of feature PRs:
  - `agent/scratchpad.md`
  - `project/Documentation.md`
- Use sharded log entries for routine updates:
  - `agent/scratchpad/entries/*.md`
  - `project/changes/entries/*.md`
- CI enforces shared log scope via `scripts/check-shared-log-files.mjs`.

## Landing Guardrail (Required When Landing Files Change)

- Canonical baseline is commit `af705d4`.
- If a PR touches any landing-sensitive path, it must be a dedicated landing PR.
- Landing-sensitive paths:
  - `src/app/page.tsx`
  - `src/app/globals.css`
  - `src/app/layout.tsx`
  - `src/components/ProofoundLanding.tsx`
  - `src/components/landing/**`
- Required checks for landing-touching PRs:
  - `npm run test:e2e:landing`
  - `npm run test:e2e:landing:visual`
- CI enforces scope isolation for landing-sensitive changes through:
  - `scripts/check-landing-pr-scope.mjs`

## Vercel Parity (When Deploy Might Break)

- Ensure Node version matches `.nvmrc`/engines (source: .nvmrc, package.json)
- Run `npm run vercel:preflight` to validate canonical Vercel linkage, production branch, and required env key presence.
- Optional drift report between projects: `npm run vercel:env-parity`
- Pull production project/env settings (creates `.vercel/`, which is gitignored): `npx vercel@latest pull --yes --environment=production` (source: .gitignore)
- Run a prod-equivalent build locally: `npx vercel@latest build --prod`
  - If CLI auth is missing, use `--token` with a valid `VERCEL_TOKEN` (do not print it).

## Production Sync Guard (Vercel Quota Recovery)

- Auto-retry workflow location:
  - `.github/workflows/retry-vercel-deploy.yml`
- Required GitHub secret:
  - `VERCEL_DEPLOY_HOOK_URL` (production deploy hook URL for `proofound-platform`)
- Validate live commit after pushing to `master`:
  - `curl -sS https://proofound.io/api/health`
  - Expect `version` in response to match the latest `master` commit SHA.
- If production is behind, trigger manual retry once:
  - `gh workflow run "Retry Vercel Deploy Until Synced" --ref master`
- Confirm latest workflow run:
  - `gh run list --workflow "Retry Vercel Deploy Until Synced" --limit 1`

## CI Gate Parity (When Appropriate)

- Strict MVP gate bundle (local parity): `npm run gates:mvp:strict`
- Current strict required gate stack:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`
  - `npm run test:e2e:landing`
  - `npm run test:e2e:auth:real`
  - `npm run test:a11y:strict`
  - `npm run test:strict:quality`
  - `npm run test:e2e:individual:strict`
  - `npm run test:e2e:org:strict`
  - `npm run test:e2e:privacy:strict`
  - `npm run test:e2e:providers:strict`
  - `BASE_URL=http://localhost:3000 npm run perf:budgets`
  - `BASE_URL=http://localhost:3000 SUS_STUDY_COMPLETE=true npm run go:no-go`
- CI also runs perf budgets and go/no-go gates after starting the app. (source: .github/workflows/ci.yml)
- Perf budgets: `BASE_URL=http://localhost:3000 npm run perf:budgets` (source: scripts/perf-budgets.mjs)
- Go/no-go: `BASE_URL=http://localhost:3000 SUS_STUDY_COMPLETE=true npm run go:no-go` (source: scripts/go-no-go-check.mjs)
  - TODO: Ensure required evidence files exist before relying on this gate; do not invent missing evidence. (source: scripts/go-no-go-check.mjs)

## Migration and Data Safety (Before Production DDL)

- Create a checkpoint: `npm run db:backup:checkpoint`
- Reconcile canonical migration ledger: `npm run db:audit:migrations`
- Optional strict legacy baseline parity audit: `npm run db:audit:migrations -- --mode legacy-supabase-baseline --baseline supabase/ledger-baseline/schema_migrations.current-db.json`
- Diagnostics-only legacy file inventory audit: `npm run db:audit:migrations -- --mode legacy-supabase`
- Apply production schema changes through ordered SQL under `src/db/migrations/*.sql` and apply with `npm run db:migrate` (prefer `DIRECT_URL` for DDL).
- Do not run `npm run db:push` against production.

## E2E / Accessibility (If You Touched Critical UX)

- E2E: `npm run test:e2e` (source: package.json)
- Auth real contract (launch gate): `npm run test:e2e:auth:real` (source: package.json)
- Auth mock contract (non-blocking local feedback): `npm run test:e2e:auth:mock` (source: package.json)
- A11y strict contract (launch gate): `npm run test:a11y:strict` (source: package.json)
- A11y mock contract (non-blocking local feedback): `npm run test:a11y` (source: package.json)
- Individual strict flow contract: `npm run test:e2e:individual:strict` (source: package.json)
- Organization strict flow contract: `npm run test:e2e:org:strict` (source: package.json)
- Privacy strict flow contract: `npm run test:e2e:privacy:strict` (source: package.json)
- Provider strict flow contract: `npm run test:e2e:providers:strict` (source: package.json)
- Playwright env hygiene (practical):
  - Strict suites load `.env.local` by default (override with `STRICT_ENV_FILE=<path>` when needed).
  - Set `PII_HASH_SALT` when running auth/signup flows to avoid GDPR hashing runtime failures.
  - Run Playwright suites sequentially when they share the same `webServer` port to avoid `EADDRINUSE` startup failures.
  - Strict launch-gate runs must keep `NEXT_PUBLIC_USE_MOCK_SUPABASE=false`.
  - Provider strict gate defaults to `STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=true` and `STRICT_PROVIDER_E2E_REQUIRE_BOTH=true`.
  - Provider strict gate requires deterministic provider user env vars: `E2E_PROVIDER_USER_ID`, `E2E_PROVIDER_USER_EMAIL`, `E2E_PROVIDER_USER_PASSWORD`.
  - Deterministic provider user must have both Zoom and Google connected for launch-gate runs.
- For credential-gated E2E smokes, document required env vars in `project/changes/entries/*.md` and mark command outcome as PASS/SKIPPED with reason.

## Manual Smoke Checks (OAuth Integrations)

- Zoom connect:
  - Visit `/app/i/settings/integrations`
  - Click "Connect Zoom" and confirm you are redirected to Zoom and then back with `?success=zoom_connected`.
- Meeting creation:
  - Schedule an interview with `platform=zoom` and confirm the record has `meeting_link` populated.

## Manual Smoke Checks (Auth Email via Supabase SMTP)

- Trigger signup from `/signup` with a fresh email and confirm UI reaches "Check your email" success state.
- Trigger forgot password from `/reset-password` with a known account and confirm UI reaches success state.
- Confirm delivery path in logs:
  - Supabase Auth logs (signup confirmation + recovery emails)
  - Resend logs for sender `no-reply@proofound.io`
- If Supabase SMTP send fails (`Error sending confirmation email` or `Error sending recovery email`), verify fallback delivery:
  - Supabase admin `generateLink(...)` succeeded
  - Resend API send succeeded for the generated action link
  - Recipient receives a valid Supabase verify/recovery link.

## Manual Smoke Checks (Profile Sharing)

- Health endpoint:
  - `curl -sS https://proofound.io/api/health`
  - Expect `status=healthy` and current deployed commit in response version.
- Public snippet route fallback:
  - Open `/p/<invalid-token>` and confirm invalid/expired fallback renders without 500 errors.
  - Open `/p/<invalid-token>/embed` and confirm response succeeds and includes embed-friendly framing policy (`frame-ancestors *`).
- Auth/CSRF enforcement:
  - `POST /api/profile/snippet` without auth/CSRF should fail (`403` expected for missing CSRF).

## Husky / lint-staged Policy

- If hooks fail, fix only what affects the intended change set.
- Do not use `git commit --no-verify` unless explicitly approved.
