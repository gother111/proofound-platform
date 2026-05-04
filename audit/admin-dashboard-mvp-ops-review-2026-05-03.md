> Doc Class: `reference-spec`
> Last Verified: `2026-05-04`

# Admin Dashboard MVP Ops Review

Date: 2026-05-03
Scope: current active Proofound admin dashboard, admin APIs, internal ops queues, launch-surface policy, authorization helpers, audit logging, and focused runtime/test evidence.

## A. Executive Verdict

Verdict: partially ready.

The admin dashboard is narrow, protected, and aligned away from broad enterprise/admin-suite sprawl. It is useful for seeing four internal ops queues and moving generic queue status with notes. It is not yet complete enough as the primary MVP pilot operations console.

The main gap is operational depth: admins can see queue shells, IDs, summary text, and metadata, but cannot inspect the underlying claim-scoped verification record, reveal/consent state, workflow state, organization assignment/trust context, public portfolio state, export/deletion status, or launch health from the dashboard. The backend has some important safe actions, such as explicit upload review and break-glass organization trust changes, but those actions are either not exposed in the UI or not connected to a usable operator detail view.

## B. What Works

- Active admin page scope is narrow: `/admin`, `/admin/verification`, and `/admin/audit` only.
- Server-side page access uses `requirePlatformAdmin()` in `src/app/admin/layout.tsx`.
- Admin APIs use platform-admin guards through `requirePlatformAdminJson()` or break-glass platform-admin guards.
- Launch-surface policy preserves only the narrow admin allowlist and archives broad admin APIs/pages.
- The dashboard uses four MVP-relevant queues: `verification`, `privacy_reveal_exception`, `correction_revocation`, and `pilot_ops`.
- Queue status changes require notes for resolve/cancel/reopen and create admin audit events.
- Generic resolution is blocked for `uploaded_file` queue items; backend requires the explicit upload review path.
- The explicit upload review service moves quarantined uploads to private storage or rejects them, records upload events, and writes audit rows.
- Organization trust-tier changes require break-glass reason and write admin audit plus trust transition rows.
- Launch monitoring, alerting, smoke artifact, and launch-status route tests exist and pass.

## C. What Is Missing

- No admin detail view for a queue item.
- No claim-scoped verification details, verifier response, freshness, contradiction, dispute, or revocation context in the dashboard.
- No reveal/consent timeline or privacy exception inspection in the dashboard.
- No interview, decision, hire, or engagement-verification workflow inspection in the dashboard.
- No pilot organization overview showing trust page, assignment, shortlist/review, intro, reveal, interview, decision, or engagement state.
- No public portfolio publication/export/delete status in admin.
- No launch health or smoke/monitor evidence panel in `/admin`, despite launch-status APIs existing.
- No UI affordance for `uploadReviewAction: approve|reject`; risky upload queue items cannot be completed safely from the dashboard as implemented.
- No direct link from queue item to the relevant SOP or safe operator checklist.
- No minimum-necessary projection for admin queue metadata; the UI renders arbitrary metadata values.

## D. Security And Privacy Risks

- P1: `internal_ops_queue_items` creation migration does not explicitly enable RLS or define direct table policies. The table may rely on server-side route protection and deployment/database defaults rather than an explicit table-level privacy contract. Evidence: `src/db/migrations/20260320195000_add_internal_ops_queue_items.sql`.
- P1: `GET /api/admin/internal-ops/queues` returns raw queue metadata and summaries; UI renders every metadata key/value. If queue producers ever include private filenames, notes, raw verifier text, or consent details, those are exposed to every platform admin session. Evidence: `src/lib/internal-ops/queue.ts` and `src/components/admin/AdminVerificationDashboard.tsx`.
- P1: `GET /api/admin/audit` returns full `admin_audit_log` rows, including `changes`, `metadata`, IP, user agent, and reason, even though the UI mostly hides details. Evidence: `src/app/api/admin/audit/route.ts`.
- P2: Admin route 500s include raw error messages in some JSON details. Evidence: `src/app/api/admin/internal-ops/queues/route.ts` and `src/app/api/admin/internal-ops/queues/[id]/route.ts`.
- P2: The break-glass organization audit export returns full org audit logs through API after reason check, but there is no dashboard UI showing minimum necessary preview, risk labels, or access confirmation.

## E. Scope Problems

- Active routes are appropriately narrow.
- Broad admin users/orgs/fairness/metrics pages and APIs are archived in route policy.
- Some broad admin components remain in `src/components/admin/**`, and stale tests under `src/app/api/admin/__tests__` still import archived admin APIs. This is not a runtime launch-surface issue, but it creates test and maintenance noise.
- `e2e/admin-dashboard-smoke.spec.ts` is stale and expects the old broad admin suite (`/admin/users`, `/admin/organizations`, fairness notes, LinkedIn verification queue). When run with mock admin enabled, it fails immediately because the current dashboard correctly says "Launch Operations", not "Admin Dashboard".

## F. UX And Usability Issues

- Queue cards show `Related record: <uuid>` but provide no human-readable record title, owner, org, claim, workflow stage, or safe link.
- Operators cannot distinguish urgent privacy leaks from ordinary stale/manual-review items beyond priority badges.
- No filters by priority/status/entity/age/operator, beyond queue tabs.
- No confirmation for sensitive queue actions like cancel/reopen/resolve.
- Upload review is unusable from UI because approve/reject actions are not shown.
- Empty states are calm but not operationally helpful; they do not explain owner, SLA, or where evidence comes from.
- Audit page search is basic and lacks filters by target type, admin, time range UI, sensitive action type, or break-glass-only view.
- Dashboard is calm and uncluttered, but too sparse for a real launch operator.

## G. Test Evidence

Passing evidence:

- `npm run test -- tests/api/admin-internal-ops-queue-route.test.ts tests/ui/admin-dashboard-launch-links.test.tsx tests/ui/admin-verification-dashboard.test.tsx tests/api/admin-organizations-verify-route.test.ts tests/api/org-audit-export-routes.test.ts src/lib/__tests__/middleware-launch-archive.test.ts src/lib/launch/__tests__/surface-policy.test.ts tests/api/launch-surface-inventory.test.ts`: pass, 33 tests.
- `npm run test:launch:upload`: pass, 37 tests.
- `npm run test:launch:workflow`: pass, 84 tests.
- `npm run test:launch:privacy`: first sandbox run failed on DNS; rerun with network access passed, 53 tests across base and extended RLS suites.
- `npm run test -- src/app/api/monitoring/__tests__/launch-status-route.test.ts tests/lib/launch-synthetic-monitors.test.ts tests/lib/launch-alerting.test.ts tests/lib/launch-smoke-artifact.test.ts`: pass, 41 tests.
- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm run build`: pass.
- `npm run docs:freshness`: pass.

Failing or unverified evidence:

- `npm test`: failed with 2 unrelated current-checkout failures: `tests/lib/ai-provider-gemini-client.test.ts` expects no `suggestionId`, and `tests/ui/verifications-page.test.tsx` crashes reading `primaryClaim` in `src/lib/verification/request-feed.ts`.
- `NEXT_PUBLIC_USE_MOCK_SUPABASE=true MOCK_ADMIN_MODE=true PLAYWRIGHT=true node ./scripts/playwright-node20.mjs test e2e/admin-dashboard-smoke.spec.ts --project=chromium --reporter=line --workers=1`: failed because the spec is stale and expects the old broad admin dashboard heading.
- Full local launch smoke was not run because no explicit live target was requested and the more relevant launch-status/monitoring route tests were run instead.

## H. Required Fixes

### P0: Add Admin Queue Item Detail Projection

Problem: The dashboard cannot support real operations from IDs and summaries alone.
Evidence: `src/components/admin/AdminVerificationDashboard.tsx` renders summary, linked entity id, and metadata only.
File/route: `/admin/verification`, `GET /api/admin/internal-ops/queues`.
Recommended fix: Add a backend queue-detail projection that resolves linked entities to minimum-necessary, privacy-safe operational facts by entity type: verification claim/status/freshness/dispute; reveal consent/current stage; interview/decision/engagement state; organization assignment/trust status; upload safety state.
Success criteria: An operator can open one queue item and decide next action without raw SQL or overexposed private data; tests cover each entity projection and non-admin denial.

### P0: Expose Safe Upload Approve/Reject UI

Problem: Backend supports explicit upload review, but the dashboard only sends generic `status` and never sends `uploadReviewAction`.
Evidence: `src/app/api/admin/internal-ops/queues/[id]/route.ts` accepts `uploadReviewAction`; `src/components/admin/AdminVerificationDashboard.tsx` only sends `status` and `note`.
File/route: `/admin/verification`, `PATCH /api/admin/internal-ops/queues/[id]`.
Recommended fix: For uploaded-file queue items, replace generic resolve with explicit "Approve private evidence" and "Reject upload" actions, both requiring a note and showing privacy warnings.
Success criteria: UI tests prove uploaded-file queue items call `uploadReviewAction: approve|reject`; backend tests remain green; no original filename/private storage path appears in response.

### P1: Make Internal Ops Queue Table Privacy Explicit

Problem: The queue table migration does not explicitly enable RLS or define policies.
Evidence: `src/db/migrations/20260320195000_add_internal_ops_queue_items.sql`.
File/route: `internal_ops_queue_items`.
Recommended fix: Add a migration enabling and preferably forcing RLS for `internal_ops_queue_items`, grant no direct anon/authenticated access unless explicitly needed, and keep server-side admin APIs as the only read/write path.
Success criteria: Live RLS test confirms ordinary authenticated and anon clients cannot read/write queue items; service/server path still works.

### P1: Add Launch Health Panel To Admin Home

Problem: Launch health exists through protected monitoring APIs but is invisible in the dashboard.
Evidence: `/admin` links only queues and audit; `src/app/api/monitoring/launch-status/route.ts` exists separately.
File/route: `/admin`, `/api/monitoring/launch-status`.
Recommended fix: Add a minimal launch readiness card showing ready/blocked, stale monitor count, failed critical monitors, smoke artifact freshness, and dependency blockers. Use existing internal auth safely; do not expose secrets.
Success criteria: Admin home shows launch status with loading/error/empty states and a focused route test proves non-admin/unauthorized access remains blocked.

### P1: Sanitize Admin API Projections And Errors

Problem: Admin audit and queue APIs return full metadata/changes and some raw error details.
Evidence: `src/app/api/admin/audit/route.ts`, `src/app/api/admin/internal-ops/queues/route.ts`, `src/app/api/admin/internal-ops/queues/[id]/route.ts`.
File/route: `/api/admin/audit`, `/api/admin/internal-ops/queues`.
Recommended fix: Return explicit DTOs with whitelisted fields. Keep full detail behind break-glass endpoints if needed. Make production 500s generic and log sanitized detail server-side.
Success criteria: Tests prove private filenames, storage paths, verifier raw text, break-glass reason details, and error stack/message details are not returned by default list APIs.

### P2: Add Operator Usability Controls

Problem: The queue UI lacks filters, confirmations, SLA/age indicators, and SOP links.
Evidence: `AdminVerificationDashboard` has only tabs and basic action buttons.
File/route: `/admin/verification`.
Recommended fix: Add priority/status/entity filters, age/SLA badges, per-queue SOP links, and confirmation dialogs for resolve/cancel/reopen.
Success criteria: UI tests cover filtering, confirmation before sensitive actions, and empty/error states.

### P2: Add Pilot Organization And Workflow Read-Only View

Problem: Admins cannot inspect pilot organizations, assignment state, shortlist/review state, intro/reveal/interview/decision/engagement state, or stuck workflows in one place.
Evidence: Active admin pages are only home, queues, and audit.
File/route: new narrow `/admin/pilot-ops` or queue detail drawer only.
Recommended fix: Prefer adding this as queue detail tabs or a narrow pilot-ops drilldown rather than a broad organization admin suite.
Success criteria: Operators can support a stuck MVP corridor without seeing broad org analytics, ATS, HRIS, or enterprise fields.

### P3: Remove Or Quarantine Stale Admin Test/Component Noise

Problem: Stale Playwright and archived admin test files still describe the old broad dashboard.
Evidence: `e2e/admin-dashboard-smoke.spec.ts` failed when run with mock admin enabled.
File/route: `e2e/admin-dashboard-smoke.spec.ts`, archived admin test imports, unused broad admin components.
Recommended fix: Replace the Playwright smoke with a current launch-ops smoke and move old broad admin component tests into archived/non-launch coverage or delete if no longer useful.
Success criteria: The only active admin E2E smoke checks `/admin`, `/admin/verification`, `/admin/audit`, non-admin denial, and archived page behavior.

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
