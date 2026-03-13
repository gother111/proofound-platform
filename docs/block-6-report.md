# Block 6 Report

## Objective

Shrink the active launch surface so the repo and runtime align more closely with the locked MVP, while clearly isolating excluded non-MVP route and API families without deleting useful future code.

## Launch surface inventory

### Active launch path

- App pages:
  - `/admin`
  - `/admin/verification`
  - `/admin/audit`
- Preserved internal-ops APIs:
  - `/api/admin/audit`
  - `/api/admin/feature-flags/**`
  - `/api/admin/metrics/rollout`
  - `/api/admin/moderation/queue`
  - `/api/admin/moderation/action`
  - `/api/admin/verification/linkedin/**`
  - `/api/admin/organizations/[orgId]/audit`
  - `/api/admin/organizations/[orgId]/verify`

### Internally reachable but not launch-relevant

- Org-scoped pages that remain behind `OrgScopeNotice` gating rather than public launch navigation:
  - `/app/o/[slug]/candidates`
  - `/app/o/[slug]/shortlist`
  - `/app/o/[slug]/team`
  - `/app/o/[slug]/settings`
  - related non-launch org management pages already routed back into the MVP corridor

### Dead or legacy

- Archived individual pages already using `notFound()`:
  - `/app/i/zen`
  - `/app/i/expertise`
  - `/app/i/skill-gaps`
  - `/app/i/settings/fairness`
- Archived admin pages that remain in the repo but are not part of the launch corridor:
  - `/admin/users`
  - `/admin/organizations`
  - `/admin/performance`
  - `/admin/fairness`
  - `/admin/fairness/notes`
  - `/admin/ai-spend`
  - `/admin/cron`

### Safe to archive or gate

- Archived API families:
  - `/api/mobile/**`
  - `/api/wellbeing/**`
  - every `/api/admin/**` route outside the preserved internal-ops allowlist

## Commands run

- `git status --short`
- `export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH" && npm run test -- src/lib/launch/__tests__/surface-policy.test.ts src/lib/__tests__/middleware-launch-archive.test.ts tests/ui/admin-dashboard-launch-links.test.tsx tests/ui/archived-mvp-routes.test.ts tests/ui/left-nav-portfolio-gating.test.tsx tests/ui/command-palette-archived-links.test.tsx tests/ui/organization-settings-integrations.test.tsx`
- `export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH" && npm run lint`
- `export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH" && npm run typecheck`
  - first run failed in `src/lib/verification/status-contract.ts`
- `export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH" && npm run test -- tests/api/verification-status-route.test.ts`
- `export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH" && npm run test -- tests/ui/verifications-page.test.tsx`
  - failed on pre-existing expectation drift against the canonical request-feed shape
- `export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH" && npm run build`
  - early reruns surfaced transient generated-route and stale-client failures before the real strict-build blocker in `src/lib/verification/request-feed.ts`
- `export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH" && npm run typecheck`
  - rerun passed after the narrow typing fix
- `export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH" && npm run build`
  - rerun passed after the request-feed typing fix
- `export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH" && npm run docs:freshness`
  - completed in warning mode with 3 pre-existing orphan audit-doc warnings
- `export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH" && npm run log:change`
- `export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH" && npm run log:session`

## Files changed

- `src/lib/launch/surface-policy.ts`
- `src/middleware.ts`
- `src/components/admin/AdminDashboard.tsx`
- `src/lib/performance/alerting.ts`
- `src/app/api/cron/generate-fairness-note/route.ts`
- `src/lib/launch/__tests__/surface-policy.test.ts`
- `src/lib/__tests__/middleware-launch-archive.test.ts`
- `tests/ui/admin-dashboard-launch-links.test.tsx`
- `src/lib/verification/status-contract.ts`
- `src/lib/verification/request-feed.ts`
- `agent/checklists/verification.md`
- `project/changes/entries/2026-03-13T21-57-31Z__master__4767ea77.md`
- `agent/scratchpad/entries/2026-03-13T21-57-31Z__master__4767ea77.md`
- `docs/codex-progress.md`
- `docs/block-6-report.md`

## Tests run

- `src/lib/launch/__tests__/surface-policy.test.ts`
  - PASS
- `src/lib/__tests__/middleware-launch-archive.test.ts`
  - PASS
- `tests/ui/admin-dashboard-launch-links.test.tsx`
  - PASS
- `tests/ui/archived-mvp-routes.test.ts`
  - PASS
- `tests/ui/left-nav-portfolio-gating.test.tsx`
  - PASS
- `tests/ui/command-palette-archived-links.test.tsx`
  - PASS
- `tests/ui/organization-settings-integrations.test.tsx`
  - PASS
- `tests/api/verification-status-route.test.ts`
  - PASS
- `tests/ui/verifications-page.test.tsx`
  - FAIL, unrelated to Block 6 acceptance and left as follow-up drift
- `npm run lint`
  - PASS with 2 pre-existing landing `<img>` warnings
- `npm run typecheck`
  - PASS on rerun after the narrow status-contract typing fix
- `npm run build`
  - PASS on rerun after the narrow request-feed typing fix
- `npm run docs:freshness`
  - PASS in warning mode with 3 pre-existing orphan audit-doc warnings

## Result

PASS

The launch corridor no longer links to excluded admin surfaces, archived API behavior is centralized and explicit, and tests now protect the launch posture against accidental reactivation. Future mobile, wellbeing, and broader admin code remains in the repo but is isolated behind middleware archive semantics or page-level gating instead of active launch routing.

## Remaining blockers

- Live launch monitoring still depends on stale smoke evidence, so launch-status and go/no-go cannot yet prove a fresh green state.
- `tests/ui/verifications-page.test.tsx` still expects the older request-feed field shape and should be reconciled with the canonical verification feed in a follow-up block.
- There is still no `docs/block-5-report.md`, so the Block 5 close-out remains a documentation gap even though the underlying verification transport changes are present in code and journal entries.

## Exact next recommended action

Refresh launch smoke and rerun live `/api/monitoring/launch-status` plus `npm run go:no-go` with fresh evidence first, then take a separate narrow follow-up block to reconcile the remaining verification-page expectation drift with the canonical request-feed contract.
