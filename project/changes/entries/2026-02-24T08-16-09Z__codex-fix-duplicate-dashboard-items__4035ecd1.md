# Project Change Entry

- Date/time (UTC): 2026-02-24T08:16:09Z
- Branch: codex-fix-duplicate-dashboard-items
- Base commit: 4035ecd1
  What changed:
- Removed duplicated org metrics rendering from the org home hero section so KPI cards are the single metrics surface.
- Added `sanitizeLayout` in `src/lib/dashboard/layout.ts` to normalize persisted dashboard layouts:
  - drop unknown widgets
  - dedupe by `widgetId` (prefer first visible duplicate)
  - normalize positions
  - normalize invalid sizes to widget defaults
  - fallback to default layout when empty
- Applied runtime layout sanitization in:
  - `src/components/dashboard/DraggableDashboard.tsx` (load/reset/mock-toggle paths)
  - `src/app/app/o/[slug]/home/OrgDashboardClient.tsx` (localStorage load/save/reset/preset paths)
- Hardened `/api/dashboard/layout` GET/POST to sanitize layout payloads at API boundary before returning and before DB writes.
- Expanded tests:
  - `tests/dashboard-layout.test.ts` with sanitizer coverage
  - `tests/ui/org-dashboard-client.test.tsx` for malformed org localStorage layout behavior

Why:

- Org dashboard repeated the same core metrics in both hero chips and KPI cards.
- Persisted dashboard layouts could retain malformed or duplicate widgets, causing repeated cards and unstable rendering.
- API and clients needed a shared normalization path to make widget rendering deterministic.

How to verify:

- `npm run lint` (PASS)
- `npm run typecheck` (PASS)
- `npm run test -- tests/dashboard-layout.test.ts tests/ui/dashboard-client.test.tsx tests/ui/org-dashboard-client.test.tsx` (PASS)

Open risks / TODO:

- Existing users with malformed saved layouts may see widget order adjusted after sanitization.
- Org dashboard layout still persists in localStorage (client-only), not server-backed shared storage.
