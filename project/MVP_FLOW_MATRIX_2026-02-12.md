# MVP Flow Matrix (I-01..I-20, O-01..O-20)

Date: 2026-02-12
Last updated: 2026-02-12 (strict provider enforcement)

## Truth Freeze (Strict Evidence Only)

Primary strict commands run:

1. `npm run lint` -> pass
2. `npm run typecheck` -> pass
3. `npm run test` -> pass
4. `npm run test:strict:quality` -> pass
5. `npm run test:e2e:landing` -> pass
6. `npm run test:e2e:auth:real` -> pass
7. `npm run test:a11y:strict` -> pass
8. `npm run test:e2e:individual:strict` -> pass
9. `npm run test:e2e:org:strict` -> pass
10. `npm run test:e2e:privacy:strict` -> pass
11. `npm run test:e2e:providers:strict` -> fail (strict mode now requires deterministic managed user with both Zoom + Google connected)
12. `BASE_URL=http://localhost:40123 npm run perf:budgets` -> pass
13. `BASE_URL=http://localhost:40123 SUS_STUDY_COMPLETE=true npm run go:no-go` -> pass
14. `npm run gates:mvp:strict -- --env-file <path-to-env.local> --port 40123` -> fail at provider strict gate

Status labels:

- `implemented+verified`: flow has strict executable behavior assertions that passed.
- `implemented+unverified`: flow exists but strict behavior contract has not been proven.
- `stubbed`: no meaningful executable strict contract.
- `broken`: strict contract exists and currently fails.

## Canonical Strict Ownership

- Auth strict owner: `e2e/auth.real.spec.ts`
- Individual strict owner: `e2e/strict/individual.strict.spec.ts`
- Organization strict owner: `e2e/strict/organization.strict.spec.ts`
- Privacy/Security strict owner: `e2e/strict/privacy.strict.spec.ts`
- Provider strict owner: `e2e/strict/providers.strict.spec.ts`
- Strict quality guard: `scripts/check-strict-e2e-quality.mjs`

## Weak/Placeholder Guard Status

`npm run test:strict:quality` now blocks required strict specs on:

- `expect(true)` placeholders
- `.skip` / `.fixme`
- URL-only `toHaveURL(...)` contract assertions
- auth fallback `/auth/login` shortcut assertions

## Individual Flows

| Flow                                       | Canonical strict evidence                                                     | Status               |
| ------------------------------------------ | ----------------------------------------------------------------------------- | -------------------- |
| I-01 Authenticate                          | `e2e/auth.real.spec.ts`                                                       | implemented+verified |
| I-02 Consent & Policies                    | `e2e/auth.real.spec.ts`                                                       | implemented+verified |
| I-03 Guided Onboarding                     | `e2e/strict/individual.strict.spec.ts`                                        | implemented+verified |
| I-04 Profile Basics                        | `e2e/strict/individual.strict.spec.ts`                                        | implemented+verified |
| I-05 Experience & Education                | `e2e/strict/individual.strict.spec.ts`                                        | implemented+verified |
| I-06 Mission / Vision / Values             | `e2e/strict/individual.strict.spec.ts`                                        | implemented+verified |
| I-07 Build Expertise Atlas                 | `e2e/strict/individual.strict.spec.ts`                                        | implemented+verified |
| I-08 Attach Proofs                         | `e2e/strict/individual.strict.spec.ts`                                        | implemented+verified |
| I-09 Request Verification                  | `e2e/strict/individual.strict.spec.ts`                                        | implemented+verified |
| I-10 Matching Preferences                  | `e2e/strict/individual.strict.spec.ts`                                        | implemented+verified |
| I-11 Recommended Feed                      | `e2e/strict/individual.strict.spec.ts`                                        | implemented+verified |
| I-12 Search & Filter                       | `e2e/strict/individual.strict.spec.ts`                                        | implemented+verified |
| I-13 Assignment Detail                     | `e2e/strict/individual.strict.spec.ts`                                        | implemented+verified |
| I-14 Apply / Express Interest              | `e2e/strict/individual.strict.spec.ts`                                        | implemented+verified |
| I-15 Messaging                             | `e2e/strict/individual.strict.spec.ts`                                        | implemented+verified |
| I-16 Schedule Interview                    | `e2e/strict/individual.strict.spec.ts`, `e2e/strict/providers.strict.spec.ts` | broken               |
| I-17 Accept Offer                          | `e2e/strict/individual.strict.spec.ts`                                        | implemented+verified |
| I-18 Deliverables & Milestones             | `e2e/strict/individual.strict.spec.ts`                                        | implemented+verified |
| I-19 Post-Engagement Verification & Review | `e2e/strict/individual.strict.spec.ts`                                        | implemented+verified |
| I-20 Account & Privacy                     | `e2e/strict/individual.strict.spec.ts`, `e2e/strict/privacy.strict.spec.ts`   | implemented+verified |

## Organization Flows

| Flow                               | Canonical strict evidence                                                       | Status               |
| ---------------------------------- | ------------------------------------------------------------------------------- | -------------------- |
| O-01 Authenticate                  | `e2e/auth.real.spec.ts`                                                         | implemented+verified |
| O-02 Org Setup & Team Roles        | `e2e/strict/organization.strict.spec.ts`                                        | implemented+verified |
| O-03 Verify Org & Consent          | `e2e/strict/organization.strict.spec.ts`                                        | implemented+verified |
| O-04 Org Profile                   | `e2e/strict/organization.strict.spec.ts`                                        | implemented+verified |
| O-05 Create Assignment             | `e2e/strict/organization.strict.spec.ts`                                        | implemented+verified |
| O-06 Matching Weights & Gates      | `e2e/strict/organization.strict.spec.ts`                                        | implemented+verified |
| O-07 Publish Assignment            | `e2e/strict/organization.strict.spec.ts`                                        | implemented+verified |
| O-08 View Ranked Matches           | `e2e/strict/organization.strict.spec.ts`                                        | implemented+verified |
| O-09 Candidate Deep-Dive           | `e2e/strict/organization.strict.spec.ts`                                        | implemented+verified |
| O-10 Shortlist (Stages)            | `e2e/strict/organization.strict.spec.ts`                                        | implemented+verified |
| O-11 Messaging                     | `e2e/strict/organization.strict.spec.ts`                                        | implemented+verified |
| O-12 Schedule Interviews           | `e2e/strict/organization.strict.spec.ts`, `e2e/strict/providers.strict.spec.ts` | broken               |
| O-13 Interview Feedback & Decision | `e2e/strict/organization.strict.spec.ts`                                        | implemented+verified |
| O-14 Send Offer / Confirm Scope    | `e2e/strict/organization.strict.spec.ts`                                        | implemented+verified |
| O-15 Approve Deliverables          | `e2e/strict/organization.strict.spec.ts`                                        | implemented+verified |
| O-16 Issue Verifications           | `e2e/strict/organization.strict.spec.ts`                                        | implemented+verified |
| O-17 Manage Assignments            | `e2e/strict/organization.strict.spec.ts`                                        | implemented+verified |
| O-18 Team & Permissions            | `e2e/strict/organization.strict.spec.ts`                                        | implemented+verified |
| O-19 Analytics Snapshot            | `e2e/strict/organization.strict.spec.ts`                                        | implemented+verified |
| O-20 Org Admin & Compliance        | `e2e/strict/organization.strict.spec.ts`                                        | implemented+verified |

## Required Scenario Coverage Snapshot

1. Auth positive/negative flows: pass via `e2e/auth.real.spec.ts`.
2. Individual core flows: pass via `e2e/strict/individual.strict.spec.ts`.
3. Organization core flows: pass via `e2e/strict/organization.strict.spec.ts`.
4. Privacy/security (RLS, visibility, CSRF, staged reveal): pass via `e2e/strict/privacy.strict.spec.ts`.
5. Ops (`/api/health`, perf budgets, go/no-go): pass.
6. Real provider E2E (Zoom/Google/LinkedIn): fail in strict mode because deterministic provider user env and dual connected provider state are missing in runtime.

## Launch Readiness Call (As of 2026-02-12)

- Strict gate stack is **not fully green** because real provider strict gate fails under dual-provider requirement.
- Current matrix status counts:
  - `implemented+verified`: 38
  - `implemented+unverified`: 0
  - `stubbed`: 0
  - `broken`: 2 (`I-16`, `O-12` under real-provider policy)
- MVP 100% readiness is **not yet reached** until strict provider gate passes with connected real provider accounts.
