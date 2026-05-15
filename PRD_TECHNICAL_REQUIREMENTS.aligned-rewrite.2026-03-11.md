# Proofound MVP Technical Requirements — Aligned Rewrite

**Status:** Aligned rewrite for current MVP  
**Date:** 2026-03-11  
**Audience:** Engineering, product, QA, operations  
**Authority:** This is the active technical contract beneath `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md` and `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`. `Proofound_Project_Specification_2026-03-11.md` is reference-only implementation context and must not broaden this document.

---

## 0. Purpose of this document

This document defines the launch-binding technical contract for the Proofound MVP.

It is intentionally narrower than previous technical drafts.
It keeps only the architecture, data model, lifecycle, privacy, security, operational, and integration rules that are required for MVP launch.

---

## 1. Technical scope and architecture posture

### 1.1 Launch posture

Proofound MVP is a web application that supports:

- proof-first Proof Pack creation and public proof portfolio surfaces
- private contextual scaffolding
- organization trust pages and assignments
- blind-by-default review with progressive reveal
- intro, interview, decision, and engagement-verification workflows
- export, deletion, auditability, and manual operational support

### 1.2 Architecture principles

- Source-of-truth product rules are enforced in code, not only in UI copy.
- Privacy and auditability are launch-critical, not post-launch polish.
- Proof and verification semantics must stay scoped and explicit.
- Manual operations are acceptable where they strengthen trust or pilot control.
- Future interoperability should be supported through versioned proof structures, but launch must avoid speculative integration sprawl.

### 1.3 Current implementation stack

Launch-binding stack:

- frontend: Next.js + TypeScript
- backend: Supabase + PostgreSQL + auth + storage
- hosting / deployment: Vercel
- transactional email: Resend
- telemetry / web vitals: Vercel Analytics or equivalent lightweight launch-safe tooling

Current stack may include optional OAuth sign-in providers, but:

- provider choice is implementation detail
- sign-in provider is not trust semantics
- LinkedIn import or employment-verification logic is not MVP trust logic

### 1.3.1 Optional AI assistive layer

The technical architecture may include an optional server-side AI assistive layer using a provider abstraction. Gemini 3.1 Flash-Lite is the default testing assumption, but the exact provider model ID must be environment-configured.

The AI layer must be disabled by default, rate limited, spend capped, logged, cacheable, and safe to disable without breaking core MVP flows.

### 1.4 Explicitly out of active technical scope

Not launch-binding in this document:

- ATS integrations
- HRIS / payroll / contract-signing integrations
- reviewer marketplace systems
- sponsor / bounty marketplace systems
- enterprise SSO / SCIM
- deep ML ranking infrastructure
- org analytics warehouse and BI stack
- cross-product event buses and distributed streaming architecture

These may exist in later appendices or future roadmaps, but they do not belong in the active MVP implementation contract.

---

## 2. Non-functional requirements

### 2.1 Security

Launch requirements:

- authenticated web sessions with revocation support
- scoped capability tokens for invite, attestation, verification-response, and recovery flows
- row-level access control on all sensitive entities
- distinct organization and individual permission contexts
- encryption in transit and at rest
- input validation on all write paths
- HTML / rich-text sanitization where user content is rendered
- CSRF protection for cookie-auth mutating routes
- rate limiting on public and mutation-heavy endpoints
- audit logging for security-sensitive actions
- AI API keys are server-only; no `NEXT_PUBLIC_*` AI provider key is allowed
- all AI routes require authentication, ownership or organization role authorization, Zod input validation, JSON-schema output validation, and fail-closed provider fallback behavior

### 2.2 Privacy

Launch requirements:

- blind-by-default review
- progressive reveal with explicit state transitions
- candidate consent before identity-bearing reveal
- narrowest-wins visibility enforcement
- separation of public portfolio surfaces from matching/review surfaces
- PII scrubbing in logs and analytics payloads
- metadata / filename redaction or sanitization for sensitive uploads
- no full private file, original filename, signed URL, private storage URL, API key, cookie, session ID, token, hidden identity-bearing review data, or protected-trait information is sent to an AI model by default
- AI usage logs store metadata, hashes, token counts, feature names, cost, and redaction summaries; raw prompts are not logged by default

### 2.3 Performance

Target posture:

- fast enough for calm, usable web experience in launch pilot conditions
- no blocking heavy client computation in proof review surfaces
- candidate review, proof editing, and assignment drafting must feel responsive under MVP load assumptions

### 2.4 Reliability

Launch requirements:

- transactional integrity on lifecycle state transitions
- idempotent handling for tokens, intros, reveals, and decision updates
- deterministic workflow recovery after retryable failures
- backups, restore discipline, and smoke-test verification before broad rollout
- core MVP flows must work when AI is disabled or budget is exhausted
- disabled AI returns deterministic checklists or static templates for proof drafting, assignment drafting, verification requests, and privacy checks

### 2.5 Accessibility

Launch requirements:

- keyboard navigability for primary flows
- clear focus states
- semantic heading structure
- adequate contrast and readable typography
- accessible forms and validation states
- accessible status communication for workflow steps and verification states

---

## 3. Canonical data model

### 3.1 Core entities

#### Identity and accounts

- `users`
- `profiles`
- `organizations`
- `organization_memberships`
- `audit_logs`

#### Private profile context

- `work_experiences`
- `volunteering_experiences`
- `education_experiences`

#### Proof and trust

- `proof_packs`
- `proof_items`
- `verification_records`
- `engagement_verifications`
- `attestation_requests`

#### Skills and matching

- `skills`
- `profile_skill_links`
- `proof_skill_links`
- `context_skill_links`
- `assignments`
- `matches`
- `reason_codes`
- `matching_preferences`

#### Workflow state

- `candidate_reviews`
- `intro_workflows`
- `reveal_requests`
- `interviews`
- `decisions`
- `feedback_records`

#### Optional AI support

- `ai_usage_logs`
- `ai_monthly_budgets`
- `ai_suggestion_cache`
- `ai_suggestion_events`

These tables support spend caps, auditability, cache reuse, and user-visible suggestion event tracking. They must not become a hidden candidate evaluation store.

### 3.2 Canonical role model

Supported org roles only:

- `org_owner`
- `org_manager`
- `org_reviewer`

Rules:

- `org_owner` controls org configuration, member invites, publish authority, and final decision rights
- `org_manager` can manage assignments and workflow operations within org limits
- `org_reviewer` can review candidates and contribute feedback within allowed scope
- no complex approval matrix in MVP

### 3.3 Canonical engagement type enum

MVP supports one engagement-type field used consistently across profile preferences, assignment drafting, matching, and post-decision records.

Supported values:

- `full_time`
- `part_time`
- `contract_consulting`
- `fractional_project`

### 3.4 Proof Pack contract

`proof_packs` is the canonical proof object.

Minimum fields:

- `proof_pack_id`
- `owner_profile_id`
- `title`
- `summary`
- `primary_claim_type`
- `claim_statement`
- `primary_context_type`
- `primary_context_id`
- `verification_target_type`
- `verification_target_scope`
- `secondary_context_refs[]`
- `role_context`
- `ownership_statement`
- `timeframe_start`
- `timeframe_end`
- `outcome_summary`
- `visibility_scope`
- `freshness_state`
- `verification_summary`
- `proof_quality_score`
- `schema_version`
- `status`

Launch rules:

- every Proof Pack must have one primary anchor context
- every Proof Pack must express one primary claim that can be shown and verified separately from its child evidence items
- intro-eligible users may not have orphan Proof Packs
- public visibility never overrides review-stage privacy ceilings
- proof schema must be versioned for future exportability

### 3.5 Proof item contract

`proof_items` are child evidence items under a Proof Pack.

Supported item classes:

- file upload
- URL / link
- case-study fragment
- credential evidence
- engagement evidence
- reviewer note / structured observation when policy allows

Each proof item includes:

- parent `proof_pack_id`
- item type
- storage or URL reference
- owner-visible source metadata
- sanitized render metadata
- item visibility scope
- item verification state
- ingest status
- integrity hash when applicable

### 3.6 Context object rules

Minimum fields by context type:

**Work experience**

- organization name
- role title
- start / end date or ongoing flag
- one concrete outcome or project summary
- optional details later

**Volunteering experience**

- organization / cause
- role or contribution type
- timeframe
- one concrete outcome or activity summary

**Education / learning experience**

- provider / institution
- program / course / credential
- timeframe
- optional relevance note

Rules:

- these are private by default
- they support proof anchoring and capability inference
- they must not behave like mandatory public résumé sections

### 3.7 Skills contract

Skills exist as support objects, not hero objects.

Rules:

- skills must link to proof and/or real context
- unsupported floating skills do not receive trust lift
- proof-backed skills are stronger than self-claimed skills
- interpersonal skills use bounded human-observed attestation rather than generic endorsement logic

Supported evidence classes:

- `artifact_backed`
- `credential_backed`
- `human_observed`
- `context_backed`

### 3.8 Verification record contract

Verification is scoped to a claim, proof, or skill context.

Supported verification types:

- `self_claimed`
- `peer_attested`
- `org_verified`
- `human_reviewed`
- `auto_checks_passed`

Verification record minimum fields:

- subject type and id
- verification type
- verifier type and id
- observed context
- recency / freshness metadata
- confidence / scope note
- contradiction / revocation state
- audit references

Rules:

- email is transport, not verification semantics
- sign-in provider status does not equal capability proof
- stale or contradicted verification must stop providing trust lift

### 3.9 Human-observed attestation contract

Supported for a limited set of universal / interpersonal skills.

Structured fields required:

- verifier identity
- relationship to subject
- work / project / learning context
- duration of observation
- last-observed date or period
- skill being attested
- observed behaviors
- confidence level
- conflict / bias disclosure

Hard rules:

- no generic praise blurbs as trust objects
- no anonymous endorsements
- no public popularity counts
- max bounded number of skills per attestation request

---

## 4. Privacy, visibility, and access contract

### 4.1 Canonical visibility scopes

Supported scopes:

- `owner_only`
- `matched_org`
- `link_only`
- `public`
- `internal_only`

### 4.2 Effective visibility rule

Effective visibility = narrowest of:

- object visibility
- parent visibility
- reveal-stage ceiling
- policy ceiling
- moderation or redaction override

### 4.3 Public portfolio rule

Public portfolio pages are explicit public surfaces.

They require the individual profile to meet the minimum proof-plus-verification threshold:

- safe shell complete
- at least one real context
- at least one anchored public-safe Proof Pack
- at least one accepted, clear, non-self verification tied to anchored proof or context
- requested publication state resolves to an accessible public state

They may show:

- selected Proof Packs
- selected outcomes
- selected trust summaries
- limited public-safe role framing

They must not weaken blind review inside matching surfaces.

### 4.4 Blind-by-default reveal stages

#### Stage 0 — anonymous review

Visible:

- anonymous label
- proof summaries
- outcome summaries
- skill clusters
- broad fit indicators
- narrow verification labels

Hidden:

- name
- photo
- direct public portfolio access in review UI
- exact employer or school names when redaction applies
- contact details
- unnecessary identity cues

#### Stage 1 — capability + proof review

Visible:

- deeper proof content
- methods / tools
- more detailed outcomes
- verification summary

Hidden:

- direct identity and contact data
- unnecessary identity-bearing context

#### Stage 2 — contextual reveal

Visible when allowed:

- timezone / broad region
- work authorization summary if used
- availability window
- context details allowed by consent and policy

#### Stage 3 — intro-approved reveal

Visible when approved:

- name
- photo if allowed
- public portfolio URL if published and allowed
- org / school names where permitted

#### Stage 4 — interview coordination reveal

Visible when required for coordination:

- direct contact details
- scheduling logistics
- meeting information

Rule:

- candidate approval is mandatory for identity-bearing reveal

### 4.5 Redaction and upload safety

Launch requirements:

- sanitize or quarantine identifying file metadata before review-stage display
- treat risky artifact renders as requires-review
- prevent raw filenames and metadata from leaking on public or review surfaces
- keep private notes non-candidate-facing unless explicitly transformed into candidate-visible feedback

---

## 5. Matching and workflow contract

### 5.1 Matching purpose

Matching helps organizations review better and helps individuals surface relevant proof.

It is not a black-box hiring oracle.

### 5.2 Matching inputs in MVP

Allowed inputs:

- proof relevance
- skill fit
- proof freshness
- verification fit
- engagement-type fit
- work mode / location / timezone fit
- assignment constraints
- readiness thresholds

### 5.3 Matching output rules

- reason codes are required
- proof-backed explanation is required
- exact score exposure is de-emphasized early
- blind review rules must be preserved
- matching cannot override privacy ceilings

### 5.4 Readiness tiers

Individual tiers:

- `portfolio_ready`
- `discoverable`
- `match_visible`
- `intro_eligible`
- `strongly_trusted`

Organization tiers:

- `org_ready`
- `assignment_ready`
- `review_ready`

Key product rule:

- portfolio-ready is narrow but requires the minimum proof-plus-verification threshold
- intro-eligible is meaningfully harder

### 5.5 Canonical relationship lifecycle contract

#### Objects

- `match_review_state`
- `intro_workflow`
- `reveal_request`
- `interview`
- `decision`
- `feedback_record`

#### Core transition corridor

- `generated -> shortlisted`
- `shortlisted -> intro_pending`
- `intro_pending -> intro_accepted | intro_declined | intro_expired | withdraw`
- `intro_accepted -> reveal_pending`
- `reveal_pending -> reveal_completed | intro_accepted`
- `reveal_completed -> interview_pending`
- `interview_pending -> interview_scheduled`
- `interview_scheduled -> interview_rescheduled | interview_cancelled | interview_completed | no_show_reported`
- `decision_pending -> advance | hold | reject | hire | withdraw`
- `advance -> interview_pending`
- `hold -> advance | hire | reject | closed_lost`

#### Decision and conclusion rules

- `hire` is an explicit MVP outcome
- `hire` is not the same as engagement verification
- post-hire / post-placement engagement confirmation may create `engagement_verification`
- optional proof issuance may happen after completed engagement, but is not required for every hire

#### Timing and SLA posture

- intro expiry and decision SLA must be tracked
- reveal timeout must be enforced
- interview reschedule history must be auditable
- candidate-visible closure feedback is required where policy says so

### 5.6 Notification contract

Launch-safe notification requirements:

- in-app + email for workflow events that require response or awareness
- no privacy-breaking payloads in email subjects or summaries
- no candidate notification for silent org shortlist actions before intro corridor opens
- no private notes in candidate-visible channels

---

## 6. API and operational contracts

### 6.1 Internal API posture

Required internal services / routes cover:

- auth / session
- profile shell and preferences
- private contexts
- Proof Pack CRUD and item ingest
- verification request / response
- public portfolio rendering
- organization management
- assignment CRUD and publish
- review queue actions
- intro / reveal / interview / decision lifecycle
- export / delete
- audit / admin moderation actions

### 6.2 Idempotency and duplication rules

- repeated intro requests for the same candidate + assignment return the active intro rather than creating duplicates
- token consumption must be replay-safe
- destructive operations must be deliberate and auditable
- workflow transitions must reject illegal state jumps

### 6.3 Audit requirements

Every sensitive action must write an audit event with:

- actor type
- actor id when available
- object type and id
- prior state
- next state
- reason code where applicable
- timestamp
- policy override or manual intervention flag where applicable

---

## 7. Current integrations only

### 7.1 Launch-binding integrations

Required in MVP:

- Supabase for database, auth, storage, and RLS-backed access control
- Resend or equivalent for transactional email
- Vercel or equivalent for web hosting and deployment
- lightweight analytics / monitoring suitable for launch pilots

### 7.2 Explicit non-launch integrations

Not part of MVP implementation contract:

- Teamtailor
- Greenhouse
- Lever
- Ashby
- LinkedIn employment verification
- HRIS / payroll systems
- DocuSign / contract-enforcement systems
- reviewer marketplace services
- sponsor marketplace services

The system should remain future-ready for later integrations through stable identifiers, event hooks, and versioned proof objects, but no live ATS integration is launch scope.

---

## 8. Launch operations and observability

### 8.1 Core launch metrics

Track at minimum:

- time to portfolio-ready
- time to first verified proof
- proof quality score distribution
- percentage of Proof Packs with non-self trust anchors
- share-to-open rate for public portfolios
- time to first qualified intro
- assignment publish completeness
- intro-to-interview conversion
- interview-to-decision cycle time
- engagement verification completion rate

### 8.2 Monitoring priorities

Monitor:

- auth failures and abnormal token usage
- file ingest failures / quarantine backlog
- reveal and lifecycle transition failures
- assignment publish failures
- export / delete failures
- email delivery failures for workflow-critical messages
- policy-violation or privacy-leak incidents

### 8.3 Safe mode posture

Safe mode may:

- pause new intros
- suppress exact ranking in favor of rank bands or unordered queues
- force manual verification / moderation on risky proof items
- hold reveals until manual review clears blocking issues

---

## 9. Launch acceptance checklist

The technical requirements are considered aligned when:

- only launch-binding integrations remain in active scope
- proof, verification, and engagement types are normalized consistently
- private scaffolding objects are first-class in the data model
- blind review and reveal stages are enforced across UI and API surfaces
- interview-to-hire-to-engagement verification states are explicit
- auditability and privacy protections are treated as launch gates, not later polish
- unsupported trust inflation paths are removed from active technical semantics

---

## 10. Final technical statement

The Proofound MVP technical contract supports a narrow, proof-first, privacy-safe hiring and credibility corridor.

It stores private context, surfaces structured proof, enforces scoped verification, preserves blind review until consented reveal, and supports a lean hiring-to-engagement flow without expanding into generic recruiting middleware.

---

## Appendix A. Narrow Optional AI Technical Addendum

This appendix is optional implementation scope beneath the locked MVP authority. It must not broaden matching, review, trust, verification, or decision semantics.

### A.1 Allowed capabilities

AI routes may support only:

- Proof Pack clarity suggestions
- assignment clarity suggestions
- claim-scoped verification request wording
- privacy preflight and redaction hints
- friction reduction inside existing MVP flows

AI routes must not support candidate scoring, ranking, recommendations, shortlisting, suitability judgments, fit verdicts, trust-state decisions, verification decisions, reveal decisions, or hiring decisions.

### A.2 Required controls

- Use a server-side provider abstraction; provider and model IDs are environment-configured implementation details.
- Gate every AI surface behind a feature flag and an operator kill switch.
- Enforce spend caps in application or service code before provider invocation.
- Apply redaction and privacy rules before model invocation; full private files, original filenames, signed URLs, private storage URLs, API keys, cookies, session IDs, tokens, hidden identity-bearing review data, protected-trait information, and raw PII are not sent by default.
- Store audit metadata for actor, organization where applicable, feature name, object type and ID, provider, model ID, token counts, cost, redaction summary, policy decision, fallback status, and timestamp.
- Do not log raw PII, private file content, original filenames, signed URLs, credentials, session material, or raw prompts by default.
- Validate inputs with Zod or equivalent structured validation and validate model output against a JSON schema before display or storage.
- Treat AI output as draft-only user assistance; it must not create trust lift, proof-quality lift, verification lift, readiness lift, match lift, or review lift.

### A.3 Fallback behavior

When AI is disabled, unavailable, over budget, rate limited, privacy-blocked, or schema-invalid:

- core MVP flows must continue without AI
- users receive deterministic checklists, static templates, or no suggestion rather than a broken workflow
- failures are auditable through metadata without storing raw sensitive content
- no hiring, verification, trust, reveal, or engagement state may change because an AI call failed or succeeded
