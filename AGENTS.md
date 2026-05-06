> Doc Class: `governance`
> Last Verified: `2026-03-12`

# Repository Agent Instructions

## MVP Implementation Authority

- For active MVP implementation, use this authority order:
  1. `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
  2. `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`
  3. `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
  4. `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
  5. `Proofound_Project_Specification_2026-03-11.md`
- `PRD_for_a_web_platform_MVP.master-latest.md`, `PRD_TECHNICAL_REQUIREMENTS.md`, `LAUNCH_RUNBOOK.md`, `README.md`, `project/Prompt.md`, `project/Architecture.md`, and audit docs are reference-only context. They must not broaden scope or override the stack above.

## Core Rule

- Treat the repository as the source of truth.
- Read files before making assumptions.

## Read Order

1. `AGENTS.md`
2. `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
3. `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`
4. `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
5. `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
6. `Proofound_Project_Specification_2026-03-11.md`
7. `project/Implement.md`
8. `project/Prompt.md`
9. `project/Architecture.md`
10. `project/Plans.md`
11. `project/Documentation.md`
12. `agent/runbooks/setup.md`
13. `agent/checklists/preflight.md`
14. `agent/checklists/verification.md`

For UI, landing, public-page, or visual-system work, also read `DESIGN.md` after the MVP authority stack and before editing.

For internal structure, maintainability, or future-agent orientation work, use these reference-only guides after the relevant source files and authority stack:

- `.artifacts/CURRENT_CODEBASE_TRUTH.md`
- `docs/PROOFOUND_UBIQUITOUS_LANGUAGE.md`

## Logging Policy (Conflict Prevention)

- Legacy shared files are history/index surfaces:
  - `agent/scratchpad.md`
  - `project/Documentation.md`
- Do not append per-task entries to those two files during normal feature work.
- Create sharded log entries instead:
  - Session logs: `agent/scratchpad/entries/`
  - Change logs: `project/changes/entries/`
- Use commands:
  - `npm run log:session`
  - `npm run log:change`

## PR Scope Rules

- Feature PRs must not modify legacy shared log files with product code changes.
- CI enforces this with `scripts/check-shared-log-files.mjs`.
- Docs/governance-only PRs may update legacy shared log files when needed.

## Verification

- Run relevant checks from `agent/checklists/verification.md`.
- At minimum for governance/tooling changes run:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run docs:freshness`
