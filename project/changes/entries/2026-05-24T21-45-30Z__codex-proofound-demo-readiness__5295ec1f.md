# Project Change Entry

- Date/time (UTC): 2026-05-24T21:45:30Z
- Branch: codex-proofound-demo-readiness
- Base commit: 5295ec1f
  What changed:
- Moved `/app/i/verifications` out of the Communications active-nav mapping and into the Profile active-nav mapping.
- Added a regression test that keeps the verification center profile-owned without re-adding a separate Verifications left-nav item.

Why:

- Opening the verification center from the full profile made the left sidebar highlight Communications, which implied verification requests lived inside the Communications tab even when that tab had no verification content.

How to verify:

- `npm run test -- tests/ui/left-nav-portfolio-gating.test.tsx`
- `npm run lint`
- `npm run typecheck`
- Browser plugin, in-app Browser: opened `/app/i/verifications` locally and confirmed Profile has `aria-current="page"` while Communications has no active state.

Open risks / TODO:

- None.
