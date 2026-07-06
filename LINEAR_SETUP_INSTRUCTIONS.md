> Doc Class: `historical`
> Last Verified: `2026-05-19`

# Historical Linear Bulk Import Instructions

This file is preserved as history for the January 31, 2025 Linear bootstrap import. Do not use it
as current Proofound MVP launch planning guidance, issue taxonomy, or evidence that old epics remain
active launch scope.

The old flow imported a broad set of labels and issues from the archived
`docs/archive/status-reports/LINEAR_ORGANIZATION_PLAN.md` snapshot. That plan predates the locked
MVP corridor and includes broad dashboard, taxonomy, matching, and platform setup language that must
not override the current authority stack.

Current operator guidance:

- Use `agent/runbooks/proofound-ticket-finisher.md` for ticket closeout administration.
- Keep Linear mutation narrow and explicit; do not bulk-create or bulk-close issues from stale
  bootstrap docs.
- If Linear is used, tie every issue to the locked MVP corridor, internal launch-ops, archive, or
  post-MVP classification.
- Do not put API keys or tokens in tracked files.
- Do not use Linear state as product-truth authority when it conflicts with the locked MVP docs,
  current repo behavior, or fresh evidence.

The legacy import script is intentionally guarded. Running `scripts/import-linear-issues.mjs`
requires the explicit environment variable `PROOFOUND_ALLOW_LEGACY_LINEAR_IMPORT=true` and should
only be used after confirming that the historical bulk import is still desired.
