# Proofound Current Codebase Truth

Date: 2026-05-06

Scope: current internal repo snapshot for maintainability work. This file is reference context only. It does not override the locked MVP authority stack in `AGENTS.md`.

## Summary

The project is a Next.js App Router application on Vercel with Supabase Auth, Postgres, Storage, Drizzle ORM, Resend, Sentry, Vercel Analytics, Vitest, and Playwright. The source-of-truth order remains the locked MVP stack listed in `AGENTS.md` and `project/Architecture.md`.

The codebase is structurally strong in its governance, verification checklists, launch-surface controls, and focused domain helper tests. The main maintainability risk is that several privacy, proof, review, portfolio, verification, and export workflows are concentrated in large modules where future changes need explicit tests and small steps.

## Current Snapshot

- Branch reviewed: `master`
- Base commit reviewed: `77e9f395`
- API route handlers under `src/app/api/**/route.ts`: 124
- App page routes under `src/app/**/page.tsx`: 49
- Test files under `tests` and `e2e`: 346

Large modules to treat carefully:

- `src/lib/proofs/canonical-pack.ts`: 1,859 lines
- `src/lib/matching/review-contract.ts`: 1,848 lines
- `src/lib/portfolio/public-projection.ts`: 1,264 lines
- `src/lib/verification/policy.ts`: 873 lines
- `src/app/api/user/export/route.ts`: 544 lines
- `src/app/api/conversations/[conversationId]/reveal/route.ts`: 444 lines

## What Is Healthy

- `AGENTS.md` and `project/Architecture.md` clearly separate active MVP authority from reference-only historical docs.
- `agent/checklists/verification.md` gives a usable verification ladder for local checks, privacy-sensitive work, deployment parity, and production sync.
- `src/lib/launch/surface-policy.ts` plus launch-surface tests make active, internal-only, and archived surfaces explicit.
- Small domain helpers such as proof anchor policy, upload privacy, assignment validation, effective visibility, and process-state helpers are easier to read and test than the larger orchestration modules.
- CI includes scope checks, lint, typecheck, migration drift, unit tests, launch smoke, build, go/no-go, auth E2E, and landing contracts.

## Current Safe Improvements

- Proof Pack exportability now lives behind `isExportableProofPack` in `src/lib/proofs/pack-anchor.ts`.
- `src/app/api/user/export/route.ts` now calls that predicate instead of repeating quarantine and anchor checks inline.
- `tests/lib/proof-pack-anchor.test.ts` covers the exportability predicate.
- `.artifacts/codebase-structure-audit.md` maps current maintainability boundaries.
- `.artifacts/broader-codebase-improvement-assessment.md` prioritizes docs, language, and semantic guardrails over broad refactors.
- `docs/PROOFOUND_UBIQUITOUS_LANGUAGE.md` defines the main domain terms for future work.
- `docs/DOCS_REGISTRY.md` registers the new maintained docs so docs freshness stays useful.

## Recommended Next Steps

1. Keep proof, privacy, reveal, portfolio, matching, and export changes small until each behavior has focused tests.
2. Add semantic guardrail tests before extracting workflow services. Prefer tests that protect behavior, such as identity visibility and public-safe projection, over tests that freeze file layout.
3. Use `docs/PROOFOUND_UBIQUITOUS_LANGUAGE.md` before renaming concepts or splitting modules.
4. Treat dependency and security upgrade work as a separate approved task because it can change lockfiles, build behavior, and production runtime behavior.
5. Keep broad route namespace consolidation deferred unless there is a dedicated migration plan.

## Verification Snapshot

Most recent checks from this internal improvement pass:

- `npm run docs:freshness`: passed
- `npm run test -- tests/lib/proof-pack-anchor.test.ts`: passed
- `npm run lint`: passed
- `npm run typecheck`: passed
- `npm run test`: passed, 329 files and 1,357 tests
- `npm run build`: passed

Vitest emitted a local sandbox websocket warning, and the build emitted existing maintenance warnings about stale browser data and webpack cache serialization. Those warnings did not fail verification.
