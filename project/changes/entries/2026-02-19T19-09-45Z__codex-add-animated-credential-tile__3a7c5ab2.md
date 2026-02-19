# Project Change Entry

- Date/time (UTC): 2026-02-19T19:09:45Z
- Branch: codex-add-animated-credential-tile
- Base commit: 3a7c5ab2

What changed:

- Replaced the abstract right-side personas visual in `src/components/landing/sections/PersonasSection.tsx` with persona-specific tiles.
- Added two reusable landing visual components:
  - `src/components/landing/visuals/CredentialVisualization.tsx`
  - `src/components/landing/visuals/OrganizationVisualization.tsx`
- Added prefixed global keyframes and utility animation classes for the personas visuals in `src/app/globals.css`.
- Extended landing E2E persona test assertions in `e2e/landing-page.spec.ts` to validate new visual marker text:
  - Individual: `Verified`, `Identity`
  - Organization: `Aligned`, `Verified Skill`, `1 Match`
- Refreshed landing visual snapshot baseline:
  - `e2e/landing-visual.spec.ts-snapshots/landing-home-af705d4-linux-chromium.png`

Why:

- The landing personas card needed to use the provided concrete visual tiles instead of the previous abstract placeholder visual.
- The new visuals improve clarity and align with the intended proof-first storytelling for both personas.
- Snapshot and E2E assertions were updated so landing guardrails reflect the new intended UI contract.

How to verify:

- `npm run lint` (PASS)
- `npm run typecheck` (PASS)
- `npm run test:e2e:landing` (PASS)
- `npm run test:e2e:landing:visual -- --update-snapshots` (PASS)
- `npm run test:e2e:landing:visual` (PASS)
- `node ./scripts/check-landing-pr-scope.mjs` (PASS in local fallback mode)

Open risks / TODO:

- `scripts/check-landing-pr-scope.mjs` reports against commit-range history and can show `no landing-sensitive files changed` on uncommitted local edits; CI PR evaluation remains the source of truth.
- Existing non-blocking Next.js dev warnings (`metadataBase`, `allowedDevOrigins`) were observed during Playwright runs and were not changed in this task.
