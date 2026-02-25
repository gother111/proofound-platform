# Project Change Entry

- Date/time (UTC): 2026-02-25T09:20:55Z
- Branch: codex-pro-38-tour-tooltip-overflow
- Base commit: 70020bd0

What changed:

- Added `src/lib/tour/tooltip-position.ts` with pure tooltip placement computation:
  - preferred side positioning (`top`, `bottom`, `left`, `right`)
  - automatic placement fallback (flip/opposite and alternate axis)
  - viewport clamping with tiny-viewport fallback
- Updated `src/components/tour/FirstRunTour.tsx`:
  - measures tooltip dimensions via `ref`
  - computes explicit viewport-safe `top/left` instead of transform-only positioning
  - re-syncs highlight rect on resize/scroll
  - applies safe tooltip size constraints (`max-height` + `overflow-y-auto`)
- Added focused tests in `tests/ui/first-run-tour-tooltip-position.test.ts` (6 scenarios).

Why:

- Fix `PRO-38` where first-run tour popups on steps 3 and 4 could render beyond viewport boundaries and become partially hidden.

How to verify:

- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test -- tests/ui/first-run-tour-tooltip-position.test.ts` (PASS)
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run lint` (PASS)
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run typecheck` (PASS)
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test` (FAIL, unrelated pre-existing failures in `tests/ui/public-org-portfolio-page.test.tsx`)
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run build` (PASS)

Open risks / TODO:

- On extremely narrow/tiny screens, tooltip can still overlap nearby UI while staying in-bounds.
- Consider adding an E2E assertion that first-run tour tooltip bounds stay within the viewport.
