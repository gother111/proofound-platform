# Proofound Hard Verification Rerun Final

Date: `2026-03-15`  
Block: `5-rerun`

Authority stack:

1. `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
2. `PRD_for_a_web_platform_MVP.aligned-rewrite.2026-03-11.md`
3. `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
4. `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
5. `Proofound_Project_Specification_2026-03-11.md`

Evidence baseline only:

- `docs/proofound-hard-audit-2026-03-14-rerun.md`

## Executive verdict

The current checked-out workspace is not cleanly launch-ready for the locked MVP corridor.

Fresh March 15 evidence confirms that the launch-critical product corridors are working:

- production startup succeeded
- `/api/health` returned healthy
- fresh launch smoke, persisted launch monitors, and a retried go/no-go pass all succeeded
- proof-first onboarding remained intact
- Proof Pack anchor enforcement remained intact
- public portfolio summary/export gating remained intact
- authenticated org review, consented reveal, explicit hire, and distinct engagement verification all passed in fresh strict prod-runtime reruns

However, the current launch candidate is still **PARTIALLY, WITH BLOCKERS** because two material blockers remain on fresh evidence:

1. `npm run db:drift-check` fails in the current dirty tree.
2. Fresh repo-surface evidence shows broader non-launch API families still remain active under `src/app/api/**`, even though the archived non-launch mobile, wellbeing, and admin families remain preserved under `src/archive/non_launch_api/**` and the launch-archive policy tests pass.

## Plain final answer

**Is Proofound launch-ready for the locked MVP corridor right now?**

`PARTIALLY, WITH BLOCKERS`

## PASS / PARTIAL / FAIL by major area

| Area                                       | Status  | Evidence                                                                                                                                                                                      |
| ------------------------------------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| app startup                                | PASS    | `npm run start -- -p 33120` reached `Ready`, and the app served prod-mode runtime checks                                                                                                      |
| `/api/health`                              | PASS    | cold `curl -i --max-time 25 -sS http://127.0.0.1:33120/api/health` returned `HTTP/1.1 200 OK` with `status:"healthy"`                                                                         |
| `/api/monitoring/launch-status`            | PARTIAL | first cold probe returned `503` because persisted smoke evidence was stale; after `test:launch:smoke` plus `monitor:launch`, rerun returned `200` with `ok:true` and `readinessState:"ready"` |
| lint                                       | PASS    | `npm run lint` passed with only the 2 pre-existing landing `<img>` warnings                                                                                                                   |
| typecheck                                  | PASS    | `npm run typecheck` passed                                                                                                                                                                    |
| build                                      | PASS    | `npm run build` passed                                                                                                                                                                        |
| db drift                                   | FAIL    | `npm run db:drift-check` failed: `src/db/schema.ts changed without a corresponding src/db/migrations/*.sql change`                                                                            |
| proof-first onboarding                     | PASS    | focused onboarding suite passed; launch smoke `first_proof_first_individual` passed                                                                                                           |
| Proof Pack anchor enforcement              | PASS    | anchor suites passed; canonical proof write stayed green                                                                                                                                      |
| public portfolio summary/export gating     | PASS    | public summary/export suites passed and the smoke/monitor pipeline stayed green                                                                                                               |
| authenticated org corridor                 | PASS    | dedicated strict prod org corridor passed end to end; broader `test:e2e:org:strict` also passed                                                                                               |
| blind-by-default review                    | PASS    | privacy strict, org strict, and focused review-contract tests all passed                                                                                                                      |
| candidate-consented reveal                 | PASS    | privacy strict and dedicated org corridor passed the reveal-consent flow                                                                                                                      |
| explicit hire                              | PASS    | focused decisions/workflow suites and strict org corridor passed                                                                                                                              |
| distinct engagement verification           | PASS    | focused engagement-verification suites and dedicated org corridor passed                                                                                                                      |
| launch-surface archive policy              | PARTIAL | archive-policy tests passed and archived families remain under `src/archive/non_launch_api/**`, but broader active non-launch APIs still remain in `src/app/api/**`                           |
| overall locked-MVP launch-readiness answer | PARTIAL | corridor health is green on fresh evidence, but drift and active broader route surface remain blockers                                                                                        |

## Evidence table

| Claim                                                              | Status             | Runtime evidence                                                                                                     | Test evidence                                                                                                                                                                                                                                      | Code evidence                                                                                                                                        |
| ------------------------------------------------------------------ | ------------------ | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Proof-first onboarding stayed aligned                              | PASS               | fresh smoke artifact marked `first_proof_first_individual` pass                                                      | `npm run test -- tests/ui/individual-setup-proof-first.test.tsx tests/actions/onboarding.test.ts`                                                                                                                                                  | `src/components/onboarding/IndividualSetup.tsx`, `src/actions/onboarding.ts`                                                                         |
| Proof Pack anchor enforcement stayed aligned                       | PASS               | no runtime regression observed in smoke or strict corridors                                                          | `npm run test -- tests/lib/proof-pack-anchor.test.ts tests/lib/canonical-skill-proof-write.test.ts`                                                                                                                                                | `src/lib/proofs/pack-anchor.ts`, `src/db/schema.ts`, `src/db/migrations/20260313210500_harden_proof_pack_anchor_contract.sql`                        |
| Public portfolio summary/export gating stayed aligned              | PASS               | launch monitors and fresh build/runtime did not surface public gating regression                                     | `npm run test -- tests/api/public-portfolio-summary-route.test.ts tests/api/public-portfolio-export-route.test.ts tests/lib/public-portfolio-projection.test.ts tests/lib/public-trust-export-data.test.ts tests/lib/effective-visibility.test.ts` | `src/app/api/portfolio/public/[handle]/summary/route.ts`, `src/app/api/portfolio/public/[handle]/export/route.ts`                                    |
| Authenticated org corridor is live                                 | PASS               | dedicated prod-mode org corridor passed end to end on `http://127.0.0.1:33120`                                       | `e2e/strict/org-corridor.strict.spec.ts`, `npm run test:e2e:org:strict`                                                                                                                                                                            | `src/actions/org.ts`, `src/app/api/org/[id]/matches/[matchId]/review/route.ts`, `src/app/api/decisions/route.ts`, `src/lib/workflow/service.ts`      |
| Blind review and consented reveal remain enforced                  | PASS               | privacy strict rerun passed stage-based reveal in runtime                                                            | `npm run test:e2e:privacy:strict`; focused review/reveal suites passed                                                                                                                                                                             | `src/lib/matching/review-contract.ts`, `src/app/api/conversations/[conversationId]/reveal`, `src/app/api/org/[id]/matches/[matchId]/review/route.ts` |
| Explicit hire and distinct engagement verification remain separate | PASS               | dedicated org corridor reached explicit `hire` then separate org engagement confirmation                             | `npm run test -- tests/api/decisions-route.test.ts tests/lib/workflow-decision-record.test.ts tests/lib/launch-engagement-verification-smoke.test.ts tests/lib/engagement-verifications.test.ts`                                                   | `src/lib/workflow/service.ts`, `src/app/api/engagement-verifications/[id]`, `src/db/schema.ts`                                                       |
| Launch-status can turn green on fresh evidence                     | PASS_AFTER_REFRESH | initial cold probe was blocked by stale persisted evidence; rerun returned `200 ready` after smoke + monitor refresh | `BASE_URL=http://127.0.0.1:33120 npm run test:launch:smoke`; dotenv-backed `npm run monitor:launch`; retried dotenv-backed `npm run go:no-go`                                                                                                      | `src/app/api/monitoring/launch-status/route.ts`, `src/lib/launch/synthetic-monitors.ts`, `.artifacts/launch-smoke-report.json`                       |
| Launch-surface archive policy still protects archived families     | PARTIAL            | runtime launch-status and strict corridors stayed green; archived routes are still covered by tests                  | `npm run test -- src/lib/launch/__tests__/surface-policy.test.ts src/lib/__tests__/middleware-launch-archive.test.ts tests/ui/admin-dashboard-launch-links.test.tsx tests/ui/archived-mvp-routes.test.ts`                                          | `src/lib/launch/surface-policy.ts`, `src/archive/non_launch_api/app/api/**`                                                                          |
| Current launch candidate is free of structural release blockers    | FAIL               | none                                                                                                                 | `npm run db:drift-check` failed on fresh rerun                                                                                                                                                                                                     | `src/db/schema.ts` changed without matching migration artifact in the current dirty tree                                                             |

## Exact commands run

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
sed -n '1,80p' docs/codex-progress.md
tail -n 20 docs/codex-progress.md
sed -n '1,40p' docs/proofound-hard-verification-rerun-final.md
git status --short
git diff --stat
git diff --name-only

source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && node -v
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run lint
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run typecheck
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run build
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run db:drift-check

source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run start -- -p 33120
curl -i --max-time 25 -sS http://127.0.0.1:33120/api/health
curl -i --max-time 25 -sS http://127.0.0.1:33120/api/monitoring/launch-status

source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && BASE_URL=http://127.0.0.1:33120 npm run test:launch:smoke
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && node -e "require('dotenv').config({path:'.env.local'}); process.env.BASE_URL='http://127.0.0.1:33120'; const {spawnSync}=require('node:child_process'); const result=spawnSync('npm',['run','monitor:launch'],{stdio:'inherit',env:process.env}); process.exit(result.status ?? 1);"
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && node -e "require('dotenv').config({path:'.env.local'}); process.env.BASE_URL='http://127.0.0.1:33120'; process.env.SUS_STUDY_COMPLETE='true'; process.env.GO_NO_GO_RUN_SYNTHETICS='0'; const {spawnSync}=require('node:child_process'); const result=spawnSync('npm',['run','go:no-go'],{stdio:'inherit',env:process.env}); process.exit(result.status ?? 1);"
curl -i --max-time 25 -sS http://127.0.0.1:33120/api/monitoring/launch-status
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && node -e "require('dotenv').config({path:'.env.local'}); process.env.BASE_URL='http://127.0.0.1:33120'; process.env.SUS_STUDY_COMPLETE='true'; process.env.GO_NO_GO_RUN_SYNTHETICS='0'; const {spawnSync}=require('node:child_process'); const result=spawnSync('npm',['run','go:no-go'],{stdio:'inherit',env:process.env}); process.exit(result.status ?? 1);"

source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run test -- tests/ui/individual-setup-proof-first.test.tsx tests/actions/onboarding.test.ts
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run test -- tests/lib/proof-pack-anchor.test.ts tests/lib/canonical-skill-proof-write.test.ts
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run test -- tests/api/public-portfolio-summary-route.test.ts tests/api/public-portfolio-export-route.test.ts tests/lib/public-portfolio-projection.test.ts tests/lib/public-trust-export-data.test.ts tests/lib/effective-visibility.test.ts
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run test -- src/lib/launch/__tests__/surface-policy.test.ts src/lib/__tests__/middleware-launch-archive.test.ts tests/ui/admin-dashboard-launch-links.test.tsx tests/ui/archived-mvp-routes.test.ts
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run test -- tests/api/org-match-review-route.test.ts tests/api/conversation-reveal-route.test.ts tests/api/match-interest-route.test.ts tests/api/interviews-edit-route.test.ts tests/api/interviews-complete-route.test.ts tests/api/decisions-route.test.ts tests/lib/workflow-decision-record.test.ts tests/lib/launch-engagement-verification-smoke.test.ts tests/lib/engagement-verifications.test.ts

source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false BASE_URL=http://127.0.0.1:33120 PLAYWRIGHT_PORT=33120 node ./scripts/playwright-node20.mjs test e2e/strict/org-corridor.strict.spec.ts --project=chromium --reporter=line --workers=1
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false BASE_URL=http://127.0.0.1:33120 PLAYWRIGHT_PORT=33120 npm run test:e2e:individual:strict
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false BASE_URL=http://127.0.0.1:33120 PLAYWRIGHT_PORT=33120 npm run test:e2e:org:strict
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false BASE_URL=http://127.0.0.1:33120 PLAYWRIGHT_PORT=33120 npm run test:e2e:privacy:strict

find src/app/api -maxdepth 3 -type d | sort
find src/archive -maxdepth 5 -type d | sort
rg -n "verification_records|skill_verification_requests|impact_story_verification_requests|archive|launch-surface" src/app src/lib tests
```

## Exact tests run

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run db:drift-check`
- `curl -i --max-time 25 -sS http://127.0.0.1:33120/api/health`
- `curl -i --max-time 25 -sS http://127.0.0.1:33120/api/monitoring/launch-status`
- `BASE_URL=http://127.0.0.1:33120 npm run test:launch:smoke`
- dotenv-backed `BASE_URL=http://127.0.0.1:33120 npm run monitor:launch`
- dotenv-backed `BASE_URL=http://127.0.0.1:33120 SUS_STUDY_COMPLETE=true GO_NO_GO_RUN_SYNTHETICS=0 npm run go:no-go`
- `npm run test -- tests/ui/individual-setup-proof-first.test.tsx tests/actions/onboarding.test.ts`
- `npm run test -- tests/lib/proof-pack-anchor.test.ts tests/lib/canonical-skill-proof-write.test.ts`
- `npm run test -- tests/api/public-portfolio-summary-route.test.ts tests/api/public-portfolio-export-route.test.ts tests/lib/public-portfolio-projection.test.ts tests/lib/public-trust-export-data.test.ts tests/lib/effective-visibility.test.ts`
- `npm run test -- src/lib/launch/__tests__/surface-policy.test.ts src/lib/__tests__/middleware-launch-archive.test.ts tests/ui/admin-dashboard-launch-links.test.tsx tests/ui/archived-mvp-routes.test.ts`
- `npm run test -- tests/api/org-match-review-route.test.ts tests/api/conversation-reveal-route.test.ts tests/api/match-interest-route.test.ts tests/api/interviews-edit-route.test.ts tests/api/interviews-complete-route.test.ts tests/api/decisions-route.test.ts tests/lib/workflow-decision-record.test.ts tests/lib/launch-engagement-verification-smoke.test.ts tests/lib/engagement-verifications.test.ts`
- `PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false BASE_URL=http://127.0.0.1:33120 PLAYWRIGHT_PORT=33120 node ./scripts/playwright-node20.mjs test e2e/strict/org-corridor.strict.spec.ts --project=chromium --reporter=line --workers=1`
- `PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false BASE_URL=http://127.0.0.1:33120 PLAYWRIGHT_PORT=33120 npm run test:e2e:individual:strict`
- `PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false BASE_URL=http://127.0.0.1:33120 PLAYWRIGHT_PORT=33120 npm run test:e2e:org:strict`
- `PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false BASE_URL=http://127.0.0.1:33120 PLAYWRIGHT_PORT=33120 npm run test:e2e:privacy:strict`

## Files changed across the block sequence

This rerun verified the current dirty workspace as the launch candidate. The direct Block 5 rerun changes are:

- `.artifacts/launch-smoke-report.json`
- `docs/codex-progress.md`
- `docs/block-5-rerun-report.md`
- `docs/proofound-hard-verification-rerun-final.md`

The broader block-sequence diff at rerun close was:

```text
.artifacts/launch-smoke-report.json
agent/checklists/verification.md
docs/block-0-report.md
docs/codex-progress.md
docs/proofound-hard-verification-rerun-final.md
docs/verification-checklist.md
e2e/helpers/strict-fixtures.ts
e2e/strict/organization.strict.spec.ts
src/actions/org.ts
src/actions/profile.ts
src/app/accept-invite/page.tsx
src/app/actions/interviews.ts
src/app/api/admin/__tests__/cron-summary-route.test.ts
src/app/api/admin/__tests__/fairness-metrics-route.test.ts
src/app/api/admin/__tests__/fairness-report-route.test.ts
src/app/api/admin/__tests__/users-route.test.ts
src/app/api/admin/analytics/cv-import-spend/route.ts
src/app/api/admin/analytics/growth/route.ts
src/app/api/admin/analytics/metrics-dashboard/route.ts
src/app/api/admin/analytics/overview/route.ts
src/app/api/admin/analytics/pac/route.ts
src/app/api/admin/analytics/ttfqi/route.ts
src/app/api/admin/analytics/ttv/route.ts
src/app/api/admin/cron/summary/base-url.ts
src/app/api/admin/cron/summary/route.ts
src/app/api/admin/fairness-evaluations/[evaluationId]/route.ts
src/app/api/admin/fairness-metrics/route.ts
src/app/api/admin/fairness-report/route.ts
src/app/api/admin/fairness/generate-note/route.ts
src/app/api/admin/fairness/notes/[version]/route.ts
src/app/api/admin/fairness/notes/route.ts
src/app/api/admin/feature-flags/[key]/route.ts
src/app/api/admin/feature-flags/route.ts
src/app/api/admin/metrics/overview/route.ts
src/app/api/admin/metrics/rollout/route.ts
src/app/api/admin/organizations/route.ts
src/app/api/admin/performance/metrics/route.ts
src/app/api/admin/users/[userId]/role/route.ts
src/app/api/admin/users/[userId]/suspend/route.ts
src/app/api/admin/users/route.ts
src/app/api/core/matching/interest/route.ts
src/app/api/decisions/route.ts
src/app/api/expertise/user-skills/[id]/verification-request/route.ts
src/app/api/expertise/verification/[requestId]/respond/route.ts
src/app/api/expertise/verifications/custom/request/route.ts
src/app/api/expertise/verifications/sent/[requestType]/[requestId]/route.ts
src/app/api/interviews/complete/route.ts
src/app/api/interviews/edit/route.ts
src/app/api/mobile/v1/account/status/route.ts
src/app/api/mobile/v1/admin/analytics/overview/route.ts
src/app/api/mobile/v1/admin/moderation/queue/route.ts
src/app/api/mobile/v1/assignments/route.ts
src/app/api/mobile/v1/bootstrap/route.ts
src/app/api/mobile/v1/conversations/route.ts
src/app/api/mobile/v1/devices/token/route.ts
src/app/api/mobile/v1/interviews/route.ts
src/app/api/mobile/v1/matching/assignment/route.ts
src/app/api/mobile/v1/matching/explain/[matchId]/route.ts
src/app/api/mobile/v1/matching/feed/route.ts
src/app/api/mobile/v1/matching/hide/route.ts
src/app/api/mobile/v1/matching/interest/route.ts
src/app/api/mobile/v1/matching/snooze/route.ts
src/app/api/mobile/v1/messages/route.ts
src/app/api/mobile/v1/notifications/[id]/read/route.ts
src/app/api/mobile/v1/notifications/mark-all-read/route.ts
src/app/api/mobile/v1/notifications/preferences/route.ts
src/app/api/mobile/v1/notifications/route.ts
src/app/api/mobile/v1/onboarding/individual/route.ts
src/app/api/mobile/v1/onboarding/org/route.ts
src/app/api/mobile/v1/organizations/[orgId]/goals/route.ts
src/app/api/mobile/v1/organizations/[orgId]/projects/route.ts
src/app/api/mobile/v1/organizations/[orgId]/route.ts
src/app/api/mobile/v1/organizations/[orgId]/team/route.ts
src/app/api/mobile/v1/persona/switch/route.ts
src/app/api/mobile/v1/profile/visibility/route.ts
src/app/api/mobile/v1/shortlist/route.ts
src/app/api/mobile/v1/verification/status/route.ts
src/app/api/monitoring/__tests__/launch-status-route.test.ts
src/app/api/monitoring/launch-status/route.ts
src/app/api/org/[id]/matches/[matchId]/review/route.ts
src/app/api/verify/[token]/route.ts
src/app/api/wellbeing/checkin/route.ts
src/app/api/wellbeing/checkins/route.ts
src/app/api/wellbeing/data/route.ts
src/app/api/wellbeing/delta/route.ts
src/app/api/wellbeing/export/route.ts
src/app/api/wellbeing/milestones/route.ts
src/app/api/wellbeing/opt-in/route.ts
src/app/api/wellbeing/reflections/route.ts
src/app/api/wellbeing/self-assessment/route.ts
src/app/api/wellbeing/trend/route.ts
src/app/api/wellbeing/work-schedule/route.ts
src/app/app/o/[slug]/home/page.tsx
src/app/app/o/[slug]/interviews/page.tsx
src/components/admin/AdminDashboard.tsx
src/db/schema.ts
src/lib/__tests__/middleware-launch-archive.test.ts
src/lib/contracts/canonical-domain.ts
src/lib/email.ts
src/lib/interviews/messaging.ts
src/lib/launch/__tests__/surface-policy.test.ts
src/lib/launch/surface-policy.ts
src/lib/launch/synthetic-monitors.ts
src/lib/matching/review-contract.ts
src/lib/supabase/admin.ts
src/lib/supabase/mock-server-client.ts
src/lib/verification/canonical-requests.ts
src/lib/verification/request-feed.ts
src/lib/workflow/service.ts
tests/actions/create-impact-story.test.ts
tests/actions/profile.test.ts
tests/api/admin/analytics-cv-import-spend-route.test.ts
tests/api/decisions-route.test.ts
tests/api/expertise-skill-verification-request-route.test.ts
tests/api/expertise-verifications-sent-delete-route.test.ts
tests/api/interviews-edit-route.test.ts
tests/api/match-interest-route.test.ts
tests/api/mobile-bootstrap-route.test.ts
tests/api/mobile-device-token-route.test.ts
tests/api/mobile-practical-routes.test.ts
tests/api/mobile-verification-status-route.test.ts
tests/api/org-match-review-route.test.ts
tests/lib/launch-synthetic-monitors.test.ts
tests/lib/matching-review-contract.test.ts
tests/ui/admin-dashboard-launch-links.test.tsx
tests/ui/organization-interviews-page-actions.test.tsx
tests/ui/verifications-page.test.tsx
```

## Remaining blockers

1. `npm run db:drift-check` still fails on the current dirty tree.
2. Broader non-launch API families still remain active in `src/app/api/**`, even though the explicit archived mobile, wellbeing, and archived-admin families remain preserved and tested.
3. Legacy compatibility token responders still reference `skill_verification_requests` and `impact_story_verification_requests`; active launch corridors passed, but those compatibility-only branches remain partially legacy and were not rerun end to end in this block.
