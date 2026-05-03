> Doc Class: `reference-spec`
> Last Verified: `2026-05-03`

# Proofound AI Assistive Layer Launch Runbook Addendum

**Status:** Proposed operating addendum  
**Date:** 2026-05-03  
**Audience:** Founder, ops, engineering, QA, privacy  
**Authority:** Subordinate to `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md` and the locked MVP source of truth.

---

## 0. Purpose

This runbook addendum defines how to launch, monitor, disable, and audit the optional AI assistive layer.

The AI layer is not launch-critical for the MVP. The core Proofound corridor must work without it.

---

## 1. Launch posture

AI assistance can be enabled only after the locked MVP pilot corridor is green.

AI must launch as:

- feature-flagged
- button-click based
- optional
- logged
- spend-capped
- privacy-gated
- safe to disable

The launch posture is conservative:

> AI can improve proof and assignment quality, but it must never decide, score, rank, or replace human review.

---

## 2. Launch gates

AI assistance must not be enabled in production unless all gates pass.

### 2.1 Product gates

- AI is not mentioned as the core product promise.
- UI labels use practical language such as Improve this proof, Clarify assignment, Draft verification request, and Check privacy before publishing.
- No UI copy says AI-powered hiring intelligence.
- No UI copy implies AI scoring, ranking, or candidate recommendation.
- Review Summary / Reason-Code Explanation Assistant is not enabled for MVP v1.

### 2.2 Privacy gates

- AI routes reject full private file payloads.
- AI routes reject signed URLs and private storage URLs.
- Hidden identity-bearing review data is not sent to the model.
- Original filenames are not sent to the model.
- User disclosure copy is visible before or near first use.
- Privacy Preflight runs deterministic checks before optional model checks.

### 2.3 Security gates

- No AI API key is exposed through `NEXT_PUBLIC_*`.
- AI routes require authentication.
- AI routes enforce ownership or organization role authorization.
- CSRF and input validation are enforced for mutating cookie-auth routes.
- Rate limits are active.
- Provider failures fail closed.

### 2.4 Cost gates

- App-level monthly hard cap is configured.
- Production monthly cap is configured.
- Staging and QA caps are configured.
- Budget reservation and finalization tests pass.
- Usage logging tests pass.
- Cache tests pass.

### 2.5 QA gates

Required test groups:

```bash
npm run lint
npm run typecheck
npm run build
npm run test -- tests/api/ai*.test.ts tests/lib/ai*.test.ts
npm run test:privacy
npm run test:privacy:extended
npm run test:launch:smoke
npm run monitor:launch
```

If test names differ, use the equivalent AI, privacy, launch, and smoke suites.

---

## 3. Safe mode

AI safe mode disables provider calls and keeps deterministic fallbacks.

Safe mode must activate automatically when:

- monthly cap is reached
- provider returns repeated errors
- redaction fails
- schema validation fails repeatedly
- abnormal usage spike is detected
- privacy incident is suspected

Safe mode may also be manually activated by setting:

```bash
AI_ASSISTANTS_ENABLED=false
```

Expected safe-mode behavior:

- Proof Pack Assistant shows deterministic checklist
- Assignment Clarity Assistant shows deterministic checklist
- Verification Composer shows static template
- Privacy Preflight runs deterministic rules only
- all core MVP flows remain available

---

## 4. Monitoring

Track at minimum:

- AI actions by feature
- unique users using AI
- unique organizations using AI
- input tokens
- output tokens
- total cost in SEK
- cache hit rate
- provider error rate
- schema validation failure rate
- redaction failure rate
- rate-limit blocks
- budget-cap blocks
- accepted suggestions
- dismissed suggestions
- edited suggestions

Suggested launch-status fields:

```json
{
  "aiAssistantsEnabled": false,
  "aiBudgetState": "disabled|healthy|near_cap|exhausted",
  "aiSpendThisMonthSek": 0,
  "aiMonthlyCapSek": 120,
  "aiProviderErrorRate24h": 0,
  "aiSchemaFailureRate24h": 0,
  "aiRedactionFailureRate24h": 0,
  "aiRawPromptLoggingEnabled": false
}
```

Do not expose hidden user content, raw prompts, raw model responses, or provider keys in monitoring surfaces.

---

## 5. Incident categories

### 5.1 Privacy incident

Examples:

- hidden candidate identity sent to provider
- full file content sent to provider
- original filename sent to provider
- signed URL sent to provider
- hidden employer or client name sent in blind review context

Immediate action:

1. set `AI_ASSISTANTS_ENABLED=false`
2. revoke affected provider key if needed
3. preserve logs and request IDs
4. identify affected users/entities
5. delete cached suggestions if they include unsafe content
6. prepare user-facing notice if legally or operationally required
7. add regression test before re-enabling

### 5.2 Cost incident

Examples:

- spend exceeds configured cap
- spike in calls from one user or org
- repeated retries bypass reservation logic
- cache not working

Immediate action:

1. disable AI provider calls
2. freeze budget ledger
3. inspect usage logs
4. identify feature and actor source
5. fix rate limit or reservation bug
6. re-enable only after cap tests pass

### 5.3 Trust incident

Examples:

- AI output invents claims
- AI output suggests candidate ranking
- AI output implies hiring recommendation
- AI output adds unverifiable outcomes
- AI output changes proof meaning too aggressively

Immediate action:

1. disable affected feature
2. inspect prompt version and output examples
3. add stricter schema or prompt constraints
4. add UI warning if needed
5. add regression tests
6. re-enable only after product and privacy review

---

## 6. Manual QA checklist

Before enabling AI in a pilot account, manually verify:

### Proof Pack Assistant

- button says Improve this proof
- selected Proof Pack fields are visible before sending
- suggestion does not invent facts
- user can accept, edit, or dismiss
- no full file is sent

### Assignment Clarity Assistant

- button says Clarify assignment
- suggestion focuses on outcomes, constraints, capabilities, and proof expectations
- no candidate score, rank, or fit language appears
- org reviewer without edit rights cannot run edit-level AI action if policy requires manager or owner

### Verification Request Composer

- button says Draft verification request
- request is tied to one claim or Proof Pack
- message asks scoped questions
- verifier email is not sent to model
- message is not sent automatically

### Privacy Preflight

- button says Check privacy before publishing
- deterministic privacy rules run without provider
- optional model check receives sanitized text only
- result does not say certified safe
- high-risk deterministic flags require review before publication

---

## 7. Production rollout sequence

Recommended rollout:

1. Land schema and provider abstraction with AI disabled.
2. Enable internal QA only.
3. Run staging tests with fake provider and real provider separately.
4. Enable for founder/admin test accounts only.
5. Enable for one pilot individual cohort.
6. Enable Assignment Clarity for one pilot organization.
7. Review logs and accepted suggestion rate.
8. Keep Review Summary / Reason-Code Explanation disabled.

Do not enable AI broadly until:

- cost behavior is stable
- privacy redaction is proven
- suggestion quality is useful
- fallback behavior is confirmed
- support can explain what AI does and does not do

---

## 8. Pilot success signals

Track these qualitative and quantitative signals:

- users complete Proof Packs faster
- users add missing ownership and outcome context
- organizations produce clearer assignments
- verification requests become more scoped
- privacy flags catch real issues before publishing
- users accept or edit suggestions, not blindly accept everything
- no user believes AI scored or evaluated them
- no organization believes AI ranked candidates

Suggested early targets:

- 30 percent or more of users who try Proof Pack Assistant accept or edit at least one suggestion
- 50 percent or more of assignment assistant runs produce at least one accepted clarity improvement
- zero AI-generated scoring or ranking incidents
- zero hidden-identity provider payload incidents
- spend stays under monthly cap

---

## 9. Go or no-go rule

AI assistance may remain enabled only if it improves flow quality without weakening trust.

Disable or postpone if:

- users misunderstand AI as evaluation
- suggestions invent or over-polish claims
- privacy redaction is unreliable
- organizations ask for AI ranking or scoring
- provider cost or errors become noisy
- implementation distracts from the core corridor

The locked MVP corridor has priority over the AI layer.
