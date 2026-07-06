# Proofound Repo Guide

> Doc Class: `active`
> Last Verified: `2026-05-30`

Purpose: orient a new engineer, founder, or product person to the current Proofound repo without widening the locked MVP scope.

This guide is a practical map. It does not override the active MVP authority stack in [../AGENTS.md](../AGENTS.md) or [../Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md](../Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md).

## First Places To Read

| Need                     | Start here                                                                                                                                   | Status                            |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Product scope            | [../Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md](../Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md)                               | Active authority                  |
| Product behavior         | [../PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md](../PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md) | Active authority                  |
| Technical contract       | [../PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md](../PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md)                   | Active authority                  |
| Launch operations        | [../LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md](../LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md)                                           | Active authority for ops guidance |
| GTM and launch messaging | [../Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md](../Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md)                       | Active authority for GTM          |
| Local setup              | [../agent/runbooks/setup.md](../agent/runbooks/setup.md)                                                                                     | Practical onboarding              |
| Verification             | [../agent/checklists/verification.md](../agent/checklists/verification.md)                                                                   | Practical verification            |
| Documentation registry   | [DOCS_REGISTRY.md](DOCS_REGISTRY.md)                                                                                                         | Active docs inventory             |
| Shared domain language   | [PROOFOUND_UBIQUITOUS_LANGUAGE.md](PROOFOUND_UBIQUITOUS_LANGUAGE.md)                                                                         | Active implementation guidance    |

## What The Repo Contains

| Area                 | What lives there                                                                                                                                | Notes                                                                                                                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/`           | App Router pages, public pages, route groups, protected app shells, API routes, cron routes, monitoring routes, auth callbacks                  | Public routes, individual shell routes, organization shell routes, admin/internal ops routes, and API handlers all start here                                                                               |
| `src/components/`    | React components for landing, auth, onboarding, app layout, proof, privacy, matching, org, messaging, interviews, verification, and workflow UI | Shared UI primitives live under `src/components/ui` and `src/components/ui/v2`                                                                                                                              |
| `src/lib/`           | Domain and infrastructure logic                                                                                                                 | Key areas include `auth`, `authz`, `privacy`, `portfolio`, `proofs`, `matching`, `assignments`, `interviews`, `decisions`, `verification`, `uploads`, `launch`, `ai`, `monitoring`, `email`, and `supabase` |
| `src/actions/`       | Server Actions for user-facing flows                                                                                                            | Read alongside the route or component that calls the action                                                                                                                                                 |
| `src/db/`            | Drizzle schema, seed, canonical SQL migrations, policies, triggers                                                                              | `src/db/migrations` is the canonical migration path for current app work                                                                                                                                    |
| `supabase/`          | Legacy Supabase migrations, storage setup, and baseline data                                                                                    | Useful for migration history and baseline checks, not a replacement for `src/db/migrations`                                                                                                                 |
| `tests/`             | Vitest suites for API, UI, domain logic, privacy, routes, scripts, DB, and archived non-MVP surfaces                                            | `tests/archive` preserves removed/non-MVP regressions outside the default launch signal                                                                                                                     |
| `e2e/`               | Playwright browser suites                                                                                                                       | Includes strict flows, visual tests, mobile checks, landing tests, helper code, and archived browser suites                                                                                                 |
| `scripts/`           | Setup, launch, docs, migration, seed, smoke, monitor, taxonomy, and utility scripts                                                             | Check `package.json` before documenting a command                                                                                                                                                           |
| `docs/`              | Active runbooks/reference docs, AI addenda, internal ops, launch docs, backlog docs, and archives                                               | Active docs should have freshness metadata when they are authority or front-door docs                                                                                                                       |
| `project/`           | Governance mirror docs, implementation contract, architecture snapshot, plans, and change-entry guidance                                        | `project/Documentation.md` is a legacy history/index surface, not a routine per-task log                                                                                                                    |
| `agent/`             | Agent setup runbooks, verification/preflight checklists, and scratchpad guidance                                                                | `agent/scratchpad.md` is a legacy history/index surface                                                                                                                                                     |
| `.artifacts/`        | Generated evidence, screenshots, audits, launch reports, and dated snapshots                                                                    | Evidence context only; do not treat as authority without refreshing                                                                                                                                         |
| `.github/workflows/` | CI, accessibility, strict quality, release, and prebuilt deployment workflows                                                                   | Deployment workflows can mutate external systems; do not run or change casually                                                                                                                             |

## Current Structure Snapshot

Generated on 2026-05-30 from filesystem inventory commands:

| Surface                                                    | Current count | How generated                              |
| ---------------------------------------------------------- | ------------: | ------------------------------------------ |
| API route handlers under `src/app/api/**/route.ts`         |           124 | `find src/app/api -name route.ts`          |
| Total route handlers under `src/app/**/route.ts`           |           133 | `find src/app -name route.ts`              |
| Page handlers under `src/app/**/page.tsx`                  |            51 | `find src/app -name page.tsx`              |
| Vitest-style test files under `tests`                      |           430 | `find tests` for `*.test.*` and `*.spec.*` |
| Playwright-style files under `e2e`                         |            25 | `find e2e` for `*.spec.ts` and `*.test.ts` |
| Canonical SQL migrations under `src/db/migrations`         |           127 | `find src/db/migrations -name '*.sql'`     |
| Legacy Supabase SQL migrations under `supabase/migrations` |            21 | `find supabase/migrations -name '*.sql'`   |

`docs/CURRENT_TRUTH.md` is still useful as dated evidence, but its route-count claims are a May 2026 snapshot and should be refreshed before being quoted in launch or readiness decisions.

## Where Common Work Lives

| Task                                           | Main files/directories                                                                                                                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Public landing and legal pages                 | `src/app/page.tsx`, `src/components/ProofoundLanding.tsx`, `src/components/landing/`, `src/app/privacy/`, `src/app/terms/`, `src/app/(marketing)/cookies/`                     |
| Individual app shell                           | `src/app/app/i/`, `src/components/profile/`, `src/components/proofs/`, `src/components/privacy/`, `src/components/verification/`                                               |
| Organization app shell                         | `src/app/app/o/[slug]/`, `src/components/organization/`, `src/components/org/`, `src/components/assignments/`, `src/components/matching/`, `src/components/workflow/`          |
| Public portfolios                              | `src/app/portfolio/[handle]/`, `src/app/portfolio/org/[slug]/`, `src/lib/portfolio/`, `src/components/public-profile/`                                                         |
| Assignment and review corridor                 | `src/app/api/assignments/`, `src/app/api/org/`, `src/lib/assignments/`, `src/lib/matching/`, `src/lib/hiring-corridor/`                                                        |
| Privacy, visibility, reveal, export            | `src/lib/privacy/`, `src/lib/portfolio/`, `src/lib/workflow/`, `src/app/api/user/export/`, `src/app/api/conversations/[conversationId]/reveal/`                                |
| Verification and attestations                  | `src/lib/verification/`, `src/components/verification/`, `src/app/api/verification/`, `src/app/verify/`, `src/app/api/verify/`                                                 |
| Interviews, decisions, engagement verification | `src/lib/interviews/`, `src/lib/decisions/`, `src/lib/engagement-verifications/`, `src/app/api/interviews/`, `src/app/api/decisions/`, `src/app/api/engagement-verifications/` |
| AI assistive layer                             | `docs/ai/`, `src/lib/ai/`, `src/app/api/ai/`, AI tests under `tests/lib` and `tests/api`                                                                                       |
| Launch policy and surface inventory            | `src/lib/launch/surface-policy.ts`, `tests/api/launch-surface-inventory.test.ts`, `tests/api/launch-page-inventory.test.ts`                                                    |
| Cron, smoke, monitoring, go/no-go              | `vercel.json`, `src/app/api/cron/`, `src/app/api/monitoring/`, `scripts/launch-smoke-runner.ts`, `scripts/run-launch-synthetic-monitors.ts`, `scripts/go-no-go-check.ts`       |
| Environment docs                               | `.env.example`, `docs/ENV_VARIABLES.md`, `agent/runbooks/setup.md`                                                                                                             |

## Which Tests Verify Which Corridors

| Corridor or concern            | Primary commands                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| General repo signal            | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`                               |
| Documentation freshness        | `npm run docs:freshness`                                                                           |
| Route and archive policy       | `npm run test:launch:routes`                                                                       |
| Upload/privacy lifecycle       | `npm run test:launch:upload`                                                                       |
| Privacy and RLS                | `npm run test:privacy`, `npm run test:privacy:extended`                                            |
| Organization review corridor   | `npm run test:launch:org-corridor`                                                                 |
| Public portfolio and export    | `npm run test:launch:portfolio`                                                                    |
| Workflow, reveal, decisions    | `npm run test:launch:workflow`                                                                     |
| AI assistive layer             | `npm run test:launch:ai`                                                                           |
| Landing page                   | `npm run test:e2e:landing`, `npm run test:e2e:landing:visual`                                      |
| Strict browser launch flows    | `npm run test:e2e:strict:all`                                                                      |
| Launch smoke and target status | `npm run test:launch:smoke`, `npm run monitor:launch`, `npm run launch:status`, `npm run go:no-go` |

Some checks need connected Supabase, browser, provider, production-candidate, or secret-bearing environments. Do not run mutation or production-like checks unless the target is explicit.

## Documentation Status Table

| Path                                                                          | Purpose                                  | Status                            | Audience                           | Last verified | Notes                                                                     |
| ----------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------- | ---------------------------------- | ------------- | ------------------------------------------------------------------------- |
| `AGENTS.md`                                                                   | Repo operating rules and authority order | Active authority/governance       | Agents and engineers               | 2026-05-22    | Read first                                                                |
| `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`                          | Locked MVP scope                         | Active authority                  | Founder, product, engineering, GTM | 2026-05-21    | Highest product authority                                                 |
| `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`           | Launch-bound product behavior            | Active authority                  | Product, design, engineering, QA   | 2026-05-21    | Subordinate to locked MVP                                                 |
| `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`                    | Launch technical contract                | Active authority                  | Engineering, QA, ops               | 2026-05-21    | Subordinate to locked MVP and PRD                                         |
| `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`                                | Launch operations                        | Active authority for ops guidance | Engineering, ops, founder          | 2026-05-21    | Does not broaden product scope                                            |
| `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md`                      | GTM framing                              | Active authority for GTM          | Founder, GTM                       | 2026-05-21    | Narrow design-partner pilot framing                                       |
| `README.md`                                                                   | Practical front door                     | Practical onboarding              | New contributors                   | 2026-05-30    | Does not override authority stack                                         |
| `docs/REPO_GUIDE.md`                                                          | Repo and docs orientation                | Practical onboarding              | New contributors                   | 2026-05-30    | This guide                                                                |
| `agent/runbooks/setup.md`                                                     | Local setup and CI parity                | Practical onboarding              | Engineers and agents               | 2026-05-19    | Check before setup changes                                                |
| `agent/checklists/verification.md`                                            | Verification ladder                      | Practical verification            | Engineers and agents               | 2026-05-21    | Required source for checks                                                |
| `docs/DOCS_REGISTRY.md`                                                       | Docs inventory and freshness registry    | Active governance                 | Engineers and agents               | 2026-05-30    | Update when adding docs                                                   |
| `docs/CURRENT_TRUTH.md`                                                       | Dated repo truth snapshot                | Launch/ops evidence               | Product, engineering, ops          | 2026-05-20    | Useful but route counts are stale against 2026-05-30 filesystem inventory |
| `.artifacts/CURRENT_CODEBASE_TRUTH.md`                                        | Dated codebase snapshot                  | Implementation reference/evidence | Engineering                        | 2026-05-06    | Counts are stale; use as context only                                     |
| `docs/PROOFOUND_UBIQUITOUS_LANGUAGE.md`                                       | Domain vocabulary                        | Implementation reference          | Engineering, product               | 2026-05-21    | Guidance, not broad rename authority                                      |
| `docs/ai/Proofound_AI_Assistive_Layer_Source_Of_Truth_Addendum_2026-05-03.md` | AI assistive scope                       | Active addendum below locked MVP  | Product, engineering               | 2026-05-21    | AI stays optional and subordinate                                         |
| `project/Architecture.md`                                                     | Repo-grounded architecture snapshot      | Implementation reference          | Engineering                        | 2026-05-19    | Do not use to broaden MVP                                                 |
| `project/Implement.md`                                                        | Implementation operating contract        | Governance                        | Engineers and agents               | 2026-05-19    | Use for standard procedure                                                |
| `project/Documentation.md`                                                    | Legacy history/index                     | Historical/stale archive surface  | Maintainers                        | 2026-05-21    | Do not append routine logs                                                |
| `docs/archive/`                                                               | Historical docs                          | Historical/stale/archive          | Maintainers                        | Mixed         | Do not use as current authority                                           |
| `src/archive/`, `tests/archive/`, `e2e/archive/`                              | Archived non-launch code/tests           | Historical/stale/archive          | Engineering                        | Mixed         | Preserved for regression/history only                                     |

## Stale Or Conflicting Docs Found

- `docs/CURRENT_TRUTH.md` still records 140 API route handlers, but the 2026-05-30 filesystem inventory finds 124 under `src/app/api`. Treat that document as dated evidence until refreshed.
- `.artifacts/CURRENT_CODEBASE_TRUTH.md` records older route and test counts from 2026-05-06. It is useful for maintainability context, not current counts.
- Older root docs such as `PRD_for_a_web_platform_MVP.md`, `PRD_for_a_web_platform_MVP.master-latest.md`, `PRD_TECHNICAL_REQUIREMENTS.md`, `LAUNCH_RUNBOOK.md`, and `Proofound_Project_Specification_2026-03-11.md` are reference-only and must not broaden the locked MVP.
- Archive folders contain many historical implementation reports and non-MVP suites. Keep them labeled/archive-scoped instead of deleting them casually.

## Safe Contribution Rules

- Make the smallest useful change and verify it with the closest relevant command.
- Keep product language proof-first, privacy-first, and assignment-corridor scoped.
- Ask before production, deployment, database-write, auth, billing, permission, external-service, Linear, or GitHub-settings changes.
- Never expose secrets or copy real env values into docs.
- When adding a new markdown file outside archive/exempt paths, register it in [DOCS_REGISTRY.md](DOCS_REGISTRY.md) so `npm run docs:freshness` stays useful.
