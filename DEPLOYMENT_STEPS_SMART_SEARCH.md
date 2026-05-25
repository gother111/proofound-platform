> Doc Class: `historical`
> Last Verified: `2026-05-19`

# Smart Search Deployment Steps - Historical

This file is retained only as historical context for the old Expertise Atlas smart-search rollout.
It is not active launch guidance.

Current launch truth:

- `/app/i/expertise` and the broad Expertise Atlas UI are archived outside the locked MVP corridor.
- Active MVP user proof work routes through onboarding, Proof Packs, proof upload/linking,
  verification requests, public portfolio publishing, organization assignments, candidate proof
  review, reveal consent, interviews, decisions, and engagement verification.
- Retained taxonomy and narrow user-skill/proof APIs are documented in
  [`docs/EXPERTISE_ATLAS_SETUP.md`](docs/EXPERTISE_ATLAS_SETUP.md).
- Production and production-candidate database changes must use the current migration runbooks:
  [`APPLY_MIGRATIONS_MANUAL.md`](APPLY_MIGRATIONS_MANUAL.md) and
  [`RUN_MIGRATIONS_GUIDE.md`](RUN_MIGRATIONS_GUIDE.md).

Do not use this historical note to:

- deploy the old Expertise tab,
- run direct Supabase schema-push commands or dashboard SQL paste as production evidence,
- hard-code a Supabase project ref,
- add launch tests for retired smart-search UI behavior,
- treat typo-tolerant Expertise Atlas search as part of the locked MVP corridor.

For current launch evidence, use
[`docs/production-readiness-checklist.md`](docs/production-readiness-checklist.md),
[`docs/release-checklist.md`](docs/release-checklist.md), and the active sweep artifact at
[`./.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md`](./.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md).
