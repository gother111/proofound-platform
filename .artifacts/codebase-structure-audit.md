# Proofound Codebase Structure Audit

Date: 2026-05-05

Scope: internal structure only. This audit intentionally avoids product scope, launch-readiness claims, UI redesign, and user-facing behavior changes.

## 1. Executive summary

The codebase is generally understandable once the reader knows the main corridors, but it is not easy to enter cold. The strongest structure is in small domain helpers with focused tests, especially `src/lib/uploads/privacy.ts`, `src/lib/proofs/pack-anchor.ts`, `src/lib/assignments/publish-validation.ts`, `src/lib/interviews/process-state.ts`, and the focused tests under `tests/lib/`.

The hardest areas to work in are the large orchestration modules and route families where product concepts overlap. `src/lib/proofs/canonical-pack.ts`, `src/lib/matching/review-contract.ts`, `src/lib/portfolio/public-projection.ts`, and `src/app/api/user/export/route.ts` are doing important work, but each file contains several concepts at once. They are "deep" in the useful sense, but their public interfaces and internal sections need sharper language and smaller extraction points.

The biggest maintainability risks are:

- concept drift between `proof`, `artifact`, `evidence`, `Proof Pack`, and `submission`
- reveal/privacy rules split across authz helpers, matching review projection, conversation routes, email privacy, portfolio projection, and upload privacy
- matching/review namespace drift across `/api/match`, `/api/matches`, `/api/matching-profile`, `/api/core/matching`, and organization review routes
- large route handlers that own persistence, domain decisions, event emission, email, and response shaping in one file
- test fixtures that are mostly route-local, which makes valid object setup easy to accidentally diverge

What should not be touched right now:

- broad route namespace consolidation
- database schema or migration work
- public portfolio behavior
- reveal/identity behavior
- landing-page files
- archived non-launch surfaces except for inventory/documentation

Those areas are too broad or user-visible for this structural pass.

## 2. Codebase map

| Area              | Current ownership                                                           | Should probably own                                                     | Important entry points                                                                              |
| ----------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `src/app/`        | App Router pages, layouts, route handlers, grouped app/public/auth surfaces | routing, request boundaries, page composition                           | `src/app/app/i`, `src/app/app/o`, `src/app/portfolio`, `src/app/api`                                |
| `src/app/api/`    | API handlers, auth checks, persistence calls, some domain decisions         | request parsing, auth, calling domain/service modules, response shaping | `assignments`, `match`, `conversations`, `verification`, `portfolio`, `user`, `upload`              |
| `src/actions/`    | Server actions for onboarding/profile/org flows                             | form/action orchestration with thin calls into domain helpers           | `src/actions/onboarding.ts`, `src/actions/profile.ts`                                               |
| `src/components/` | UI components and some local transformation helpers                         | rendering and client interaction only                                   | `profile`, `organization`, `matching`, `assignments`, `privacy`, `settings`, `landing`              |
| `src/lib/`        | Main business/domain/infra layer                                            | domain modules, shared policy, integrations, service boundaries         | `proofs`, `privacy`, `portfolio`, `matching`, `assignments`, `verification`, `uploads`, `readiness` |
| `src/db/`         | Drizzle schema, seed, SQL policy files                                      | persistence schema and DB setup only                                    | `src/db/schema.ts`, `src/db/index.ts`                                                               |
| `src/domain/`     | Currently only a thin re-export from `@/db`                                 | either become real domain entry points or stay unused                   | `src/domain/index.ts`                                                                               |
| `src/archive/`    | Preserved non-launch pages/API/integrations                                 | historical reference only                                               | `src/archive/non_launch_api`, `src/archive/non_launch_pages`                                        |
| `tests/lib/`      | Focused helper/domain tests                                                 | fast feedback for domain helpers                                        | proof packs, uploads, visibility, assignments, matching review, verification                        |
| `tests/api/`      | Route contract tests with heavy mocks                                       | route boundary behavior                                                 | assignment routes, reveal route, export routes, org match review                                    |
| `e2e/`            | Playwright flows and visual checks                                          | end-to-end smoke and regression coverage                                | strict corridors, landing, auth, org/profile                                                        |

Important shared helpers/services:

- proof objects: `src/lib/proofs/canonical-pack.ts`, `src/lib/proofs/pack-anchor.ts`
- privacy and visibility: `src/lib/privacy/effective-visibility.ts`, `src/lib/privacy/visibility.ts`, `src/lib/portfolio/visibility.ts`
- public portfolio projection: `src/lib/portfolio/public-projection.ts`, `src/lib/portfolio/export-data.ts`
- assignment policy: `src/lib/assignments/publish-validation.ts`, `src/lib/assignments/policy.ts`, `src/lib/assignments/activation.ts`
- matching/review: `src/lib/matching/review-contract.ts`, `src/lib/matching/match-score-contract.ts`, `src/lib/matching/explainer.ts`
- reveal/conversation workflow: `src/app/api/conversations/[conversationId]/reveal/route.ts`, `src/lib/workflow/reveal-timeout.ts`, `src/lib/email/privacy.ts`
- verification: `src/lib/verification/policy.ts`, `src/lib/verification/gates.ts`, `src/lib/verification/request-feed.ts`
- uploads: `src/lib/uploads/privacy.ts`, `src/lib/uploads/lifecycle.ts`, `src/lib/uploads/export.ts`
- export/delete: `src/app/api/user/export/route.ts`, `src/app/api/user/account/route.ts`, `src/lib/lifecycle/*`, `src/lib/privacy/export-download.ts`

## 3. Boundary analysis

| Area                     | Current structure                                                                                                                                                | Main issue                                                                                                                                   | Risk level | Recommended action                                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| Proof Packs              | Core aggregate logic in `src/lib/proofs/canonical-pack.ts`; anchor rules in `pack-anchor.ts`; consumers in portfolio, readiness, matching, actions, export route | `canonical-pack.ts` is 1,800+ lines and mixes loading, projection, verification references, upload safety, portability hashes, and summaries | Medium     | Keep behavior stable. Extract tiny named helpers only when reuse is obvious. Do not split the aggregate loader yet. |
| Proof items / artifacts  | Stored through Drizzle schema, shaped by `canonical-pack.ts`, upload lifecycle, and expertise proof routes                                                       | `artifact`, `proof item`, `evidence`, and `submission artifact` are not consistently separated by naming                                     | Medium     | Add shared glossary and helper names around public-safe proof artifacts before any broad rename.                    |
| Private context          | Profile/action forms and `src/lib/profile/*`; Proof Pack anchor helpers know context anchor types                                                                | Boundary is understandable but spread across onboarding, profile forms, readiness, and proof packs                                           | Low        | Keep the anchor helper central. Avoid moving UI forms.                                                              |
| Verification             | `src/lib/verification/*` is a real module family with focused tests                                                                                              | `policy.ts` and `request-feed.ts` are large and have several projection responsibilities                                                     | Medium     | Leave behavior unchanged. Later, split policy summary shape from record collection.                                 |
| Organization assignments | `src/lib/assignments/*`, assignment API routes, `src/components/assignments`, and `src/components/matching/AssignmentBuilder*`                                   | Assignment creation and matching assignment builder concepts overlap in naming and UI locations                                              | Medium     | Prefer `src/lib/assignments` for publish/readiness policy. Do not merge UI builders now.                            |
| Matching / review        | `src/lib/matching/*`, `/api/match`, `/api/matches`, `/api/core/matching`, org review route, shortlist component                                                  | Namespace drift makes the canonical path hard to identify                                                                                    | High       | Document canonical namespaces first. Do not move routes in this pass.                                               |
| Privacy / reveal         | Authz helpers, matching review projection, conversation reveal route, email privacy, portfolio visibility, upload privacy                                        | Privacy rules are correctly guarded but distributed by surface                                                                               | High       | Add or reuse small helpers for repeated invariants. Avoid changing reveal route behavior without dedicated tests.   |
| Public portfolio         | `src/lib/portfolio/*`, public pages, export routes, tests                                                                                                        | Public projection is large and owns proof, visibility, metadata, JSON-LD, and org snapshots                                                  | Medium     | Keep current module. Later extract proof-overview building behind a tested helper.                                  |
| Upload privacy           | `src/lib/uploads/privacy.ts` plus lifecycle and route tests                                                                                                      | This is one of the clearer boundaries; helpers are small and tested                                                                          | Low        | Preserve. Small constant/helper exports are safe when they remove duplicated string logic.                          |
| Export / delete          | Route handlers plus lifecycle helpers and upload/export helpers                                                                                                  | `src/app/api/user/export/route.ts` is route, persistence, export schema mapping, and proof filtering together                                | High       | Only extract local predicates now. Later create a data-export service.                                              |
| Admin / ops              | `src/components/admin`, admin API routes, internal-ops libs                                                                                                      | Some launch/ops behavior is route-owned, but the internal-ops queue has good tests                                                           | Medium     | Avoid broad moves. Keep launch/ops changes isolated.                                                                |
| Test fixtures            | Many tests create local mocks inline; privacy tests have dedicated factories                                                                                     | Route tests know a lot about implementation details                                                                                          | Medium     | Add focused fixture helpers only around repeated valid domain objects. Do not rewrite route tests wholesale.        |

## 4. Deep module opportunities

### Proof Pack exportability

Current difficulty: exportability is a domain rule made from two checks: the pack must not be quarantined and it must satisfy the anchor contract. This appears inside the user export route, which makes the route know too much about the proof pack safety contract.

Better boundary: keep `src/lib/proofs/pack-anchor.ts` as the small policy module and expose an `isExportableProofPack` predicate.

What stays unchanged: database rows, export shape, anchor validation rules, quarantine reasons.

Risk: low, if implemented as a wrapper around existing predicates and covered by the existing proof anchor tests.

Safe now: yes.

### Public-safe proof overview

Current difficulty: public portfolio and portfolio export each loop over canonical aggregates and combine `verification_bundle`, anchored-context, and public-safe checks.

Better boundary: a small proof projection helper could define `isPublicSafeVerificationBundleAggregate` and `isAnchoredVerificationBundleAggregate`.

What stays unchanged: projection output and public portfolio rules.

Risk: medium, because public visibility behavior is sensitive.

Safe now: document only, unless a very small helper is introduced with focused tests.

### Matching review projection

Current difficulty: `src/lib/matching/review-contract.ts` is a strong central module, but it is very large and includes reason copy, reveal scope, fairness thresholds, proof card shaping, lifecycle events, persistence helpers, and email.

Better boundary: keep public review projection helpers in the current module, but later split persistence/email orchestration into a service module and keep pure projection helpers separately tested.

What stays unchanged: reveal scope semantics and org role authorization.

Risk: high.

Safe now: no.

### Reveal route workflow

Current difficulty: `src/app/api/conversations/[conversationId]/reveal/route.ts` is a 400+ line route that performs auth, state transition, timeout reset, lifecycle event emission, email, and match identity unlock.

Better boundary: route calls a reveal workflow service. Pure timeout and scope decisions stay separately testable.

What stays unchanged: two-party reveal approval, pending behavior, timeout reset, full identity unlock after approval.

Risk: high because behavior is privacy-sensitive and user-visible.

Safe now: no.

### Upload privacy

Current difficulty: this area is already relatively clear. The safety reason string and parse/hold helpers form a useful internal interface.

Better boundary: preserve `src/lib/uploads/privacy.ts` as the public internal module for filename, display-name, metadata, and hold logic.

What stays unchanged: upload lifecycle and public/review display labels.

Risk: low.

Safe now: only small naming or constant improvements.

### Test fixtures

Current difficulty: tests under `tests/api` often create local rows and mocks inline. This makes the route boundary easy to test in isolation, but valid domain object setup is duplicated.

Better boundary: add fixture builders for canonical proof packs, assignments, reveal conversations, and upload files only as duplication appears in new work.

What stays unchanged: route-level mock style.

Risk: medium if done as a broad rewrite.

Safe now: no broad pass.

## 5. Shared language problems

| Term cluster                              | Confusion observed                                                                                   | Recommendation                                                                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| proof / artifact / evidence / Proof Pack  | `proofArtifacts`, `proofPackItems`, `submissionArtifacts`, `evidence`, and UI proof language coexist | Keep `Proof Pack` as the aggregate, `proof item` as the pack child, `artifact` as stored evidence. Document this before renames. |
| verification / attestation                | Verification modules include human attestations, status policy, gates, and request feeds             | Keep `verification` as the umbrella; use `attestation` only for human-observed evidence.                                         |
| assignment / job / opportunity            | Product docs say assignment, some matching/UI language still resembles job/opportunity               | Prefer `assignment` in code touched going forward. Avoid broad rename.                                                           |
| reveal / unlock                           | Route tests and matching helpers use both reveal and `unlockFullIdentityForMatch`                    | Keep `reveal` for workflow consent and `unlock` only for the internal identity-scope mutation. Add comments where both meet.     |
| candidate review / match review           | Org review route, match routes, shortlist components, and review contract overlap                    | Use `review` for org action state and `match` for generated relationship.                                                        |
| profile / portfolio                       | Profile is private workspace/account data; portfolio is public publication surface                   | Keep this distinction in helper names. Avoid using portfolio helpers for private profile projection.                             |
| engagement verification / decision / hire | Engagement verification lives after decision but can be read near decision/interview modules         | Keep it as a post-decision proof checkpoint, not as part of interview scheduling.                                                |

## 6. Testability analysis

Easy to test:

- pure upload privacy helpers in `tests/lib/uploads-privacy.test.ts`
- proof pack anchor rules in `tests/lib/proof-pack-anchor.test.ts`
- assignment publish validation in `tests/lib/assignment-publish-validation.test.ts`
- effective visibility in `tests/lib/effective-visibility.test.ts`
- matching review projection in `tests/lib/matching-review-contract.test.ts`
- verification policy and gates in `tests/lib/verification-policy.test.ts` and `tests/lib/verification-gates.test.ts`

Hard to test:

- route handlers that combine auth, DB, email, lifecycle events, and response shaping
- public portfolio projection because it queries several tables and builds SEO/export/proof summaries together
- `canonical-pack.ts` because the aggregate shape is broad and touches proof items, artifacts, uploads, verification records, and hashes
- reveal workflow because route-level tests must mock many dependencies to protect privacy behavior

Duplicated fixtures:

- candidate/match/reveal records in route tests
- canonical proof pack rows in proof, portfolio, readiness, and export tests
- identity/verification records across verification policy and public portfolio tests
- upload file rows across upload route, lifecycle, export, and proof projection tests

Brittle tests:

- several API tests necessarily mock implementation modules rather than only public contracts
- route inventory tests are useful guardrails but can become brittle if route moves are done without a migration plan

Missing focused boundary tests:

- exportable Proof Pack predicate
- public-safe Proof Pack aggregate filtering
- conversation reveal workflow service, if extracted later
- data-export service contract, if extracted later

## 7. Recommended improvement plan

### A. Safe to do now

- Add `isExportableProofPack` to the existing proof anchor policy module.
- Use that predicate in the user export route instead of repeating quarantine plus anchor validation inside the route.
- Extend proof anchor tests to cover the exportability predicate.
- Create this audit artifact so future structural work has a map and a shared language baseline.

### B. Worth doing next

- Add a proof glossary near `src/lib/proofs` or in `project/Architecture.md`.
- Extract public-safe proof aggregate filtering only after adding focused tests.
- Create small fixture builders for canonical proof packs, assignments, reveal conversations, and upload files.
- Split `src/app/api/user/export/route.ts` by moving export assembly into `src/lib/privacy` or `src/lib/data-export`.
- Split pure projection from persistence/orchestration inside matching review.

### C. Do not touch yet

- Broad route namespace consolidation for matching/review.
- Reveal workflow refactor without a dedicated privacy test plan.
- Public portfolio projection restructuring.
- Database schema changes.
- Landing-page files.
- Archived non-launch code.
