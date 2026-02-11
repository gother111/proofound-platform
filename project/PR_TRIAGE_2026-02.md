# PR Triage - 2026-02 Stabilization

## Purpose

This document is the working ledger for backlog cleanup and salvage after mixed/stacked PR drift.

Goals:

- Keep only changes with clear current product value.
- Split large/mixed PRs into small, merge-safe slices.
- Close stale branches that are not credible to merge directly.

## Keep Criteria (Mandatory)

A change is kept only if all are true:

1. It maps to a current bug/feature requirement.
2. It can be verified with passing checks or reproducible behavior.
3. It is extracted into a focused PR from fresh `master`.

## Queue Classes

- Ready queue: small, fresh, low overlap, mergeable after checks.
- Salvage-source: mixed/large PR that may contain useful slices.
- Archive-stale: deeply behind `master` and not credible to merge directly.

## Initial Queue Snapshot

Date: 2026-02-11

### Ready Queue

1. `#141` `codex/landing-regression-hardening`
2. `#137` `codex/pr-assignment-skills-l4`
3. `#140` `codex/pr-ui-preserve-non-landing`
4. `#138` `codex/pr-infra-mcp-env-preserve`
5. `#134` `codex/install-openskills-skill` (docs-only)

### Salvage-Source Queue

1. `#136` `codex/hotfix-landing-restore-9f8e0a9`
2. `#133` `codex/targeted-monitoring-oauth-refactor`
3. `#132` `admin-dashboard-polish`
4. `#130` `codex/brainstorm-platform-next-steps-analysis`
5. `#128` `codex/landing-polish-preview-6cfd37e`
6. `#127` `codex/api-coverage-health`
7. `#126` `codex/fix-next-cve-2025-66478`

### Archive-Stale Queue

1. `#53` `codex/rebuild-org-flow-end-to-end`
2. `#55` `codex/fix-organization-and-individual-login-discrepancies`
3. `#59` `feat/zen-hub-wireframe`
4. `#61` `codex/check-figma-elements-and-code-updates`
5. `#71` `feat/remove-matching-flag`
6. `#93` `2025-10-29-z16m-d7564`
7. `#94` `2025-10-30-layr-d7564`
8. `#109` `2025-11-05-vant-8b8ca`
9. `#113` `cursor/fix-admin-dashboard-data-load-error-eabc`

## Single-Lane Merge Order

Use this order until backlog pressure is reduced:

1. `#141`
2. `#137`
3. `#140`
4. `#138`
5. `#134`
6. Any new rescue PR created from Salvage-Source queue

Rules:

- Rebase onto latest `master` before final checks.
- Require green `ci` and `a11y` checks.
- Squash merge only.

## Salvage Protocol (Decision Complete)

For each salvage-source PR:

1. Create fresh branch from `master`: `codex/salvage-<source-pr>-<slice-name>`.
2. Bring candidate changes with `git cherry-pick -n <commit>`.
3. Stage only one behavior slice.
4. Add focused tests for that slice (or prove existing test coverage).
5. Open PR with explicit metadata in body:
   - `Source PR: #<id>`
   - `Slice: <what behavior>`
   - `Why needed now: <current requirement>`
6. If no valid slice remains, close source PR with disposition note.

## Docs Separation Policy

To reduce conflict churn:

- Feature PRs should not include:
  - `agent/scratchpad.md`
  - `project/Documentation.md`
- Record operational/session updates in dedicated docs-only PRs.

## Weekly Audit Routine

Every week:

1. List open PRs and sort by staleness and size.
2. Re-classify into Ready, Salvage-Source, Archive-Stale.
3. Close/archive PRs with no active salvage path.

Suggested command set:

```bash
gh pr list --state open --base master --limit 200 --json number,title,headRefName,createdAt,updatedAt,changedFiles
```

## Risk Notes

- Large mixed PRs can hide regressions and should not be merged directly.
- Landing-sensitive files remain under dedicated landing-scope guardrail enforcement.
