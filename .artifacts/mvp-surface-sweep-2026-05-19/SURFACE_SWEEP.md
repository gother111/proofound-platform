# Proofound MVP Surface Sweep - 2026-05-19

## Scope

Goal: sweep, polish, improve, and fix launch-relevant MVP surfaces against the locked proof-first hiring corridor.

Authority read:

- `AGENTS.md`
- `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
- `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`
- `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
- `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
- `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md`
- `DESIGN.md`

## UI Thesis Before Edits

Visual thesis: preserve Proofound's calm, credible proof-first identity while making primary route intent unmistakable. Public CTAs should behave as real links, not only JavaScript callbacks.

Content plan: keep language close to MVP objects and actions: proof portfolio, Proof Packs, assignments, verification, trust, consent, and review. Avoid old project, expertise atlas, analytics, and broad dashboard language.

Interaction thesis: every public or dashboard action should either route to an active MVP surface, stay gated, or fail closed. Stale links to archived routes are launch risk.

## Surface Matrix

| Family             | Representative surfaces checked                                                                                                     | Classification                        | Result                                                                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Public/logged-out  | `/`, `/signup`, `/signup/individual`, `/signup/organization`, `/login`, `/portfolio/demo`                                           | Active MVP or launch-safe unavailable | Landing CTAs now route as links. Demo portfolio remains launch-safe unavailable.                                                                                         |
| Individual app     | `/onboarding`, `/app/i/portfolio`, `/app/i/verifications`, `/app/i/communications`, `/app/i/settings/privacy`                       | Active MVP, auth-gated                | Stale unauthenticated tests now target active protected routes. Proof-first onboarding and Proof Pack anchor integrity reruns passed focused tests and Browser evidence. |
| Organization app   | `/app/o/[slug]/assignments` and assignment-oriented dashboard entry                                                                 | Active MVP, auth/org-gated            | ProjectsCard no longer fetches archived project APIs and links orgs to assignments.                                                                                      |
| Internal/admin/ops | `/admin`, `/admin/verification`, `/admin/audit`, launch route inventories, archived API handlers, middleware archive policy         | Internal launch ops                   | Route inventory and admin UI tests pass. Broader admin users/fairness/analytics tests were removed from the active launch signal. No public diagnostics expanded.        |
| Archived/post-MVP  | Expertise Atlas, fairness note, team coverage analytics, legacy integration edge flows, broad admin users/fairness/metrics surfaces | Archive/post-MVP                      | Active E2E/unit discovery no longer runs these as launch expectations. Archive READMEs explain why.                                                                      |
| Cross-cutting      | CTA routing, route-surface policy tests, stale docs/tests, Browser desktop/mobile smoke                                             | Active launch readiness               | Focused tests and Browser checks completed. Docs freshness now passes with no findings after registering the remaining artifact/audit docs.                              |

## Findings Fixed

1. Landing CTAs were visually primary but some were JS-only buttons. Browser showed "Create your proof portfolio" did not navigate from `/`.
   - Fixed by converting repeated landing hero CTAs to real anchors:
     - `Request a pilot` -> `/signup/organization`
     - `Create your proof portfolio` -> `/signup/individual`
   - Fixed header `Start` -> `/signup` and `Request a pilot` -> `/signup/organization` as real links.

2. ProjectsCard carried archived project API assumptions.
   - Removed automatic fetches to `/api/projects?limit=5` and `/api/organizations/:id/projects`.
   - Empty state now routes individuals to `/app/i/portfolio`.
   - Org entry now routes to `/app/o/[slug]/assignments`.

3. Active tests still referenced non-MVP or archived surfaces.
   - Updated strict a11y from `/app/i/expertise` to `/app/i/portfolio`.
   - Updated individual PRD route contract tests to current proof portfolio, verification, communications, and privacy settings surfaces.
   - Updated CV import hard-gate test so `/app/i/expertise` must remain 404.

4. Several E2E specs encoded post-MVP or legacy product behavior as active launch coverage.
   - Archived Expertise Atlas, org analytics, and legacy broad integration specs under `e2e/archive/`.
   - Added archive READMEs with scope rationale.

5. Active unit/UI tests still treated archived Expertise Atlas and legacy CV wizard components as launch behavior.
   - Moved old Expertise Atlas widget, Add Skill drawer, L4 card, skill-normalization, and CV/JD import wizard UI tests to `tests/archive/non_mvp_expertise_ui/` with `.archived` filenames.
   - Removed the excluded duplicate `tests/api/cv-import-wizard-routes.test.ts` from active test paths; `tests/api/archived-api-handlers-route.test.ts` remains the active 410 proof for those handlers.
   - Updated stale user-facing copy in the profile skill picker from "Expertise Atlas skills" to "proof skills".
   - Updated the GCP CV OCR proposal note so it points to the active archived-handler route test and the archived UI test folder.

6. Active docs still described retired routes as if they were launchable.
   - Updated `README.md` so `/api/expertise/cv-import/wizard-*` is described only as archived 410 compatibility, with active assisted import/proof work routed to Start from CV and Proof Artifact Text Extraction.
   - Rewrote `docs/EXPERTISE_ATLAS_SETUP.md` as retained taxonomy/service context, not an active Expertise Atlas UI setup guide.
   - Updated `docs/ACCESSIBILITY.md` away from the archived Expertise Atlas page and toward Proof Portfolio / Proof Pack workflows.
   - Updated `docs/mobile/IOS_PARITY_MATRIX.md` away from Expertise/Contracts/Projects modules and toward Proof Packs, decisions/feedback, engagement verification, and launch-ops language.

7. Active admin tests still exercised archived broad admin suite behavior.
   - Moved archived admin users, fairness metrics, fairness report, and cron-summary route tests under `src/archive/non_launch_api/app/api/admin/__tests__/` so they run only through the archived test config.
   - Moved stale broad admin organization-table and fairness analytics helper UI/lib tests under `tests/archive/non_mvp_admin_suite/`.
   - Kept the active admin launch corridor focused on `/admin`, `/admin/verification`, and `/admin/audit`.

8. Proof-first onboarding was still marked stale/UNVERIFIED in the verification checklist.
   - Reran the focused onboarding suite covering route selection, first-proof UI, canonical Proof Pack writes, private context scaffolding, and readiness state.
   - Verified `/onboarding` through Browser in mock-auth mode: H1 `Start with one Proof Pack`; first step asks only for name/residence; continuing reveals `Add one proof artifact`, proof link/file choice, ownership, skills, measured outcomes, and scoped verification options.
   - Updated `docs/verification-checklist.md` so the proof-first onboarding row records the fresh 2026-05-19 evidence and status `PASS`.

9. Proof Pack anchor integrity was still marked stale/UNVERIFIED in the verification checklist.
   - Rechecked schema migration `20260313210500_harden_proof_pack_anchor_contract.sql`: it backfills owner anchors for export packs, infers verification-bundle context anchors where possible, quarantines remaining legacy missing-anchor verification bundles, requires non-null primary anchors, and enforces pack-kind-specific anchor constraints.
   - Rechecked runtime enforcement in `src/lib/proofs/pack-anchor.ts` and `src/lib/canonical/repository.ts`: missing, invalid, or mismatched primary anchors are rejected; export packs must anchor to an owner; verification bundles must anchor to work, education, or volunteering context; quarantined packs are not exportable.
   - Reran the focused anchor/export/readiness suite: 11 files / 46 tests passed, including Proof Pack anchor policy, canonical skill proof writes, intro-readiness orphan blocking, owned-anchor API creation, export/public export/text-pack behavior, onboarding actions, and verification-integrity alignment.
   - Updated `docs/verification-checklist.md` so the Proof Pack anchor integrity row records the fresh 2026-05-19 evidence and status `PASS`.

10. Export/delete/auditability was still marked stale/UNVERIFIED in the verification checklist.

- Reran the Phase 1 evidence pack for public summary/export, individual export, organization export, account lifecycle, retired deletion cron routes, user export, and audit-log visibility: 11 files / 55 tests passed.
- Confirmed public portfolio summary/export gating remains distinct from authenticated owner exports.
- Confirmed authenticated portfolio/org exports preserve authorization behavior, including unauthenticated, missing-profile, forbidden reviewer, inactive-member, and success states.
- Confirmed user data export blocks while deletion is processing or in manual-review failure states.
- Confirmed account deletion is immediate and irreversible after password/phrase confirmation, cancel-deletion returns `410`, and scheduled deletion cron routes return archived responses.
- Confirmed auditability coverage for org-owner audit export, admin break-glass org audit reads, the settings audit-log page, and retired individual purpose audit history.
- Updated `docs/verification-checklist.md` so the export/delete/auditability row records the fresh 2026-05-19 evidence and status `PASS`.

11. The no-non-MVP-launch-surface checklist row still carried a stale 2026-03-25 `FAIL`.

- Reran `npm run test:launch:routes`: launch API inventory, launch page inventory, archived API handler, and middleware archive tests all passed.
- Fresh route counts: 140 compiled API handlers and 51 compiled pages.
- Current launch-surface policy explicitly classifies 110 APIs and 48 pages as active launch paths, 16 APIs and 3 pages as internal-only launch ops, and 14 compiled API handlers as archived compatibility responses.
- Required hard-gated pages are absent from the compiled launch surface, and representative archived API/page families remain classified archived at the route-surface policy boundary.
- Updated `docs/verification-checklist.md` so the no-non-MVP-launch-surface row records the fresh 2026-05-19 evidence and status `PASS`.

12. Browser coverage for authenticated individual, organization, and admin/internal surfaces was incomplete.

- Reconnected the Codex in-app Browser and ran the local app in mock individual, mock organization, and mock admin modes.
- Individual Browser pass covered `/app/i/home`, `/app/i/portfolio`, `/app/i/verifications`, `/app/i/communications`, and `/app/i/settings/privacy`.
- Organization Browser pass covered `/app/o/test-org/home`, `/app/o/test-org/assignments`, `/app/o/test-org/assignments/new`, `/app/o/test-org/interviews`, `/app/o/test-org/communications`, `/app/o/test-org/portfolio`, and the intentional `/app/o/test-org/shortlist` shortcut back to assignments.
- Admin Browser pass covered non-admin fail-closed `403` behavior for `/admin`, `/admin/verification`, and `/admin/audit`, then mock-admin rendering for `/admin`, `/admin/verification`, and `/admin/audit`.
- Mobile Browser pass covered `/admin/verification` and `/portfolio/org/test-org` at 390 x 844 with no horizontal overflow or runtime-error text.
- Browser copy sweep found stale privacy-page wording, so `PrivacyOverview` now uses `Proof skills and work evidence` instead of `Skills and expertise`.

13. The remaining interaction E2E risk still needed fresh strict-corridor evidence.

- Reran `npm run test:launch:workflow`: 14 files / 88 tests passed, covering org match review, interview schedule/edit/complete/cancel, decision routes/windows, engagement verification, reveal, workflow contracts, idempotency, email privacy, and reveal timeout.
- Reran `npm run test:launch:org-corridor`: 5 files / 41 tests passed, covering matching review contracts, org match review, hiring corridor snapshots, organization interview actions, and engagement verification smoke.
- Reran Phase 3 focused checks: `tests/api/assignments-publish-route.test.ts`, `tests/lib/launch-assignment-publish-smoke.test.ts`, `tests/api/engagement-verifications-route.test.ts`, `tests/lib/workflow-decision-record.test.ts`, and `tests/lib/authz-policy.test.ts` passed, 5 files / 34 tests.
- Reran Phase 2 focused review/reveal/authz checks: verification status/options, org match review, conversation reveal, engagement verification, authz, and decision-record tests passed, 7 files / 55 tests.
- Ran `npm run test:strict:quality`: strict E2E quality guard passed for 8 files.
- Attempted `npm run test:e2e:org:strict` in the sandbox; the web server could not bind `0.0.0.0:33100` due `EPERM`. Reran with approved escalation and the strict org Playwright suite passed `7/7` in 7.9m.
- Strict E2E emitted a slow `/api/assignments` GET warning at 21633ms and an unknown matrix skill warning for strict resume fixture skills; both are recorded as operational watch noise because the strict suite passed and Phase 3 already tracks assignment publish/perf hardening.
- Updated `docs/verification-checklist.md` so blind review, candidate-consented reveal, assignment create/edit/publish, and the full review-to-engagement corridor rows cite the fresh 2026-05-19 strict/workflow evidence.

14. Docs freshness still carried 44 registry warnings for existing artifact, audit, and migration README files.

- Registered the remaining orphan Markdown files in `docs/DOCS_REGISTRY.md` as reference or historical documentation surfaces, keeping generated source-refresh snapshots historical where appropriate.
- Reran `npm run docs:freshness`; it now passes with no findings.

15. API reference freshness lagged the launch route inventory.

- Updated `scripts/generate-api-reference.mjs` so generated API docs include the launch-surface classification from `src/lib/launch/surface-policy.ts`.
- Fixed method extraction for re-export-only handlers such as `/api/match/assignment`, `/api/match/interest`, and `/api/match/profile`, removing stale `UNKNOWN` method output.
- Regenerated `docs/API_REFERENCE.md`: it now reports 139 route handlers, 109 active MVP APIs, 16 internal launch-ops APIs, and 14 archived compatibility APIs.
- Admin/internal routes now show `Auth Tier` `internal` and `Launch Surface` `internal launch ops` instead of appearing as ordinary public endpoints.
- Archived compatibility routes such as legacy analytics, CV wizard, old deletion crons, `/api/match/test`, `/api/performance/track`, and `/api/profile/completeness` are explicitly marked `archived compatibility`.

16. Active source still called archived broad analytics APIs.

- Confirmed `src/lib/launch/surface-policy.ts` classifies `/api/analytics/**` as archived compatibility, while active UI/source code still posted to or read from broad analytics endpoints.
- Removed active UI calls to `/api/analytics/track`, `/api/analytics/events`, `/api/analytics/tour-event`, `/api/analytics/web-vitals`, `/api/analytics/dashboard-load-time`, `/api/analytics/demographic-opt-in`, and `/api/analytics/org/*`.
- Preserved local development diagnostics where useful, but stopped user-facing MVP surfaces from depending on archived analytics network calls.
- Moved stale pre-archive analytics route tests to `tests/archive/non_mvp_analytics_suite/` and added a README describing their historical status.
- Updated the default Vitest excludes so `tests/archive/**` cannot accidentally re-enter the default release signal.
- Active launch coverage remains in `tests/api/archived-api-handlers-route.test.ts`, `src/lib/__tests__/middleware-launch-archive.test.ts`, `tests/api/launch-surface-inventory.test.ts`, and `src/lib/launch/__tests__/surface-policy.test.ts`.

17. Active tests still imported archived mobile/admin implementation modules.

- Found active tests importing route handlers from `@/archive/non_launch_api/...`, including old `/api/mobile/v1/*` routes and archived admin CV import spend analytics.
- Moved the mobile route suites to `tests/archive/non_mvp_mobile_api/` with `.archived` filenames and a README that explains the route family is not part of the web MVP launch surface.
- Moved the archived CV import spend analytics route test to `tests/archive/non_mvp_admin_suite/` and updated that archive README.
- Added a launch-gate config test that walks active `tests/` files outside `tests/archive/` and fails if any active test imports `@/archive/`.
- Registered `tests/archive/non_mvp_mobile_api/README.md` in `docs/DOCS_REGISTRY.md`.

18. Active messages API reference still flagged a TODO.

- `docs/API_REFERENCE.md` showed `/api/conversations/[conversationId]/messages` as active MVP with `contains TODO` because the route documented a `before` cursor but did not use it.
- Implemented the `before` message cursor in the active messages route: the cursor must belong to the same conversation, and the message query now returns messages older than that cursor.
- Added focused route coverage in `tests/api/conversation-detail-routes.test.ts` to prove the cursor applies an older-than filter and preserves masked sender behavior.
- Regenerated `docs/API_REFERENCE.md`; the active conversations messages row no longer carries a TODO note.

19. Active backlog docs still treated the retired March route-breadth blocker as current.

- Found `docs/backlog/README.md` and `docs/backlog/phase-0-scope-lock.md` still saying Phase 0 route breadth was active and launch-blocking, with `no non-MVP launch surface` still `FAIL`.
- Updated both docs to `Last Verified: 2026-05-19`, retire the March `149 / 117` and `138 / 106` counts as historical only, and point current route-surface truth at `docs/verification-checklist.md`, `npm run test:launch:routes`, and this sweep artifact.
- Updated `docs/backlog/phase-exit-checklist.md` so Phase 0 route-surface exit reflects the 2026-05-19 pass, while keeping production launch smoke and monitor checks as pre-launch candidate actions.
- Updated `docs/DOCS_REGISTRY.md` for the refreshed backlog docs.

20. Historical audit banners still made stale current-route claims.

- Found historical March audit/report files outside `docs/archive/` whose superseded banners still said route breadth remained an open launch risk.
- Left the original audit bodies intact as historical evidence, but updated the freshness banners to say the route-breadth blocker was retired by 2026-05-19 route-surface evidence.
- Updated `docs/DOCS_REGISTRY.md` dates for the touched historical audit/report files.

21. Active backlog dependency docs still treated Phase 1 foundation work as unresolved.

- Found `docs/backlog/phase-1-foundation.md` still saying proof-first onboarding, Proof Pack anchor integrity, and export/delete/auditability needed to move from `UNVERIFIED` to `PASS`.
- Updated it to record the 2026-05-19 `PASS` disposition while keeping gated narrative-surface disposition as a non-blocking watch item.
- Updated `docs/backlog/dependency-map.md` so Phase 0 and Phase 1 are no longer shown as blocking later phases after the current sweep evidence.
- Updated `docs/DOCS_REGISTRY.md` dates for the refreshed backlog dependency docs.

22. Active verification/account settings copy still leaked implementation history.

- Found active verification UI copy such as `Legacy bundle request sent`, `Manage legacy bundle`, `legacy request`, and settings copy such as `account compatibility signal`.
- Replaced the visible labels with plain MVP language: Proof Pack bundle request, Manage bundle, grouped proof items, account-side checks, work email account check, and organization-linking support.
- Kept the underlying account-side behavior unchanged: work email can help organization linking, but it does not create public trust or intro eligibility by itself; LinkedIn remains read-only history outside the launch corridor.
- Added/updated focused UI expectations so active tests fail if the old legacy-bundle language returns.
- Browser evidence on `localhost:33180`: `/app/i/settings` rendered `Account-side checks`, `Work email account check`, and `LinkedIn account check`, with no `compatibility signal`, no `Account compatibility`, no loading state, and no runtime-error text after the settings content settled.

23. Legacy comprehensive PRD script still lived in the active test tree.

- Found `tests/comprehensive-prd-test.ts`, a manually runnable broad PRD database script that still checked retired Expertise Atlas and Zen/wellbeing tables.
- Moved it to `tests/archive/non_mvp_legacy_prd/comprehensive-prd.archived.ts` and added an archive README explaining that it is historical context only, not launch evidence.
- Registered the archive README in `docs/DOCS_REGISTRY.md`.

24. Active test surfaces still treated retired wellbeing APIs as live launch evidence.

- Found `tests/api-endpoints-test.ts`, a manually runnable broad endpoint script that still checked `/api/wellbeing/checkin`.
- Found `tests/lib/wellbeing-client.test.ts`, an active Vitest suite for retired wellbeing client helpers that call `/api/wellbeing/*` routes.
- Moved both to `tests/archive/non_mvp_wellbeing_api/` with `.archived` filenames and an archive README.
- Added launch-gate coverage so the retired broad script, wellbeing client suite, and active-test `/api/wellbeing` references cannot return to the default launch signal.
- Registered the archive README in `docs/DOCS_REGISTRY.md`.

25. Matching review-card copy still exposed internal compatibility wording.

- Found `src/lib/matching/review-contract.ts` producing `compatibility signal(s) present` labels when a candidate had verification history but no current Proof Pack verification summary.
- Replaced the fallback copy with plain proof-review language: scoped verification records and Proof Pack review.
- Added focused review-contract coverage so serialized review cards cannot reintroduce `compatibility signal` language through verification summary or trust labels.

26. Retired wellbeing/Zen implementation code still lived in the active source tree.

- Confirmed the old wellbeing/Zen page and APIs were already archived, but orphaned components and services still lived under active `src/components/{zen,wellbeing}` and `src/lib/{zen,wellbeing}`.
- Moved those inactive modules to `src/archive/non_launch_wellbeing/` and added a README tying the archive to the locked MVP corridor.
- Added launch-gate coverage so these retired implementation directories stay out of active `src/components` and `src/lib`.
- Registered the archive README in `docs/DOCS_REGISTRY.md`.

27. Retired Expertise Atlas implementation code still lived under the active app route tree.

- Confirmed `/app/i/expertise` no longer has an active page handler and is classified as archived, but the old Expertise Atlas client/widgets/components still lived under `src/app/app/i/expertise`.
- Moved that orphaned UI island to `src/archive/non_launch_pages/app/i/expertise/implementation/`.
- Added an archive README and launch-gate coverage so the retired page implementation stays out of active `src/app`.
- Updated the GCP CV/OCR proposal note so it no longer says active expertise/CV components still exist as code assets.
- Registered the archive README and refreshed proposal note in `docs/DOCS_REGISTRY.md`.

28. Retired fairness settings implementation code still lived in active source.

- Confirmed `/app/i/settings/fairness` is archived, but its old client and demographic opt-in component still lived under active `src/app` / `src/components`.
- Moved `FairnessSettingsClient` and `DemographicOptIn` into `src/archive/non_launch_pages/app/i/settings/fairness/implementation/`.
- Added archive README and launch-gate coverage so the old demographic/fairness settings implementation stays out of active app and shared component surfaces.
- Registered the archive README in `docs/DOCS_REGISTRY.md`.

29. Broad admin analytics/fairness dashboard code still lived in active source.

- Confirmed the active admin corridor only imports the admin shell, verification queue, and audit table, while broad users, organizations, metrics, performance, and fairness dashboard components were orphaned in active `src/components/admin`.
- Confirmed broad fairness note/report helpers were not imported by active launch code and belonged to archived admin/fairness routes.
- Moved broad admin analytics/fairness UI and helper modules to `src/archive/non_launch_admin_ui/`.
- Updated archived routes/tests to import the archived fairness helpers from their new archive location.
- Added launch-gate coverage so those broad dashboard/report modules stay out of active admin and analytics source.
- Registered the archive README in `docs/DOCS_REGISTRY.md`.

30. Active analytics constants and metric exports still advertised retired wellbeing/fairness families.

- Removed active `Well-Being Delta` and `Fairness Gap` metric exports/calculators from `src/lib/analytics/metrics.ts` after broad wellbeing/fairness surfaces were archived.
- Removed inactive wellbeing/reflection/privacy-banner event emitters and event constants from active analytics modules.
- Kept active consolidated metrics scoped to TTFQI, TTV, TTSC, Proof Fit Lift, and SUS.
- Verified no active source/test references remain outside historical database schema and migrations.

31. An orphaned metrics dashboard still lived in active components.

- Confirmed `src/components/metrics/MetricsDashboard.tsx` had no active source, test, or docs imports outside its own export.
- Moved the dashboard into `src/archive/non_launch_admin_ui/components/metrics/` as historical internal metrics UI context.
- Added launch-gate coverage so the active `src/components/metrics` directory stays absent unless the MVP authority stack changes.

32. Retired Expertise/CV import shared UI components still lived in active components.

- Confirmed `src/components/expertise/*` had no active source imports outside self-imports and archived documentation references.
- Moved the orphaned Expertise shared UI components, including the old CV/JD auto-suggest and CV import wizard UI, into the archived Expertise implementation tree.
- Updated archived self-imports and added launch-gate coverage so active `src/components/expertise` stays absent.
- Updated retained historical CV import docs so they point at the archived component path and mark the old `/api/expertise/auto-suggest` route as removed from the active route tree.

33. Generic customizable dashboard shell and Zen dashboard stubs still lived in active source.

- Confirmed the active individual home is the proof-first home page and the active organization home imports only focused dashboard cards plus the shared `sanitizeLayout` helper.
- Moved unused customizable/draggable dashboard shell files to `src/archive/non_launch_dashboard_ui/`.
- Moved the old draggable-dashboard visibility test to `tests/archive/non_mvp_dashboard_ui/`.
- Moved the null Zen dashboard stub and Zen data stub into `src/archive/non_launch_wellbeing/`.
- Added launch-gate coverage so those generic dashboard and Zen stub paths stay out of active source/tests.

34. Broad organization-suite components still lived in active source while only the lean trust profile was mounted.

- Confirmed active `/app/o/[slug]/profile` mounts only `OrgTrustProfileEditor`.
- Confirmed the old culture, structure, impact, projects, partnerships, organization basic-info, candidate-workspace, and stakeholder-assignment collaboration components were not imported by active app routes.
- Moved the broad organization-suite components to `src/archive/non_launch_org_suite/`.
- Moved the orphaned stakeholder assignment manager/invite UI to `src/archive/non_launch_assignment_collaboration/`.
- Moved stale active UI tests for those orphaned organization components to `tests/archive/non_mvp_org_suite/`.
- Added launch-gate coverage so the broad org-suite UI stays out of active source/tests while the lean `OrgTrustProfileEditor` remains active.

35. An orphaned organization home dashboard client still carried generic customization and old org-suite fetches.

- Confirmed the active organization home route now renders a fixed trust, assignment, review, and access corridor directly from `src/app/app/o/[slug]/home/page.tsx`.
- Found the unused `OrgDashboardClient` and `SuspendedOrgDashboardClient` still under the active app route tree with widget customization, quick presets, local saved layout state, and stale goals/projects fetches.
- Moved the orphaned organization dashboard client files to `src/archive/non_launch_dashboard_ui/app/o/[slug]/home/`.
- Removed active `getOrgGoalsData` and `getOrgProjectsData` from `src/lib/dashboard/orgDataFetchers.ts` because the active organization home no longer uses broad org goals/projects widgets.
- Added launch-gate coverage so the old organization home dashboard client stays archived.

36. The old loose dashboard widget-card layer still lived in active components after mounted homes moved to fixed corridor pages.

- Confirmed no active app route imports the old dashboard widgets; active individual and organization homes render focused corridor pages instead.
- Kept only the mounted dashboard utilities that active surfaces still import: `WidgetGridSkeleton` and `chipStyles`.
- Moved unused dashboard card components, including notification, readiness, matching, project, goals, team, interview, momentum, and org-readiness cards, to `src/archive/non_launch_dashboard_ui/components/dashboard/`.
- Moved direct tests for those unmounted widget cards to `tests/archive/non_mvp_dashboard_ui/`, while keeping active launch-discoverability coverage focused on mounted top-bar and settings behavior.
- Updated the organization team API comments away from the archived `TeamRolesCard` widget and added launch-gate coverage so the unmounted card layer stays archived.

37. Retired dashboard layout and broad organization-type defaults still lived in active libraries.

- Confirmed `src/lib/dashboard/layout.ts` was only referenced by its own active test after the customizable/dashboard-card UI was archived.
- Moved the retired dashboard widget definitions, preset layouts, layout sanitizer, drag-reorder helper, and their active test to the dashboard archive.
- Confirmed `src/lib/org/defaults.ts` and `src/lib/org/copy-variants.ts` had no active consumers and still carried broad organization-suite defaults for NGO, government, academic, cooperative, individual, dashboard widgets, public revenue/funding copy, and broad onboarding checklists.
- Moved those org defaults/copy modules to `src/archive/non_launch_org_suite/lib/org/`.
- Added launch-gate coverage so the retired dashboard layout engine and broad org-type defaults stay out of active source/tests.

38. Active tests and helpers still described archived contract-signing and old feedback SUS flows.

- Confirmed the active E2E `complete-user-journey` still described signup-to-contract-signing, imported a `ContractPage`, and referenced `/app/contracts/:id` and `/app/settings/data`.
- Moved that stale E2E and its page-object helpers to `tests/archive/non_mvp_contract_flow/`.
- Archived the unused `ContractSigned` email template plus unused contract-signed email and notification helper entry points that linked to archived `/app/contracts/*` routes.
- Confirmed `SUSTriggerProvider`, `SUSSurvey`, and the old `src/lib/feedback/sus-scoring.ts` were orphaned and called retired `/api/feedback/sus/*` endpoints, including a `post_contract` trigger.
- Moved the old feedback SUS trigger UI/scoring code to `src/archive/non_launch_feedback_sus/` while keeping the active `/api/surveys/sus` prompt components and calculator in place.
- Added launch-gate coverage so active code cannot reintroduce `/app/contracts` links and the retired contract/SUS trigger files stay archived.

39. Browser showed missing public portfolio links could render as a blank body.

- The Codex in-app Browser recheck of `/portfolio/demo` after the contract/SUS archive initially showed no runtime error but an empty visible body with a `NEXT_HTTP_ERROR_FALLBACK;404` template.
- Changed missing individual and organization public portfolio pages to render the same generic unavailable surface already used for hidden/unavailable public pages, avoiding existence leakage while ensuring first-time visitors see a clear outcome.
- Added route-local public portfolio not-found fallbacks as a defensive guard for future thrown segment 404s.
- Updated individual and organization public portfolio tests to assert the generic unavailable state for missing handles/slugs.

40. An active integration test still presented broad mock "critical gaps" as current MVP evidence.

- `tests/integration/critical-gaps.test.ts` used placeholder assertions for broad fairness reporting, generic web-vitals instrumentation, Zoom interview scheduling, and matching-profile weights rather than exercising current launch behavior.
- Moved it to `tests/archive/non_mvp_critical_gaps/critical-gaps.archived.test.ts` and added an archive README explaining why it is historical only.
- Added launch-gate coverage so the placeholder test stays out of active `tests/integration`.

41. Legacy Zoom platform labels could look like a native launch integration.

- Current scheduling already rejects native `platform: zoom` and tells users to use Google Meet or a manual meeting link, but active interview list and shared interview components still displayed legacy `platform: zoom` rows as `Zoom`.
- Updated individual and organization interview surfaces plus shared interview card/confirmation copy so legacy Zoom rows render as manual Zoom links, while explicit manual Zoom providers remain allowed.
- Updated the organization interview UI test to expect `Manual (Zoom)` instead of presenting Zoom as a native launch platform.

42. Active docs and orphaned libraries still described retired Zoom/video OAuth integration.

- `docs/ENV_VARIABLES.md` still listed Zoom OAuth variables and callback routes even though the route inventory classifies Zoom/video integration routes as archived and native Zoom scheduling is rejected at runtime.
- Moved the unused Zoom integration wrapper and older scaffolded `src/lib/video/**` wrappers into `src/archive/non_launch_integrations/preserved/lib/`.
- Updated the active environment-variable reference to describe Google Meet or manual meeting links as the launch interview path, and removed strict-provider guidance requiring Zoom.
- Updated the E2E matrix so it no longer points to the archived org fairness-note E2E as active admin evidence.
- Narrowed the strict provider E2E from a Zoom+Google requirement to Google Meet/manual-link launch behavior, while leaving native Zoom rejection covered by the schedule route tests.
- Removed a stale Zoom secret entry from the active security scan results document.
- Added launch-gate coverage so the retired Zoom/video wrappers stay out of active libraries.

## Browser Evidence

Tool: Codex in-app Browser at `http://localhost:33180`.

Latest check on 2026-05-19:

- Browser plugin connection worked in Codex. The selected in-app tab was `http://127.0.0.1:33180/portfolio/demo`.
- Browser screenshot and DOM inspection confirmed the route rendered `Public page unavailable`, with safe explanatory copy, `Return home` link `/`, and the privacy choices banner. No public profile data or private proof details were visible.

Continuation check on 2026-05-19:

- Reconnected the Codex in-app Browser after the original local server had stopped.
- Restarted the local dev server normally; `/portfolio/demo` and `/portfolio/demo-proofound` correctly rendered `Public page unavailable` in non-mock mode, with no public leak surface.
- Restarted the local dev server in mock mode after sandboxed port binding failed with `EPERM`; approved escalation allowed `NEXT_PUBLIC_USE_MOCK_SUPABASE=true MOCK_ORG_MODE=true MOCK_ADMIN_MODE=true npm run dev` to bind `localhost:3000`.
- Browser verified `/portfolio/demo-proofound` in mock mode: title `Proofound Public Page`, H1 `Mika Andersson`, primary actions `Copy share link`, `Download trust PDF`, `Copy recruiter summary`, and `Request introduction`; visible copy kept public-safe Proof Pack, direct-link, search-off, and private-details-hidden language.
- Browser verified `/portfolio/org/test-org` in mock mode: title `Proofound organization portfolio`, H1 `Test Organization`, action `Copy share link`, return link `/`, website link `https://test-org.example`, assignment clarity/proof expectations/seriousness-of-review sections, verified domain path, and blind-by-default consent separation.
- Browser verified `/` in mock mode: title `Proofound | Proof Behind the Claim`, H1 `Proof behind the claim`, CTAs route to `/signup`, `/signup/individual`, `/signup/organization`, `/login`, and legal links route to `/cookies`, `/cookies/settings`, `/privacy`, and `/terms`.
- Browser screenshot capture timed out in this runtime, so evidence was gathered through Browser navigation plus DOM/visible-state reads instead of screenshots.

Desktop checks:

- `/portfolio/demo` rendered `Public page unavailable` with no public leak surface observed.
- `/` rendered `Proof behind the claim`.
- `Create your proof portfolio` link count: 1.
- Clicking `Create your proof portfolio` navigated to `/signup/individual`.
- `Request a pilot` anchors point to `/signup/organization`; direct click landed on `/signup/organization`.
- `/signup`, `/signup/organization`, and `/signup/individual` loaded with expected signup headings.
- `/portfolio/demo` was rechecked through the Codex in-app Browser after restarting the local dev server: title `Public Page Unavailable | Proofound`, H1 `Public page unavailable`, Return home link `/`, console warnings/errors `[]`.
- `/portfolio/demo` was rechecked again through the Codex in-app Browser during the continued sweep: title `Public Page Unavailable | Proofound`, URL `http://localhost:33180/portfolio/demo`, safe unavailable copy rendered, and no obvious private-leak terms were present in the visible body text.
- After archiving the unmounted dashboard widget-card layer, Browser smoke covered `/portfolio/demo`, `/`, and `/portfolio/org/test-org`: no runtime-error text was visible. A deeper re-read of `/portfolio/demo` after hydration confirmed H1 `Public page unavailable`, title `Public Page Unavailable | Proofound`, and the safe unavailable message plus `Return home` action.
- After archiving the retired dashboard layout and broad org defaults libraries, Browser smoke rechecked `/portfolio/demo` and `/`: both rendered expected titles and visible content with no runtime-error text.
- After archiving stale contract-signing and old feedback SUS trigger helpers, Browser smoke rechecked `/portfolio/demo`, `/`, and `/api/health`: public routes rendered expected launch-safe content and `/api/health` returned only `status` and `timestamp`, with no runtime-error text.
- Browser caught a blank-body regression on missing public portfolio links during the continued sweep. After the route fix, `/portfolio/demo` rendered title `Public Page Unavailable | Proofound` with `PUBLIC PAGE UNAVAILABLE` copy, and `/portfolio/org/missing-org` rendered `ORGANIZATION PORTFOLIO UNAVAILABLE`; both had no runtime-error text and no console warnings/errors.
- After committing the contract/SUS and critical-gaps checkpoints, Browser rechecked `/portfolio/demo`, `/portfolio/org/missing-org`, and `/`: all rendered visible launch-safe content with no runtime-error text.

Mobile viewport check:

- Viewport: 390 x 844.
- `/` rendered `Proof behind the claim`.
- Mobile header `Sign in` and `Start` were visible.
- `/portfolio/demo` rendered `Public page unavailable`.

Authenticated/mock Browser check:

- Server: `NEXT_PUBLIC_USE_MOCK_SUPABASE=true PLAYWRIGHT=true PORT=33180 npm run dev -- --hostname 127.0.0.1 --port 33180`.
- `/onboarding` rendered H1 `Start with one Proof Pack`.
- After filling basic details and continuing, Browser rendered `Add one proof artifact`, `Proof link *`, `Ownership for this proof`, `What was your ownership? *`, `3 to 5 skills this proof supports *`, measured outcomes, scoped verification options, and `Save first Proof Pack`.
- DOM checks: `hasProofLink=true`, `hasProofPack=true`, `hasOwnership=true`, `hasHeadline=false`, `hasPercentComplete=false`, `hasResumeWizard=false`.

Authenticated individual Browser pass:

- Server mode: `NEXT_PUBLIC_USE_MOCK_SUPABASE=true PLAYWRIGHT=true`.
- `/app/i/home` rendered `Add your first proof record`, proof wallet checks, trust-anchor state, and private-by-default public-page visibility.
- `/app/i/portfolio` intentionally redirected into the profile safe-shell proof-pack tab and rendered `Mock Individual`, `Keep building proof readiness`, safe-shell basics, proof readiness, and locked public-page state.
- `/app/i/verifications` rendered `Proof verification requests`, incoming/sent filters, zero-state copy, and bounded request status language without loading or runtime-error text after settling.
- `/app/i/communications` rendered proof-safe communications, messages/interviews tabs, reveal/interview/decision language, and private-before-reveal empty state.
- `/app/i/settings/privacy` rendered privacy controls, export/account-history actions, visibility summary, and data categories without runtime-error text.

Authenticated organization Browser pass:

- Server mode: `NEXT_PUBLIC_USE_MOCK_SUPABASE=true PLAYWRIGHT=true MOCK_ORG_MODE=true`.
- `/app/o/test-org/home` rendered `Test Organization`, launch corridor queue, trust/profile/assignment readiness, and minimal role-access context.
- `/app/o/test-org/assignments` rendered `Assignments`, one-assignment corridor copy, `Create assignment`, and empty-state next actions.
- `/app/o/test-org/assignments/new` rendered the lean assignment builder with purpose, work, proof, constraints, and review/publish steps; the next action is disabled until required role context is supplied.
- `/app/o/test-org/interviews` rendered the empty active-hiring-corridor state with shortlist/interview/decision/engagement verification language.
- `/app/o/test-org/communications` rendered organization messages/interviews tabs, intro/reveal request language, and privacy-safe no-conversations state.
- `/app/o/test-org/portfolio` redirected to `/portfolio/org/test-org?returnTo=...` and rendered public organization trust content with direct-link sharing, proof expectations, verified domain path, and consented reveal separation.
- `/app/o/test-org/shortlist` intentionally redirected to assignments, matching the active route-shortcut contract and hidden standalone shortlist navigation.

Authenticated admin/internal Browser pass:

- Non-admin mock mode: `/admin`, `/admin/verification`, and `/admin/audit` all redirected to `403` with no diagnostic leak.
- Admin mock mode: `/admin` rendered `Launch Operations` with narrow links to operations queues and audit support.
- `/admin/verification` rendered `Operations Queues`, verification/privacy/reveal/risky-upload/pilot queues, and empty verification queue state.
- `/admin/audit` rendered `Audit Logs` with administrative action rows and pagination.
- Mobile viewport 390 x 844: `/admin/verification` and `/portfolio/org/test-org` rendered with `hasHorizontalOverflow=false` and no runtime-error text.

Analytics archive follow-up on 2026-05-19:

- The requested Browser target `http://localhost:33180/portfolio/demo` initially refused connections; restarted the local dev server on port `33180`.
- Browser verified `/portfolio/demo` on `localhost:33180` as an intentional not-found/public-unavailable route with no runtime-error text or horizontal overflow.
- Browser verified `/portfolio/demo-proofound` on `localhost:33180`: title `Proofound Public Page`, H1 `Mika Andersson`, direct-link proof snapshot actions, no runtime-error text, and no horizontal overflow.
- Browser verified `/`, `/portfolio/org/test-org`, and non-admin `/admin` on `localhost:33180`: landing, public organization trust page, and 403 guard all rendered without runtime-error text or horizontal overflow.
- Browser screenshot capture timed out again in this runtime, so evidence was recorded through Browser navigation, DOM/visible-state reads, console issue checks, and HTTP status/body inspection.

Privacy data inventory follow-up on 2026-05-19:

- Finding: the active individual privacy page rendered a placeholder/mock data inventory and mixed stale "trust badges" copy into the privacy/export surface.
- Fix: `src/components/privacy/DataBreakdown.tsx` now reads real counts from a read-only `/api/user/data-inventory` endpoint, keeps `/api/user/export` only for the explicit download action, labels privacy tiers in plain language, and keeps a launch-safe fallback state when inventory loading fails.
- Route policy: `/api/user/data-inventory` is explicitly classified as active MVP under the account/privacy/export/delete basics corridor and is covered by route inventory, surface-policy, and middleware launch-archive tests.
- Browser evidence on `localhost:33180`: `/app/i/settings/privacy` rendered `Privacy settings`, `Your data`, `Proof and verification`, `Download my data`, and real count chips (`profile=2`, `professional=2`, `proof=8`, `matching=0`, `activity=5`) with no inventory error, no stale `Trust badges` copy, and no console errors.
- Browser endpoint evidence: authenticated `/api/user/data-inventory` returned `{"counts":{"profile":2,"professional":2,"proof":8,"matching":0,"activity":5}}`; unauthenticated curl returned `401 Unauthorized`.
- Privacy/no-leak evidence: after the read-only endpoint landed, Browser page loads produced `/api/user/data-inventory` and did not produce passive `/api/user/export` lifecycle logs. Export lifecycle remains tied to the explicit `Download my data` action.
- Follow-up fix: the account-settings inline privacy branch now reuses the same read-only `components/privacy/DataBreakdown` component; the stale `components/settings/DataBreakdown` component that fetched `/api/user/export` just to render data on screen was removed.
- Browser account-settings evidence: `/app/i/settings` rendered without runtime errors; opening the `Privacy & Data` tab through Browser timed out in the browser-control layer, so the no-passive-export behavior for that branch is covered by focused UI tests rather than a completed click-through Browser trace.

Cookie settings copy follow-up on 2026-05-19:

- Finding: the public cookie preferences page used broad "use our platform" language and ad-targeting examples that did not match the calm locked-MVP corridor.
- Fix: `src/components/cookies/CookiePreferences.tsx` now frames analytics as product-quality/fix-bugs measurement and marketing cookies as consented Proofound update/campaign measurement, without ad-targeting language.
- Browser evidence on `localhost:33180`: `/cookies/settings` rendered `Cookie Settings`, `Help us understand how Proofound is working`, and no `use our platform` or `Ad targeting` copy; no runtime error or console errors were present.

Organization dashboard archived-navigation follow-up on 2026-05-19:

- Finding: active organization dashboard widgets still routed team/goals actions to archived or hard-gated routes (`/app/o/[slug]/settings/team`, `/app/o/[slug]/settings/goals`, and `/app/o/[slug]/team`), even though launch inventory and route-policy tests intentionally keep those surfaces outside the MVP corridor.
- Fix: `src/components/dashboard/OrgGoalsCard.tsx` and `src/components/dashboard/TeamRolesCard.tsx` now route dashboard actions back to the active organization profile surface and use plain launch/post-launch copy instead of false "invite", "new", or "manage" affordances.
- Browser evidence: Browser initially hit `ERR_CONNECTION_REFUSED` on `localhost:33180`, so the local dev server was restarted on the same port. Browser then verified `/portfolio/demo` on `127.0.0.1:33180` rendered the launch-safe public unavailable card with no framework overlay and no console warnings/errors. Attempted `/app/o/test-org/home` Browser smoke redirected to `/app/i/home` under the current Browser session, so the dashboard link regression is covered by focused UI tests rather than authenticated org Browser evidence in this slice.
- Test evidence: `tests/ui/org-dashboard-archived-nav.test.tsx` asserts the goal and team dashboard widgets expose only `/app/o/acme/profile` links and no archived settings/team hrefs.

CV import documentation and E2E hard-gate follow-up on 2026-05-19:

- Finding: `docs/features/cv-import.md` and `docs/features/cv-import-testing-guide.md` were classified as historical, but still contained body copy and commands that made the retired `/app/i/expertise` CV import wizard read like a runnable launch QA flow. The only CV import hard-gate Playwright spec also lived under `tests/e2e`, while `playwright.config.ts` discovers `e2e`, so the documented direct command could not find the test.
- Fix: both docs now lead with the current launch truth (`/app/i/expertise` 404, `/api/expertise/cv-import/wizard-*` 410, no launch nav exposure), old manual scenarios are explicitly labeled historical, and the hard-gate spec was moved to `e2e/cv-import-non-launch.spec.ts`.
- Test evidence: `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npx playwright test e2e/cv-import-non-launch.spec.ts --project=chromium --reporter=line --workers=1` passed, 2/2. A direct default-runtime `npx playwright test ...` failed first because the shell resolved Node 16, and the first Node 25 sandbox run failed to bind `0.0.0.0:33100`; the approved escalated rerun passed.

Current truth route-count refresh on 2026-05-19:

- Finding: active `docs/CURRENT_TRUTH.md` still carried May 14 route counts and stale docs-freshness warning text.
- Fix: refreshed the active route-count section to the current route policy evidence: 140 API handlers, 51 pages, 110 active APIs, 16 internal-only APIs, 14 archived API compatibility handlers, 48 active pages, and 3 internal-only pages.
- Evidence: direct route-count script using `classifyLaunchApiPath` / `classifyLaunchPagePath` produced those counts, and `npm run test:launch:routes` passed, 4 files / 25 tests.

Verification checklist route-count refresh on 2026-05-19:

- Finding: active `docs/verification-checklist.md` still carried the previous `139` compiled API handler / `109` active API count in the no-non-MVP-launch-surface row, while `docs/CURRENT_TRUTH.md` and the direct route-policy evidence had advanced to `140` / `110`.
- Fix: refreshed the checklist row and this sweep artifact's running route note to the current route-policy counts: 140 API handlers, 51 pages, 110 active APIs, 16 internal-only APIs, 14 archived API compatibility handlers, 48 active pages, and 3 internal-only pages.
- Browser evidence: reconnected the Codex in-app Browser on the existing `127.0.0.1:33180/portfolio/demo` tab. Browser is functional; the page currently renders the intentional launch-safe `Public page unavailable` state with Return home and cookie controls, matching prior public unavailable evidence for this route.
- Test evidence: `npm run docs:freshness`, `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test:launch:routes`, and `git diff --check` passed.

Active copy corridor refresh on 2026-05-19:

- Finding: reachable or semi-reachable active helpers still used broad archived product language such as `Expertise Atlas`, `20,000+ skill taxonomy`, `Gap Analysis`, `Expertise Mapping`, and automatic Zoom/Google Meet scheduling in user-facing tour, recovery, dashboard, assignment-builder, and verification-notification copy.
- Fix: replaced that copy with proof-first corridor language: proof-linked skills, private CV context, readiness gaps, proof requirements, assignment/engagement evidence, manual meeting-link control, and `Proof skills`.
- Guardrails: added focused assertions so recovery actions, dashboard readiness suggestions, and assignment-builder step 5 stay out of archived `Expertise Atlas` / `Expertise Mapping` language.
- Evidence: focused tests for recovery actions, dashboard layout, and step 5 assignment builder passed; lint, typecheck, and `git diff --check` passed.

Archived Expertise UI test cleanup on 2026-05-19:

- Finding: the archive README said old Expertise Atlas UI tests were out of active discovery, but `tests/ui/proof-pack-assistant.test.tsx` still imported `@/app/app/i/expertise/components/edit-skill/ProofsSection`, a UI component inside the retired `/app/i/expertise` island. This made archived skill-editor UI look like active Proof Pack Assistant evidence.
- Fix: moved that UI test to `tests/archive/non_mvp_expertise_ui/proof-pack-assistant.archived.tsx`, updated the archive README, and added a launch-gate assertion that active tests cannot import the retired Expertise Atlas UI island.
- Adjacent route fix: `src/components/expertise/GapMap.tsx` no longer sends users to archived `/app/i/expertise`; its fallback action now routes to `/app/i/profile?profileView=full&tab=proof_packs` and uses proof-first button copy.
- Evidence: active Proof Pack Assistant API/privacy tests still pass; archived-route and launch-gate tests pass; launch route inventory still passes; lint, typecheck, docs freshness, and `git diff --check` pass.

Archived Expertise E2E helper cleanup on 2026-05-19:

- Finding: retired Expertise Atlas Playwright helpers still lived in active `e2e/helpers` and routed setup through `/app/i/expertise`, while archived specs already imported them as `../helpers/...` from inside `e2e/archive/*`. The active `e2e/PRD_CRITERIA_VALIDATION.md` reference also still described old comprehensive Expertise Atlas, broad matching, Zen, and legacy integration suites as current browser-test coverage.
- Fix: moved `expertise-helpers.ts` and `test-data-setup.ts` to `e2e/archive/helpers/`, added an archive README, and added a launch-gate assertion that active E2E helpers must not navigate to `/app/i/expertise`.
- Docs cleanup: reframed `e2e/PRD_CRITERIA_VALIDATION.md` as historical/reference-only and pointed current launch evidence to strict E2E, focused workflow/org-corridor tests, route inventory, and the archived CV import hard gate.
- Evidence: launch-gate, archived route, launch page inventory, route inventory, docs freshness, lint, typecheck, and `git diff --check` passed.

Archived CV import docs cleanup on 2026-05-19:

- Finding: `docs/features/cv-import.md` and `docs/features/cv-import-testing-guide.md` were correctly marked historical, but remaining body copy still used launch-sounding labels such as current runtime modes, expected results, goals, current limits, and current support/maintainer ownership for the retired Expertise Atlas CV import wizard.
- Fix: changed those sections to explicitly historical language, updated their Last Verified dates and registry entries, and registered the archived E2E helper README that supports the moved non-MVP helpers.
- Evidence: `npm run docs:freshness` passed with no findings; focused launch page / archived API tests passed; escalated `npx playwright test e2e/cv-import-non-launch.spec.ts --project=chromium --reporter=line --workers=1` passed 2/2 after the sandboxed attempt failed to bind `0.0.0.0:33100`; `git diff --check` passed.

## Verification

Commands run with Node 25 path:

- `npm run test:launch:routes` - passed, 4 files / 25 tests.
- `npm run test -- tests/ui/projects-card.test.tsx tests/ui/landing-footer-links.test.tsx tests/ui/landing-header-touch-targets.test.tsx tests/ui/landing-copy-guardrails.test.tsx tests/ui/landing-hero-headline-semantics.test.tsx` - passed, 5 files / 6 tests.
- `npm run test -- tests/api/launch-page-inventory.test.ts tests/api/launch-surface-inventory.test.ts tests/ui/admin-dashboard-launch-links.test.tsx tests/ui/admin-verification-dashboard.test.tsx tests/ui/admin-audit-log-table.test.tsx` - passed, 5 files / 17 tests.
- `npx vitest run --config vitest.archived.config.ts src/archive/non_launch_api/app/api/admin/__tests__/cron-summary-route.archived.test.ts src/archive/non_launch_api/app/api/admin/__tests__/fairness-metrics-route.archived.test.ts src/archive/non_launch_api/app/api/admin/__tests__/fairness-report-route.archived.test.ts src/archive/non_launch_api/app/api/admin/__tests__/users-route.archived.test.ts tests/ui/admin-ai-spend-page.test.tsx tests/ui/admin-fairness-notes-page.test.tsx` - passed, 6 files / 13 tests.
- `npm run test -- tests/ui/individual-setup-proof-first.test.tsx tests/routes/onboarding-page.test.ts tests/actions/onboarding.test.ts tests/actions/onboarding-private-context-scaffolding.test.ts tests/lib/canonical-skill-proof-write.test.ts tests/lib/individual-readiness-state.test.ts` - passed, 6 files / 27 tests.
- `npm run test -- tests/lib/proof-pack-anchor.test.ts tests/lib/canonical-skill-proof-write.test.ts tests/lib/individual-readiness-state.test.ts tests/actions/onboarding.test.ts tests/actions/onboarding-private-context-scaffolding.test.ts tests/api/expertise-user-skill-proofs-route.test.ts tests/lib/portfolio-export-data.test.ts tests/api/portfolio-export-route.test.ts tests/api/public-portfolio-export-route.test.ts tests/api/portfolio-text-pack-route.test.ts tests/lib/verification-integrity-alignment.test.ts` - passed, 11 files / 46 tests.
- `npm run test -- tests/api/public-portfolio-summary-route.test.ts tests/api/public-portfolio-export-route.test.ts tests/api/portfolio-export-route.test.ts tests/api/portfolio-org-export-route.test.ts tests/api/org-audit-export-routes.test.ts tests/api/cron-account-deletion-workflow-route.test.ts tests/api/user-account-lifecycle-routes.test.ts tests/api/user-export-route.test.ts tests/api/user-audit-log-purpose-route.test.ts tests/ui/settings-audit-log-page.test.tsx tests/ui/privacy-overview-copy.test.tsx` - passed, 11 files / 55 tests.
- `npm run test:launch:routes` - passed, 4 files / 25 tests.
- `npm run test -- tests/ui/privacy-overview-copy.test.tsx` - passed, 1 file / 2 tests.
- `npm run test:launch:workflow` - passed, 14 files / 88 tests.
- `npm run test:launch:org-corridor` - passed, 5 files / 41 tests.
- `npm run test -- tests/api/assignments-publish-route.test.ts tests/lib/launch-assignment-publish-smoke.test.ts tests/api/engagement-verifications-route.test.ts tests/lib/workflow-decision-record.test.ts tests/lib/authz-policy.test.ts` - passed, 5 files / 34 tests.
- `npm run test -- tests/api/verification-status-route.test.ts tests/ui/verification-status-options.test.tsx tests/api/org-match-review-route.test.ts tests/api/conversation-reveal-route.test.ts tests/api/engagement-verifications-route.test.ts tests/lib/authz-policy.test.ts tests/lib/workflow-decision-record.test.ts` - passed, 7 files / 55 tests.
- `npm run test:strict:quality` - passed for 8 strict E2E files.
- `npm run test:e2e:org:strict` - first sandbox run failed before tests because the Playwright web server could not bind `0.0.0.0:33100` (`EPERM`); approved escalated rerun passed, 7/7 in 7.9m.
- `node scripts/generate-api-reference.mjs` - regenerated `docs/API_REFERENCE.md` with 139 endpoints across 31 families and launch-surface classifications.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test:launch:routes` - passed, 4 files / 25 tests, after the default Node runtime failed before tests on `node:fs/promises.constants`.
- `npm run lint` - passed.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed.
- `npm run docs:freshness` - passed with no findings after registry cleanup.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/api/archived-api-handlers-route.test.ts src/lib/__tests__/middleware-launch-archive.test.ts tests/api/launch-surface-inventory.test.ts tests/scripts/launch-gate-config.test.ts` - passed, 4 files / 24 tests.
- `git diff --check` - passed.
- `npm run lint` - passed.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed.
- `npm run docs:freshness` - passed.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/scripts/launch-gate-config.test.ts tests/api/launch-surface-inventory.test.ts` - passed, 2 files / 9 tests.
- `npm run lint` - passed.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/api/conversation-detail-routes.test.ts` - passed, 1 file / 3 tests.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed.
- `node scripts/generate-api-reference.mjs` plus Prettier - regenerated `docs/API_REFERENCE.md` with the conversation messages TODO removed.
- `npm run docs:freshness` - passed.
- `npm run lint` - passed.
- `git diff --check` - passed.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/ui/privacy-data-breakdown.test.tsx src/lib/launch/__tests__/surface-policy.test.ts src/lib/__tests__/middleware-launch-archive.test.ts tests/api/launch-surface-inventory.test.ts` - passed, 4 files / 21 tests.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/ui/privacy-overview-copy.test.tsx tests/ui/privacy-data-breakdown.test.tsx` - passed, 2 files / 5 tests.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/ui/cookie-preferences-copy.test.tsx tests/ui/cookie-settings-page.test.tsx tests/ui/cookie-banner.test.tsx` - passed, 3 files / 7 tests.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/ui/org-dashboard-archived-nav.test.tsx tests/ui/archived-mvp-routes.test.ts tests/api/launch-page-inventory.test.ts src/lib/launch/__tests__/surface-policy.test.ts` - passed, 4 files / 18 tests.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npx playwright test e2e/cv-import-non-launch.spec.ts --project=chromium --reporter=line --workers=1` - passed, 1 file / 2 tests.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/api/launch-page-inventory.test.ts src/lib/launch/__tests__/surface-policy.test.ts src/lib/__tests__/middleware-launch-archive.test.ts` - passed, 3 files / 20 tests.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test:launch:routes` - passed, 4 files / 25 tests.
- `npm run docs:freshness` - passed with no findings after the verification checklist route-count refresh.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test:launch:routes` - passed, 4 files / 25 tests, after the verification checklist route-count refresh.
- `git diff --check` - passed after the verification checklist route-count refresh.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- src/lib/__tests__/recovery-actions.test.ts tests/dashboard-layout.test.ts tests/ui/step5-expertise-mapping.test.tsx` - passed, 3 files / 16 tests, after the active copy corridor refresh.
- `npm run lint` - passed after the active copy corridor refresh.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed after the active copy corridor refresh.
- `git diff --check` - passed after the active copy corridor refresh.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/scripts/launch-gate-config.test.ts tests/ui/archived-mvp-routes.test.ts tests/api/proof-pack-assistant-route.test.ts tests/lib/proof-pack-assistant.test.ts` - passed, 4 files / 20 tests, after archiving the stale proof-assistant UI test.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test:launch:routes` - passed, 4 files / 25 tests, after archiving the stale proof-assistant UI test.
- `npm run docs:freshness` - passed with no findings after updating the non-MVP expertise UI archive README.
- `npm run lint` - passed after the stale expertise UI test cleanup.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed after the stale expertise UI test cleanup.
- `git diff --check` - passed after the stale expertise UI test cleanup.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/scripts/launch-gate-config.test.ts tests/api/launch-page-inventory.test.ts tests/ui/archived-mvp-routes.test.ts` - passed, 3 files / 14 tests, after moving retired Expertise E2E helpers under archive.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test:launch:routes` - passed, 4 files / 25 tests, after moving retired Expertise E2E helpers under archive.
- `npm run docs:freshness` - passed with no findings after reframing `e2e/PRD_CRITERIA_VALIDATION.md`.
- `npm run lint` - passed after moving retired Expertise E2E helpers under archive.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed after moving retired Expertise E2E helpers under archive.
- `git diff --check` - passed after moving retired Expertise E2E helpers under archive.
- `npm run docs:freshness` - passed with no findings after the archived CV import docs cleanup and archive helper README registry update.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/api/launch-page-inventory.test.ts tests/api/archived-api-handlers-route.test.ts` - passed, 2 files / 15 tests, after the archived CV import docs cleanup.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npx playwright test e2e/cv-import-non-launch.spec.ts --project=chromium --reporter=line --workers=1` - passed, 1 file / 2 tests, after approved escalation; the first sandbox attempt failed before tests because the Playwright web server could not bind `0.0.0.0:33100`.
- `git diff --check` - passed after the archived CV import docs cleanup.
- `node scripts/generate-api-reference.mjs` plus Prettier - regenerated `docs/API_REFERENCE.md` with `/api/user/data-inventory` active.
- `npm run lint` - passed after removing the privacy component hook-dependency warning.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed.
- `npm run docs:freshness` - passed.
- `git diff --check` - passed.
- `rg` active-source analytics sweep after cleanup: no active UI/source fetches to `/api/analytics/**` remain outside route policy and middleware/archive tests.
- `rg` active-test archived-import sweep after mobile/admin cleanup: active tests no longer import `@/archive/` or `src/archive` implementation modules outside launch-gate config checks.
- `rg` active-test sweep after archiving: active tests no longer import `ExpertiseAtlasClient`, old CV/JD import wizard components, broad Add Skill drawer flows, or archived L4 card/widget tests outside `tests/archive/`.
- `rg` active-test sweep after admin archiving: active tests outside `src/archive` and `tests/archive` no longer import archived admin users/fairness route modules, `OrganizationsTable`, `generateFairnessNoteResult`, or the retired `calculateFairnessGaps` broad admin helper.
- Current-doc stale route sweep no longer finds active non-archive assertions that `/app/i/expertise`, `/app/i/projects`, legacy CV wizard routes, contracts/projects modules, or Expertise Atlas UI are launch surfaces in the patched README, retained setup, accessibility, mobile parity, and QA summary docs.
- Browser plugin reconnection on `http://127.0.0.1:33180/app/i/settings` - passed, current tab rendered meaningful Settings content and no console warnings/errors.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/scripts/launch-gate-config.test.ts src/lib/launch/__tests__/surface-policy.test.ts` - passed, 2 files / 19 tests, after archiving retired wellbeing API tests.
- `rg -n "api-endpoints-test|wellbeing-client\.test|/api/wellbeing" tests -g '!tests/archive/**'` - only launch-gate path-existence assertions remain; no active test exercises retired wellbeing API calls.
- `git diff --check` - passed after archiving retired wellbeing API tests.
- `npm run lint` - passed after archiving retired wellbeing API tests.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed after archiving retired wellbeing API tests.
- `npm run docs:freshness` - passed after registering the retired wellbeing API archive README.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/lib/matching-review-contract.test.ts tests/api/org-match-review-route.test.ts tests/api/match-explain-route.test.ts` - passed, 3 files / 36 tests, after matching review-card copy cleanup.
- `rg -n "compatibility signal|Compatibility signals" src tests -g '!tests/archive/**' -g '!src/archive/**'` - only the new negative review-contract assertion remains.
- `git diff --check` - passed after matching review-card copy cleanup.
- `npm run lint` - passed after matching review-card copy cleanup.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed after matching review-card copy cleanup.
- `npm run docs:freshness` - passed after matching review-card copy cleanup.
- `rg -n "@/components/(zen|wellbeing)|@/lib/(zen|wellbeing)|src/components/(zen|wellbeing)|src/lib/(zen|wellbeing)|/api/wellbeing|components/zen|components/wellbeing|lib/zen|lib/wellbeing" src tests -g '!src/archive/**' -g '!tests/archive/**'` - no active implementation imports remain; only launch-gate assertions and route-surface policy coverage mention the archived API family.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/scripts/launch-gate-config.test.ts src/lib/launch/__tests__/surface-policy.test.ts tests/api/launch-surface-inventory.test.ts` - passed, 3 files / 24 tests, after archiving orphaned wellbeing/Zen implementation modules.
- `npm run docs:freshness` - passed after registering the wellbeing/Zen source archive README.
- `git diff --check` - passed after archiving orphaned wellbeing/Zen implementation modules.
- `npm run lint` - passed after archiving orphaned wellbeing/Zen implementation modules.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed after archiving orphaned wellbeing/Zen implementation modules.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/scripts/launch-gate-config.test.ts tests/ui/archived-mvp-routes.test.ts src/lib/launch/__tests__/surface-policy.test.ts tests/api/launch-page-inventory.test.ts` - passed, 4 files / 28 tests, after archiving the retired Expertise Atlas implementation island.
- `npm run docs:freshness` - passed after registering the Expertise Atlas implementation archive README and refreshing the GCP CV/OCR proposal note.
- `npm run lint` - passed after archiving the retired Expertise Atlas implementation island.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed after archiving the retired Expertise Atlas implementation island.
- `rg -n "FairnessSettingsClient|DemographicOptIn|settings/fairness|demographic analytics|demographic-opt-in" src tests -g '!src/archive/**' -g '!tests/archive/**'` - no active UI implementation references remain; retained hits are schema types, archive/route guardrails, and route-surface policy.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/scripts/launch-gate-config.test.ts tests/ui/archived-mvp-routes.test.ts src/lib/launch/__tests__/surface-policy.test.ts tests/api/launch-page-inventory.test.ts` - passed, 4 files / 29 tests, after archiving the retired fairness settings implementation.
- `npm run docs:freshness` - passed after registering the archived fairness settings README.
- `git diff --check` - passed after archiving the retired fairness settings implementation.
- `npm run lint` - passed after archiving the retired fairness settings implementation.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed after archiving the retired fairness settings implementation.
- `rg -n "@/lib/analytics/fairness|@/lib/analytics/fairness-gaps|@/lib/analytics/fairness-note-generator|@/lib/analytics/fairness-types|@/lib/reports/fairness-note|@/components/admin/(DateRange|Fairness|Metric|Metrics|Performance)|@/components/admin/(analytics|organizations|users)|@/components/analytics|@/components/dashboard/org/FairnessNoteCard|FairnessDashboard|FairnessReportView|FairnessNoteDashboard|calculateFairnessGaps" src tests -g '!src/archive/**' -g '!tests/archive/**'` - no active source/test consumers remain beyond the launch-gate archive assertions.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/scripts/launch-gate-config.test.ts tests/ui/admin-dashboard-launch-links.test.tsx tests/ui/admin-verification-dashboard.test.tsx tests/ui/admin-audit-log-table.test.tsx tests/ui/archived-mvp-routes.test.ts tests/api/launch-page-inventory.test.ts` - passed, 6 files / 29 tests, after archiving broad admin analytics/fairness modules.
- `npm run docs:freshness` - passed after registering the broad admin analytics/fairness archive README.
- `git diff --check` - passed after archiving broad admin analytics/fairness modules.
- `npm run lint` - passed after archiving broad admin analytics/fairness modules.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed after archiving broad admin analytics/fairness modules.
- Browser plugin opened `http://localhost:33180/portfolio/demo` - passed, rendered `Public Page Unavailable | Proofound`; Browser reported one console error but the referenced MCP log artifact was not readable from the repo.
- `rg -n "WellBeingDelta|WELLBEING_DELTA|calculateWellBeingDelta|calculateFairnessGap|FairnessGapResult|FAIRNESS_GAP|WellbeingCheckinSubmittedProps|WellbeingOptInChangedProps|ReflectionAddedProps|emitWellbeing|emitReflectionAdded|emitPrivacyBannerAcknowledged|PRIVACY_BANNER_ACKNOWLEDGED|wellbeing_checkin|wellbeing_opt_in|wellbeing_reflection|wellbeing_delta|fairness_gap" src tests -g '!src/archive/**' -g '!tests/archive/**'` - active code/test references are gone; remaining hits are historical database schema and migrations.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/api/cron-health-check-route.test.ts src/lib/analytics/__tests__/metrics.test.ts tests/scripts/launch-gate-config.test.ts` - passed, 3 files / 43 tests, after narrowing active analytics metrics/events.
- `rg -n "components/metrics|MetricsDashboard" src tests docs -g '!src/archive/**' -g '!tests/archive/**' -g '!docs/archive/**'` - active references were limited to the orphaned component export and the launch-gate archive assertion before the move.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/scripts/launch-gate-config.test.ts` - passed, 1 file / 14 tests, after moving the orphaned metrics dashboard and removing the empty active `src/components/metrics` directory.
- `rg -n "CvImportWizard|CVJDAutoSuggest|components/expertise|@/components/expertise|expertise/cv-import" src tests docs -g '!src/archive/**' -g '!tests/archive/**' -g '!docs/archive/**'` - active component references were limited to orphaned shared Expertise UI, docs that already classify the CV wizard as archived, active library/parser tests, and archive/route-policy assertions.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/scripts/launch-gate-config.test.ts tests/api/archived-api-handlers-route.test.ts tests/api/launch-surface-inventory.test.ts` - passed, 3 files / 29 tests, after archiving shared Expertise/CV import UI components.
- `npm run lint` - passed after archiving shared Expertise/CV import UI components.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed after archiving shared Expertise/CV import UI components.
- `npm run docs:freshness` - passed after archiving shared Expertise/CV import UI components.
- `git diff --check` - passed after archiving shared Expertise/CV import UI components.
- `rg -n "CustomizeModal|DashboardSkeleton|DashboardTile|DynamicDashboard|DashboardCustomizer|CustomizableDashboard|DraggableDashboard" src tests docs -g '!src/archive/**' -g '!tests/archive/**' -g '!docs/archive/**'` - active references were limited to the old draggable-dashboard test and the unused customizable dashboard shell before the move.
- `rg -n "CustomizableDashboard|CustomizeModal|DashboardCustomizer|DashboardSkeleton|DashboardTile|DraggableDashboard|DynamicDashboard|ZenSnapshotCard|src/data/zen|@/data/zen" src tests docs -g '!src/archive/**' -g '!tests/archive/**' -g '!docs/archive/**'` - active references are now limited to launch-gate assertions and the separate active `src/components/skeletons/DashboardSkeleton.tsx`.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/scripts/launch-gate-config.test.ts tests/dashboard-layout.test.ts tests/ui/widget-grid-skeleton.test.tsx tests/ui/projects-card.test.tsx tests/ui/org-dashboard-archived-nav.test.tsx` - passed, 5 files / 28 tests, after archiving the generic customizable dashboard shell and Zen stubs.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test:launch:routes` - passed, 4 files / 25 tests, after archiving the generic customizable dashboard shell and Zen stubs.
- `npm run lint` - passed after archiving the generic customizable dashboard shell and Zen stubs.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed after archiving the generic customizable dashboard shell and Zen stubs.
- `npm run docs:freshness` - passed after archiving the generic customizable dashboard shell and Zen stubs.
- `git diff --check` - passed after archiving the generic customizable dashboard shell and Zen stubs.
- `rg -n "StakeholderInviteDialog|StakeholderAssignmentForm|OrgCandidatesWorkspace|OrganizationBasicInfoEditor|OrganizationHero|OrganizationPurpose|BasicInfoForm|CultureEditor|ProjectsManager|PartnershipsManager|StructureManagerClient|ImpactDashboard|GoalsManager|JDMapper" src/app src/components tests -g '!src/archive/**' -g '!tests/archive/**'` - before the move, active hits were limited to orphaned organization-suite components/tests and orphaned assignment collaboration components.
- `rg -n "@/components/organization|src/components/organization|@/components/assignments/(AssignmentManager|Stakeholder)|StakeholderInviteDialog|StakeholderAssignmentForm|OrgCandidatesWorkspace|OrganizationBasicInfoEditor|CultureEditor|ProjectsManager|PartnershipsManager|StructureManagerClient|ImpactDashboard|GoalsManager|JDMapper" src/app src/components tests docs -g '!src/archive/**' -g '!tests/archive/**' -g '!docs/archive/**'` - active references are now limited to the mounted lean `OrgTrustProfileEditor`, its tests, and launch-gate assertions.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/scripts/launch-gate-config.test.ts tests/ui/organization-trust-profile-page.test.tsx tests/ui/public-org-portfolio-page.test.tsx tests/api/launch-page-inventory.test.ts tests/api/launch-surface-inventory.test.ts tests/ui/org-dashboard-archived-nav.test.tsx` - passed, 6 files / 35 tests, after archiving the broad organization suite.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test:launch:routes` - passed, 4 files / 25 tests, after archiving the broad organization suite.
- `npm run lint` - passed after archiving the broad organization suite.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed after archiving the broad organization suite.
- `npm run docs:freshness` - passed after archiving the broad organization suite.
- `git diff --check` - passed after archiving the broad organization suite.
- Browser plugin rechecked `http://localhost:33180/portfolio/demo` during the continued sweep: `Public Page Unavailable | Proofound`, safe unavailable copy, no obvious private-leak terms in visible body text.
- `rg -n 'OrgDashboardClient|SuspendedOrgDashboardClient|org-dashboard-layout|Quick presets|Save Layout|Add Widgets' src tests docs -g '!src/archive/**' -g '!tests/archive/**' -g '!docs/archive/**'` - active references are now limited to launch-gate archive assertions.
- `rg -n 'getOrgGoalsData|getOrgProjectsData|organization_goals|organization_projects' src/lib src/app tests -g '!src/archive/**' -g '!tests/archive/**'` - no active references remain after removing broad org goals/projects dashboard fetchers.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/scripts/launch-gate-config.test.ts tests/ui/org-dashboard-archived-nav.test.tsx tests/api/launch-page-inventory.test.ts` - passed, 3 files / 24 tests, after archiving the orphaned organization home dashboard client.
- `git diff --check` - passed after archiving the orphaned organization home dashboard client.
- `npm run lint` - passed after archiving the orphaned organization home dashboard client.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed after archiving the orphaned organization home dashboard client.
- `npm run docs:freshness` - passed after archiving the orphaned organization home dashboard client.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test:launch:routes` - passed, 4 files / 25 tests, after archiving the orphaned organization home dashboard client.
- `rg -n "ExpertiseDepthWidget|ExploreCard|GapMapWidget|GoalsCard|ImpactSnapshotCard|InterviewsFeedbackCard|MatchingReadinessCard|MatchingResultsCard|MomentumMetricsCard|NextBestActionsWidget|NextStepsHelper|NotificationsCard|OrgGoalsCard|OrgMatchingCard|ProfileActivationCard|ProjectsCard|ReadinessSprintPanel|TasksCard|TeamRolesCard|WhileAwayCard|NextActionsCard|OrgReadinessCard|TTSCTrendCard" src tests docs -g '!src/archive/**' -g '!tests/archive/**' -g '!docs/archive/**'` - active references are now limited to launch-gate archive assertions after moving the unmounted dashboard widget-card layer.
- `rg --pcre2 -n "components/dashboard/(?!WidgetGridSkeleton|chipStyles)|@/components/dashboard/(?!WidgetGridSkeleton|chipStyles)|src/components/dashboard/(?!WidgetGridSkeleton|chipStyles)" src tests docs -g '!src/archive/**' -g '!tests/archive/**' -g '!docs/archive/**'` - active dashboard component references are now limited to allowed skeleton/chip utilities plus launch-gate assertions.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/scripts/launch-gate-config.test.ts tests/ui/launch-discoverability.test.tsx tests/ui/widget-grid-skeleton.test.tsx tests/ui/metric-strip-chip-style.test.tsx tests/api/launch-page-inventory.test.ts` - passed, 5 files / 27 tests, after archiving the unmounted dashboard widget-card layer.
- `git diff --check` - passed after archiving the unmounted dashboard widget-card layer.
- `npm run lint` - passed after archiving the unmounted dashboard widget-card layer.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed after archiving the unmounted dashboard widget-card layer.
- `npm run docs:freshness` - passed after archiving the unmounted dashboard widget-card layer.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test:launch:routes` - passed, 4 files / 25 tests, after archiving the unmounted dashboard widget-card layer.
- `rg -n "sanitizeLayout|DEFAULT_LAYOUT|AVAILABLE_WIDGETS|PRESET_LAYOUTS|calculateProfileReadiness|reorderWidgets|validateLayout|@/lib/dashboard/layout|src/lib/dashboard/layout" src tests docs -g '!src/archive/**' -g '!tests/archive/**' -g '!docs/archive/**'` - active references are now limited to launch-gate archive assertions after archiving the retired dashboard layout engine.
- `rg -n "getOrgDefaults|getFieldVisibilityDefaults|getOnboardingChecklist|ORG_DEFAULTS|ORG_COPY|getOrgCopy|copy-variants|recommendedDashboardWidgets|src/lib/org/defaults|@/lib/org/defaults" src tests docs -g '!src/archive/**' -g '!tests/archive/**' -g '!docs/archive/**'` - active references are now limited to launch-gate archive assertions after archiving broad organization-type defaults/copy variants.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/scripts/launch-gate-config.test.ts tests/api/launch-page-inventory.test.ts tests/ui/widget-grid-skeleton.test.tsx tests/ui/metric-strip-chip-style.test.tsx` - passed, 4 files / 25 tests, after archiving retired dashboard layout and org defaults libraries.
- `git diff --check` - passed after archiving retired dashboard layout and org defaults libraries.
- `npm run lint` - passed after archiving retired dashboard layout and org defaults libraries.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed after archiving retired dashboard layout and org defaults libraries.
- `npm run docs:freshness` - passed after archiving retired dashboard layout and org defaults libraries.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test:launch:routes` - passed, 4 files / 25 tests, after archiving retired dashboard layout and org defaults libraries.
- `rg -n "sendContractSignedEmail|notifyContractSigned|ContractSigned|/app/contracts|contract-signed|CONTRACT_SIGNED|SUSTriggerProvider|@/lib/feedback/sus-scoring|feedback/sus/check-trigger|feedback/sus/submit|feedback/sus/dismiss|post_contract" src emails tests docs -g '!src/archive/**' -g '!tests/archive/**' -g '!docs/archive/**'` - active hits are now limited to schema/notification compatibility, TTSC metric constants, and launch-gate assertions; unused active helpers/routes/templates were archived or removed.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/scripts/launch-gate-config.test.ts tests/api/launch-page-inventory.test.ts tests/lib/sus-calculator.test.ts` - passed, 3 files / 28 tests, after archiving the stale contract-signing E2E and old feedback SUS trigger UI.
- `git diff --check` - passed after archiving the stale contract-signing E2E and old feedback SUS trigger UI.
- `npm run lint` - passed after archiving stale contract-signing and old feedback SUS trigger helpers.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed after archiving stale contract-signing and old feedback SUS trigger helpers.
- `npm run docs:freshness` - passed after registering the contract-flow and feedback SUS archive READMEs.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test:launch:routes` - passed, 4 files / 25 tests, after archiving stale contract-signing and old feedback SUS trigger helpers.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/ui/public-portfolio-page.test.tsx tests/ui/public-org-portfolio-page.test.tsx tests/ui/public-portfolio-access-consistency.test.tsx` - passed, 3 files / 17 tests, after making missing public portfolio links render generic unavailable pages.
- `npm run lint` - passed after the missing public portfolio fallback fix.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed after the missing public portfolio fallback fix.
- `npm run docs:freshness` - passed after the missing public portfolio fallback fix.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test:launch:routes` - passed, 4 files / 25 tests, after the missing public portfolio fallback fix.
- `git diff --check` - passed after the missing public portfolio fallback fix.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/scripts/launch-gate-config.test.ts tests/api/launch-page-inventory.test.ts` - passed, 2 files / 26 tests, after archiving the broad critical-gaps mock test.
- `npm run docs:freshness` - passed after registering the critical-gaps archive README.
- `rg -n "critical-gaps|Critical Gaps|5 critical gaps|Zoom|fairness gaps" tests -g '!tests/archive/**'` - remaining active hits were the launch-gate archive assertion and live interview tests; no active critical-gaps test remained.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/ui/organization-interviews-page-actions.test.tsx tests/scripts/launch-gate-config.test.ts` - passed, 2 files / 25 tests, after the manual Zoom label cleanup.
- `npm run lint` - passed after the critical-gaps archive and manual Zoom label cleanup.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed after the critical-gaps archive and manual Zoom label cleanup.
- `npm run docs:freshness` - passed after the critical-gaps archive and manual Zoom label cleanup.
- `git diff --check` - passed after the critical-gaps archive and manual Zoom label cleanup.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/scripts/launch-gate-config.test.ts tests/api/launch-surface-inventory.test.ts tests/api/interviews-schedule-route.test.ts` - passed, 3 files / 37 tests, after archiving orphaned Zoom/video wrappers and narrowing provider docs/E2E.
- `npm run docs:freshness` - passed after the provider docs cleanup.
- `npm run lint` - passed after the provider docs/E2E cleanup.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed after the provider docs/E2E cleanup.
- `rg -n "ZOOM_|Zoom integration callback|src/lib/integrations/zoom|src/lib/video|STRICT_PROVIDER_E2E_REQUIRE_BOTH|e2e/org/fairness-note\.spec" docs src tests e2e -g '!docs/archive/**' -g '!src/archive/**' -g '!tests/archive/**'` - remaining active hits were launch-gate assertions and historical `docs/block-7-report.md`; no active current docs or source referenced Zoom config as launch-required.

Non-fatal test noise:

- Vitest/Vite reported `listen EPERM` for WebSocket port `24678` in the sandbox, but tests completed and passed.
- Node emitted existing `--localstorage-file` warnings during Vitest runs.
- The first launch-gate rerun after moving the orphaned metrics dashboard failed because the empty active `src/components/metrics` directory still existed. Removing the empty directory fixed the guard, and the rerun passed.
- The admin audit-log UI test intentionally logged `Error: network unavailable` while asserting the rendered error state; the suite passed.
- Default-runtime `npm run test:launch:routes` failed before tests because the local Node version did not expose `node:fs/promises.constants` for the current Vite package. The same route inventory command passed under the repo-required Node 25 runtime.
- Archived `notFound()` page tests log jsdom React error output while asserting the 404 boundary; the archived tests passed.
- Strict org E2E emitted a slow `/api/assignments` GET warning at 21633ms and `assignment.create.unknown_matrix_skills` for strict resume fixture skills. The suite still passed; assignment runtime performance remains a Phase 3 watch item.

## Remaining Risks / Unverified

- This pass fixed and verified a high-signal launch slice, not every authenticated data state in the product.
- Authenticated Browser coverage now includes representative individual, organization, admin/internal, public org, 403, and mobile surfaces. Full strict Playwright evidence now covers the interactive org corridor, but Browser itself did not click through every modal/control in proof upload, reveal consent, interview scheduling/reschedule, decision recording, or engagement verification.
- Production deployment, live auth, billing, infra, and permission behavior were not changed or smoke-tested.
- No current docs freshness warnings remain after registering the existing orphan documentation/artifact files.
