# Block 0 Report

## objective

Create a durable Codex execution harness inside the repo so later long-running sessions can resume safely, reuse current evidence, and avoid restarting discovery from scratch.

## commands run

- `date '+%Y-%m-%d %H:%M:%S %Z'`
- `date -u '+%Y-%m-%dT%H:%M:%SZ'`
- `git status --short`
- `rg --files -g 'AGENTS.md' -g 'docs/codex-progress.md' -g 'docs/block-*-report.md' -g 'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md' -g 'PRD_for_a_web_platform_MVP.aligned-rewrite.2026-03-11.md' -g 'PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md' -g 'LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md' -g 'Proofound_Project_Specification_2026-03-11.md' -g 'proofound-hard-audit-2026-03-13-rerun.md' -g 'project/Implement.md' -g 'project/Prompt.md' -g 'project/Architecture.md' -g 'project/Plans.md' -g 'project/Documentation.md' -g 'agent/runbooks/setup.md' -g 'agent/checklists/preflight.md' -g 'agent/checklists/verification.md'`
- Targeted `rg` and `sed` reads across the locked authority stack, the verification docs, and `docs/proofound-hard-audit-2026-03-13-rerun.md`
- `npm run lint`
- `npm run typecheck`
- `npm run docs:freshness`
- `git diff --name-only -- docs/codex-progress.md docs/verification-checklist.md docs/block-0-report.md`
- `git status --short -- docs/codex-progress.md docs/verification-checklist.md docs/block-0-report.md`

## files changed

- `docs/codex-progress.md`
- `docs/verification-checklist.md`
- `docs/block-0-report.md`

## tests run

- `npm run lint` -> PASS with 2 existing warnings about raw `<img>` usage in landing components
- `npm run typecheck` -> PASS
- `npm run docs:freshness` -> PASS in warning mode with 3 pre-existing orphan audit-doc warnings:
  - `docs/proofound-hard-audit-2026-03-12-rerun-2.md`
  - `docs/proofound-hard-audit-2026-03-12-rerun.md`
  - `docs/proofound-hard-audit-2026-03-12.md`
- Diff sanity check -> PASS, this block stayed docs-only

## result

PASS

## remaining blockers

- Organization publish corridor still returns `403` in strict runtime.
- `launch-status` can still report green from stale smoke evidence.
- Organization corridor remains slow and brittle under widened timeouts.
- Proof Pack anchors are still nullable at the schema layer.
- Verification semantics still mix canonical and legacy models.
- Non-MVP API families remain in the active repo surface.

## exact next recommended action

Run Block 1: fix the org publish `403` in the strict launch corridor, rerun the full organization strict suite cleanly without workaround seeding, and update `docs/codex-progress.md` plus the next block report with fresh evidence.
