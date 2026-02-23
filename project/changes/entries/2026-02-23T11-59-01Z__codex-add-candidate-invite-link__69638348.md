# Project Change Entry

- Date/time (UTC): 2026-02-23T11:59:01Z
- Branch: codex-add-candidate-invite-link
- Base commit: 69638348
  What changed:
- Updated active PRD docs to reflect shipped BYOC candidate invite workflow:
  - `PRD_TECHNICAL_REQUIREMENTS.md`
  - `PRD_for_a_web_platform_MVP.md`
  - `Proofound_PRD_MVP.md`
- Documented invite lifecycle, Proof Card submission model, related API routes, and analytics events.
- Added this sharded change entry and a session entry for this follow-up docs/merge task.

Why:

- Keep product requirements aligned with implemented behavior before PR merge to `master`.
- Preserve governance traceability for migration attempt and release documentation changes.

How to verify:

- `npm run lint`
- `npm run typecheck`
- `npm run docs:freshness`
- Confirm PRD docs include BYOC candidate invite and Proof Card flow details.

Open risks / TODO:

- `npm run db:migrate` could not be applied in this environment because `DIRECT_URL`/`DATABASE_URL` are not configured.
- `npm run docs:freshness` reports pre-existing warnings unrelated to this change set:
  - orphan docs not listed in registry
  - legacy domain mention in `docs/ENV_VARIABLES.md`
