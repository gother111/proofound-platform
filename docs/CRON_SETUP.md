# Cron Setup Guide

> Doc Class: `active`
> Last Verified: `2026-05-21`
> Canonical status: use Vercel Cron for daily core business automation and cron-job.org only for observability jobs.

## Canonical Cron Classification

The canonical machine-readable registry is `CRON_JOB_CLASSIFICATION_TABLE` in `scripts/lib/cron-job-org-config.mjs`. Keep this human table aligned with that registry.

| Route                                 | Classification           | Owner                      | Schedule                         | Launch reason                                                                                | Test coverage                                                                       |
| ------------------------------------- | ------------------------ | -------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `/api/cron/decision-reminders`        | active_launch_automation | Vercel Cron                | 0 10 \* \* \* UTC                | Sends launch-critical decision reminders from the MVP workflow corridor.                     | tests/scripts/cron-scheduling.test.ts verifies the Vercel cron entry.               |
| `/api/cron/refresh-matches`           | active_launch_automation | Vercel Cron                | 0 3 \* \* \* UTC                 | Enqueues the daily MVP match refresh workload.                                               | tests/scripts/cron-scheduling.test.ts verifies the Vercel cron entry.               |
| `/api/cron/refresh-matches-worker`    | active_launch_automation | Vercel Cron                | 15 3 \* \* \* UTC                | Drains the MVP match refresh queue after enqueue.                                            | tests/scripts/cron-scheduling.test.ts verifies the Vercel cron entry.               |
| `/api/cron/sla-enforcement`           | active_launch_automation | Vercel Cron                | 0 8 \* \* \* UTC                 | Maintains launch-critical SLA state for the assignment-review workflow.                      | tests/scripts/cron-scheduling.test.ts verifies the Vercel cron entry.               |
| `/api/cron/health-check`              | active_observability     | cron-job.org               | Every 3 hours, Europe/Stockholm  | External health signal for launch monitoring.                                                | tests/scripts/cron-scheduling.test.ts verifies the managed cron-job.org job.        |
| `/api/cron/performance-check`         | active_observability     | cron-job.org               | Daily at 06:00, Europe/Stockholm | External performance signal for launch monitoring.                                           | tests/scripts/cron-scheduling.test.ts verifies the managed cron-job.org job.        |
| `/api/cron/launch-synthetic-checks`   | manual_launch_ops        | Manual/internal launch ops | Not scheduled                    | Available for explicit launch synthetic checks, not recurring infrastructure.                | tests/api/launch-surface-inventory.test.ts covers internal-only launch surface.     |
| `/api/cron/account-deletion-workflow` | archived_compatibility   | None                       | Not scheduled                    | Archived compatibility route; not active launch infrastructure.                              | tests/api/launch-surface-inventory.test.ts covers archived route status.            |
| `/api/cron/send-deletion-reminders`   | archived_compatibility   | None                       | Not scheduled                    | Archived standalone deletion reminder route; not active launch infrastructure.               | tests/api/launch-surface-inventory.test.ts covers archived route status.            |
| `/api/cron/process-deletions`         | archived_compatibility   | None                       | Not scheduled                    | Archived standalone deletion processing route; not active launch infrastructure.             | tests/api/launch-surface-inventory.test.ts covers archived route status.            |
| `/api/cron/python-internal-worker`    | removed_non_mvp          | None                       | Not scheduled                    | Removed from the locked MVP launch surface; not active launch infrastructure.                | tests/api/launch-surface-inventory.test.ts covers archived route status.            |
| `/api/cron/cv-import-temp-cleanup`    | removed_non_mvp          | None                       | Not scheduled                    | CV import cleanup is outside the locked MVP launch surface.                                  | tests/api/launch-surface-inventory.test.ts covers archived route status.            |
| `/api/cron/weekly-digest`             | removed_non_mvp          | None                       | Not scheduled                    | Standalone weekly digest cron is disabled; digest delivery piggybacks on decision-reminders. | tests/scripts/cron-scheduling.test.ts verifies cron-job.org disables it if present. |
| `/api/cron/fairness-note`             | removed_non_mvp          | None                       | Not scheduled                    | Fairness-note automation is archived outside the locked MVP launch surface.                  | src/lib/launch/surface-policy.ts classifies it as archived.                         |
| `/api/cron/fairness-report`           | removed_non_mvp          | None                       | Not scheduled                    | Fairness-report automation is archived outside the locked MVP launch surface.                | src/lib/launch/surface-policy.ts classifies it as archived.                         |
| `/api/cron/generate-fairness-note`    | removed_non_mvp          | None                       | Not scheduled                    | Legacy fairness-note generation is archived outside the locked MVP launch surface.           | src/lib/launch/surface-policy.ts classifies it as archived.                         |

## Required Environment

- `CRON_SECRET` for protected cron routes
- `CRON_API_KEY` for `npm run cron:sync`
- `MATCHING_REFRESH_WORKER_BATCH_SIZE=100` unless production sizing proves a different value is needed

## External Scheduler Sync

Use the repo as the source of truth for cron-job.org:

```bash
npm run cron:sync
```

The sync script:

- keeps the intended external jobs enabled
- disables retired, non-MVP, manual-only, or Vercel-owned jobs if they exist in cron-job.org

## Manual Validation

### Vercel-owned routes

```bash
curl -i -H "Authorization: Bearer $CRON_SECRET" https://proofound.io/api/cron/decision-reminders
curl -i -H "Authorization: Bearer $CRON_SECRET" https://proofound.io/api/cron/refresh-matches
curl -i -H "Authorization: Bearer $CRON_SECRET" https://proofound.io/api/cron/refresh-matches-worker
curl -i -H "Authorization: Bearer $CRON_SECRET" https://proofound.io/api/cron/sla-enforcement
```

### cron-job.org-owned routes

```bash
curl -i -H "Authorization: Bearer $CRON_SECRET" https://proofound.io/api/cron/performance-check
curl -i https://proofound.io/api/cron/health-check
```

## Troubleshooting

- `401 Unauthorized`
  - Check the `Authorization: Bearer $CRON_SECRET` header for protected routes.
- `refresh-matches-worker` leaves backlog behind
  - Increase `MATCHING_REFRESH_WORKER_BATCH_SIZE` or concurrency before adding more schedulers.
