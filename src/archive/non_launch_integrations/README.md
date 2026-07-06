# Non-Launch Integrations Archive

Archived: `2026-03-25`

This directory preserves the retired Google, LinkedIn, and video-integration slice without
keeping it in the active launch surface.

Preserved source locations:

- API routes:
  - `src/archive/non_launch_api/auth/google/callback/route.ts`
  - `src/archive/non_launch_api/auth/linkedin/route.ts`
  - `src/archive/non_launch_api/auth/linkedin/callback/route.ts`
  - `src/archive/non_launch_api/integrations/google/connect/route.ts`
  - `src/archive/non_launch_api/integrations/google/callback/route.ts`
  - `src/archive/non_launch_api/integrations/video/**`
  - `src/archive/non_launch_api/verification/linkedin/initiate/route.ts`
- Archived pages already preserved separately:
  - `src/archive/non_launch_pages/app/i/settings/integrations/page.tsx`
  - `src/archive/non_launch_pages/app/o/[slug]/settings/integrations/page.tsx`
- UI and focused tests:
  - `src/archive/non_launch_integrations/preserved/components/**`
  - `src/archive/non_launch_integrations/preserved/app/**`
  - `src/archive/non_launch_integrations/preserved/tests/**`
- Orphaned provider wrappers:
  - `src/archive/non_launch_integrations/preserved/lib/integrations/zoom.ts`
  - `src/archive/non_launch_integrations/preserved/lib/video/**`

Restore guidance:

- Copy the preserved files back to their original `src/app`, `src/components`, or `tests` paths.
- Reconnect them to the active UI and route surface intentionally.
- Re-run the focused integration tests plus the launch-surface inventory before treating the slice as launch-ready.
