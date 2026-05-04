> Doc Class: `active`
> Last Verified: `2026-05-04`

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

## Controlled AI / OCR Smoke Gates

Gemini assistive AI is production-eligible only after:

- live model smoke passes against the configured production model ID
- app-level hard caps block provider calls before spend exceeds the cap
- launch-status checks expose only safe AI state and block raw-prompt logging in production-like environments
- privacy/redaction tests prove no full files, original filenames, signed URLs, hidden identity data, or secrets are sent
- raw prompt logging remains disabled

Invite-only Proof Artifact Text Extraction with Google Cloud Document AI OCR is beta-only and must verify:

- explicit user consent per document
- invite gate and server-side feature flag
- page, file-size, rate, and app/service spend caps before Document AI calls
- disabled/expired fallback makes no Cloud Run call
- Cloud Run max instances is `1` initially and no more than `3` during beta
- OCR output is draft text only and does not auto-publish, auto-verify, auto-score, auto-rank, shortlist, recommend, or change match/review/trust/hiring state

Explicitly excluded from launch evidence:

- CV import wizard
- AI scoring, ranking, shortlisting, suitability, hiring recommendation, verification decision, or trust-state decision flows
- Gemini skill extractor for employer review
- taxonomy shortlist, reranker, or Cloud Vision OCR

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
