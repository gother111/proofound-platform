> Doc Class: `reference-spec`
> Last Verified: `2026-05-04`

# Proofound AI Assistive Layer Technical Requirements

**Status:** Controlled rollout technical addendum
**Date:** 2026-05-03  
**Audience:** Engineering, QA, privacy, ops  
**Authority:** Subordinate to `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`, `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`, and `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`.

---

## 0. Technical purpose

This document defines the technical contract for the optional AI assistive layer.

The AI layer must be:

- server-side only
- optional
- button-click based
- privacy-conscious
- auditable
- spend-capped
- cacheable
- JSON-schema validated
- safe to disable without breaking the core MVP

The AI layer must not introduce AI scoring, ranking, fit judgments, or hiring recommendations.

---

## 0.1 Rollout-State Technical Contract

### Production-eligible assistive AI

The following assistive AI surfaces are production-eligible only after all production gates pass:

- `proof_pack_assistant`
- `assignment_clarity`
- `verification_request_composer`
- `privacy_preflight`
- `ai_suggestion_events`

Required production gates:

- live Gemini model smoke succeeds against the configured production model ID
- app-level monthly hard cap blocks calls before provider spend exceeds the cap
- launch status reports AI enabled/disabled state, budget state, model ID, and raw-prompt logging state without secrets or prompts
- privacy/redaction tests pass for each feature
- raw prompt logging is disabled in production-like environments
- feature flags and deterministic fallbacks are verified

### Authenticated-user OCR beta

Google Cloud Document AI OCR may be used only for authenticated-user Proof Artifact Text Extraction and authenticated-individual Start from CV while the beta gates are open. It must not reactivate the archived CV import wizard, create employer-side CV parsing, or be treated as a broad production OCR dependency.

Technical beta requirements:

- explicit user consent per document before OCR
- authenticated session plus server-side feature flag
- maximum one document per request initially
- page cap and file-size cap enforced before provider call
- app-level OCR spend cap enforced in app/service code
- safe disabled and expired states that make no Cloud Run call
- Cloud Run max instances set to `1` initially and never above `3` during beta
- Document AI only; Cloud Vision OCR is excluded
- output returned only as user-reviewable draft text
- no automatic proof writes, publication, verification, score, rank, shortlist, match-state update, review-state update, trust-state update, or hiring recommendation

Google Cloud budgets are alerting tools only. They are not hard caps. Hard caps must be enforced in the Proofound app and/or OCR worker before any Document AI call.

The temporary credit window is expected to expire around `2026-08-03`. The release owner must make a disable-or-pay decision no later than `2026-07-24`, and the default decision is disable unless billing and privacy owners explicitly approve continued spend. Users should see the feature as beta-only, without seeing internal budget or credit-expiry details.

---

## 1. Feature surface

Allowed MVP AI endpoints:

```text
POST /api/ai/proof-pack/suggest
POST /api/ai/assignments/clarify
POST /api/ai/verifications/compose
POST /api/ai/privacy-preflight/check
```

Forbidden AI endpoint patterns:

```text
/api/ai/candidate-score
/api/ai/rank
/api/ai/fit
/api/ai/recommend-candidate
/api/ai/reviewer-intelligence
/api/ai/shortlist
/api/ai/hiring-decision
```

Every AI endpoint must:

1. require an authenticated session
2. check entity ownership or organization membership
3. check feature flag state
4. check user AI disclosure acceptance if required
5. validate input with Zod
6. build sanitized context server-side
7. redact forbidden fields
8. hash sanitized input
9. check suggestion cache
10. enforce rate limits
11. reserve budget
12. call provider through abstraction
13. validate JSON output with Zod
14. store suggestion and usage metadata
15. return a user-visible suggestion only

---

## 2. Provider abstraction

Create a general provider interface.

Suggested files:

```text
src/lib/ai/provider/types.ts
src/lib/ai/provider/gemini-client.ts
src/lib/ai/provider/index.ts
src/lib/ai/prompts/proof-pack-assistant.ts
src/lib/ai/prompts/assignment-clarity.ts
src/lib/ai/prompts/verification-composer.ts
src/lib/ai/prompts/privacy-preflight.ts
src/lib/ai/schemas.ts
src/lib/ai/redaction.ts
src/lib/ai/cost.ts
src/lib/ai/budget-ledger.ts
src/lib/ai/suggestion-cache.ts
src/lib/ai/rate-limit.ts
```

Provider interface shape:

```ts
export type AiFeature =
  | 'proof_pack_assistant'
  | 'assignment_clarity'
  | 'verification_request_composer'
  | 'privacy_preflight';

export type AiGenerateJsonInput = {
  feature: AiFeature;
  model: string;
  promptVersion: string;
  system: string;
  user: unknown;
  schemaName: string;
  maxOutputTokens: number;
  temperature: number;
  requestId: string;
};

export type AiGenerateJsonResult<T> = {
  provider: 'gemini';
  model: string;
  output: T;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  rawFinishReason?: string;
};
```

Requirements:

- feature routes call `generateJson<T>()`
- Gemini-specific logic stays inside provider client
- model ID is environment-configured
- output is parsed and validated before return
- invalid JSON fails closed
- provider failure returns deterministic fallback

---

## 3. Environment variables

Recommended environment variables:

```bash
AI_ASSISTANTS_ENABLED=false
AI_PROVIDER=gemini
AI_MODEL_DEFAULT=gemini-3.1-flash-lite-preview
AI_MODEL_FALLBACK=
AI_MODEL_FALLBACK_VERIFIED=false
AI_PROVIDER_SMOKE_LAST_SUCCESS_AT=

AI_GEMINI_PROD_API_KEY=
AI_GEMINI_STAGING_API_KEY=

AI_MONTHLY_HARD_CAP_SEK=500
AI_PROD_MONTHLY_HARD_CAP_SEK=500
AI_ABSOLUTE_MONTHLY_STOP_SEK=160
AI_USD_TO_SEK_RATE=10.5

AI_MAX_INPUT_CHARS=8000
AI_DEFAULT_MAX_OUTPUT_TOKENS=700
AI_PROOF_PACK_MAX_OUTPUT_TOKENS=700
AI_ASSIGNMENT_MAX_OUTPUT_TOKENS=900
AI_VERIFICATION_MAX_OUTPUT_TOKENS=500
AI_PRIVACY_PREFLIGHT_MAX_OUTPUT_TOKENS=500

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

Rules:

- no `NEXT_PUBLIC_*` AI API key is allowed
- all API keys are server-only
- exact provider model ID can be updated through env without code changes
- pricing constants must be reviewed against provider documentation before production enablement

---

## 4. Database schema

Add general AI tables. Do not reuse CV-import-specific logs for the new assistive layer.

### 4.1 `ai_usage_logs`

```sql
create table ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  request_id text not null,
  user_id uuid null,
  org_id uuid null,
  feature text not null,
  entity_type text null,
  entity_id uuid null,
  provider text not null,
  model text not null,
  prompt_version text not null,
  input_hash text not null,
  output_hash text null,
  status text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  total_tokens integer not null default 0,
  estimated_cost_ore integer not null default 0,
  actual_cost_ore integer not null default 0,
  latency_ms integer null,
  cache_hit boolean not null default false,
  redaction_summary jsonb not null default '{}'::jsonb,
  error_code text null,
  error_message text null,
  created_at timestamptz not null default now()
);
```

### 4.2 `ai_monthly_budgets`

```sql
create table ai_monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  project_slot text not null,
  month_start date not null,
  currency text not null default 'SEK',
  monthly_limit_ore integer not null,
  spent_ore integer not null default 0,
  reserved_ore integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, project_slot, month_start)
);
```

### 4.3 `ai_suggestion_cache`

```sql
create table ai_suggestion_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  org_id uuid null,
  feature text not null,
  entity_type text not null,
  entity_id uuid not null,
  prompt_version text not null,
  input_hash text not null,
  output_json jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(feature, entity_type, entity_id, prompt_version, input_hash)
);
```

### 4.4 `ai_suggestion_events`

```sql
create table ai_suggestion_events (
  id uuid primary key default gen_random_uuid(),
  suggestion_cache_id uuid null references ai_suggestion_cache(id) on delete set null,
  user_id uuid not null,
  org_id uuid null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

RLS requirements:

- service role can insert/update usage and cache records
- ordinary users cannot read global usage logs
- users can only read suggestions scoped to their own entities
- org users can only read suggestions scoped to orgs where they hold an allowed role
- logs must not expose hidden candidate or org data

---

## 5. Data rules

### 5.1 Allowed fields

Allowed only when relevant and selected or derived safely server-side:

- Proof Pack title
- short claim
- ownership statement
- outcome summary
- coarse timeframe
- selected skill labels
- evidence item type
- public-safe evidence item title after redaction
- visibility state
- verification target type
- assignment title
- assignment outcome summary
- assignment constraints
- proof expectations
- must-have capability labels
- non-sensitive verifier relationship type

### 5.2 Forbidden fields

Never send by default:

- full private files
- raw PDFs, images, screenshots, decks, repos, or CVs
- full file text
- original filenames
- signed URLs or private storage URLs
- email addresses
- phone numbers
- national ID numbers
- home addresses
- exact birthdates
- salary details
- visa or residence documents
- health, disability, race, ethnicity, religion, union, political, sexuality, family, or age-related information
- candidate name or photo in blind-review contexts
- hidden employer, school, client, or location fields
- reviewer names or emails
- private organization notes
- internal decision notes
- confidential customer names
- access tokens, API keys, auth codes, cookies, or session IDs

### 5.3 Redaction rules

Before any model call:

- candidate name becomes `[candidate]`
- organization/client names become `[organization]` or `[client]` when hidden
- emails become `[email]`
- phones become `[phone]`
- exact addresses become `[location]`
- URLs become `[link]`, unless tokenized, in which case reject
- filenames become `[file]`
- exact dates become month/year when exactness is unnecessary
- HTML is stripped
- markdown links are normalized
- long text is truncated
- redaction summary is stored without raw removed values

---

## 6. Prompt contracts

### 6.1 Proof Pack Assistant system prompt

```text
You help improve Proof Pack clarity.

Rules:
- Do not invent facts.
- Do not add employers, clients, dates, metrics, evidence, skills, or verification states that are not present.
- Do not score the person.
- Do not rank the person.
- Do not infer protected traits.
- Improve structure only: claim, ownership, outcome, context, evidence gaps, privacy flags.
- Return JSON only.
```

### 6.2 Assignment Clarity Assistant system prompt

```text
You help organizations clarify assignments for proof-backed review.

Rules:
- Do not write generic job-description copy.
- Do not add discriminatory or protected-trait criteria.
- Do not create candidate scoring or ranking.
- Focus on outcomes, constraints, must-have capabilities, proof expectations, and ambiguity.
- Return JSON only.
```

### 6.3 Verification Request Composer system prompt

```text
You draft claim-scoped verification requests.

Rules:
- Ask about one Proof Pack or one claim.
- Do not ask for vague praise.
- Do not ask the verifier to judge overall candidate quality.
- Do not expose hidden private context.
- Use concise, respectful language.
- Return JSON only.
```

### 6.4 Privacy Preflight system prompt

```text
You check short sanitized proof text for possible privacy issues.

Rules:
- This is not legal advice.
- Do not certify safety.
- Flag possible identity, contact, confidential, client, employer, credential, location, and access-token leakage.
- Suggest redactions.
- Return JSON only.
```

---

## 7. JSON schemas

### 7.1 Proof Pack Assistant

```json
{
  "summary": "string",
  "missingContext": [
    {
      "field": "ownership|outcome|timeframe|evidence|context|verification",
      "issue": "string",
      "suggestedQuestion": "string"
    }
  ],
  "suggestedRewrite": {
    "title": "string|null",
    "claimStatement": "string|null",
    "ownershipStatement": "string|null",
    "outcomeSummary": "string|null"
  },
  "privacyFlags": [
    {
      "risk": "low|medium|high",
      "text": "string",
      "reason": "string",
      "suggestedRedaction": "string"
    }
  ],
  "verificationSuggestions": ["string"],
  "warnings": ["string"]
}
```

### 7.2 Assignment Clarity Assistant

```json
{
  "ambiguityFlags": [
    {
      "field": "outcome|capability|constraint|proof_expectation|scope",
      "issue": "string",
      "suggestedFix": "string"
    }
  ],
  "suggestedRewrite": {
    "title": "string|null",
    "outcomeSummary": "string|null",
    "proofExpectations": ["string"],
    "mustHaveCapabilities": ["string"],
    "constraints": ["string"]
  },
  "reviewQuestions": ["string"],
  "excludedOrRiskyCriteria": ["string"]
}
```

### 7.3 Verification Request Composer

```json
{
  "subject": "string",
  "message": "string",
  "claimScope": "string",
  "verificationQuestions": ["string"],
  "privacyNotes": ["string"],
  "tooBroadWarnings": ["string"]
}
```

### 7.4 Privacy Preflight

```json
{
  "riskLevel": "low|medium|high",
  "flags": [
    {
      "category": "identity|contact|employer|client|location|credential|confidential|file_metadata|access_token|other",
      "risk": "low|medium|high",
      "detectedText": "string",
      "reason": "string",
      "suggestedRedaction": "string"
    }
  ],
  "safeToPublishSuggestion": "yes|review_first|do_not_publish",
  "notes": ["string"]
}
```

---

## 8. Rate limits and spend caps

Recommended initial limits:

| Scope                  |                                     Limit |
| ---------------------- | ----------------------------------------: |
| Per authenticated user |                     20 AI actions per day |
| Per user per feature   |                                 8 per day |
| Per organization       |                                50 per day |
| Per assignment         |                                20 per day |
| Per IP                 | 10 per minute for authenticated API calls |
| Global production      |                  stop at monthly hard cap |

Spend caps:

- product-level month 1 cap: 120 SEK
- production cap: 80 SEK
- staging cap: 40 SEK
- QA cap: 40 SEK
- absolute stop across projects: 160 SEK

Rules:

- do not use account or key rotation to bypass provider limits
- do not continue calls after app-level cap is reached
- reserve budget before provider call
- finalize actual usage after provider response
- release reservation on provider failure

---

## 9. Fallback behavior

When AI is disabled, credits are exhausted, rate limits are hit, or provider calls fail:

- Proof Pack Assistant returns deterministic proof checklist
- Assignment Clarity Assistant returns deterministic assignment clarity checklist
- Verification Composer returns static scoped template
- Privacy Preflight runs deterministic rules only

Fallback copy:

> Suggestions are unavailable right now. You can still use the checklist below.

Core MVP flows must continue to work without AI.

---

## 10. Tests

Add or update tests for:

### Provider and config

- feature flag disabled returns fallback
- no client-side API key exists
- invalid JSON fails closed
- schema validation rejects malformed output
- model ID is env-driven

### Privacy and redaction

- emails, phones, filenames, URLs, token strings, and hidden names are redacted
- full files are rejected
- signed URLs are rejected
- hidden review-stage identity is not sent

### Budget and rate limiting

- monthly cap blocks calls
- per-user limit blocks calls
- per-org limit blocks calls
- reservation is released after provider failure
- cached suggestion avoids provider call

### Routes

- unauthenticated calls return 401
- unauthorized entity access returns 403
- disabled AI returns fallback
- provider failure returns fallback

### UI

- AI buttons appear only in allowed flows
- suggestions are not auto-saved
- user can accept, edit, or dismiss
- AI output is visibly labeled as suggestion
- UI does not mention scoring, ranking, fit verdicts, or hiring intelligence

### Launch guardrails

- test fails if `/api/ai/candidate-score` or similar route exists
- test fails if `NEXT_PUBLIC_*GEMINI*` env key is present
- test fails if raw prompt logging is enabled in production
- test fails if AI routes accept full file payloads

---

## 11. Launch status fields

Add AI state to launch status or admin-only launch diagnostics:

```json
{
  "aiAssistantsEnabled": false,
  "aiProvider": "gemini",
  "aiModelDefault": "gemini-3.1-flash-lite-preview",
  "aiMonthlyCapSek": 120,
  "aiSpendThisMonthSek": 0,
  "aiBudgetState": "disabled|healthy|near_cap|exhausted",
  "aiRawPromptLoggingEnabled": false,
  "aiLastProviderError": null
}
```

Do not expose API keys, raw prompts, raw model responses, or hidden private data in launch status.

---

## 12. Acceptance criteria

The AI layer is technically acceptable only when:

- all AI routes are authenticated
- all AI routes enforce ownership or org role access
- all model calls go through provider abstraction
- all API keys are server-only
- every model response is schema validated
- no full private files are sent by default
- all AI calls are logged without raw prompts by default
- all AI calls are rate limited
- all AI calls are budget capped
- cached suggestions work
- provider failure does not break core flows
- the UI requires explicit user acceptance before saving AI suggestions
- launch guardrails pass
