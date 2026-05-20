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

28. Root launch/provider docs still treated optional connected providers as production launch requirements.

- Rewrote `OAUTH_SETUP_GUIDE.md` as a retained connected-provider setup reference with `Doc Class: reference-spec` and `Last Verified: 2026-05-19`.
- Removed launch-blocking Zoom setup steps, Zoom credential examples, Zoom-specific interview smoke requirements, and "Connect Zoom" instructions from the active provider reference.
- Rewrote `PRODUCTION_CHECKLIST.md` around the locked MVP authority stack, manual-link interview posture, target-scoped connected providers, privacy gates, Browser checks, backup/restore evidence, authenticated monitoring, assignment perf evidence, and final go/no-go.
- Updated `README.md` so the OAuth guide is no longer listed as an active launch runbook.
- Updated `docs/DOCS_REGISTRY.md` to classify `OAUTH_SETUP_GUIDE.md` as reference-only and refresh `PRODUCTION_CHECKLIST.md`.
- Added launch-gate test coverage so root operator docs cannot quietly reintroduce Zoom OAuth as a launch requirement, stale admin metrics, Expertise Profile checks, or machine-specific Homebrew command paths.

29. Strict provider gates still made connected-provider credentials launch-blocking by default.

- Changed `npm run test:e2e:providers:strict` so `STRICT_PROVIDER_E2E_REQUIRE_CONNECTED` defaults to `false`, preserving fail-closed provider and manual-link fallback coverage without requiring a connected Google/LinkedIn provider path for every launch run.
- Updated `scripts/run-mvp-strict-gates.mjs` so Google, LinkedIn, and deterministic provider-user secrets are required only when `STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=true`.
- Kept provider-connected scheduling opt-in for targets that intentionally launch it, while preserving manual-link interview scheduling as the locked MVP default.
- Updated `docs/ENV_VARIABLES.md`, `docs/testing-strategy.md`, `agent/checklists/verification.md`, `docs/production-readiness-checklist.md`, `docs/release-checklist.md`, and `docs/mvp-launch-master-checklist.md` so operator guidance matches the actual default.
- Added launch-gate config tests to prevent connected-provider credentials from becoming an implicit launch requirement again.

30. Manual testing docs still pointed at archived and broad platform-era routes.

- Rewrote `MANUAL_TESTING_CHECKLIST.md` and `MANUAL_TESTING_GUIDE.md` around the current locked MVP corridor: public/auth, individual Proof Pack and verification surfaces, organization assignments/review/communications/interviews, and protected admin verification/audit ops.
- Removed stale manual QA expectations for `/app/i/expertise`, broad admin users/organizations/fairness pages, and Zen/wellbeing-style checks.
- Added manual guidance for public unavailable states, privacy/no-leak checks, mobile overflow, manual-link interview posture, and target-scoped connected-provider testing.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate config tests so manual QA docs stay aligned with active route policy.
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

43. A retired platform-health script still checked old critical gaps and native Zoom wrappers.

- `scripts/check-platform-health.mjs` was not wired into npm scripts, but it still reported "critical gaps", required old demo counts, checked `fairness_reports`, and expected retired native Zoom/video wrapper files.
- Moved it to `scripts/archive/non_mvp_platform_health/check-platform-health.archived.mjs` with a README explaining why it is historical only.
- Added launch-gate coverage so this stale launch-ops script does not return to active `scripts/` unnoticed.
- Removed stale Zoom env requirements from active strict-gate, deploy-readiness, and Vercel preflight scripts so launch ops no longer block on retired native Zoom OAuth setup.
- Removed the stale `STRICT_PROVIDER_E2E_REQUIRE_BOTH` default from the strict provider npm script so provider E2E matches the Google Meet/manual-link launch corridor.
- Added a superseded-reference banner to `docs/scope-compliance-report-2026-03-24.md` so its old route counts and launch-drift findings cannot be mistaken for current launch truth.

44. Excluded non-MVP tests still lived under active `tests/api` and `tests/ui`.

- The default Vitest config excluded compatibility tests for legacy messages, moderation APIs, org test matches, org settings integrations, admin AI spend, and admin fairness notes, but the files still lived in active test directories.
- Moved those tests into `tests/archive/non_mvp_legacy_api/`, `tests/archive/non_mvp_moderation_api/`, `tests/archive/non_mvp_org_integrations_ui/`, and the existing admin-suite archive.
- Updated the archived Vitest config to run the archived paths from `tests/archive/**`, and added launch-gate coverage so excluded compatibility tests do not return to active test directories.

45. Active docs still pointed at legacy `/api/messages`.

- Updated `docs/monitoring-alerting.md` issue ownership from archived `src/app/api/messages/*` to active `src/app/api/conversations/*`.
- Updated `docs/caching-pagination.md` to document `/api/conversations/{conversationId}/messages?before=...` instead of archived `/api/messages` offset/cursor examples.

46. User-requested Codex in-app Browser testing needed a fresh evidence pass after the docs/test cleanup.

- Reconnected the Browser plugin against the in-app browser and verified the live local target on `http://localhost:33180`.
- Captured desktop viewport evidence for `/`, `/portfolio/demo`, `/portfolio/org/test-org`, `/signup`, `/login`, `/onboarding`, `/app/i/portfolio`, `/app/o/test-org/assignments`, and `/admin/verification`.
- Captured mobile 390 x 844 evidence for `/`, `/portfolio/demo`, `/portfolio/org/test-org`, `/app/i/portfolio`, `/app/o/test-org/assignments`, and `/admin/verification`.
- Browser evidence showed no horizontal overflow, no runtime-error text, and no blank body across the sampled routes.
- Public demo portfolio and organization pages rendered the generic unavailable public surface in non-mock mode, preserving the no-leak behavior.
- Protected individual/org routes failed closed to login while unauthenticated; `/admin/verification` failed closed to `403`.
- Saved `browser-smoke.json` and viewport screenshots under `.artifacts/mvp-surface-sweep-2026-05-19/browser-2026-05-19/`.

47. Active Phase 2 backlog docs still described verification canonicalization as only planned even though current code and tests now prove the canonical launch posture.

- Inspected `/api/verify/[token]`, `/api/verify/custom/[token]`, and `src/lib/verification/request-feed.ts`.
- Confirmed public token responders remain active launch surfaces, but resolve through canonical `verification_records` or canonical verification bundles.
- Confirmed old `skill_verification_requests` and `impact_story_verification_requests` table names are absent from active `src/app` and `src/lib`.
- Confirmed remaining `custom_request_id` references are canonical bundle linkage for grouped verification requests, not old skill/impact request-table transport.
- Updated `docs/backlog/phase-2-trust-review.md`, `docs/backlog/dependency-map.md`, `docs/verification-checklist.md`, and `docs/DOCS_REGISTRY.md` with the 2026-05-19 Phase 2 disposition and focused test evidence.

48. Phase 3 still recorded the `/api/assignments` latency warning as a broad planned item, and the assignment list route did avoidable duplicate match-table work.

- Inspected `src/app/api/assignments/route.ts` and found the list route performed a stale-active assignment match-count query and then a second matching-summary aggregate over the same `matches` table.
- Removed the separate match-count query and now derive the low-match TTFQI warning from the matching summary already returned with each assignment.
- Added `tests/api/assignments-list-route.test.ts` so the response still emits the warning from `matchingSummary.candidateCount` and proves the route no longer needs the extra match-count select call.
- Updated `docs/backlog/phase-3-hiring-corridor.md` and `docs/DOCS_REGISTRY.md` to record the local route hardening, focused Phase 3 evidence, and the remaining live/staging perf-budget proof as watch-only.

49. The active admin testing guide and smoke probes still described the retired broad admin dashboard as launch evidence.

- Rewrote `ADMIN_DASHBOARD_TESTING_GUIDE.md` around the active internal-only launch corridor: `/admin`, `/admin/verification`, and `/admin/audit`.
- Kept broad admin users, organization management, fairness dashboards, and metric dashboards explicitly classified as archived/post-MVP instead of launch evidence.
- Updated `e2e/admin-dashboard-smoke.spec.ts` so the active Playwright smoke checks launch operations, operations queues, and audit logs, and confirms the broad retired admin links stay absent.
- Replaced `scripts/test-admin-dashboard-data.js` with an admin launch-ops data probe that checks only `/api/admin/internal-ops/queues` and `/api/admin/audit`, accepting protected `401/403` as pass for unauthenticated contexts.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so the admin guide, E2E smoke, and probe cannot drift back to growth/fairness/vanity dashboard checks unnoticed.

50. The retained admin ops audit still reported the old broad admin smoke as a current failure.

- Refreshed `audit/admin-dashboard-mvp-ops-review-2026-05-03.md` to `Last Verified: 2026-05-19`.
- Added a superseding note that the route/test-noise finding is partially resolved by the active admin smoke, admin testing guide, archived broad admin components/tests, and launch-gate evidence.
- Kept the deeper operator-console gaps intact as follow-up risks: queue detail projection, risky upload approve/reject UI, internal ops table privacy proof, launch health card, sanitized admin DTOs/errors, and operator usability controls.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so the audit cannot continue claiming the active admin Playwright smoke fails on the retired broad dashboard.

51. The root quick start still described an old migration/demo flow outside the locked MVP corridor.

- Rewrote `QUICK_START.md` as a launch-safe local setup and smoke guide instead of a Supabase Dashboard migration paste guide.
- Removed the hard-coded Supabase project link, `migrations-to-run.sql` instructions, Zen/wellbeing tracking, dashboard customization, and broad first-run tour claims from the active quick start.
- Pointed database operations back to the current migration/setup runbooks and limited local smoke guidance to public/auth, individual Proof Pack, organization assignment/review, and internal admin launch-ops surfaces.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so the quick start cannot quietly reintroduce retired Zen/dashboard/migration promises.

52. The active logging migration guide still pointed at archived Expertise Atlas files as current work.

- Rewrote `LOGGING_MIGRATION_GUIDE.md` around active MVP and internal launch-ops surfaces instead of the retired Expertise Atlas page and components.
- Replaced stale `grep` examples with `rg` searches that exclude `src/archive/**`.
- Added privacy-specific logging rules for proof content, filenames, storage paths, verifier text, reveal-sensitive identity details, tokens, and private profile context.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so the active guide cannot drift back to archived Expertise Atlas migration targets or stale console-search commands.

53. The root fix instructions still described an empty Expertise Atlas tab as the current final solution.

- Replaced `FIX_INSTRUCTIONS.md` with a short historical/superseded note.
- Reclassified the file from active root guidance to historical/archive in `docs/DOCS_REGISTRY.md`.
- Removed active instructions to refresh the retired Expertise tab, inspect `src/app/app/i/expertise/page.tsx`, and rely on temporary console debugging.
- Added launch-gate coverage so the file cannot return as active launch guidance for the archived Expertise tab.

54. Migration runbooks were stale and did not name current checkpoint/restore launch evidence.

- Refreshed `APPLY_MIGRATIONS_MANUAL.md` and `RUN_MIGRATIONS_GUIDE.md` to `Last Verified: 2026-05-19`.
- Added the current safety sequence: target confirmation, `db:drift-check`, backup checkpoint, migration audit, ledgered `db:migrate`, and isolated `db:restore:verify`.
- Pointed final launch evidence back to `docs/launch-restore-drill.md` and production readiness/checklist docs.
- Kept production policy explicit: no `db:push`, no dashboard paste flow as normal launch evidence, no `migrations-to-run.sql` as current migration truth, and no restore verification against a live DB.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so the migration docs stay aligned with checkpoint and restore discipline.

55. Active tests still exercised the retired CV import wizard behavior.

- Confirmed `/api/expertise/cv-import/wizard-*` routes are archived compatibility handlers and active launch coverage already proves their `410` response behavior.
- Moved the old wizard extractor, wizard quality, and Python wizard proxy behavior suites from active default test discovery to `tests/archive/non_mvp_cv_import_wizard/`.
- Moved the clearly orphaned retired wizard implementation modules out of active `src/lib/expertise` and into `src/archive/non_launch_cv_import_wizard/`: `cv-import-wizard-apply.ts`, `cv-import-wizard-extractor.ts`, and `python-cv-proxy.ts`.
- Kept the archived wizard quality suite intentionally runnable through `npm run test:slow:non-launch`, while default release signal stays focused on Start from CV, Proof Artifact Text Extraction, and direct archived-handler behavior.
- Added archive READMEs, docs registry entries, and launch-gate coverage so these old wizard tests and implementation files do not drift back into active MVP evidence.

56. Retired TypeScript-side Python internal worker helpers still lived in active source.

- Confirmed `/api/cron/python-internal-worker` and `/api/cron/cv-import-temp-cleanup` are removed/non-MVP scheduled jobs in cron setup and archived route policy.
- Moved the old TypeScript Python internal client, queue, trigger, worker, request utilities, extract-job store, temp-storage helpers, and their direct tests into `src/archive/non_launch_python_internal/` and `tests/archive/non_mvp_python_internal/`.
- Updated environment docs to describe those variables as archived helper settings rather than current launch infrastructure.
- Added archive READMEs, docs registry entries, archived Vitest include, and launch-gate coverage so the worker helpers cannot drift back into active `src/lib` or default test discovery unnoticed.

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

Codex Browser screenshot evidence follow-up on 2026-05-19:

- Browser plugin screenshot capture worked in this pass and saved viewport images under `.artifacts/mvp-surface-sweep-2026-05-19/browser-2026-05-19/`.
- Desktop Browser smoke covered `/`, `/portfolio/demo`, `/portfolio/org/test-org`, `/signup`, `/login`, `/onboarding`, `/app/i/portfolio`, `/app/o/test-org/assignments`, and `/admin/verification`.
- Mobile Browser smoke covered `/`, `/portfolio/demo`, `/portfolio/org/test-org`, `/app/i/portfolio`, `/app/o/test-org/assignments`, and `/admin/verification` at 390 x 844.
- Across the sampled routes Browser recorded `horizontalOverflow=false`, `hasRuntimeErrorText=false`, and `bodyEmpty=false`.
- Non-mock `/portfolio/demo` and `/portfolio/org/test-org` rendered `Public Page Unavailable | Proofound`; unauthenticated app routes failed closed to login and `/admin/verification` failed closed to `403`.

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
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/scripts/launch-gate-config.test.ts` - passed, 1 file / 23 tests, after archiving the retired platform-health script.
- `npm run docs:freshness` - passed after registering the platform-health script archive README.
- `npm run lint` - passed after removing stale Zoom env requirements from launch-ops scripts.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed after removing stale Zoom env requirements from launch-ops scripts.
- `git diff --check` - passed after the provider launch-ops cleanup.
- `rg -n "ZOOM_|Zoom integration callback|src/lib/integrations/zoom|src/lib/video|STRICT_PROVIDER_E2E_REQUIRE_BOTH|criticalGaps|CRITICAL FEATURES CHECK" scripts docs src tests e2e -g '!scripts/archive/**' -g '!docs/archive/**' -g '!src/archive/**' -g '!tests/archive/**'` - remaining active hits were launch-gate assertions and historical `docs/block-7-report.md`; no current launch-ops script requires retired Zoom env/config.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/scripts/launch-gate-config.test.ts` - passed, 1 file / 23 tests, after removing `STRICT_PROVIDER_E2E_REQUIRE_BOTH` from the provider E2E npm script.
- `npm run lint` - passed after the provider E2E npm script cleanup.
- `rg -n "STRICT_PROVIDER_E2E_REQUIRE_BOTH|ZOOM_|Zoom OAuth|Zoom integration callback|critical gaps|Critical Gaps|check-platform-health|src/lib/integrations/zoom|src/lib/video" package.json scripts docs src tests e2e -g '!scripts/archive/**' -g '!docs/archive/**' -g '!src/archive/**' -g '!tests/archive/**'` - remaining active hits were launch-gate assertions and historical `docs/block-7-report.md`.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/scripts/launch-gate-config.test.ts tests/lib/ai-launch-guardrails.test.ts` - passed, 2 files / 32 tests, after moving excluded non-MVP compatibility tests under `tests/archive/**`.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npx vitest --config vitest.archived.config.ts --run tests/archive/non_mvp_legacy_api/messages-legacy-route.archived.test.ts tests/archive/non_mvp_moderation_api/moderation-appeals-route.archived.test.ts tests/archive/non_mvp_org_integrations_ui/organization-settings-integrations.archived.test.tsx --reporter=dot` - passed, 3 files / 14 tests, confirming archived config still exercises the moved compatibility tests.
- `npm run docs:freshness` - passed after registering the new test archive READMEs.
- `npm run docs:freshness` - passed after replacing active `/api/messages` docs with canonical conversation messages docs.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/scripts/launch-gate-config.test.ts tests/lib/ai-launch-guardrails.test.ts` - passed, 2 files / 32 tests, after the docs/package follow-up.
- `npm run lint` - passed after the archived-test and docs cleanup.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed after the archived-test and docs cleanup.
- `git diff --check` - passed after the archived-test and docs cleanup.
- Browser plugin smoke saved `.artifacts/mvp-surface-sweep-2026-05-19/browser-2026-05-19/browser-smoke.json` plus desktop/mobile screenshots for representative public, auth-entry, protected individual/org, and admin/internal surfaces.
- `rg -n 'skill_verification_requests|impact_story_verification_requests|request_type|custom_request_id' src/app src/lib tests -g '!src/archive/**' -g '!tests/archive/**'` - no active old skill/impact request-table names remain in `src/app` or `src/lib`; remaining `custom_request_id` hits are canonical bundle linkage.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/lib/canonical-verification-request-token-resolution.test.ts tests/api/verify-impact-token-route.test.ts tests/api/custom-verification-routes.test.ts tests/api/verification-status-route.test.ts tests/ui/verification-status-options.test.tsx tests/api/org-match-review-route.test.ts tests/api/conversation-reveal-route.test.ts tests/api/engagement-verifications-route.test.ts tests/lib/authz-policy.test.ts tests/lib/workflow-decision-record.test.ts` - passed, 10 files / 82 tests, after the Phase 2 verification disposition refresh.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/api/assignments-list-route.test.ts` - passed, 1 file / 1 test, after removing the duplicate assignment match-count query.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/api/assignments-list-route.test.ts tests/api/assignments-publish-route.test.ts tests/lib/launch-assignment-publish-smoke.test.ts tests/api/engagement-verifications-route.test.ts tests/lib/workflow-decision-record.test.ts tests/lib/authz-policy.test.ts` - passed, 6 files / 35 tests, after the assignment list hardening.
- `npm run docs:freshness` - passed after the Phase 3 backlog disposition update.
- Browser plugin rechecked `http://localhost:33180/portfolio/demo`, `http://localhost:33180/portfolio/demo-proofound`, and `http://localhost:33180/portfolio/org/test-org` in the in-app browser. All rendered launch-safe unavailable pages in this local server state (`Public Page Unavailable | Proofound` or organization equivalent), with no Browser connection failure. This is environment/data-gated evidence, not proof that a seeded public demo is currently available.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/api/admin-internal-ops-queue-route.test.ts tests/ui/admin-verification-dashboard.test.tsx tests/ui/admin-dashboard-launch-links.test.tsx tests/ui/admin-audit-log-table.test.tsx tests/lib/internal-ops-queue.test.ts tests/lib/uploads-lifecycle-queue.test.ts tests/lib/launch-alerting.test.ts tests/lib/launch-operations-contract.test.ts tests/api/launch-page-inventory.test.ts` - passed, 9 files / 45 tests, refreshing Phase 4 internal-only ops queue evidence.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test:launch:smoke -- --scope repo --base-url http://localhost:33180 --artifact .artifacts/mvp-surface-sweep-2026-05-19/phase4-local-launch-smoke.json` - passed after rerunning outside the sandbox that blocked the fixture seeder's temp socket. Artifact saved at `.artifacts/mvp-surface-sweep-2026-05-19/phase4-local-launch-smoke.json`.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test:launch:smoke -- --scope full --base-url http://localhost:33180 --artifact .artifacts/mvp-surface-sweep-2026-05-19/phase4-local-launch-smoke-full.json` - passed, including the full org corridor smoke. Artifact saved at `.artifacts/mvp-surface-sweep-2026-05-19/phase4-local-launch-smoke-full.json`.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH LAUNCH_MONITOR_PERSIST=0 npm run monitor:launch -- --base-url http://localhost:33180 --artifact .artifacts/mvp-surface-sweep-2026-05-19/phase4-local-launch-smoke-full.json` - passed 10/10 with persistence disabled.
- `rg -n "universal compatibility|better matching|black-box|Get matched|Discover talent|evidence-based matching|Find aligned talent|platform replacement|public directory|social platform|profile theater|broad platform" src/app/page.tsx src/components/ProofoundLanding.tsx src/components/landing/sections src/lib/seo README.md -g '!src/archive/**'` - no active hits after the Phase 5 public-copy narrowing, except intentionally negative README guardrail language outside this exact rerun pattern.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/ui/landing-copy-guardrails.test.tsx tests/ui/pilot-packaging-guardrails.test.tsx tests/api/sitemap.test.ts tests/app/llms-routes.test.ts tests/lib/public-json-ld.test.ts tests/ui/landing-footer-links.test.tsx tests/ui/landing-hero-headline-semantics.test.tsx tests/ui/landing-header-touch-targets.test.tsx` - passed, 8 files / 15 tests, after narrowing Phase 5 public copy and crawl-surface language.
- Browser plugin rechecked `http://localhost:33180/` after the Phase 5 public-copy update: title remained `Proofound | Proof Behind the Claim`, the hero headline and final CTA rendered, `explainable assignment-fit review` was visible, and stale `Universal compatibility`, `Better matching`, `black-box`, and `explainable fit model` copy was absent from the DOM snapshot. Console warnings/errors: 0.
- `npm run docs:freshness` - passed after the Phase 5 public-copy/crawl-surface update.
- `git diff --check` - passed after the Phase 5 public-copy/crawl-surface update.
- `npm run lint` - passed after the Phase 5 public-copy/crawl-surface update.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed after the Phase 5 public-copy/crawl-surface update.
- Updated `.artifacts/launch-readiness-summary.md` and `.artifacts/proofound-current-state-reality-check.md` with 2026-05-19 evidence-index banners so the March findings remain historical and point to this sweep artifact, current route-surface truth, local smoke/monitor evidence, and still-open production-candidate gates.
- Updated `docs/backlog/phase-exit-checklist.md` so Phase 1, Phase 2, current Phase 3 functional checks, current local Phase 4 smoke/monitor/docs checks, and Phase 5 packaging checks reflect the 2026-05-19 evidence. Backup, restore, final go/no-go, and assignment latency proof remain intentionally open.
- Updated `docs/backlog/phase-5-launch-packaging.md` so `P5-2` and `P5-3` record the current local evidence index and separate launch blockers from non-blocking watch items.
- Browser plugin rechecked `http://localhost:33180/portfolio/demo` in the in-app browser after the Phase 5 evidence-index refresh. The page title was `Public Page Unavailable | Proofound`, visible copy said `Public Page unavailable` and `This Public Page link is unavailable. It may be hidden, retired, or not ready for launch-safe sharing.`, console warnings/errors were `0`, and the saved Browser evidence is `.artifacts/mvp-surface-sweep-2026-05-19/browser-2026-05-19/portfolio-demo-unavailable-browser-evidence.json`. Browser screenshot capture timed out twice at `Page.captureScreenshot`, so no screenshot file was produced for this pass.
- `npm run test:e2e:landing:visual` initially failed in the sandbox because the Playwright web server could not bind `0.0.0.0:33100`; the rerun outside the sandbox passed, 2 tests.
- `npm run test:e2e:landing` initially failed in the sandbox for the same port-bind reason. The first outside-sandbox rerun also collided with the parallel visual run, then exposed stale expectations for `Request a pilot` as a button, `Create your proof portfolio` as a button, and the retired mobile `Universal compatibility` heading. Updated `e2e/landing-page.spec.ts` to assert current link semantics and `Assignment-fit context`.
- `npm run test:e2e:landing` passed after the stale expectation fix, 11 tests.
- `npm run docs:freshness` - passed after the Phase 5 evidence-index and stale landing E2E expectation update.
- `git diff --check` - passed after the Phase 5 evidence-index and stale landing E2E expectation update.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/scripts/launch-gate-config.test.ts tests/api/launch-page-inventory.test.ts tests/api/launch-surface-inventory.test.ts tests/lib/launch-operations-contract.test.ts` - passed, 4 files / 36 tests, after the Phase 5 evidence-index update.
- `npm run lint` - passed after the stale landing E2E expectation update.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed after the stale landing E2E expectation update.

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
- Phase 4 is still not complete: local full launch smoke has fresh passing evidence from `localhost:33183`, but production-candidate backup, isolated restore, protected launch-status/perf-status, monitor, and final go/no-go evidence remain open.
- Phase 5 local packaging is current as of the 2026-05-19 sweep: public copy/crawl-surface alignment, evidence indexing, and watch-item separation have current local evidence. Launch readiness is still not complete because Phase 4 production-candidate backup, restore, and final go/no-go evidence remain open.
- The local in-app Browser public demo check did not prove seeded public portfolio availability on port `33180`; it proved the current unavailable fallback is safe and non-leaky in the visible page state.
- No current docs freshness warnings remain after registering the existing orphan documentation/artifact files.

## Continuation - Phase 4 Restore Contract Follow-Up

- Found `scripts/lib/db-checkpoint-utils.mjs` and `docs/launch-restore-drill.md` still using an old restore fingerprint table set that included retired compatibility tables (`fairness_notes`, `verification_requests`, `user_video_integrations`, `decision_reminders`) while missing current MVP corridor state such as Proof Packs, verification records, capability tokens, publication state, match/reveal/decision/engagement state, export/delete state, uploads, audit logs, and internal ops queue items.
- Updated the checkpoint critical-table list and restore drill docs so the backup/restore fingerprint contract tracks active MVP, internal launch-ops, privacy/export/delete, and audit-trail state.
- Added `tests/scripts/db-checkpoint-critical-tables.test.ts` to lock the restore fingerprint contract to the current MVP corridor and reject retired compatibility tables as launch restore gates.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/scripts/db-checkpoint-critical-tables.test.ts tests/lib/launch-operations-contract.test.ts` - passed, 2 files / 6 tests, after the restore checkpoint contract update.
- `npm run docs:freshness` - passed after the restore checkpoint contract update.
- `git diff --check` - passed after the restore checkpoint contract update.
- `npm run lint` - passed after the restore checkpoint contract update.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run typecheck` - passed after the restore checkpoint contract update.
- Did not run `npm run db:backup:checkpoint` or `npm run db:restore:verify` in this continuation because those scripts read `DIRECT_URL`/`DATABASE_URL` from `.env.local`; the intended production-candidate or isolated recovery target still needs explicit approval before touching database state.

## Continuation - Assignment Latency Gate Follow-Up

- Found `/api/monitoring/perf-status` could miss the real `/api/assignments` latency signal because API observability writes `api_latency` samples to `performance_metrics`, while the perf-status route read legacy `analytics_events` first and could fall back to probing `/api/health`.
- Updated `src/app/api/monitoring/perf-status/route.ts` so the gate reads `performance_metrics` first, retains the legacy analytics fallback, exposes `requiredRoutes`, `missingRequiredRoutes`, and `routeBreakdown`, and refuses `ok: true` unless `/api/assignments` has finite latency samples in the 24-hour window.
- Updated `src/app/api/monitoring/__tests__/perf-status-route.test.ts` to prove the gate passes with `/api/assignments` samples, filters null durations, stays closed when only `/api/health` is sampled, falls back to legacy analytics, and returns a closed probe/unavailable payload when route samples are absent.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- src/app/api/monitoring/__tests__/perf-status-route.test.ts tests/lib/api-observability-local-smoke.test.ts tests/api/assignments-list-route.test.ts` - passed, 3 files / 11 tests, after the assignment latency gate update.
- Browser plugin rechecked the user-open local route `http://localhost:33180/portfolio/demo`: title `Public Page Unavailable | Proofound`, meaningful unavailable copy rendered, no framework overlay was visible, console warnings/errors were `0`, and the skip-link interaction preserved the safe unavailable state. Evidence saved at `.artifacts/mvp-surface-sweep-2026-05-19/browser-2026-05-19/portfolio-demo-browser-recheck-2026-05-19.json`.
- This improves launch-gate integrity but does not close the Phase 3 latency watch item by itself. A production-candidate or live/staging target still needs fresh `/api/assignments` samples and a green perf-status/go-no-go run before launch.

## Continuation - Legacy Go/No-Go Script Cleanup

- Found stale active launch-ops drift: `npm run go:no-go` runs `scripts/go-no-go-check.ts`, but the older weaker `scripts/go-no-go-check.mjs` still existed and `docs/performance-testing.md` still named it as the checked implementation.
- Archived the legacy `.mjs` script under `scripts/archive/legacy_go_no_go/` and updated `docs/performance-testing.md` to point at the active TypeScript gate and its current required checks, including `/api/assignments` perf-status samples, fresh launch smoke, restore readiness, and launch-status readiness.
- Added launch-gate config coverage so active docs cannot point back to `go-no-go-check.mjs`, while the archived script and active `go-no-go-check.ts` are both asserted in their intended locations.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/scripts/launch-gate-config.test.ts` - passed, 1 file / 25 tests, after the legacy go/no-go archive guard.

## Continuation - API Reference Internal Ops Auth Correction

- Found active `docs/API_REFERENCE.md` labeled `/api/monitoring/launch-status` and `/api/monitoring/perf-status` as `public` even though both routes call `requireInternalOpsRequest`; `/api/monitoring/health-diagnostics` uses the same internal launch-ops guard.
- Updated `scripts/generate-api-reference.mjs` so `requireInternalOpsRequest` is classified as `internal` before broader service/session heuristics, regenerated `docs/API_REFERENCE.md`, and added the internal launch-ops bearer-token rule to the generated security model.
- Added launch-gate config coverage so the three monitoring launch-ops routes stay documented as `internal`, not `public`.

## Continuation - Production Readiness Checklist Refresh

- Updated `docs/production-readiness-checklist.md` so it points at the 2026-05-19 phase-exit checklist and sweep artifact, separates local evidence from production-candidate signoff, names backup checkpoint, isolated restore rehearsal, and final go/no-go as still-open readiness gates, and records the authenticated internal launch-ops posture for perf-status and launch-status.

## Continuation - Release Checklist Refresh

- Found `docs/release-checklist.md` still verified on 2026-03-01 and missing the current production-candidate backup, restore, authenticated launch-ops, assignment-latency, and final go/no-go gates.
- Updated the checklist so it points to the current production-readiness checklist, phase-exit checklist, and sweep artifact; preserves manual-link interview posture as the locked MVP default; and separates existing local evidence from the still-open production-candidate signoff.
- Updated `docs/DOCS_REGISTRY.md` so the release checklist freshness reflects the 2026-05-19 refresh.
- Browser rechecked the user-open `http://localhost:33180/portfolio/demo` route after the release-checklist refresh. The page rendered `Public Page Unavailable | Proofound`, safe unavailable copy, no framework overlay, and `0` console warnings/errors. The check also caught the unavailable public fallback using a section heading without a page-level `h1`; updated the individual and organization unavailable public portfolio fallbacks so their visible card title can render as `h1` while shared public sections still default to `h2`.
- Browser evidence saved at `.artifacts/mvp-surface-sweep-2026-05-19/browser-2026-05-19/portfolio-demo-release-checklist-refresh-after-h1-2026-05-19.json` and `.artifacts/mvp-surface-sweep-2026-05-19/browser-2026-05-19/portfolio-demo-release-checklist-refresh-after-h1-2026-05-19.png`.

## Continuation - Deployment and Provider-Gate Docs Refresh

- Found `docs/deployment-guide.md` still verified on 2026-02-26 and carrying stale deployment/operator guidance: retired cron examples, broad matching/messaging smoke language, unsafe lockfile-reset troubleshooting, old FID metric language, and post-deploy checks that did not require authenticated launch-status/perf-status evidence.
- Refreshed the deployment guide to point at the current production readiness checklist, phase-exit checklist, and sweep artifact; updated cron guidance to the current Vercel/cron-job.org split; kept public health minimal; and named the still-open production-candidate backup, restore, monitor/perf, and go/no-go gates.
- Found `agent/runbooks/setup.md` and `agent/checklists/verification.md` still requiring both Zoom and Google connected for provider strict launch-gate runs even though the locked MVP posture is manual-link first and native Zoom/video OAuth has been removed from the launch corridor.
- Updated those agent docs so provider strict remains connected-provider-capable only when intentionally in scope, with manual-link interview scheduling preserved as the default and native Zoom/video OAuth kept out of release requirements.

## Continuation - Testing Strategy and Setup Header Refresh

- Found `agent/runbooks/setup.md` had May 19 body updates but still carried a 2026-02-26 header and a broad "Video Providers (Zoom, Google Meet)" setup section.
- Updated the setup runbook header and its root sync pair `setup.md`, and narrowed the section to current interview-provider/manual-link posture, removing native Zoom OAuth setup from active launch instructions.
- Found `docs/testing-strategy.md` still verified on 2026-04-29 and using local-only launch gate examples without naming production-candidate target, backup/restore evidence, or manual-link provider posture.
- Updated the testing strategy and launch-gate guard so release validation points at production-candidate monitor/perf/go-no-go evidence and keeps provider-connected tests scoped to intentionally configured flows.

## Continuation - Internal Ops SOP Refresh

- Found internal ops SOPs still verified on March/April dates even though the admin queue, audit, and internal-ops API posture has current May 19 launch evidence.
- Refreshed the internal-ops SOP dates, linked the index to the current production-readiness, phase-exit, and sweep evidence, and made the queue access expectation explicit: admin/internal-only, with no public or logged-out queue content.
- Added user-communication guardrails so manual workflow comms do not include private proof content, hidden identity details, secrets, queue IDs, or diagnostic output.
- Added launch-gate coverage that keeps the internal ops SOP set current and tied to protected admin/internal queue surfaces.

## Continuation - Launch Operations Scope Refresh

- Found active `docs/launch-operations-mvp.md` still verified on 2026-03-25 and carrying older Block 9 language that promoted broad fairness/ranking/queue machinery as launch guidance.
- Refreshed the launch-ops guide to the locked MVP authority stack, pointed it at current internal-ops, production-readiness, and phase-exit evidence, and named the still-open production-candidate backup, isolated restore, `/api/assignments` latency/perf-status, and final go/no-go gates.
- Replaced stale fairness/rank-band language with review-overprecision protection, reason-coded review, privacy-safe shortlist review, and the current internal queue mapping: `verification`, `correction_revocation`, `privacy_reveal_exception`, and `pilot_ops`.
- Updated `docs/DOCS_REGISTRY.md` and added launch-gate coverage so the active guide cannot drift back to `fairness_suppressed_ranking`, `fairness_remediation`, `verification_pending_manual`, old broad PRD authority, or manual fairness-note scope.
- Browser rechecked the user-open `http://localhost:33180/portfolio/demo` route after the launch-ops refresh. It rendered `Public Page Unavailable | Proofound`, a visible `Public Page unavailable` h1, safe unavailable copy, no console warnings/errors, and no visible framework overlay. Evidence saved at `.artifacts/mvp-surface-sweep-2026-05-19/browser-2026-05-19/portfolio-demo-launch-ops-refresh-2026-05-19.json` and `.artifacts/mvp-surface-sweep-2026-05-19/browser-2026-05-19/portfolio-demo-launch-ops-refresh-2026-05-19.png`.

## Continuation - Project Orientation Launch-Gate Refresh

- Found active root/project orientation docs still pointing at the retired `scripts/go-no-go-check.mjs` gate even though `npm run go:no-go` now runs `scripts/go-no-go-check.ts` and the `.mjs` implementation is archived.
- Refreshed `Architecture.md`, `project/Architecture.md`, `Documentation.md`, `project/Documentation.md`, `metrics.md`, `Prompt.md`, and `project/Prompt.md` to `Last Verified: 2026-05-19`, updated their launch-gate references to the active TypeScript go/no-go command, and named current evidence dependencies without reintroducing the retired script.
- Updated `docs/DOCS_REGISTRY.md` freshness for the sync-pair docs and expanded launch-gate coverage so those active orientation docs must point at `scripts/go-no-go-check.ts` and must not point future agents back to `scripts/go-no-go-check.mjs`.

## Continuation - Accessibility Go/No-Go Evidence Refresh

- Found active `ACCESSIBILITY_AUDIT_REPORT.md` still verified on 2026-02-12 even though it is a required `npm run go:no-go` evidence file.
- Reran the baseline accessibility suite. The sandbox run failed before tests because Playwright could not bind `0.0.0.0:33101`; the approved outside-sandbox rerun initially reported all baseline checks green against `playwright.a11y.config.ts`, but later evidence hygiene found four TODO-only passing keyboard checks and converted them to explicit skips.
- Refreshed the accessibility report to `Last Verified: 2026-05-19`, recorded the exact command and scope, and kept the evidence honest: baseline public/mock-mode accessibility is green, while strict authenticated accessibility and manual screen-reader validation remain separate production-candidate/manual gates.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so the report freshness, command, test count, and strict/manual caveats stay current.

## Continuation - Root Verification Checklist Refresh

- Found root `verification.md` still verified on 2026-05-04 and pointing at the retired `scripts/go-no-go-check.mjs` gate, while the active agent checklist already pointed at `scripts/go-no-go-check.ts`.
- Refreshed `verification.md` to `Last Verified: 2026-05-19`, added the current clean-install, dependency-audit, docs-freshness, launch-smoke, monitor, launch-status, and TypeScript go/no-go evidence expectations, and removed stale native Zoom/both-provider launch requirements in favor of the manual-link interview default.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so root verification guidance must stay on the active TypeScript gate and must not reintroduce `STRICT_PROVIDER_E2E_REQUIRE_BOTH` or both-Zoom-and-Google launch requirements.
- Found March root audit snapshots (`AUDIT_IMPLEMENTATION_STATUS.md`, `AUDIT_REMAINING_WORK.md`) still classified active and still citing the retired `.mjs` go/no-go script. Reclassified them as historical, added supersession banners pointing to the current sweep/readiness evidence, updated their go/no-go references to the TypeScript gate, and broadened the guard so root Markdown files cannot reintroduce `go-no-go-check.mjs`.

## Continuation - Deployment Checklist Launch-Safety Refresh

- Found active `docs/DEPLOYMENT_CHECKLIST.md` still verified on 2026-02-12 and still instructing operators to run storage setup through Supabase SQL Editor, while the current migration runbooks require checkpoint, migration ledger, and isolated restore evidence as launch gates.
- Rewrote the deployment checklist around the locked MVP corridor and current production-candidate signoff: target/secret confirmation, local and strict pre-deploy gates, repo-owned migration flow, Vercel/cron-job.org ownership, Browser-backed public smoke, authenticated MVP smoke, internal launch-ops monitoring, and rollback posture.
- Removed broad non-MVP smoke language such as generic messaging and match-score checks, and replaced it with Proof Packs, assignment, review, reveal consent, interview, decision, engagement verification, export/delete, and admin/internal queue checks.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so the checklist stays current, includes `db:drift-check`, backup checkpoint, migration audit, ledgered `db:migrate`, isolated `db:restore:verify`, authenticated launch-status/perf-status with `/api/assignments`, and does not reintroduce normal Supabase SQL Editor paste or `db:push` production guidance.

## Continuation - Cron Setup Freshness Refresh

- Verified `docs/CRON_SETUP.md` is aligned with `scripts/lib/cron-job-org-config.mjs` and the current `npm run cron:sync` script, but its active-doc registry date was still 2026-02-12 and it lacked the current doc-class header.
- Added the active/verified header, updated `docs/DOCS_REGISTRY.md`, and extended cron scheduling tests so the human setup guide stays current while the canonical classification table remains the machine source of truth.

## Continuation - Storage Setup Privacy Refresh

- Found active `docs/STORAGE_SETUP.md` still describing dashboard-first storage setup, `supabase db push`, a broadly public `user-uploads` bucket, path-based document deletion, and older proof/document size and response assumptions.
- Rewrote it around the current upload lifecycle in `src/lib/uploads/lifecycle.ts`: quarantine-first ingestion, `user-uploads-private` durable proof/document storage, `manual_review` queue behavior, avatar/cover-only public promotion after validation, uploaded-file-id deletion, and no public URL for private proof/document uploads.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so the storage guide keeps private/quarantine bucket posture, no-leak public projection expectations, migration/restore launch gates, and focused storage/upload tests current.

## Continuation - Retired Smart Search Deployment Note

- Found root `DEPLOYMENT_STEPS_SMART_SEARCH.md` still classified active even though it described the retired Expertise Atlas smart-search rollout, hard-coded an old Supabase project ref, and recommended direct Supabase schema-push plus SQL Editor paste flows.
- Replaced the body with a historical supersession note that points current operators to retained taxonomy setup and the migration runbooks, and explicitly says not to use it as active launch guidance for `/app/i/expertise`, old smart-search UI behavior, or production database deployment.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so the file stays historical/archive and cannot reintroduce the old project ref, SQL Editor path, direct schema-push command, or "Navigate to the Expertise tab" launch instructions.

## Continuation - Supabase Setup Launch-Safety Refresh

- Found active root `SETUP_SUPABASE.md` still verified on 2026-02-12 and carrying an old MCP snapshot: a hard-coded Supabase project ref, service-role reassurance that was too casual for launch guidance, stale table counts, and a `db:push` migration recommendation.
- Rewrote it as a target-agnostic Supabase setup checklist for the locked MVP corridor, pointing at the current environment reference and migration runbooks, requiring drift/backup/audit/migrate/restore evidence, and preserving service-role/no-secret/no-private-data boundaries.
- Added launch-gate coverage and updated `docs/DOCS_REGISTRY.md` so the guide cannot drift back to hard-coded project refs, direct schema-push launch guidance, casual MCP/service-role wording, or broad non-MVP product scope.

## Continuation - Supabase MCP Guide Launch-Safety Refresh

- Found active `docs/SUPABASE_MCP_SETUP.md` still verified on 2026-03-11 and carrying a project-specific MCP snapshot, direct migration wording, ad-hoc migration examples, and stale table-count claims that could be mistaken for current launch evidence.
- Rewrote it as a target-agnostic optional operator-tool guide: read-only by default, explicit target/action before mutation, no service-role/private-data exposure, no old snapshots as launch evidence, and no MCP replacement for drift/backup/audit/migrate/restore runbooks.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so the guide cannot drift back to hard-coded project refs, `db:push` launch wording, ad-hoc MCP migration examples, or stale "all tables have RLS" snapshots.

## Continuation - Supabase MCP Status Snapshot Refresh

- Found active root `MCP_STATUS.md` still verified on 2026-03-11 and hard-coding the same old Supabase project ref plus stale MCP discovery/advisor claims.
- Rewrote it as a current target-agnostic MCP status note: optional operator tool, read-only by default, project refs confirmed per run, no product-scope authority, no migration-runbook replacement, and no old table/advisor snapshots as launch evidence.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so the status note cannot drift back to project-specific connection targets or stale discovery claims.

## Continuation - Accessibility Guidance Refresh

- Found active `docs/ACCESSIBILITY.md` and `docs/ACCESSIBILITY_TESTING_GUIDE.md` still verified on 2026-02-12/2026-02-26 while the active audit evidence had been refreshed to 2026-05-19.
- Rewrote both docs around the current MVP/accessibility posture: baseline `npm run test:a11y` evidence, strict authenticated `npm run test:a11y:strict` as a production-candidate gate, manual keyboard/screen-reader signoff, and representative public, individual, organization, and admin/internal launch surfaces.
- Removed stale claims that axe E2E was still "to be configured", old `.eslintrc` guidance, broad static Lighthouse instructions as launch proof, and launch-sounding accessibility expectations for archived/post-MVP surfaces.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so accessibility docs stay tied to the current audit report, Proof Packs, privacy/no-leak checks, strict authenticated gates, and manual validation requirements.

## Continuation - Resend Transactional Email Guidance Refresh

- Found active `docs/RESEND_SETUP.md` still verified on 2026-02-12 and making unverified target-specific claims that Resend was already configured in production and local development.
- Rewrote the guide as a target-agnostic transactional email runbook for the locked MVP corridor: `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, optional dry-run skip behavior, approved sender domains, and explicit "do not send live email without target/recipient/operator approval" guidance.
- Removed stale launch guidance for a missing `scripts/test-email.mjs`, broad "Skill & Matching System" language, marketing/digest optimization, and old active-looking deletion cron table entries.
- Preserved route-surface policy by naming `/api/cron/decision-reminders` as active launch email cron and `/api/cron/send-deletion-reminders` plus `/api/cron/process-deletions` as archived standalone deletion cron routes.
- Added privacy guardrails for email templates and links: no private proof content, raw evidence, hidden candidate identity details, queue IDs, private storage paths, signed URLs, secrets, service-role data, or diagnostic payloads.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so the guide stays transactional, current, target-scoped, and privacy-safe.

## Continuation - LinkedIn Verification Reference Reclassification

- Found `docs/LINKEDIN_VERIFICATION_SETUP.md` still classified as active even though the current settings verification UI says LinkedIn checks are outside the launch corridor, account-side only, and read-only when present.
- Reclassified the guide as `reference-spec`, rewrote it as a compatibility/reference note, and removed launch-sounding setup language for scraping, confidence-score dashboards, high-confidence quick approvals, ngrok OAuth QA, broad admin-review tabs, and deployment metrics.
- Preserved the bounded current contract: work email is the only launch-active account-side check, LinkedIn never creates proof trust, public reputation, org review lift, intro eligibility, reveal readiness, or match/ranking advantage by itself.
- Kept route-surface policy explicit: old LinkedIn admin review routes are archived; current internal manual work belongs under `/api/admin/internal-ops/queues`.
- Updated the historical implementation-summary pointer and launch-gate coverage so future docs cannot present LinkedIn verification as an active launch corridor surface by default.

## Continuation - Support Guidance Launch-Safety Refresh

- Found root `EMAIL_SUPPORT_SETUP.md` still carrying old November 2025 support setup language: non-existent help center/in-app chat references, personal operator names, manual deletion by email reply, broad "skills/matches/messages" deletion copy, and stale profile/matching guidance.
- Rewrote it as an active support operations guide for `hello@proofound.io`: mailbox/MFA/DNS setup, launch-corridor triage, plain-language templates, privacy/no-leak response rules, self-service export/delete routing, and urgent security/privacy escalation.
- Refreshed `SUPPORT.md` to the current authority stack and manual-link interview posture.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so support guidance stays aligned with self-service privacy actions, no-leak support records, no help-center/in-app-chat claims unless those surfaces are active, and no deletion from a bare email reply.

## Continuation - Scoped Verification Authority Refresh

- Found `IDENTITY_VERIFICATION_IMPLEMENTATION.md` still classified active even though it describes itself as implementation context only, and found `docs/verification-policy-mvp.md` still verified on 2026-03-11 with the old Project Specification-first scope note.
- Reclassified the root identity-verification implementation note as `reference-spec`, added current doc metadata, and replaced Project-Specification-first language with the locked MVP authority stack.
- Refreshed `docs/verification-policy-mvp.md` to `Last Verified: 2026-05-19`, clarified that the locked MVP source of truth sets the launch promise, and added an explicit guard that older work-email/LinkedIn compatibility state stays account-side unless current scoped verification records make a specific fact safe to project.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so scoped verification docs keep the current authority order and do not imply broad identity verification or legacy provider-derived trust.

## Continuation - Retained Expertise Taxonomy Guidance Refresh

- Found retained Expertise taxonomy docs still verified on 2026-02-12/2026-02-26, with recovery wording that could be read as restoring the archived Expertise Atlas dashboard.
- Added active doc metadata to `docs/EXPERTISE_ATLAS_SETUP.md`, kept the archived `/app/i/expertise` warning, and clarified that launch targets must use the current migration, backup, and isolated-restore runbooks rather than shortcuts.
- Refreshed `agent/runbooks/expertise-taxonomy-recovery.md` to target-approved retained taxonomy recovery only: proof-skill selection, assignment expertise helpers, and retained taxonomy APIs, not the old Atlas UI.
- Added backup/checkpoint and isolated-restore reminders for production-candidate or production targets, preserved no-`db:push` guidance, and required `/app/i/expertise` to remain archived/unavailable after recovery.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so retained taxonomy docs cannot revive broad Expertise Atlas UI, CV wizard, LinkedIn import, or old dashboard behavior as launch evidence.

## Continuation - Analytics Privacy Setup Refresh

- Found root `ANALYTICS_GDPR_SETUP.md` still verified on 2026-02-12 and carrying risky launch guidance: editing migration SQL with a live salt, Supabase SQL Editor instructions, `db:push`, broad analytics tracking examples, and a blanket "GDPR-compliant" completion claim.
- Rewrote it as a target-scoped analytics privacy setup guide for the locked MVP corridor, with broad `/api/analytics/*` routes explicitly treated as archived compatibility surfaces.
- Preserved the current `PII_HASH_SALT` requirement without printing or embedding secrets, and pointed production-candidate work back to drift, migration audit, repo-owned migrate, backup/checkpoint, and isolated restore evidence.
- Added payload guardrails for active lifecycle analytics: no raw IP/user-agent, private proof content, raw evidence, hidden identity details, signed URLs, filenames, admin notes, internal queue IDs, or diagnostic dumps.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so analytics setup stays privacy-safe, no-secret, no-`db:push`, and aligned with archived route-surface policy.

## Continuation - Alert Configuration Launch-Ops Refresh

- Found `docs/alert-configuration.md` still verified on 2026-02-12 and oriented around older broad production monitoring, TTSC/TTFQI/PAC metric alerts, PagerDuty/team-channel placeholders, and a test route for triggering errors.
- Rewrote it as launch-safe alert configuration for the locked MVP corridor: public availability, protected launch-status/perf-status, `/api/assignments` latency evidence, decision-reminder cron, cron-job.org observability jobs, active workflow failures, and internal queue risks.
- Added explicit no-leak alert payload rules and removed launch-blocking defaults for broad analytics endpoints, public directories, old Expertise Atlas behavior, LinkedIn trust, native meeting-provider success, fairness dashboards, and broad business metric targets.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so alert configuration stays tied to current launch-ops evidence instead of old broad monitoring theater.

## Continuation - Sentry And Structured Logging Privacy Refresh

- Found `docs/sentry-setup.md` and `docs/structured-logging.md` still verified on 2026-02-12 with broad observability examples, session replay presented as default debugging, payment-style/error examples, and log aggregation patterns that were too loose for launch privacy.
- Rewrote both docs around launch-support observability only: protected runtime errors, release tracking, route/workflow context, no private proof content, no hidden identity details, no raw request/response bodies, no secrets, no raw AI prompts/model responses, and no broad analytics/dashboard behavior.
- Hardened Sentry config so client replay sampling defaults to `0` unless explicitly enabled by `NEXT_PUBLIC_SENTRY_REPLAY_*` env vars, while keeping `maskAllText` and `blockAllMedia` when replay is enabled.
- Added Sentry event scrubbing in client/server/edge config to reduce user context to id-only and remove request cookies, headers, and body data before events leave the app.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so Sentry/logging docs stay current and privacy-safe.

## Continuation - Security Policy And Incident Response Refresh

- Found `.github/SECURITY.md` and `docs/SECURITY_INCIDENT_RESPONSE_RUNBOOK.md` still verified on 2026-02-12/old November 2025 content with overbroad compliance/security claims, unsafe operational examples, old contact/status placeholders, and evidence instructions that could leak private payloads.
- Rewrote the public security policy around responsible disclosure for active MVP and launch-ops surfaces, excluding archived/post-MVP surfaces unless they expose active data or launch behavior.
- Rewrote the incident response runbook around launch-safe containment: first 15 minutes, no-leak evidence preservation, public projection leaks, reveal/identity leaks, upload/proof leaks, auth/token incidents, admin/internal exposure, legal/privacy notification decision boundaries, remediation, and post-incident review.
- Removed unsafe SQL/dashboard examples, blanket SOC/GDPR/CCPA claims, status-page/emergency placeholders, and instructions to paste secrets/private data into shared docs or support flows.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so security guidance stays no-leak, target-scoped, and evidence-based.

## Continuation - Preflight Sync Pair Launch Gate Refresh

- Found the root `preflight.md` sync-pair stale against `agent/checklists/preflight.md`: the root copy still pointed at `vercel build --prod` and deploy-hook secret guidance, while the current deployment path expects production env pull, prebuilt Vercel build output, and token/org/project deployment automation.
- Refreshed both preflight copies to `2026-05-19`, aligned the root copy with the current prebuilt deployment gate, and added guardrails for active-doc registry updates, route-surface classification, Browser-backed UI checks, privacy/no-leak route tests, and production-candidate database checkpoint/restore discipline.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so both preflight files stay current, keep `DESIGN.md` plus Browser requirements visible for UI work, and cannot drift back to `VERCEL_DEPLOY_HOOK_URL` or `vercel build --prod` launch guidance.

## Continuation - GitHub Workflow Provider Gate Refresh

- Found GitHub workflows still setting `STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=true` and the retired `STRICT_PROVIDER_E2E_REQUIRE_BOTH=true`, conflicting with current launch docs and `scripts/run-mvp-strict-gates.mjs`, where connected-provider credentials are required only for intentional connected-provider runs and manual-link interview scheduling remains the locked MVP default.
- Reset CI, strict-quality, retry-vercel-deploy, and Playwright workflow defaults to `STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=false` and removed the stale `STRICT_PROVIDER_E2E_REQUIRE_BOTH` variable so normal PR, manual strict, and production prebuilt deployment gates do not require Zoom/Google provider scope by default.
- Reclassified `.vercel-deploy-trigger.md` from active launch evidence to a historical timestamp note, pointing current deployment evidence back to the prebuilt GitHub Actions workflow, Vercel deployment metadata, release checklists, and this sweep artifact.

## Continuation - Historical RLS Deployment Summary Reclassification

- Found `RLS_DEPLOYMENT_SUMMARY.md` still classified as active launch evidence while it contained a 2025 one-time RLS deployment snapshot with broad 100% coverage, compliance, and production-ready claims that no longer match the current migration series or MVP privacy surfaces.
- Reclassified the file as historical and replaced the active-looking rollout report with a short supersession note pointing current RLS/privacy signoff to repo-owned migrations, drift/backup/audit/migrate/restore gates, active privacy tests, storage policy tests, and fresh target evidence.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so the old `001_enable_rls_policies` snapshot cannot be mistaken for current production-candidate RLS evidence.

## Continuation - Legacy Linear Bulk Import Guard

- Found `LINEAR_SETUP_INSTRUCTIONS.md` still classified active even though it described a January 2025 bulk import from an archived plan and encouraged creating broad labels/issues that predate the locked MVP corridor.
- Reclassified the setup note as historical, pointed current ticket administration to `agent/runbooks/proofound-ticket-finisher.md`, and kept Linear state subordinate to the locked MVP docs, current repo behavior, and fresh evidence.
- Added a fail-closed guard to `scripts/import-linear-issues.mjs` requiring `PROOFOUND_ALLOW_LEGACY_LINEAR_IMPORT=true` before the legacy import can create or duplicate external Linear issues.

## Continuation - Style And Motion Guidance Refresh

- Found `docs/STYLEMAP.md` and `docs/ANIMATION_NOTES.md` still verified on 2026-02-12, with token drift in the primary forest value and animation guidance that presented living networks, blob morphing, and ambient motion as active UI direction.
- Refreshed the style map against `DESIGN.md`, `src/app/globals.css`, `tailwind.config.ts`, and brand tokens so the current light-only Japandi palette, primary object/action clarity, state visibility, and no public-directory/profile-theater rules stay visible.
- Rewrote animation guidance around current motion tokens, reduced-motion behavior, restrained landing scrollytelling, and explicit retired guidance for `NetworkBackground`, `LivingNetwork`, broad ambient canvas motion, and morphing blobs.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so stale visual/motion docs cannot revive decorative UI patterns outside the locked MVP corridor.

## Continuation - Vendor Processing Register Refresh

- Found `docs/DATA_PROCESSING_AGREEMENTS.md` still verified on 2026-03-11 with unproven legal/compliance claims: signed DPAs, SCCs, SOC/ISO status, GDPR/CCPA compliance, retention windows, and active-looking Veriff/LinkedIn processing language.
- Rewrote it as a launch-safety processing register rather than legal proof: active/conditional vendor posture, no-leak data minimization rules, target-specific legal/privacy verification requirements, and explicit manual-link/default and archived Veriff boundaries.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so vendor guidance stays evidence-scoped and cannot be mistaken for a signed DPA repository or compliance attestation.

## Continuation - Historical Launch Signoff Reclassification

- Found April 27 owner/evidence/signoff docs still classified active and still reading as current GO/PASS launch authority, even though this sweep still requires fresh target-specific backup, restore, launch-status, perf-status, and go/no-go evidence.
- Reclassified the April 27 owner roster, production evidence pack, and signoff memo as historical snapshots, preserving the old commit/evidence context while explicitly blocking their use as current launch readiness.
- Updated `docs/internal-ops/index.md`, `docs/DOCS_REGISTRY.md`, and launch-gate coverage so internal ops links distinguish historical evidence from current launch authority.

## Continuation - Local Dev And Lint Troubleshooting Refresh

- Found `docs/local-dev.md` and `docs/TROUBLESHOOTING_LINT.md` still verified on 2026-02-12; local setup guidance was missing current metadata, lockfile install discipline, Browser/local smoke evidence guidance, and strict mock-vs-real launch boundaries.
- Refreshed local development guidance around Node 24.15.0, npm 11.12.1, `engine-strict=true`, `npm ci`, mock Supabase limits, real Supabase strict checks, and no-secret handling in docs/artifacts/screenshots.
- Rewrote lint troubleshooting around the current `scripts/lint-or-skip.js` ESLint wrapper, dependency-missing skips, `FORCE_LINT=true`, and lockfile install recovery so skipped lint cannot be mistaken for launch evidence.

## Continuation - Launch Signoff And QA Guidance Refresh

- Found `docs/full-launch-signoff-memo-template.md`, `docs/qa/bugs.md`, and `docs/qa/summary.md` still carrying stale launch/QA posture: the signoff template missed target-specific backup/restore/perf-status evidence, the bug log still listed login debug ingest as open, and the QA summary retained old Node 20 historical evidence without a clear boundary.
- Updated the signoff template to require current target evidence: database target, deployment SHA evidence, authenticated launch-status/perf-status, `/api/assignments` latency, route-surface/archive policy, Browser desktop/mobile evidence, public-health minimization, and privacy/no-leak checks.
- Refreshed QA docs so B-008 is fixed by the optional env-driven debug ingest sink, QA coverage names the current launch suites and Browser evidence expectations, and historical stabilization evidence cannot be mistaken for current launch proof.

## Continuation - Historical Project Flow And PR Triage Reclassification

- Found `project/MVP_FLOW_MATRIX_2026-02-12.md` still classified active while it preserved an old strict-flow matrix with a superseded dual-provider launch-blocking policy and stale February flow verdicts.
- Found `project/PR_TRIAGE_2026-02.md` still classified active while it preserved February PR queue and merge-state claims that cannot be current without live GitHub inspection.
- Reclassified both files as historical snapshots, pointed current flow evidence to the locked MVP stack, verification checklist, launch master checklist, testing strategy, and current sweep artifact, and updated guard coverage so old flow/PR snapshots cannot be mistaken for current launch truth.

## Continuation - Ticket Finisher And Sharded Log Guidance Refresh

- Found `agent/runbooks/proofound-ticket-finisher.md`, `agent/scratchpad/README.md`, and `project/changes/README.md` still verified on February/March dates while acting as current future-agent instructions.
- Refreshed the ticket-finisher runbook to clarify that the helper is administrative only, cannot prove MVP/launch readiness by itself, must not mutate git/final Linear closeout, and must defer to current verification, Browser/runtime evidence, and current GitHub/Linear state when relevant.
- Refreshed sharded log READMEs so future agents know `npm run log:session` and `npm run log:change` create real files, avoid legacy shared-log appends, avoid secrets/private proof data, and record Browser evidence with route, viewport, role/mode, and finding.

## Continuation - Implementation And Milestone Contract Refresh

- Found root/project `Implement.md` and `Plans.md` sync pairs verified on 2026-05-14 while still carrying older milestone language around ranked matching, pipeline flows, third-party provider fallback, and a root/project cron mismatch.
- Refreshed implementation contracts so future work keeps Browser/Playwright evidence for UI changes, treats log scripts as real-file creators, updates sweep/docs when launch evidence changes, and blocks archived/post-MVP route revival, public-directory behavior, profile theater, vanity metrics, and broad platform language.
- Refreshed milestone framing around reason-coded privacy-safe review, manual-link interview default, current Vercel cron routes, launch-support-only observability, production-candidate backup/restore evidence, and Browser/Playwright evidence for changed UI surfaces.

## Continuation - Design And Ubiquitous Language Refresh

- Found `DESIGN.md` and `docs/PROOFOUND_UBIQUITOUS_LANGUAGE.md` still verified on earlier dates while remaining active guidance for UI, copy, and naming.
- Refreshed the design contract with active-surface checks for primary object/action clarity, privacy/trust/proof/readiness states, gated/archived/disabled/empty/loading/error/success states, no public-directory cues, no score/rank/automated-verdict presentation, and Browser/Playwright desktop/mobile evidence for meaningful UI edits.
- Refreshed ubiquitous language with current corridor terms: primary object, primary next action, trust state, reason code, manual-link interview, privacy stage, and explicit guardrails against public directory, profile theater, vanity metric, broad marketplace, or broad platform language.

## Continuation - Legacy Scratchpad Reclassification

- Found `agent/scratchpad.md` still classified active even though `AGENTS.md`, preflight, verification guidance, and the sharded README all define it as a frozen legacy shared log.
- Reclassified `agent/scratchpad.md` as historical/archive, added current metadata, and made clear it is not current launch evidence, implementation status, or verification proof.
- Preserved the historical entries in place while keeping routine work directed to `agent/scratchpad/entries/` via `npm run log:session`.

## Continuation - Authority Metadata Freshness

- Found stale active registry dates on the locked MVP authority stack while the documents remain current launch-binding sources under `AGENTS.md`.
- Added explicit freshness metadata to the aligned PRD, technical requirements, and launch runbook, and refreshed metadata on `AGENTS.md`, the locked MVP source, and GTM plan without changing product scope or behavior.
- Updated `docs/DOCS_REGISTRY.md` and the launch gate guard so future sweeps can distinguish current authority from stale reference material.

## Continuation - Browser Recheck On Current Local Server

- Used the Codex in-app Browser on `http://localhost:33180` after the authority-metadata checkpoint.
- `/portfolio/demo`, `/portfolio/demo-proofound`, and `/portfolio/org/test-org` rendered launch-safe unavailable pages in this current non-mock/data-gated server state. No public profile, organization trust data, hidden identity, or private proof content was exposed.
- `/` rendered `Proofound | Proof Behind the Claim` with H1 `Proof behind the claim`, primary CTAs to `/signup/organization` and `/signup/individual`, footer legal links to `/cookies`, `/cookies/settings`, `/privacy`, and `/terms`, and no stale broad-platform copy matching `Universal compatibility`, `Better matching`, `black-box`, `public directory`, or `social platform`.
- `/signup`, `/signup/individual`, and `/signup/organization` rendered clear account-type and account-creation entry points with privacy/terms links and no broad marketplace or public-directory language.
- `/login` initially resolved into an authenticated individual app shell in the current Browser session. The logged-out login state was rechecked in the continuation below after visiting `/auth/logout`.

## Continuation - Logged-Out Login Browser Evidence

- Used the Codex in-app Browser to visit `/auth/logout`, then `/login`, on `http://localhost:33180` so the route rendered as a logged-out user.
- Browser verified title `Sign In | Proofound`, H1 `Welcome back`, email/password fields, `Remember me`, `Forgot password?`, primary `Sign in` action, Google/LinkedIn sign-in buttons, `Create account` routing to `/signup`, and Terms/Privacy links.
- Browser screenshot showed a single calm sign-in card, visible primary action, readable form labels, and no overlapping text in the desktop viewport.
- DOM inspection found no broad marketplace, public-directory, social-platform, profile-theater, or dashboard-theater language on the logged-out login surface.
- `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH npm run test -- tests/ui/signin-form-mobile-clarity.test.tsx` - passed, 1 file / 2 tests. The attempted mixed Vitest run did not execute the Playwright spec because it belongs to the Playwright runner.
- `npm run test:a11y -- tests/a11y/keyboard-navigation.spec.ts` first failed in the sandbox because Playwright could not bind `0.0.0.0:33101`; the approved outside-sandbox rerun initially reported the file green, then four TODO-only passing checks were converted to explicit skips.
- Follow-up evidence hygiene found four TODO-only keyboard tests that were passing without assertions.
  They are now explicit skipped checks for modal focus-trap, dropdown keyboard behavior, table/grid
  navigation, and modal focus-return until stable active MVP fixtures exist.
- Archived the unused donor/investor evidence-pack export implementation and tests under
  `src/archive/non_launch_evidence_pack/` and `tests/archive/non_mvp_evidence_pack/`; active
  integration guidance no longer implies an MVP evidence-pack API endpoint exists.
- Verification after the cleanup:
  - `npm run test:a11y -- --reporter=line` passed outside the sandbox with `11 passed / 4 skipped`.
  - `npx vitest run --config vitest.archived.config.ts tests/archive/non_mvp_evidence_pack/evidence-pack.archived.test.ts` passed `11/11`.
  - Focused launch-gate/inventory tests, docs freshness, lint, typecheck, and portfolio PDF smoke tests passed.
- Follow-up active-source residue sweep removed commented SQL against a nonexistent `applications`
  table, converted phase-2 notes to explicit post-MVP language, made the unused security-monitoring
  wrapper fail closed when callers request auth/rate-limit enforcement it does not provide, and
  clarified mock RPC fallback copy.
- Launch checklist hardening follow-up: `npm run launch:checklist` was able to crash before writing a
  checklist when the local environment could not bind a localhost port. `runRepoReadyValidationBundle`
  now records that as a failed `prod_boot` gate with a captured boot-error log and continues collecting
  repo-only evidence, so checklist output remains explicit `NOT_READY` evidence instead of disappearing.
- Added a repo-ready `public_portfolio_safe` gate using the public portfolio page, access-consistency,
  and projection tests. Regenerated `npm run launch:checklist`; the public page privacy/separation row
  moved from `UNVERIFIED` to `PASS`, leaving org trust smoke, local `next start`, launch-status smoke
  freshness, and external ops signoffs as the visible remaining blockers.

## Continuation - Phase 4 Local Smoke Refresh

- Ran `PATH=/Users/yuriibakurov/.nvm/versions/node/v25.4.0/bin:$PATH BASE_URL=http://localhost:33183 npm run test:launch:smoke -- --scope full --base-url http://localhost:33183 --artifact .artifacts/mvp-surface-sweep-2026-05-19/phase4-local-launch-smoke-full.json` outside the sandbox after sandbox and same-port runs produced environment collisions.
- The final fresh-port rerun passed all six full-scope checks: public individual portfolio, proof creation, seeded public organization trust fixture, strict org corridor review-to-engagement verification, hidden portfolio protection, and privacy no-leak.
- Updated `.artifacts/mvp-surface-sweep-2026-05-19/phase4-local-launch-smoke-full.json`; the artifact now has `overallStatus: pass`, target `http://localhost:33183`, and generation time `2026-05-19T17:00:11.542Z`.
- A read-only `go:no-go` attempt with direct smoke and synthetics disabled first failed against the previous stale artifact, then could not complete against `33183` because a temporary clean dev server did not stay healthy for protected status endpoint checks. This leaves final local go/no-go status evidence open while improving the full launch smoke evidence.
- No database backup, restore verification, production deployment, billing, auth, permission, or infra target was touched.

## Continuation - Final Gate Command Alignment

- Found `verification.md` still documenting the launch smoke artifact as `BASE_URL=http://localhost:3000 npm run test:launch:smoke` while the surrounding final perf, monitor, launch-status, and go/no-go gates already required `<production-candidate-url>`.
- Updated `verification.md` so launch smoke evidence uses `BASE_URL=<production-candidate-url>` for production signoff, preserving local smoke as useful parity evidence but not final launch proof.
- Updated `Documentation.md` and `metrics.md` labels from local-server gate parity to final production-candidate gate parity where the commands already target `<production-candidate-url>`.
- Strengthened `tests/scripts/launch-gate-config.test.ts` so active launch evidence docs cannot reintroduce localhost-backed final `test:launch:smoke`, perf, monitor, launch-status, launch-validate, or go/no-go commands.

## Continuation - Phase Exit Target Alignment

- Found active Phase 0 and Phase 3 exit checklist rows still hardcoding `BASE_URL=https://proofound.io npm run test:launch:smoke`, which could be mistaken for current target-specific production-candidate evidence.
- Updated `docs/backlog/phase-exit-checklist.md` so production-candidate smoke and monitor rows use `<production-candidate-url>` and `<secret>`, while the checked Phase 3 row names the current local smoke artifact target `http://localhost:33183` and leaves production-candidate smoke as a Phase 4 signoff gate.
- Updated `docs/backlog/phase-4-pilot-hardening.md` so its local smoke evidence points at the fresh `localhost:33183` artifact; the separate local monitor evidence remains tied to its original `localhost:33180` run.
- Extended the launch-gate guard so active launch evidence docs cannot reintroduce hardcoded `https://proofound.io` final gate commands either.

## Continuation - Placeholder Result Claim Cleanup

- Found synced active root docs (`Documentation.md`, `metrics.md`) claiming `PASS` or `FAIL` results on commands that used the placeholder `BASE_URL=<production-candidate-url>`, including `go:no-go` PASS claims that conflicted with the open production-candidate signoff gates.
- Reworded those entries as historical local runtime launch-gate notes, preserving the original local context while making clear they are not current production-candidate evidence.
- Added guard coverage so active launch evidence docs cannot mark placeholder production-candidate gate commands as `PASS` or `FAIL`; real result claims need a concrete dated target/artifact instead.

## Continuation - Browser Login Runtime Recheck

- Used the Codex in-app Browser on the open `http://localhost:33180/login` tab as requested.
- Browser first showed `Internal Server Error` because the local server on port `33180` was no longer reachable from shell (`curl` could not connect).
- Restarted the local dev server on `33180` in mock mode, reloaded the Browser tab, and verified the logged-out login surface rendered with title `Sign In | Proofound`, H1 `Welcome back`, email/password fields, remember-me, reset-password link, primary `Sign in`, Google/LinkedIn sign-in buttons, `Create account`, Terms, and Privacy links.
- Browser DOM check found no forbidden broad-platform/public-directory/profile-theater/dashboard-theater language on the login surface.
- Next briefly rewrote `tsconfig.json` during server startup; the file was restored to the committed shape because `.next-dev*/types/**/*.ts` already covers the per-port generated type folders.

## Continuation - Broad Reference Spec Boundary

- Found three broad reference-spec root docs without explicit launch-authority boundaries at the top: `DATA_REQUIREMENTS_AND_AI_STRATEGY.md`, `FULL_PRODUCT_ARCHITECTURE_PLAN.md`, and `SPRINT_1_PLAN.md`.
- Added `Doc Class: reference-spec`, `Last Verified: 2026-05-19`, and locked-MVP precedence notes so future sweeps do not mistake AI/data strategy, full-product architecture, or old sprint taxonomy material for current MVP launch scope.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so those broad reference docs stay visibly outside active MVP launch authority.

## Continuation - Expertise Dataset Reference Boundary

- Found `data/README-EXPERTISE-ATLAS-SKILLS.md` still classified as reference-spec but using active-sounding `Expertise Atlas MVP` language and import next steps, despite `/app/i/expertise` and the broad Atlas UI being archived/post-MVP.
- Added explicit reference-spec metadata, locked-MVP precedence, and archived-UI warnings to the dataset README.
- Reworded dataset descriptions so it is retained taxonomy/reference context, not active launch evidence or a route to revive archived Expertise Atlas UI/smart-search/database shortcuts.
- Replaced active-sounding import/search/UI next steps with historical usage and reference-only follow-up language tied to target-approved taxonomy recovery, active migration/backup/restore runbooks, proof-skill selection, and assignment expertise helpers.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so the retained dataset guidance stays aligned with the current archived Atlas posture.

## Continuation - Privacy Test Guidance Scope

- Found `tests/privacy/README.md` still verified on 2026-02-12, with Node 20/npm-install setup guidance and `100%` privacy coverage rows that could be mistaken for current launch proof.
- Added reference-spec metadata, current Node 24.15.0 and `npm ci` setup wording, and a clear note that the README is test-suite guidance rather than standalone launch readiness evidence.
- Replaced the `100%` coverage table with target expectations and required fresh target-specific privacy test output for launch evidence.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so the privacy README cannot drift back to stale runtime or overbroad launch-proof claims.

## Continuation - Historical Load Test Scope

- Found `tests/load/RESULTS.md` still verified on 2026-02-12 and instructing a global `npm install -g artillery`, while current launch performance proof is the `perf:budgets` gate plus authenticated perf-status/go-no-go evidence.
- Added reference-spec metadata and clarified the file is historical/non-gating load-test context.
- Removed the global install prerequisite and reframed Artillery scenarios as optional stress exploration requiring target, tool-version, date, owner, and production-data notes.
- Updated `docs/DOCS_REGISTRY.md` and launch-gate coverage so historical load results cannot be mistaken for current launch performance evidence.

## Continuation - Privacy Env And Integration Plan Drift

- Found `tests/privacy/ENV_SETUP.md` still recommending `supabase db push`, SQL Editor paste flows, old policy file paths, and missing/nonexistent privacy setup/cleanup scripts.
- Reworked the privacy env setup around the repo-owned migration path: drift check, backup checkpoint, migration audit, migrate, isolated restore verification, and current `test:privacy` / `test:privacy:extended` gates.
- Removed the same direct schema-push/dashboard-paste troubleshooting guidance from `tests/privacy/README.md` so both privacy docs point at repo-owned migrations and target-specific backup/restore evidence.
- Found `INTEGRATION_TEST_PLAN.md` still naming missing active integration files for archived critical-gaps and CV import wizard suites.
- Updated the plan to list only active integration test files and to mark critical-gaps/CV import wizard tests as historical archive material, then updated registry dates and guard coverage.

## Continuation - Python CV Endpoint Launch Boundary

- Found `api/python/cv_import.py` still dispatching Python `wizard-suggest` and `internal-job` modes even though the active TypeScript wizard/cron surfaces are archived/non-launch.
- Kept retained internal Python `suggest` and `extract` modes intact, but changed direct Python `wizard-suggest` and `internal-job` handlers plus `/api/python/cv_import?endpoint=...` dispatch to return archived `410` responses.
- Updated active Python tests so they prove the retired endpoint modes stay archived, removed wizard-specific multipart and contract expectations from active tests, and kept the retained suggest/extract coverage active.
- Updated `docs/ENV_VARIABLES.md` so `PYTHON_INTERNAL_SERVICE_SECRET` and `PYTHON_CV_IMPORT_BASE_URL` describe retained suggest/extract behavior and explicitly state that Python wizard/internal-job modes are archived and not launch evidence.

## Continuation - Production-Candidate Restore Evidence Gate

- Found `scripts/go-no-go-check.ts` still checking only that backup/restore scripts and `docs/launch-restore-drill.md` exist, while current launch docs say final go/no-go requires production-candidate backup checkpoint and isolated restore evidence.
- Tightened go/no-go behavior so localhost targets keep the existing local-parity restore-tooling check, but non-local production-candidate targets now require a fresh passing restore verification report at `.artifacts/launch-restore-report.json` or `LAUNCH_RESTORE_REPORT_PATH`.
- The production-candidate restore report must have `ok: true`, a valid `generatedAt`, be no older than `LAUNCH_RESTORE_REPORT_MAX_AGE_HOURS` (default 72), and point to readable `summary.json` and `row-fingerprint.json` checkpoint evidence.
- Updated `docs/launch-restore-drill.md`, `agent/checklists/verification.md`, and `docs/mvp-launch-master-checklist.md` so final launch operators write the restore report with `npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json` before running final go/no-go.

## Continuation - Dependency Audit Evidence Refresh

- Reran `npm run audit:prod` after sandbox DNS blocked npm registry access; the approved network rerun exited `0` at the high/critical threshold.
- Current audit output still reports 9 moderate transitive advisories: `protobufjs` through `@xenova/transformers`/`onnxruntime-web` and `ws` through `react-email`/Socket.IO. `npm audit fix --force` would introduce breaking dependency changes, so no automatic force fix was applied in this sweep checkpoint.
- Attempted `npm run audit:all`; the sandbox run failed with DNS `ENOTFOUND`, and the escalated external audit was rejected by local policy because it sends dependency metadata to the npm registry. Treat the all-scope audit as UNVERIFIED until the user explicitly approves that disclosure.
- Updated `docs/CURRENT_TRUTH.md` so it no longer claims zero production dependency vulnerabilities from stale May 14 evidence.

## Continuation - Restore Report Command Alignment

- Found active operator docs still using `npm run db:restore:verify -- --checkpoint <dir>` without the `--out .artifacts/launch-restore-report.json` evidence path now required by production-candidate `go:no-go`.
- Updated production, release, deployment, phase-exit, storage, DPA, Supabase MCP, privacy-env, and historical RLS command examples so final launch-oriented restore verification writes the canonical restore report artifact.
- Left `docs/launch-restore-drill.md`'s generic source-of-truth description unchanged, because the drill already includes the explicit `--out .artifacts/launch-restore-report.json` final evidence command below that description.

## Continuation - Go/No-Go Summary Command Alignment

- Found active README, setup, testing, performance, and QA summaries still describing `npm run go:no-go` as a generic perf/SUS/readiness gate or using production-candidate commands without `CRON_SECRET`.
- Updated the summaries so operators see the current enforced contract: fresh launch smoke evidence, authenticated protected perf/launch status endpoints, required safe-mode/evidence flags, and a fresh production-candidate restore report for non-local targets.
- Added backup checkpoint plus `db:restore:verify --out .artifacts/launch-restore-report.json` to final launch validation command lists before final `go:no-go`.

## Continuation - Historical Progress Log Boundary

- Found `docs/codex-progress.md` registered as historical but still opening with a March 2026 machine-readable state and stale current-block language.
- Added historical metadata plus a visible supersession note that directs operators to `docs/CURRENT_TRUTH.md`, this sweep artifact, and fresh repo evidence before citing any PASS/FAIL/UNVERIFIED or blocker language from the log.
- Updated `docs/DOCS_REGISTRY.md` so the preserved progress log reflects the 2026-05-19 historical-boundary refresh.

## Continuation - Monitoring Guide Evidence Boundary

- Found active `docs/monitoring-alerting.md` without doc metadata, still pointing at the older unaligned technical requirements filename and containing a February Vercel `PASS` run log.
- Added active metadata, pointed the launch contract note at `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`, and clarified that historical PASS/FAIL run logs are not current production-candidate signoff evidence.

## Continuation - Security Scan Result Refresh

- Found active `docs/security-scan-results.md` still claiming a 2025 all-green security scan, zero production vulnerabilities, and broad secure/PASS posture despite the refreshed 2026-05-19 dependency evidence.
- Replaced the stale all-green report with a current security-scan evidence index: `audit:prod` passes at the high/critical threshold with 9 moderate transitive advisories, `audit:all` remains UNVERIFIED without explicit npm-registry metadata disclosure approval, and final security readiness still depends on fresh target-specific launch evidence.

## Continuation - Active Doc Metadata Alignment

- Scanned active docs in `docs/DOCS_REGISTRY.md` for missing `Doc Class` markers.
- Added active metadata to `docs/caching-pagination.md` and `docs/verification-checklist.md`; left `.github/SECURITY.md` in the public GitHub security-policy shape because it already carries a `Last Verified` marker and is user-facing repository policy.

## Continuation - Final Restore Evidence Ordering

- Found active final-gate checklists whose short command lists still went from perf or monitor directly to `go:no-go`, even though production-candidate `go:no-go` now requires a fresh restore report first.
- Added backup checkpoint plus isolated `db:restore:verify --out .artifacts/launch-restore-report.json` steps before final `go:no-go` in the deployment, release, production-readiness, and launch-master checklist summaries.
- Fixed the remaining Phase 4 backlog `go:no-go` examples so production-candidate runs include `CRON_SECRET=<secret>`.

## Continuation - April 29 Artifact Supersession Boundary

- Found retained April 29 readiness artifacts still opening without reference-spec metadata, and the rerun artifact still showing a live `go:no-go` command without the now-required restore report or `CRON_SECRET`.
- Added historical/superseded evidence banners to both April 29 artifacts, updated their registry dates, and corrected the rerun's live launch evidence sequence to include backup, isolated restore report, and authenticated final `go:no-go`.

## Continuation - Retired Purpose Audit Route Classification

- Found `/api/user/audit-log/purpose` returning `410 Gone` as retired individual purpose audit history, while `src/lib/launch/surface-policy.ts`, the launch API inventory test, and `docs/API_REFERENCE.md` still classified it as active MVP.
- Reclassified the route as archived compatibility, kept the 410 route behavior and focused route test intact, and regenerated the API reference so the route inventory matches the actual launch surface.

## Continuation - Retired Cancel-Deletion Route Classification

- Found `/api/user/account/cancel-deletion` returning authenticated `410 Gone` because account deletion is immediate and irreversible, while the route inventory still treated it as active MVP.
- Reclassified the retired scheduled-deletion cancel endpoint as archived compatibility while preserving the explicit 401/410 behavior covered by `tests/api/user-account-lifecycle-routes.test.ts`.

## Continuation - Mixed Taxonomy Route And Root Production Checklist

- Checked the only remaining active API route whose source contains archived-response text: `/api/expertise/taxonomy`.
- Confirmed it is intentionally mixed-mode: normal taxonomy lookup remains active for assignment/proof skill mapping, while the legacy `context=cv_import` mode returns `410` without calling Atlas search or leaking submitted CV/evidence text. Existing coverage lives in `tests/api/expertise-taxonomy-route.test.ts`.
- Found `PRODUCTION_CHECKLIST.md` still using a bare `npm run db:restore:verify` restore rehearsal command even though production-candidate `go:no-go` requires `.artifacts/launch-restore-report.json`.
- Updated the root production checklist and launch-gate coverage so the isolated restore rehearsal writes `--out .artifacts/launch-restore-report.json`, keeps checkpoint evidence readable, and explicitly checks the report before final `go:no-go`.

## Continuation - Retained Mobile And Database Reference Boundaries

- Found `docs/mobile/IOS_PARITY_MATRIX.md` still verified from February and reading like `/api/mobile/v1/*` was active backend planning, while `src/lib/launch/surface-policy.ts` archives `/api/mobile/*` for the locked launch MVP.
- Refreshed the matrix as post-MVP reference context only and added a visible launch-boundary note so it cannot be used as MVP route/API evidence without an explicit authority-stack change.
- Found `test-db-flows.md` still stale and missing the current restore-report evidence command required by production-candidate `go:no-go`.
- Updated the retained database flow guide, docs registry, and launch-gate coverage so reference DB guidance points at drift check, migration audit, backup checkpoint, versioned migrate, and restore verification with `--out .artifacts/launch-restore-report.json`.

## Continuation - Integration Test Mobile Boundary

- Found `INTEGRATION_TEST_PLAN.md` still saying `/api/mobile/v1/*` bootstrap and device-token routes remain compatible, contradicting the current route policy that archives `/api/mobile/*` for the locked MVP.
- Replaced the active-looking mobile contract section with an archived mobile boundary: mobile docs remain post-MVP reference only, and any future mobile reactivation must include an approved route-surface change plus focused contract tests.
- Added launch-gate coverage so the integration plan cannot quietly re-promote `/api/mobile/v1/*` compatibility as current launch evidence.

## Continuation - Legacy PRD Mirror Authority Boundary

- Found `Proofound_PRD_MVP.md` still listing the preserved Project Specification and old technical/runbook files first in its reading order, despite the current AGENTS authority stack putting the locked MVP source of truth and aligned PRD/technical/runbook/GTM stack first.
- Refreshed `Proofound_PRD_MVP.md` and `PRD_for_a_web_platform_MVP.md` as reference-spec mirrors verified on 2026-05-19, with explicit language that old master/latest and Project Specification files are reference-only and cannot broaden the locked MVP corridor.
- Added launch-gate coverage so these legacy PRD mirrors cannot silently re-rank the authority stack above the locked MVP source of truth.

## Continuation - GEO Audit Public-Surface Boundary

- Found `agent/runbooks/geo-audit.md` still listing archived public marketing pages (`/about`, `/manifesto`, `/careers`, `/contact`, `/support`) as GEO audit targets, while `src/lib/launch/surface-policy.ts` classifies those paths as archived.
- Updated the runbook so GEO work stays on active public launch pages, legal pages, technical crawl surfaces, public portfolios, organization trust pages, and enabled assignment/public-share surfaces.
- Added guard coverage that archived marketing pages are treated as route-policy outcomes, not missing SEO work or a reason to revive broad marketing pages during MVP launch hardening.

## Continuation - Release Batch Launch-Gate Boundary

- Found `agent/runbooks/release-batch-flow.md` still verified from March and describing production promotion mainly as release mechanics, workflow completion, and public health, without naming current production-candidate backup, isolated restore, protected status, and final authenticated `go:no-go` gates.
- Refreshed the release-batch runbook so it explicitly says release mechanics do not replace the current release, production-readiness, phase-exit, and sweep evidence gates.
- Updated `agent/checklists/verification.md` and launch-gate coverage so release-batch validation stays separate from launch readiness signoff and still requires launch smoke, protected launch/perf status, backup checkpoint, restore report, and final authenticated `go:no-go`.

## Continuation - Retired Skill Gaps UI Archive Boundary

- Found `src/components/skill-gaps/SkillGapsClient.tsx` and `LearningRecommendations.tsx` still under active components even though `/app/i/skill-gaps` and `/api/skill-gaps*` are archived outside the locked MVP corridor.
- Moved the retired skill-gaps client implementation under `src/archive/non_launch_pages/app/i/skill-gaps/implementation/`, added an archive README, and updated the archived Expertise Atlas island to import the archived client path.
- Added launch-gate coverage so the retired skill-gaps UI cannot quietly return to active `src/components` or keep active imports into archived `/api/skill-gaps*` behavior.

## Continuation - Unfinished Active UI Component Archive Boundary

- Found unused active components preserving TODO/coming-soon behavior: `src/components/matching/AssignmentBuilderV2.tsx`, `src/components/matching/WeightsFiltersSheet.tsx`, and `src/components/ComingSoon.tsx`.
- Moved the retired assignment builder/filter controls into `src/archive/non_launch_assignment_collaboration/components/matching/` and the generic coming-soon component into `src/archive/non_launch_pages/components/`.
- Added archive README coverage and launch-gate assertions so generic coming-soon placeholders and unfinished assignment controls do not sit in active MVP component paths.

## Continuation - Browser Plugin Visual Smoke

- Reconnected the Codex `@Browser` plugin through its Browser runtime and started the local app at `http://127.0.0.1:3000`.
- Browser smoke for `/login` redirected to the authenticated individual home, confirming the active session resolves to `/app/i/home` and renders the proof-first object/action structure: `Proof-first home`, `Your Proof Wallet`, `Privacy controls`, and `Export or delete`.
- Browser smoke for `/portfolio/demo` rendered the launch-safe unavailable Public Page state instead of exposing demo/private profile data: `This Public Page link is unavailable. It may be hidden, retired, or not ready for launch-safe sharing.`
- No UI code changes were made from this Browser pass; the evidence confirms the current local Browser path is usable and that the checked public fallback is privacy-safe.

## Continuation - Founder Public-Story Evidence Wiring

- Found the final launch checklist still marking `founder_public_story_signal_over_cvs` as `UNVERIFIED` because it depended on stale launch-summary wording that had been correctly removed.
- Rewired that checklist row to use the canonical public-story evidence instead: locked MVP stronger-signal/proof-over-profile-theater language plus README's narrow corridor and no-public-directory launch exclusion.
- Regenerated the final launch checklist: repo scope remains `READY`, with `36` pass, `0` fail, `0` blocked, and only `4` external prerequisites still unverified: incident/support owners, critical alerts, backup/restore verification, and final founder go/no-go signoff.

## Continuation - Python Test Launch-Evidence Boundary

- Found `npm run test:python` and `tests/python/*` lacked a local classification note, even though those tests include retained compatibility assertions for archived `wizard-suggest` and `internal-job` dispatch behavior.
- Added `tests/python/README.md` to classify Python document-intelligence tests as package-level regression coverage, not default MVP launch evidence.
- Updated README specialized-test guidance and launch-gate coverage so future sweep agents do not treat Python CV compatibility tests as proof that the retired CV import wizard or Python internal worker is launch-active.

## Continuation - Browser Polish Evidence Boundary

- Used the Codex Browser plugin against `http://127.0.0.1:3000/portfolio/demo`; the active visible state rendered `Public Page unavailable`, explained the retired/hidden/not-ready state, produced no console errors, and did not leak profile data.
- Used the Codex Browser plugin against `/login` on desktop and `390x844` mobile; the entry surface rendered `Welcome back`, email/password fields, password reveal, remember-me, reset-password, social sign-in buttons, signup CTA, and legal links with no console errors.
- Saved Browser visual evidence under `.artifacts/mvp-surface-sweep-2026-05-19/browser-evidence/`.
- Removed the active untracked polish screenshot collector from default E2E discovery because it had no assertions and would have produced noisy launch evidence rather than a gate.
- Added `.artifacts/polish-audit-screenshots/README.md` plus a local `.gitignore` for generated PNGs so prior screenshots remain local scratch, not committed launch evidence.

## Continuation - Launch Smoke Runner Alignment

- Found `.artifacts/launch-smoke-report.json` had been refreshed to `FAIL` for `full_org_corridor_review_to_engagement_verification` even though a direct strict org-corridor replay passed.
- Root cause: the launch-smoke runner forced shared `BASE_URL=http://localhost:3000` into every command scenario, while the strict org corridor is intended to run against Playwright's managed production-mode server.
- Fixed the runner so scenario env can override shared env, cleared `BASE_URL` for the strict org smoke, pinned it to `PLAYWRIGHT_SERVER_MODE=prod`, skipped transactional email delivery, and used dedicated `PLAYWRIGHT_PORT=33101`.
- Refreshed `.artifacts/launch-smoke-report.json`; full launch smoke now passes all six checks, including strict org corridor review to engagement verification.

## Continuation - Final Checklist Stale-Claim Cleanup

- Found the regenerated final launch checklist still listing two retired stale-claim warnings even though the selected rows were `PASS`: assignment quality checklist vs assignment publish enforcement, and route inventory vs current route-surface tests.
- Fixed `src/lib/launch/final-launch-checklist-definitions.ts` so the assignment SOP is only used as fallback `UNVERIFIED` evidence when no enforcement test is selected, rather than becoming a false stale claim after tests pass.
- Refreshed `.artifacts/proofound-route-inventory.md` with the May 19 route counts and a current-route-policy boundary so old route-breadth language no longer contradicts the passing route-surface gate.
- Regenerated `.artifacts/launch-validation-2026-05-19/final-launch-checklist-status.md/json`; repo scope remains `READY` with `36` pass, `0` fail, `0` blocked, and the same `4` external prerequisites unverified.

## Continuation - Codex Browser Recheck And Local Scratch Hygiene

- Reconnected the Codex `@Browser` plugin through the Browser runtime and opened the local app at `http://localhost:33180/login`.
- Browser route sweep covered `/login`, `/signup`, `/portfolio/demo`, and `/`; screenshots plus route text/object/action evidence were saved under `.artifacts/mvp-surface-sweep-2026-05-19/browser-evidence/codex-browser-2026-05-19/`.
- Browser confirmed `/portfolio/demo` still renders the launch-safe `Public Page unavailable` state with no public profile data exposed.
- The Browser runtime in this session did not expose direct viewport resizing; the attempted mobile Browser resize failed cleanly, so mobile coverage remains represented by the earlier saved Browser evidence and automated E2E route checks.
- Found local DB/debug scratch scripts and `playwright-run.log` visible to Git after the continued Browser/dev-server pass. Added `.gitignore` coverage plus a launch-gate test so `/scratch/` and `playwright-run.log` stay out of launch commits without deleting local developer files.

## Continuation - Strict Individual Home State Alignment

- Found the strict individual E2E flow still expecting the pre-proof home state after it had seeded a proof record and completed the matching-interest path.
- Aligned the test with the active home page state machine: once proof exists, `/app/i/home` should show `Verify strongest proof record` and the context/trust/visibility review copy rather than the first-proof prompt.
- Verified the focused strict flow with `PLAYWRIGHT_PORT=33181 NEXT_PUBLIC_USE_MOCK_SUPABASE=false node ./scripts/playwright-node24.mjs test e2e/strict/individual.strict.spec.ts --project=chromium --reporter=line --workers=1 --grep "I-10..I-14"`; result: `1 passed`.

## Continuation - Historical Evidence Guard For External Launch Prerequisites

- Found the final launch checklist still relied on text-pattern evidence for owner roster, critical-alert proof, restore proof, and final signoff rows.
- Tightened those external production-candidate rows so PASS evidence must come from docs explicitly marked `Doc Class: active`; historical April owner/evidence/signoff files can no longer satisfy current launch proof even if they contain matching PASS phrases.
- Added focused regression coverage proving historical owner, alert, restore, and signoff evidence does not become current full-launch proof.
- Regenerated `.artifacts/launch-validation-2026-05-19/final-launch-checklist-status.md/json`; repo scope remains `READY` with `36` pass, `0` fail, `0` blocked, and `4` external prerequisites still correctly `UNVERIFIED`.

## Continuation - Archived Data Export Alias Boundary

- Found an untracked `src/app/api/data-export/route.ts` alias to `/api/user/export`, which would have reintroduced `/api/data-export` into the compiled launch API surface.
- Confirmed route policy already classifies `/api/data-export` as archived compatibility and the active data portability endpoint is `/api/user/export`.
- Removed the alias from the active app route tree and preserved the boundary in `src/archive/non_launch_api/app/api/data-export/README.md`.
- Verified route inventory and archived-handler coverage: `tests/api/launch-surface-inventory.test.ts` and `tests/api/archived-api-handlers-route.test.ts` passed.
- Follow-up: the strict individual E2E privacy/account-control flow still called `/api/data-export`, which encouraged recreating the archived alias. Updated it to call the canonical `/api/user/export` endpoint instead.

## Continuation - Assignment, Matching, And Interview Surface Polish

- Kept the organization assignments page polish aligned with the MVP corridor: the header now makes the assignment corridor and `Create assignment` action obvious without adding dashboard theater.
- Browser checked `/app/o/test-org/assignments` through the Codex Browser plugin on `localhost:33182`; after a semantic cleanup the page has one `h1`, no horizontal overflow, and no runtime-error text.
- Tightened the individual matching empty state with a calm proof-review search icon and clearer action card hierarchy.
- Tightened the organization interviews surface visual language by replacing inline colors with Proofound tokens, calmer badges, and a single semantic page heading.
- Updated the strict individual E2E privacy/account-control flow to use `/api/user/export`, the canonical active export endpoint.

## Continuation - Codex Browser Live Route Recheck

- Reconnected the Codex `@Browser` plugin and restarted the local app at `http://localhost:33180` after the previous dev server had stopped responding.
- Browser verified `/login` renders `Welcome back`, email/password entry, password reveal, remember-me, reset link, sign-in action, social sign-in actions, signup CTA, and legal links with one `h1`, no horizontal overflow, and no console errors.
- Browser verified the login signup CTA points to `/signup`; direct Browser navigation to `/signup` renders `Join Proofound`, clear Individual and Organization account choices, sign-in fallback, legal links, one `h1`, no horizontal overflow, and no console errors.
- Browser verified `/portfolio/demo` renders the launch-safe `Public Page unavailable` guard and does not expose profile data.
- Browser verified `/org/test-org` and `/admin/launch-status` render launch-safe not-found/archive messaging instead of active public/admin surfaces.
- Browser verified logged-out requests to `/app/i/matching` and `/app/o/test-org/interviews` route to `/login`, preserving protected app access.
- Browser viewport override verified mobile `390x844` behavior for `/login`, `/signup`, and `/portfolio/demo`; all retained one primary heading, no horizontal overflow, and no console errors.
- Browser screenshot capture timed out in this Browser backend session, so this pass records Browser DOM, URL, heading, CTA, overflow, and console-log evidence; earlier saved Browser screenshots remain under `.artifacts/mvp-surface-sweep-2026-05-19/browser-evidence/`.

## Continuation - Launch Evidence Date Boundary

- Found the launch checklist was generating after midnight in the Proofound operating timezone while still writing to `launch-validation-2026-05-19` when the shell `TZ` variable was unset.
- Centralized launch artifact date slugs on the Proofound launch timezone, defaulting to `Europe/Stockholm` with `PROOFOUND_LAUNCH_TIME_ZONE` / `TZ` overrides.
- Added regression coverage for the May 20 Stockholm boundary and reran the repo launch checklist under Node 24 with localhost binding allowed.
- New current repo evidence is `.artifacts/launch-validation-2026-05-20/final-launch-checklist-status.md`: repo scope `READY`, `36` pass, `0` fail, `0` blocked, and `4` external prerequisites still unverified.
- Reran the repo checklist after committing the launch-timezone fix; the May 20 bundle now records current HEAD `d25210ff` with the same `READY` verdict and external-only unresolved prerequisites.
- Follow-up: the final checklist's `Verification status semantics` row now prefers the fresh repo-ready launch-status gate over the historical March current-state matrix, so the PASS summary no longer leads with stale March smoke timestamps when May 20 evidence exists.
- Codex Browser follow-up on `http://localhost:33180`: after restarting the local dev server, Browser DOM/title smoke passed for `/login` (`Sign In | Proofound`), `/portfolio/demo` (`Public Page Unavailable | Proofound`), and `/` (`Proofound | Proof Behind the Claim`). Browser screenshot capture timed out in the in-app Browser, so this pass records DOM/title evidence only.
- Reran the full repo launch checklist at current HEAD `e36eef9e`; the May 20 bundle now records the current commit with repo verdict `READY`, `36` pass, `0` fail, `0` blocked, and the same `4` external prerequisites still unverified.
- Interview scheduling cleanup: removed unused standalone interview card/confirmation/dialog components that still carried old Zoom-default copy, and changed legacy `platform=zoom` records on active individual/org interview surfaces to display `Manual link` so historical meeting URLs do not make native Zoom look like the launch default.
- Interview platform schema cleanup: aligned the active interview schema/types, seed data, fixed-migration scaffold, email template, and tests around launch-active `manual` / `google_meet` scheduling. Added a migration to keep legacy `zoom` / `google` rows readable while preventing new manual-link scheduling from falling back to persisted `zoom` platform values.

## Continuation - Codex Browser Route Smoke And Migration Ledger Check

- Reconnected the Codex `@Browser` plugin through the Browser runtime as requested. The previously open `localhost:33180` target had stopped serving pages, so the local app was restarted on `http://localhost:3000`.
- Browser verified `/login`: title `Sign In | Proofound`, H1 `Welcome back`, email/password fields with browser autocomplete, remember-me, reset-password, primary sign-in action, Google/LinkedIn actions, signup CTA, and legal links.
- Browser route-smoked `/`, `/signup`, `/signup/individual`, `/signup/organization`, `/portfolio/demo`, `/portfolio/org/demo`, `/privacy`, `/terms`, `/cookies`, and `/cookies/settings`. All sampled routes rendered expected titles/headings and had no horizontal overflow in the active Browser viewport.
- Browser confirmed `/portfolio/demo` and `/portfolio/org/demo` remain launch-safe unavailable public surfaces with `noindex` and no exposed profile, organization, or proof data.
- Browser screenshot capture still timed out in this Browser backend session, so this pass records Browser navigation, DOM, title, heading, action, `noindex`, and overflow evidence rather than image evidence.
- Ran `npm run db:drift-check`: passed.
- Ran `npm run db:audit:migrations`: sandbox DNS failed, then the network-enabled audit reached Supabase and reported `126` local migration files and `126` DB migration rows. Current ledger mismatch is expected until the new local interview-platform migration is applied: `20260520103000_align_interview_platform_launch_values.sql` is present locally but not applied, and the DB still has historical `20260317224741_canonicalize_org_role_constraints` without a matching local file.

## Continuation - Final Checklist Stale-Claim Parser Cleanup

- Refreshed the May 20 repo launch checklist at current HEAD `4086cf7e`; repo scope remains `READY` with `36` pass, `0` fail, `0` blocked, and `4` external prerequisites still unverified.
- Found the regenerated `Retired Stale Claims` section was treating indented explanatory bullets as standalone stale claims. That made an old route-count explanation (`138` API handlers / `50` pages) appear beside current route evidence that already says `140` API handlers / `51` pages.
- Fixed the final checklist parser so explicit stale-claim sections collect only top-level bullets. The generated checklist now lists the stale claims themselves without carrying stale explanatory details forward.
- Added focused regression coverage in `src/lib/launch/__tests__/final-launch-checklist.test.ts` and reran the final checklist so `.artifacts/launch-validation-2026-05-20/final-launch-checklist-status.md/json` now reflect the parser fix and current HEAD.

## Continuation - Interview Provider Copy Guard

- Found active interview cancellation API comments still described cancelling meetings in `Zoom or Google Meet`, even though native Zoom scheduling is archived for launch and rejected by active schedule actions/routes.
- Updated the cancellation route comment to describe the launch posture as Google Meet or manual meeting links.
- Updated alert guidance so native video-provider success is not launch-critical when manual meeting links still work, without pairing Zoom and Google as launch-native providers.
- Added launch-gate coverage preventing active `src/`, `docs/`, or `scripts/` files from reintroducing `Zoom or Google Meet` or `native Zoom/Google provider success` language outside archive/history.

## Continuation - API Reference Compatibility Note Clarity

- Found `docs/API_REFERENCE.md` labeled active MVP routes that handle backward-compatible fields as `legacy/compat markers in source`, making active launch APIs look archived or suspect.
- Updated `scripts/generate-api-reference.mjs` so archived routes keep `legacy/compat markers in source`, while active MVP and internal launch-ops routes use `compatibility handling in source`.
- Regenerated `docs/API_REFERENCE.md`; active rows no longer use archived-style legacy wording.
- Added launch-gate coverage so future API reference generation cannot label `active MVP` rows with `legacy/compat markers in source`.

## Continuation - Cache Monitoring Evidence Alignment And Browser Smoke

- Found active cache monitoring code still described Vercel KV stats as a `placeholder for future implementation`, while active monitoring docs showed `cacheStats.hitRate` even though `getCacheStats()` only returns backend type and optional in-memory key counts.
- Updated `src/lib/cache.ts` so KV stats explicitly report backend type only, matching the Vercel KV REST limitation rather than implying an unfinished launch feature.
- Updated `docs/monitoring-alerting.md` and `docs/caching-pagination.md` so launch-ops guidance shows implemented cache backend/key-count evidence instead of a non-existent cache hit-rate metric.
- Added launch-gate coverage preventing active docs/code from reintroducing the stale cache placeholder or `cacheStats.hitRate` example.
- Reconnected the Codex `@Browser` plugin through the in-app Browser and tested `http://localhost:3000` after starting the local dev server.
- Browser route smoke covered `/`, `/login`, `/signup`, `/portfolio/demo`, `/portfolio/org/demo`, and `/privacy`; all sampled routes rendered expected headings/titles, no horizontal overflow, and no sampled public demo/profile data leak.
- Browser confirmed `/portfolio/demo` and `/portfolio/org/demo` remain `noindex, nofollow, nocache` unavailable public surfaces.
- Browser screenshot capture timed out again in this Browser backend session, so this pass records Browser DOM/title/action/overflow/noindex evidence at `.artifacts/mvp-surface-sweep-2026-05-19/browser-2026-05-20-cache-monitoring/route-smoke.json`.

## Continuation - Monitoring Alerting Launch-Ops Scope Cleanup

- Found active `docs/monitoring-alerting.md` still carried broad generic ops examples: `/api/core/matching/profile` as the monitored transaction, direct team email examples, a `TODO` alert send note, a suggested new health endpoint implementation, payment and cache-hit-rate alert categories, and PagerDuty/Twilio-style escalation language.
- Tightened the monitoring guide around the locked MVP and existing route surface: public `/api/health` remains minimal, internal diagnostics stay behind `/api/monitoring/launch-status` and `/api/monitoring/health-diagnostics`, and alert channels are described as protected launch operator channels rather than tracked personal/team addresses or webhook examples.
- Replaced broad business metrics with MVP corridor workflow health: signup/login, proof upload/import/linking, assignment publishing, shortlist/review, intro, reveal, interview, decision, and engagement verification.
- Added launch-gate coverage so the active monitoring guide cannot drift back to archived/broad route examples, payment alert scope, cache-hit-rate claims, TODO alert wiring, PagerDuty references, or tracked team email examples.

## Continuation - Canonical Matching Route Reference Cleanup

- Found active/reference docs and the load-test script still pointed operators at `/api/core/matching/profile`, even though the route inventory and API reference expose canonical launch matching through `/api/match/profile`; `src/app/api/core/matching/profile/handler.ts` is a shared handler, not the public route.
- Updated `docs/caching-pagination.md`, `docs/EXPERTISE_ATLAS_SETUP.md`, `docs/ENV_VARIABLES.md`, and `tests/load/artillery-matching.yml` to use `/api/match/profile` for launch-facing matching profile traffic.
- Clarified that the near-matches path is a retained internal handler boundary rather than an active public `/api/core/matching/near-matches` route.
- Updated historical load-test notes to track cache backend health/provider key-count evidence instead of unavailable cache hit-rate telemetry.
- Added launch-gate coverage so active docs and the reference load script do not drift back to the stale `/api/core/matching/profile` public route reference.

## Continuation - Transactional Email Provider Fail-Closed Cleanup

- Found active `src/lib/email.ts` still created a Resend client with the literal fallback key `placeholder_key` when `RESEND_API_KEY` was missing.
- Removed the placeholder-key provider fallback and aligned the legacy workflow-email module with `src/lib/email/config.ts`: it now creates a Resend client only when `EMAIL_CONFIG.apiKey` is present.
- Added a shared legacy-send helper so explicit `PROOFOUND_SKIP_TRANSACTIONAL_EMAIL_DELIVERY=true` dry-run targets still return a skipped delivery id, while missing provider config no longer attempts a live provider call with a fake key.
- Added launch-gate coverage preventing the placeholder key or `process.env.RESEND_API_KEY || ...` fallback from returning to the active legacy email module.

## Continuation - Deployment Guide Email And Alert Scope Cleanup

- Found active `docs/deployment-guide.md` still carried generic transactional-email examples: `RESEND_API_KEY=re_xxx`, `EMAIL_FROM=noreply@yourdomain.com`, a direct `new Resend(process.env.RESEND_API_KEY)` test snippet, and a temporary `/api/test/email` pattern.
- Aligned the deployment guide with `docs/RESEND_SETUP.md`: provider secrets stay in the target secret manager, sender/reply-to use approved Proofound-controlled addresses, and target-specific live email verification requires an explicit target, recipient, and operator approval.
- Replaced generic `yourdomain.com` production launch examples with the canonical `https://proofound.io` production domain where the guide is launch-specific.
- Tightened Sentry alert guidance from an ambiguous `Email team` action to a monitored launch operator channel and named incident owner.
- Added launch-gate coverage so active deployment guidance cannot drift back to stale generic email placeholders, ad-hoc test endpoints, direct provider snippets, broad team-email alerting, or `https://yourdomain.com` launch examples.
- Reconnected the Codex `@Browser` plugin and used the in-app Browser against the restarted local app on `http://localhost:3000`.
- Browser route smoke covered `/`, `/login`, `/signup`, `/portfolio/demo`, `/portfolio/org/demo`, and `/privacy`; all sampled routes rendered expected headings/titles, had no horizontal overflow, and public demo portfolio/org surfaces remained `noindex, nofollow, nocache`.
- Browser mobile viewport smoke covered `/login` at `390x844` with no horizontal overflow and retained the primary `Welcome back` heading and sign-in action.
- Browser screenshot capture timed out again in this backend session, so evidence is saved as DOM/title/action/overflow/noindex data at `.artifacts/mvp-surface-sweep-2026-05-19/browser-2026-05-20-deployment-guide/route-smoke.json`.

## Continuation - OAuth Callback Placeholder Cleanup

- Found active `docs/ENV_VARIABLES.md` still used `yourdomain.com`, `preview.yourdomain.com`, and `demo.yourdomain.com` in Google and LinkedIn callback examples, even though launch-specific operator docs now use the canonical production domain or explicit target placeholders.
- Replaced launch callback examples with `https://proofound.io` for production and `<preview-app-url>` / `<staging-app-url>` for non-production targets.
- Updated `scripts/test-veriff-config.js` so its fallback webhook instruction points to `https://proofound.io` instead of a generic placeholder domain.
- Added launch-gate coverage preventing the active environment docs and Veriff config helper from reintroducing `yourdomain.com` callback examples.

## Continuation - Organization API Public Directory Guard

- Found active `GET /api/organizations` returned up to 1000 organizations without an auth check, making an active MVP API behave like a public organization directory.
- Changed `GET /api/organizations` to require session auth and return only the signed-in user's active organizations for scoped work-email/org selection.
- Updated the API reference generator so routes using `requireApiAuth` are classified as `session`; regenerated `docs/API_REFERENCE.md`, which now documents `/api/organizations`, `/api/organizations/[orgId]/assignments`, `/api/match/explain/[matchId]`, and `/api/engagement-verifications/[id]` as session-scoped instead of public.
- Added route and launch-gate coverage so organization list behavior and API reference auth tiers stay aligned with privacy-safe MVP behavior.

## Continuation - Landing Proof Example Copy Tightening

- Visual thesis: the landing story should feel like calm proof review for mission-led hiring, not enterprise SaaS scale theater.
- Content plan: keep the existing proof/assignment demo mechanics, but replace broad B2B SaaS, enterprise-client, and 200+ employee examples with mission-led teams, regional operations, clear handoffs, and one concrete hiring program.
- Interaction thesis: no interaction changes; the surface already makes the proof story understandable, while the wording needed to better support the locked MVP corridor.
- Updated `src/components/landing/sections/ScrollytellingSection.tsx` to remove broad enterprise SaaS framing from the public landing proof examples.
- Added launch-gate coverage preventing the landing proof story from drifting back to `B2B SaaS`, `Enterprise clients`, `B2B platform`, `200+ employees`, or `growth-stage B2B` language.
- Browser verified `http://localhost:3000/` at desktop and mobile viewports after the copy change: title/H1 rendered, no horizontal overflow, and no sampled stale enterprise SaaS copy was present in rendered body text.
- Saved Browser evidence at `.artifacts/mvp-surface-sweep-2026-05-19/browser-2026-05-20-landing-copy/landing-copy-smoke.json` and `.artifacts/mvp-surface-sweep-2026-05-19/browser-2026-05-20-landing-copy/landing-copy-scroll-smoke.json`.

## Continuation - Monitoring Guide Dashboard Scope Cleanup

- Found active `docs/monitoring-alerting.md` still suggested creating a new `src/app/admin/monitoring/page.tsx` custom monitoring dashboard with total-user and 24-hour signup widgets.
- Replaced the custom-dashboard implementation guidance with existing provider views and protected launch-status routes: `/api/monitoring/launch-status`, `/api/monitoring/perf-status`, and `/api/monitoring/health-diagnostics`.
- Tightened the overview from broad `comprehensive monitoring` to launch-safe monitoring evidence, so the guide supports alerting, perf, logs, protected diagnostics, and incident response without adding new broad admin-dashboard scope.
- Added launch-gate coverage preventing the monitoring guide from reintroducing the custom admin dashboard snippet, broad user-growth widgets, or comprehensive-monitoring phrasing.

## Continuation - Provider E2E Advisory Scope Cleanup

- Found connected-provider E2E still bundled into `npm run test:e2e:strict:all` and several required launch checklists, even though the locked MVP interview posture remains manual-link first and connected Google/LinkedIn provider scheduling is target-scoped.
- Kept the existing `npm run test:e2e:providers:strict` command for compatibility, added `npm run test:e2e:providers:advisory`, and removed provider-connected coverage from the all-strict launch command.
- Updated launch, release, deployment, production-readiness, testing-strategy, and QA docs so required strict gates cover individual, org, and privacy corridor flows, while provider-connected checks run only when intentionally in scope for the target.
- Renamed the provider Playwright suite title to `Advisory Provider Flows` so test output no longer implies connected-provider scheduling is a locked MVP launch blocker.
- Added launch-gate coverage preventing `test:e2e:strict:all` from pulling provider-connected checks back into the required strict corridor.
- Reconnected the Codex `@Browser` plugin before this cleanup; baseline Browser state initially reported the local Proofound app title at `http://localhost:3000/`.
- Follow-up Browser reload/navigation to `http://localhost:3000/` was blocked by Browser URL policy, and the selected tab then showed a Chrome `localhost refused to connect` error page. No workaround was attempted; this provider-scope cleanup changed docs/scripts/test metadata only, so visual UI evidence remains unchanged from the prior landing and route-smoke passes.

## Continuation - Strict Gate Provider Advisory Follow-Through

- Found `scripts/run-mvp-strict-gates.mjs`, `MANUAL_TESTING_CHECKLIST.md`, `MANUAL_TESTING_GUIDE.md`, root `verification.md`, and `agent/checklists/verification.md` still treated provider E2E as a required/default launch gate.
- Updated the strict gate runner so provider-connected E2E is recorded as a skipped advisory gate by default and runs `npm run test:e2e:providers:advisory` only when `STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=true`.
- Updated manual and governance verification checklists so required launch evidence centers individual, organization, and privacy strict flows, with provider advisory evidence only for targets that intentionally launch connected-provider scheduling.
- Added launch-gate coverage preventing the strict gate runner from reintroducing `providers-strict-e2e` or direct `test:e2e:providers:strict` execution in the default strict corridor.

## Continuation - Migration Runbook And Email Placeholder Cleanup

- Found active setup/deployment surfaces still had a generic `yourdomain.com` DMARC example and a Supabase SQL Editor fallback path that conflicted with canonical migration-runner launch evidence.
- Updated `README.md` to use the Proofound-controlled DMARC reporting address in the Resend DNS example.
- Removed dashboard paste-flow guidance from `docs/deployment-guide.md` and replaced it with migration-runner-first failure handling.
- Updated migration/demo helper scripts so failure text points operators back to canonical `src/db/migrations/*.sql` plus `npm run db:migrate`, and no longer suggests Supabase SQL Editor paste flows or `npm run db:push`.
- Added launch-gate coverage preventing active migration docs/helper scripts from reintroducing SQL Editor paste flow language or helper-script `db:push` guidance.

## Continuation - Surface Policy Overlap Cleanup

- Found retained internal admin, cron, monitoring, and organization-audit routes could still match archived fallback policy classes after their internal-only policy matched, making route classification depend too heavily on policy order.
- Tightened `src/lib/launch/surface-policy.ts` so archived admin, cron, and organization-suite fallbacks explicitly exclude retained internal launch-ops paths.
- Added a surface-policy regression proving retained launch-ops API/page paths match exactly `internal_only_launch_ops` and do not also match archived policy classes.

## Continuation - Archived Why-Not-Shortlisted UI Cleanup

- Found `AUDIT_REMAINING_WORK.md` still named `/api/feedback/why-not-shortlisted` as a TODO-grade active route, but current route policy archives that path and the active route file is gone.
- Found the unused active component `src/components/feedback/WhyNotShortlisted.tsx` still calling the archived endpoint.
- Moved the component into `src/archive/non_launch_feedback/preserved/components/feedback/WhyNotShortlisted.tsx` and documented the archive boundary.
- Added launch-gate coverage so active `src/` files cannot call `/api/feedback/why-not-shortlisted` except through the route-surface policy declaration.

## Continuation - Profile Link Capability Token Evidence

- Found historical audit text still described `validateProfileLinkToken()` as placeholder logic, while current code validates profile snippet share links through capability tokens and live `profile_snippets` state.
- Added focused tests proving empty tokens are rejected before inspection, valid profile-link access requires a `PROFILE_SNIPPET_SHARE` capability token plus an unrevoked/unexpired matching snippet row, invalid capability tokens are rejected, and missing snippet rows do not grant access.

Browser evidence:

- Codex Browser loaded `http://localhost:3000/login`: title `Sign In | Proofound`; visible form included email, password, remember-me, reset-password, signup, terms, and privacy links; browser console error log was empty.
- Codex Browser loaded `http://localhost:3000/portfolio/demo`: title `Public Page Unavailable | Proofound`; route showed the launch-safe unavailable state for the demo public page; browser console error log was empty.
- Codex Browser loaded `http://localhost:3000/`: title `Proofound | Proof Behind the Claim`; visible landing content used proof-first positioning, CTA routing to `/signup/organization` and `/signup/individual`, and no browser console errors were reported.
- Codex Browser loaded `http://localhost:3000/signup`: title `Sign Up | Proofound`; visible signup entry separated Individual and Organization choices, included sign-in plus terms/privacy links, and no browser console errors were reported.

## Continuation - Archived Performance Telemetry Test Cleanup

- Found `tests/api/performance-track-route.test.ts` still asserting the old `/api/performance/track` persistence behavior even though the route is archived by launch surface policy and directly covered as `410 Gone` in `tests/api/archived-api-handlers-route.test.ts`.
- Moved the stale pre-archive performance route test into `tests/archive/non_mvp_analytics_suite/performance-track-route.archived.test.ts` and documented `/api/performance/track` in that archive README.
- Removed obsolete per-file Vitest excludes for old analytics/performance test paths; the active test runner now relies on the archive-directory exclude instead of hiding stale test files in active `tests/api`.

## Continuation - Development Resolve-Home Route Explicit Archive

- Found `src/app/dev/resolve-home/route.ts` was safely development-gated but depended on fallback archived page classification in the route-surface policy.
- Added an explicit archived page policy for `/dev/resolve-home` and focused coverage proving it stays archived in route classification.
- Added a direct route test proving non-development `GET /dev/resolve-home` returns 404 before creating a Supabase client or resolving auth home state.

## Continuation - Route Count Documentation Refresh

- Found active route-evidence docs still carried the previous `110` active API / `14` archived API count after later archived-compatibility cleanup moved current API reference counts to `108` active MVP APIs, `16` internal launch-ops APIs, and `16` archived compatibility APIs.
- Reran `npm run test:launch:routes`; it passed as 4 files / 27 tests.
- Refreshed `docs/API_REFERENCE.md`, `docs/CURRENT_TRUTH.md`, `docs/verification-checklist.md`, `docs/backlog/README.md`, and `docs/backlog/phase-0-scope-lock.md` so active docs agree on 140 API route handlers, 51 compiled pages, the current API launch-surface counts, 48 active page routes, 3 internal-only page routes, and `/dev/resolve-home` as archived/fail-closed development-only compatibility.

Browser evidence:

- Reconnected Codex Browser and started the local app at `http://localhost:3000` after the existing Browser tab was pointing at a stale refused-connection page.
- Codex Browser desktop pass loaded `http://localhost:3000/portfolio/demo`: title `Public Page Unavailable | Proofound`; route showed the launch-safe unavailable public page state for the demo portfolio; browser console warning/error log was empty.
- Codex Browser desktop pass loaded `http://localhost:3000/signup`: title `Sign Up | Proofound`; visible signup entry separated Individual and Organization choices, included sign-in plus terms/privacy links, and browser console warning/error log was empty.
- Codex Browser mobile-width pass at 390x844 repeated `/signup` and `/portfolio/demo`; DOM evidence stayed equivalent, with no browser console warnings/errors.
- Codex Browser screenshot capture was attempted after reconnecting and again after the dev server was live, but `Page.captureScreenshot` timed out both times. DOM, title, route, and console evidence were gathered through Browser; image evidence remains unavailable for this slice.

## Continuation - Documentation Registry Freshness Self-Check

- Found `docs/DOCS_REGISTRY.md` still had `Last Verified: 2026-05-19`, a self-row dated `2026-05-14`, and the sweep artifact row dated `2026-05-19` after the route-count and Browser evidence refresh.
- Updated the registry header, registry self-row, and surface-sweep artifact row to `2026-05-20` so the active docs index matches the current route-count and Browser evidence.
- Added launch-gate coverage so the route-count evidence test also guards the registry header, registry self-row, and sweep artifact row against stale verification dates.

## Continuation - Current-State Artifact Route Truth Refresh

- Found `.artifacts/proofound-current-state-reality-check.md` still contained the March route-breadth `FAIL` row and `138` API / `50` page counts even though active docs now cite it alongside the May sweep evidence.
- Refreshed the current evidence banner and matrix rows for proof-first onboarding, Proof Pack anchor integrity, route-surface scope, and export/delete/auditability so the artifact no longer outranks `docs/verification-checklist.md` with stale `UNVERIFIED` or `FAIL` statuses.
- Updated the retired stale-claim text to point at the 2026-05-20 route inventory: `140` compiled API route handlers, `51` compiled pages, `108` active MVP APIs, `16` internal launch-ops APIs, and `16` archived compatibility handlers.
- Updated `docs/backlog/phase-5-launch-packaging.md` and `docs/DOCS_REGISTRY.md` so Phase 5 and the registry no longer treat historical-registry cleanup as an open watch item after this refresh.
