> Doc Class: `active`
> Last Verified: `2026-05-19`

# E2E Matrix (Current)

This matrix maps personas and critical flows to canonical Playwright contracts.

## Canonical Suites

- `e2e/auth.real.spec.ts`
- `e2e/auth.spec.ts`
- `e2e/strict/individual.strict.spec.ts`
- `e2e/strict/organization.strict.spec.ts`
- `e2e/strict/privacy.strict.spec.ts`
- `e2e/strict/providers.strict.spec.ts`
- `e2e/landing-page.spec.ts`
- `e2e/landing-visual.spec.ts`
- `e2e/public-org-trust.smoke.spec.ts`
- `e2e/admin-dashboard-smoke.spec.ts`

## Persona Coverage

### Individual

- Auth and onboarding contracts:
  - `e2e/auth.real.spec.ts`
  - `e2e/auth.spec.ts`
  - `e2e/onboarding.spec.ts`
- Strict MVP flows I-01..I-20:
  - `e2e/strict/individual.strict.spec.ts`
- Privacy and reveal semantics:
  - `e2e/strict/privacy.strict.spec.ts`
- Provider scheduling advisory:
  - `e2e/strict/providers.strict.spec.ts`

### Organization

- Auth and onboarding contracts:
  - `e2e/auth.real.spec.ts`
  - `e2e/auth.spec.ts`
  - `e2e/onboarding.spec.ts`
- Strict MVP flows O-01..O-20:
  - `e2e/strict/organization.strict.spec.ts`
- Provider scheduling advisory:
  - `e2e/strict/providers.strict.spec.ts`

### Admin

- Admin route smoke:
  - `e2e/admin-dashboard-smoke.spec.ts`
- Archived admin/fairness route behavior is covered by route-surface tests; the old org fairness-note E2E is archived under `e2e/archive/non_mvp_org_analytics/`.

## Cross-Cutting Coverage

- Landing and visual baseline:
  - `e2e/landing-page.spec.ts`
  - `e2e/landing-visual.spec.ts`
- Public org trust runtime smoke:
  - `e2e/public-org-trust.smoke.spec.ts`
- Accessibility:
  - `tests/a11y/critical-flows.spec.ts`
  - `tests/a11y/keyboard-navigation.spec.ts`
  - `tests/a11y/authenticated.strict.spec.ts`

## Commands

- Full Playwright sweep: `npm run test:e2e`
- Auth mock smoke: `npm run test:e2e:auth`
- Auth real contract: `npm run test:e2e:auth:real`
- Seeded public org trust smoke: `npm run seed:public-org-trust-fixture` then `npm run test:e2e:org-trust:smoke`
- Strict flows:
  - `npm run test:e2e:individual:strict`
  - `npm run test:e2e:org:strict`
  - `npm run test:e2e:privacy:strict`
- Provider advisory:
  - `npm run test:e2e:providers:advisory`
- Landing:
  - `npm run test:e2e:landing`
  - `npm run test:e2e:landing:visual`

## Evidence Source of Truth

For launch-go/no-go evidence and ordering, use:

- `agent/checklists/verification.md`
- `project/MVP_FLOW_MATRIX_2026-02-12.md`
