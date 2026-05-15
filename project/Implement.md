> Doc Class: `governance`
> Sync Pair: `Implement.md`
> Last Verified: `2026-05-14`

# Implementation Operating Contract

This file defines the standard working procedure to follow for all future tasks in this repo.

Active MVP implementation authority is:

1. `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
2. `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`
3. `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
4. `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
5. `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md`
6. Fresh repo-grounded audits and evidence

`Proofound_Project_Specification_2026-03-11.md`, broader strategy, audit, and repo-guidance docs are reference only and must not widen scope beyond that stack. Older wrappers such as `PRD_for_a_web_platform_MVP.master-latest.md`, `PRD_TECHNICAL_REQUIREMENTS.md`, and `LAUNCH_RUNBOOK.md` are historical reference surfaces only.

## Standard Procedure

1. Read the MVP authority stack first, then the relevant `project/*.md` guidance docs.
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
- Do not let audits, repo snapshots, or historical wrappers override the locked MVP implementation authority.
- Treat `agent/scratchpad.md` and `project/Documentation.md` as historical/index files, not per-task append targets.
