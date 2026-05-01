> Doc Class: `governance`
> Sync Pair: `verification.md`
> Last Verified: `2026-05-01`

# Verification Checklist (Before Merging)

Repo Truth items include citations like `(source: README.md)`. Anything else is guidance/policy.

## Always (Most PRs)

- Ensure the diff is scoped and intentional.
- Clean install: `npm ci` (source: package.json, package-lock.json, .nvmrc, .npmrc)
  - The launch-gate runtime is Node `20.20.0` / npm `10.8.2`; `.npmrc` enables engine-strict so unsupported Node versions fail closed.
- Dependency audit:
  - Production threshold: `npm run audit:prod` (source: package.json)
  - All scopes threshold: `npm run audit:all` (source: package.json)
  - Both fail on high or critical advisories. Keep `npm audit --omit=dev --json` at zero before treating the launch dependency surface as clean.
- Lint: `npm run lint` (source: package.json)
  - Note: lint uses `scripts/lint-or-skip.js`; ensure lint actually ran when required. (source: scripts/lint-or-skip.js)
- Typecheck: `npm run typecheck` (source: package.json)
- Unit tests: `npm run test` (source: package.json)
  - Default `npm run test` excludes archived/removed non-MVP tests and privacy/E2E harnesses so the release signal stays scoped to the locked MVP corridor.
  - Default `npm run test` runs through `scripts/run-vitest-with-timeout.mjs` and fails with exit code `124` if Vitest exceeds `PROOFOUND_VITEST_TIMEOUT_MS` (default `120000` ms).
  - Preserved archived or removed non-MVP regressions can be run with `npm run test:archived:non-launch` when that history is relevant.
  - Slow benchmark/quality suites are explicit non-launch checks: `npm run test:slow:non-launch`.
  - Launch-focused Vitest groups are explicit:
    - Upload privacy and lifecycle: `npm run test:launch:upload`
    - Privacy/RLS real-DB suites: `npm run test:launch:privacy`
    - Route inventory and archive handlers: `npm run test:launch:routes`
    - Org corridor coverage: `npm run test:launch:org-corridor`
    - Portfolio public/export coverage: `npm run test:launch:portfolio`
    - Workflow route coverage: `npm run test:launch:workflow`
- Build: `npm run build` (source: package.json)
  - Prebuild cleanup deletes stale generated `.next`, `.next-dev-*`, and `tsconfig.tsbuildinfo` state by default so launch validation does not accumulate large artifact archives.
  - It keeps only a small latest-run summary at `.artifacts/stale-build-state-cleanup-summary.md`.
  - If a failing generated build state must be preserved for debugging, opt in for that run with `PROOFOUND_ARCHIVE_STALE_BUILD_STATE=1 npm run build`.
- Practical sequencing note:
  - Run `npm run typecheck` and `npm run build` sequentially, not in parallel, because both write under `.next/` and parallel runs can create avoidable verification noise.
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
- Pull production project/env settings (creates `.vercel/`, which is gitignored): `npm run vercel:pull:production` (source: .gitignore)
- Run a prod-equivalent prebuilt build locally: `npm run vercel:build:production`
- Inspect prebuilt output:
  - `test -f .vercel/output/config.json`
  - `test -f .vercel/output/builds.json`
- Optional manual upload test:
  - `npm run vercel:deploy:prebuilt:production`
  - Confirm the command returns a deployment URL and that the target environment is production.
- Validate the ignored build step logic before relying on it:
  - `npm run vercel:should-build -- --changed-files project/example.md` should exit `0` (skip)
  - `npm run vercel:should-build -- --changed-files src/app/page.tsx` should exit `1` (build)
  - `npm run vercel:should-build -- --changed-files next.config.js` should exit `1` (build)
  - `npm run vercel:should-build` without a resolvable base SHA should exit `1` (safe build)
- Caveat:
  - If Vercel Git auto-deploys are still enabled for production, cloud builds can still run alongside the prebuilt workflow until they are intentionally disabled.

## Production Sync Guard (Prebuilt Workflow)

- Production prebuilt workflow location:
  - `.github/workflows/retry-vercel-deploy.yml`
- Required GitHub secret:
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`
- If the project has multiple queued or building deployments for the same branch, prune the stale ones before retrying:
  - `npm run vercel:cancel-stale -- --apply --target production --branch master`
- Validate live production after pushing to `master`:
  - `curl -sS https://proofound.io/api/health`
  - Expect the minimal public contract: `status` is `ok`.
  - Validate deployed commit/SHA through Vercel deployment metadata or the prebuilt workflow summary, not public health.
- If production is behind, trigger manual retry once:
  - `gh workflow run "Retry Vercel Deploy Until Synced" --ref master`
- Confirm latest workflow run:
  - `gh run list --workflow "Retry Vercel Deploy Until Synced" --limit 1`
- Confirm the workflow summary records the prebuilt deployment URL when a deploy was required.

## Release Batch Flow (Single Vercel Project)

- Create a release candidate branch with the manual workflow:
  - `gh workflow run "Prepare Release Candidate" -f release_name=<name> -f commit_shas=<sha1,sha2>`
- Confirm the workflow pushes a `release/<date>-<name>` branch.
- Confirm the PR to `master` passes the release-branch gate only when the head branch matches `release/*`.
- Confirm the release branch receives a normal preview deployment before merging to `master`.
- Confirm merging to `master` triggers the prebuilt production workflow instead of relying on a normal Vercel cloud build.

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
  - `npm run test:e2e:providers:strict`
  - `BASE_URL=http://localhost:3000 npm run perf:budgets`
  - `BASE_URL=http://localhost:3000 npm run monitor:launch`
  - `BASE_URL=http://localhost:3000 npm run launch:status`
  - `BASE_URL=http://localhost:3000 SUS_STUDY_COMPLETE=true npm run go:no-go`
- The strict gate writes per-command logs and status JSON under `.artifacts/mvp-strict-gates/`.
- Any timeout is a failed gate and must not be treated as launch-ready.
- CI also runs perf budgets and go/no-go gates after starting the app. (source: .github/workflows/ci.yml)
- Perf budgets: `BASE_URL=http://localhost:3000 npm run perf:budgets` (source: scripts/perf-budgets.mjs)
- Launch smoke artifact: `BASE_URL=http://localhost:3000 npm run test:launch:smoke` (source: package.json, scripts/launch-smoke-runner.ts)
- Launch synthetic monitors: `BASE_URL=http://localhost:3000 CRON_SECRET=<secret> npm run monitor:launch` (source: package.json, scripts/run-launch-synthetic-monitors.ts)
- Go/no-go: `BASE_URL=http://localhost:3000 SUS_STUDY_COMPLETE=true CRON_SECRET=<secret> npm run go:no-go` (source: scripts/go-no-go-check.ts)
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
- Seeded public org trust smoke: `npm run seed:public-org-trust-fixture` then `npm run test:e2e:org-trust:smoke` (source: package.json, `e2e/public-org-trust.smoke.spec.ts`)
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
  - Expect the minimal public contract: `status` is `ok`; detailed diagnostics and commit metadata stay behind protected ops surfaces.
- Public snippet route fallback:
  - Open `/p/<invalid-token>` and confirm invalid/expired fallback renders without 500 errors.
  - Open `/p/<invalid-token>/embed` and confirm archived embed handling does not loosen anti-framing policy.
- Auth/CSRF enforcement:
  - `POST /api/profile/snippet` without auth/CSRF should fail (`403` expected for missing CSRF).

## Launch-Safe Ops Checks (Block 9)

- If changes touch launch operations, feature flags, feedback contracts, fallback states, or admin rollout metrics:
  - Run `npx vitest run tests/api/feedback-schema.test.ts`
  - Run `npm run test:launch:smoke`
  - Run `BASE_URL=http://localhost:3000 CRON_SECRET=<secret> npm run monitor:launch`
  - Run `npm run docs:freshness`
- Manual smoke expectations for launch-safe behavior:
  - qualified intro corridor can be disabled without breaking portfolio, browse, export, delete, or unpublish
  - seeded public org trust route returns `200` for `/portfolio/org/proofound-labs` after `npm run seed:public-org-trust-fixture`
  - feedback token lookup returns structured feedback contract fields
  - feedback submission rejects empty payloads when both answers and structured feedback are missing
  - admin rollout metrics returns fallback states, queue health, and synthetic monitor health
  - fairness suppression never exposes exact ranking when the kill switch or suppression state is active
  - delete or unpublish removes the public projection and prevents public render
  - export surfaces only return the visibility-safe shape for the caller surface

## Restore Drill

- Before launch or high-risk rollback rehearsal:
  - Run `npm run db:backup:checkpoint`
  - Restore into a recovery target using platform restore tooling
  - Run `npm run db:restore:verify -- --checkpoint <dir>`
- Runbook:
  - `docs/launch-restore-drill.md`

## Husky / lint-staged Policy

- If hooks fail, fix only what affects the intended change set.
- Do not use `git commit --no-verify` unless explicitly approved.
