> Doc Class: `reference-spec`
> Last Verified: `2026-02-26`

# Manual Testing Checklist

## Setup

- [ ] `npm run dev` running
- [ ] Required env vars configured
- [ ] Clean browser session ready

## Public/Auth

- [ ] `/` renders and CTAs route correctly
- [ ] `/signup` works for individual and organization personas
- [ ] `/login` success and invalid-credential paths work
- [ ] `/reset-password` form validates and submits
- [ ] `/verify-email` valid/invalid token paths are handled

## Individual

- [ ] `/app/i/home` loads without runtime errors
- [ ] `/app/i/profile` edits persist
- [ ] `/app/i/expertise` interactions work
- [ ] `/app/i/matching` setup and actions work
- [ ] `/app/i/messages` and `/app/i/interviews` load
- [ ] `/app/i/settings/*` renders and saves where applicable

## Organization

- [ ] `/app/o/<slug>/home` loads
- [ ] `/app/o/<slug>/profile` edits persist
- [ ] `/app/o/<slug>/members` role/invite paths behave correctly
- [ ] `/app/o/<slug>/assignments` create/publish flow works
- [ ] `/app/o/<slug>/matching` renders results/actions

## Admin

- [ ] `/admin` and core admin routes load
- [ ] Non-admin access is denied

## Accessibility

- [ ] Skip-link behavior works on public routes
- [ ] Keyboard-only navigation succeeds on critical flows
- [ ] Focus indicators are visible
- [ ] No blocking a11y violations in manual pass

## Performance and Stability

- [ ] No critical console errors on happy paths
- [ ] No repeated failing network calls in core flows
- [ ] Route transitions are responsive

## Data Integrity

- [ ] Core entities persist after refresh (profile/org/assignment)
- [ ] Visibility and verification states persist as expected

## Companion Automated Checks (Recommended)

- [ ] `npm run test`
- [ ] `npm run test:e2e:auth:real`
- [ ] `npm run test:e2e:individual:strict`
- [ ] `npm run test:e2e:org:strict`
- [ ] `npm run test:e2e:privacy:strict`
- [ ] `npm run test:e2e:providers:strict`
- [ ] `npm run test:a11y:strict`
