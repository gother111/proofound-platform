# Document Staleness And Conflicts

Generated: 2026-05-29

## Major Contradictions

| Conflict                               | Source that should win                              | Why it wins                                                                                   | Stale statement to retire                                                | Updated statement                                                                                                                  |
| -------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Project Specification authority        | `AGENTS.md` + locked MVP doc                        | Closest repo instruction and locked source say Project Specification is reference-only.       | Project Specification outranks GTM/fresh evidence.                       | Project Specification is reference-only and must not broaden MVP scope.                                                            |
| Route count `140` API handlers         | Current filesystem count                            | Current repo command found `124` API route handlers.                                          | Current source inventory reports `140` compiled API route handlers.      | Current API count is `124`; page count is `51`.                                                                                    |
| Route count `187 APIs / 91 pages`      | Current filesystem count + route tests              | Old March counts no longer match repo.                                                        | Active route surface is still `187` APIs and `91` pages.                 | Current API count is `124`; page count is `51`.                                                                                    |
| MVP-ready vs not release-clean         | Current command pass + launch-readiness distinction | Repo checks passed, but production-candidate ops evidence is still unverified.                | Green repo checks mean full launch GO.                                   | Repo-local MVP corridor is ready; full production launch remains UNVERIFIED / NO-GO until ops and founder signoff evidence exists. |
| March/April `NOT READY` launch reports | Current command pass                                | Older blockers were not reproduced and have superseded banners.                               | March/April NOT READY application blockers are current.                  | Older blockers are historical unless reproduced by fresh evidence.                                                                 |
| Smoke artifact stale                   | Current audit smoke artifact                        | Fresh artifact passed all 6 smoke checks.                                                     | Persisted smoke artifact is stale and blocking launch.                   | Current audit-local smoke artifact is fresh and passing.                                                                           |
| Strict org corridor not green          | Current launch smoke                                | Full org corridor to engagement verification passed.                                          | Strict org corridor remains unverified or failed.                        | Current audit-local full org corridor smoke passed.                                                                                |
| Build/runtime blocker                  | Current build                                       | Build passed.                                                                                 | `_document`, manifest, or route build blocker is current.                | Build passes with non-fatal warnings.                                                                                              |
| Verification transport legacy risk     | Current verification checklist and tests            | Current docs/tests say canonical verification transport passes.                               | Legacy skill/impact verification transport remains live current blocker. | Current verification semantics are canonical and passing; older transport findings are historical.                                 |
| Public homepage / landing alignment    | Current landing E2E                                 | Landing E2E passed 11 tests.                                                                  | Landing shell/routes/accessibility are unverified.                       | Landing E2E passed; visual production parity remains separate if needed.                                                           |
| Default test suite health              | Current requested checks                            | This audit did not run full `npm run test`; do not import older full-suite counts as current. | Default full test suite has current 365/1783 pass.                       | Full suite is UNVERIFIED in this pass; targeted required checks passed.                                                            |
| Production dependency security         | Older May evidence only                             | This audit did not run `npm audit`; avoid claiming current advisory state.                    | Production dependency audit is currently clean.                          | Production dependency audit is UNVERIFIED in this pass; May evidence claimed clean/high-threshold pass.                            |

## Stale Document Decisions

### `.artifacts/proofound-route-inventory.md`

- Status: REPLACE.
- Why: It says `140` API route handlers and `110` active launch APIs. Current repo command reports `124` API route handlers, classified as `107` active, `16` internal-only, `1` archived.
- Use instead: `CURRENT_REPO_TRUTH.md`.

### `docs/CURRENT_TRUTH.md`

- Status: REPLACE for current counts, MERGE for conceptual framing.
- Why: It is still useful on authority and product boundaries, but it says route inventory is `140` APIs and `51` pages. Current route evidence is `124` APIs and `51` pages.
- Use instead: this audit package plus locked authority stack.

### `.artifacts/CURRENT_CODEBASE_TRUTH.md`

- Status: REPLACE.
- Why: May 6 snapshot lists old commit `77e9f395`, `124` API handlers, `49` page routes, and older test counts. Current branch is `master` at `874f1da8a`, with `124` API handlers and `51` page routes.

### `.artifacts/project-source-refresh-2026-05-14/*`

- Status: REPLACE.
- Why: Its upload instructions record a dirty worktree and failed local launch smoke limitation. This audit was run from a clean worktree and launch smoke now passes after permission rerun.

### `.artifacts/launch-readiness-summary.md`

- Status: MERGE / historical support.
- Why: It correctly distinguishes repo-ready from full-launch NO-GO, but its latest evidence is May 20. This audit has newer local command evidence.

### March hard audits and scope reports

- Status: ARCHIVE.
- Why: They already carry superseded banners, old route counts, and older blocker language. Use them only as history.

### `FULL_PRODUCT_ARCHITECTURE_PLAN.md`

- Status: ARCHIVE.
- Why: It contains future expansion language such as AI scoring and dashboards. That is incompatible with active MVP positioning if treated as current source.

## Replacement Language

Use this going forward:

> Proofound MVP is a narrow proof-first, privacy-first assignment review corridor centered on Proof Packs. The current repo-local corridor passes the requested verification checks, including privacy/RLS, route inventory, landing E2E, launch smoke, and local launch monitor. Full production launch remains unverified until production-candidate operational proof and founder go/no-go signoff are refreshed.
