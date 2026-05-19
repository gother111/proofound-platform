# Quick Start

> Doc Class: `active`
> Last Verified: `2026-05-19`

This is the launch-safe local quick start for the locked Proofound MVP corridor.
It is for local setup and smoke checks only. Do not use this file to apply
production migrations, change Supabase project settings, or broaden scope beyond
the proof-first hiring corridor.

For database migration operations, use the current migration runbooks instead:

- `APPLY_MIGRATIONS_MANUAL.md`
- `RUN_MIGRATIONS_GUIDE.md`
- `SETUP_SUPABASE.md`
- `agent/runbooks/setup.md`

## 1. Install

Use the pinned Node/npm versions:

```bash
nvm use
npm ci
```

The repo expects Node `24.x`, npm `11.12.1`, and `engine-strict=true`.

## 2. Configure Local Environment

Create or update `.env.local` from your local/private environment source. Do not
commit secrets or paste secret values into docs.

Minimum local web-app variables are documented in:

- `docs/ENV_VARIABLES.md`
- `README.md`
- `agent/runbooks/setup.md`

Connected provider credentials are target-scoped. Manual meeting links remain
the locked MVP default for interview scheduling.

## 3. Run The App

```bash
npm run dev
```

Open the local URL printed by the dev server.

Representative launch-safe routes to smoke:

- `/`
- `/signup`
- `/login`
- `/portfolio/demo`
- `/portfolio/org/test-org`
- `/onboarding`
- `/app/i/portfolio`
- `/app/i/verifications`
- `/app/i/settings/privacy`
- `/app/o/test-org/assignments`
- `/admin`
- `/admin/verification`
- `/admin/audit`

Protected routes should fail closed when the required mock/auth context is not
active. Public missing portfolio links should render the generic unavailable
surface rather than a blank page or private details.

## 4. MVP Feature Smoke

Keep the smoke focused on the active corridor:

- Public landing, signup, login, legal links, and public portfolio unavailable
  states.
- Individual onboarding, first Proof Pack, proof upload/import/linking,
  verification requests, privacy settings, export/delete, and public portfolio
  publishing.
- Organization onboarding, trust profile, assignments, candidate proof review,
  reason-coded matching, intro/reveal consent, interview manual-link scheduling,
  decisions, and engagement verification.
- Internal launch ops: operations queues, audit logs, and protected diagnostics.

Do not treat Zen/wellbeing, broad dashboard customization, broad admin users,
fairness dashboards, native Zoom/video OAuth, ATS/HRIS replacement, public
directory behavior, or marketplace scope as launch evidence.

## 5. Useful Checks

Run focused checks before broader gates:

```bash
npm run docs:freshness
npm run test:launch:routes
npm run lint
npm run typecheck
```

For the full launch-gate sequence, follow:

- `agent/checklists/verification.md`
- `docs/mvp-launch-master-checklist.md`
- `PRODUCTION_CHECKLIST.md`

If typecheck reports missing `.next-dev*/types` files, remove the stale local
generated dev-build directory and rerun typecheck. Do not commit `.next*`
artifacts.

## 6. Browser Verification

Use the Codex in-app Browser or Playwright for representative desktop and mobile
checks after UI changes. For this MVP, evidence should show:

- no runtime overlay or blank body
- no horizontal overflow on mobile
- clear primary object and next action
- no public leakage of private proof, queue, audit, reveal, or export data
- archived/post-MVP routes gated, unavailable, `404`, or `410` according to
  route policy

Current sweep evidence is saved under:

- `.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md`
