# Project Change Entry

- Date/time (UTC): 2026-02-23T13:19:21Z
- Branch: codex-simplify-lite-activation-requirement
- Base commit: 6d7ea313
  What changed:
- Updated PRD documentation to explicitly capture Lite activation soft-gating behavior and current matching API contract.
- Added non-blocking activation language in:
  - `PRD_for_a_web_platform_MVP.md`
  - `PRD_TECHNICAL_REQUIREMENTS.md`
  - `Proofound_PRD_MVP.md`
- Added/updated acceptance details for `200 + eligibility + topActions` soft-gate responses and baseline matching profile auto-bootstrap behavior.

Why:

- Product and implementation now allow immediate matching usage with guidance instead of hard blocking.
- PRD docs needed to align with shipped behavior before merging.

How to verify:

- `rg -n "soft-gat|non-blocking|meta.softGated|auto-bootstraps" PRD_for_a_web_platform_MVP.md PRD_TECHNICAL_REQUIREMENTS.md Proofound_PRD_MVP.md`
- `npm run docs:freshness` (PASS with existing warnings only)
- `npm run db:migrate` (FAILED in this environment: missing `DIRECT_URL`/`DATABASE_URL`)

Open risks / TODO:

- Migration apply is blocked in this local environment until database connection env vars are configured.
