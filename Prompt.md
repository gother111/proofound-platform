# Proofound Platform (Prompt)

## Product Summary
Proofound is a two-sided platform for purpose-driven matching between individuals and organizations. It includes expertise taxonomy/skills, matching, messaging with staged identity reveal, analytics, and admin dashboards.

## Repo Truth (Cited)
- The app is a Next.js app (uses `next build`, `next dev`). (`/Users/yuriibakurov/proofound/package.json:8`)  
- Node is constrained to `>=20.20.0 <21` via `package.json` engines. (`/Users/yuriibakurov/proofound/package.json:3`)  
- Deploy readiness check is executed in `prebuild` and currently does not fail the build (`|| true`). (`/Users/yuriibakurov/proofound/package.json:7`)  
- Drizzle `db.execute(sql\`...\`)` result shapes differ by driver/runtime; the repo standardizes access via `getRows()`. (`/Users/yuriibakurov/proofound/src/lib/db/rows.ts:1`)  
- `DATABASE_URL` is required at runtime in production, but `next build` must not hard-fail when runtime env vars are absent; build phase is detected via `NEXT_PHASE === PHASE_PRODUCTION_BUILD`. (`/Users/yuriibakurov/proofound/src/db/index.ts:31`)  
- Identity reveal email sending uses Resend, but Resend client initialization is lazy to avoid build-time crashes when `RESEND_API_KEY` is missing. (`/Users/yuriibakurov/proofound/src/app/api/conversations/[conversationId]/reveal/route.ts:21`)  

## Refactor/Build Fix Status (As Of 2026-02-06)
- Vercel deployments failing since commit `400cc9e` were primarily failing during `next build` due to:
  - Missing modules (`@/lib/api/observability`, `@/lib/db/rows`) in `400cc9e` deployment logs: [deployment](https://vercel.com/pavlo-samoshkos-projects/proofound-platform/3KbGmwiBA83r2pimGTH9qnXtNQ5s).
  - Invalid Next.js App Router route handler typings (`invalid "GET" export`) for feedback routes in `9599114` and `c9bbb46`: [deployment](https://vercel.com/pavlo-samoshkos-projects/proofound-platform/cmedf8Heh5yp1PXxD7RAi62bA77w), [deployment](https://vercel.com/pavlo-samoshkos-projects/proofound-platform/CoWTE63jmBeZ859HPEDSx6GPieJX).
- Current HEAD on `codex/refactor-quick-wins` builds in a clean worktree with Node 20 (`npm ci` + `npm run build`) without requiring runtime env vars to be set at build time.

## TODO Questions
- What is the authoritative source of truth for migrations: `supabase/migrations/` vs `migrations/` (root) vs remote migration history? The local `supabase/migrations/` directory is not aligned with remote `supabase_migrations.schema_migrations`.
- Should `prebuild` readiness check fail builds (remove `|| true`) for CI/Vercel, or keep as warning-only?
- For `IdentityRevealed` emails: should missing `RESEND_API_KEY` be a hard error (500) for the reveal route, or should we allow reveal and skip email sending?

