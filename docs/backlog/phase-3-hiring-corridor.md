> Doc Class: `active`
> Last Verified: `2026-03-25`

# Phase 3: Hiring Corridor and Assignment Runtime Hardening

Execution crosswalk: authoritative MVP `Phase 3 — Hiring corridor`.

Current status: `PLANNED`, gated behind Phase 2.

Phase goal: keep the narrowed corridor fast, explicit, and stable, with manual-link interview posture and distinct engagement verification preserved.

| Task ID | Task | Owner | Depends On | Launch Blocking | Exit Criteria | Evidence / Verification |
| --- | --- | --- | --- | --- | --- | --- |
| `P3-1` | Profile and harden the assignment publish path to address the current `/api/assignments` P95 warnings seen during strict org runs. Either bring the path back under the acceptable launch threshold or document an intentional threshold change with evidence. | Backend + Platform | `Phase 2 PASS` | `No` unless the perf issue proves corridor instability | Strict org runs no longer emit unacceptable assignment-publish warnings, or the threshold and rationale are intentionally updated without hiding real latency. | Start from the operational watch item in [`../../.artifacts/launch-readiness-summary.md`](../../.artifacts/launch-readiness-summary.md), [`../../tests/api/assignments-publish-route.test.ts`](../../tests/api/assignments-publish-route.test.ts), [`../../tests/lib/launch-assignment-publish-smoke.test.ts`](../../tests/lib/launch-assignment-publish-smoke.test.ts), [`../../src/app/api/monitoring/perf-status/route.ts`](../../src/app/api/monitoring/perf-status/route.ts), and [`../../src/lib/analytics/health-check.ts`](../../src/lib/analytics/health-check.ts). |
| `P3-2` | Reconfirm manual-link interview posture, decision recording, `hire`, and distinct engagement verification after any perf or surface work so no excluded Google, LinkedIn, or video scope leaks back into the live corridor. | Backend + QA | `P3-1` | `No` unless a rerun regresses the launch corridor | Strict org and smoke corridors remain green while interview scheduling stays manual-link only in the active MVP UI. | Run `npm run test:e2e:org:strict`; `BASE_URL=https://proofound.io npm run test:launch:smoke`; and the focused decision and engagement packs under [`../../tests/api/engagement-verifications-route.test.ts`](../../tests/api/engagement-verifications-route.test.ts) and [`../../tests/lib/workflow-decision-record.test.ts`](../../tests/lib/workflow-decision-record.test.ts). |
| `P3-3` | Reconfirm collaborator invite and lightweight role flows for `org_owner`, `org_manager`, and `org_reviewer`, especially if team and settings shells remain gated in the narrowed launch surface. | Backend + QA | `P3-2` | `No` unless role logic is no longer trustworthy without the gated shells | Role logic is freshly verified independent of non-launch team and settings pages, and collaborator acceptance still works end to end for the kept corridor. | Use [`../../tests/lib/authz-policy.test.ts`](../../tests/lib/authz-policy.test.ts) plus the collaborator and invite coverage already bundled in `npm run test:e2e:org:strict`. Add focused invite acceptance coverage only if the strict suite no longer proves the retained role flows. |

Phase notes:

- Do not use performance hardening as an excuse to reactivate excluded integrations or wider org-suite surfaces.
- If a perf fix requires scope expansion, stop and re-evaluate it against Phase 0’s frozen allowlist.
