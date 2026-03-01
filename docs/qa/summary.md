> Doc Class: `active`
> Last Verified: `2026-03-01`

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

## Revamp Stabilization Validation (PRO-119, 2026-03-01)

- Source change record:
  - `project/changes/entries/2026-03-01T09-42-33Z__master__d9a1a144.md`
- Core command outcomes:
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run lint` (pass)
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run typecheck` (pass)
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test` (pass)
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run build` (pass)
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run db:drift-check` (pass)
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test:privacy` (pass)
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test:privacy:extended` (pass)
- Focused UI regression suite outcome:
  - `npm run test -- tests/ui/dashboard-client.test.tsx tests/ui/dashboard-status-chip-style.test.tsx tests/ui/matching-organization-view-beta.test.tsx tests/ui/schedule-interview-modal.test.tsx tests/ui/share-profile-dialog.test.tsx tests/ui/matching-page-gated.test.tsx tests/ui/organization-interviews-page-actions.test.tsx` (pass)

## Canonical Verification Checklist

- `agent/checklists/verification.md`
