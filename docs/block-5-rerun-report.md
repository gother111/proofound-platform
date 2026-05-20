# Block 5 Rerun Report

## objective

Run a fresh hard verification rerun against the current locked-MVP launch candidate, replace stale March 13 final evidence with fresh March 15 results, and produce an evidence-backed launch-readiness verdict without broadening scope.

## commands run

- `date -u +"%Y-%m-%dT%H:%M:%SZ"`
- `sed -n '1,80p' docs/codex-progress.md`
- `tail -n 20 docs/codex-progress.md`
- `sed -n '1,40p' docs/archive/status-reports/docs-historical/proofound-hard-verification-rerun-final.md`
- `git status --short`
- `git diff --stat`
- `git diff --name-only`
- `source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && node -v`
- `source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run lint`
- `source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run typecheck`
- `source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run build`
- `source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run db:drift-check`
- `source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run start -- -p 33120`
- `curl -i --max-time 25 -sS http://127.0.0.1:33120/api/health`
- `curl -i --max-time 25 -sS http://127.0.0.1:33120/api/monitoring/launch-status`
- `source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && BASE_URL=http://127.0.0.1:33120 npm run test:launch:smoke`
- `source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && node -e "require('dotenv').config({path:'.env.local'}); process.env.BASE_URL='http://127.0.0.1:33120'; const {spawnSync}=require('node:child_process'); const result=spawnSync('npm',['run','monitor:launch'],{stdio:'inherit',env:process.env}); process.exit(result.status ?? 1);"`
- `source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && node -e "require('dotenv').config({path:'.env.local'}); process.env.BASE_URL='http://127.0.0.1:33120'; process.env.SUS_STUDY_COMPLETE='true'; process.env.GO_NO_GO_RUN_SYNTHETICS='0'; const {spawnSync}=require('node:child_process'); const result=spawnSync('npm',['run','go:no-go'],{stdio:'inherit',env:process.env}); process.exit(result.status ?? 1);"`
- `curl -i --max-time 25 -sS http://127.0.0.1:33120/api/monitoring/launch-status`
- `source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run test -- tests/ui/individual-setup-proof-first.test.tsx tests/actions/onboarding.test.ts`
- `source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run test -- tests/lib/proof-pack-anchor.test.ts tests/lib/canonical-skill-proof-write.test.ts`
- `source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run test -- tests/api/public-portfolio-summary-route.test.ts tests/api/public-portfolio-export-route.test.ts tests/lib/public-portfolio-projection.test.ts tests/lib/public-trust-export-data.test.ts tests/lib/effective-visibility.test.ts`
- `source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run test -- src/lib/launch/__tests__/surface-policy.test.ts src/lib/__tests__/middleware-launch-archive.test.ts tests/ui/admin-dashboard-launch-links.test.tsx tests/ui/archived-mvp-routes.test.ts`
- `source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run test -- tests/api/org-match-review-route.test.ts tests/api/conversation-reveal-route.test.ts tests/api/match-interest-route.test.ts tests/api/interviews-edit-route.test.ts tests/api/interviews-complete-route.test.ts tests/api/decisions-route.test.ts tests/lib/workflow-decision-record.test.ts tests/lib/launch-engagement-verification-smoke.test.ts tests/lib/engagement-verifications.test.ts`
- `source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false BASE_URL=http://127.0.0.1:33120 PLAYWRIGHT_PORT=33120 node ./scripts/playwright-node20.mjs test e2e/strict/org-corridor.strict.spec.ts --project=chromium --reporter=line --workers=1`
- `source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false BASE_URL=http://127.0.0.1:33120 PLAYWRIGHT_PORT=33120 npm run test:e2e:individual:strict`
- `source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false BASE_URL=http://127.0.0.1:33120 PLAYWRIGHT_PORT=33120 npm run test:e2e:org:strict`
- `source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false BASE_URL=http://127.0.0.1:33120 PLAYWRIGHT_PORT=33120 npm run test:e2e:privacy:strict`
- `find src/app/api -maxdepth 3 -type d | sort`
- `find src/archive -maxdepth 5 -type d | sort`
- `rg -n "verification_records|skill_verification_requests|impact_story_verification_requests|archive|launch-surface" src/app src/lib tests`

## files changed

- `.artifacts/launch-smoke-report.json`
- `docs/codex-progress.md`
- `docs/block-5-rerun-report.md`
- `docs/archive/status-reports/docs-historical/proofound-hard-verification-rerun-final.md`

## tests run

- `npm run lint`
  - PASS with 2 pre-existing `@next/next/no-img-element` warnings only
- `npm run typecheck`
  - PASS
- `npm run build`
  - PASS
- `npm run db:drift-check`
  - FAIL with `src/db/schema.ts changed without a corresponding src/db/migrations/*.sql change`
- `curl -i --max-time 25 -sS http://127.0.0.1:33120/api/health`
  - PASS with `HTTP/1.1 200 OK` and `status:"healthy"`
- initial `curl -i --max-time 25 -sS http://127.0.0.1:33120/api/monitoring/launch-status`
  - PARTIAL with `HTTP/1.1 503 Service Unavailable` caused by stale persisted smoke evidence
- `BASE_URL=http://127.0.0.1:33120 npm run test:launch:smoke`
  - PASS, all 6 smoke scenarios passed and refreshed `.artifacts/launch-smoke-report.json`
- dotenv-backed `BASE_URL=http://127.0.0.1:33120 npm run monitor:launch`
  - PASS with `9/9` passing monitors and fresh persisted evidence
- first dotenv-backed `BASE_URL=http://127.0.0.1:33120 SUS_STUDY_COMPLETE=true GO_NO_GO_RUN_SYNTHETICS=0 npm run go:no-go`
  - RETRY_REQUIRED, failed because `launch-status` still returned `503` during the evidence-refresh window
- rerun `curl -i --max-time 25 -sS http://127.0.0.1:33120/api/monitoring/launch-status`
  - PASS with `HTTP/1.1 200 OK`, `ok:true`, and `readinessState:"ready"`
- second dotenv-backed `BASE_URL=http://127.0.0.1:33120 SUS_STUDY_COMPLETE=true GO_NO_GO_RUN_SYNTHETICS=0 npm run go:no-go`
  - PASS
- `npm run test -- tests/ui/individual-setup-proof-first.test.tsx tests/actions/onboarding.test.ts`
  - PASS, `4/4` tests
- `npm run test -- tests/lib/proof-pack-anchor.test.ts tests/lib/canonical-skill-proof-write.test.ts`
  - PASS, `5/5` tests
- `npm run test -- tests/api/public-portfolio-summary-route.test.ts tests/api/public-portfolio-export-route.test.ts tests/lib/public-portfolio-projection.test.ts tests/lib/public-trust-export-data.test.ts tests/lib/effective-visibility.test.ts`
  - PASS, `24/24` tests
- `npm run test -- src/lib/launch/__tests__/surface-policy.test.ts src/lib/__tests__/middleware-launch-archive.test.ts tests/ui/admin-dashboard-launch-links.test.tsx tests/ui/archived-mvp-routes.test.ts`
  - PASS, `18/18` tests
- `npm run test -- tests/api/org-match-review-route.test.ts tests/api/conversation-reveal-route.test.ts tests/api/match-interest-route.test.ts tests/api/interviews-edit-route.test.ts tests/api/interviews-complete-route.test.ts tests/api/decisions-route.test.ts tests/lib/workflow-decision-record.test.ts tests/lib/launch-engagement-verification-smoke.test.ts tests/lib/engagement-verifications.test.ts`
  - PASS, `35/35` tests
- `PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false BASE_URL=http://127.0.0.1:33120 PLAYWRIGHT_PORT=33120 node ./scripts/playwright-node20.mjs test e2e/strict/org-corridor.strict.spec.ts --project=chromium --reporter=line --workers=1`
  - PASS, `1 passed (2.3m)`
- `PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false BASE_URL=http://127.0.0.1:33120 PLAYWRIGHT_PORT=33120 npm run test:e2e:individual:strict`
  - PASS, `5 passed (1.4m)`
- `PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false BASE_URL=http://127.0.0.1:33120 PLAYWRIGHT_PORT=33120 npm run test:e2e:org:strict`
  - PASS, `6 passed (2.1m)`
- `PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false BASE_URL=http://127.0.0.1:33120 PLAYWRIGHT_PORT=33120 npm run test:e2e:privacy:strict`
  - PASS, `5 passed (52.2s)`

## result

PARTIAL

## remaining blockers

- `npm run db:drift-check` still fails because the current dirty tree changes `src/db/schema.ts` without a corresponding new migration file.
- Fresh repo-surface evidence shows that broader non-launch API families still remain active in `src/app/api/**` even though the archived mobile, wellbeing, and archived-admin families are preserved under `src/archive/non_launch_api/**` and the locked archive-policy tests pass.
- Legacy compatibility token responders and some verification compatibility paths still reference `skill_verification_requests` and `impact_story_verification_requests`; active launch web/mobile corridors passed, but those compatibility-only branches were not rerun end to end in this block.

## exact next recommended action

Resolve the current schema-drift blocker with the matching migration artifact, then make an explicit launch decision about the still-active broader `src/app/api/**` surface: either archive additional non-MVP families to match the locked corridor more tightly, or document why each remaining active family is intentionally retained for launch.
