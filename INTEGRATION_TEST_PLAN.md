> Doc Class: `reference-spec`
> Last Verified: `2026-05-19`
> Reference note: current integration-test orientation only. Archived/post-MVP suites are not launch evidence unless the locked MVP authority stack reactivates them.

# Integration Test Plan

## Purpose

Define integration-level verification paths aligned with the current test suite and route contracts.

## Canonical Integration Test Locations

- `tests/integration/matching.test.ts`
- `tests/integration/data-portability.test.ts`
- `tests/integration/evidence-pack.test.ts`
- Historical `critical-gaps` and CV import wizard tests live under `tests/archive/` and are not launch gates.

## Supporting API Contract Coverage

- `tests/api/**/*.test.ts`

## Execution Commands

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

- Matching feed and gating routes produce deterministic/valid responses.
- Assignment creation, publish, and match-interest flows behave correctly.

### 3) Verification and Proofs Contracts

- Work-email and skill verification APIs enforce expected auth/validation.
- Verification status route reflects expected state transitions.

### 4) Privacy and RLS Contracts

- RLS tests prove no cross-user leakage.
- Visibility controls and redaction semantics stay intact.

### 5) Mobile API Contracts

- `/api/mobile/v1/*` bootstrap and device token routes remain compatible.

## Exit Criteria

- Required commands pass.
- No failing integration/API/privacy tests.
- No regression in strict flow gate assumptions referenced in `agent/checklists/verification.md`.
