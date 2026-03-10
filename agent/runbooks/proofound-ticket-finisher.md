> Doc Class: `active`
> Last Verified: `2026-03-06`

# Proofound Ticket Finisher Runbook

Use this runbook for the recurring Codex automation that handles Proofound ticket closeout administration.

## Goal

Reduce the repeated post-ticket loop around:

- finding the active `PRO-*` issue
- checking whether the repo is still dirty or unpushed
- deciding which verification commands are still required
- drafting the Linear-ready completion update

This runbook is intentionally read-only on git state. It may suggest or draft closeout work, but it must not commit, push, merge, edit files, or post final Linear completion comments.

## Primary Command

Run the helper first:

```bash
node scripts/proofound-ticket-finisher.mjs --json
```

Default human-readable output is also available:

```bash
node scripts/proofound-ticket-finisher.mjs
```

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

## Automation Rules

- Scope only to the `proofound` workspace.
- If the helper reports exactly one clear issue candidate, the automation may query Linear for that issue.
- Hybrid authority rule:
  - allowed: move the issue to `In Progress` if Linear shows it is still earlier than that state
  - not allowed: post the final completion comment
  - not allowed: move the issue to `In Review`
  - not allowed: mutate git state in any way
- If issue inference is ambiguous, do not mutate Linear.

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
