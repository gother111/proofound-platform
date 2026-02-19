# Project Change Entry

- Date/time (UTC): 2026-02-19T13:41:38Z
- Branch: codex-fix-pr-conflicts-on-scratchpad
- Base commit: ad20e852

What changed:

- Added sharded logging surfaces:
  - `agent/scratchpad/entries/`
  - `project/changes/entries/`
  - `agent/scratchpad/README.md`
  - `project/changes/README.md`
- Added log creation script and npm commands:
  - `scripts/new-session-log.mjs`
  - `npm run log:session`
  - `npm run log:change`
- Added shared-log scope CI guardrail:
  - `scripts/check-shared-log-files.mjs`
  - `.github/workflows/ci.yml` updated to enforce on PR events
- Updated governance and policy docs for new model:
  - `AGENTS.md`
  - `project/Implement.md`
  - `agent/checklists/preflight.md`
  - `agent/checklists/verification.md`
  - `project/Documentation.md`
  - `agent/scratchpad.md` (legacy/archive status note)
- Updated compatibility scripts/docs:
  - `scripts/docs-freshness-check.mjs` (registry exemptions for sharded entries)
  - `scripts/check-landing-pr-scope.mjs` (allow sharded entry paths)
  - `docs/DOCS_REGISTRY.md` (new static index docs)
- Added Phase 4 reconciliation automation:
  - `scripts/reconcile-dirty-prs-shared-logs.mjs`
  - Applied to open DIRTY PRs: #201 and #197 were updated and became MERGEABLE/BLOCKED.
  - Remaining DIRTY PRs after apply pass: #200, #198, #196, #194.

Why:

- Recurring merge conflicts originated from concurrent edits to two shared files (`agent/scratchpad.md`, `project/Documentation.md`).
- Existing mitigations did not reliably prevent GitHub PR conflict states.
- A sharded append model plus CI enforcement removes same-file hot spots for routine session/change logging.

How to verify:

- `npm run lint` (PASS, one existing warning)
- `npm run typecheck` (PASS)
- `npm run docs:freshness` (PASS in warning mode, existing warnings remain)
- `ruby -e "require 'yaml'; YAML.load_file('.github/workflows/ci.yml')"` (PASS)
- `node ./scripts/check-shared-log-files.mjs` (expected FAIL on this branch due inherited non-governance diff)
- `node ./scripts/check-landing-pr-scope.mjs` (PASS)
- `git check-attr merge -- agent/scratchpad.md project/Documentation.md` (PASS)
- `gh pr list --state open --json number,mergeStateStatus` (shows #201 and #197 no longer DIRTY)
- `gh api --method PUT .../pulls/200/update-branch` (FAIL, HTTP 422 merge conflict)
- `gh api --method PUT .../pulls/201/update-branch` (HTTP 422 no new base commits, expected for non-behind branch)
- `gh api --method PUT .../pulls/197/update-branch` (HTTP 422 no new base commits, expected for non-behind branch)

Open risks / TODO:

- Remaining DIRTY PRs with product-code conflicts require manual resolution:
  - #198
  - #196
  - #194
  - #200
- Shared-log scope check can fail on long-lived branches with inherited non-governance deltas; use fresh branches from `master` for clean policy rollout.
- Team adoption risk remains if contributors keep editing legacy shared files instead of sharded entries.
