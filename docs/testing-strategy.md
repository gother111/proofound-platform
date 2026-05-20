> Doc Class: `active`
> Last Verified: `2026-05-19`

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
  - `npm run test:e2e:org-trust:smoke`
  - `npm run test:e2e:mobile`

### 5) Strict MVP Launch Contracts (Playwright)

- Canonical strict specs:
  - `e2e/strict/individual.strict.spec.ts`
  - `e2e/strict/organization.strict.spec.ts`
  - `e2e/strict/privacy.strict.spec.ts`
- Commands:
  - `npm run test:e2e:individual:strict`
  - `npm run test:e2e:org:strict`
  - `npm run test:e2e:privacy:strict`
  - `npm run test:e2e:strict:all`
  - `npm run test:strict:quality`
- Provider-connected advisory:
  - `npm run test:e2e:providers:advisory`

### 6) Accessibility Contracts (Playwright + axe)

- Canonical location:
  - `tests/a11y/*.spec.ts`
- Commands:
  - `npm run test:a11y`
  - `npm run test:a11y:strict`

### 7) Ops Gates

- Launch smoke:
  - `npm run test:launch:smoke`
- Launch synthetic monitors:
  - `npm run monitor:launch`
- Performance budgets:
  - `npm run perf:budgets`
- Go / No-Go:
  - `BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run go:no-go`
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

| Goal                    | Command                                                                           |
| ----------------------- | --------------------------------------------------------------------------------- |
| Lint                    | `npm run lint`                                                                    |
| Typecheck               | `npm run typecheck`                                                               |
| Unit/API baseline       | `npm run test`                                                                    |
| Build                   | `npm run build`                                                                   |
| E2E full suite          | `npm run test:e2e`                                                                |
| Auth contract (mock)    | `npm run test:e2e:auth`                                                           |
| Auth contract (real)    | `npm run test:e2e:auth:real`                                                      |
| Seed public org trust   | `npm run seed:public-org-trust-fixture`                                           |
| Org trust smoke         | `npm run test:e2e:org-trust:smoke`                                                |
| A11y baseline           | `npm run test:a11y`                                                               |
| A11y strict             | `npm run test:a11y:strict`                                                        |
| Strict quality guard    | `npm run test:strict:quality`                                                     |
| Strict individual flow  | `npm run test:e2e:individual:strict`                                              |
| Strict org flow         | `npm run test:e2e:org:strict`                                                     |
| Strict privacy flow     | `npm run test:e2e:privacy:strict`                                                 |
| Provider advisory flow  | `npm run test:e2e:providers:advisory`                                             |
| Privacy/RLS baseline    | `npm run test:privacy`                                                            |
| Privacy/RLS extended    | `npm run test:privacy:extended`                                                   |
| Launch smoke contract   | `npm run test:launch:smoke`                                                       |
| Launch monitor sweep    | `BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run monitor:launch` |
| Perf budget gate        | `BASE_URL=<production-candidate-url> npm run perf:budgets`                        |
| Go/No-Go gate           | `BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run go:no-go`       |
| Final launch validation | `BASE_URL=<production-candidate-url> npm run launch:validate`                     |

## Final Launch Validation

Use `npm run launch:validate` for the locked MVP pilot's final engineering evidence pass.
It writes a dated artifact directory at `.artifacts/launch-validation-YYYY-MM-DD/` with:

- `launch-gate-status.md`
- `commands.json`
- one redacted log per command that actually ran

The broader evidence-backed operational checklist is generated separately with
`npm run launch:checklist` and owns `final-launch-checklist-status.md` plus
`final-launch-checklist-status.json`.

The command runs the launch-critical gates in this order: deploy readiness, lint, typecheck,
production build, launch surface inventory, launch page inventory, privacy/RLS, upload privacy,
organization corridor workflow, export/delete, strict org corridor E2E when the environment has the
required real Supabase/site settings, launch smoke when `BASE_URL` is set, then
`npm audit --omit=dev`.

`FAIL` and `UNVERIFIED` are not treated as pass states. Any P0 `FAIL` or `UNVERIFIED` produces a
`NO_GO` verdict and a non-zero exit. `NOT APPLICABLE` is reserved for gates whose trigger is
intentionally absent, such as launch smoke when `BASE_URL` is not configured.

Local run:

```bash
npm run launch:validate
```

Staging or local production-server run:

```bash
BASE_URL=<production-candidate-url> npm run launch:validate
```

For strict org corridor E2E to run instead of reporting `UNVERIFIED`, the environment must use real
Supabase settings and must not set `NEXT_PUBLIC_USE_MOCK_SUPABASE=true`.

## Launch Gate Baseline (Local Parity)

Default sequence for high-confidence release validation. Local parity runs may use
`http://localhost:3000`; production signoff must use the intended production-candidate URL and
fresh backup/restore evidence from `docs/production-readiness-checklist.md`.

1. `npm run audit:prod`
2. `npm run audit:all`
3. `npm run lint`
4. `npm run typecheck`
5. `npm run test`
6. `npm run build`
7. `npm run test:launch:smoke`
8. `npm run seed:public-org-trust-fixture`
9. `npm run test:e2e:org-trust:smoke`
10. `npm run test:e2e:landing`
11. `npm run test:e2e:auth:real`
12. `npm run test:a11y:strict`
13. `npm run test:strict:quality`
14. `npm run test:e2e:individual:strict`
15. `npm run test:e2e:org:strict`
16. `npm run test:e2e:privacy:strict`
17. `BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run monitor:launch`
18. `BASE_URL=<production-candidate-url> npm run perf:budgets`
19. `npm run db:backup:checkpoint`
20. `npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json`
21. `BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run go:no-go`

Run `npm run test:e2e:providers:advisory` only when connected-provider scheduling is intentionally
in scope for the target.

## Environment Requirements for Strict Flows

Strict flows require real env values. The provider advisory command defaults to
`STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=false`, which still checks provider connect fail-closed
behavior and manual-link fallback posture. Provider-connected runs require
`STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=true` plus deterministic provider credentials only for the
provider flows intentionally in scope for the target; manual-link interview posture remains the locked MVP default. See:

- `agent/runbooks/setup.md`
- `agent/checklists/verification.md`
- `scripts/run-mvp-strict-gates.mjs`

## Canonical Ownership of MVP Flow Evidence

- Auth strict: `e2e/auth.real.spec.ts`
- Individual strict: `e2e/strict/individual.strict.spec.ts`
- Organization strict: `e2e/strict/organization.strict.spec.ts`
- Privacy strict: `e2e/strict/privacy.strict.spec.ts`
- Provider advisory: `e2e/strict/providers.strict.spec.ts`
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
