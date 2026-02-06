# Implement (Operating Contract)

## Branching / PR Hygiene
- Work on `codex/*` branches only.
- Keep commits small and scoped (1 concern per commit when feasible).
- Stage explicitly (never rely on “stage all”) to avoid including unrelated local changes.

## Build Discipline
- Required local baseline:
  - Node `v20.20.0` (or compatible `20.x` per engines). (`/Users/yuriibakurov/proofound/package.json:3`)
  - `npm ci`
  - `npm run typecheck` (`tsc --noEmit`). (`/Users/yuriibakurov/proofound/package.json:13`)
  - `npm run build` (`next build`). (`/Users/yuriibakurov/proofound/package.json:9`)

## Data/DB Discipline
- Never assume `db.execute(...)` returns `{ rows: ... }` across all runtimes.
  - Use `getRows()` consistently for raw SQL. (`/Users/yuriibakurov/proofound/src/lib/db/rows.ts:3`)
- Avoid module-scope “hard throws” based on runtime env vars; build tooling imports route modules during compilation.
  - For DB: treat Next build phase as non-runtime. (`/Users/yuriibakurov/proofound/src/db/index.ts:34`)
- Provider clients (Resend, etc.) must be lazy-initialized and validated at use-time. (`/Users/yuriibakurov/proofound/src/app/api/conversations/[conversationId]/reveal/route.ts:21`)

## Deploy Discipline
- For Vercel: treat `next build` logs as the primary source of truth when resolving deployment failures; reproduce locally in a clean worktree where possible.

