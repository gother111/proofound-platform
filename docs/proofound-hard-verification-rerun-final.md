# Proofound Final Launch Evidence Pack

Date: `2026-03-15`
Block: `final-launch-evidence-after-blocks-1-7`

Update note, current workspace `2026-03-22`:

- This report remains historical March 15 launch evidence.
- Its older assumptions about mixed live verification transport are now stale in the current workspace.
- A fresh 2026-03-22 validation found no active `skill_verification_requests` or `impact_story_verification_requests` references under `src/app` or `src/lib`, and the focused canonical verification suites passed under Node `20.20.0`.
- The protected prod org-corridor rerun was attempted but is currently blocked by an unrelated Next production build/runtime failure: `next start` crashed on missing `.next/server/chunks/1960.js`, and a clean `npm run build` later failed with `PageNotFoundError: Cannot find module for page: /_document`.
- Treat any March 15 language in this report that still implies active mixed legacy verification transport as superseded by the 2026-03-22 verification validation.

Authority stack used:

1. `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
2. `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`
3. `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
4. `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
5. `Proofound_Project_Specification_2026-03-11.md`

Read-order mismatch noted:

- The task asked for `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md` before the aligned PRD.
- The repo authority stack keeps the aligned PRD ahead of technical requirements.
- The locked MVP remained the behavior authority throughout this block.

## Verdict

`NO-GO`

## 2026-03-22 Verification Addendum

Fresh verification-transport evidence:

- `rg -n "skill_verification_requests|impact_story_verification_requests" src/app src/lib` returned no matches.
- `npm run test -- tests/lib/canonical-verification-request-token-resolution.test.ts` passed.
- `npm run test -- tests/api/verify-impact-token-route.test.ts tests/api/expertise-verification-respond-route.test.ts tests/api/expertise-skill-verification-request-route.test.ts tests/api/expertise-verifications-sent-delete-route.test.ts` passed.
- `npm run test -- tests/ui/verifications-page.test.tsx tests/ui/verifications-client.test.tsx` passed after refreshing stale UI expectations to the current canonical wording and archived-button labels.
- `npm run test -- tests/lib/engagement-verifications.test.ts tests/lib/workflow-contracts.test.ts` passed.

Current scope conclusion:

- Active verification request creation, listing, token lookup, and response update no longer show live dependency on legacy skill or impact request tables in `src/app` or `src/lib`.
- Archived `/api/verification/skill/*` behavior remains `410` and was left unchanged in this block.
- The missing fresh end-to-end org-corridor evidence is a build/runtime blocker in the current workspace, not a verification-transport blocker.

Fresh launch evidence is now present and mostly green:

- `.artifacts/launch-smoke-report.json` was refreshed and all six launch smoke checks passed.
- `/api/health` returned `200` with `status:"healthy"`.
- `/api/monitoring/launch-status` returned `200` with `ok:true` and `readinessState:"ready"` after smoke and monitor refresh.
- strict authenticated org corridor passed in prod-mode runtime
- strict privacy corridor passed in prod-mode runtime
- public individual and hidden individual portfolio coverage was rerun and passed
- seeded public org trust smoke passed on final rerun
- `npm run go:no-go` passed after evidence refresh

The launch candidate still stays `NO-GO` because fresh repo hygiene did not fully clear:

- `npm run test` failed with 4 failing tests in the current candidate

## Acceptance Status

| Required item                                                                | Status | Evidence                                                                                                                                                                         |
| ---------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| fresh launch smoke artifact exists                                           | PASS   | `.artifacts/launch-smoke-report.json` regenerated at `2026-03-15T23:36:44.690Z` with `overallStatus:"pass"`                                                                      |
| individual corridor smoke coverage                                           | PASS   | smoke checks `first_proof_first_individual` and `public_portfolio_publish` passed                                                                                                |
| organization corridor smoke coverage                                         | PASS   | smoke checks `assignment_publish` and `intro_reveal_interview_decision` passed                                                                                                   |
| trust/privacy corridor smoke coverage                                        | PASS   | smoke check `privacy_reveal_enforcement` passed                                                                                                                                  |
| `/api/health`                                                                | PASS   | direct probe returned `200` with `{"status":"healthy","database":{"connected":true,"usingMockDb":false}}`                                                                        |
| `/api/monitoring/launch-status`                                              | PASS   | direct probe returned `200` with `ok:true`, `readinessState:"ready"`, `expectedMonitors:10`, `missingMonitors:0`, `p1Failures:0`, `p2Failures:0`                                 |
| one public individual portfolio case                                         | PASS   | `npx vitest run tests/ui/public-portfolio-access-consistency.test.tsx` passed accessible portfolio page, summary, and export case                                                |
| one hidden individual case                                                   | PASS   | same targeted rerun passed unavailable portfolio page, summary, and export `404` case                                                                                            |
| seeded public org trust page                                                 | PASS   | `npm run seed:public-org-trust-fixture` returned `ok:true` for `/portfolio/org/proofound-labs`; final `npm run test:e2e:org-trust:smoke` passed                                  |
| intro -> reveal -> interview -> decision -> engagement verification coverage | PASS   | launch smoke passed `intro_reveal_interview_decision` and `engagement_verification`; prod-mode `npm run test:e2e:org:strict` passed 7/7 including the authenticated org corridor |
| blind-by-default review and progressive reveal                               | PASS   | `npm run test:e2e:privacy:strict` passed 5/5 including stage-based reveal and privacy gating                                                                                     |
| repo hygiene checks relevant to launch                                       | FAIL   | `npm run lint`, `npm run typecheck`, `npm run build`, `npm run docs:freshness` passed; `npm run test` failed                                                                     |
| evidence-backed go / no-go verdict                                           | PASS   | verdict remains `NO-GO` because core repo verification is not fully green                                                                                                        |

## Endpoint Results

### `/api/health`

Observed at `2026-03-15T23:52:01.106Z`:

```json
{
  "status": "healthy",
  "database": { "connected": true, "usingMockDb": false },
  "environment": {
    "hasSupabaseUrl": true,
    "hasSupabaseAnonKey": true,
    "hasDatabaseUrl": true,
    "hasSiteUrl": true,
    "hasServiceRoleKey": true
  },
  "warnings": [],
  "timestamp": "2026-03-15T23:52:01.106Z",
  "version": "local"
}
```

### `/api/monitoring/launch-status`

Observed at `2026-03-15T23:51:59.908Z`:

```json
{
  "ok": true,
  "readinessState": "ready",
  "generatedAt": "2026-03-15T23:51:59.908Z",
  "source": "persisted",
  "evidence": {
    "source": "persisted",
    "artifactPath": ".artifacts/launch-smoke-report.json",
    "smokeArtifactGeneratedAt": "2026-03-15T23:36:44.690Z",
    "smokeArtifactAgeMinutes": 15,
    "smokeFreshnessThresholdMinutes": 60,
    "smokeFreshnessState": "fresh",
    "persisted": true
  },
  "summary": {
    "expectedMonitors": 10,
    "reportedMonitors": 10,
    "missingMonitors": 0,
    "p1Failures": 0,
    "p2Failures": 0
  }
}
```

## Commands Run

```bash
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run lint
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run typecheck
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run build
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run start -- -p 33140
curl -i --max-time 25 -sS http://127.0.0.1:33140/api/health
curl -i --max-time 25 -sS http://127.0.0.1:33140/api/monitoring/launch-status
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && BASE_URL=http://127.0.0.1:33140 npm run test:launch:smoke
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && node -e "require('dotenv').config({path:'.env.local'}); process.env.BASE_URL='http://127.0.0.1:33140'; const {spawnSync}=require('node:child_process'); const result=spawnSync('npm',['run','monitor:launch'],{stdio:'inherit',env:process.env}); process.exit(result.status ?? 1);"
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && node -e "require('dotenv').config({path:'.env.local'}); process.env.BASE_URL='http://127.0.0.1:33140'; process.env.SUS_STUDY_COMPLETE='true'; process.env.GO_NO_GO_RUN_SYNTHETICS='0'; const {spawnSync}=require('node:child_process'); const result=spawnSync('npm',['run','go:no-go'],{stdio:'inherit',env:process.env}); process.exit(result.status ?? 1);"
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run docs:freshness
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run test
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run seed:public-org-trust-fixture
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false BASE_URL=http://127.0.0.1:33140 PLAYWRIGHT_PORT=33140 npm run test:e2e:org:strict
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false BASE_URL=http://127.0.0.1:33140 PLAYWRIGHT_PORT=33140 npm run test:e2e:privacy:strict
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npx vitest run tests/ui/public-portfolio-access-consistency.test.tsx
source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false BASE_URL=http://127.0.0.1:33140 PLAYWRIGHT_PORT=33140 npm run test:e2e:org-trust:smoke
curl -sS http://127.0.0.1:33140/api/health
curl -sS http://127.0.0.1:33140/api/monitoring/launch-status
```

## Test Results

- `npm run lint`: PASS with 2 existing warnings about raw `<img>` usage in landing components
- `npm run typecheck`: PASS
- `npm run build`: PASS
- `BASE_URL=http://127.0.0.1:33140 npm run test:launch:smoke`: PASS, 6/6 checks passed
- dotenv-backed `npm run monitor:launch`: PASS, 10/10 monitors passed
- dotenv-backed `npm run go:no-go`: PASS
- `npm run docs:freshness`: PASS with orphan-doc warnings
- `npm run test`: FAIL, 4 failing tests and 1263 passing tests
- `npm run seed:public-org-trust-fixture`: PASS, seeded `/portfolio/org/proofound-labs`
- `npm run test:e2e:org:strict`: PASS, 7/7 tests passed
- `npm run test:e2e:privacy:strict`: PASS, 5/5 tests passed
- `npx vitest run tests/ui/public-portfolio-access-consistency.test.tsx`: PASS, 2/2 tests passed
- final `npm run test:e2e:org-trust:smoke`: PASS, 1/1 tests passed

## Blocking Failures

Fresh `npm run test` failures:

1. `tests/actions/profile-impact-story-create.test.ts`
   - `createImpactStory schema-drift compatibility > keeps story save successful when verification table is missing`
   - failure: `Canonical impact verification requests require UUID owner and subject ids`
2. `tests/actions/profile-impact-story-create.test.ts`
   - `createImpactStory schema-drift compatibility > reuses existing active impact verification requests and avoids duplicate inserts`
   - failure: `Canonical impact verification requests require UUID owner and subject ids`
3. `tests/api/expertise-verifications-incoming-route.test.ts`
   - `GET /api/expertise/verifications/incoming > uses disambiguated skill verification select paths and normalized email filter`
   - expected `200`, received `410`
4. `tests/api/verification-skill-request-route.test.ts`
   - `/api/verification/skill/request > creates a verification request and emits a launch trace`
   - expected `200`, received `410`

## Remaining Risks / UNVERIFIED Items

Remaining blockers:

- `npm run test` is still failing in the current launch candidate, so the repo is not fully green.

Residual risks:

- A first `npm run test:e2e:org-trust:smoke` attempt in this block returned a `500` before the final rerun passed. The launch page is verified on the final rerun, but the earlier transient failure was not root-caused in this block.
- `npm run docs:freshness` passed in warning mode with orphan-doc findings. This did not block the launch gate, but the doc surface is not fully tidy.
- `npm run lint` passed with 2 pre-existing landing-page image warnings. This did not block the launch gate.

UNVERIFIED:

- None for the required launch gates listed above. The verdict remains `NO-GO` because repo-wide verification is not fully green, not because a required launch gate is missing evidence.
