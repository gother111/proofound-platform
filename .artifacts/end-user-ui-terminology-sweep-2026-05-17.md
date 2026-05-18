# End-User UI Terminology Sweep

Date: 2026-05-17

Scope: user-visible UI copy in Proofound app pages, shared components, onboarding, portfolio/settings surfaces, CV import flows, organization export surfaces, and user-facing email templates. This sweep intentionally avoided schema, API contract, auth, permission, billing, and backend behavior changes.

## Source Of Truth Read

- `AGENTS.md`
- `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
- `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`
- `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
- `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
- `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md`
- `DESIGN.md`
- `docs/PROOFOUND_UBIQUITOUS_LANGUAGE.md`
- `agent/checklists/verification.md`

## Replacement Glossary

| Internal or technical copy                   | User-facing replacement                                                       |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| MVP                                          | launch path, hiring corridor, Proofound, or removed sentence-specific wording |
| admin review / admin queue                   | manual review / verification queue                                            |
| Candidate ID / account ID                    | profile reference, or removed from user-facing email                          |
| API returned / backend error                 | action-specific retry language                                                |
| Python worker / extraction service / queue   | reading your CV / CV analysis                                                 |
| deterministic fallback / provider assistance | guided suggestions are unavailable / backup reading path                      |
| AI model, matcher, cost, recovery step       | removed from end-user diagnostics                                             |
| privacy preflight                            | privacy check                                                                 |
| HTML / print to PDF                          | printable format / download is ready                                          |
| metadata                                     | profile details                                                               |

## Files Checked

Primary checked surfaces:

- `src/app/**/*.tsx`
- `src/components/**/*.tsx`
- `emails/**/*.tsx`
- focused UI tests under `tests/ui/`

Reference-only or intentionally ignored surfaces:

- docs and source-of-truth Markdown
- tests except where assertions needed copy updates
- comments and code identifiers that are not rendered to users
- admin/operator-only queue labels where the surface is explicitly internal operations
- legitimate skill examples such as Python, SQL, or database design in job-description sample text

## Terms Found And Changed

- Replaced visible MVP copy in onboarding, profile, portfolio, settings, metrics, organization profile, and landing section copy.
- Removed raw ID wording from user-facing deletion and LinkedIn verification emails.
- Rewrote CV import messages that exposed Python worker, queue, extraction, fallback, matcher, model, and cost details.
- Rewrote privacy assistant copy from deterministic/preflight terminology to privacy concerns and privacy check language.
- Rewrote organization evidence-pack export copy that exposed HTML and print-to-PDF instructions.
- Rewrote generic forbidden-page title to plain access language.
- Updated focused UI assertions to match the new user-facing copy.

## Ambiguous Items Left Unchanged

- Code identifiers such as `slug`, `org_id`, `candidate_id`, `endpoint`, and Supabase imports remain unchanged because they are not rendered to users.
- Admin-only operations queue copy remains where it is clearly an internal operator surface.
- Job-skill examples containing Python, SQL, backend, or database design remain because those are legitimate candidate/assignment skill terms, not implementation leaks.
- Existing unrelated worktree changes in `.artifacts/stale-build-state-cleanup-summary.md` and `tsconfig.json` were not touched.

## Verification

Passed:

- `npm run test -- tests/ui/public-portfolio-ready-step.test.tsx tests/ui/cv-import-wizard.test.tsx tests/ui/assignment-clarity-assistant.test.tsx tests/ui/portfolio-visibility-card-ai.test.tsx tests/ui/start-from-cv-dialog.test.tsx`
- `npm run lint`
- `npm run typecheck`
- `npm run docs:freshness`
- focused rendered-copy grep:
  `rg -n -i "Search engines (stay|are) off for the MVP|This MVP profile|Individual MVP|outside the MVP|MVP corridor|Candidate ID:|account ID|admin queue|AI model:|Cost:|Recovery step:|Matcher:|Access Forbidden|Open the HTML file|Print to PDF|Provider assistance|deterministic flag|deterministic draft|Python extraction|Python worker|Proof API returned|Verification API returned" src/app src/components emails --glob '*.tsx' --glob '!**/*.test.*' --glob '!**/*.spec.*'`

Notes:

- Vitest prints a Vite websocket `listen EPERM 0.0.0.0:24678` warning in this sandbox, but the focused test command exits 0.
- `docs:freshness` exits 0 in warning mode and reports existing orphan-file warnings unrelated to this terminology sweep.
