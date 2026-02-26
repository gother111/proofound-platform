> Doc Class: `active`
> Last Verified: `2026-02-26`

# QA Summary

## Scope

This summary tracks the currently enforced QA automation surface and launch-gate ordering.

## Automated Coverage (Current)

- Unit/API baseline: `npm run test`
- Privacy baseline: `npm run test:privacy`
- E2E baseline: `npm run test:e2e`
- Auth contracts:
  - `npm run test:e2e:auth` (mock)
  - `npm run test:e2e:auth:real` (real runtime contract)
- A11y contracts:
  - `npm run test:a11y`
  - `npm run test:a11y:strict`
- Strict MVP contracts:
  - `npm run test:e2e:individual:strict`
  - `npm run test:e2e:org:strict`
  - `npm run test:e2e:privacy:strict`
  - `npm run test:e2e:providers:strict`
- Ops gates:
  - `BASE_URL=http://localhost:3000 npm run perf:budgets`
  - `BASE_URL=http://localhost:3000 SUS_STUDY_COMPLETE=true npm run go:no-go`

## Primary Suite Ownership

- Auth: `e2e/auth.real.spec.ts`
- Individual strict: `e2e/strict/individual.strict.spec.ts`
- Organization strict: `e2e/strict/organization.strict.spec.ts`
- Privacy strict: `e2e/strict/privacy.strict.spec.ts`
- Providers strict: `e2e/strict/providers.strict.spec.ts`
- A11y: `tests/a11y/*.spec.ts`

## Current Known Risks

- Provider strict flows require deterministic connected provider credentials and complete env setup.
- Launch strict runs can fail due to missing env vars or provider account readiness rather than functional regressions.
- `npm run db:push` remains dev-only and is not a production migration path.

## Canonical Verification Checklist

- `agent/checklists/verification.md`
