# Proofound Launch Readiness Summary

Date: `2026-03-18`
Environment: local build using `.env.local`
Verdict: `NOT READY`

## Current Launch Status

- `/api/monitoring/launch-status`: `READY`
- `go:no-go`: `PASS`
- Narrow launch corridor status: moved forward
  - Fresh smoke, launch monitors, readiness, go/no-go, strict org corridor, and strict privacy corridor all passed in this sweep.

## Smoke Evidence

- Baseline dirty artifact preserved:
  - `.artifacts/launch-smoke-report.json`
  - timestamp: `2026-03-18 17:59:56 +0100`
  - `generatedAt`: `2026-03-18T16:59:56.137Z`
  - `expiresAt`: `2026-03-18T17:59:56.137Z`
  - `overallStatus`: `fail`
  - corridor statuses: `individual=pass`, `organization=fail`, `trust_privacy=pass`
- Fresh validation artifact:
  - `.artifacts/launch-smoke-report.validation.json`
  - `generatedAt`: `2026-03-18T18:05:17.331Z`
  - `expiresAt`: `2026-03-18T19:05:17.331Z`
  - `overallStatus`: `pass`
  - corridor statuses: `individual=pass`, `organization=pass`, `trust_privacy=pass`

## Corridor and Gate Results

- Strict org corridor: `PASS`
  - `e2e/strict/org-corridor.strict.spec.ts` passed standalone in `3.1m`
- Privacy strict corridor: `PASS`
  - `npm run test:e2e:privacy:strict` passed `5/5`
- Canonical role / RLS checks: `FAIL`
  - `npm run test:privacy` passed `20/20`
  - `npm run test:privacy:extended` failed on isolated rerun
- Verification cleanup: `FAIL`
  - focused Vitest regression pack failed
- Landing wedge rewrite shipped: `FAIL`
  - rewritten landing files are present in the workspace, but still `workspace-only, not yet merged`
  - `npm run test:e2e:landing` passed
  - `npm run test:e2e:landing:visual` failed against baseline snapshot

## Exact Blockers

1. `tests/privacy/rls-policies-extended.test.ts`
   - Manager can still create `org_invitations` rows when the test expects invite creation to be blocked for managers.
   - Manager cannot create `org_candidate_invites` because RLS rejects the insert on `org_candidate_invites`.
   - Isolated rerun also ended with cleanup hook timeout after the failed assertions.

2. `tests/ui/verifications-page.test.tsx`
   - Canonical proof-pack enrichment text drift:
   - expected claim summary `Observed skill claim for Product Strategy`
   - received `That this proof demonstrates Product Strategy in real work.`

3. `tests/ui/verifications-client.test.tsx`
   - Incoming request UI no longer renders the expected copy `Respond using the verification link that was sent to your email.`
   - Sent-tab flow no longer exposes the expected `Trigger custom request created` action.
   - Bundled pending sent request no longer exposes the expected `Manage Bundle` action; UI renders `Manage legacy bundle` instead.

4. `e2e/landing-visual.spec.ts`
   - Visual baseline mismatch against `landing-home-af705d4-linux-chromium.png`
   - diff: `77152` pixels, ratio `0.06`
   - artifacts:
     - `test-results/landing-visual-Landing-Vis-be9dd-matches-baseline-screenshot-chromium/landing-home-af705d4-linux-chromium-actual.png`
     - `test-results/landing-visual-Landing-Vis-be9dd-matches-baseline-screenshot-chromium/landing-home-af705d4-linux-chromium-diff.png`

5. Migration state
   - `npm run db:audit:migrations` reports one canonical migration file present but not applied:
   - `src/db/migrations/20260318180500_align_canonical_org_role_policies.sql`
   - `npm run db:migrate` is blocked by an older ledger checksum mismatch on `20260212120000_legacy_policies_sql`
   - direct application of `20260318180500_align_canonical_org_role_policies.sql` also failed because it calls `public.normalize_org_role_compat(...)` before defining that function on this database

## Runtime Concerns Observed During Green Smoke

- `/api/assignments`
  - slow-path warnings and performance alerts were logged during the org corridor:
  - `POST /api/assignments` duration about `5170ms`
  - `GET /api/assignments` duration about `2966ms`
  - `P95 7909ms exceeds 1500ms`
- `feedback_tokens`
  - interview completion feedback invite logging still reported:
  - `Could not find the 'id' column of 'feedback_tokens' in the schema cache`
- `identity_revealed_email.missing_email`
  - logged during reveal flow
- `decision_state_transitions`
  - prior foreign-key failure from the stale baseline was **not reproduced** in this fresh sweep

## Commands Run

```bash
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && node -v
test -d node_modules && echo node_modules:present || echo node_modules:missing
git status --short
stat -f '%Sm %N' -t '%Y-%m-%d %H:%M:%S %z' .artifacts/launch-smoke-report.json
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run build
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && LAUNCH_SMOKE_ARTIFACT_PATH=.artifacts/launch-smoke-report.validation.json npm run start -- -p 33140
curl -sS http://127.0.0.1:33140/api/health
curl -i --max-time 25 -sS http://127.0.0.1:33140/api/monitoring/launch-status
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && BASE_URL=http://127.0.0.1:33140 LAUNCH_SMOKE_ARTIFACT_PATH=.artifacts/launch-smoke-report.validation.json npm run test:launch:smoke
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && node -e "require('dotenv').config({path:'.env.local'}); process.env.BASE_URL='http://127.0.0.1:33140'; process.env.LAUNCH_SMOKE_ARTIFACT_PATH='.artifacts/launch-smoke-report.validation.json'; const {spawnSync}=require('node:child_process'); const result=spawnSync('npm',['run','monitor:launch'],{stdio:'inherit',env:process.env}); process.exit(result.status ?? 1);"
curl -i --max-time 25 -sS http://127.0.0.1:33140/api/monitoring/launch-status
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && node -e "require('dotenv').config({path:'.env.local'}); process.env.BASE_URL='http://127.0.0.1:33140'; process.env.LAUNCH_SMOKE_ARTIFACT_PATH='.artifacts/launch-smoke-report.validation.json'; process.env.SUS_STUDY_COMPLETE='true'; process.env.GO_NO_GO_RUN_SYNTHETICS='0'; const {spawnSync}=require('node:child_process'); const result=spawnSync('npm',['run','go:no-go'],{stdio:'inherit',env:process.env}); process.exit(result.status ?? 1);"
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false BASE_URL=http://127.0.0.1:33140 PLAYWRIGHT_PORT=33140 node ./scripts/playwright-node20.mjs test e2e/strict/org-corridor.strict.spec.ts --project=chromium --reporter=line --workers=1
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run test:e2e:privacy:strict
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run test:privacy
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run test:privacy:extended
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npx vitest run tests/actions/profile.test.ts tests/lib/public-portfolio-projection.test.ts tests/api/verification-status-route.test.ts tests/api/mobile-verification-status-route.test.ts tests/ui/verification-status-options.test.tsx tests/ui/verifications-client.test.tsx tests/ui/verifications-page.test.tsx tests/ui/custom-verification-request-dialog.test.tsx tests/ui/edit-skill-window-proofs.test.tsx tests/lib/verification-policy.test.ts tests/portfolio-trust-signals.test.ts tests/lib/public-trust-export-data.test.ts tests/api/public-portfolio-export-route.test.ts tests/api/portfolio-export-route.test.ts
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run test:e2e:landing
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run test:e2e:landing:visual
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run db:audit:migrations
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run db:migrate
```

## Bottom Line

- Narrow corridor launch evidence: `GREEN`
- Full requested evidence bundle: `RED`
- Final verdict: `NOT READY`
