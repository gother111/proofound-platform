> Doc Class: `reference-spec`
> Last Verified: `2026-05-04`

# Proofound MVP AI Assistive Layer Addendum

**Status:** Controlled rollout source-of-truth addendum
**Date:** 2026-05-03  
**Audience:** Founder, product, engineering, QA, privacy, ops  
**Authority:** This document is subordinate to `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`. It does not replace, broaden, or reinterpret the locked MVP. It only defines where optional AI assistance is allowed inside the existing MVP corridor.

---

## 0. Purpose

This addendum defines the allowed AI layer for Proofound MVP.

The AI layer is not a new product direction. It is an optional assistive layer inside the existing proof-first, privacy-first hiring credibility corridor.

The purpose of AI in the MVP is to reduce user friction and improve the quality of existing MVP objects:

- Proof Packs
- assignments
- verification requests
- privacy preflight before publishing or review

AI must not become the product center.

---

## 0.1 Controlled Rollout Classification

This addendum separates production-eligible assistive AI from the authenticated-user OCR beta.

### Production-eligible after gates pass

The following Gemini assistive AI features may be considered production-eligible only after live model smoke, app-level hard caps, launch-status checks, privacy tests, and raw-prompt logging checks pass:

- Proof Pack Assistant
- Assignment Clarity Assistant
- Verification Request Composer
- Privacy Preflight
- Suggestion Event Tracking

Until those gates pass, each feature remains disabled-by-default and must fall back deterministically.

### Production beta only

Proof Artifact Text Extraction using Google Cloud Document AI OCR is a separate authenticated-user beta. Start from CV may also use the guarded Document AI OCR path as an authenticated-individual beta when `START_FROM_CV_OPEN_BETA_ENABLED=true`. These beta paths are not the archived CV import wizard, not employer-side parsing, and not a broad production OCR platform.

OCR output is draft text only. It must not auto-publish, auto-verify, auto-score, auto-rank, shortlist candidates, or affect match, review, verification, reveal, trust-state, or hiring-decision state.

Every OCR request requires explicit user consent per document and must be feature-flagged, authenticated, page-limited, file-size-limited, spend-capped, expiry-gated through the August 3, 2026 beta cutoff, and safe to disable.

### Internal-only / excluded

Internal status checks, synthetic smoke tests, and provider diagnostics may exist only to prove safety. They do not authorize processing real or pilot documents.

Explicitly excluded from the MVP and this rollout:

- archived CV import wizard and broad OCR/import flows
- AI candidate scoring
- AI ranking
- AI shortlisting
- AI suitability judgments
- AI hiring recommendations
- AI verification decisions
- AI trust-state decisions
- Gemini skill extractor for employer review
- taxonomy shortlist
- reranker
- Cloud Vision OCR
- moving core infrastructure from Vercel/Supabase to Google Cloud

---

## 1. Product ruling

### 1.1 What changes

Proofound may include a small, optional, button-click assistive AI layer.

This layer may help users:

- improve Proof Pack clarity
- identify missing Proof Pack context
- clarify assignment language and proof expectations
- draft claim-scoped verification requests
- check common privacy risks before publishing

### 1.2 What does not change

The locked MVP definition remains unchanged:

- Proofound is a proof-first, privacy-first hiring credibility corridor.
- Proof Packs remain the canonical proof object.
- Public portfolios remain selected output surfaces derived from Proof Packs.
- Assignment clarity remains central to the organization corridor.
- Review remains blind by default.
- Identity reveal remains candidate-consented.
- Verification remains claim-scoped.
- Proof and review remain explainable and auditable.

### 1.3 Explicit non-goals

The AI layer must not introduce:

- AI candidate scoring
- AI ranking
- AI shortlist automation
- AI hiring recommendations
- AI fit verdicts
- black-box review intelligence
- automatic candidate evaluation
- automatic reveal decisions
- automatic verification decisions
- full-file AI analysis by default
- hidden background AI processing

The product must not be repositioned as:

- an AI recruiter
- an AI ATS
- an AI screening platform
- AI hiring intelligence
- generic AI recruiting

---

## 2. Allowed MVP AI features

### 2.1 Proof Pack Assistant

**Allowed purpose:** Help an individual improve clarity, structure, and completeness of a Proof Pack.

Allowed outputs:

- missing context suggestions
- clearer claim wording
- clearer ownership wording
- clearer outcome wording
- evidence gap suggestions
- privacy flags
- verification request suggestions

Hard limits:

- must not invent facts
- must not add employers, clients, dates, skills, outcomes, metrics, or verification states that are not present
- must not score or rank the individual
- must not infer protected traits
- must not change content automatically

MVP status: allowed in MVP v1.

---

### 2.2 Assignment Clarity Assistant

**Allowed purpose:** Help organizations write clearer assignments with better outcomes, constraints, capability requirements, and proof expectations.

Allowed outputs:

- ambiguity flags
- suggested rewrite of assignment title and outcome summary
- proof expectation suggestions
- must-have capability clarification
- review question suggestions
- risky or unsupported criteria warnings

Hard limits:

- must not produce candidate scoring rubrics
- must not create ranking logic
- must not introduce discriminatory criteria
- must not use private candidate data
- must not imply that AI evaluates candidates

MVP status: allowed in MVP v1.

---

### 2.3 Verification Request Composer

**Allowed purpose:** Help individuals draft a concise claim-scoped verification request.

Allowed outputs:

- message subject
- request body
- claim scope
- scoped verification questions
- privacy notes
- warning if request is too broad

Hard limits:

- must not ask for vague praise
- must not ask the verifier to assess overall candidate quality
- must not expose hidden private context
- must not include verifier email or private verifier contact details in the model prompt
- must not send the request automatically

MVP status: allowed in MVP v1.

---

### 2.4 Privacy Preflight Assistant

**Allowed purpose:** Help users identify common privacy risks before publishing or exposing proof text.

This feature must be rules-first. Deterministic privacy checks run before any model call.

Allowed outputs:

- risk level
- privacy flags
- suggested redactions
- publication caution state
- privacy notes

Hard limits:

- must not claim to certify privacy safety
- must not replace user review
- must not replace manual ops review where required
- must not send full files
- must not send original filenames
- must not send signed URLs or private storage URLs

MVP status: allowed in MVP v1, with deterministic rules as the primary mechanism and optional model check only for short sanitized text.

---

### 2.5 Review Summary and Reason-Code Explanation Assistant

**Allowed purpose in future:** Rewrite existing deterministic reason codes into plainer language.

MVP v1 ruling: postponed.

Reason:

- this feature is too close to candidate evaluation
- it may be misunderstood as AI review intelligence
- it may weaken the trust thesis if introduced before strong deterministic review semantics are proven

If introduced later, it must only explain already existing deterministic reason codes. It must not generate new reasons, scores, rankings, fit decisions, or recommendations.

---

## 3. Model and provider posture

### 3.1 Default model assumption

The MVP AI assistive layer is configured around Gemini 3.1 Flash-Lite through Google AI Studio or the relevant Google Gemini API surface. As of May 8, 2026, Google documents the configured model code as stable: `gemini-3.1-flash-lite`.

The exact model identifier must be configured server-side through environment variables. The product must not hardcode the model name in client code.

Recommended environment posture:

```bash
AI_ASSISTANTS_ENABLED=false
AI_PROVIDER=gemini
AI_MODEL_DEFAULT=gemini-3.1-flash-lite
```

If the provider exposes a different exact model ID, implementation must update the server-side environment value without changing product behavior.

### 3.2 Provider abstraction

Proofound must implement AI through a provider abstraction. Feature routes must not depend directly on Gemini-specific client code.

Reason:

- model names can change
- pricing can change
- provider terms can change
- the product must be able to disable or replace the model without rewriting feature logic

### 3.3 Credit use

The current testing budget is approximately 160 SEK per month across two Google AI Studio accounts or projects, with one main key and one secondary key capped at roughly 80 SEK each.

This budget may be used for pilot testing only if:

- usage is compliant with provider terms
- server-side keys are used only on the backend
- account or key rotation is not used to bypass limits or provider restrictions
- app-level spend caps are enforced
- usage is logged and auditable
- the product fails safely when credits are exhausted

---

## 4. AI product principles

Every AI feature in MVP must satisfy all of these rules:

1. Optional. The user must click a button to request help.
2. Visible. The user must see that the suggestion came from AI assistance.
3. Editable. The user can edit before saving or sending.
4. Non-authoritative. AI output is a suggestion, not a fact or decision.
5. Auditable. The system logs usage, prompt version, model, feature, and cost metadata.
6. Privacy-conscious. Only selected sanitized fields are sent.
7. Cheap. Each action must be short, capped, and cacheable.
8. Disableable. A global kill switch must turn off all AI assistance without breaking the core MVP.
9. Non-decisional. AI must not make hiring, reveal, verification, or review decisions.
10. Source-of-truth compatible. AI must strengthen the locked corridor, not broaden it.

---

## 5. User-facing disclosure

Use this disclosure near the first AI action and in settings:

> This assistant sends selected text fields to Google Gemini to suggest edits. It does not receive your full files by default, does not score candidates, and does not make hiring decisions. Review every suggestion before saving.

For privacy checks:

> This check can flag common privacy risks, but it cannot guarantee that text is safe to publish.

---

## 6. Marketing and positioning rule

AI must not lead the public story.

Do not use homepage or sales language such as:

- AI-powered hiring intelligence
- AI candidate matching
- AI recruiter
- AI scoring
- AI talent intelligence
- automated hiring decisions

Allowed plain-language phrasing:

- guided suggestions
- improve this proof
- suggest missing context
- draft verification request
- check privacy before publishing
- clarify assignment

Public positioning remains:

> Proofound helps people turn real work into structured Proof Packs, and helps organizations review candidates through proof instead of profile theater.

---

## 7. MVP acceptance criteria

The AI layer is acceptable for MVP only if all criteria are met:

- AI is feature-flagged off by default.
- API keys are server-only.
- All selected features work without AI through deterministic fallback states.
- No model call receives full private files by default.
- No model call receives hidden identity-bearing review data.
- No route produces score, rank, fit verdict, or hiring recommendation.
- Every model output is JSON schema validated.
- Every AI action is rate limited.
- Every AI action is spend-capped.
- Every AI action is logged without raw private prompt storage by default.
- Users must explicitly accept, edit, or dismiss suggestions.
- Deletion/export behavior is defined for user-visible AI suggestions.

---

## 8. Final ruling

The AI assistive layer is allowed as an MVP addendum because it supports the locked MVP corridor.

It does not change what Proofound is.

It must remain a small assistive layer for proof quality, assignment clarity, verification wording, and privacy preflight.
