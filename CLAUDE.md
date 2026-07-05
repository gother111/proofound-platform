# CLAUDE.md

Proofound: proof-first hiring platform. Next.js 15 App Router + TypeScript + Supabase (Postgres/RLS/Auth) + Drizzle + Tailwind/shadcn + Resend + Vercel. Python CV service in `python_cv/`.

## Commands

- Dev: `npm run dev` · Build: `npm run build`
- Gates: `npm run lint` · `npm run typecheck` · `npm run test` (vitest)
- Targeted suites: `npm run test:launch:smoke|portfolio|org-corridor` · `npm run test:privacy` · `npm run test:e2e:landing`
- DB: `npm run db:migrate` (raw SQL in `src/db/migrations/`) · `npm run db:drift-check`

## WAR ROOM MODE

If asked to run/resume the war room: read `WAR_ROOM.md` (protocol), then execute `IMPLEMENTATION_PLAN.md` per that protocol. You orchestrate; Codex CLI implements. Be maximally token-frugal (rules in WAR_ROOM.md).

## Authority

`AGENTS.md` governs, WITH its **2026-07-05 Course-Correction Addendum**: `PROOFOUND_IMPROVEMENT_AUDIT_2026-07-05.md` + `IMPLEMENTATION_PLAN.md` outrank the 2026-03-11 locked PRD stack where they conflict. Privacy/RLS/auth/consent semantics are always non-negotiable.

## Repo cautions

- 139 API routes; only ~47 have zod validation — don't assume input safety.
- Three migration dirs exist; only `src/db/migrations/` is operative.
- `src/archive/` is quarantined non-launch code (tsconfig-excluded) — don't import from it.
- Feature flags: `src/lib/featureFlags.ts` (server) mirrored in `CLIENT_FF_DEFAULTS`.
- i18n: change `en.json` and `sv.json` together.
