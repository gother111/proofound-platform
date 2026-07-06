# Proofound MVP

> Doc Class: `active`
> Last Verified: `2026-05-30`

Proofound is a proof-first, privacy-first assignment review corridor centered on Proof Packs, with one individual side and one organization side.

## MVP Scope

Proofound helps individuals turn real work into structured Proof Packs and selected public portfolios, and helps organizations review proof-backed assignment submissions through blind-by-default, explainable, privacy-safe workflows.

Proofound is not a broad ATS, AI recruiter, public people directory, social network, generic marketplace, HRIS, payroll system, or dashboard-heavy organization platform. Optional AI assistance is button-click support for proof clarity, assignment clarity, verification wording, and privacy preflight; it must not score, rank, shortlist, or make hiring decisions.

## Source Of Truth

Use this authority stack for product, technical, launch, and GTM decisions:

1. [Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md](Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md)
2. [PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md](PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md)
3. [PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md](PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md)
4. [LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md](LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md)
5. [Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md](Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md)
6. Fresh repo-grounded audits and evidence

`README.md` is only the repo front door. It does not override the locked MVP stack. Older broad specs, legacy PRDs, audit reports, and generated evidence are reference-only unless the active authority stack points to them.

For a directory-by-directory map and documentation status table, start with [docs/REPO_GUIDE.md](docs/REPO_GUIDE.md).

## Prerequisites

- Node.js `24.15.0` from [.nvmrc](.nvmrc)
- npm `11.12.1` from `package.json`
- `npm ci` for clean installs
- Environment values copied from [.env.example](.env.example) into `.env.local`
- Supabase, Resend, and Vercel access only when the task requires connected services

The repo uses `engine-strict=true`; unsupported Node versions should fail closed.

## Quick Start

```bash
nvm install
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Keep secrets out of tracked files. Use [.env.example](.env.example) and [docs/ENV_VARIABLES.md](docs/ENV_VARIABLES.md) for names and intent only.

## Common Commands

| Task                 | Command                           |
| -------------------- | --------------------------------- |
| Start local app      | `npm run dev`                     |
| Build                | `npm run build`                   |
| Lint                 | `npm run lint`                    |
| Typecheck            | `npm run typecheck`               |
| Unit/API/UI tests    | `npm run test`                    |
| E2E tests            | `npm run test:e2e`                |
| Landing E2E          | `npm run test:e2e:landing`        |
| Landing visual E2E   | `npm run test:e2e:landing:visual` |
| Privacy/RLS core     | `npm run test:privacy`            |
| Privacy/RLS extended | `npm run test:privacy:extended`   |
| Docs freshness       | `npm run docs:freshness`          |
| Launch smoke         | `npm run test:launch:smoke`       |
| Launch monitors      | `npm run monitor:launch`          |
| Launch status        | `npm run launch:status`           |
| Go/no-go gate        | `npm run go:no-go`                |
| Python helper tests  | `npm run test:python`             |

For the full verification ladder, use [agent/checklists/verification.md](agent/checklists/verification.md). For local setup details, use [agent/runbooks/setup.md](agent/runbooks/setup.md).

## Repo Structure

| Path                 | Purpose                                                                                                                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/`           | Next.js App Router pages, route groups, protected app shells, public/legal pages, API routes, cron routes, and monitoring routes                                                                                                                                    |
| `src/components/`    | UI components for landing, auth, onboarding, individual, organization, matching, messaging, privacy, proof, verification, and workflow surfaces                                                                                                                     |
| `src/lib/`           | Domain logic and infrastructure helpers: auth, authorization, privacy, visibility, proof packs, portfolio projection, matching/review, assignments, interviews, decisions, verification, launch policy, AI helpers, monitoring, email, uploads, and Supabase access |
| `src/actions/`       | Server Actions for user-facing flows                                                                                                                                                                                                                                |
| `src/db/`            | Drizzle schema, seed code, canonical SQL migrations, policies, and triggers                                                                                                                                                                                         |
| `supabase/`          | Legacy Supabase migration baseline, storage setup, and migration README                                                                                                                                                                                             |
| `tests/`             | Vitest unit, API, UI, script, DB, privacy, and archived non-MVP regression suites                                                                                                                                                                                   |
| `e2e/`               | Playwright E2E, strict, mobile, visual, and archived browser suites                                                                                                                                                                                                 |
| `scripts/`           | Setup, verification, smoke, launch, migration, docs, seed, monitoring, taxonomy, and utility scripts                                                                                                                                                                |
| `docs/`              | Active setup/runbook/reference docs, launch docs, internal ops docs, AI addenda, backlog docs, and archives                                                                                                                                                         |
| `project/`           | Governance, implementation contract, architecture snapshot, plans, and change-entry guidance                                                                                                                                                                        |
| `agent/`             | Agent setup runbooks, verification/preflight checklists, and sharded scratchpad guidance                                                                                                                                                                            |
| `.artifacts/`        | Generated or point-in-time evidence. Treat as verification context, not source authority                                                                                                                                                                            |
| `.github/workflows/` | CI, strict quality, release, accessibility, and prebuilt deployment workflows                                                                                                                                                                                       |

## Documentation Map

- Active product authority: the six-file source-of-truth stack listed above.
- Practical front doors: this README, [docs/REPO_GUIDE.md](docs/REPO_GUIDE.md), [agent/runbooks/setup.md](agent/runbooks/setup.md), and [agent/checklists/verification.md](agent/checklists/verification.md).
- Current repo truth snapshots: [docs/CURRENT_TRUTH.md](docs/CURRENT_TRUTH.md) and [.artifacts/CURRENT_CODEBASE_TRUTH.md](.artifacts/CURRENT_CODEBASE_TRUTH.md). Treat counts and readiness claims in snapshots as dated evidence that must be refreshed before launch decisions.
- Documentation registry: [docs/DOCS_REGISTRY.md](docs/DOCS_REGISTRY.md).
- Shared language: [docs/PROOFOUND_UBIQUITOUS_LANGUAGE.md](docs/PROOFOUND_UBIQUITOUS_LANGUAGE.md).
- AI addendum: [docs/ai/Proofound_AI_Assistive_Layer_Source_Of_Truth_Addendum_2026-05-03.md](docs/ai/Proofound_AI_Assistive_Layer_Source_Of_Truth_Addendum_2026-05-03.md).
- Launch and ops: [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md), [docs/mvp-launch-master-checklist.md](docs/mvp-launch-master-checklist.md), [docs/release-checklist.md](docs/release-checklist.md), and [docs/internal-ops/index.md](docs/internal-ops/index.md).
- Historical or stale material: [docs/archive/](docs/archive/), `src/archive/`, `tests/archive/`, `e2e/archive/`, and older root reports. Do not use them to broaden MVP scope.

## Launch Status Caveat

Launch-candidate scaffold: this repo contains launch and readiness evidence, but a README cannot certify production readiness. Final launch readiness still depends on the target-specific gates: smoke, launch status, perf budgets, restore evidence, migration audit, and operator signoff for the intended environment.

Active launch env requirements use the target-scoped secrets documented in [docs/ENV_VARIABLES.md](docs/ENV_VARIABLES.md), including `INTERNAL_API_SECRET=your-internal-launch-ops-token` for protected launch-ops checks such as `npm run launch:status`.

Archived compatibility/helper env, not default launch requirements: Archived Python document-intelligence helper variables are documented in `docs/ENV_VARIABLES.md`; they are not default MVP launch requirements. `npm run test:python` remains package-level regression coverage for `tests/python/README.md`, not default MVP launch evidence.

## Contributing Safely

- Read [AGENTS.md](AGENTS.md) and the closest relevant docs before changing behavior.
- Keep changes scoped and update docs when behavior, setup, verification, routes, or launch evidence changes.
- Do not modify product behavior, database behavior, auth, permissions, billing, deployment settings, production data, external services, Linear issues, or GitHub settings without explicit task scope.
- Do not revive archived/post-MVP routes, broad public directory behavior, AI scoring, ATS replacement language, vanity metrics, or marketplace framing.
- Do not append routine work logs to `agent/scratchpad.md` or `project/Documentation.md`; use `npm run log:session` or `npm run log:change` when durable sharded notes are needed.

## Known Caveats

- Some repo truth documents are dated snapshots. For example, current filesystem route counts should be regenerated from `src/app` before quoting them.
- `docs:freshness` checks registry coverage and active-doc links; when adding docs, register them in [docs/DOCS_REGISTRY.md](docs/DOCS_REGISTRY.md).
- Database mutation commands, production launch probes, Vercel deploy commands, and connected-provider E2E checks may require credentials or external access. Do not run them unless the target and risk are explicit.
