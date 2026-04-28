# Project Change Entry

- Date/time (UTC): 2026-04-28T21:59:57Z
- Branch: codex-landing-sequence-scroll-lock
- Base commit: d85b73d0
  What changed:
- Tuned the desktop landing story transitions for blind-to-outcomes, compatibility-to-precision, and precision-to-challenges.
- Added desktop wheel/touch gesture locking so one gesture advances one story frame and extra input is ignored until the current transition finishes.
- Added a landing E2E regression for repeated wheel input during an active transition.

Why:

- The landing sequence should feel like a controlled frame-by-frame story rather than a scroll position that can skip states.

How to verify:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `PROOFOUND_PLAYWRIGHT_NODE20_REEXEC=1 PROOFOUND_NODE20_REEXEC=1 npm run test:e2e:landing`
- `PROOFOUND_PLAYWRIGHT_NODE20_REEXEC=1 PROOFOUND_NODE20_REEXEC=1 npm run test:e2e:landing:visual`

Open risks / TODO:

- `npm run test` still has unrelated existing failures outside the landing area, including admin/CV/verification/PDF assertions and sandbox-blocked `tsx` pipe listeners.
