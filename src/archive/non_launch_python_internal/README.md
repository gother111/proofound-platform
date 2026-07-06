# Archived Python Internal Worker Helpers

> Doc Class: `historical`
> Last Verified: `2026-05-19`

These TypeScript helpers backed the old Postgres-leased Python document-intelligence worker and CV import temp-storage flow.

The locked MVP launch corridor does not run `/api/cron/python-internal-worker` or `/api/cron/cv-import-temp-cleanup`; route-surface policy keeps those cron routes archived/removed from launch scheduling. Active import/proof evidence belongs to Start from CV, Proof Artifact Text Extraction, and direct route-policy checks for archived compatibility endpoints.

Keep this code archived unless the locked MVP authority stack explicitly reopens a queued Python document-intelligence worker as launch infrastructure.
