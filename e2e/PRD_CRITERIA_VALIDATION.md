# PRD Acceptance Criteria Validation

This reference is historical. It originally mapped a broader PRD to comprehensive browser tests, but it is not current launch evidence and must not override the locked MVP authority stack.

Current launch proof lives in the strict MVP E2E suites, route inventory tests, API/UI focused tests, and `.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md`. Retired Expertise Atlas, Zen, broad matching, purpose, fairness, and legacy integration flows remain archived or post-MVP unless a newer locked source explicitly brings them back.

## Test Coverage Summary

### Individual Features

#### F1 — Proof-First Profile Setup

**PRD Criteria:**

- [x] Individual Mission, Vision, Values, and Causes are retired from active MVP surfaces.
- [x] Profile setup centers on safe shell, context, skills, Proof Packs, and verification readiness.
- [x] Legacy individual purpose edit/audit surfaces are gone or return launch-safe `404/410`.
- [x] Individual purpose signals stay out of active MVP matching and Match Detail scoring.

**Test Coverage:**

- `e2e/strict/individual.strict.spec.ts`: proof-first individual corridor coverage
- `e2e/strict/privacy.strict.spec.ts`: individual privacy visibility excludes retired purpose fields
- Focused matching, readiness, and route-policy tests cover proof/context matching without retired purpose-fit scoring.
- Historical broad integration specs live under `e2e/archive/non_mvp_legacy_integration/`.

#### F2 — Customizable Dashboard

**PRD Criteria:**

- [x] Add/remove/reorder tiles; layout persists across sessions/devices
- [x] "Next Best Action" suggests at least one actionable step when TTFQI=∅

**Test Coverage:**

- Covered in existing dashboard tests (not in comprehensive tests, but structure exists)

#### F3 — Retired Expertise Atlas (L1→L4 + properties & proofs)

**PRD Criteria:**

- [x] Historical only: old broad skill-management UI and CV wizard behavior were once mapped here.
- [x] Current MVP replacement: skills are subordinate to context and Proof Packs, and `/app/i/expertise` is archived outside the launch corridor.
- [x] Current CV path: Start from CV and proof-artifact extraction, when enabled, remain private scaffolding or beta proof assistance rather than reactivating the old wizard.

**Test Coverage:**

- `e2e/archive/non_mvp_expertise_atlas/comprehensive-expertise.archived.ts`: historical L1-L4 navigation, skill creation, and old proof UI behavior.
- `e2e/cv-import-non-launch.spec.ts`: current hard gate proving `/app/i/expertise` stays unavailable and archived CV wizard APIs return launch-safe responses.
- Active Proof Pack, profile, verification, and Start from CV tests cover the launch-approved proof-first replacements.

#### F4 — Matching Hub (proof-first automated matching)

**PRD Criteria:**

- [x] Current MVP: organizations review proof-backed, privacy-safe matches with reason-code explanations.
- [x] Current MVP: intro, reveal, interview, decision, engage/close outcomes, and engagement verification stay inside the locked corridor.
- [x] Historical/post-MVP: broad marketplace matching, snooze-style queue management, and fairness-note product surfaces are not launch evidence.

**Test Coverage:**

- `e2e/strict/org-corridor.strict.spec.ts`: strict organization corridor.
- `npm run test:launch:workflow`: review, intro, reveal, interview, decision, engage/close outcomes, and engagement verification route behavior.
- `npm run test:launch:org-corridor`: organization match review and corridor contracts.
- Historical broad matching specs live under `e2e/archive/non_mvp_matching_pac/`.

#### F5 — Zen Hub

**PRD Criteria:**

- [x] Historical/post-MVP only. Zen/wellbeing surfaces are outside the locked launch corridor.
- [x] Current MVP requirement is narrower: wellbeing data must not affect matching or launch review.

**Test Coverage:**

- Current launch evidence comes from route-surface policy and absence from active launch navigation, not from a runnable Zen E2E suite.

#### F6 — Visibility & Boundary Controls

**PRD Criteria:**

- [x] Field-level visibility works end-to-end (public/link-only/match-only/private)
- [x] Redact mode hides name/photo in previews and cards

**Test Coverage:**

- `e2e/profile/comprehensive-profile.spec.ts`: Visibility & Boundary Controls tests
- `e2e/profile/comprehensive-profile.spec.ts`: Redact mode tests

#### F7 — Verification & Attestations (v1)

**PRD Criteria:**

- [x] Request attestation via magic link; status visible; reminders send
- [x] Assignment gates are displayed pre-intro; unmet gates block "Introduce"

**Test Coverage:**

- Active verification route, status/options UI, privacy, and workflow tests cover bounded verification and pre-intro gates.
- Historical Expertise Atlas verification UI tests live under archive and are not launch evidence.

### Organization Features

#### O1 — Purpose Block

**PRD Criteria:**

- Covered in organization-specific tests (not in individual comprehensive tests)

#### O6 — Enterprise Expertise Hub

**PRD Criteria:**

- Covered in organization-specific tests

#### O7 — Assignment Creation (5-step)

**PRD Criteria:**

- Covered in organization-specific tests

#### O8 — Company Dashboard

**PRD Criteria:**

- Covered in organization-specific tests

#### O9 — Team Management Hub

**PRD Criteria:**

- Covered in organization-specific tests

#### O10 — Organization Type Flag

**PRD Criteria:**

- Covered in organization-specific tests

## Performance Targets (PRD Part 8)

### API Performance

- [ ] API P95 ≤1.5s - **Not directly testable in E2E, requires performance monitoring**
- Tests verify API calls complete, but don't measure latency

### Page Performance

- [ ] Page TTI P95 ≤2.5s desktop / ≤3.5s mobile - **Requires performance testing tools**
- Tests verify pages load, but don't measure TTI

### Dashboard Performance

- [ ] Dashboard loads <2.0s P75 - **Requires performance testing**
- Tests verify dashboard loads, but don't measure load time

## Metrics Tracking (PRD Part 2)

### TTFQI (Time-to-First Qualified Introduction)

- [x] Test structure exists to verify matches appear
- [ ] Actual TTFQI measurement requires analytics tracking (not in E2E scope)

### TTV (Time-to-Value)

- [x] Test structure exists for match actions
- [ ] Actual TTV measurement requires analytics tracking

### Profile Activation Time

- [x] Test structure exists for skill creation and profile completion
- [ ] Actual activation time measurement requires timing instrumentation

## Test Files Created

1. **Test Helpers:**
   - `e2e/helpers/matching-helpers.ts` - Matching test utilities
   - `e2e/archive/helpers/expertise-helpers.ts` - Archived Expertise Atlas test utilities
   - `e2e/helpers/profile-helpers.ts` - Profile test utilities
   - `e2e/archive/helpers/test-data-setup.ts` - Archived UI-based test data creation utilities for retired expertise flows

2. **Comprehensive Test Files:**
   - `e2e/archive/non_mvp_matching_pac/comprehensive-matching.archived.ts` - Historical broad matching tests
   - `e2e/archive/non_mvp_expertise_atlas/comprehensive-expertise.archived.ts` - Historical Expertise Atlas tests
   - `e2e/archive/non_mvp_individual_purpose/comprehensive-profile.archived.ts` - Historical broad profile tests
   - `e2e/archive/non_mvp_legacy_integration/end-to-end-flows.archived.ts` - Historical integration tests

3. **Updated Existing Files:**
   - Active launch coverage now lives in `e2e/strict/**`, focused `tests/api/**`, focused `tests/ui/**`, and launch route inventory tests.

## Coverage Gaps

### Not Covered in E2E Tests (Require Different Testing Approach)

1. **Performance Metrics:**
   - API latency (P95, P99)
   - Page TTI measurements
   - Dashboard load times
   - **Recommendation:** Use Lighthouse CI or WebPageTest

2. **Analytics Events:**
   - TTFQI tracking
   - TTV tracking
   - Activation time measurement
   - **Recommendation:** Use analytics testing tools or API monitoring

3. **Fairness Note Generation:**
   - Cohort-level fairness checks
   - Statistical significance testing
   - **Recommendation:** Use data analysis tools or separate fairness test suite

4. **Audit Logs:**
   - Purpose edit logging
   - Visibility change logging
   - **Recommendation:** Use database queries or admin API tests

## Test Execution

### Run All Comprehensive Tests

```bash
# Current strict launch corridors
npm run test:e2e:org:strict
npm run test:launch:routes
npm run test:launch:workflow
npm run test:launch:org-corridor
```

### Run Specific Test Suites

```bash
# Archived CV import hard gate
npx playwright test e2e/cv-import-non-launch.spec.ts --project=chromium --reporter=line --workers=1

# Focused launch route policy
npm run test:launch:routes
```

## Notes

- All tests use authenticated sessions via `beforeEach` login
- Tests handle both empty and populated states gracefully
- Tests verify PRD acceptance criteria explicitly where possible
- Performance and analytics metrics require separate tooling beyond E2E tests
- Organization-specific features are covered in separate test files
