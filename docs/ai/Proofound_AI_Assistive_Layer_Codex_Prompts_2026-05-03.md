> Doc Class: `reference-spec`
> Last Verified: `2026-05-21`

# Proofound AI Assistive Layer Codex Implementation Prompts

**Status:** Implementation prompt pack  
**Date:** 2026-05-03  
**Audience:** Codex, engineering, QA  
**Context:** These prompts implement the optional AI assistive layer without changing the locked Proofound MVP definition.

---

## Global instruction for all Codex tasks

Before making changes, read:

```text
Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md
PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md
PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md
LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md
docs/ai/Proofound_AI_Assistive_Layer_Source_Of_Truth_Addendum_2026-05-03.md
docs/ai/Proofound_AI_Assistive_Layer_Technical_Requirements_2026-05-03.md
docs/ai/Proofound_AI_Assistive_Layer_Launch_Runbook_Addendum_2026-05-03.md
```

Hard product rules:

- Do not add AI scoring.
- Do not add AI ranking.
- Do not add AI shortlisting.
- Do not add AI suitability judgments.
- Do not add AI fit verdicts.
- Do not add AI workflow recommendations.
- Do not add AI verification decisions.
- Do not add AI trust-state decisions.
- Do not send full private files to the model by default.
- Do not expose provider keys to the client.
- Do not log raw prompts by default.
- Keep AI disabled by default.
- All AI suggestions must be optional and user-reviewed.
- Gemini assistive AI is production-eligible only after live model smoke, app-level hard caps, launch-status checks, privacy tests, and raw-prompt logging checks pass.
- Google Cloud Document AI OCR is production-beta only for authenticated-user Proof Artifact Text Extraction and authenticated-individual Start from CV, not the archived CV import wizard.
- OCR requires explicit consent per document and returns draft text only.
- OCR output must not auto-publish, auto-verify, auto-score, auto-rank, shortlist, recommend, or affect match/review/trust/workflow state.
- Cloud Vision OCR, taxonomy shortlist, reranker, and Gemini skill extractor for employer review are excluded.

---

## A. AI provider abstraction and server-only Gemini client

```text
Title: A. AI provider abstraction and server-only Gemini client

Inspect:
- src/lib/expertise/gemini/config.ts
- src/lib/expertise/gemini/pricing.ts
- src/lib/expertise/gemini/budget-ledger.ts
- src/app/api/expertise/cv-import/**/*
- src/db/schema.ts
- docs/ENV_VARIABLES.md
- package.json

Goal:
Create a general AI provider abstraction for Proofound assistive features using Gemini 3.1 Flash-Lite as the default model assumption. Do not expose API keys to the client. Do not hard-code Gemini directly inside feature route handlers.

Implementation requirements:
- Add src/lib/ai/provider/types.ts with a generic generateJson<T>() interface.
- Add src/lib/ai/provider/gemini-client.ts.
- Add src/lib/ai/provider/index.ts.
- Default model must be env-driven:
  AI_MODEL_DEFAULT=gemini-3.1-flash-lite
- If the official provider model ID differs, keep the exact ID in env only.
- Use server-only imports/guards.
- Support structured JSON outputs.
- Validate all model outputs with Zod before returning to routes.
- Set low temperature.
- Set per-feature max output token caps.
- Do not enable Search grounding, URL context, File Search, Code Execution, or file upload features.
- Include requestId, promptVersion, feature, model, provider, and token usage in the result.

Privacy/security requirements:
- API keys must only be read from server env vars.
- No API key or prompt text may be returned to the browser.
- Reject calls if AI_ASSISTANTS_ENABLED is false.
- Reject calls if model output is not valid JSON.
- Do not log raw prompts by default.

Tests:
- Unit test provider config parsing.
- Unit test disabled feature flag behavior.
- Unit test invalid JSON handling.
- Unit test server-only key behavior by ensuring no NEXT_PUBLIC key is used.
- Unit test structured output validation failure.

Acceptance criteria:
- Feature routes can call a provider-agnostic generateJson<T>() function.
- Default model is env-driven and points to Gemini 3.1 Flash-Lite for testing.
- No Gemini API key appears in client bundles or API responses.
- Invalid provider output fails closed with a safe error object.
```

---

## B. AI usage logging, cost caps, and rate limiting

```text
Title: B. AI usage logging, cost caps, and rate limiting

Inspect:
- src/lib/expertise/gemini/budget-ledger.ts
- src/lib/expertise/gemini/pricing.ts
- src/db/schema.ts
- src/db/migrations/*
- existing rate-limit helpers under src/lib/*
- tests around CV import Gemini usage logs if present

Goal:
Add general AI usage logging, cost estimation, budget reservation/finalization, idempotency replay, and rate limiting for all assistive AI features.

Implementation requirements:
- Create general tables:
  ai_usage_logs
  ai_monthly_budgets
  ai_suggestion_cache
  ai_suggestion_events
- Use SEK/ore accounting.
- Use env AI_USD_TO_SEK_RATE=10.5 as default.
- Keep pricing constants configurable and documented.
- Estimate reservation cost before model call.
- Finalize actual cost after model usage metadata.
- Enforce:
  AI_MONTHLY_HARD_CAP_SEK
  AI_PROD_MONTHLY_HARD_CAP_SEK
  per-user daily limit
  per-org daily limit
  per-feature daily limit
- Add idempotency key support based on user/org/feature/entity/input_hash.
- Return cached response for identical sanitized input and prompt version.

Privacy/security requirements:
- Do not store raw prompt text.
- Store input_hash, output_hash, token counts, cost, feature, entity reference, and redaction summary.
- RLS: service role can insert/update; platform admins can read; ordinary users cannot read global usage logs.
- Avoid leaking org/proof-review participant data through log metadata.

Tests:
- Budget cap blocks calls.
- Reservation is released on provider failure.
- Finalization increments spend and clears reservation.
- Idempotent replay returns cached/saved result.
- Per-user and per-org rate limits block as expected.
- ai_usage_logs never store raw prompt text.

Acceptance criteria:
- A production cap can stop all AI routes safely.
- Repeated identical calls do not spend twice.
- Logs are sufficient for cost control and audit without storing sensitive prompts.
```

---

## C. Proof Pack Assistant endpoint and UI

```text
Title: C. Proof Pack Assistant endpoint and UI

Inspect:
- src/app/api/expertise/user-skills/[id]/proofs/route.ts
- src/app/api/portfolio/text-pack/route.ts
- src/lib/proofs/*
- src/components/**/*proof*
- src/app/app/i/portfolio/**/*
- src/app/app/i/profile/**/*
- tests/lib/proof-pack-anchor.test.ts
- tests/lib/canonical-proof-pack-projection.test.ts

Goal:
Add a button-click Proof Pack Assistant that helps an individual improve structured Proof Pack text without inventing facts.

Endpoint:
POST /api/ai/proof-pack/suggest

Request:
- proofPackId
- selected fields only:
  title
  claimStatement
  ownershipStatement
  outcomeSummary
  timeframe
  linkedSkills labels
  evidence item types/titles after redaction
  visibility state
- idempotencyKey optional

Implementation requirements:
- Validate Proof Pack ownership.
- Build sanitized context server-side.
- Redact forbidden fields before model call.
- Use prompt version ai-proof-pack-v1.
- Return JSON:
  missingContext[]
  suggestedRewrite
  privacyFlags[]
  verificationSuggestions[]
  warnings[]
- Do not auto-save suggestions.
- UI button label: Improve this proof.
- User can accept individual fields, edit, or dismiss.
- Add disclosure text: Sends selected Proof Pack text only. Does not review full files by default.

Privacy/security requirements:
- Never send file contents.
- Never send original filenames.
- Never send hidden private context unless user explicitly selected a public-safe field.
- Never infer protected traits.
- Never produce proof-review participant score, rank, or fit judgment.

Tests:
- Unauthorized user cannot request suggestions.
- Hidden/private fields are excluded.
- Emails, phones, URLs, filenames, and token-like strings are redacted.
- Suggested output is not saved until user accepts.
- Cache hit returns without provider call.
- UI test confirms button appears in Proof Pack edit flow and suggestions require explicit acceptance.

Acceptance criteria:
- User can click Improve this proof and receive structured suggestions.
- No suggestion creates new facts.
- No full files or filenames are sent.
- Suggestions are auditable and dismissible.
```

---

## D. Assignment Clarity Assistant endpoint and UI

```text
Title: D. Assignment Clarity Assistant endpoint and UI

Inspect:
- src/app/api/assignments/route.ts
- src/app/api/assignments/[id]/route.ts
- src/app/api/assignments/[id]/publish/route.ts
- src/app/api/organizations/[orgId]/assignments/route.ts
- src/app/app/o/[slug]/assignments/**/*
- src/lib/assignments/*
- tests/api/*assignment*
- e2e/strict/org-corridor.strict.spec.ts

Goal:
Add a button-click Assignment Clarity Assistant that helps org managers write clearer assignment outcomes, constraints, capability expectations, and proof expectations.

Endpoint:
POST /api/ai/assignments/clarify

Request:
- assignmentId
- title
- outcomeSummary
- constraints
- mustHaveSkills/capabilities
- proofExpectations
- engagementType
- verificationRequirements if any

Implementation requirements:
- Validate org membership role: org_owner or org_manager.
- Build sanitized assignment context server-side.
- Use prompt version ai-assignment-clarity-v1.
- Return JSON:
  ambiguityFlags[]
  suggestedRewrite
  reviewQuestions[]
  excludedOrRiskyCriteria[]
- Do not publish automatically.
- UI button label: Clarify assignment.
- Suggestions can be accepted field-by-field.

Privacy/security requirements:
- Do not generate discriminatory criteria.
- Do not generate proof-review participant scoring rubrics.
- Do not rank or judge proof-review participants.
- Do not include protected-trait criteria.
- Do not send private proof-review participant data.

Tests:
- org_reviewer cannot edit or clarify assignment if current product policy restricts editing to owner/manager.
- Non-member gets 403.
- Assistant flags vague outcomes and missing proof expectations.
- Assistant does not produce proof-review participant scoring language.
- Assignment remains draft until user explicitly saves/publishes.
- UI test covers button and accept/dismiss behavior.

Acceptance criteria:
- Org manager can improve assignment clarity without creating scoring/ranking logic.
- Output remains assignment-focused: outcomes, constraints, proof expectations.
- No proof-review participant data is used.
```

---

## E. Verification Request Composer endpoint and UI

```text
Title: E. Verification Request Composer endpoint and UI

Inspect:
- src/app/api/verification/requests/**/*
- src/app/api/verification/status/route.ts
- src/app/api/verify/[token]/route.ts
- src/app/app/i/verifications/**/*
- src/lib/verification/*
- tests/api/*verification*
- tests/ui/verifications*

Goal:
Add a claim-scoped Verification Request Composer that drafts concise, respectful verification requests tied to one Proof Pack or claim.

Endpoint:
POST /api/ai/verifications/compose

Request:
- proofPackId or claimId
- verifierRelationshipType
- verificationScope:
  relationship_fact | ownership | observed_behavior | outcome_observation | artifact_familiarity
- selected public-safe proof fields

Implementation requirements:
- Validate proof owner.
- Use only claim-scoped fields.
- Use prompt version ai-verification-composer-v1.
- Return JSON:
  subject
  message
  claimScope
  verificationQuestions[]
  privacyNotes[]
  tooBroadWarnings[]
- User must review/edit before sending.
- UI button label: Draft verification request.

Privacy/security requirements:
- Do not include hidden private context.
- Do not include verifier email in model prompt.
- Do not ask for general praise.
- Do not ask verifier to assess overall proof-review participant quality.
- Do not generate more than one primary claim scope per request.

Tests:
- Composer rejects requests without a valid Proof Pack/claim.
- Hidden context is omitted.
- Verifier email is never sent to model.
- Draft includes scoped questions.
- Sending still uses existing verification request route and requires explicit user action.

Acceptance criteria:
- User can generate a useful verification draft.
- Draft remains claim-scoped.
- No verification request is sent automatically.
```

---

## F. Privacy Preflight rules-first plus optional Gemini check

```text
Title: F. Privacy Preflight rules-first plus optional Gemini check

Inspect:
- src/lib/uploads/privacy.ts
- src/app/api/upload/document/route.ts
- src/app/api/portfolio/visibility/route.ts
- src/lib/portfolio/public-projection.ts
- src/app/app/i/settings/privacy/**/*
- tests/lib/uploads-privacy.test.ts
- tests/lib/workflow-email-privacy.test.ts
- tests/api/upload-document-route.test.ts

Goal:
Add privacy preflight before publishing or exposing proof/public portfolio text. Rules must run first. Gemini is optional and receives only short sanitized text.

Endpoint:
POST /api/ai/privacy-preflight/check

Implementation requirements:
- Add deterministic checks for:
  email
  phone
  exact address
  URL with token/query secret
  filename pattern
  national ID-like strings
  API keys/access tokens
  confidential markers
  names/client/employer terms where visibility is hidden
- Optional Gemini pass only after deterministic redaction.
- Use prompt version ai-privacy-preflight-v1.
- Return:
  riskLevel
  flags[]
  safeToPublishSuggestion
  notes[]
- UI button label: Check privacy before publishing.
- Do not block low-risk publication automatically.
- Block or require review for high-risk deterministic flags.

Privacy/security requirements:
- Never send full files.
- Never send original filenames.
- Never send signed URLs.
- Never claim safe or certified.
- Copy must say this is not a privacy guarantee.

Tests:
- Deterministic redaction catches common PII and secret patterns.
- Gemini optional path receives sanitized text only.
- High-risk flags require review before publish.
- Low-risk path allows normal publish.
- Public portfolio rendering does not leak private context after preflight.

Acceptance criteria:
- Privacy check improves safety without relying on LLM as authority.
- High-risk leaks are caught before publication.
- User-facing copy is cautious and accurate.
```

---

## G. AI suggestion cache and audit trail

```text
Title: G. AI suggestion cache and audit trail

Inspect:
- src/db/schema.ts
- src/lib/audit*
- src/lib/workflow*
- src/app/api/** routes with audit logs
- existing idempotency helpers
- existing cache helpers if present

Goal:
Add cache and audit trail for AI suggestions so repeated calls are cheap and every accepted/dismissed suggestion is traceable.

Implementation requirements:
- ai_suggestion_cache keyed by:
  feature
  entity_type
  entity_id
  input_hash
  prompt_version
  user/org scope
- Cache TTL default 30 days.
- ai_suggestion_events records:
  generated
  viewed
  accepted
  edited
  dismissed
  published
- Store accepted field-level metadata when user applies suggestions.
- Do not store raw hidden input.
- Add helper functions:
  getCachedSuggestion()
  saveSuggestion()
  recordSuggestionEvent()

Privacy/security requirements:
- Cache must be scoped to user/org permissions.
- A user cannot access another user's cached suggestion.
- Org suggestion cache must require current org membership.
- Do not cache full files, raw prompts, or forbidden fields.

Tests:
- Same sanitized input returns cache.
- Changed input invalidates cache.
- Different prompt version invalidates cache.
- User A cannot read User B cache.
- Org non-member cannot read org cache.
- Accept/edit/dismiss events are recorded.

Acceptance criteria:
- Repeated suggestions do not spend again.
- User actions on suggestions are auditable.
- Cache does not weaken privacy boundaries.
```

---

## H. Tests, smoke checks, and launch guardrails

```text
Title: H. Tests, smoke checks, and launch guardrails

Inspect:
- tests/api/*
- tests/lib/*
- tests/ui/*
- e2e/strict/org-corridor.strict.spec.ts
- scripts/launch-smoke-runner.ts
- src/app/api/monitoring/launch-status/route.ts
- src/lib/launch/surface-policy.ts
- docs/ENV_VARIABLES.md

Goal:
Add launch-safe guardrails for the AI assistive layer.

Implementation requirements:
- Add AI route tests for auth, authz, redaction, budget, rate limits, cache, and fallback.
- Add UI tests for each selected button:
  Improve this proof
  Clarify assignment
  Draft verification request
  Check privacy before publishing
- Add no-go checks:
  no AI scoring routes
  no AI ranking routes
  no client-exposed Gemini API key
  no raw prompt logging by default
  no model calls when feature flag disabled
- Add launch-status summary fields:
  aiAssistantsEnabled
  aiMonthlyCapSek
  aiSpendThisMonthSek
  aiBudgetState
  aiRawPromptLoggingEnabled
- Update docs/ENV_VARIABLES.md with all AI env vars.
- Update smoke runner to verify disabled fallback state if AI is disabled in production pilot.

Privacy/security requirements:
- Test must fail if NEXT_PUBLIC_* Gemini key exists.
- Test must fail if raw prompt logging is enabled in production.
- Test must fail if AI routes accept full file payloads.
- Test must fail if any route name or response includes candidate score/rank language.

Tests:
- npm run test for AI unit/API tests.
- npm run test:privacy includes AI redaction tests.
- e2e proof edit flow covers suggestion accept/dismiss.
- e2e assignment draft flow covers clarify assignment.
- Launch smoke reports AI disabled/enabled state without requiring model call.

Acceptance criteria:
- AI can be enabled for pilot safely.
- AI can be disabled without breaking core flows.
- Launch guardrails prevent scoring/ranking drift.
- Cost and privacy state are visible to admins/operators without exposing secrets.
```
