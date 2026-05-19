> Doc Class: `active`
> Last Verified: `2026-05-19`

# Proofound Ticket Finisher Runbook

Use this runbook for the recurring Codex automation that handles Proofound ticket closeout administration.

## Goal

Reduce the repeated post-ticket loop around:

- finding the active `PRO-*` issue
- checking whether the repo is still dirty or unpushed
- deciding which verification commands are still required
- drafting the Linear-ready completion update

This runbook is intentionally read-only on git state. It may suggest or draft closeout work, but it must not commit, push, merge, edit files, or post final Linear completion comments.

The helper is an administrative aid only. It does not prove MVP completion, launch readiness, privacy
readiness, or ticket closure by itself. Current closeout evidence must still come from the locked MVP
authority stack, current repo checks, current Browser/runtime evidence where relevant, and current
GitHub/Linear state when those systems are explicitly in scope.

## Primary Command

Run the helper first:

```bash
node scripts/proofound-ticket-finisher.mjs --json
```

Default human-readable output is also available:

```bash
node scripts/proofound-ticket-finisher.mjs
```

Do not run this helper as a substitute for the verification checklist. If the helper suggests stale
or broad commands, prefer `agent/checklists/verification.md` and the current launch docs.

## What The Helper Does

- Reads current git state from the Proofound repo.
- Inspects staged, unstaged, and untracked files.
- Detects ahead/behind status against the configured upstream branch.
- Scores likely active `PRO-*` issue keys from:
  - current branch name
  - recent commit subjects
  - recent sharded session logs
  - recent sharded change logs
  - overlap between current changed files and recent issue logs
- Builds the next verification command list from the repo checklist in `agent/checklists/verification.md`.
- Reads recent verification evidence from sharded logs and marks each required command as `pass`, `fail`, or `missing`.
- Produces a draft completion comment when one issue candidate is clear.

It does not:

- inspect private production data
- run Browser or Playwright checks for you
- validate live target backup/restore, launch-status, perf-status, or go/no-go evidence
- make historical Linear setup/import docs current

## Automation Rules

- Scope only to the `proofound` workspace.
- If the helper reports exactly one clear issue candidate, the automation may query Linear for that issue.
- Hybrid authority rule:
  - allowed: move the issue to `In Progress` if Linear shows it is still earlier than that state
  - not allowed: post the final completion comment
  - not allowed: move the issue to `In Review`
  - not allowed: mutate git state in any way
- If issue inference is ambiguous, do not mutate Linear.
- Never use the helper to broaden the locked MVP corridor or revive archived/post-MVP routes.
- Never post or move a ticket to review when required verification is missing, stale, or only inferred from old logs.

## Expected Inbox Output

Each run should produce one short report with:

- active issue candidate and confidence
- repo state summary
- exact next verification commands
- blockers to closeout
- suggested next Linear status
- draft completion comment text

## Operating Notes

- The helper uses repo-local heuristics. Treat ambiguous issue inference as a stop condition for mutation.
- Verification evidence is taken from sharded logs under:
  - `agent/scratchpad/entries/`
  - `project/changes/entries/`
- If required verification is missing, the automation should list the commands to run rather than improvising a final closeout.
- Browser/visual evidence must name the route, viewport, role/mode, and finding; the helper can summarize such evidence only after it exists in the current logs/artifacts.
