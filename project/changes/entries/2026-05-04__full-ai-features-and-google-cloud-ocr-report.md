# Full AI Features And Google Cloud OCR Report

- Date: 2026-05-04
- Repository: `/Users/yuriibakurov/proofound`
- Branch at inspection: `master`
- Base commit at inspection: `f2be72ab`
- Report scope: existing AI assistive features, Gemini provider/runtime, CV/import AI helper surfaces, browser OCR, Google Cloud CV/OCR provider path, launch posture, tests, and open risks.
- Evidence basis: current local worktree plus repo docs/code/tests. This is not live Google Cloud or live Gemini endpoint verification.

## Executive Summary

Proofound now has a governed AI layer, not a free-form AI product surface.

The active AI product surfaces are narrow, button-click assistive routes:

- Proof Pack Assistant
- Assignment Clarity Assistant
- Verification Request Composer
- Privacy Preflight
- Suggestion event tracking

The active provider implementation is server-side Gemini JSON generation through a provider abstraction. In the current local worktree, the default model is configured as Gemini 3.1 Flash-Lite Preview using:

```text
AI_MODEL_DEFAULT=gemini-3.1-flash-lite-preview
CV_IMPORT_GEMINI_MODEL_DEFAULT=gemini-3.1-flash-lite-preview
CV_IMPORT_GEMINI_MODEL_FALLBACK=gemini-3.1-flash-preview
```

The AI layer is disabled by default:

```text
AI_ASSISTANTS_ENABLED=false
```

The Google Cloud CV/OCR path exists as internal provider/status/smoke tooling. It is not approved as a user-facing production OCR feature. The repo docs explicitly say: internal production provider status/smoke tooling is allowed; user-facing production OCR activation is no-go until route-surface, billing, privacy, budget, and staging/live smoke gates pass.

## Current Default Model And Pricing

Current local configuration:

- Default model: `gemini-3.1-flash-lite-preview`
- Fallback model: `gemini-3.1-flash-preview`
- Flash-Lite pricing default: `$0.25 / 1M` input tokens and `$1.50 / 1M` output tokens
- Currency ledger: SEK, with default USD to SEK rate `10.5`

Repo files:

- `.env.example`
- `docs/ENV_VARIABLES.md`
- `src/lib/ai/provider/gemini-client.ts`
- `src/lib/expertise/gemini/config.ts`
- `src/lib/expertise/gemini/pricing.ts`
- `tests/lib/gemini-config.test.ts`
- `tests/lib/gemini-pricing.test.ts`

External current-state references checked during this run:

- Google blog: `https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-1-flash-lite`
- CloudPrice model page: `https://cloudprice.net/models/gemini-3.1-flash-lite-preview`
- TokenCost model analysis: `https://tokencost.app/blog/gemini-3-1-flash-lite-pricing`

Important caveat:

- The model is preview. Before production traffic is enabled, verify the live Gemini API/Vertex endpoint accepts the exact configured model ID or set the environment value to the canonical provider-required ID.

## Authority And Scope Docs

AI feature docs:

- `docs/ai/Proofound_AI_Assistive_Layer_Source_Of_Truth_Addendum_2026-05-03.md`
- `docs/ai/Proofound_AI_Assistive_Layer_Technical_Requirements_2026-05-03.md`
- `docs/ai/Proofound_AI_Assistive_Layer_Launch_Runbook_Addendum_2026-05-03.md`
- `docs/ai/Proofound_AI_Assistive_Layer_Codex_Prompts_2026-05-03.md`
- `docs/ai/Proofound_AI_Document_Patch_Map_2026-05-03.md`

Google Cloud/OCR docs:

- `docs/ai/Proofound_GCP_CV_OCR_Production_Integration_Proposal_2026-05-03.md`
- `docs/ai/Proofound_Temporary_GCP_CV_OCR_Sandbox_Reference_2026-05-03.md`
- `docs/ai/Proofound_Temporary_GCP_CV_OCR_Sandbox_Setup_Runbook_2026-05-03.md`
- `services/gcp-cv-ocr/README.md`

Launch posture from docs:

- AI is optional and not launch-critical.
- AI must not decide, score, rank, shortlist, or replace human review.
- AI must be feature-flagged, button-click based, authenticated, logged, spend-capped, privacy-gated, and safe to disable.
- AI safe mode is `AI_ASSISTANTS_ENABLED=false`.
- GCP CV/OCR is internal-only until explicit route-surface and privacy/billing approvals exist.

## Active API Surface

The launch surface policy classifies the following AI routes as active launch paths:

- `POST /api/ai/proof-pack/suggest`
- `POST /api/ai/suggestions/events`
- `POST /api/ai/assignments/clarify`
- `POST /api/ai/verifications/compose`
- `POST /api/ai/privacy-preflight/check`

Policy owner:

- `src/lib/launch/surface-policy.ts`

### Proof Pack Assistant

Route:

- `src/app/api/ai/proof-pack/suggest/route.ts`

Service:

- `src/lib/ai/proof-pack-assistant.ts`

Feature key:

- `proof_pack_assistant`

Prompt version:

- `ai-proof-pack-v1`

What it does:

- Suggests improvements to a user-owned Proof Pack.
- Uses only selected sanitized Proof Pack fields.
- Returns reviewable suggestions, missing context, privacy flags, and warnings.
- Falls back to deterministic checklist behavior when AI provider is unavailable.

Controls:

- Requires authenticated API context.
- Requires `proofPackId`.
- Rejects unsafe AI payload fields such as signed URLs, private storage URLs, secrets, and full private file payloads.
- Redacts email, URLs, filenames, tokens, and phone-like content before model use.
- Filters forbidden judgment/scoring language from outputs.
- Logs usage through the general AI ledger when provider calls happen.

Tests:

- `tests/api/proof-pack-assistant-route.test.ts`
- `tests/lib/proof-pack-assistant.test.ts`
- `tests/lib/ai-provider-gemini-client.test.ts`
- `tests/lib/ai-provider-usage-controls.test.ts`

### Assignment Clarity Assistant

Route:

- `src/app/api/ai/assignments/clarify/route.ts`

Service:

- `src/lib/ai/assignment-clarity.ts`

Feature key:

- `assignment_clarity`

Prompt version:

- `ai-assignment-clarity-v1`

What it does:

- Clarifies assignment text and returns human-reviewable rewrite suggestions, ambiguity flags, questions, and risky/excluded criteria.
- Uses sanitized assignment context.
- Avoids scoring, ranking, protected-trait criteria, and hiring-decision language.

Controls:

- Requires authenticated API context.
- Requires explicit organization/assignment authorization through the service layer.
- Uses sanitized logging for route failures.
- Uses idempotency key from request headers when supplied.
- Deterministic fallback is available when the provider fails.

Tests:

- `tests/api/assignment-clarity-route.test.ts`
- `tests/lib/ai-provider-usage-controls.test.ts`

### Verification Request Composer

Route:

- `src/app/api/ai/verifications/compose/route.ts`

Service:

- `src/lib/ai/verification-composer.ts`

Feature key:

- `verification_request_composer`

Prompt version:

- `ai-verification-composer-v1`

What it does:

- Drafts bounded verification request subject/message/questions.
- Accepts either `proofPackId` or `claimId`.
- Requires selected public-safe proof fields.
- Keeps verification claim-scoped and reviewable.

Controls:

- Requires authenticated API context.
- Rejects unsafe AI request payloads.
- Redacts Proof Pack fields before model use.
- Sanitizes output and falls back to deterministic draft if provider is unavailable.

Tests:

- `tests/api/verification-composer-route.test.ts`
- `tests/lib/verification-composer.test.ts`

### Privacy Preflight

Route:

- `src/app/api/ai/privacy-preflight/check/route.ts`

Service:

- `src/lib/ai/privacy-preflight.ts`

Feature key:

- `privacy_preflight`

Prompt version:

- `ai-privacy-preflight-v1`

What it does:

- Runs deterministic privacy rules before optional model review.
- Checks proof/public portfolio text for high-risk public exposure.
- Can enrich empty public portfolio checks with visible profile fields and hidden terms.

Controls:

- Requires authenticated API context.
- Uses safe validation and safe API error responses.
- Deterministic rules run first.
- Optional model review receives only short deterministic-redacted text.
- If model review is unavailable, returns deterministic rules-only result.

Tests:

- `tests/api/privacy-preflight-route.test.ts`
- `tests/lib/privacy-preflight.test.ts`

### Suggestion Event Tracking

Route:

- `src/app/api/ai/suggestions/events/route.ts`

Service:

- `src/lib/ai/usage-ledger.ts`

What it does:

- Records user interaction events for AI suggestions:
  - viewed
  - accepted
  - edited
  - dismissed
  - published

Controls:

- Requires authenticated API context.
- Requires suggestion ownership/scope checks through ledger helper.
- Safe metadata records field names/counts but avoids suggestion text.
- Fails closed with `403` if the suggestion cache entry does not belong to the user.

Tests:

- `tests/api/ai-suggestion-events-route.test.ts`
- `tests/lib/ai-suggestion-cache.test.ts`

## Provider Architecture

Provider abstraction:

- `src/lib/ai/provider/types.ts`
- `src/lib/ai/provider/index.ts`
- `src/lib/ai/provider/gemini-client.ts`

The active provider is `GeminiJsonProvider`.

Provider behavior:

- Server-only assertion prevents client-side provider calls.
- Requires `AI_ASSISTANTS_ENABLED=true`.
- Requires a server-side API key from one of:
  - `AI_GEMINI_PROD_API_KEY`
  - `AI_GEMINI_API_KEY`
  - `GEMINI_API_KEY`
  - `AI_GEMINI_STAGING_API_KEY`
  - legacy `CV_IMPORT_GEMINI_PRIMARY_API_KEY`
- Calls Gemini API endpoint:
  - `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- Requests JSON output with response schema.
- Caps temperature to a narrow deterministic range.
- Applies per-feature output token caps.
- Parses model usage metadata and computes cost.
- Validates provider output with Zod schemas.
- Handles cache replay, budget reservation/finalization, rate limits, and failure logging.

Default provider model in current local worktree:

- `gemini-3.1-flash-lite-preview`

Feature token cap behavior:

- Default AI feature max output tokens: `1600`
- CV import feature cap: `3200`
- Optional env overrides:
  - `AI_PROOF_PACK_ASSISTANT_MAX_OUTPUT_TOKENS`
  - `AI_ASSIGNMENT_CLARITY_MAX_OUTPUT_TOKENS`
  - `AI_VERIFICATION_REQUEST_COMPOSER_MAX_OUTPUT_TOKENS`
  - `AI_PRIVACY_PREFLIGHT_MAX_OUTPUT_TOKENS`
  - `AI_CV_IMPORT_MAX_OUTPUT_TOKENS`

## Usage Ledger, Budgets, Caching, And Audit Tables

Schema owners:

- `src/db/schema.ts`
- `src/db/migrations/20260301210000_add_cv_import_ai_usage_and_budgets.sql`
- `src/db/migrations/20260503120000_add_general_ai_usage_controls.sql`
- `src/db/migrations/20260503143000_expand_ai_suggestion_events_and_cache_ttl.sql`

General AI tables:

- `ai_monthly_budgets`
- `ai_usage_logs`
- `ai_suggestion_cache`
- `ai_suggestion_events`

Legacy/specialized CV import AI tables:

- `cv_import_ai_budgets`
- `cv_import_ai_usage_logs`

Controls:

- Monthly caps can apply globally and to production-like environments.
- Daily rate limits can apply per user, per organization, and per feature.
- Usage logs store hashes, prompt versions, safe metadata, redaction summaries, token usage, cost, and status.
- Raw prompt text is intentionally not stored in the general AI ledger.
- Suggestion cache TTL defaults to 30 days.
- Suggestion event metadata is sanitized and scoped.
- RLS policies restrict service writes and admin reads.

Launch blockers:

- Production launch status blocks if raw prompt logging is enabled.
- Production launch status blocks if AI is enabled without a monthly hard cap.
- Production launch status blocks if AI monthly hard cap is exhausted.

Files:

- `src/lib/ai/usage-ledger.ts`
- `src/app/api/monitoring/launch-status/route.ts`
- `src/app/api/monitoring/__tests__/launch-status-route.test.ts`

## Safety And Privacy Controls

Request safety:

- `src/lib/ai/request-safety.ts`

Rejects:

- signed/tokenized URLs
- private storage URLs
- secrets
- API keys
- auth/session/cookie fields
- raw or full private file payload fields
- original filename/private file fields

Common redaction:

- emails
- URLs
- filenames
- tokens
- phone-like values
- forbidden scoring/judgment language in AI outputs

Logging safety:

- AI usage ledger stores hashed inputs and safe metadata.
- Route errors use generic/sanitized responses where helper exists.
- Raw prompt logging defaults to false and blocks production readiness if enabled.

Hard product boundaries:

- AI must not score candidates.
- AI must not rank, shortlist, recommend, or decide.
- AI must not receive raw private files by default.
- AI must not receive signed/private storage URLs.
- AI must remain optional and reviewable.

## Existing Non-Generative AI/NLP Helpers

There are older deterministic/local helper surfaces that are AI-adjacent but not Gemini assistive features:

- `src/lib/ai/local-skill-extractor.ts`
- `src/lib/ai/nlp-extractor.ts`
- `src/lib/ai/skill-extractor.ts`
- `src/lib/ai/jd-parser.ts`
- `src/lib/ai/embedding-service.ts`
- `src/lib/ai/policy-explainer.ts`

These support local extraction, matching/explanation, job-description parsing, or policy explanation patterns. They should not be treated as provider-backed Gemini routes unless they call the provider abstraction.

## CV Import, Gemini, And Archived Wizard Status

Gemini CV/expertise helper files:

- `src/lib/expertise/gemini/config.ts`
- `src/lib/expertise/gemini/pricing.ts`
- `src/lib/expertise/gemini/client.ts`
- `src/lib/expertise/gemini/skill-extractor.ts`
- `src/lib/expertise/gemini/taxonomy-shortlist.ts`
- `src/lib/expertise/gemini/taxonomy-mapper.ts`
- `src/lib/expertise/gemini/reranker.ts`
- `src/lib/expertise/gemini/schemas.ts`
- `src/lib/expertise/gemini/budget-ledger.ts`

Current route-surface reality:

- The CV import wizard API routes are archived/non-launch.
- They return `410` legacy/non-launch responses.

Archived route files:

- `src/app/api/expertise/cv-import/wizard-extract/route.ts`
- `src/app/api/expertise/cv-import/wizard-extract/status/route.ts`
- `src/app/api/expertise/cv-import/wizard-suggest/route.ts`
- `src/app/api/expertise/cv-import/wizard-apply/route.ts`

Regression coverage:

- `tests/api/archived-api-handlers-route.test.ts`
- `tests/api/launch-surface-inventory.test.ts`

Important mismatch:

- Some CV import implementation files and tests still exist as preserved/non-launch assets. They must not be used as evidence that the CV wizard is active in the locked MVP corridor.

## Browser-Side OCR

Browser OCR files:

- `src/lib/expertise/ocr-client.ts`
- `src/lib/expertise/ocr-client-config.ts`
- `src/lib/expertise/pdf-client-extractor.ts`
- `src/lib/expertise/pdf-client-errors.ts`

Env flags:

```text
NEXT_PUBLIC_CV_IMPORT_OCR_ENABLED=false
NEXT_PUBLIC_CV_IMPORT_OCR_MAX_FILE_SIZE_MB=5
NEXT_PUBLIC_CV_IMPORT_OCR_MAX_PAGES=4
NEXT_PUBLIC_CV_IMPORT_OCR_PAGE_TIMEOUT_MS=8000
NEXT_PUBLIC_CV_IMPORT_OCR_TIMEOUT_MS=25000
NEXT_PUBLIC_CV_IMPORT_OCR_RENDER_SCALE=2
NEXT_PUBLIC_CV_IMPORT_OCR_LANGUAGE=eng
```

Status:

- Disabled by default.
- Intended as a bounded client-side fallback for scanned PDFs when backend extraction returns empty text.
- Since CV import wizard routes are archived, this should not be interpreted as an active launch flow without separate route-surface approval.

Tests:

- `tests/lib/pdf-client-extractor.test.ts`
- `tests/lib/cv-import-wizard-extractor.test.ts`
- `tests/lib/document-extraction-provider.test.ts`

## Google Cloud CV/OCR Provider Path

Status:

- Internal production provider status/smoke tooling exists.
- User-facing production OCR activation remains no-go.

Next.js config/status files:

- `src/lib/expertise/gcp-cv-ocr-config.ts`
- `src/lib/expertise/gcp-cv-ocr-oidc.ts`
- `src/lib/expertise/gcp-cv-ocr-status.ts`
- `scripts/gcp-cv-ocr-smoke.ts`
- `src/app/admin/page.tsx`

Cloud Run service:

- `services/gcp-cv-ocr/`
- `services/gcp-cv-ocr/src/server.ts`
- `services/gcp-cv-ocr/src/handler.ts`
- `services/gcp-cv-ocr/src/auth.ts`
- `services/gcp-cv-ocr/src/provider.ts`
- `services/gcp-cv-ocr/src/validation.ts`
- `services/gcp-cv-ocr/Dockerfile`
- `services/gcp-cv-ocr/README.md`

Env posture:

```text
GCP_CV_OCR_ENABLED=false
GCP_CV_OCR_AUTH_MODE=oidc
GCP_CV_OCR_PROVIDER=document_ai
```

Config requires:

- future expiry timestamp
- HTTPS base URL
- OIDC config for production invocation
- per-request limits
- allowed MIME types
- user/global daily limits

Preferred production auth:

- Private Cloud Run invocation through IAM-authenticated OIDC.
- Vercel OIDC is exchanged through Google STS and IAM Credentials for a Cloud Run ID token.
- No Google API key or service account JSON should be configured for this path.

Fallback/local smoke auth:

- HMAC request signing.
- Timestamp freshness.
- Nonce replay prevention.
- SHA-256 body hash.
- Timing-safe signature comparison.

Cloud Run service endpoints:

- `GET /health`
- `POST /extract`

Cloud Run provider modes:

- `mock`
- `gcp_document_ai`
- `gcp_vision` placeholder/stub

Implemented live provider:

- Document AI provider can call:
  - `https://{location}-documentai.googleapis.com/v1/projects/{project}/locations/{location}/processors/{processor}:process`
- It uses Google Application Default Credentials inside Cloud Run.

Not implemented:

- Cloud Vision provider is currently stubbed and returns provider error.

Privacy controls in service:

- Rejects bad JSON, unsupported MIME, too-large files, too many pages.
- Generates opaque request/document IDs.
- Redacts signed URLs, storage paths, secrets, and raw filenames from provider text before returning.
- Truncates response text.
- Does not require raw filenames, bucket names, storage paths, signed URLs, or user identifiers in the payload.

Admin visibility:

- `src/app/admin/page.tsx` shows internal-only `CV OCR production` status.
- Status values are safe:
  - disabled
  - configured
  - expired
  - fallback
  - provider reachable

Smoke tooling:

- `npm run ocr:production:status`
- `npm run ocr:production:smoke`

Smoke behavior:

- Status command probes safe provider health.
- Smoke builds a synthetic PDF only.
- If provider is not reachable, smoke skips unless `--require-live` is used.
- It must not process real/pilot user documents during this internal smoke path.

Tests:

- `tests/lib/gcp-cv-ocr-config.test.ts`
- `tests/lib/gcp-cv-ocr-service.test.ts`
- `tests/lib/gcp-cv-ocr-status.test.ts`

## Environment Variable Inventory

Assistive AI:

- `AI_ASSISTANTS_ENABLED`
- `AI_MODEL_DEFAULT`
- `AI_GEMINI_PROD_API_KEY`
- `AI_GEMINI_STAGING_API_KEY`
- `AI_GEMINI_API_KEY`
- `GEMINI_API_KEY`
- `AI_MONTHLY_HARD_CAP_SEK`
- `AI_PROD_MONTHLY_HARD_CAP_SEK`
- `AI_USER_DAILY_LIMIT`
- `AI_ORG_DAILY_LIMIT`
- `AI_<FEATURE>_DAILY_LIMIT`
- `AI_<FEATURE>_MAX_OUTPUT_TOKENS`
- `AI_RAW_PROMPT_LOGGING_ENABLED`

CV import Gemini:

- `CV_IMPORT_GEMINI_PRIMARY_MONTHLY_BUDGET_SEK`
- `CV_IMPORT_GEMINI_SECONDARY_MONTHLY_BUDGET_SEK`
- `CV_IMPORT_GEMINI_USD_TO_SEK_RATE`
- `CV_IMPORT_GEMINI_MODEL_DEFAULT`
- `CV_IMPORT_GEMINI_MODEL_FALLBACK`
- `CV_IMPORT_GEMINI_MAX_OUTPUT_TOKENS`
- `CV_IMPORT_GEMINI_SHORT_TEXT_MAX_OUTPUT_TOKENS`
- `CV_IMPORT_GEMINI_TEMPERATURE`
- `CV_IMPORT_GEMINI_TIMEOUT_MS`
- `CV_IMPORT_GEMINI_TAXONOMY_GUIDED`
- `CV_IMPORT_GEMINI_SHORTLIST_MAX_ENTRIES`
- `CV_IMPORT_GEMINI_SHORTLIST_MAX_TOKENS`
- `CV_IMPORT_GEMINI_SHORTLIST_SEED_LIMIT`
- `CV_IMPORT_GEMINI_SHORTLIST_CONCURRENCY`
- `CV_IMPORT_GEMINI_SHORTLIST_QUERY_TIMEOUT_MS`
- `CV_IMPORT_GEMINI_SHORTLIST_DOCUMENT_TIMEOUT_MS`
- `CV_IMPORT_GEMINI_SHORTLIST_CACHE_TTL_MS`
- `CV_IMPORT_GEMINI_TAXONOMY_VERSION`
- `CV_IMPORT_GEMINI_FLASH_LITE_INPUT_USD_PER_MILLION`
- `CV_IMPORT_GEMINI_FLASH_LITE_OUTPUT_USD_PER_MILLION`
- `CV_IMPORT_GEMINI_FLASH_INPUT_USD_PER_MILLION`
- `CV_IMPORT_GEMINI_FLASH_OUTPUT_USD_PER_MILLION`

Browser OCR:

- `NEXT_PUBLIC_CV_IMPORT_OCR_ENABLED`
- `NEXT_PUBLIC_CV_IMPORT_OCR_MAX_FILE_SIZE_MB`
- `NEXT_PUBLIC_CV_IMPORT_OCR_MAX_PAGES`
- `NEXT_PUBLIC_CV_IMPORT_OCR_PAGE_TIMEOUT_MS`
- `NEXT_PUBLIC_CV_IMPORT_OCR_TIMEOUT_MS`
- `NEXT_PUBLIC_CV_IMPORT_OCR_RENDER_SCALE`
- `NEXT_PUBLIC_CV_IMPORT_OCR_LANGUAGE`

GCP CV/OCR:

- `GCP_CV_OCR_ENABLED`
- `GCP_CV_OCR_EXPIRES_AT`
- `GCP_CV_OCR_BASE_URL`
- `GCP_CV_OCR_AUTH_MODE`
- `GCP_CV_OCR_SHARED_SECRET`
- `GCP_CV_OCR_OIDC_AUDIENCE`
- `GCP_CV_OCR_OIDC_PROJECT_NUMBER`
- `GCP_CV_OCR_OIDC_WORKLOAD_IDENTITY_POOL_ID`
- `GCP_CV_OCR_OIDC_WORKLOAD_IDENTITY_PROVIDER_ID`
- `GCP_CV_OCR_OIDC_SERVICE_ACCOUNT_EMAIL`
- `GCP_CV_OCR_MAX_FILE_SIZE_MB`
- `GCP_CV_OCR_MAX_PAGES`
- `GCP_CV_OCR_MAX_FILES_PER_REQUEST`
- `GCP_CV_OCR_ALLOWED_MIME_TYPES`
- `GCP_CV_OCR_RETENTION_HOURS`
- `GCP_CV_OCR_USER_DAILY_LIMIT`
- `GCP_CV_OCR_GLOBAL_DAILY_LIMIT`
- `GCP_CV_OCR_PROVIDER`
- `GCP_CV_OCR_PROJECT_ID`
- `GCP_CV_OCR_DOCUMENT_AI_LOCATION`
- `GCP_CV_OCR_DOCUMENT_AI_PROCESSOR_ID`

## Verification Run In This Continuation

Commands already run after the Gemini 3.1 Flash-Lite Preview/default-pricing update:

- `npm run test:launch:ai`
  - PASS
  - 12 test files passed
  - 67 tests passed
  - Note: Vite websocket sandbox warning appeared but did not fail the suite.
- `npm run lint`
  - PASS
- `npm run typecheck`
  - PASS
- `npm run docs:freshness`
  - PASS in warning mode
  - Current warnings include orphan registry entries for several GCP OCR docs/service README and one admin-dashboard audit doc.

Inventory commands used for this report included:

- `find src/lib/ai src/app/api/ai src/lib/expertise/gemini src/lib/expertise -maxdepth 3 -type f`
- `find services/gcp-cv-ocr docs/ai tests/lib tests/api src/app/api/monitoring/__tests__ -maxdepth 3 -type f`
- `rg -n "AI_|CV_IMPORT_GEMINI|GCP_CV_OCR|OCR" .env.example docs/ENV_VARIABLES.md`
- `rg -n "legacySurfaceJsonResponse|cv-import|wizard-extract|wizard-suggest|wizard-apply|/api/expertise/cv-import" ...`

## Readiness Verdict

Assistive AI feature layer:

- Repo implementation exists.
- Active routes are present and launch-surface-approved.
- Disabled-by-default posture exists.
- Server-only Gemini provider abstraction exists.
- Spend caps, rate limits, cache, logs, and safe suggestion events exist.
- Focused AI launch tests are green.
- Not live-provider verified in this report.

Gemini 3.1 Flash-Lite Preview default:

- Configured in current local worktree.
- Pricing defaults updated.
- Tests updated and passing.
- Production should still verify exact provider model ID before enabling traffic.

Browser OCR:

- Implementation/config exists.
- Disabled by default.
- CV import wizard remains archived, so this is not an active launch flow by itself.

GCP CV/OCR:

- Internal service, OIDC/HMAC auth, config parser, safe status, admin status card, and synthetic smoke tooling exist.
- Document AI provider code path exists.
- Cloud Vision provider is stubbed.
- User-facing activation is not approved.
- Live Cloud Run/Document AI/billing/OIDC smoke was not run in this report.

## Main Remaining Risks And TODOs

1. Verify live Gemini preview ID before production enablement.
   - The current configured ID is `gemini-3.1-flash-lite-preview`.
   - Because it is preview, the provider may require a dated/canonical variant.

2. Decide whether to register the newer AI/GCP docs in `docs/DOCS_REGISTRY.md`.
   - `docs:freshness` currently reports orphan warnings for GCP OCR docs and `services/gcp-cv-ocr/README.md`.

3. Run live Google Cloud checks only with explicit target approval.
   - Billing/product eligibility.
   - Cloud Run private invocation.
   - Workload Identity Federation/OIDC token exchange.
   - Document AI processor availability.
   - Synthetic PDF smoke.
   - No real/pilot documents until privacy review approves it.

4. Keep CV import wizard archived unless explicitly approved.
   - Existing route handlers return `410`.
   - Do not treat preserved CV import implementation/tests as launch-active evidence.

5. Review production environment before enabling AI.
   - Confirm `AI_ASSISTANTS_ENABLED`.
   - Confirm hard caps.
   - Confirm raw prompt logging remains disabled.
   - Confirm server-only keys are present and no `NEXT_PUBLIC_*GEMINI*KEY` or `NEXT_PUBLIC_*GCP*KEY` exists.

6. If AI is enabled for pilots, add live operational proof.
   - Launch status snapshot.
   - Budget ledger row.
   - One sanitized model smoke per feature or an explicit decision that model calls are not required for launch smoke.
   - Provider failure and deterministic fallback proof.

## Bottom Line

Proofound has a real, governed AI assistive layer in the repo, with active MVP-safe routes for proof clarity, assignment clarity, verification request composition, privacy preflight, and suggestion audit events.

The Google Cloud CV/OCR implementation exists as internal provider/status/smoke infrastructure, not as a user-facing production feature.

The current local worktree is aligned to Gemini 3.1 Flash-Lite Preview by default, but production enablement still needs live model-ID and provider smoke verification.
