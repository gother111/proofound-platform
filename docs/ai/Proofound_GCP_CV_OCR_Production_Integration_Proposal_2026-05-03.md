> Doc Class: `reference-spec`
> Last Verified: `2026-05-04`

# GCP Proof Artifact OCR Production-Beta Integration Proposal

**Status:** Go for authenticated-user Proof Artifact Text Extraction beta and authenticated-individual Start from CV beta after gates. No-go for archived CV import wizard reactivation, broad OCR outside those beta corridors, scoring, ranking, or user-facing production OCR outside those betas.
**Scope:** Promote a temporary Google Cloud Document AI OCR path for explicit user-consented Proof Artifact Text Extraction and Start from CV beta processing, without reactivating archived CV import routes, silently creating a required production dependency, exposing secrets, or processing documents outside authenticated beta accounts.
**Authority:** Subordinate to `AGENTS.md`, `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`, `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`, `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`, and `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`.

## Executive Decision

**Go for authenticated-user production beta as Proof Artifact Text Extraction and authenticated-individual Start from CV. No-go for archived CV import wizard reactivation or broad OCR outside those corridors.**

The approved beta shape is:

- provider: Google Cloud Document AI OCR only;
- product surface: explicit Proof Artifact Text Extraction for user-uploaded proof artifacts, plus Start from CV private draft creation for authenticated individual users;
- availability: authenticated-user beta, feature-flagged, disabled by default;
- consent: explicit per document before OCR;
- output: draft extracted text for user review only;
- limits: page-limited, file-size-limited, rate-limited, spend-capped, and safe to disable;
- Cloud Run scaling: max instances `1` initially, never above `3` during beta;
- expiry: disable-or-pay decision due by `2026-07-24` because free credits expire around `2026-08-03`.

OCR output must not auto-publish, auto-verify, auto-score, auto-rank, shortlist, recommend, or affect match, review, verification, reveal, trust-state, or hiring-decision state.

Google Cloud budgets are alerting tools only. They are not hard caps. Hard caps must be enforced in app/service code before the OCR worker calls Document AI.

The GCP OCR extractor can be represented as an internal production provider path, but it must not process real or pilot production documents outside the authenticated-user Proof Artifact OCR beta or authenticated-individual Start from CV beta because:

- the CV import wizard route family is explicitly archived in the launch surface policy;
- live billing/product eligibility has not been verified in this pass;
- budget alert evidence and app-level GCP budget enforcement are not complete;
- privacy review is not passed for real or pilot documents;
- staging smoke evidence is not present;
- the Cloud Run provider path still requires live production smoke evidence before any user-facing flow can rely on it.

**Conditional go for a production synthetic smoke window** if it uses synthetic documents only, stays behind disabled-by-default server flags before and after the smoke, uses Document AI only, and connects through internal tooling rather than reactivating CV import.

**Explicit no-go surfaces:**

- CV import wizard
- AI candidate scoring, ranking, shortlisting, suitability judgments, hiring recommendations, verification decisions, or trust-state decisions
- Gemini skill extractor for employer review
- taxonomy shortlist or reranker
- Cloud Vision OCR
- moving core infrastructure from Vercel/Supabase to Google Cloud

## Current Route Surface Policy

The active launch policy is centralized in `src/lib/launch/surface-policy.ts`.

Relevant current classifications:

- Active API surfaces include `/api/upload/*`, `/api/expertise/taxonomy`, `/api/expertise/user-skills/*`, `/api/ai/proof-pack/suggest`, verification routes, portfolio routes, assignment routes, and the narrow matching/review corridor.
- Broad `/api/expertise/*` routes are archived unless they are `/api/expertise/jd-to-l4`, `/api/expertise/taxonomy`, or `/api/expertise/user-skills/*`.
- The compiled archived allowlist in `tests/api/launch-surface-inventory.test.ts` includes the CV import wizard route files while requiring their classification to remain `archived`.
- `/app/i/expertise` is classified as an archived page path, and there is no `src/app/app/i/expertise/page.tsx` handler in the active app tree. Some expertise/CV components still exist as code assets, but they are not an approved active page surface.

## CV Import Wizard Status

The CV import wizard routes remain archived and must not be reactivated in this pass.

Archived route files:

- `src/app/api/expertise/cv-import/wizard-extract/route.ts`
- `src/app/api/expertise/cv-import/wizard-extract/status/route.ts`
- `src/app/api/expertise/cv-import/wizard-suggest/route.ts`
- `src/app/api/expertise/cv-import/wizard-apply/route.ts`

These handlers return `410` legacy/non-launch responses through `legacySurfaceJsonResponse(...)`.

Regression coverage:

- `tests/api/launch-surface-inventory.test.ts`
- `tests/api/archived-api-handlers-route.test.ts`
- `src/lib/__tests__/middleware-launch-archive.test.ts`
- `tests/ui/archived-mvp-routes.test.ts`

Known mismatch to resolve before any future route work:

- `tests/api/cv-import-wizard-routes.test.ts` still describes active CV wizard behavior and conflicts with the current `410` route handlers. Treat that test as stale/non-launch unless the user explicitly approves a route-surface change.
- `tests/ui/cv-import-wizard.test.tsx`, `tests/ui/cvjd-auto-suggest.test.tsx`, and `tests/ui/profile-context-cv-import.test.tsx` still cover legacy component behavior and must not be used as evidence that the wizard is launch-active.

## Would A New Active Route Broaden MVP Scope?

Yes, if the route is a new OCR/CV/import route or a reactivated CV import route.

Do not add or activate these without explicit route-surface approval:

- `/api/expertise/cv-import/wizard-extract`
- `/api/expertise/cv-import/wizard-extract/status`
- `/api/expertise/cv-import/wizard-suggest`
- `/api/expertise/cv-import/wizard-apply`
- any new `/api/expertise/cv-import/*`
- any new `/api/gcp-cv-ocr/*`, `/api/ocr/*`, or `/api/import/*` public endpoint

Adding one of those would require edits to:

- `src/lib/launch/surface-policy.ts`
- `tests/api/launch-surface-inventory.test.ts`
- direct route handler tests for auth/authz/privacy/fallback/rate limits
- archived route tests if anything moves out of `410`
- launch docs/checklists describing the new surface

Recommended path: avoid broad new OCR/CV/import routes. Integrate only behind approved active beta surfaces: authenticated-user Proof Artifact Text Extraction and authenticated-individual Start from CV.

## Existing Active Flow Candidate

The least scope-broadening path is the current proof upload and proof attachment corridor:

1. `POST /api/upload/document`
   - file: `src/app/api/upload/document/route.ts`
   - current behavior: authenticated upload, MIME/signature checks, quarantine/private storage lifecycle, privacy review, generic labels, no storage path in response.

2. `GET /api/upload/status/[fileId]`
   - file: `src/app/api/upload/status/[fileId]/route.ts`
   - current behavior: owner-checked status, privacy review state, no cross-user lookup.

3. `POST /api/expertise/user-skills/[id]/proofs`
   - file: `src/app/api/expertise/user-skills/[id]/proofs/route.ts`
   - current behavior: attaches an already attachable `uploadedFileId`, requires an owned primary anchor, writes canonical Proof Pack/proof artifact records, rejects uploads still awaiting privacy review.

4. `DELETE /api/expertise/user-skills/[id]/proofs/[proofId]`
   - file: `src/app/api/expertise/user-skills/[id]/proofs/[proofId]/route.ts`
   - current behavior: deletes canonical proof artifacts and owner-checked uploaded files.

5. `POST /api/ai/proof-pack/suggest`
   - file: `src/app/api/ai/proof-pack/suggest/route.ts`
   - possible later review aid only; not required for OCR ingestion and must not receive raw private file payloads by default.

Proposed future integration shape:

- Add server-side OCR extraction as an optional step inside or adjacent to `src/lib/uploads/lifecycle.ts`, after upload validation and before user-visible text suggestion.
- Store no extracted text by default.
- Return extracted text only to the authenticated owner for review.
- Require the user to explicitly choose what becomes proof content.
- Keep `uploadedFileId` as the authority for attachment.
- Never use OCR output to score, rank, shortlist, recommend, or auto-create hiring decisions.
- Never use OCR output to update match, review, verification, reveal, trust-state, or hiring-decision state.
- Require explicit user consent per document before the OCR call.

## Privacy Review Outcome

**Outcome: conditional design pass, production fail.**

Existing privacy strengths:

- Upload lifecycle stores original filenames as sensitive owner-export-only metadata and returns generic/sanitized labels.
- Risky evidence uploads are held in `manual_review` and queued for internal review.
- Manual approval copies quarantined objects into `user-uploads-private`, sets `approved_after_manual_review`, keeps `safe_for_public=false`, and makes the upload attachable.
- Proof attachment rejects uploads awaiting privacy review.
- The document extraction abstraction rejects forbidden metadata fields, signed/private URLs, remote URLs, client auth headers, forwarded hosts, and provider responses containing sensitive paths or emails.
- The GCP service skeleton rejects signed URLs, private storage paths, remote URLs, raw headers, bad MIME types, oversized files, too many pages, replayed nonces, and stale timestamps.

Open privacy blockers:

- No production privacy review has accepted GCP as a processor for real/pilot CV or proof documents.
- No DPA/vendor/region/data-retention review evidence is recorded here.
- No staging log review proves Cloud Run, Cloud Logging, app logs, and provider logs avoid raw extracted text, filenames, bucket names, processor IDs, signed URLs, user emails, or secrets.
- No cross-user live staging proof exists for any OCR job/status path because no active production/staging route exists.

## Billing Eligibility And Budget Controls

**Outcome: not production-eligible yet.**

Existing controls:

- `src/lib/expertise/gcp-cv-ocr-config.ts` is disabled by default.
- `GCP_CV_OCR_EXPIRES_AT` disables at or after expiry.
- Missing base URL, auth mode, shared secret, invalid URL, expired config, or disabled flag makes the provider unavailable.
- Server env keys are not `NEXT_PUBLIC_*`.
- File size, file count, page count, retention hours, user daily limit, and global daily limit are parsed from server env.

Open billing blockers:

- Google Cloud Billing credit expiration and product eligibility were not verified live in this pass.
- Coverage for Cloud Run, Document AI, Cloud Storage if used, Secret Manager, Cloud Logging, and Cloud Monitoring is unresolved.
- Gemini/API Studio coverage must not be assumed.
- Budget alerts are documented but not smoke-proven.
- The GCP-specific `userDailyLimit` and `globalDailyLimit` config values are parsed, but there is no production OCR usage ledger or app-level budget stop wired into an approved active route.

Required before any billable staging call:

- private billing note with exact credit expiration, remaining balance, and eligible SKUs;
- sandbox-only GCP project;
- budget alerts at 10/25/50/75/90/100% plus forecasted 100%;
- proof that budget notification delivery works;
- app/service-level hard stop that blocks calls independently of GCP alerts;
- disabled/expired config smoke proving no Cloud Run call.
- disable-or-pay decision by `2026-07-24`, before the expected `2026-08-03` free-credit expiry.

## Staging Smoke Evidence

**Outcome: missing.**

Repository evidence exists only as docs/tests/runbook expectations, not live staging proof.

Required staging smoke before production consideration:

- one synthetic one-page PDF only, with no real names, emails, phone numbers, addresses, employer/customer names, CV history, pilot data, filenames, or storage paths;
- staging flag enabled only after billing and budget gates;
- OCR response schema-valid and capped;
- response excludes filename, bucket, object path, signed URL, processor ID, service URL, and secrets;
- application logs, Cloud Run logs, Cloud Logging, and provider logs contain no raw extracted text or sensitive metadata;
- `GCP_CV_OCR_ENABLED=false` fallback verified;
- expired `GCP_CV_OCR_EXPIRES_AT` fallback verified with no Cloud Run call;
- temp object cleanup verified;
- cost dashboard shows only expected small smoke spend and no unrelated spend.

## Exact Future Files/Routes That Would Change

Recommended no-new-route integration:

- `src/lib/expertise/document-extraction-provider.ts`
  - add real server-side Cloud Run caller behind existing provider abstraction.
- `src/lib/expertise/gcp-cv-ocr-config.ts`
  - add budget/eligibility status fields only if needed; keep secrets out of returned config.
- `services/gcp-cv-ocr/src/provider.ts`
  - replace stubbed real GCP provider with Document AI implementation after billing/product approval. Cloud Vision OCR is excluded from this rollout.
- `services/gcp-cv-ocr/src/handler.ts`
  - keep HMAC/IAM auth, safe response contract, no raw logging, expiry guard.
  - keep Cloud Run max instances at `1` initially and no more than `3` during beta.
- `src/lib/uploads/lifecycle.ts`
  - optional extraction hook only after file validation/privacy gates; no automatic proof writes.
- `src/app/api/upload/document/route.ts`
  - if needed, expose a safe `extractionStatus`/`extractionAvailable` response field without paths/text by default.
- `src/app/api/upload/status/[fileId]/route.ts`
  - if needed, owner-checked extraction status only.
- `src/app/api/expertise/user-skills/[id]/proofs/route.ts`
  - only if attaching user-approved OCR-derived text as metadata/title requires validation changes.
- `docs/ENV_VARIABLES.md`, `.env.example`, `agent/checklists/verification.md`
  - already have temporary sandbox coverage in this worktree; update only if the env contract changes.
- `docs/ai/Proofound_Temporary_GCP_CV_OCR_Sandbox_Setup_Runbook_2026-05-03.md`
  - add staging smoke results only after a real staging smoke is performed.

Routes that must remain archived:

- `/api/expertise/cv-import/wizard-extract`
- `/api/expertise/cv-import/wizard-extract/status`
- `/api/expertise/cv-import/wizard-suggest`
- `/api/expertise/cv-import/wizard-apply`

## Tests Required

Minimum local tests before any production-provider PR:

- `npm run test -- tests/lib/gcp-cv-ocr-config.test.ts tests/lib/document-extraction-provider.test.ts tests/lib/gcp-cv-ocr-service.test.ts`
- `npm run test:launch:routes`
- `npm run test:launch:upload`
- `npm run test -- tests/api/expertise-user-skill-proofs-route.test.ts tests/api/expertise-user-skill-proof-delete-route.test.ts tests/api/proof-pack-assistant-route.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run docs:freshness`

Before production consideration:

- `npm run test:launch:privacy`
- `npm run test:e2e:privacy:strict`
- `npm run test:launch:smoke`
- `BASE_URL=<production-url> npm run monitor:launch`
- `BASE_URL=<production-url> npm run launch:status`
- manual synthetic GCP OCR production smoke from `agent/checklists/verification.md`
- manual billing/cost/log review evidence recorded outside the repo

Tests that must not be treated as launch evidence unless rewritten:

- `tests/api/cv-import-wizard-routes.test.ts`
- `tests/ui/cv-import-wizard.test.tsx`
- `tests/ui/cvjd-auto-suggest.test.tsx`
- `tests/ui/profile-context-cv-import.test.tsx`

## Rollback Path

Fast app rollback:

1. Set `GCP_CV_OCR_ENABLED=false` in staging/production.
2. Remove `GCP_CV_OCR_BASE_URL`, `GCP_CV_OCR_SHARED_SECRET`, processor IDs, bucket names, and provider config from Vercel.
3. Redeploy so disabled config is active.
4. Verify disabled and expired states do not call Cloud Run.
5. Verify proof upload and proof attachment still work without OCR.

GCP rollback:

1. Disable or delete Cloud Run service/revisions.
2. Disable or delete Document AI processor.
3. Empty and delete temp bucket after confirming no approved retention need.
4. Revoke IAM bindings and service accounts.
5. Destroy Secret Manager versions.
6. Confirm billing shows no new OCR-related spend.

Code rollback:

- Revert only the OCR integration patch files.
- Leave archived CV import tombstones intact.
- Keep route-surface policy unchanged unless an approved route-surface PR explicitly changed it.

## Unresolved Risks

- Real GCP provider is not implemented; current service provider is a mock/stub.
- Live billing/product eligibility is unknown.
- Budget alerts and app-level budget stop are not proven.
- Privacy/vendor processing review is not complete.
- Production synthetic smoke evidence is absent.
- Legacy CV wizard tests/components still exist and can mislead future implementers.
- OCR text may contain identity, employer, customer, compensation, health, immigration, or protected-trait information; extraction must remain explicit, user-reviewed, and non-decisional.
- Any new route or CV wizard reactivation would broaden launch scope and needs explicit approval.

## Final Recommendation

Do not connect GCP OCR to any user-facing production flow outside the authenticated-user Proof Artifact Text Extraction beta or authenticated-individual Start from CV beta.

The acceptable production-provider implementation must:

- keeps CV import wizard routes archived;
- uses existing proof upload/proof attachment surfaces or the approved Start from CV private-draft flow;
- processes synthetic files first;
- returns OCR text only for authenticated owner review;
- keeps production disabled;
- proves billing, budget, privacy, logs, fallback, expiry, cleanup, and route inventory before any pilot data is considered.
