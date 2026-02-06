# Preflight (Before Pushing / Opening PR)

## Clean Build Repro (Vercel-Like)
1. Ensure Node 20.
2. `npm ci`
3. `npm run typecheck` (`tsc --noEmit`). (`/Users/yuriibakurov/proofound/package.json:13`)
4. `npm run build` (`next build`). (`/Users/yuriibakurov/proofound/package.json:9`)

## Guardrails
- Avoid module-scope provider initialization that can crash `next build` (routes are imported during “Collecting page data”). (`/Users/yuriibakurov/proofound/src/app/api/conversations/[conversationId]/reveal/route.ts:21`)
- For raw SQL, do not assume `.rows`; use `getRows()`. (`/Users/yuriibakurov/proofound/src/lib/db/rows.ts:3`)
- If you see build-time crashes about missing runtime env vars, confirm they’re not thrown during Next build phase. (`/Users/yuriibakurov/proofound/src/db/index.ts:34`)

## Staging Discipline
- Stage only refactor-related files (explicit `git add <paths>`).
- Confirm with `git diff --cached --name-only` before commit.

