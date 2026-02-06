# Plans (MVP Milestones)

## Milestone 1: Build/Deploy Green
**Goal:** `next build` and Vercel preview deploys are consistently green; no “build-time crash on import” patterns.

Validation checklist:
- `npm run build` passes in a clean worktree on Node 20. (`/Users/yuriibakurov/proofound/package.json:9`)
- Vercel deployments for the refactor branch are `READY` (not `ERROR`) and no longer fail on route type exports or missing modules.
- `npm run typecheck` passes. (`/Users/yuriibakurov/proofound/package.json:13`)

## Milestone 2: Analytics Events Hardening
**Goal:** Event insertions are idempotent for “emit-once” milestones and schema matches code expectations.

Validation checklist:
- Migration `20260205190000` exists in remote migration history and DB schema includes expected analytics columns and unique constraints.
- Duplicated milestone events do not error (use uniqueness + `ON CONFLICT DO NOTHING`).

## Milestone 3: Assignments/Matching Route Hygiene
**Goal:** `/api/assignments` has no file-based logging and heavy work is structured and measurable.

Validation checklist:
- Route does not write files to local filesystem.
- Matching generation is extracted into a library module with unit-level tests.
- Query counts are reduced (no obvious N+1 patterns).

## Milestone 4: Dashboard UX Stability
**Goal:** Dashboard mock-mode toggle and layout persistence are deterministic (no hook-deps warnings; state transitions are reversible).

Validation checklist:
- `npm run lint` has no `react-hooks/exhaustive-deps` warnings. (`/Users/yuriibakurov/proofound/package.json:11`)
- Manual test: toggle mock mode, refresh, restore prior layout.

## Milestone 5: Hotspot Decomposition (UX/Code Health)
**Goal:** Reduce large components into testable modules without regressions.

Validation checklist:
- `/src/app/app/i/expertise/components/AddSkillDrawer.tsx` is decomposed into smaller modules while preserving import surface.
- `/src/components/profile/EditableProfileView.tsx` is decomposed by tabs + shared state hook.
- Smoke flows still work (expertise add skill, profile edit).

