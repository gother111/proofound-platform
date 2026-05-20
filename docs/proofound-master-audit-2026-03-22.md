# Proofound Master Audit 2026-03-22

Date: `2026-03-22`
Scope: `Current workspace truth, focused canonical verification validation, and current launch-blocking status`
Doc class: `governance`

> Historical/superseded freshness banner added 2026-05-14:
>
> - Do not treat this March audit as current launch, route, or MVP truth without checking newer repo evidence first.
> - The locked MVP definition remains `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`; this audit cannot broaden it.
> - For narrow pilot-readiness evidence, prefer `project/changes/entries/2026-04-09__mvp-launch-audit-execution.md` or newer current evidence. That April 9 execution retired the March build/runtime, route breadth, launch smoke, and strict org corridor blockers unless those blockers are reproduced again in a fresh run.
> - For release-clean status, use `audit/full-scale-audit-2026-04-16.md` or newer release evidence; April 16 found the repo structurally healthy but not release-clean.
>
> Superseded note added 2026-03-25:
>
> - This file is preserved as historical evidence only and does not override the locked MVP stack or newer `.artifacts/*` current-state evidence.
> - Stale categories in or around this audit: mixed live verification transport conclusions, any `PageNotFoundError: /_document` build-blocker claims, any `pilot-launchable` or similar launch verdict treated as current truth, and older route-surface claims where newer route inventory disagrees.
> - Current repo truth differs again as of 2026-05-19: route breadth is no longer an open launch-surface blocker in `docs/verification-checklist.md`; use `.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md` and newer focused checks before citing this report.
> - Fresh blocker-1 closure evidence on 2026-03-25: `node -v` -> `v20.20.0`; `npm -v` -> `10.8.2`; `rm -rf .next && NEXT_CLEAN_BUILD_CACHE=1 npm run build` -> `PASS`; `PORT=3101 npm run start -- --hostname 127.0.0.1 --port 3101` -> `Ready`; `curl /api/health`, `/`, and `/login` -> `200`; `curl /about` -> intentional archived-scope `404`.
> - The earlier “no safe current-block strict rerun was attempted” statement is now stale. Fresh isolated corridor evidence passed `1 passed (3.4m)` and `PLAYWRIGHT_SERVER_MODE=prod npm run test:e2e:org:strict` passed `7 passed (5.7m)`.

## Authority stack

This master audit uses the locked MVP authority order defined in [AGENTS.md](/Users/yuriibakurov/proofound/AGENTS.md):

1. `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
2. `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`
3. `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
4. `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
5. `Proofound_Project_Specification_2026-03-11.md`

Historical audit and report docs remain evidence only. They do not override current repo truth.

## Executive summary

Current repo truth is ahead of several stale March audit documents on verification transport.

Fresh 2026-03-22 validation shows:

- active `src/app` and `src/lib` code no longer references `skill_verification_requests` or `impact_story_verification_requests`
- canonical token resolution and active verification request handling passed focused reruns under Node `20.20.0`
- current verification feed and `/api/verify/[token]` behavior do not show live dependency on legacy request tables
- archived `/api/verification/skill/*` routes remain `410` and were not reactivated

The main blocker in the current workspace is no longer a reproduced mixed verification transport issue. Blocker 1, the historical Next production build/runtime failure, is now closed with fresh Node `20.20.0` evidence. The remaining launch-critical blocker shifts to missing fresh protected prod org-corridor evidence in block 2.

## Verdict

`PARTIAL`

What is currently validated:

- canonical verification transport in active code paths
- claim-scoped verification feed and token review behavior
- distinct engagement verification workflow protections
- repo hygiene checks for lint, typecheck, and docs freshness warning mode

What is not freshly validated in this block:

- full prod authenticated org corridor rerun for review, reveal, interview, decision, hire, and engagement confirmation

Why the verdict is not `PASS`:

- the clean blocker-1 rerun now passes, so the historical `/_document` and missing-chunk failures are retired as stale evidence
- no fresh protected prod org-corridor rerun was completed in this block, so review, reveal, interview, decision, hire, and engagement verification remain unrefreshed
- as of this historical block, persisted smoke evidence was stale and route breadth remained an open launch risk outside blocker 1; this statement is superseded by the 2026-05-19 route-surface pass recorded in `docs/verification-checklist.md`

## Current findings

### 1. Canonical verification transport is validated in active code

Fresh repo-wide search:

```bash
rg -n "skill_verification_requests|impact_story_verification_requests" src/app src/lib
```

Result:

- no matches in active `src/app` or `src/lib`

Interpretation:

- current workspace truth does not support older audit claims that active verification transport still depends on legacy skill or impact request tables

### 2. Focused canonical verification reruns passed

Passed under Node `20.20.0`:

```bash
npm run test -- tests/lib/canonical-verification-request-token-resolution.test.ts
npm run test -- tests/api/verify-impact-token-route.test.ts tests/api/expertise-verification-respond-route.test.ts tests/api/expertise-skill-verification-request-route.test.ts tests/api/expertise-verifications-sent-delete-route.test.ts
npm run test -- tests/ui/verifications-page.test.tsx tests/ui/verifications-client.test.tsx
npm run test -- tests/lib/engagement-verifications.test.ts tests/lib/workflow-contracts.test.ts
```

Interpretation:

- canonical token resolution is live
- active request creation, response, sent-item handling, and feed rendering are aligned with current canonical behavior
- post-hire engagement verification remains distinct and protected

### 3. Stale docs previously overstated mixed transport

The following existing docs contained stale conclusions relative to current workspace truth and were updated in this block:

- [docs/verification-checklist.md](/Users/yuriibakurov/proofound/docs/verification-checklist.md)
- [docs/archive/status-reports/docs-historical/proofound-hard-verification-rerun-final.md](/Users/yuriibakurov/proofound/docs/archive/status-reports/docs-historical/proofound-hard-verification-rerun-final.md)
- [docs/codex-progress.md](/Users/yuriibakurov/proofound/docs/codex-progress.md)
- [docs/proofound-hard-audit-2026-03-16-rerun.md](/Users/yuriibakurov/proofound/docs/proofound-hard-audit-2026-03-16-rerun.md)

Corrected conclusion:

- stale “mixed live verification transport” language is no longer accurate for current active code
- the remaining fresh blocker is missing protected org-corridor evidence, not blocker 1 build/runtime stability

### 4. Build/runtime blocker 1 is closed in the current workspace

Fresh blocker-1 verification under Node `20.20.0`:

```bash
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"; node -v; npm -v
rm -rf .next && NEXT_CLEAN_BUILD_CACHE=1 npm run build
PORT=3101 npm run start -- --hostname 127.0.0.1 --port 3101
curl http://127.0.0.1:3101/api/health
curl http://127.0.0.1:3101/
curl http://127.0.0.1:3101/login
curl http://127.0.0.1:3101/about
```

Observed outcomes:

- `node -v` -> `v20.20.0`
- `npm -v` -> `10.8.2`
- clean `npm run build` -> `PASS`
- prod `next start` -> `Ready`
- `/api/health`, `/`, and `/login` -> `200`
- `/about` -> archived-scope `404` with no runtime crash

Interpretation:

- the historical `PageNotFoundError: /_document` and missing `.next/server/chunks/1960.js` failures are stale current-state evidence
- blocker 1 is fully closed
- missing fresh end-to-end org evidence is no longer attributable to build/runtime failure

## Current status by area

| Area                                                                     | Current status | Fresh evidence                                                                                                                 |
| ------------------------------------------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Proof Pack canonicality                                                  | `PASS`         | No active legacy skill/impact request-table references in `src/app` or `src/lib`; focused canonical verification reruns passed |
| Bounded verification semantics                                           | `PASS`         | Skill and impact request creation, response, token review, and feed rendering passed focused reruns                            |
| Distinct engagement verification                                         | `PASS`         | `tests/lib/engagement-verifications.test.ts` and `tests/lib/workflow-contracts.test.ts` passed                                 |
| Assignment create/edit/publish                                           | `UNVERIFIED`   | Fresh protected prod rerun still missing; blocker 1 is closed, so the remaining gap shifts to block 2 evidence collection      |
| Review -> intro -> reveal -> interview -> decision -> hire -> engagement | `UNVERIFIED`   | Fresh protected prod rerun still missing; blocker 1 is closed, so the remaining gap shifts to block 2 evidence collection      |
| Launch readiness in current workspace                                    | `BLOCKED`      | Build/runtime blocker 1 is closed; launch is still blocked by missing fresh protected org-corridor evidence and stale smoke    |

## Commands and results

### Focused verification transport checks

```bash
rg -n "skill_verification_requests|impact_story_verification_requests" src/app src/lib
```

- `PASS`

```bash
source ~/.nvm/nvm.sh >/dev/null 2>&1 && nvm use 20.20.0 >/dev/null && npm run test -- tests/lib/canonical-verification-request-token-resolution.test.ts
```

- `PASS`

```bash
source ~/.nvm/nvm.sh >/dev/null 2>&1 && nvm use 20.20.0 >/dev/null && npm run test -- tests/api/verify-impact-token-route.test.ts tests/api/expertise-verification-respond-route.test.ts tests/api/expertise-skill-verification-request-route.test.ts tests/api/expertise-verifications-sent-delete-route.test.ts
```

- `PASS`

```bash
source ~/.nvm/nvm.sh >/dev/null 2>&1 && nvm use 20.20.0 >/dev/null && npm run test -- tests/ui/verifications-page.test.tsx tests/ui/verifications-client.test.tsx
```

- `PASS`

```bash
source ~/.nvm/nvm.sh >/dev/null 2>&1 && nvm use 20.20.0 >/dev/null && npm run test -- tests/lib/engagement-verifications.test.ts tests/lib/workflow-contracts.test.ts
```

- `PASS`

### Blocker 1 closure evidence

```bash
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"; node -v; npm -v
```

- `PASS`
- output: `v20.20.0`, `10.8.2`

```bash
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"; rm -rf .next; NEXT_CLEAN_BUILD_CACHE=1 npm run build
```

- `PASS`
- clean production build completed with no `/_document` error

```bash
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"; PORT=3101 npm run start -- --hostname 127.0.0.1 --port 3101
```

- `PASS`
- output reached `Ready`

```bash
curl -sS -o /tmp/proofound-health.json -w "%{http_code}\n" http://127.0.0.1:3101/api/health
curl -sS -o /tmp/proofound-home.html -w "%{http_code}\n" http://127.0.0.1:3101/
curl -sS -o /tmp/proofound-login.html -w "%{http_code}\n" http://127.0.0.1:3101/login
curl -sS -o /tmp/proofound-about.html -w "%{http_code}\n" http://127.0.0.1:3101/about
```

- `PASS`
- `/api/health` -> `200`
- `/` -> `200`
- `/login` -> `200`
- `/about` -> `404` with body `Public Pages: This public page is archived outside the locked launch MVP corridor.`

### Protected corridor rerun status

```bash
PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false npm run test:e2e:org:strict
```

- `NOT ATTEMPTED` in blocker 1 closure
- blocker 2 remains the next launch-critical evidence task because the suite writes service-role-backed runtime fixtures against the configured Supabase target

### Repo hygiene

```bash
source ~/.nvm/nvm.sh >/dev/null 2>&1 && nvm use 20.20.0 >/dev/null && npm run lint
```

- `PASS`

```bash
source ~/.nvm/nvm.sh >/dev/null 2>&1 && nvm use 20.20.0 >/dev/null && npm run typecheck
```

- `PASS`

```bash
source ~/.nvm/nvm.sh >/dev/null 2>&1 && nvm use 20.20.0 >/dev/null && npm run docs:freshness
```

- `PASS` in warning mode
- reported orphan-doc warnings only

## Superseded stale conclusions

The following conclusions from older docs should no longer be treated as current workspace truth:

- “verification request transport still mixes canonical records with legacy request tables”
- “`src/lib/verification/request-feed.ts` still blends legacy request tables”
- “`/api/verify/[token]` still depends on live mixed legacy request-table transport”

They remain historically useful as rerun-time findings, but they have been superseded by current repo truth and fresh focused evidence.

## Recommended next step

Proceed to block 2 and refresh the protected org-corridor evidence:

```bash
PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false npm run test:e2e:org:strict
```

Blocker 1 no longer needs a code fix or further evidence refresh beyond the current build/runtime closure record. The next reclassification opportunity is a fresh org-corridor rerun that can move the remaining `UNVERIFIED` rows.
