> Doc Class: `governance`
> Sync Pair: `Implement.md`
> Last Verified: `2026-02-12`

# Implementation Operating Contract

This file defines the standard working procedure to follow for all future tasks in this repo.

## Standard Procedure

1. Read `project/*.md` first.
2. Locate the relevant code and summarize current behavior (paths + key functions/routes).
3. Propose a plan mapped to a validation checklist.
4. Ask up to 3 questions only if blocked on product intent or missing access/secrets.
5. Implement in small diffs (separate refactors from behavior changes; prefer incremental commits).
6. Run verification steps.
7. Create a task change entry via `npm run log:change` and update relevant runbooks/checklists if commands, architecture, or behavior changed.
8. Create a session entry via `npm run log:session` at session close-out.

## Guardrails

- No secrets in the repo. Never paste `.env.local` values into tracked files.
- Privacy is P0: Supabase RLS and field-visibility semantics must not regress.
- Keep CI parity in mind: the repo has gates beyond “tests pass” (perf budgets and go/no-go).
- Treat `agent/scratchpad.md` and `project/Documentation.md` as historical/index files, not per-task append targets.
