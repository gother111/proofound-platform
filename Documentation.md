# Documentation (Index + Status)

## Status (As Of 2026-02-06)

- Branch: `codex/refactor-quick-wins`
- PR: [#117](https://github.com/gother111/proofound-platform/pull/117)
- Current state:
  - Clean worktree `npm ci` + `npm run build` passes on Node 20.
  - Vercel deployment failures since commit `400cc9e` were analyzed via Vercel deployment events and addressed with a sequence of build/type fixes.
  - Remote Supabase migrations were reconciled so `supabase db push` works with pooler-safe parameters (separate PR: [#118](https://github.com/gother111/proofound-platform/pull/118)).

## Decisions

- Standardize Drizzle raw SQL results with a helper (`getRows`) instead of relying on `.rows`. (`/Users/yuriibakurov/proofound/src/lib/db/rows.ts:3`)
- Avoid build-time crashes from missing runtime env vars by detecting Next build phase for DB initialization. (`/Users/yuriibakurov/proofound/src/db/index.ts:34`)
- Avoid build-time crashes from provider initialization (Resend) by lazy creation and use-time validation. (`/Users/yuriibakurov/proofound/src/app/api/conversations/[conversationId]/reveal/route.ts:21`)

## Vercel Error Analysis (Representative Failing Deployments)

- `400cc9e` failed with missing modules:
  - `Can't resolve '@/lib/api/observability'`
  - `Can't resolve '@/lib/db/rows'`
  - Evidence: [deployment](https://vercel.com/pavlo-samoshkos-projects/proofound-platform/3KbGmwiBA83r2pimGTH9qnXtNQ5s)
- `9599114` failed with invalid Next route handler signature:
  - `Route "src/app/api/feedback/[interviewId]/route.ts" has an invalid "GET" export`
  - Evidence: [deployment](https://vercel.com/pavlo-samoshkos-projects/proofound-platform/cmedf8Heh5yp1PXxD7RAi62bA77w)
- `c9bbb46` failed similarly:
  - `Route "src/app/api/feedback/token/[token]/route.ts" has an invalid "GET" export`
  - Evidence: [deployment](https://vercel.com/pavlo-samoshkos-projects/proofound-platform/CoWTE63jmBeZ859HPEDSx6GPieJX)

## Curated Doc Index

- `Prompt.md` product summary + repo truths + open questions
- `Plans.md` milestone plan + validation checklists
- `Architecture.md` stack/folders/flows/risks
- `Implement.md` operating contract
- `setup.md` environment setup + commands + gates
- `preflight.md` pre-PR checklist
- `verification.md` verification scripts and reproduction notes
- `metrics.md` analytics/metrics references and expectations

## TODOs

- Clarify and document migration source of truth (`supabase/migrations/` vs remote history) and recommended workflow.
- Add a canonical “Vercel-like build reproduction” script (clean worktree, Node 20, `npm ci`, `npm run build`) and include it in `verification.md`.
  - Documented: `supabase_migrations.schema_migrations` is canonical; `supabase db push` must use `statement_cache_capacity=0&prefer_simple_protocol=true&pgbouncer=true` when connecting via pooler (`:6543`).
