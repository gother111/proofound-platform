> Doc Class: `active`
> Last Verified: `2026-05-19`

# Launch Alert Configuration

This guide defines launch-safe alerting for Proofound. It is scoped to the locked MVP corridor and internal launch operations; it does not make broad analytics dashboards, fairness dashboards, native video-provider checks, or generic marketplace metrics part of launch readiness.

Use this with:

- [CRON_SETUP.md](./CRON_SETUP.md)
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- [launch-operations-mvp.md](./launch-operations-mvp.md)
- [production-readiness-checklist.md](./production-readiness-checklist.md)
- [structured-logging.md](./structured-logging.md)

## Alert Channels

Minimum launch channels:

- one monitored operator mailbox or incident channel
- Sentry or equivalent runtime error notifications
- Vercel deployment and cron failure notifications
- cron-job.org notifications for externally managed observability jobs

Do not put secrets, private proof content, hidden candidate identity details, signed URLs, internal queue IDs, raw logs, or diagnostic dumps in alert messages.

## Severity Levels

- `P1`: user trust or privacy risk, auth/signup/token redemption broken, public portfolio unsafe, export/delete unsafe, reveal without consent, admin/internal data exposed, production app unavailable
- `P2`: assignment publishing, shortlist/review, intro, verification, interview, decision, engagement verification, or launch monitor degraded
- `P3`: non-blocking operational drift, noisy alerts, thin-market fallback volume, documentation or evidence freshness issue

## Required Launch Alerts

### Runtime Errors

Configure Sentry or equivalent alerting for:

- new production error issue
- error spike on active MVP routes
- recurring error after a resolved release
- frontend error on public portfolio, signup/login, assignment/review, reveal, export, or delete flows

Alert payloads should include route, release, request id when available, severity, and a link to the protected error tool. They must not include private payload bodies.

### Public Availability

Monitor:

- `/`
- `/api/health`

Expected behavior:

- public health remains minimal
- no private diagnostics are exposed
- failure alerts route to operators

### Internal Launch Monitors

Authenticated operator checks must cover:

- `/api/monitoring/launch-status`
- `/api/monitoring/perf-status`

Launch-status should report the expected monitor contract, no missing monitors, no P1/P2 failures, and no unsafe raw-prompt or private-data logging state.

Perf-status must include fresh `/api/assignments` latency evidence on the intended production-candidate target before final go/no-go.

### Cron And Scheduled Work

Follow [CRON_SETUP.md](./CRON_SETUP.md).

Launch automation:

- `/api/cron/decision-reminders` via Vercel Cron

External observability jobs:

- `/api/cron/health-check` via cron-job.org
- `/api/cron/performance-check` via cron-job.org

Archived standalone deletion cron routes are not active launch alert targets:

- `/api/cron/send-deletion-reminders`
- `/api/cron/process-deletions`

## MVP Workflow Alerts

Alert or manually review when these active workflows fail or stall:

- signup/login and verification email
- onboarding and first proof flow
- proof upload/import/linking
- Proof Pack verification or trust-state transition
- public portfolio publish/unpublish/render
- organization onboarding and trust page/profile
- assignment create/edit/review/publish
- shortlist/review queue generation
- intro request
- reveal request and candidate consent
- interview scheduling/reschedule with manual meeting link default
- decision recording, including hire/engage
- engagement verification
- export/delete
- internal verification, privacy/reveal dispute, risky-upload, assignment-quality, and engagement-verification queues

Alerts should name the primary object and next action: Proof Pack, assignment, candidate review, reveal request, interview, decision, engagement verification, or queue item.

## What Not To Alert On As Launch-Critical

Do not make these launch-blocking by default:

- broad `/api/analytics/*` collection endpoints
- public directory or marketplace metrics
- old Expertise Atlas dashboard behavior
- LinkedIn verification as a public trust signal
- native video-provider success when manual meeting links still work
- broad fairness analytics dashboards
- TTSC/TTFQI/PAC business metric targets as hard production availability checks

Business metrics may be reviewed after launch, but they are not substitutes for MVP corridor smoke, privacy, route-surface, backup/restore, and go/no-go evidence.

## Alert Testing

Before launch, save evidence that:

1. Sentry or equivalent receives release-tagged runtime errors.
2. Public `/` and `/api/health` monitors alert on failure without exposing diagnostics.
3. Vercel Cron monitors `/api/cron/decision-reminders`.
4. cron-job.org jobs exist for the configured external observability routes.
5. Authenticated `/api/monitoring/launch-status` and `/api/monitoring/perf-status` can be checked by operators.
6. Alert recipients and escalation owners are current.
7. Sample alert messages are privacy-safe.

Do not trigger destructive, billing, auth, permission, database, or production-impacting failures just to test alerts. Use controlled test issues, preview targets, or provider test notifications where possible.

## Response Runbook

For `P1`:

1. Acknowledge within 15 minutes.
2. Preserve evidence without secrets or private proof content.
3. Identify affected route, workflow, and primary object.
4. Decide whether to pause new intros, hide unsafe public projection, block reveal, or enter safe mode.
5. Record the incident and follow the security/privacy runbook if data exposure is possible.

For `P2`:

1. Acknowledge within 4 hours.
2. Confirm whether fallback state is safe and visible.
3. Identify the owner: engineering, product/ops, trust/verification, or support.
4. Restore the workflow or document the launch risk.

For `P3`:

1. Triage during the next operator review.
2. Reduce noisy alerts when they do not protect launch behavior.
3. Keep evidence freshness visible in the sweep or launch artifact.

## Launch Evidence To Save

Record:

- alert channels and owners, without personal secrets
- monitor URLs and classifications
- latest alert test date and target
- launch-status and perf-status results
- `/api/assignments` latency evidence source
- cron ownership and schedules
- any disabled, skipped, or unverified alert with the reason
