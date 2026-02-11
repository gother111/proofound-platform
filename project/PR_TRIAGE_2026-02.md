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

## Forensic Snapshot (2026-02-11 22:49:28.537Z)

Captured from GitHub PR API and compare API before additional queue actions.

### Open PR Inventory (tracked set)

| PR   | Class          | Branch                                                      | Files | Ahead | Behind | Merge state | Required checks          | Updated    |
| ---- | -------------- | ----------------------------------------------------------- | ----: | ----: | -----: | ----------- | ------------------------ | ---------- |
| #142 | ready          | `codex/ci-reliability-unblock`                              |    11 |     2 |      0 | BLOCKED     | ci=pass, a11y=pass       | 2026-02-11 |
| #141 | superseded     | `codex/landing-regression-hardening`                        |     9 |     1 |      0 | BLOCKED     | ci=failure, a11y=failure | 2026-02-11 |
| #137 | ready          | `codex/pr-assignment-skills-l4`                             |     8 |     1 |      0 | BLOCKED     | ci=failure, a11y=failure | 2026-02-11 |
| #140 | ready          | `codex/pr-ui-preserve-non-landing`                          |     3 |     1 |      0 | BLOCKED     | ci=failure, a11y=failure | 2026-02-11 |
| #138 | ready          | `codex/pr-infra-mcp-env-preserve`                           |     7 |     1 |      0 | BLOCKED     | ci=failure, a11y=failure | 2026-02-11 |
| #134 | ready          | `codex/install-openskills-skill`                            |     2 |     1 |      0 | BLOCKED     | ci=failure, a11y=failure | 2026-02-11 |
| #136 | salvage-source | `codex/hotfix-landing-restore-9f8e0a9`                      |   206 |    12 |      3 | DIRTY       | ci=n/a, a11y=n/a         | 2026-02-11 |
| #133 | salvage-source | `codex/targeted-monitoring-oauth-refactor`                  |    17 |     2 |      0 | BLOCKED     | ci=failure, a11y=failure | 2026-02-11 |
| #132 | salvage-source | `admin-dashboard-polish`                                    |    76 |    10 |      3 | DIRTY       | ci=n/a, a11y=n/a         | 2026-02-11 |
| #130 | salvage-source | `codex/brainstorm-platform-next-steps-analysis`             |   199 |     9 |      3 | DIRTY       | ci=n/a, a11y=n/a         | 2026-02-11 |
| #128 | salvage-source | `codex/landing-polish-preview-6cfd37e`                      |   183 |    12 |      3 | DIRTY       | ci=n/a, a11y=failure     | 2026-02-09 |
| #127 | salvage-source | `codex/api-coverage-health`                                 |   150 |    14 |      3 | DIRTY       | ci=n/a, a11y=failure     | 2026-02-08 |
| #126 | salvage-source | `codex/fix-next-cve-2025-66478`                             |     4 |     2 |      3 | BEHIND      | ci=n/a, a11y=failure     | 2026-02-07 |
| #53  | archive-stale  | `codex/rebuild-org-flow-end-to-end`                         |    39 |    10 |    522 | DIRTY       | ci=n/a, a11y=n/a         | 2025-12-09 |
| #55  | archive-stale  | `codex/fix-organization-and-individual-login-discrepancies` |     5 |     1 |    522 | DIRTY       | ci=n/a, a11y=n/a         | 2025-12-09 |
| #59  | archive-stale  | `feat/zen-hub-wireframe`                                    |    46 |     1 |    569 | DIRTY       | ci=n/a, a11y=n/a         | 2025-12-09 |
| #61  | archive-stale  | `codex/check-figma-elements-and-code-updates`               |     4 |     1 |    516 | DIRTY       | ci=n/a, a11y=n/a         | 2025-12-09 |
| #71  | archive-stale  | `feat/remove-matching-flag`                                 |     1 |     1 |    501 | DIRTY       | ci=n/a, a11y=n/a         | 2025-12-09 |
| #93  | archive-stale  | `2025-10-29-z16m-d7564`                                     |    33 |     1 |    438 | DIRTY       | ci=n/a, a11y=n/a         | 2025-12-09 |
| #94  | archive-stale  | `2025-10-30-layr-d7564`                                     |    45 |     2 |    438 | DIRTY       | ci=n/a, a11y=n/a         | 2025-12-09 |
| #109 | archive-stale  | `2025-11-05-vant-8b8ca`                                     |    21 |     3 |    304 | DIRTY       | ci=n/a, a11y=n/a         | 2025-12-09 |
| #113 | archive-stale  | `cursor/fix-admin-dashboard-data-load-error-eabc`           |     2 |     2 |    258 | DIRTY       | ci=n/a, a11y=failure     | 2025-11-08 |

### Active PR Overlap Matrix (file-path overlap count)

Rows and columns: #142, #141, #137, #140, #138, #134, #136, #133, #132, #130, #128, #127, #126

| PR   | #142 | #141 | #137 | #140 | #138 | #134 | #136 | #133 | #132 | #130 | #128 | #127 | #126 |
| ---- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| #142 |    x |    9 |    0 |    0 |    2 |    2 |    5 |    2 |    5 |    5 |    4 |    3 |    3 |
| #141 |    9 |    x |    0 |    0 |    2 |    2 |    5 |    2 |    5 |    5 |    4 |    3 |    3 |
| #137 |    0 |    0 |    x |    0 |    0 |    0 |    6 |    0 |    0 |    0 |    0 |    0 |    0 |
| #140 |    0 |    0 |    0 |    x |    0 |    0 |    0 |    0 |    0 |    0 |    0 |    0 |    0 |
| #138 |    2 |    2 |    0 |    0 |    x |    2 |    3 |    2 |    2 |    3 |    4 |    2 |    2 |
| #134 |    2 |    2 |    0 |    0 |    2 |    x |    2 |    2 |    2 |    2 |    2 |    2 |    2 |
| #136 |    5 |    5 |    6 |    0 |    3 |    2 |    x |   14 |   64 |   94 |   22 |    3 |    3 |
| #133 |    2 |    2 |    0 |    0 |    2 |    2 |   14 |    x |   15 |   15 |    2 |    3 |    2 |
| #132 |    5 |    5 |    0 |    0 |    2 |    2 |   64 |   15 |    x |   67 |   20 |    3 |    3 |
| #130 |    5 |    5 |    0 |    0 |    3 |    2 |   94 |   15 |   67 |    x |   22 |    3 |    3 |
| #128 |    4 |    4 |    0 |    0 |    4 |    2 |   22 |    2 |   20 |   22 |    x |   32 |    3 |
| #127 |    3 |    3 |    0 |    0 |    2 |    2 |    3 |    3 |    3 |    3 |   32 |    x |    4 |
| #126 |    3 |    3 |    0 |    0 |    2 |    2 |    3 |    2 |    3 |    3 |    3 |    4 |    x |

### Disposition Intent (this run)

- No-freeze policy remains active.
- Single-lane queue policy remains active.
- Keep-rule remains: prove current value now with passing verification.
- Landing baselines remain:
  - Functional: `e2e/landing-page.spec.ts`
  - Visual: `e2e/landing-visual.spec.ts` snapshot `landing-home-af705d4-linux-chromium.png`
- PR #141 marked superseded candidate pending final diff check after #142 merge decision.

## Disposition Update (2026-02-11 23:02:16.749Z)

### Closed as Superseded

| PR   | Branch                               | State  | Notes                                                 |
| ---- | ------------------------------------ | ------ | ----------------------------------------------------- |
| #141 | `codex/landing-regression-hardening` | CLOSED | Superseded by #142 after zero-unique-file diff check. |

### Closed as Archive-Stale

| PR   | Branch                                                      | State  | Notes                                                          |
| ---- | ----------------------------------------------------------- | ------ | -------------------------------------------------------------- |
| #53  | `codex/rebuild-org-flow-end-to-end`                         | CLOSED | Deeply behind master; salvage only via fresh scoped slice PRs. |
| #55  | `codex/fix-organization-and-individual-login-discrepancies` | CLOSED | Deeply behind master; salvage only via fresh scoped slice PRs. |
| #59  | `feat/zen-hub-wireframe`                                    | CLOSED | Deeply behind master; salvage only via fresh scoped slice PRs. |
| #61  | `codex/check-figma-elements-and-code-updates`               | CLOSED | Deeply behind master; salvage only via fresh scoped slice PRs. |
| #71  | `feat/remove-matching-flag`                                 | CLOSED | Deeply behind master; salvage only via fresh scoped slice PRs. |
| #93  | `2025-10-29-z16m-d7564`                                     | CLOSED | Deeply behind master; salvage only via fresh scoped slice PRs. |
| #94  | `2025-10-30-layr-d7564`                                     | CLOSED | Deeply behind master; salvage only via fresh scoped slice PRs. |
| #109 | `2025-11-05-vant-8b8ca`                                     | CLOSED | Deeply behind master; salvage only via fresh scoped slice PRs. |
| #113 | `cursor/fix-admin-dashboard-data-load-error-eabc`           | CLOSED | Deeply behind master; salvage only via fresh scoped slice PRs. |

### Active Blockers

| PR   | Branch                         | Merge State | Blocker                                                                                                              |
| ---- | ------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------- |
| #142 | `codex/ci-reliability-unblock` | BLOCKED     | Branch policy requires 1 approval from another write-access reviewer; self-approval and admin override are rejected. |

## Queue Update (2026-02-11 23:10:42.923Z)

### Newly Closed Mixed/Source PRs

| PR   | Branch                                          | State  | Disposition                                                    |
| ---- | ----------------------------------------------- | ------ | -------------------------------------------------------------- |
| #126 | `codex/fix-next-cve-2025-66478`                 | CLOSED | Superseded by #143 (security bump slice).                      |
| #133 | `codex/targeted-monitoring-oauth-refactor`      | CLOSED | Partially salvaged by #144; auth-sensitive remainder deferred. |
| #136 | `codex/hotfix-landing-restore-9f8e0a9`          | CLOSED | Closed as mixed-scope source; no direct merge.                 |
| #130 | `codex/brainstorm-platform-next-steps-analysis` | CLOSED | Closed as mixed-scope source; no direct merge.                 |
| #128 | `codex/landing-polish-preview-6cfd37e`          | CLOSED | Closed as mixed-scope source; no direct merge.                 |
| #127 | `codex/api-coverage-health`                     | CLOSED | Closed as mixed-scope source; no direct merge.                 |

### Current Active Queue

| PR   | Branch                                    | Files | Merge state | Intended lane   |
| ---- | ----------------------------------------- | ----: | ----------- | --------------- |
| #142 | `codex/ci-reliability-unblock`            |    11 | BLOCKED     | Primary queue   |
| #137 | `codex/pr-assignment-skills-l4`           |     8 | BLOCKED     | Primary queue   |
| #140 | `codex/pr-ui-preserve-non-landing`        |     3 | BLOCKED     | Primary queue   |
| #138 | `codex/pr-infra-mcp-env-preserve`         |     7 | BLOCKED     | Primary queue   |
| #134 | `codex/install-openskills-skill`          |     2 | BLOCKED     | Primary queue   |
| #143 | `codex/salvage-126-next-security-bump`    |     2 | BLOCKED     | Salvage slices  |
| #144 | `codex/salvage-133-monitoring-percentile` |     5 | BLOCKED     | Salvage slices  |
| #132 | `admin-dashboard-polish`                  |    76 | DIRTY       | Deferred review |
| #131 | `codex/docs-git-flow-instructions`        |     5 | BLOCKED     | Deferred review |

### Blocking Condition

- Merges remain blocked by required-review policy when only self-review is available.
- #142 has passing required checks but still needs one approval from another write-access reviewer.
