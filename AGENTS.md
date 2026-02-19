# Repository Agent Instructions

## Core Rule

- Treat the repository as the source of truth.
- Read files before making assumptions.

## Read Order

1. `AGENTS.md`
2. `project/Implement.md`
3. `project/Prompt.md`
4. `project/Architecture.md`
5. `project/Plans.md`
6. `project/Documentation.md`
7. `agent/runbooks/setup.md`
8. `agent/checklists/preflight.md`
9. `agent/checklists/verification.md`

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
