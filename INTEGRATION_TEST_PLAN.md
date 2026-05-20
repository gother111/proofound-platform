> Doc Class: `reference-spec`
> Last Verified: `2026-05-20`
> Reference note: current integration-test orientation only. Archived/post-MVP suites are not launch evidence unless the locked MVP authority stack reactivates them.

# Integration Test Plan

## Purpose

Define integration-level verification paths aligned with the current test suite and route contracts.
Current active integration tests are deterministic contract tests, not live-database smoke tests.

## Canonical Integration Test Locations

- `tests/integration/matching.test.ts`
- `tests/integration/data-portability.test.ts`
- Historical `critical-gaps`, CV import wizard, and donor/investor evidence-pack tests live under
  `tests/archive/` and are not launch gates.

## Supporting API Contract Coverage

- `tests/api/**/*.test.ts`

## Execution Commands

- Active integration contract slice:
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test:integration -- --reporter=verbose`
- Full baseline:
  - `npm run test`
- Privacy integration depth:
  - `npm run test:privacy`
  - `npm run test:privacy:extended`

## High-Priority Scenarios

### 1) Auth and Session Contracts

- Signup/login/reset/verify flows return correct route and error behavior.
- Callback and redirect URI contracts are stable.

### 2) Matching and Assignment Contracts

- Matching score artifacts enforce hard gates, deterministic ordering, proof-first reason codes, and no retired purpose-fit scoring.
- Matching feed and gating routes produce deterministic/valid responses through supporting API coverage.
- Assignment creation, publish, and match-interest flows behave correctly.

### 3) Verification and Proofs Contracts

- Work-email and skill verification APIs enforce expected auth/validation.
- Verification status route reflects expected state transitions.

### 4) Privacy and RLS Contracts

- RLS tests prove no cross-user leakage.
- Visibility controls and redaction semantics stay intact.

### 5) Archived Mobile API Boundary

- `/api/mobile/*` remains archived for the locked MVP route surface.
- Mobile planning docs are post-MVP reference only and must not be treated as launch API evidence.
- If a future approved route-surface change reactivates mobile routes, add focused contract tests in the same change.

### 6) Archived Evidence-Pack Boundary

- Donor/investor evidence-pack export is outside the locked MVP corridor.
- Archived implementation/reference tests live under `src/archive/non_launch_evidence_pack/` and
  `tests/archive/non_mvp_evidence_pack/`.
- No active integration test should imply an MVP evidence-pack API route exists unless the
  route-surface policy is updated in the same change.

## Exit Criteria

- Required commands pass.
- No failing integration/API/privacy tests.
- No regression in strict flow gate assumptions referenced in `agent/checklists/verification.md`.
