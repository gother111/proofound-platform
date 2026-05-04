> Doc Class: `reference-spec`
> Last Verified: `2026-05-04`

# Proofound AI Document Patch Map

**Status:** Repo patch guide  
**Date:** 2026-05-03  
**Purpose:** This document shows exactly what to add to existing Proofound docs without rewriting the locked MVP.

**2026-05-04 rollout ruling:** Assistive AI may be production-eligible only after live Gemini model smoke, app-level hard caps, launch-status checks, privacy tests, and raw-prompt logging checks pass. Google Cloud OCR is production-beta only for invite-gated Proof Artifact Text Extraction using Document AI. It is not CV import, not Cloud Vision OCR, not AI scoring/ranking/shortlisting, and not a move away from Vercel/Supabase.

---

## 0. Recommended file placement

Add these new files to the repo:

```text
docs/ai/Proofound_AI_Assistive_Layer_Source_Of_Truth_Addendum_2026-05-03.md
docs/ai/Proofound_AI_Assistive_Layer_Technical_Requirements_2026-05-03.md
docs/ai/Proofound_AI_Assistive_Layer_Launch_Runbook_Addendum_2026-05-03.md
docs/ai/Proofound_AI_Assistive_Layer_Codex_Prompts_2026-05-03.md
docs/ai/Proofound_AI_Document_Patch_Map_2026-05-03.md
docs/ai/Proofound_GCP_CV_OCR_Production_Integration_Proposal_2026-05-03.md
docs/ai/Proofound_Temporary_GCP_CV_OCR_Sandbox_Reference_2026-05-03.md
docs/ai/Proofound_Temporary_GCP_CV_OCR_Sandbox_Setup_Runbook_2026-05-03.md
```

Then make the small edits below.

---

## 1. Patch `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`

### 1.1 Add to authority section

Add this under the current authority stack:

```md
### AI assistive layer note

The MVP may include an optional, button-click assistive AI layer only where it directly strengthens Proof Pack clarity, assignment clarity, claim-scoped verification requests, or privacy preflight.

This AI layer is subordinate to the locked MVP. It does not change the product definition, wedge, trust model, privacy model, or launch boundaries.

The controlling addendum is:

- `docs/ai/Proofound_AI_Assistive_Layer_Source_Of_Truth_Addendum_2026-05-03.md`

If the AI addendum conflicts with this locked source of truth, this locked source of truth wins.
```

### 1.2 Add to focus-protection boundaries

Add this bullet under the existing focus-protection boundaries:

```md
- Assistive AI is allowed only as optional support for proof quality, assignment clarity, verification wording, and privacy preflight. It must not introduce scoring, ranking, automated hiring recommendations, black-box review intelligence, or AI-first positioning.
```

### 1.3 Add to non-goals

Add this bullet under explicit MVP non-goals or postponed scope:

```md
- AI candidate scoring, AI ranking, AI hiring recommendations, AI fit verdicts, and automated AI review decisions are excluded from MVP.
```

---

## 2. Patch `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`

### 2.1 Add under product frame or MVP boundaries

```md
## Optional assistive AI layer

The MVP may include a small optional AI assistive layer.

Allowed AI assistance:

- Proof Pack Assistant: suggests missing context, clearer ownership wording, clearer outcome wording, evidence gaps, and privacy flags.
- Assignment Clarity Assistant: suggests clearer outcomes, constraints, proof expectations, and ambiguity fixes.
- Verification Request Composer: drafts claim-scoped verification request language for user review.
- Privacy Preflight: rules-first privacy check with optional model review of short sanitized text.

Product rules:

- AI suggestions are optional and button-click based.
- AI suggestions are never saved, sent, or published automatically.
- AI does not score, rank, recommend, shortlist, or evaluate candidates.
- AI does not make hiring, reveal, verification, or trust decisions.
- AI does not receive full private files by default.
- AI output is always user-reviewed before use.
- Review Summary / Reason-Code Explanation Assistant is postponed from MVP v1.
```

### 2.2 Add to individual product surfaces

```md
### Assistive proof drafting

Individuals may request optional suggestions while editing a Proof Pack.

The assistant may suggest missing context, clearer claim wording, clearer ownership wording, clearer outcome wording, evidence gaps, privacy flags, and verification request ideas.

The assistant must not invent facts, add unsupported claims, add unverified outcomes, or change proof content automatically.
```

### 2.3 Add to organization product surfaces

```md
### Assistive assignment drafting

Organization owners or managers may request optional assignment clarity suggestions.

The assistant may flag ambiguous outcomes, missing constraints, vague capability requirements, and weak proof expectations.

The assistant must not create candidate scoring rubrics, ranking logic, or discriminatory criteria.
```

### 2.4 Add to verification section

```md
### Assistive verification request drafting

Individuals may request an optional draft for a claim-scoped verification request.

The assistant may produce a subject, message, claim scope, and scoped verification questions.

The request must remain attached to one claim or one Proof Pack. It must not ask for vague praise or overall candidate judgment. The user must review and send it manually.
```

### 2.5 Add to privacy section

```md
### AI privacy preflight

Privacy preflight remains rules-first.

An optional model check may be used only after deterministic redaction and only for short sanitized text. It cannot certify privacy safety and cannot replace user review or manual ops review.
```

---

## 3. Patch `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`

### 3.1 Add under technical scope

```md
### Optional AI assistive layer

The technical architecture may include an optional server-side AI assistive layer using a provider abstraction. Gemini 3.1 Flash-Lite Preview is the default testing assumption, but the exact provider model ID must be environment-configured.

The AI layer must be disabled by default, rate limited, spend capped, logged, cacheable, and safe to disable without breaking core MVP flows.
```

### 3.2 Add under security

```md
AI security requirements:

- AI API keys must be server-only.
- No `NEXT_PUBLIC_*` AI provider key is allowed.
- All AI routes require authentication.
- All AI routes enforce entity ownership or organization role access.
- AI routes must validate input with Zod.
- AI output must be JSON-schema validated before use.
- Provider failures must fail closed with deterministic fallback behavior.
```

### 3.3 Add under privacy

```md
AI privacy requirements:

- No full private file is sent to the model by default.
- No original filename is sent to the model by default.
- No signed URL, private storage URL, API key, cookie, session ID, or token is sent to the model.
- Hidden identity-bearing review data is not sent to the model.
- Sensitive and protected-trait information is redacted or rejected before model calls.
- Raw prompts are not logged by default.
- Usage logs store metadata, hashes, token counts, feature names, cost, and redaction summaries, not raw private content.
```

### 3.4 Add under data model

```md
AI data model additions:

- `ai_usage_logs`
- `ai_monthly_budgets`
- `ai_suggestion_cache`
- `ai_suggestion_events`

These tables support spend caps, auditability, cache reuse, and user-visible suggestion event tracking. They must not become a hidden candidate evaluation store.
```

### 3.5 Add under reliability

```md
AI fallback requirements:

- Core MVP flows must work when AI is disabled.
- Budget exhaustion must not break Proof Pack editing, assignment drafting, verification requests, or privacy checks.
- Disabled AI returns deterministic checklists or static templates.
```

---

## 4. Patch `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`

### 4.1 Add to launch-blocking gates

```md
### AI assistive layer gates

If AI assistance is enabled for a pilot, the following gates must pass:

- AI feature flag state is visible to operators.
- AI API keys are server-only.
- No client-exposed AI key exists.
- AI monthly hard cap is configured.
- AI usage logging is active.
- AI raw prompt logging is disabled in production.
- AI privacy redaction tests pass.
- AI routes reject full private file payloads.
- AI routes reject signed URLs and tokenized links.
- AI routes do not produce scoring, ranking, fit verdicts, or hiring recommendations.
- AI can be disabled without breaking the core corridor.
```

### 4.2 Add to smoke-test matrix

```md
### AI assistive layer smoke checks, if enabled

- Proof Pack Assistant returns suggestion or deterministic fallback.
- Assignment Clarity Assistant returns suggestion or deterministic fallback.
- Verification Request Composer returns draft or deterministic fallback.
- Privacy Preflight runs deterministic rules without provider dependency.
- Budget cap blocks calls safely.
- Feature flag off disables provider calls.
- Launch status shows AI budget state without exposing secrets or raw prompts.
```

### 4.3 Add to safe mode

```md
### AI safe mode

AI safe mode is activated by setting `AI_ASSISTANTS_ENABLED=false`.

Safe mode disables provider calls and keeps deterministic fallbacks available. It must be used immediately after any privacy, cost, provider, or trust incident involving AI suggestions.
```

---

## 5. Patch `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md`

### 5.1 Add to positioning rule

```md
### AI positioning rule

Do not lead with AI.

AI may be mentioned only as optional guided assistance inside the product, not as the category or promise.

Allowed phrasing:

- guided suggestions
- improve this proof
- clarify assignment
- draft verification request
- check privacy before publishing

Avoid:

- AI-powered hiring intelligence
- AI candidate scoring
- AI recruiter
- AI screening
- AI talent intelligence
- automated hiring decisions
```

### 5.2 Add to buyer messaging

```md
AI should support the buyer promise only indirectly.

The buyer promise remains:

- clearer assignments
- stronger signal than CVs
- proof-backed review
- less shortlist noise
- privacy-safe reveal

Do not sell AI as the product. Sell better proof-backed review.
```

---

## 6. Patch `docs/ENV_VARIABLES.md`, if present

Add:

````md
## AI assistive layer

```bash
AI_ASSISTANTS_ENABLED=false
AI_PROVIDER=gemini
AI_MODEL_DEFAULT=gemini-3.1-flash-lite-preview
AI_MODEL_FALLBACK=

AI_GEMINI_PROD_API_KEY=
AI_GEMINI_STAGING_API_KEY=

AI_MONTHLY_HARD_CAP_SEK=500
AI_PROD_MONTHLY_HARD_CAP_SEK=500
AI_ABSOLUTE_MONTHLY_STOP_SEK=160
AI_USD_TO_SEK_RATE=10.5

AI_MAX_INPUT_CHARS=8000
AI_DEFAULT_MAX_OUTPUT_TOKENS=700
AI_CACHE_TTL_DAYS=30
AI_RAW_PROMPT_LOGGING_ENABLED=false
AI_REQUIRE_USER_CONSENT=true
AI_GLOBAL_DAILY_LIMIT=250
AI_USER_DAILY_LIMIT=20
AI_ORG_DAILY_LIMIT=50
AI_PROOF_PACK_ASSISTANT_DAILY_LIMIT=500
AI_ASSIGNMENT_CLARITY_DAILY_LIMIT=500
AI_VERIFICATION_REQUEST_COMPOSER_DAILY_LIMIT=500
AI_PRIVACY_PREFLIGHT_DAILY_LIMIT=500
```
````

Rules:

- never use `NEXT_PUBLIC_*` for provider secrets
- keep AI disabled by default
- verify exact provider model ID and pricing before production enablement

````

---

## 7. Patch `docs/launch-status.md`, if present

Add:

```md
## AI launch status fields

If AI assistance is implemented, launch status should expose only safe operator metadata:

```json
{
  "aiAssistantsEnabled": false,
  "aiProvider": "gemini",
  "aiModelDefault": "gemini-3.1-flash-lite-preview",
  "aiBudgetState": "disabled",
  "aiSpendThisMonthSek": 0,
  "aiMonthlyCapSek": 120,
  "aiRawPromptLoggingEnabled": false
}
````

Do not expose API keys, raw prompts, raw model responses, hidden user data, or provider request payloads.

```

---

## 8. Final doc-state rule

After these patches, the documentation hierarchy should read like this:

1. Locked MVP source of truth remains controlling.
2. AI addendum is allowed only where it supports the locked MVP.
3. PRD and technical requirements define feature and implementation details.
4. Launch runbook defines gates and safe mode.
5. GTM continues to avoid AI-first positioning.

No document should describe Proofound as an AI hiring product.
```
