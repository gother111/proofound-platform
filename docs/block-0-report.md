# Block 0 Report

## objective

Refresh the durable Codex resume harness so later sessions resume from the 2026-03-14 evidence baseline, preserve the historical Block 1 through Block 7 reports, and stop relying on the stale 2026-03-13 resume state.

## commands run

- `date -u '+%Y-%m-%dT%H:%M:%SZ'`
- `rg --files docs | sort`
- `ls -1`
- `rg --files -g 'AGENTS.md' -g 'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md' -g 'PRD_for_a_web_platform_MVP.aligned-rewrite.2026-03-11.md' -g 'PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md' -g 'LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md' -g 'Proofound_Project_Specification_2026-03-11.md' -g 'proofound-hard-audit-2026-03-14-rerun.md'`
- `sed -n '1,220p' docs/codex-progress.md`
- `sed -n '1,220p' docs/verification-checklist.md`
- `sed -n '1,220p' docs/block-0-report.md`
- `sed -n '1,260p' docs/block-7-report.md`
- `sed -n '1,320p' docs/proofound-hard-audit-2026-03-14-rerun.md`
- `rg -n "proof-first|Proof Pack|anchor|blind|reveal|candidate consent|assignment|internal review|publish|interview|decision|hire|engagement verification|export|delete|audit" Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md PRD_for_a_web_platform_MVP.aligned-rewrite.2026-03-11.md PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md Proofound_Project_Specification_2026-03-11.md`
- `npm run docs:freshness`
- `npm run lint`
- `npm run typecheck`
- `git diff --name-only -- docs/codex-progress.md docs/verification-checklist.md docs/block-0-report.md`
- `git status --short -- docs/codex-progress.md docs/verification-checklist.md docs/block-0-report.md`

## files changed

- `docs/codex-progress.md`
- `docs/verification-checklist.md`
- `docs/block-0-report.md`

## tests run

- `npm run docs:freshness` -> PASS in warning mode with 16 orphan-doc warnings for the block reports, resume harness docs, and recent audit reruns already missing from the docs registry
- `npm run lint` -> PASS with 2 existing warnings about raw `<img>` usage in landing components
- `npm run typecheck` -> PASS under Node `v20.20.0`
- `git diff --name-only -- docs/codex-progress.md docs/verification-checklist.md docs/block-0-report.md` -> PASS, only the three required docs files changed
- `git status --short -- docs/codex-progress.md docs/verification-checklist.md docs/block-0-report.md` -> PASS, only the three required docs files are modified in this block

## result

PASS

## remaining blockers

- The docs registry still treats the block reports, resume harness docs, and recent audit reruns as orphan files during `npm run docs:freshness`.
- Verification request transport still mixes canonical records with legacy request tables.
- Compatibility-side verification channel semantics still keep the corridor short of fully canonical end-to-end behavior.
- Non-MVP internal API families still exist in repo surface under `src/app/api/mobile/**`, `src/app/api/admin/**`, and `src/app/api/wellbeing/**`.
- The authenticated org review, reveal, and explanation corridor remains evidence-incomplete in the 2026-03-14 audit pass.
- `npm run typecheck` can fail when `.next/types/**` is missing.
- `/api/monitoring/launch-status` exceeded the 25-second cold probe once even though retry passed.

## exact next recommended action

Run Block 8: finish migrating the live verification request corridor off legacy request tables while preserving the already-aligned proof-first onboarding, Proof Pack anchor enforcement, public portfolio summary/export gating, distinct engagement verification workflow, and launch-surface archive policy.
