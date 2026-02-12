# Verification Checklist (Before Merging)

Repo Truth items include citations like `(source: README.md)`. Anything else is guidance/policy.

## Always (Most PRs)

- Ensure the diff is scoped and intentional.
- Lint: `npm run lint` (source: package.json)
  - Note: lint uses `scripts/lint-or-skip.js`; ensure lint actually ran when required. (source: scripts/lint-or-skip.js)
- Typecheck: `npm run typecheck` (source: package.json)
- Unit tests: `npm run test` (source: package.json)
- Build: `npm run build` (source: package.json)

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
- Keep session/docs logs out of feature PRs when possible:
  - `agent/scratchpad.md`
  - `project/Documentation.md`
- Use dedicated docs-only PRs for session logs and operational notes.

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

- CI also runs perf budgets and go/no-go gates after starting the app. (source: .github/workflows/ci.yml)
- Perf budgets: `BASE_URL=http://localhost:3000 npm run perf:budgets` (source: scripts/perf-budgets.mjs)
- Go/no-go: `BASE_URL=http://localhost:3000 SUS_STUDY_COMPLETE=true npm run go:no-go` (source: scripts/go-no-go-check.mjs)
  - TODO: Ensure required evidence files exist before relying on this gate; do not invent missing evidence. (source: scripts/go-no-go-check.mjs)

## Migration and Data Safety (Before Production DDL)

- Create a checkpoint: `npm run db:backup:checkpoint`
- Reconcile migration ledger: `npm run db:audit:migrations`
- Apply production schema changes through versioned SQL under `supabase/migrations/`.
- Do not run `npm run db:push` against production.

## E2E / Accessibility (If You Touched Critical UX)

- E2E: `npm run test:e2e` (source: package.json)
- A11y: `npm run test:a11y` (source: package.json)
  - TODO: Validate `playwright.a11y.config.ts` exists; do not create it as part of docs-only work. (source: package.json)
- For credential-gated E2E smokes, document required env vars explicitly in `project/Documentation.md` and mark command outcome as PASS/SKIPPED with reason.

## Manual Smoke Checks (OAuth Integrations)

- Zoom connect:
  - Visit `/app/i/settings/integrations`
  - Click "Connect Zoom" and confirm you are redirected to Zoom and then back with `?success=zoom_connected`.
- Meeting creation:
  - Schedule an interview with `platform=zoom` and confirm the record has `meeting_link` populated.

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
