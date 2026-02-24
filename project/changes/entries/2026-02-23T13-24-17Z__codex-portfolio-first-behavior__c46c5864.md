# Project Change Entry

- Date/time (UTC): 2026-02-23T13:24:17Z
- Branch: codex-portfolio-first-behavior
- Base commit: c46c5864
  What changed:
- Split portfolio-first rollout into a behavior-only branch to satisfy landing PR scope guardrails.
- Applied non-landing files from commit `2d92755c`:
  - onboarding responses now include clean public portfolio URLs for individual and organization personas
  - new public organization route `/portfolio/org/[slug]`
  - new in-app portfolio convenience routes (`/app/i/portfolio`, `/app/o/[slug]/portfolio`)
  - onboarding completion flow now includes dedicated public portfolio ready step
  - first-run nav/tour/home copy now prioritizes portfolio-first day-1 value
  - added unit/UI tests for onboarding URL payloads and public org portfolio rendering
- Updated PRD docs to reflect portfolio-first positioning and route contracts:
  - `Proofound_PRD_MVP.md`
  - `PRD_TECHNICAL_REQUIREMENTS.md`
  - `PRD_for_a_web_platform_MVP.md`

Why:

- PR #227 failed CI (`check-landing-pr-scope`) because landing and non-landing files were mixed.
- Product direction requires day-1 shareable public portfolio as first promise for both personas.
- PRD docs needed alignment with shipped behavior and public URL contracts.

How to verify:

- `npm run lint`
- `npm run typecheck`
- `npm run test -- tests/api/portfolio-view-route.test.ts tests/portfolio-visibility.test.ts tests/portfolio-trust-signals.test.ts tests/actions/onboarding.test.ts tests/lib/public-organization-portfolio.test.ts tests/ui/public-org-portfolio-page.test.tsx tests/ui/public-portfolio-ready-step.test.tsx`
- `npm run build`
- `npm run db:drift-check`

Open risks / TODO:

- Landing copy updates are intentionally excluded from this branch and must ship via a dedicated landing-only PR.
- Build/test output still warns about missing `DATABASE_URL` and uses mock DB locally; production env validation remains required at deploy time.
