> Doc Class: `active`
> Last Verified: `2026-05-19`

# QA Summary

## Scope

This summary tracks the currently enforced QA automation surface and launch-gate ordering.

## Automated Coverage (Current)

- Unit/API baseline: `npm run test`
- Focused API baseline: `npm run test:api:focused`
- Privacy baseline: `npm run test:privacy`
- Extended privacy baseline: `npm run test:privacy:extended`
- Route surface and archived-route contracts: `npm run test:launch:routes`
- Upload privacy and lifecycle: `npm run test:launch:upload`
- Public portfolio/export coverage: `npm run test:launch:portfolio`
- Organization corridor coverage: `npm run test:launch:org-corridor`
- Workflow/reveal/interview/decision coverage: `npm run test:launch:workflow`
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
  - `npm run docs:freshness`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run audit:prod`
  - `npm run audit:all`
  - `npm run test:launch:smoke`
  - `BASE_URL=<production-candidate-url> npm run perf:budgets`
  - `BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run monitor:launch`
  - `BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run launch:status`
  - `npm run db:backup:checkpoint`
  - `npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json`
  - `BASE_URL=<production-candidate-url> SUS_STUDY_COMPLETE=true CRON_SECRET=<secret> npm run go:no-go`

## Primary Suite Ownership

- Auth: `e2e/auth.real.spec.ts`
- Individual strict: `e2e/strict/individual.strict.spec.ts`
- Organization strict: `e2e/strict/organization.strict.spec.ts`
- Privacy strict: `e2e/strict/privacy.strict.spec.ts`
- Providers strict: `e2e/strict/providers.strict.spec.ts`
- A11y: `tests/a11y/*.spec.ts`
- Route inventory/archive policy: `tests/api/launch-surface-inventory.test.ts`, `tests/api/launch-page-inventory.test.ts`, `src/lib/__tests__/middleware-launch-archive.test.ts`

## Current Known Risks

- Provider strict flows require deterministic connected provider credentials only when `STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=true`; the locked MVP interview posture remains manual-link first.
- Launch strict runs can fail due to missing env vars, provider account readiness, stale smoke evidence, or stale monitor rows rather than functional regressions. Treat the failed gate as truthful until refreshed evidence proves otherwise.
- `npm run db:push` remains dev-only and is not a production migration path.
- Current launch readiness still requires target-specific production-candidate backup checkpoint, isolated restore rehearsal, authenticated launch-status/perf-status, `/api/assignments` latency evidence, and final go/no-go evidence for the intended target.
- Browser desktop/mobile evidence is required when UI/public/visual behavior changes; record route, viewport, mode, and finding in the relevant artifact.

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

## Historical Evidence Boundary

Older QA reports and stabilization notes, including March 2026 Node 20 command evidence, are history only. Current launch evidence must use the Node 24.15.0/npm 11.12.1 toolchain, current repo scripts, current target env, and the active checklist below.

## Canonical Verification Checklist

- `agent/checklists/verification.md`
