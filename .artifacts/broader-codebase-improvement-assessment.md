# Broader Codebase Improvement Assessment

Date: 2026-05-05

Scope: assessment and planning only. No product changes, feature work, broad refactors, file moves, renames, schema changes, or user-facing behavior changes are recommended as part of this pass.

## 1. Executive Summary

The broader improvements worth pursuing are mostly documentation, guardrail, and small-boundary work, not architecture rewrites.

Current diagnostic checks are healthier than some older audits suggest:

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run docs:freshness` passed.
- `npm run test` passed: 329 files, 1,357 tests.
- launch surface inventory tests passed: 18 tests across API, page, and policy coverage.
- `npm run build` passed, with warnings about missing deploy env vars, stale browser data, and webpack cache serialization.

The safest overall path is:

1. Create a lightweight current-codebase truth document that consolidates current route counts, test status, source-of-truth docs, and known caveats.
2. Add a ubiquitous-language document before doing any renames or module splits.
3. Add small, behavior-preserving architecture tests around projection boundaries only where there is already a clear canonical module.
4. Defer Proof Pack, privacy/reveal, assignment-review, and export service extractions until each has focused tests and a narrow implementation brief.
5. Treat dependency/security updates as a separate approved task because a fresh npm audit could not be performed in this sandbox without sending dependency inventory to the external npm registry.

Do not touch now:

- reveal identity behavior
- public portfolio projection behavior
- matching/scoring/ranking behavior
- route namespace moves
- broad Proof Pack module splitting
- database schema
- launch surface expansion
- archived non-launch code

## 2. Current-State Evidence

Repo state:

- Branch: `master`
- Recent commit: `77e9f395 Polish landing story challenge visuals`
- Worktree was already dirty from the previous small structural pass:
  - `src/app/api/user/export/route.ts`
  - `src/lib/proofs/pack-anchor.ts`
  - `tests/lib/proof-pack-anchor.test.ts`
  - `.artifacts/codebase-structure-audit.md`
  - `project/changes/entries/2026-05-05T12-58-57Z__master__77e9f395.md`

Current structure:

- API route handlers under `src/app/api/**/route.ts`: 124
- App page routes under `src/app/**/page.tsx`: 49
- Launch surface classification from `src/lib/launch/surface-policy.ts`:
  - API: 106 active launch, 15 internal-only launch ops, 3 archived
  - Pages: 46 active launch, 3 internal-only launch ops
- Test files under `tests` and `e2e`: 346
- Default Vitest excludes privacy/RLS suites, E2E suites, archived source, and several explicitly non-MVP tests.

Large internal modules worth treating carefully:

- `src/lib/proofs/canonical-pack.ts`: 1,859 lines
- `src/lib/matching/review-contract.ts`: 1,848 lines
- `src/lib/portfolio/public-projection.ts`: 1,264 lines
- `src/lib/verification/policy.ts`: 873 lines
- `src/app/api/user/export/route.ts`: 544 lines
- `src/app/api/conversations/[conversationId]/reveal/route.ts`: 444 lines

Important caveat:

- Older audit files are useful history, but some claims are stale. For example, `audit/full-scale-audit-2026-04-16.md` says the default test suite was failing. The current run passed. Any new truth document should make this explicit.

## 3. Recommendation Matrix

| Improvement area                                | Needed?                   | Value  | Risk        | Priority | Recommended action                                                                                               | Why                                                                                                                            |
| ----------------------------------------------- | ------------------------- | ------ | ----------- | -------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1. Fresh current-codebase audit                 | Yes, but lightweight      | High   | Low         | P1       | Create `.artifacts/CURRENT_CODEBASE_TRUTH.md` or update a clearly named current-state artifact                   | Existing artifacts are useful but mixed by date and some older audits conflict with current green checks.                      |
| 2. Test signal cleanup                          | Partly                    | Medium | Medium      | P2       | Do not exclude more tests now. First reduce warning noise and keep default suite green.                          | Default tests now pass, so this is no longer a red-gate emergency. Output is noisy, though.                                    |
| 3. Ubiquitous language document                 | Yes                       | High   | Low         | P1       | Add `docs/PROOFOUND_UBIQUITOUS_LANGUAGE.md`; no code renames yet                                                 | Terminology drift is real and affects AI-assisted changes. Documentation is safer than broad rename.                           |
| 4. Proof Pack domain boundary                   | Yes, incremental only     | High   | High        | P2       | Strengthen existing `src/lib/proofs` boundary with tiny tested helpers. Avoid splitting `canonical-pack.ts` yet. | The module is large but central. Broad extraction could break portfolio, review, export, and verification.                     |
| 5. Privacy/reveal projection boundary           | Yes, carefully            | High   | High        | P1/P2    | Add tests and glossary first. Extract only pure projection helpers later.                                        | Privacy logic is scattered but high-stakes. Incorrect extraction risks identity leaks or over-redaction.                       |
| 6. Assignment Evidence Matrix clarity           | Not now as implementation | Medium | High        | P3       | Document as future internal design note only                                                                     | Existing assignment validation already pushes concrete proof expectations. A matrix could become new product logic if rushed.  |
| 7. Architecture/guardrail tests                 | Yes, selectively          | High   | Medium      | P1       | Add 2 to 4 semantic tests, not file-structure tests                                                              | Current surface-policy tests are good. More tests should protect privacy/projection rules, not freeze architecture.            |
| 8. Dependency/security stabilization            | Likely yes, separate task | High   | Medium/High | P1       | Run an approved dependency audit and upgrade pass separately                                                     | Fresh audit was blocked by network/privacy policy. Prior audit flagged prod dependency risk, but current status is unverified. |
| 9. AI-agent working rules                       | Partly already solved     | Medium | Low         | P2       | Lightly amend `AGENTS.md` only after current truth and language docs exist                                       | Existing `AGENTS.md` is strong. The missing piece is pointing agents to current truth and language docs.                       |
| 10. Fixture/factory cleanup                     | Yes, incremental          | Medium | Medium      | P2       | Add fixtures only when touching repeated setup in a domain                                                       | Route tests still have local setup duplication. Broad fixture migration risks hiding important test differences.               |
| 11. Route-surface and archived-scope discipline | Mostly solved, maintain   | High   | Medium      | P1       | Keep current surface policy and inventory tests. Avoid route moves now.                                          | This is one of the healthier guardrail areas. Counts and classification are actively tested.                                   |
| 12. Release/check command clarity               | Yes                       | High   | Low         | P1       | Consolidate command map in current truth or AGENTS docs                                                          | Commands exist, but future agents need one obvious confidence ladder and caveats about live/privacy/browser-heavy checks.      |

## 4. Risk Analysis

### Fresh Current-Codebase Truth

What could break: almost nothing if documentation-only.

Likelihood of breakage: low.

User-facing risk: none.

Test risk: low, unless the doc claims commands passed without fresh evidence.

Data/privacy risk: none.

Mitigation: include date, branch, dirty-worktree note, exact commands run, and stale-claim warnings. Do not turn it into product authority.

### Ubiquitous Language Document

What could break: nothing if it does not rename code.

Likelihood of breakage: low.

User-facing risk: none.

Test risk: none.

Data/privacy risk: none.

Mitigation: define terms as guidance for future work, not as a mandate to sweep names. Tie definitions to locked MVP docs and current code examples.

### Architecture/Guardrail Tests

What could break: harmless refactors may fail brittle tests if tests overfit file paths.

Likelihood of breakage: medium.

User-facing risk: low if tests are semantic only.

Test risk: medium. Bad architecture tests can become noise.

Data/privacy risk: positive if tests protect privacy projection; negative if tests give false confidence.

Mitigation: prefer tests like "public portfolio projection uses public-safe proof packs" and "blind review does not expose identity" over tests like "file X must import file Y."

### Privacy/Reveal Projection Boundary

What could break: public portfolio visibility, org review cards, reveal approval, emails, export shapes, upload privacy labels.

Likelihood of breakage: medium to high if implemented as refactor.

User-facing risk: high because identity visibility and hidden data are user-visible trust commitments.

Test risk: high without route and projection coverage.

Data/privacy risk: high. The worst failure is identity leakage before consent.

Mitigation: no broad implementation now. Start with tests and language. Extract only pure helpers with before/after snapshot tests.

### Proof Pack Domain Boundary

What could break: proof creation, Proof Pack public projection, matching review cards, export, readiness, verification linkage.

Likelihood of breakage: medium to high for broad extraction.

User-facing risk: medium because proof display, public portfolios, and review cards could change.

Test risk: medium because many tests mock parts of the aggregate.

Data/privacy risk: medium. Public-safe and review-safe projection rules depend on this boundary.

Mitigation: avoid splitting `canonical-pack.ts` wholesale. Add small helpers only after identifying repeated predicates or stable seams.

### Dependency/Security Stabilization

What could break: Next.js build/runtime behavior, Drizzle queries, i18n routing, Supabase auth, React rendering, test harnesses.

Likelihood of breakage: medium.

User-facing risk: medium if framework/runtime behavior changes.

Test risk: medium to high because lockfile churn can produce many unrelated failures.

Data/privacy risk: low to medium depending on ORM/auth updates.

Mitigation: separate branch/task, fresh approved audit, upgrade direct vulnerable dependencies first, run lint/typecheck/test/build plus privacy and smoke checks.

### Fixture/Factory Cleanup

What could break: tests may stop expressing important edge cases if over-generalized fixtures hide differences.

Likelihood of breakage: medium.

User-facing risk: none directly.

Test risk: medium.

Data/privacy risk: low, except privacy fixtures where invalid relationships can hide RLS regressions.

Mitigation: add domain-specific fixture builders only where duplication is repeated and obvious. Keep edge-case tests explicit.

### Route-Surface Discipline

What could break: archived compatibility behavior, middleware ordering, route inventory tests, launch-surface allowlist.

Likelihood of breakage: medium if routes are moved.

User-facing risk: medium if active routes are accidentally gated or archived routes are exposed.

Test risk: medium.

Data/privacy risk: medium if non-MVP surfaces become reachable.

Mitigation: maintain current policy and tests. Do not consolidate route namespaces without a dedicated migration plan.

## 5. Execution Strategy

### A. Safe Now

1. Create a current-codebase truth artifact.
   - Suggested file: `.artifacts/CURRENT_CODEBASE_TRUTH.md`
   - Keep it short and date-stamped.
   - Include current commands, route counts, dirty-worktree caveat, and stale-audit warnings.

2. Create ubiquitous-language documentation.
   - Suggested file: `docs/PROOFOUND_UBIQUITOUS_LANGUAGE.md`
   - Define proof, artifact, evidence, Proof Pack, proof item, verification, attestation, assignment, reveal, unlock, profile, portfolio, match, review, shortlist, decision, and engagement verification.
   - Explicitly say "no broad rename implied."

3. Add a release/check command map.
   - Best location: the current truth doc first, then `AGENTS.md` can link to it in a later pass.
   - Include safe local commands and mark live/privacy/browser-heavy checks separately.

4. Add semantic guardrail tests only where low risk.
   - Good candidates:
     - public portfolio remains public-safe projection only
     - blind review projection hides identity fields
     - archived routes stay out of compiled page inventory
   - Avoid tests that freeze folder layout.

### B. Separate Follow-Up Task

1. Dependency/security stabilization.
   - Needs explicit approval to contact npm registry or a locally supplied audit artifact.
   - Should be its own branch because it may change lockfile and runtime behavior.

2. Proof Pack helper extraction.
   - Start with repeated predicates or small read-only helpers.
   - Do not split aggregate loading/projection in one pass.

3. Privacy/reveal projection boundary.
   - Start with tests and snapshots.
   - Extract pure helpers only after tests are in place.

4. Fixture/factory cleanup.
   - Begin with one domain, probably Proof Packs or reveal conversations.
   - Keep route tests explicit where edge cases matter.

5. Test-output noise cleanup.
   - Reduce repeated dotenv tips, GoTrue warnings, React ref warnings, and expected-error logs in tests.
   - This improves signal but should not be mixed with architecture work.

### C. Needs Human Decision

1. Assignment Evidence Matrix.
   - Potentially useful as an internal language for assignment review, but it risks becoming new product logic.
   - Human decision needed on whether this is only a documentation/modeling aid or a future behavior change.

2. Route namespace consolidation.
   - Valuable long-term, especially around matching/review, but potentially disruptive.
   - Needs a human-approved migration plan and compatibility policy.

3. Dependency audit privacy tradeoff.
   - A fresh audit requires sharing dependency inventory with npm or using a pre-approved offline/security workflow.
   - Human decision needed on acceptable process.

### D. Do Not Do

- Do not rewrite `src/lib/proofs/canonical-pack.ts`.
- Do not move matching/review routes.
- Do not change reveal approval behavior.
- Do not introduce scoring, ranking, or AI recommendation behavior.
- Do not rename core terms across the codebase.
- Do not change database schema.
- Do not activate archived routes.
- Do not make a new product dashboard or public surface.

## 6. Suggested Implementation Order

### 1. Current-Codebase Truth

Purpose: give future human and AI work one fresh, compact source for current repo state.

Files likely touched:

- `.artifacts/CURRENT_CODEBASE_TRUTH.md`

Validation commands:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run docs:freshness`
- `npm run test -- tests/api/launch-surface-inventory.test.ts tests/api/launch-page-inventory.test.ts src/lib/launch/__tests__/surface-policy.test.ts`

Rollback strategy: delete the artifact.

Expected benefit: prevents stale audit claims from driving future changes.

### 2. Ubiquitous Language

Purpose: create shared language before implementation.

Files likely touched:

- `docs/PROOFOUND_UBIQUITOUS_LANGUAGE.md`

Validation commands:

- `npm run docs:freshness`
- `npm run lint` if docs lint is included by the repo script

Rollback strategy: delete or revise the document.

Expected benefit: reduces AI-generated terminology drift and avoids broad renaming.

### 3. AGENTS.md Pointer Update

Purpose: guide future agents to current truth and shared language.

Files likely touched:

- `AGENTS.md`

Validation commands:

- `npm run docs:freshness`
- `npm run lint`

Rollback strategy: revert the doc-only change.

Expected benefit: improves future agent behavior without touching application code.

### 4. Minimal Guardrail Tests

Purpose: protect high-risk boundaries semantically.

Files likely touched:

- existing tests under `tests/lib` or `tests/api`
- possibly no application files

Validation commands:

- targeted Vitest command for new tests
- `npm run test`

Rollback strategy: remove the new tests.

Expected benefit: better confidence before future extractions.

### 5. Dependency/Security Pass

Purpose: resolve confirmed production dependency risk.

Files likely touched:

- `package.json`
- `package-lock.json`

Validation commands:

- approved `npm audit --omit=dev --json`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- privacy tests if auth/ORM/database dependencies change

Rollback strategy: revert package files.

Expected benefit: reduces security exposure, but must be isolated.

### 6. Small Domain Boundary Extractions

Purpose: reduce scattered logic only after language and tests exist.

Files likely touched:

- `src/lib/proofs/*`
- `src/lib/privacy/*`
- `src/lib/portfolio/*`
- `src/lib/matching/*`
- related focused tests

Validation commands:

- targeted tests for touched domains
- `npm run typecheck`
- `npm run test`
- route tests for affected projections

Rollback strategy: revert each small extraction independently.

Expected benefit: easier future changes without broad architecture churn.

## 7. Minimal First Pass

The smallest worthwhile first pass is documentation and guardrail only:

1. Add `.artifacts/CURRENT_CODEBASE_TRUTH.md`.
2. Add `docs/PROOFOUND_UBIQUITOUS_LANGUAGE.md`.
3. Add a short pointer in `AGENTS.md` telling future agents to read those two files before architecture or domain work.
4. Do not change application code.
5. Do not rename anything.

Why this is the right first pass:

- It addresses stale audit risk.
- It creates shared language before implementation.
- It reduces AI-agent entropy.
- It does not risk user-facing behavior.
- It prepares the ground for safer future refactors.

## 8. Explicit Non-Goals

- No product changes.
- No new features.
- No broad renames.
- No broad file moves.
- No scoring, ranking, or AI recommendation logic.
- No launch surface expansion.
- No database schema changes unless separately approved.
- No route consolidation.
- No reveal behavior changes.
- No public portfolio behavior changes.
- No changes to archived non-launch code.

## 9. Final Recommendation

Proceed now with:

- fresh current-codebase truth artifact
- ubiquitous-language document
- release/check command clarity
- a small AGENTS.md pointer after those docs exist

Postpone:

- Proof Pack domain extraction
- privacy/reveal projection extraction
- fixture/factory cleanup
- test-output noise cleanup
- architecture tests beyond a few semantic guardrails

Avoid:

- broad route moves
- broad module rewrites
- core concept rename sweeps
- assignment evidence matrix implementation as product logic
- any scoring/ranking/AI recommendation behavior

Ask for human decision on:

- dependency audit/upgrade process, because fresh `npm audit` could not run here without external registry disclosure
- whether an Assignment Evidence Matrix is merely internal language or a future product/model change
- whether route namespace consolidation is worth a dedicated migration plan

Bottom line: Proofound does not need a big architecture motion right now. It needs a calmer operating layer around the existing codebase: current truth, shared language, clearer command confidence, and selective semantic guardrails before any risky refactor.
