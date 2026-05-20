> Doc Class: `reference-spec`
> Last Verified: `2026-05-20`

# Admin Dashboard MVP Ops Review

Date: 2026-05-03
Scope: current active Proofound admin dashboard, admin APIs, internal ops queues, launch-surface policy, authorization helpers, audit logging, and focused runtime/test evidence.

> 2026-05-20 update: the route/test-noise finding and several operator-console
> findings in this audit are superseded. The active admin E2E smoke and root
> admin testing guide now match the locked launch-ops corridor (`/admin`,
> `/admin/verification`, `/admin/audit`) and no longer expect broad users,
> organizations, fairness, metrics, or LinkedIn queue pages. The operations queue
> UI now exposes minimum-necessary queue details, explicit risky-upload
> approve/reject actions, and sanitized queue metadata. The admin home now shows
> a compact launch-health card backed by the generated launch checklist. The
> default admin audit API now returns a minimum-necessary list DTO, and unexpected
> admin queue errors no longer return raw backend messages. `/admin/verification`
> now includes a narrow read-only pilot corridor drilldown inside pilot queue
> cards. Remaining follow-up risk is explicit internal ops table RLS proof.

## A. Executive Verdict

Verdict: repo-ready with remaining operational follow-up risks.

The admin dashboard is narrow, protected, and aligned away from broad enterprise/admin-suite sprawl. It is useful for seeing four internal ops queues, reviewing minimum-necessary queue detail, handling risky-upload approve/reject decisions, checking latest repo launch evidence, and reviewing audit trails.

The main remaining gap is database-level privacy proof: the admin console is narrow and privacy-projected, but `internal_ops_queue_items` still needs explicit RLS proof or a documented deployment/database contract. Richer entity/operator filters remain deferred until pilot volume proves they are needed.

## B. What Works

- Active admin page scope is narrow: `/admin`, `/admin/verification`, and `/admin/audit` only.
- Server-side page access uses `requirePlatformAdmin()` in `src/app/admin/layout.tsx`.
- Admin APIs use platform-admin guards through `requirePlatformAdminJson()` or break-glass platform-admin guards.
- Launch-surface policy preserves only the narrow admin allowlist and archives broad admin APIs/pages.
- The dashboard uses four MVP-relevant queues: `verification`, `privacy_reveal_exception`, `correction_revocation`, and `pilot_ops`.
- Queue items expose a minimum-necessary operator detail projection derived from sanitized metadata.
- Queue status changes require notes for resolve/cancel/reopen and create admin audit events.
- Generic resolution is blocked for `uploaded_file` queue items; backend requires the explicit upload review path.
- Uploaded-file queue items expose explicit `Approve private evidence` and `Reject upload` controls in the dashboard.
- The explicit upload review service moves quarantined uploads to private storage or rejects them, records upload events, and writes audit rows.
- Organization trust-tier changes require break-glass reason and write admin audit plus trust transition rows.
- Admin home shows latest repo launch-health evidence from the generated launch checklist without exposing raw monitor payloads.
- Launch monitoring, alerting, smoke artifact, and launch-status route tests exist and pass.

## C. What Is Missing

- Direct queue-header SOP links now point to the current internal-ops runbooks for each active queue.
- Status, priority, and age controls now exist on the active queue view; entity/operator filtering is still deferred until real pilot volume requires it.
- Pilot queue cards now expose a narrow read-only corridor drilldown from sanitized queue metadata; richer cross-record org/workflow drilldown is deferred until pilot volume proves it is needed.
- Default admin audit list projection is minimum-necessary, but there is still no richer break-glass preview UI for sensitive full-detail audit review.

## D. Security And Privacy Risks

- P1: `internal_ops_queue_items` creation migration does not explicitly enable RLS or define direct table policies. The table may rely on server-side route protection and deployment/database defaults rather than an explicit table-level privacy contract. Evidence: `src/db/migrations/20260320195000_add_internal_ops_queue_items.sql`.
- P1 resolved 2026-05-20: `GET /api/admin/audit` now returns an explicit list DTO and omits raw `changes`, `metadata`, IP address, and user agent fields. Evidence: `src/lib/audit/admin-audit-list.ts`, `src/app/api/admin/audit/route.ts`, `tests/lib/admin-audit-list.test.ts`.
- P2 resolved 2026-05-20: unexpected admin queue 500 responses no longer include raw error message details, and server logs record only a sanitized error class/name for those paths. Evidence: `src/app/api/admin/internal-ops/queues/route.ts`, `src/app/api/admin/internal-ops/queues/[id]/route.ts`, `tests/api/admin-internal-ops-queue-route.test.ts`.
- P2: The break-glass organization audit export returns full org audit logs through API after reason check, but there is no dashboard UI showing minimum necessary preview, risk labels, or access confirmation.

## E. Scope Problems

- Active routes are appropriately narrow.
- Broad admin users/orgs/fairness/metrics pages and APIs are archived in route policy.
- Broad admin users/orgs/fairness/metrics pages and APIs are archived in route policy.
- 2026-05-19 follow-up: broad admin analytics/fairness components and stale active
  tests have been moved to archive paths, and `e2e/admin-dashboard-smoke.spec.ts`
  now checks only `/admin`, `/admin/verification`, `/admin/audit`, and absence of
  retired broad admin links.

## F. UX And Usability Issues

- Operators can now distinguish status, priority, and age in the active queue view; entity/operator filtering remains deferred.
- Sensitive queue actions like cancel, reopen, and resolve now require confirmation prompts in addition to operator notes where required.
- Empty states are calm but not operationally helpful; they do not explain owner, SLA, or where evidence comes from.
- Audit page search is basic and lacks filters by target type, admin, time range UI, sensitive action type, or break-glass-only view.
- Dashboard is calm and uncluttered, but still sparse for a real launch operator once pilot volume rises.

## G. Test Evidence

Passing evidence:

- `NEXT_PUBLIC_USE_MOCK_SUPABASE=true MOCK_ADMIN_MODE=true PLAYWRIGHT=true npm run test:e2e -- e2e/admin-dashboard-smoke.spec.ts --project=chromium --reporter=line`: pass, 1 test, after the 2026-05-19 smoke refresh.
- `npm run test -- tests/scripts/launch-gate-config.test.ts`: pass, 36 tests, including admin guide/smoke/probe drift guardrails.
- `npm run test -- tests/ui/admin-dashboard-launch-links.test.tsx tests/ui/admin-verification-dashboard.test.tsx tests/ui/admin-audit-log-table.test.tsx tests/api/admin-internal-ops-queue-route.test.ts tests/api/launch-page-inventory.test.ts tests/lib/admin-break-glass.test.ts tests/api/org-audit-export-routes.test.ts`: pass, 25 tests.
- `npm run docs:freshness`: pass after refreshing `ADMIN_DASHBOARD_TESTING_GUIDE.md` and this audit disposition.
- `npm run lint`: pass.
- `npm run typecheck`: pass after removing stale local `.next-dev-33100` generated-type residue.
- `npm run test -- tests/api/admin-internal-ops-queue-route.test.ts tests/ui/admin-dashboard-launch-links.test.tsx tests/ui/admin-verification-dashboard.test.tsx tests/api/admin-organizations-verify-route.test.ts tests/api/org-audit-export-routes.test.ts src/lib/__tests__/middleware-launch-archive.test.ts src/lib/launch/__tests__/surface-policy.test.ts tests/api/launch-surface-inventory.test.ts`: pass, 33 tests.
- `npm run test:launch:upload`: pass, 37 tests.
- `npm run test:launch:workflow`: pass, 84 tests.
- `npm run test:launch:privacy`: first sandbox run failed on DNS; rerun with network access passed, 53 tests across base and extended RLS suites.
- `npm run test -- src/app/api/monitoring/__tests__/launch-status-route.test.ts tests/lib/launch-synthetic-monitors.test.ts tests/lib/launch-alerting.test.ts tests/lib/launch-smoke-artifact.test.ts`: pass, 41 tests.
- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm run build`: pass.
- `npm run docs:freshness`: pass.
- `npm run test -- tests/ui/admin-dashboard-launch-links.test.tsx tests/lib/admin-launch-health-summary.test.ts tests/ui/admin-verification-dashboard.test.tsx tests/lib/internal-ops-queue.test.ts tests/api/admin-internal-ops-queue-route.test.ts`: pass after the 2026-05-20 launch-health card and audit refresh.
- `npm run test -- tests/lib/admin-audit-list.test.ts tests/ui/admin-audit-log-table.test.tsx tests/api/admin-internal-ops-queue-route.test.ts`: pass, 14 tests, after the 2026-05-20 admin audit DTO and queue error-detail hardening. The suite still prints Vite websocket `EPERM` noise in this sandbox, but tests pass.

Failing or unverified evidence:

- Full repo launch validation is tracked by the generated 2026-05-20 launch bundle instead of this audit note. At the time of this refresh, repo checklist evidence is `READY` with external production-candidate prerequisites still unverified.

## H. Required Fixes

### P0: Add Admin Queue Item Detail Projection

Disposition: resolved for current MVP queue metadata projection on 2026-05-20.
Evidence: `src/lib/internal-ops/queue.ts` builds a `detail` object from whitelisted metadata, and `src/components/admin/AdminVerificationDashboard.tsx` renders `Minimum necessary context` with checklist and flags.
File/route: `/admin/verification`, `GET /api/admin/internal-ops/queues`.
Current guardrail: `tests/lib/internal-ops-queue.test.ts` proves raw filenames, sanitized filenames, storage paths, and candidate emails are not projected in listed queue items.

### P0: Expose Safe Upload Approve/Reject UI

Disposition: resolved on 2026-05-20.
Evidence: `AdminVerificationDashboard` renders `Approve private evidence` and `Reject upload` for `linkedEntityType === "uploaded_file"` and sends `uploadReviewAction` with the operator note.
File/route: `/admin/verification`, `PATCH /api/admin/internal-ops/queues/[id]`.
Current guardrail: `tests/ui/admin-verification-dashboard.test.tsx` proves uploaded-file queue items do not show generic resolve and do send `uploadReviewAction: approve`; `tests/api/admin-internal-ops-queue-route.test.ts` proves responses avoid original filenames and private storage paths.

### P1: Make Internal Ops Queue Table Privacy Explicit

Problem: The queue table migration does not explicitly enable RLS or define policies.
Evidence: `src/db/migrations/20260320195000_add_internal_ops_queue_items.sql`.
File/route: `internal_ops_queue_items`.
Recommended fix: Add a migration enabling and preferably forcing RLS for `internal_ops_queue_items`, grant no direct anon/authenticated access unless explicitly needed, and keep server-side admin APIs as the only read/write path.
Success criteria: Live RLS test confirms ordinary authenticated and anon clients cannot read/write queue items; service/server path still works.

### P1: Add Launch Health Panel To Admin Home

Disposition: resolved as a minimal repo-evidence card on 2026-05-20.
Evidence: `/admin` now renders `Launch health` from `src/lib/launch/admin-health-summary.ts`, backed by the latest generated `final-launch-checklist-status.json`.
File/route: `/admin`, `/api/monitoring/launch-status`.
Current guardrail: `tests/ui/admin-dashboard-launch-links.test.tsx` proves the card renders repo verdict/counts without broad admin links, and `tests/lib/admin-launch-health-summary.test.ts` proves the card helper returns only the compact summary rather than the full checklist payload.

### P1: Sanitize Admin API Projections And Errors

Disposition: resolved for default list APIs on 2026-05-20.
Evidence: `GET /api/admin/audit` selects and maps only the list DTO fields through `toAdminAuditListEntry`: id, admin id, action, target type/id, reason, created date, and safe admin display fields. Internal ops queue GET/PATCH unexpected 500s now return generic JSON errors and log only sanitized error identity.
File/route: `/api/admin/audit`, `/api/admin/internal-ops/queues`.
Current guardrail: `tests/lib/admin-audit-list.test.ts`, `tests/ui/admin-audit-log-table.test.tsx`, and `tests/api/admin-internal-ops-queue-route.test.ts` prove raw audit `changes`, `metadata`, IP, user agent, private filenames, storage paths, verifier email, and unexpected backend error messages are not returned by default list/error APIs.

### P2: Add Operator Usability Controls

Disposition: resolved for current MVP operator controls on 2026-05-20.
Remaining problem: Richer entity/operator filters are deferred until pilot volume requires them.
Evidence: `AdminVerificationDashboard` now has status/priority filters, age badges, confirmation prompts for resolve/cancel/reopen, and direct queue-header SOP links to the current internal-ops runbooks.
File/route: `/admin/verification`.
Recommended next fix: Consider entity/operator filters only if pilot volume proves they are needed; do not add broad admin analytics.
Current guardrail: `tests/ui/admin-verification-dashboard.test.tsx` covers queue-to-SOP links, status/priority filtering, age visibility, confirmation before resolve, uploaded-file approve/reject actions, and privacy-safe queue rendering.

### P2: Add Pilot Organization And Workflow Read-Only View

Disposition: resolved for current MVP pilot queue drilldown on 2026-05-20.
Remaining problem: A richer cross-record pilot workflow view is deferred until pilot volume proves it is needed.
Evidence: `/admin/verification` pilot queue cards now render a `Pilot corridor` panel from sanitized metadata, including safe assignment/trust/reveal/decision/engagement fields when present and `Decision record` as the current live-data fallback.
File/route: `/admin/verification`.
Recommended next fix: Keep this inside queue cards until repeated pilot support work proves that a separate narrow `/admin/pilot-ops` route is necessary.
Current guardrail: `tests/ui/admin-verification-dashboard.test.tsx` proves the drilldown renders safe workflow state and does not render private email or raw interview notes when unsafe metadata is accidentally present.

### P3: Remove Or Quarantine Stale Admin Test/Component Noise

Disposition: resolved for the active Playwright smoke and known broad admin
component/test noise as of 2026-05-19.
Problem: Stale Playwright and archived admin test files described the old broad dashboard.
Evidence: `e2e/admin-dashboard-smoke.spec.ts` previously failed when run with mock admin enabled.
File/route: `e2e/admin-dashboard-smoke.spec.ts`, archived admin test imports, unused broad admin components.
Completed fix: the Playwright smoke now checks the current launch-ops corridor and
absence of broad retired admin links; broad admin component/test noise has been
archived in non-launch paths.
Success criteria: The only active admin E2E smoke checks `/admin`,
`/admin/verification`, `/admin/audit`, and absence of retired broad admin links.

## I. Codex Implementation Prompts

```text
Work only on Proofound admin queue detail projection. Add a narrow, privacy-safe queue-item detail API or extend the existing admin queue API so `/admin/verification` can inspect linked MVP records without raw SQL. Cover entity types `verification_request`, `verification_bundle`, `conversation`, `decision`, `engagement_verification`, `match`, `organization`, and `uploaded_file` with minimum-necessary DTOs only. Do not expose original filenames, private storage paths, signed URLs, raw verifier private text, hidden candidate identity, or private profile context unless the queue type operationally requires a redacted/derived fact. Add tests for non-admin denial, each DTO shape, and privacy projection.
```

```text
Work only on risky upload review in the admin operations queue. For `linkedEntityType === "uploaded_file"`, replace generic resolve with explicit approve/reject controls that call `PATCH /api/admin/internal-ops/queues/[id]` with `uploadReviewAction: "approve"` or `"reject"` and an operator note. Show a privacy warning and require confirmation. Keep generic resolve blocked for uploaded-file items. Add UI and API tests proving approve/reject work and original filenames/storage paths are not returned.
```

```text
Work only on internal ops queue database privacy. Add a migration that explicitly enables RLS on `public.internal_ops_queue_items`, prevents direct anon/authenticated access, and leaves writes/reads only through server-side admin/service paths. Add live privacy/RLS tests proving anon and ordinary authenticated users cannot select, insert, update, or delete queue items. Do not broaden admin roles or add public APIs.
```

```text
Work only on a minimal launch health card for `/admin`. Use the existing launch-status/monitoring contract to show ready/blocked state, smoke artifact freshness, missing/stale monitor counts, critical failures, and dependency blockers. Do not add analytics dashboards. Keep secrets and raw monitor payloads hidden. Add loading, error, empty, and blocked states plus tests for rendering and authorization.
```

```text
Work only on admin API privacy projection and generic errors. Replace raw `admin_audit_log` and internal queue list responses with explicit DTOs. Hide raw `changes`, `metadata`, IP, user agent, private filenames, storage paths, and stack/error details from default list responses. Preserve full sensitive detail only behind existing break-glass flows where justified. Add tests for redaction and generic production failures.
```

```text
Work only on current admin dashboard test coverage. Replace stale `e2e/admin-dashboard-smoke.spec.ts` expectations for broad admin pages with the current launch-ops corridor: `/admin`, `/admin/verification`, `/admin/audit`, non-admin denial, and archived `/admin/users` behavior. Do not reintroduce users, organizations, fairness, analytics, ATS, HRIS, or enterprise admin surfaces.
```
