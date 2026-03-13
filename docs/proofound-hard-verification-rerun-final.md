# Proofound Hard Verification Rerun Final

Date: `2026-03-13`
Block: `7`
Authority stack:

1. `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
2. `PRD_for_a_web_platform_MVP.aligned-rewrite.2026-03-11.md`
3. `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
4. `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
5. `Proofound_Project_Specification_2026-03-11.md`

## Executive verdict

Proofound's locked-MVP corridor is functionally passing on fresh evidence: app startup, health, launch smoke, live launch-status, real auth, strict individual, strict organization including publish, strict privacy, strict providers, and operator go/no-go all passed in Block 7.

Proofound is still **PARTIALLY, WITH BLOCKERS** for launch-readiness right now because two launch-gate issues remain on fresh evidence:

1. `npm run db:drift-check` fails due schema drift in the current dirty tree.
2. The first cold `curl --max-time 25` probes for `/api/monitoring/perf-status` and `/api/monitoring/launch-status` timed out during Next route compilation before warm reruns passed. That is real operational risk and cannot be counted as fully clean.

## What changed since the prior audit

- Fresh launch smoke evidence was regenerated twice, replacing the previously stale `.artifacts/launch-smoke-report.json`.
- Live `launch-status` moved from stale-and-blocked to `readinessState=ready` after a clean local cache reset and fresh smoke rerun.
- The strict quality gate was repaired without widening scope by replacing a forbidden `toHaveURL(...)` assertion in the landing contract test.
- The strict individual corridor was aligned to the current canonical verification-status payload shape (`workflow` plus `channels`) rather than the removed top-level `verificationStatus` field.
- The strict organization publish corridor was stabilized without timeout inflation by aligning the Playwright CSRF helper with the production client fetch semantics (`/api/csrf-token?ts=...` with `no-store` headers).
- Final operator evidence was rerun with dotenv-backed env loading so `monitor:launch` and `go:no-go` used the same `.env.local` inputs as the app runtime.

## Major corridor status

| Area                            | Status  | Evidence                                                                                                           |
| ------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| App startup                     | PASS    | `npm run dev -- -p 33100` reached `Ready in 7.8s`                                                                  |
| `/api/health`                   | PASS    | `200 healthy` on cold and warm reruns                                                                              |
| `/api/monitoring/perf-status`   | PARTIAL | first cold `curl --max-time 25` timed out; warm reruns returned `200` with probe `p95` about `171ms`, then `116ms` |
| `/api/monitoring/launch-status` | PARTIAL | first cold `curl --max-time 25` timed out; warm reruns returned `200 ready` with `9/9` monitors passing            |
| Lint                            | PASS    | `npm run lint`                                                                                                     |
| Typecheck                       | PASS    | `npm run typecheck`                                                                                                |
| DB drift                        | FAIL    | `npm run db:drift-check`                                                                                           |
| Unit tests                      | PASS    | `npm run test` => `310` files, `1241` tests                                                                        |
| Build                           | PASS    | `npm run build` under Node `20.20.0`                                                                               |
| Launch smoke                    | PASS    | `npm run test:launch:smoke`                                                                                        |
| Go/No-Go                        | PASS    | `npm run go:no-go` with dotenv-loaded env and `SUS_STUDY_COMPLETE=true`                                            |
| Landing                         | PASS    | `npm run test:e2e:landing` => `15` passed                                                                          |
| Auth real                       | PASS    | `npm run test:e2e:auth:real` => `12` passed                                                                        |
| A11y strict                     | PASS    | `npm run test:a11y:strict` => `3` passed                                                                           |
| Strict quality                  | PASS    | `npm run test:strict:quality` passed after landing-spec fix                                                        |
| Individual strict               | PASS    | `npm run test:e2e:individual:strict` => `5` passed                                                                 |
| Organization strict             | PASS    | `npm run test:e2e:org:strict` => `6` passed                                                                        |
| Privacy strict                  | PASS    | `npm run test:e2e:privacy:strict` => `5` passed                                                                    |
| Provider strict                 | PASS    | `npm run test:e2e:providers:strict` => `5` passed                                                                  |
| Corridor claim checks           | PASS    | focused supplemental suites all green                                                                              |

## Locked-MVP corridor summary

| Claim                                           | Status | Evidence                                                                                                                                                                                                                                                       |
| ----------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Blind-by-default review                         | PASS   | `npm run test:e2e:privacy:strict`; launch smoke `privacy_reveal_enforcement`                                                                                                                                                                                   |
| Consented reveal                                | PASS   | `npm run test:e2e:privacy:strict` stage-based reveal flow                                                                                                                                                                                                      |
| Public portfolio does not weaken review privacy | PASS   | `npm run test -- tests/lib/public-portfolio-projection.test.ts tests/api/public-portfolio-export-route.test.ts tests/lib/effective-visibility.test.ts`                                                                                                         |
| Explicit hire state                             | PASS   | `npm run test -- tests/api/decisions-route.test.ts`; `npm run test:e2e:org:strict`                                                                                                                                                                             |
| Engagement verification state                   | PASS   | `npm run test -- tests/lib/launch-engagement-verification-smoke.test.ts`; launch smoke `engagement_verification`                                                                                                                                               |
| Proof Pack canonicality                         | PASS   | `npm run test -- tests/lib/canonical-skill-proof-write.test.ts`; `npm run test -- tests/lib/proof-pack-anchor.test.ts`                                                                                                                                         |
| Anchor integrity                                | PASS   | `tests/lib/proof-pack-anchor.test.ts`; fresh smoke and export flows stayed green                                                                                                                                                                               |
| No active non-MVP launch surface                | PASS   | `npm run test -- src/lib/launch/__tests__/surface-policy.test.ts src/lib/__tests__/middleware-launch-archive.test.ts tests/ui/admin-dashboard-launch-links.test.tsx tests/ui/archived-mvp-routes.test.ts tests/ui/organization-settings-integrations.test.tsx` |

Notes:

- The org publish corridor passed without any publish-workaround seeding added in Block 7.
- Monitoring trust is fresh again: launch smoke artifact timestamp advanced to `2026-03-13T23:35:24.662Z`, and `monitor:launch` reported `persisted: true`.
- No timeout budgets were widened in Block 7. The only harness fix affecting runtime interaction was CSRF fetch cache-busting in the strict helper.

## Exact commands run

```bash
export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH"
node -v
git status --short
git diff --stat
sed -n '1,260p' docs/codex-progress.md
for f in docs/block-0-report.md docs/block-1-report.md docs/block-2-report.md docs/block-3-report.md docs/block-4-report.md docs/block-5-report.md docs/block-6-report.md; do sed -n '1,220p' "$f"; done
env | rg '^(NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY|DATABASE_URL|CRON_SECRET|PII_HASH_SALT|ZOOM_CLIENT_ID|ZOOM_CLIENT_SECRET|ZOOM_REDIRECT_URI|GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET|GOOGLE_REDIRECT_URI|LINKEDIN_CLIENT_ID|LINKEDIN_CLIENT_SECRET|E2E_PROVIDER_USER_ID|E2E_PROVIDER_USER_EMAIL|E2E_PROVIDER_USER_PASSWORD|SUS_STUDY_COMPLETE)='

npm run dev -- -p 33100
curl -i --max-time 25 -sS http://127.0.0.1:33100/api/health
curl -i --max-time 25 -sS http://127.0.0.1:33100/api/monitoring/perf-status
curl -i --max-time 25 -sS http://127.0.0.1:33100/api/monitoring/launch-status
npm run test:launch:smoke
curl -i --max-time 25 -sS http://127.0.0.1:33100/api/monitoring/launch-status

BASE_URL=http://127.0.0.1:33100 SUS_STUDY_COMPLETE=true GO_NO_GO_RUN_SYNTHETICS=0 npm run go:no-go

npm run lint
npm run db:drift-check
npm run typecheck
npm run test
npm run build

npm run test:e2e:landing
npm run test:e2e:auth:real
npm run test:strict:quality
npm run test:e2e:landing
npm run test:a11y:strict
npm run test:e2e:individual:strict
npm run test:e2e:individual:strict
npm run test:e2e:org:strict
npm run test:e2e:org:strict
npm run test:e2e:privacy:strict
npm run test:e2e:providers:strict

npm run test -- tests/lib/proof-pack-anchor.test.ts tests/lib/canonical-skill-proof-write.test.ts
npm run test -- tests/lib/public-portfolio-projection.test.ts tests/api/public-portfolio-export-route.test.ts tests/lib/effective-visibility.test.ts
npm run test -- tests/api/decisions-route.test.ts tests/lib/launch-engagement-verification-smoke.test.ts
npm run test -- src/lib/launch/__tests__/surface-policy.test.ts src/lib/__tests__/middleware-launch-archive.test.ts tests/ui/admin-dashboard-launch-links.test.tsx tests/ui/archived-mvp-routes.test.ts tests/ui/organization-settings-integrations.test.tsx
npm run test -- tests/ui/verifications-page.test.tsx

npm run dev -- -p 33100
curl -i --max-time 25 -sS http://127.0.0.1:33100/api/health
curl -i --max-time 25 -sS http://127.0.0.1:33100/api/monitoring/perf-status
curl -i --max-time 25 -sS http://127.0.0.1:33100/api/monitoring/launch-status
curl -i --max-time 25 -sS http://127.0.0.1:33100/api/monitoring/perf-status
curl -i --max-time 25 -sS http://127.0.0.1:33100/api/monitoring/launch-status
npm run test:launch:smoke
node -e "require('dotenv').config({path:'.env.local'}); process.env.BASE_URL='http://127.0.0.1:33100'; const {spawnSync}=require('node:child_process'); const result=spawnSync('npm',['run','monitor:launch'],{stdio:'inherit',env:process.env}); process.exit(result.status ?? 1);"
node -e "require('dotenv').config({path:'.env.local'}); process.env.BASE_URL='http://127.0.0.1:33100'; process.env.SUS_STUDY_COMPLETE='true'; const {spawnSync}=require('node:child_process'); const result=spawnSync('npm',['run','go:no-go'],{stdio:'inherit',env:process.env}); process.exit(result.status ?? 1);"
curl -i --max-time 25 -sS http://127.0.0.1:33100/api/monitoring/perf-status
curl -i --max-time 25 -sS http://127.0.0.1:33100/api/monitoring/launch-status
```

## Exact tests run

- `npm run test:launch:smoke`
- `npm run lint`
- `npm run db:drift-check`
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
- `npm run test -- tests/lib/proof-pack-anchor.test.ts tests/lib/canonical-skill-proof-write.test.ts`
- `npm run test -- tests/lib/public-portfolio-projection.test.ts tests/api/public-portfolio-export-route.test.ts tests/lib/effective-visibility.test.ts`
- `npm run test -- tests/api/decisions-route.test.ts tests/lib/launch-engagement-verification-smoke.test.ts`
- `npm run test -- src/lib/launch/__tests__/surface-policy.test.ts src/lib/__tests__/middleware-launch-archive.test.ts tests/ui/admin-dashboard-launch-links.test.tsx tests/ui/archived-mvp-routes.test.ts tests/ui/organization-settings-integrations.test.tsx`
- `npm run test -- tests/ui/verifications-page.test.tsx`
- `npm run monitor:launch` via dotenv-backed Node wrapper
- `npm run go:no-go` via dotenv-backed Node wrapper with `SUS_STUDY_COMPLETE=true`

## Exact files changed in Block 7

Block 7 direct edits:

- `.artifacts/launch-smoke-report.json`
- `agent/scratchpad/entries/2026-03-13T23-40-26Z__master__4767ea77.md`
- `docs/codex-progress.md`
- `e2e/helpers/strict-fixtures.ts`
- `e2e/landing-page.spec.ts`
- `e2e/strict/individual.strict.spec.ts`
- `docs/proofound-hard-verification-rerun-final.md`
- `docs/block-7-report.md`
- `project/changes/entries/2026-03-13T23-40-20Z__master__4767ea77.md`

Context note:

- Verification was executed against a broader dirty tree already present from prior blocks. `git status --short` at Block 7 close still showed many additional modified and untracked files outside the direct Block 7 edits above.

## Remaining blockers

1. `npm run db:drift-check` still fails: `src/db/schema.ts` has no matching migration artifact in the current dirty tree.
2. Cold-start monitoring is not fully clean. On a fresh dev-server boot, the first `curl --max-time 25` probes for `/api/monitoring/perf-status` and `/api/monitoring/launch-status` timed out while the server compiled those routes, even though warm reruns passed.
3. The repo remains a broad in-progress dirty tree. Block 7 verified that tree as-is, but launch signoff should not ignore the unresolved drift and operational cold-start caveat.

## Plain final answer

**Is Proofound launch-ready for the locked MVP corridor right now?**

`PARTIALLY, WITH BLOCKERS`

Reason:

- The locked-MVP product corridor itself passed on fresh evidence.
- Final launch-readiness is still blocked by schema drift and cold-start monitoring timeouts on first probe.
