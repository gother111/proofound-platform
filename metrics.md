# Metrics

## Analytics Data Plumbing (Repo Truth)

- Event ingestion and SQL utilities rely on a consistent “rows extraction” helper (`getRows`). (`/Users/yuriibakurov/proofound/src/lib/db/rows.ts:3`)

## Build-Time vs Runtime Guards

Metrics/admin routes may be imported during `next build` for compilation. Any analytics/metrics code that depends on runtime secrets should be initialized lazily (same pattern as Resend in identity reveal). (`/Users/yuriibakurov/proofound/src/app/api/conversations/[conversationId]/reveal/route.ts:21`)

## Open Items

- Document canonical analytics event schema expectations (columns, uniqueness constraints) and how to verify them against `supabase_migrations.schema_migrations`.

## Pre-Commit Gate Logs

- Local Vercel parity runs (install/lint/typecheck/test/build + `vercel build --prod`) are logged in:
  - `project/Documentation.md`
  - `docs/monitoring-alerting.md` (section: “Pre-commit Vercel Gate (Run Log)”)
