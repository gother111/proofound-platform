# Next Actions For Yurii

Generated: 2026-05-29

## What To Upload Into ChatGPT

Upload the six active source-of-truth docs first:

1. `AGENTS.md`
2. `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
3. `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`
4. `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
5. `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
6. `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md`

Then upload this audit folder, especially:

- `PROJECT_SOURCE_AUDIT_SUMMARY.md`
- `CURRENT_REPO_TRUTH.md`
- `PROJECT_SOURCE_REPLACEMENT_MAP.md`
- `DOCUMENT_STALENESS_AND_CONFLICTS.md`
- `PROJECT_SOURCE_UPLOAD_PACKAGE.md`
- `NEXT_ACTIONS_FOR_YURII.md`

## What To Remove Or Archive From ChatGPT Project Sources

Remove old route inventories, old launch verdicts, old March hard audits, older PRDs, broad architecture plans, and any source that says Proofound is a broad platform, marketplace, ATS replacement, AI recruiter, public people directory, or dashboard-heavy org system.

The most important removals are:

- `.artifacts/proofound-route-inventory.md`
- `.artifacts/proofound-current-state-reality-check.md`
- `.artifacts/CURRENT_CODEBASE_TRUTH.md`
- `.artifacts/project-source-refresh-2026-05-14/*`
- `PRD_for_a_web_platform_MVP.master-latest.md`
- `PRD_for_a_web_platform_MVP.md`
- `PRD_TECHNICAL_REQUIREMENTS.md`
- `LAUNCH_RUNBOOK.md`
- `FULL_PRODUCT_ARCHITECTURE_PLAN.md`
- March/April audit reports as active sources

## What To Ask ChatGPT After Upload

Ask:

> Using only the uploaded active Proofound source package, summarize the current MVP scope, current launch status, current blockers, and what must not be expanded.

Then ask:

> Draft a concise founder-facing Proofound source-of-truth brief for future product, GTM, and engineering conversations. Flag anything that is unverified.

## What To Ask Codex Next If Gaps Remain

Ask Codex for a production-candidate go/no-go pass only when you are ready to allow production/staging checks:

> Run a production-candidate Proofound go/no-go evidence pass. Do not mutate production unless the command explicitly requires it and you ask first. Verify incident owners, alerts, backup/restore, live smoke, launch status, perf status, and founder signoff readiness.

## What Not To Worry About Right Now

- Do not worry about old March route-count blockers unless a fresh test reproduces them.
- Do not worry about old stale-smoke language; this audit generated a fresh passing local smoke artifact.
- Do not upload broad strategy or architecture docs just to be comprehensive.
- Do not let ChatGPT reinterpret Proofound as an AI recruiting platform or ATS.
- Do not treat repo-local green checks as final production launch signoff.
