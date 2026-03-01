> Doc Class: `active`
> Last Verified: `2026-03-01`

# Testing Strategy

## Purpose

This document defines the current testing architecture for Proofound and the command surface that must stay in sync with `package.json`, `e2e/**`, `tests/**`, and `agent/checklists/verification.md`.

## Current Test Architecture

### 1) Unit and Library Tests (Vitest)

- Scope: pure logic, component behavior, API helpers, domain services.
- Canonical locations:
  - `tests/lib/**/*.test.ts`
  - `tests/actions/**/*.test.ts`
  - `tests/ui/**/*.test.tsx`
  - `src/**/__tests__/*.test.ts`
- Run:
  - `npm run test`

### 2) API Contract Tests (Vitest)

- Scope: route contracts, auth/error handling, payload shape, regression checks.
- Canonical location:
  - `tests/api/**/*.test.ts`
- Run:
  - `npm run test`

### 3) Privacy and RLS Tests (Vitest + Supabase config)

- Scope: RLS isolation, policy enforcement, privacy semantics.
- Canonical location:
  - `tests/privacy/**/*.test.ts`
- Run:
  - `npm run test:privacy`
  - `npm run test:privacy:extended`
  - `npm run test:privacy:all`

### 4) E2E Contracts (Playwright)

- Canonical suite root:
  - `e2e/**/*.spec.ts`
- Core command:
  - `npm run test:e2e`
- Focused contracts:
  - `npm run test:e2e:landing`
  - `npm run test:e2e:landing:visual`
  - `npm run test:e2e:auth` (alias to mock auth flow)
  - `npm run test:e2e:auth:mock`
  - `npm run test:e2e:auth:real`
  - `npm run test:e2e:mobile`

### 5) Strict MVP Launch Contracts (Playwright)

- Canonical strict specs:
  - `e2e/strict/individual.strict.spec.ts`
  - `e2e/strict/organization.strict.spec.ts`
  - `e2e/strict/privacy.strict.spec.ts`
  - `e2e/strict/providers.strict.spec.ts`
- Commands:
  - `npm run test:e2e:individual:strict`
  - `npm run test:e2e:org:strict`
  - `npm run test:e2e:privacy:strict`
  - `npm run test:e2e:providers:strict`
  - `npm run test:e2e:strict:all`
  - `npm run test:strict:quality`

### 6) Accessibility Contracts (Playwright + axe)

- Canonical location:
  - `tests/a11y/*.spec.ts`
- Commands:
  - `npm run test:a11y`
  - `npm run test:a11y:strict`

### 7) Ops Gates

- Performance budgets:
  - `npm run perf:budgets`
- Go / No-Go:
  - `npm run go:no-go`
- End-to-end strict gate runner:
  - `npm run gates:mvp:strict`

### 8) UI Refactor Contract Regressions (Fast)

- Scope: fast UI contracts that catch common runtime and integration regressions after dashboard, matching, and interview UI refactors.
- Canonical tests:
  - `tests/ui/dashboard-client.test.tsx`
  - `tests/ui/matching-page-gated.test.tsx`
  - `tests/ui/schedule-interview-modal.test.tsx`
  - `tests/ui/organization-interviews-page-actions.test.tsx`
- Focused run command:
  - `npm run test -- tests/ui/dashboard-client.test.tsx tests/ui/matching-page-gated.test.tsx tests/ui/schedule-interview-modal.test.tsx tests/ui/organization-interviews-page-actions.test.tsx`
- Source change record:
  - `project/changes/entries/2026-03-01T09-42-33Z__master__d9a1a144.md`

## Command Matrix

| Goal                   | Command                                                                   |
| ---------------------- | ------------------------------------------------------------------------- |
| Lint                   | `npm run lint`                                                            |
| Typecheck              | `npm run typecheck`                                                       |
| Unit/API baseline      | `npm run test`                                                            |
| Build                  | `npm run build`                                                           |
| E2E full suite         | `npm run test:e2e`                                                        |
| Auth contract (mock)   | `npm run test:e2e:auth`                                                   |
| Auth contract (real)   | `npm run test:e2e:auth:real`                                              |
| A11y baseline          | `npm run test:a11y`                                                       |
| A11y strict            | `npm run test:a11y:strict`                                                |
| Strict quality guard   | `npm run test:strict:quality`                                             |
| Strict individual flow | `npm run test:e2e:individual:strict`                                      |
| Strict org flow        | `npm run test:e2e:org:strict`                                             |
| Strict privacy flow    | `npm run test:e2e:privacy:strict`                                         |
| Strict providers flow  | `npm run test:e2e:providers:strict`                                       |
| Privacy/RLS baseline   | `npm run test:privacy`                                                    |
| Privacy/RLS extended   | `npm run test:privacy:extended`                                           |
| Perf budget gate       | `BASE_URL=http://localhost:3000 npm run perf:budgets`                     |
| Go/No-Go gate          | `BASE_URL=http://localhost:3000 SUS_STUDY_COMPLETE=true npm run go:no-go` |

## Launch Gate Baseline (Local Parity)

Default sequence for high-confidence release validation:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run test`
4. `npm run build`
5. `npm run test:e2e:landing`
6. `npm run test:e2e:auth:real`
7. `npm run test:a11y:strict`
8. `npm run test:strict:quality`
9. `npm run test:e2e:individual:strict`
10. `npm run test:e2e:org:strict`
11. `npm run test:e2e:privacy:strict`
12. `npm run test:e2e:providers:strict`
13. `BASE_URL=http://localhost:3000 npm run perf:budgets`
14. `BASE_URL=http://localhost:3000 SUS_STUDY_COMPLETE=true npm run go:no-go`

## Environment Requirements for Strict Flows

Strict flows require real env values and deterministic provider credentials. See:

- `agent/runbooks/setup.md`
- `agent/checklists/verification.md`
- `scripts/run-mvp-strict-gates.mjs`

## Canonical Ownership of MVP Flow Evidence

- Auth strict: `e2e/auth.real.spec.ts`
- Individual strict: `e2e/strict/individual.strict.spec.ts`
- Organization strict: `e2e/strict/organization.strict.spec.ts`
- Privacy strict: `e2e/strict/privacy.strict.spec.ts`
- Provider strict: `e2e/strict/providers.strict.spec.ts`
- Strict anti-placeholder guard: `scripts/check-strict-e2e-quality.mjs`

## Notes on Legacy Paths

- `tests/e2e/**` exists as legacy/reference test assets.
- Release-gating Playwright runs are driven by `e2e/**` and npm scripts in `package.json`.

## Change Policy

When adding or changing a test command, suite, or gate:

1. Update `package.json` scripts first.
2. Update `agent/checklists/verification.md`.
3. Update this file and QA docs (`docs/qa/*`).
4. Run `npm run docs:freshness`.
