> Doc Class: `governance`
> Sync Pair: `verification.md`
> Last Verified: `2026-05-21`

# Verification Checklist (Before Merging)

Repo Truth items include citations like `(source: README.md)`. Anything else is guidance/policy.

## Always (Most PRs)

- Ensure the diff is scoped and intentional.
- Clean install: `npm ci` (source: package.json, package-lock.json, .nvmrc, .npmrc)
  - The launch-gate runtime is Node `24.15.0` / npm `11.12.1`; `.npmrc` enables engine-strict so unsupported Node versions fail closed.
- Dependency audit:
  - Production threshold: `npm run audit:prod` (source: package.json)
  - All scopes threshold: `npm run audit:all` (source: package.json)
  - Both fail on high or critical advisories. Keep `npm audit --omit=dev --json` at zero before treating the launch dependency surface as clean.
- Lint: `npm run lint` (source: package.json)
  - Note: lint uses `scripts/lint-or-skip.js`; ensure lint actually ran when required. (source: scripts/lint-or-skip.js)
- Typecheck: `npm run typecheck` (source: package.json)
- Unit tests: `npm run test` (source: package.json)
  - Default `npm run test` runs through `scripts/run-vitest-with-timeout.mjs` and fails with exit code `124` if Vitest exceeds `PROOFOUND_VITEST_TIMEOUT_MS` (default `120000` ms).
  - Archived/removed non-MVP tests stay out of the default gate; run `npm run test:archived:non-launch` when that history is relevant.
  - Slow benchmark/quality suites are explicit non-launch checks: `npm run test:slow:non-launch`.
  - Launch-focused Vitest groups: `npm run test:launch:upload`, `npm run test:launch:privacy`, `npm run test:launch:routes`, `npm run test:launch:org-corridor`, `npm run test:launch:portfolio`, and `npm run test:launch:workflow`.
- Build: `npm run build` (source: package.json)
  - Prebuild cleanup deletes stale generated `.next`, `.next-dev-*`, and `tsconfig.tsbuildinfo` state by default so launch validation does not accumulate large artifact archives.
  - It keeps only a small latest-run summary at `.artifacts/stale-build-state-cleanup-summary.md`.
  - If a failing generated build state must be preserved for debugging, opt in for that run with `PROOFOUND_ARCHIVE_STALE_BUILD_STATE=1 npm run build`.
  - Run `npm run typecheck` and `npm run build` sequentially, not in parallel, because both write under `.next/`.
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
  - `npm ci`
  - `npm run audit:prod`
  - `npm run audit:all`
  - `npx playwright install --with-deps chromium`
  - `npm run docs:freshness`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run test:api:focused`
  - `npm run test:privacy`
  - `npm run test:privacy:extended`
  - `npm run deploy:readiness:strict`
  - `npm run build`
  - `npm run test:launch:smoke`
  - `npm run test:e2e:landing`
  - `npm run test:e2e:auth:real`
  - `npm run test:a11y:strict`
  - `npm run test:strict:quality`
  - `npm run test:e2e:individual:strict`
  - `npm run test:e2e:org:strict`
  - `npm run test:e2e:privacy:strict`
  - `npm run test:e2e:providers:advisory` only if connected-provider scheduling is intentionally in scope for the target
  - `BASE_URL=<production-candidate-url> npm run perf:budgets`
  - `BASE_URL=<production-candidate-url> npm run monitor:launch`
  - `BASE_URL=<production-candidate-url> npm run launch:status`
  - `BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run go:no-go`
- For protected launch-status and go/no-go checks, `INTERNAL_API_SECRET=<secret>` may replace
  `CRON_SECRET=<secret>`.
- CI also runs perf budgets and go/no-go gates after starting the app. (source: .github/workflows/ci.yml)
- Perf budgets: `BASE_URL=<production-candidate-url> npm run perf:budgets` (source: scripts/perf-budgets.mjs)
- Launch smoke artifact: `BASE_URL=<production-candidate-url> npm run test:launch:smoke` (source: package.json, scripts/launch-smoke-runner.ts)
- Launch synthetic monitors: `BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run monitor:launch` (source: package.json, scripts/run-launch-synthetic-monitors.ts)
- Go/no-go: `BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run go:no-go` (source: scripts/go-no-go-check.ts)
  - Requires a fresh launch smoke artifact, healthy `/api/monitoring/perf-status`, healthy `/api/monitoring/launch-status`, required evidence files, required safe-mode flags, and restore-drill assets. (source: scripts/go-no-go-check.ts)

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
- Provider advisory flow contract: `npm run test:e2e:providers:advisory` (source: package.json)
- Playwright env hygiene (practical):
  - Strict suites load `.env.local` by default (override with `STRICT_ENV_FILE=<path>` when needed).
  - Set `PII_HASH_SALT` when running auth/signup flows to avoid GDPR hashing runtime failures.
  - Run Playwright suites sequentially when they share the same `webServer` port to avoid `EADDRINUSE` startup failures.
  - Strict launch-gate runs must keep `NEXT_PUBLIC_USE_MOCK_SUPABASE=false`.
  - Provider advisory gate defaults to `STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=false`.
  - Deterministic provider user env vars (`E2E_PROVIDER_USER_ID`, `E2E_PROVIDER_USER_EMAIL`, `E2E_PROVIDER_USER_PASSWORD`) are required only when `STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=true`.
  - Connected-provider runs should use only provider flows intentionally in scope for the target; manual-link interview posture remains the locked MVP default.
- For credential-gated E2E smokes, document required env vars in `project/changes/entries/*.md` and mark command outcome as PASS/SKIPPED with reason.

## Manual Smoke Checks (Interview Scheduling)

- Manual-link scheduling:
  - Schedule an interview with a manual meeting link.
  - Confirm the visible interview and API record show the meeting link without presenting native Zoom/video OAuth as a launch requirement.
- Provider-connected scheduling:
  - Run only for provider flows intentionally configured for the target.
  - If a provider is unavailable, the UI must clearly preserve the manual-link fallback.

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

## Manual Smoke Checks (Document AI Proof Artifact OCR Beta)

Before any staging Cloud Run OCR call:

- Confirm Google Cloud Billing credit expiration was verified live in the Google Cloud Console during this smoke pass.
- Confirm covered products were verified live for the exact sandbox path: Cloud Run, Document AI, Cloud Storage if used, Secret Manager if used, Cloud Logging, and Cloud Monitoring.
- Confirm budget alerts are configured for the sandbox project before the first billable call, then test the alert route or notification recipient and record the test evidence in local/operator notes.
- Confirm app/service-level hard caps are configured and tested before any Document AI call. Google Cloud budgets are alerts only, not hard caps.
- Confirm the GCP project ID is recorded only in local/operator documentation and trusted deployment configuration. Do not hardcode it in product code, public docs, browser env, test fixtures, or committed smoke artifacts if it is sensitive.
- Confirm production remains disabled unless explicitly approved for invite-only Proof Artifact Text Extraction beta: `GCP_CV_OCR_ENABLED=false` in production and no production credential, endpoint, processor, or bucket value is created or changed for synthetic smoke.
- Confirm staging/preview is enabled only for synthetic PDFs and only after billing, product coverage, budget alert, app-level hard-cap, and cleanup gates are ready.
- Confirm OCR requires explicit consent per document.
- Confirm OCR output is draft text only and cannot auto-publish, auto-verify, auto-score, auto-rank, shortlist, recommend, or change match, review, verification, reveal, trust-state, or workflow-decision state.
- Confirm Cloud Run max instances is `1` initially and no more than `3` during beta.
- Confirm the disable-or-pay decision is scheduled by `2026-07-24` because credits expire around `2026-08-03`.
- Confirm Cloud Vision OCR is not enabled.

Required staging smoke:

- Upload or submit exactly one synthetic one-page PDF with no real names, emails, phone numbers, addresses, employer names, customer names, CV history, pilot data, filenames, or storage paths.
- Confirm synthetic one-page PDF extraction succeeds through the staging sandbox and returns only schema-valid extracted text plus safe metadata.
- Set `GCP_CV_OCR_ENABLED=false`, redeploy or refresh staging config as required, and confirm the feature returns the deterministic/browser-side fallback.
- Set `GCP_CV_OCR_EXPIRES_AT` to a past timestamp in staging, redeploy or refresh config as required, and confirm the feature returns fallback and makes no Cloud Run call.
- Inspect application logs, Cloud Run logs, Cloud Logging, and any temporary provider logs; confirm they contain no raw extracted text, original filenames, storage paths, bucket/object names, signed URLs, processor IDs, service URLs, user emails, secrets, tokens, or credential material.
- Confirm the cost dashboard for the sandbox project shows the expected small smoke spend and no unrelated product spend.
- Test the cleanup path: disable the staging flag, remove temporary staging env values, delete or verify deletion of temp objects, and confirm the fallback path still works after cleanup.

Pass condition: live billing/product eligibility is recorded outside the repo, budget alerting is proved, one synthetic extraction succeeds, disabled and expired states fall back without Cloud Run calls, logs are payload-safe, cost is bounded, and cleanup is verified.

Fail condition: any real or pilot data is processed, production is enabled, a secret or project identifier is hardcoded where it should not be, budget alerting is untested, disabled/expired config still invokes Cloud Run, logs contain sensitive payloads, cost is unexplained, or cleanup leaves billable resources active.

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
