# Architecture

## Stack (Repo Truth)
- Framework: Next.js App Router. (`/Users/yuriibakurov/proofound/package.json:8`)
- DB access: Drizzle ORM + `postgres` driver. (`/Users/yuriibakurov/proofound/src/db/index.ts:1`)
- Auth/Data: Supabase (server/client helpers under `src/lib/supabase`). (`/Users/yuriibakurov/proofound/src/app/api/conversations/[conversationId]/reveal/route.ts:14`)

## Folder Map (High-Level)
- `src/app/`: Next.js routes/pages (App Router).
- `src/app/api/`: API route handlers.
- `src/db/`: Drizzle setup + schema + DB access (`db` export).
- `src/lib/`: shared server/client libraries (analytics, matching, privacy, email, etc).
- `supabase/migrations/`: SQL migrations tracked locally (note: not currently aligned with remote history).

## Entrypoints / Flows
### Build
- `npm run build` runs `next build`. (`/Users/yuriibakurov/proofound/package.json:9`)
- `prebuild` runs readiness check but is non-blocking. (`/Users/yuriibakurov/proofound/package.json:7`)

### DB Initialization
- DB is created at module import time in `src/db/index.ts`. (`/Users/yuriibakurov/proofound/src/db/index.ts:13`)
- If `DATABASE_URL` is missing, a mock DB is used; production runtime throws unless it’s the Next build phase. (`/Users/yuriibakurov/proofound/src/db/index.ts:31`)

### Common DB Execute Pattern
- Use `getRows(result)` for `db.execute(...)` results to avoid relying on `.rows` shape differences. (`/Users/yuriibakurov/proofound/src/lib/db/rows.ts:3`)

### Messaging Identity Reveal
- POST handler is implemented under `src/app/api/conversations/[conversationId]/reveal/route.ts`. (`/Users/yuriibakurov/proofound/src/app/api/conversations/[conversationId]/reveal/route.ts:45`)
- Resend client is created lazily to avoid build-time crashes and to allow safer deployment environments. (`/Users/yuriibakurov/proofound/src/app/api/conversations/[conversationId]/reveal/route.ts:21`)

## Risks / Known Issues
- Migration source-of-truth ambiguity: remote migration history contains versions that do not exist under `supabase/migrations/` locally.
- Build-time module side effects: route handlers that instantiate providers (DB/email) at module scope can break `next build` “Collecting page data”.

