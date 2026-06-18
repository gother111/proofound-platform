# Project Source Audit Summary

Generated: 2026-05-29
Workspace: `/Users/yuriibakurov/proofound`
Branch: `master`
Head: `874f1da8a`

## Executive Verdict

The current repo is locally clean except for this new audit folder, and the current local engineering evidence is strong: lint, typecheck, build, docs freshness, privacy/RLS, route inventory, landing E2E, launch smoke, and launch monitor all pass after rerunning network/server-gated checks with the needed permissions.

The best ChatGPT project-source package should replace older March/April launch reports and route inventories with a small active authority stack plus this audit package. The repo is **repo-local ready for the narrow locked MVP corridor**, but **full production launch remains UNVERIFIED / NO-GO until production-candidate operational evidence is refreshed**: incident/support owner assignment, critical alert proof, backup/restore proof, and founder go/no-go signoff.

## Current Source-Of-Truth Hierarchy

1. `AGENTS.md` and the closest repo governance instructions for how agents must interpret the repo.
2. `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
3. `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`
4. `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
5. `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
6. `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md`
7. `docs/ai/Proofound_AI_Assistive_Layer_Source_Of_Truth_Addendum_2026-05-03.md`, only as a subordinate AI addendum.
8. Fresh repo evidence from this folder: command results, current route counts, launch smoke, monitor output, and current conflict map.
9. `Proofound_Project_Specification_2026-03-11.md` as reference-only context.

Important mismatch: the user prompt listed `Proofound_Project_Specification_2026-03-11.md` above GTM and fresh evidence. The repo's `AGENTS.md` and locked MVP doc say the Project Specification is preserved reference context only and must not broaden or outrank the active stack. The repo instruction should win.

## Current Product Definition

Proofound MVP is a proof-first, privacy-first hiring credibility corridor centered on Proof Packs. Individuals create private context, attach real evidence, publish selected public proof portfolios, and control visibility. Organizations create a narrow assignment, review proof safely, request intro/reveal with consent, schedule manual-link interviews, record decisions, and keep engagement verification distinct.

It is not a broad recruiting suite, ATS replacement, public people directory, social network, broad marketplace, generic AI recruiting product, or dashboard-heavy org operating system.

## Current Launch / Readiness Status

- Repo-local engineering status: `READY` for the narrow locked MVP corridor, based on current successful checks.
- Current local launch smoke: `PASS`, artifact `.artifacts/project-source-audit-2026-05-29/launch-smoke-report.json`.
- Current local launch monitor: `PASS` after running a local production server and allowing local endpoint fetches.
- Full production launch status: `UNVERIFIED / NO-GO` until production-candidate operational evidence and founder signoff are refreshed.
- Current true repo blockers: none reproduced in this pass.
- Current external blockers: incident/support owner evidence, critical alert evidence, backup/restore evidence, founder go/no-go signoff.

## What Changed Since Older Project Sources

Older March route-breadth, stale-smoke, `_document`, public export leak, strict org corridor, and non-MVP surface claims are no longer reliable unless reproduced. Current evidence shows fewer API routes than May 14/20 docs claimed: this repo now has `124` API route handlers under `src/app/api`, not `140`. Page route count remains `51`.

The current source policy classifies the compiled API route files as `107` active launch, `16` internal-only launch ops, and `1` archived compiled compatibility handler. Page files classify as `48` active launch and `3` internal-only launch ops. Non-API route handlers are `8` active and `1` archived development helper.

## What ChatGPT Project Sources Should Know Going Forward

Use the locked MVP and aligned rewrite docs for scope. Use this audit package for current repo state. Treat historical reports as provenance only. Do not use route counts, launch blockers, smoke status, or readiness verdicts from older artifacts unless a current run reproduces them.

## Top 10 Stale Claims To Retire

1. "The current route surface is 140 API handlers." Current filesystem count is `124`.
2. "The current route surface is 187 APIs / 91 pages." Superseded by current `124` API route handlers and `51` page routes.
3. "The March route-breadth blocker is still open." Current route inventory tests pass.
4. "The smoke artifact is stale and blocks launch." Current local launch smoke passed and wrote a fresh artifact in this audit folder.
5. "Strict org corridor is not freshly green." Current launch smoke passed the full org corridor to engagement verification.
6. "Public export/summary privacy bypass is a current blocker." Current privacy and launch smoke checks passed; keep watching, but do not cite March blocker as current.
7. "Build/runtime is blocked by `/_document` or manifest failures." Current build passed.
8. "Google/LinkedIn import or native video integrations are launch requirements." Current MVP keeps manual-link interview posture and excludes broad integrations.
9. "AI is the product or hiring intelligence layer." AI is optional, subordinate, button-click assistance only.
10. "Full launch is GO because repo checks are green." Full production launch still needs operational and founder signoff evidence.

## Top 10 Current Facts To Preserve

1. Locked MVP scope is proof-first, privacy-first, and Proof Pack centered.
2. Project Specification is reference-only and cannot broaden scope.
3. Optional AI assistive layer is subordinate and cannot score, rank, shortlist, recommend, or decide.
4. Current branch is `master` at `874f1da8a`.
5. Current source count is `124` API route handlers under `src/app/api` and `51` app page routes.
6. Current route policy tests pass: `npm run test:launch:routes` passed `4` files / `21` tests.
7. Privacy/RLS baseline and extended suites pass against the configured Supabase test project after network permission.
8. Build passes, with non-fatal webpack/localstorage warnings.
9. Landing E2E passes: `11` tests.
10. Current local launch monitor passes `10/10` when run against a live local production server and the fresh smoke artifact.
