# Cron Setup Guide

> Canonical status: use Vercel Cron for daily core business automation and cron-job.org for the sub-daily Python worker plus observability jobs.

## Current Scheduler Ownership

### Vercel Cron

These are the only jobs that should be scheduled in `vercel.json`:

- `/api/cron/decision-reminders` at `10:00 UTC`
- `/api/cron/refresh-matches` at `03:00 UTC`
- `/api/cron/refresh-matches-worker` at `03:15 UTC`
- `/api/cron/sla-enforcement` at `08:00 UTC`

### cron-job.org

These are the only external jobs that should be enabled:

- `/api/cron/python-internal-worker` every minute
- `/api/cron/fairness-note` daily at `02:00 Europe/Stockholm`
- `/api/cron/health-check` every 3 hours
- `/api/cron/performance-check` daily at `06:00 Europe/Stockholm`

These should stay disabled externally:

- `/api/cron/fairness-report`
- `/api/cron/account-deletion-workflow`
- `/api/cron/send-deletion-reminders`
- `/api/cron/process-deletions`
- `/api/cron/refresh-matches`
- `/api/cron/sla-enforcement`

### Unscheduled Compatibility or Manual Routes

These routes may remain callable but should not be scheduled:

- `/api/cron/account-deletion-workflow`
- `/api/cron/send-deletion-reminders`
- `/api/cron/process-deletions`
- `/api/cron/generate-fairness-note`
- `/api/cron/weekly-digest` (currently returns `skipped`; weekly digest delivery is temporarily disabled)

## Required Environment

- `CRON_SECRET` for protected cron routes
- `CRON_API_KEY` for `npm run cron:sync`
- `SUPABASE_SERVICE_ROLE_KEY` for queue-backed workers
- `CV_IMPORT_PYTHON_EXTRACT_TIMEOUT_MS` for the worker-side Python extract timeout budget
- `CV_IMPORT_WORKER_WAKE_TIMEOUT_MS` for the best-effort wake call budget
- `CV_IMPORT_WORKER_REWAKE_AFTER_MS` for the stale-queue re-wake threshold
- `MATCHING_REFRESH_WORKER_BATCH_SIZE=100` unless production sizing proves a different value is needed

## CV Import Worker Behavior

- CV PDF extraction is Python-only. The browser no longer falls back to local PDF parsing or OCR in this flow.
- `POST /api/expertise/cv-import/wizard-extract` now does two things:
  - stages the upload and enqueues `document_intelligence_extract_only`
  - best-effort wakes `/api/cron/python-internal-worker` immediately so the user does not wait for the next cron tick
- `GET /api/expertise/cv-import/wizard-extract/status` is read-only again.
  - it may best-effort re-wake the worker for stale queued jobs
  - it does not execute extraction inline

## External Scheduler Sync

Use the repo as the source of truth for cron-job.org:

```bash
npm run cron:sync
```

The sync script:

- keeps the intended external jobs enabled
- keeps `fairness-report` disabled
- disables retired or overlapping external jobs

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
curl -i -H "Authorization: Bearer $CRON_SECRET" https://proofound.io/api/cron/python-internal-worker
curl -i -H "Authorization: Bearer $CRON_SECRET" https://proofound.io/api/cron/fairness-note
curl -i -H "Authorization: Bearer $CRON_SECRET" https://proofound.io/api/cron/performance-check
curl -i https://proofound.io/api/cron/health-check
```

## Troubleshooting

- `401 Unauthorized`
  - Check the `Authorization: Bearer $CRON_SECRET` header for protected routes.
- `500` on `python-internal-worker`
  - Check `PYTHON_INTERNAL_JOBS_ENABLED`, internal service secrets, and the `python_internal_jobs` queue.
  - CV import uploads now best-effort wake the worker immediately, so repeated queue stalls usually point to worker auth, queue state, or the Python extract path itself.
- `refresh-matches-worker` leaves backlog behind
  - Increase `MATCHING_REFRESH_WORKER_BATCH_SIZE` or concurrency before adding more schedulers.
- `fairness-report` showing failed externally
  - Expected if the disabled job still has an old last run. Leave it disabled.
- `sla-enforcement` looks stale in cron-job.org
  - If the live route succeeds, wait for the next scheduled run. cron-job.org does not expose a run-now API.
