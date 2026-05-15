# Superseded Vercel Cron Limit Note

> Doc Class: `historical`
> Last Verified: `2026-05-14`

This document is preserved only as historical context for an old Vercel cron-limit workaround. It is not current launch or scheduler guidance.

Current cron truth lives in:

1. `docs/CRON_SETUP.md`
2. `scripts/lib/cron-job-org-config.mjs`
3. `vercel.json`
4. `tests/scripts/cron-scheduling.test.ts`
5. `src/lib/launch/surface-policy.ts`

Current scheduler summary:

- Vercel Cron owns the daily launch-critical automation routes.
- cron-job.org owns only the explicitly managed external observability jobs.
- Removed or archived cron routes are not active launch infrastructure.
- Historical fairness automation, weekly digest delivery, Python internal worker scheduling, and CV import temp cleanup must not be re-enabled from this note.
