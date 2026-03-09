> Doc Class: `reference-spec`
> Last Verified: `2026-03-09`

# Addendum - PRD-Relevant Delta Note (2026-03-09)

Scope rule for this PRD:

- Only include changes that alter product behavior, user journeys, goals, or guardrails.
- Keep implementation details, UI polish, and operational hardening in status/change docs.

PRD-relevant updates since `2026-02-26`:

- Auth and signup flows are now documented as the current repo behavior:
  - Email/password signup and sign-in
  - Google OAuth
  - LinkedIn OAuth
  - Required consent captured inside signup/auth flow rather than a separate standalone consent screen
- Individual onboarding is portfolio-first:
  - Collect display name, handle, headline, bio, and location
  - End with a dedicated "Public portfolio ready" step showing live URL, copy, open, and continue actions
- Organization onboarding is portfolio-first:
  - Create org account
  - Create organization record
  - Create active owner membership
  - End with a dedicated public org portfolio-ready step
- Guided tours remain in MVP, but are sequenced after onboarding completion and the portfolio-ready confirmation step.
- Interview lifecycle behavior is now explicit across both personas:
  - Schedule interview
  - Edit interview
  - Cancel interview
  - Post lifecycle updates into the conversation thread as user-visible context
  - Allow replacement scheduling after cancellation
  - Support Google Meet and manual meeting links
  - Return actionable Zoom fallback guidance instead of promising live Zoom support
- Verification is now described as a lightweight tiered trust model:
  - `unverified`
  - `workplace_verified`
  - `identity_verified`
  - Inputs come from work email, LinkedIn, and attestations; Government ID is not exposed in the current self-serve UI
- Matching and shortlist review are now documented as explicitly blind-by-default with progressive reveal:
  - Stage 0 anonymous review
  - Stage 1 capability + proof review
  - Stage 2 contextual reveal
  - Stage 3 intro-approved reveal
  - Stage 4 interview coordination reveal
  - Candidate approval is required for identity-bearing reveal
- Data portability wording now matches the repo contract:
  - Versioned JSON export (`v3.0.0`)
  - Import validation plus consent acknowledgment
  - Immediate irreversible account deletion with password confirmation and exact confirmation phrase

No PRD-level changes confirmed for:

- Problem statement, personas, and anti-goals
- North Star metric (`TTSC`) and outcome metrics (`TTFQI`, `TTV`, `PAC`, fairness and privacy framing)
- Portfolio-first day-1 promise and visibility-control model

Source notes:

- Product status and implementation details remain in:
  - `project/changes/entries/*`
  - `agent/scratchpad/entries/*`

# Addendum — Public Portfolio Brief (v0.1)

Objective: Make day-1 value tangible for both personas by guaranteeing a public, shareable portfolio URL that can be copied and sent immediately.

Portfolio-first promise (day 1):

- Primary promise: "I built a clean proof-based portfolio link and can share it today."
- Secondary promise: matching remains available but is not the first user promise.

Core sections (single template, responsive):

- Individual public page: minimal proof-first portfolio with header, proof bar, proof-based summary, featured Proof Packs, optional skills snapshot, and optional contact/share actions.
- Organization public page: minimal public trust card with trust basics, short purpose statement, durable trust signals, and at most one active assignment summary.
- Public surfaces stay read-only; owner editing controls do not appear on public pages.

Owner controls and visibility:

- Owner-only visibility toggles for header, proof bar items, skills, bio, and contact.
- Public view is read-only; owner actions hidden from public viewers.
- Day-1 defaults publish only a minimal safe allowlist:
  - header and proof bar are on
  - identity and LinkedIn trust signals may be shown when available
  - work email is off
  - contact is off
  - skills are off
  - bio is off
- Public counts are not a primary visibility control in the current launch-safe contract.

URL contracts:

- Individual public URL: `/portfolio/{handle}`
- Organization public URL: `/portfolio/org/{slug}`
- In-app shortcuts: `/app/i/portfolio` and `/app/o/{slug}/portfolio` (redirect to public URLs)

Onboarding completion requirement:

- Onboarding ends with a dedicated "Public portfolio ready" step for both personas.
- Individual step shows live URL, copy button, open/view button, and continue-to-app action.
- Organization step shows live URL, copy button, open/view button, and a next-step action that steers the user toward creating the first assignment.

Accessibility and discoverability guardrails:

- Shareable by direct link is the default launch promise.
- Search indexing stays off by default and is only eligible when content is explicitly allowed and safe to index.
- Public routes may be unavailable when minimum content or safety constraints are not met.
- Generic share previews and noindex behavior are part of the launch-safe public-portfolio guardrail.

Exports:

- PDF export: trust summary, skills, contact; respects visibility flags.
- Text pack (ATS-friendly): plain-text summary; respects visibility flags.

Portfolio diagnostics:

- Share activation and indexing status are tracked so owners can confirm whether a portfolio is ready to distribute safely.
- Raw public-view events may be captured for internal diagnostics or anti-abuse review, but they are not surfaced as owner-facing success counters.

Out of scope for v0.1:

- No ATS integrations, portfolio analytics dashboards, advanced analytics, multi-language, or custom templates; single clean layout only.

# Canonical Product Object: Proof Pack

## Executive recommendation

- Proofound should treat the **Proof Pack** as the canonical product, storage, and review object across portfolio, matching, org review, exports, and BYOC intake.
- An **artifact** is one atomic evidence unit, such as a file, link, image, credential, reference, or assessment.
- A **proof** is the claim and trust judgment about real work, including verification, freshness, provenance, and outcome credibility.
- A **Proof Pack** is the bounded container that assembles a brief, contribution, outputs, artifacts, outcome claims, trust state, privacy rules, and portability metadata into one reviewable unit of real work.
- In MVP, every Proof Pack has exactly one primary linked subject: `role`, `assignment`, `capability`, or `domain`. Additional related skills or artifacts may be attached, but the pack stays bounded around one primary subject.
- A candidate **Proof Card** is not a separate canonical entity. It is a submission-safe render of a selected Proof Pack for an invite, assignment, intro, or review flow.

## Canonical entity definition

- The canonical stored object is **Proof Pack**. Artifacts are child evidence units of a pack. Verification records and freshness states are judgments over the pack or its linked artifacts.
- A Proof Pack is owned and maintained by one creator, either an individual profile or an organization.
- A Proof Pack is the default evidence object shown anywhere Proofound asks, "What real work supports this claim?"
- When the primary linked subject is a capability, the pack is the canonical evidence object for that L4 skill claim. Matching and profile credibility reason over the pack, not over loose artifact counts.
- A pack may be public, link-only, matched-org visible, or owner-only, but child artifact visibility can narrow exposure further and never widen it.

## Required MVP schema

**Required to create a draft**

- `proof_pack_id`
- `creator`
- `primary_linked_subject`
- `visibility_controls`
- `provenance`
- `signature_metadata`
- `version_metadata`
- `exportability`

**Required before submission, matching credibility, or public portfolio eligibility**

- `problem_or_brief`
- `context_and_constraints`
- `user_contribution_or_role`
- `methods_tools_systems_used`
- `collaborators_and_attribution_model`
- `outputs_deliverables`
- at least one `evidence_attachment_or_link_or_media_item`
- `outcome_claims`
- `outcome_evidence` or explicit `outcome_evidence_unavailable`
- `verification_status`
- `freshness_state`
- `public_portfolio_eligibility`

**Plain-language field decisions**

- `creator` means the person or organization that owns and maintains the pack.
- `provenance` captures source, creation path, linked system or upload origin, and any legacy import mapping.
- `signature_metadata` means content hash, signer identity if available, and signature method version. No blockchain.
- `version_metadata` means pack version, supersedes pointer, last updated at, and change summary.
- `exportability` means the pack can be emitted as a portable, versioned manifest with attachments referenced or bundled according to permission.

**Optional later, not MVP-required**

- richer collaborator role matrices
- reviewer annotations and scorecards
- automated duplicate clustering
- machine-readable outcome metric schemas
- multi-pack narratives or chained case-study groupings

## Lifecycle / states / transitions

**Primary lifecycle**

- `draft`
- `ready`
- `published`
- `submitted`
- `withdrawn`
- `superseded`
- `archived`

**Trust and quality overlays**

- verification: `unverified`, `partially_verified`, `verified`, `disputed`
- freshness: `fresh`, `review_soon`, `stale`, `expired`
- portfolio eligibility: `ineligible`, `eligible`, `public`
- review posture: `clear`, `under_review`, `suppressed`

**Transition rules**

- `draft -> ready` only when publish-eligible fields are complete.
- `ready -> published` only when visibility and eligibility rules pass.
- `published -> submitted` when attached to an assignment, invite, intro, or verification flow.
- `submitted -> superseded` when a newer pack replaces it for the same context.
- any active state -> `withdrawn` by owner action.
- `verified -> disputed` immediately suppresses trust boosts and public trust language.
- `fresh -> stale` is automatic by time-window logic. Stale packs remain visible but stop counting as current trust strength.
- `withdrawn` and `superseded` remain exportable to the owner with status history intact.

## Surface-by-surface product behavior

**Relations**

- one creator profile or organization
- one primary linked role, assignment, capability, or domain
- many child artifacts
- zero or more linked verification records
- zero or more linked submissions
- zero or more linked L4 skills as secondary evidence references
- zero or more public portfolio surfaces
- zero or more matching explanations and org review references
- one current export manifest lineage

**Behavior by surface**

- **Profile:** show Proof Packs as the canonical proof objects. Artifacts expand only inside a pack. Skill credibility summaries point to linked packs.
- **Public portfolio:** render only packs with `public_portfolio_eligibility = eligible|public`. If a child artifact is more private than the pack, show a redacted placeholder only when summary visibility is allowed; otherwise omit the artifact entirely.
- **Matching:** use linked packs for capability credibility, outcome relevance, freshness, and verification. Disputed, withdrawn, or stale packs do not provide full trust lift.
- **Org review:** review the pack as the unit of evidence. Reviewers see only the details allowed by pack visibility and reveal-gate rules. Private child artifacts remain redacted unless permission is sufficient.
- **BYOC Proof Card flow:** invite submission selects or generates a Proof Pack, and the Proof Card is a formatted presentation of that pack for reviewers.
- **Exports:** keep the platform user export version unchanged unless broader export scope requires a bump. Add a nested Proof Pack manifest with `proof_pack_format_version: 1`.

## Acceptance criteria

- Proof Pack is explicitly defined as the canonical storage and product-logic object.
- Artifact, proof, and Proof Pack have separate definitions and are used consistently.
- MVP-required versus later-only fields are explicitly separated.
- Proof Pack behavior is defined for profile, public portfolio, matching, org review, BYOC review, and export.
- L4 capability claims are explicitly supported by linked Proof Packs.
- Withdrawn, disputed, stale, partially verified, duplicate, and overlapping packs have defined behavior.
- Permissions are explicit when a pack is partially public but one or more child artifacts are private.

## Event tracking

- Canonical analytics taxonomy lives in Part 14.4 and treats trust instrumentation as first-class.
- Minimum Proof Pack-related events:
  - `proof_pack_created`
  - `proof_pack_published`
  - `proof_verification_requested`
  - `proof_verification_completed`
  - `proof_verification_expired`
  - `proof_verification_downgraded`
  - `proof_freshness_state_changed`
  - `proof_marked_stale`
  - `proof_pack_withdrawn`
  - `portfolio_shared`
  - `portfolio_public_viewed`
  - `proof_card_submitted` with linked `proof_pack_id`

## Edge cases / failure modes

- **Withdrawn pack:** hidden from public portfolio and matching boosts, but preserved in owner history and prior submission audit.
- **Disputed pack:** visible with conservative "under review" language and removed from positive trust reasoning until resolved.
- **Partially verified pack:** visible with narrow verification summaries only on the verified dimensions.
- **Stale pack:** still renderable when otherwise eligible, but visually muted and excluded from "current evidence" counts.
- **Duplicate or overlapping packs:** flag likely duplicates when the same creator submits materially overlapping evidence for the same primary linked subject. Do not auto-merge in MVP. Allow `supersedes` or `related` relationships and prefer the latest non-withdrawn non-superseded pack on public and matching surfaces.
- **Pack public, artifact private:** artifact-level permissions always win. The pack may remain partially public while private child artifacts are redacted or omitted.

## Out of scope

- blockchain or on-chain signatures
- heavy legal, government, or employer-of-record verification
- automatic duplicate merging
- complex marketplace pricing or incentive mechanics
- multi-pack storytelling systems beyond simple related or superseded links

# PRD — MVP — Part 1: Problem Statement

## 1.1 Context / Why Now

We’re in an unusually high-paced, high-volatility era shaped by rapid technological change and pervasive AI. People are navigating rising uncertainty, unstable demand, and new skill requirements while institutions and hiring norms lag behind. Traditional hiring mechanics—CVs, cover letters, cold outreach, and generic networking—are increasingly misaligned with this reality and are trivially gamed by AI, eroding signal and trust.

## 1.2 Primary Users & Problems

**Primary user:** Job seekers (new graduates, industry switchers, mid-career movers, immigrants in new markets, senior talent facing ageism).  
**Counterparty:** Organizations seeking talent (from startups to enterprises).

**Candidate-side pains**

- Heavy time/energy cost crafting and tailoring CVs/letters, back-channeling, and repetitive intro calls.
- Low-signal processes (AI-written CVs/letters), few responses, automated rejections, and scant feedback.
- Exposure to bias (ageism/sexism/racism/homophobia), credentialism, and “CV gaps” stigma.
- Mental-health toll from uncertainty, repeat rejection, and performative pressure on social platforms.

**Organization-side pains**

- High spend on HR/recruiting workflows, agencies, and multi-round interviews to find one hire.
- Low precision from CV/keyword screens; poor differentiation between motivated and misaligned candidates.
- Bias and compliance risk; limited transparency and auditability of decisions.

## 1.3 Opportunity (What can be 10× better)

Create a space centered on authenticity, privacy, and values-aligned outcomes, not performative profiles or engagement feeds. Replace CV/cover-letter dependency with an **expertise mapping** model that captures skills, methods, outcomes, values/causes, and work preferences. Give users **control over visibility and boundaries** (privacy-first). Bake in **anti-bias guardrails** and **high-precision, automated matching** so both sides quickly reach motivated, well-reasoned connections that can create business value. Offer a narrow, optional private reflection surface for high-friction hiring moments without turning Proofound into a coaching, therapeutic, or wellbeing-content product.

**MVP industry focus:** Labor Market credibility, privacy, and values-aligned matching.

## 1.4 Problem Hypothesis (single sentence)

For job seekers overwhelmed by volatile, biased, and time-intensive hiring—and for organizations overspending on low-precision talent acquisition—**Proofound’s MVP** delivers a privacy-first, anti-bias expertise-mapping and automated-matching system that rapidly creates values-aligned, credible introductions, as evidenced by a shorter time-to-first qualified match and reduced effort per hire for both sides.

---

## Facts & Decisions

**Canonical terms (for consistency across the PRD)**

- **Expertise Mapping / Expertise Atlas:** Structured, CV-alternative representation of skills, methods, outcomes, values/causes, and preferences.
- **Values-Aligned Match:** A connection proposed when skills, constraints, values/causes, and availability meaningfully overlap.
- **Guardrails:** Built-in mechanisms for transparency, anti-bias, credibility, privacy, and security.
- **Zen Hub:** An optional private space for brief check-ins and milestone reflections. It is not therapy, coaching, diagnosis, or a wellbeing content library.

**Decisions captured here**

- MVP will **not** rely on CVs/cover letters as primary signals; the **Expertise Mapping** model is the default signal.
- MVP prioritizes **bias reduction, privacy, and transparency** by design (not add-ons).
- MVP excludes engagement-driven social feeds; **no LinkedIn-style content feed**.
- MVP will surface **values/causes** and **work-preference** signals in matching logic.
- MVP supports **BYOC candidate invites** for organizations: invite known candidates by email and collect structured Proof Pack submissions through a Proof Card surface instead of CV attachments.

**Open questions (to resolve in subsequent sections)**

- Verification scope in MVP: which proofs (e.g., identity, employment, skills) and what UX?
- Minimum viable anti-bias techniques at launch (e.g., redaction/blinding, calibrated scoring, fairness checks).
- Data exposure defaults: what’s private by default vs. explicitly shareable?
- Organization onboarding: minimum inputs to produce high-precision matches quickly?
- Metrics we will commit to in #2 (e.g., time-to-first qualified intro, candidate/manager effort saved, perceived fairness).

**Approved on**

- **Status:** Draft v0.1 (awaiting product approval)
- **Approver:** Pavlo Samoshko
- **Date:** —

# PRD — MVP — Part 2: Goals & Success Metrics

## 2.1 North Star Metric (NSM)

**NSM: Time-to-Signed-Contract (TTSC)**

- **Definition:** Elapsed calendar time between activation and a signed employment/engagement agreement attributable to the platform.
  - **Individual TTSC:** From **Matching Profile Activation** (profile ≥ minimum completeness and set to “matchable”) → **Signed Contract** (user attestation + optional org confirmation).
  - **Organization TTSC:** From **Assignment Activation** (assignment published and matchable) → **Signed Contract** (org attestation + optional individual confirmation).
- **Formula:** `median(TTSC_days)` per cohort (role type, seniority, geography); track P75 as a risk lens.
- **MVP Target (initial):** Establish baselines in the first cohorts; demonstrate **≥30% reduction** vs. user-reported prior experience for comparable roles, or an **absolute median TTSC ≤ 30 days** for entry/mid roles (to be refined per cohort once baseline is known).

> Why this matters: It directly reflects the platform’s promise—faster, more efficient matches that culminate in real engagements.

## 2.2 Outcome Metrics

- **TTFQI:** Median elapsed time from activation to the first qualified introduction where qualification thresholds and consent are satisfied.
- **TTV:** Median elapsed time from activation to the first meaningful step such as an interview scheduled or an async task accepted.
- **PAC:** Purpose-Alignment Contribution remains a supporting diagnostic inside matching and explanation. It helps explain fit but is not a public score or vanity metric.
- **SUS:** Launch usability benchmark for activation, assignment publishing, and match review.
- **Fairness note:** Release-level fairness summary generated only for opt-in cohorts above minimum privacy thresholds.
- **Effort reduction and first-session activation:** Internal launch diagnostics used to validate onboarding clarity and publish speed.

## 2.3 Metrics Guardrails

- The canonical MVP metric set is **TTSC**, **TTFQI**, **TTV**, **PAC**, **SUS**, and the release-level **fairness note**.
- User-facing product surfaces remain calm and status-oriented: profile readiness, assignment readiness, intro status, interview status, and feedback status.
- Internal rollout, observability, and launch reporting may monitor activation, publish speed, SLA compliance, and system health, but those internal views are not part of the product-surface promise.
- Public portfolio views remain diagnostic only. No owner-facing public-view counters, leaderboards, streaks, or habit loops ship in MVP.
- Zen Hub emits only coarse private-partition action events and remains excluded from ranking, org review, fairness workflows, and public rendering.

## 2.4 Anti-Goals / Non-Metrics (MVP)

- Do **not** optimize remuneration levels, work conditions, or culture fit beyond explicit constraints supplied by users.
- Do **not** optimize for time-on-site, feed engagement, vanity counts, message volume, or owner-facing public-view counters.
- Do **not** add social “content feeds” or gamified proof-maintenance mechanics that create performative pressure.
- Do **not** introduce clinical, diagnostic, therapeutic, coaching, or engagement-driven Zen mechanics.
- Do **not** turn Zen Hub into a dashboard habit loop, content library, or outbound resource experience.

---

## Facts & Decisions

**Canonical definitions**

- **Activation (Profile/Assignment):** Minimum completeness threshold met and explicitly set to “matchable.”
- **Qualified Introduction:** A two-sided, values-aware intro produced when skills/constraints thresholds and consent are satisfied.
- **Meaningful Step (TTV event):** A scheduled interview or accepted async task within the platform.
- **PAC (Purpose-Alignment Contribution):** The additive portion of the composite match score attributable to values/causes alignment.
- **Fairness note:** Release-level summary of opt-in cohort checks with privacy thresholds, limitations, and status.

**Decisions captured here**

- **NSM = TTSC** for both sides; track cohort medians + P75.
- The canonical MVP metric set is **TTSC**, **TTFQI**, **TTV**, **PAC**, **SUS**, and the release-level **fairness note**.
- Purpose and values signals remain first-class inside matching and explanation, but they do not become public scores, vanity counters, or engagement loops.
- User-facing analytics remain minimal and status-oriented: readiness, intro state, interview state, and feedback follow-up.
- Internal rollout and observability reporting may monitor activation, publish speed, endpoint health, and SLA compliance without expanding product scope.
- Public portfolio public-view events remain diagnostic only and are not surfaced as owner-facing success counters.
- Zen Hub is optional, private, and excluded from matching, ranking, org review, fairness workflows, and public rendering.
- Zen analytics are limited to coarse private-partition action events and never include reflection text or raw scores.
- UX quality is tracked with **SUS** plus task success and drop-off; no social feed, no vanity loops.

**Open questions**

- **Contract verification:** acceptable proofs (mutual attestation, doc upload, third-party integration later)?
- **Baselines:** how collected for TTSC/Effort (onboarding survey vs. control cohorts)?
- **Fairness controls:** which de-biasing techniques in MVP (blinding, calibration, periodic fairness audit)?
- **Cohort definitions:** by role family, seniority, geography—exact bins for internal reporting.
- **Freshness policy:** exact freshness decay windows and minimum qualifying proof thresholds by proof type and role family.
- **Privacy defaults:** analytics/event-level redaction for sensitive fields, public-view referrer classes, and opt-in demographics.

**Approved on**

- **Status:** Draft v0.1 (awaiting product approval)
- **Approver:** Pavlo Samoshko
- **Date:** —

# PRD — MVP — Part 3: User Personas & Primary Journeys

> **Alignment note:** These personas and journeys are tuned to Parts **1) Problem Statement** and **2) Goals & Success Metrics**.  
> Metrics referenced below use the canonical labels: **TTSC** (Time-to-Signed-Contract), **TTFQI** (Time-to-First Qualified Introduction), **TTV** (Time-to-Value), **PAC** (Purpose-Alignment Contribution), and **SUS** (usability). “Qualified Introduction” and “Activation” follow Part 2 definitions.

---

## Individuals (6)

### 1) Nenah, 24 — impact-driven grad, starting out

**Goal:** Build credibility fast; land paid impact work.  
**Context:** Mobile-first; budget-sensitive; limited network.

**Definition of Done (MVP):** Nenah receives ≥1 **Qualified Introduction** within 72h of activation and signs a first contract within the baseline TTSC cohort target.

#### Journey Stages

**Awareness**

- **Touchpoints:** TikTok/IG reels, friend share, uni Slack.
- **Actions (MVP):** Lands on “How It Works,” sees student-oriented variant.
- **Feelings:** Curious.
- **Friction:** Value prop vs LinkedIn unclear.
- **Metrics:** CTR → TTFQI; landing bounce.
- **Design Ops:** Social landing variant with 3 bullets + trust badges; “Student path” CTA.

**Consideration**

- **Actions:** Start **Profile Wizard** (edu/work; mission/vision/values/causes; volunteering). Opens **Expertise Hub**; selects L1–L3; adds 2 L4 with level + proof.
- **Feelings:** Overwhelmed by taxonomy.
- **Friction:** “What do I add first?”
- **Metrics:** Wizard completion %, L4 add rate, time-to-activation.
- **Design Ops:** Guided starter kit (suggested L4s by degree); tooltips/glossary; proof template.

**Decision**

- **Actions:** Create **Matching Profile** (location/time, values/causes). Sees gated preview matches.
- **Feelings:** Cautiously optimistic.
- **Friction:** Verification anxiety; price.
- **Metrics:** Match-profile completion; verify click-through; PAC presence in top matches.
- **Design Ops:** “Soft verify” (peer/mentor attest + artifact), student discount, privacy explainer.

**Purchase**

- **Actions:** Activates the profile, sets privacy defaults, and reaches match-visible readiness.
- **Feelings:** Relieved.
- **Friction:** Confidence that the profile is credible enough.
- **Metrics:** Activation completion; time-to-match-visible.
- **Design Ops:** Keep the flow focused on readiness, privacy clarity, and first qualified intro.

**Retention**

- **Actions:** Uses **Dashboard**; adds 1 artifact/week; optionally opens Zen Hub after a rejection to capture a private reflection.
- **Feelings:** Progressing; occasional discouragement.
- **Friction:** Quiet match weeks.
- **Metrics:** 4-week retention; artifacts cadence; TTFQI→interview rate.
- **Design Ops:** Auto-suggest L4s from uploaded CV; optional Zen prompts tied to milestone moments only.

---

### 2) Mateo, 31 — career switcher to climate data

**Goal:** Credible proof for interviews; land role in climate data.  
**Context:** Bootcamp portfolio; non-linear path.

**Definition of Done (MVP):** Gap Map produced; ≥2 Qualified Introductions in first 2 weeks; ≥1 interview scheduled (TTV ≤ 7 days).

#### Journey Stages

**Awareness**

- **Touchpoints:** Google search, podcast.
- **Actions:** Reads “Switchers” page.
- **Feelings:** Hopeful.
- **Friction:** Is a non-linear path accepted?
- **Metrics:** Switchers CTR; scroll depth.
- **Design Ops:** Before/after stories; role-gap demo.

**Consideration**

- **Actions:** Import prior work examples to **Profile**; map to Expertise Hub (auto-scan suggests L4s like “Time-series cleaning,” “ETL in Python”). **Gap Map** highlights top L4s to add.
- **Feelings:** Oriented.
- **Friction:** Mapping confidence.
- **Metrics:** Auto-map acceptance rate; time-to-activation.
- **Design Ops:** “Why it mapped” explainer; edit-in-place L4 properties.

**Decision**

- **Actions:** Configures **Matching Profile** (remote; causes: climate); sees shortlists gated by verification.
- **Feelings:** Cost-sensitive.
- **Friction:** Which verification matters?
- **Metrics:** Verification pack attach rate; PAC contribution vs acceptance rate.
- **Design Ops:** Show the shortest path to proof-backed credibility and first qualified intro.

**Purchase**

- **Actions:** Completes proof-backed activation and publishes the profile for matching.
- **Feelings:** Motivated.
- **Friction:** Knowing which proof matters most.
- **Metrics:** Time-to-first verified proof; time-to-first qualified intro.
- **Design Ops:** Keep the flow focused on proof quality, attestation guidance, and first intro readiness.

**Retention**

- **Actions:** Follows Gap Map; applies to 3 roles; optionally uses Zen Hub to capture a private rejection reflection.
- **Feelings:** Resilient.
- **Friction:** Limited feedback on declines.
- **Metrics:** Interview & offer rates; TTSC.
- **Design Ops:** “Why not shortlisted” insights; practice tasks that lift match score + link back to L4 gaps.

---

### 3) Ola, 38 — senior security engineer, time-poor advisor

**Goal:** Low-lift advisory opportunities with vetted orgs.  
**Context:** Privacy/security-sensitive; minimal time.

**Definition of Done (MVP):** Advisory sprint accepted with ≤15m onboarding; repeat micro-engagements per quarter.

#### Journey Stages

**Awareness**

- **Touchpoints:** Referral, LinkedIn DM.
- **Actions:** Skims Trust & Security.
- **Feelings:** Skeptical.
- **Friction:** Noise/notifications.
- **Metrics:** Referral land → sign start.
- **Design Ops:** “Quiet Mode” profile preset; email-only digests.

**Consideration**

- **Actions:** Minimal **Profile** (headline + expertise domains); adds 4 L4s (e.g., Threat modeling, SOC2 readiness) with confidentiality flag; toggles availability; **Matching Profile** for micro-engagements.
- **Feelings:** In control.
- **Friction:** Taxonomy time.
- **Metrics:** Time-to-availability.
- **Design Ops:** Import from CV/LinkedIn to seed L4s; bulk add.

**Decision**

- **Actions:** Reviews 2 NGO briefs and decides whether to request more context.
- **Feelings:** Professional.
- **Friction:** Getting enough trust context without extra admin.
- **Metrics:** Brief-to-intro progression; drop-offs.
- **Design Ops:** Keep assignment context proof-backed and concise.

**Purchase**

- **Actions:** Accepts a first advisory intro.
- **Feelings:** Clear.
- **Friction:** Onboarding overhead.
- **Metrics:** Time-to-onboard < 15m.
- **Design Ops:** Sprint starter brief and clear intro context.

**Retention**

- **Actions:** Quarterly micro-advisories; retains proof-backed outcomes and exports a credential if useful.
- **Feelings:** Recognized.
- **Friction:** Recognition outside platform.
- **Metrics:** Repeat engagements; credential views.
- **Design Ops:** Public credential page; keep reminders minimal and opt-in.

---

### 4) Dmitry, 59 — manufacturing expert, mentorship-first

**Goal:** Light mentorship/consulting; desktop-first.  
**Context:** Prefers simple scheduling and low admin overhead.

**Definition of Done (MVP):** 3 mentorship sessions completed; consulting availability made clear; first consulting intro accepted.

#### Journey Stages

**Awareness**

- **Touchpoints:** Facebook group, newsletter.
- **Actions:** Opens mentor demo.
- **Feelings:** Curious but cautious.
- **Friction:** “Another complex tool?”
- **Metrics:** Mentor land → wizard start.
- **Design Ops:** “Mentor Quick Start” (3 steps).

**Consideration**

- **Actions:** Minimal **Profile**; **Expertise Hub** adds 6 L4s (OEE improvement, Lean audits) via bulk add; sets **Matching Profile** for mentee criteria.
- **Feelings:** Efficient.
- **Friction:** Calendar setup.
- **Metrics:** Time-to-availability.
- **Design Ops:** ICS + phone-in options; default two slots/week.

**Decision**

- **Actions:** Trials 3 pro-bono sessions.
- **Feelings:** Testing waters.
- **Friction:** Mentee quality.
- **Metrics:** Post-session CSAT; no-show rate.
- **Design Ops:** Pre-goal template for mentees and clear session expectations.

**Purchase**

- **Actions:** Makes consulting availability visible and accepts a first consulting intro.
- **Feelings:** Valued.
- **Friction:** Converting interest into a real intro.
- **Metrics:** Time-to-first consulting intro; repeat intro requests.
- **Design Ops:** Keep the flow focused on scheduling, proof context, and testimonial follow-up.

**Retention**

- **Actions:** Keeps cadence; collects testimonials.
- **Feelings:** Appreciated.
- **Friction:** Getting public recognition.
- **Metrics:** Repeat bookings; testimonial rate.
- **Design Ops:** Auto-prompt for public testimonial (opt-in) + exportable badge.

---

### 5) Mateo Variant — keep?

_Merged into Persona #2 to avoid duplication._

---

### 5) Priya, 27 — social entrepreneur (pre-seed)

**Goal:** Build a credible org presence quickly and recruit interns.  
**Context:** Founder wearing many hats; needs signal, not platform overhead.

**Definition of Done (MVP):** Credible org profile live with proof highlights; 1–2 advisor attestations; intern assignment published with ≤15m setup; TTFQI ≤ 5 days for applicants.

#### Journey Stages

**Awareness**

- **Touchpoints:** Founder Slack, Product Hunt.
- **Actions:** Reads “For Founders.”
- **Feelings:** Excited about storytelling.
- **Friction:** Fear of “clinical” profiles.
- **Metrics:** Founders page → signups.
- **Design Ops:** Narrative blocks + media carousels.

**Consideration**

- **Actions:** **Company Profile** with mission, why-join statement, values, and proof highlights; add 1–3 customer pilots as trust evidence; open the basic **Assignment Creation** flow for an intern role.
- **Feelings:** Empowered.
- **Friction:** How much profile detail is enough to look credible?
- **Metrics:** Profile completion; proof highlight coverage.
- **Design Ops:** Founder-oriented prompts for trust highlights, traction, and real outcomes.

**Decision**

- **Actions:** Invites two advisors to attest to proof highlights and role fit.
- **Feelings:** Confident.
- **Friction:** Advisor onboarding.
- **Metrics:** Attestation completion.
- **Design Ops:** Magic-link attest; templated areas of advice.

**Purchase**

- **Actions:** Buys a plan that supports one owner and optional reviewer access.
- **Feelings:** Invested.
- **Friction:** Pricing clarity.
- **Metrics:** Checkout completion; first assignment published.
- **Design Ops:** Clear plan framing around publishing and review, not admin depth.

**Retention**

- **Actions:** Uses the **Assignments and Matches** home to track drafts, new matches, pending intros, and follow-up; recruits via Assignments and Matching.
- **Feelings:** Supported.
- **Friction:** Content overhead.
- **Metrics:** Applicant conversion; TTFQI; TTSC for hires.
- **Design Ops:** Keep the workflow focused on publishing, review, and intro follow-up.

---

### 6) Nenah Variant — keep?

_Merged into Persona #1 to keep set concise and measurable._

---

## Organizations (3)

### 7) GreenGrid Energy (Scale-up, 120 FTE) — hard-to-find hires

**Goal:** Fill 8 specialist roles fast with verified talent.  
**Context:** Busy managers; wants precision shortlists without heavy platform rollout.

**Definition of Done (MVP):** Time-to-shortlist < 5 days; ≥3 Qualified Introductions per role; 2 offers/month; TTSC improvement ≥30% vs prior.

#### Journey Stages

**Awareness**

- **Touchpoints:** Case study, HR webinar.
- **Actions:** Books a demo and reviews example assignments.
- **Feelings:** Interested but busy.
- **Friction:** Manager adoption.
- **Metrics:** Demo → org signup intent.
- **Design Ops:** “Shortlist in inbox” workflow; example match-review queue.

**Consideration**

- **Actions:** Create an **Org Profile** with mission, why-join statement, values, proof highlights, and work norms; publish a basic assignment with outcomes, must-have skills, practical constraints, and optional trust requirements.
- **Feelings:** Structured.
- **Friction:** Writing a sharp role brief quickly.
- **Metrics:** Time-to-publish Assignment; manager task success.
- **Design Ops:** Clear prompts for outcomes, constraints, and proof-backed trust context.

**Decision**

- **Actions:** Proceeds with the first assignment and invites one reviewer if needed.
- **Feelings:** ROI-oriented.
- **Friction:** Budget approval.
- **Metrics:** Time to first live assignment; reviewer activation.
- **Design Ops:** ROI framing around publish speed and intro quality.

**Purchase**

- **Actions:** Launches the first specialist assignment and starts reviewing matches.
- **Feelings:** Committed.
- **Friction:** Internal alignment on review criteria.
- **Metrics:** Time-to-contract; reviewer activation.
- **Design Ops:** Keep implementation light: publish, review, request intro.

**Retention**

- **Actions:** Uses the **Assignments and Matches** home to review new matches, pending intros, and pending feedback; repeats assignments as needed.
- **Feelings:** Productive.
- **Friction:** Drift to old habits.
- **Metrics:** Time-to-shortlist; onsite rate; 90-day success.
- **Design Ops:** Stale-review nudges and simple reviewer workflow discipline.

---

### 8) Bridges for Youth (NGO, 28 FTE) — volunteers & micro-grants

**Goal:** Recruit skilled volunteers and show enough trust context to attract aligned contributors.  
**Context:** Compliance-minded; resource-constrained.

**Definition of Done (MVP):** 3 volunteer Assignments published in ≤7 days; ≥10 qualified applicants with verification gates; credible org profile with proof highlights live.

#### Journey Stages

**Awareness**

- **Touchpoints:** Philanthropy network.
- **Actions:** Views volunteer/impact demo.
- **Feelings:** Curious.
- **Friction:** Compliance.
- **Metrics:** Demo → org signup intent.
- **Design Ops:** Safe-data templates; proof-first org profile example.

**Consideration**

- **Actions:** Build an **Org Profile** with mission, values, proof highlights, and lightweight work norms; create a basic volunteer **Assignment** with outcomes, must-have skills, practical constraints, and verification gates where needed.
- **Feelings:** Confident.
- **Friction:** Staff training.
- **Metrics:** Time-to-first Assignment; task success.
- **Design Ops:** One lean setup path; train-the-trainer notes kept minimal.

**Decision**

- **Actions:** Proceeds with volunteer assignment publishing and turns on the minimum verification gates needed for trust.
- **Feelings:** Reassured.
- **Friction:** Balancing trust with low overhead.
- **Metrics:** Time-to-first assignment; verification-gated intro quality.
- **Design Ops:** Emphasize faster qualified intros and simple trust controls.

**Purchase**

- **Actions:** Onboards staff; publishes 3 Assignments.
- **Feelings:** Energized.
- **Friction:** Applicant triage.
- **Metrics:** Qualified applicants/Assignment; TTFQI for volunteers.
- **Design Ops:** Auto-ranking by L4 fit + cause alignment (PAC).

**Retention**

- **Actions:** Uses the **Assignments and Matches** home to review volunteer matches, pending intros, and follow-up.
- **Feelings:** Sustainable.
- **Friction:** Volunteer engagement.
- **Metrics:** Volunteer activation; proof submission rate; repeat assignment publishing.
- **Design Ops:** Keep proof context lightweight and useful for matching.

---

### 9) NorthPeak Operations (Enterprise team, 300 FTE) — careful multi-reviewer hiring

**Goal:** Run specialist hiring through a proof-first workflow without deploying heavy enterprise tooling.  
**Context:** Longer buying cycle than SMBs, but still wants a lean publish-and-review motion.

**Definition of Done (MVP):** First specialist assignment live; owner and reviewer both active; ≥3 qualified introductions for the role.

#### Journey Stages

**Awareness**

- **Touchpoints:** Referral, hiring-leader roundtable.
- **Actions:** Books a product walkthrough.
- **Feelings:** Interested, cautious.
- **Friction:** Concern that the tool will create another admin layer.
- **Metrics:** Walkthrough completion.
- **Design Ops:** Show the lean review queue, not enterprise admin features.

**Consideration**

- **Actions:** Create an **Org Profile** with trust context, publish a basic assignment, and invite one reviewer into the match-review workflow.
- **Feelings:** Structured.
- **Friction:** Keeping reviewers aligned without overbuilding process.
- **Metrics:** Time-to-first assignment; reviewer task success.
- **Design Ops:** Keep review actions to shortlist, pass, intro request, and feedback follow-up.

**Decision**

- **Actions:** Approves a small rollout for one hiring team.
- **Feelings:** Aligned.
- **Friction:** Internal process ownership.
- **Metrics:** Time from approval to first live assignment.
- **Design Ops:** Keep access control to owner plus optional reviewer.

**Purchase**

- **Actions:** Goes live with the first assignment and begins intro review.
- **Feelings:** Productive.
- **Friction:** Change management.
- **Metrics:** Reviewer adoption; TTFQI on the first role.
- **Design Ops:** Favor guided review over dashboard depth.

**Retention**

- **Actions:** Reuses the same publish-and-review workflow for later roles, with optional duplicate-assignment support later if needed.
- **Feelings:** Supported.
- **Friction:** Maintaining consistency across reviewers.
- **Metrics:** Time-to-shortlist; intro conversion; repeat usage by the same team.
- **Design Ops:** Keep collaboration light and avoid spawning a team hub.

---

## What stands out across personas (portable backlog → scope candidates)

- **Lean org onboarding:** one setup path for trust profile, assignment publishing, and match review; no separate enterprise or government branches.
- **Trust context:** mission, why-join statement, values, proof highlights, and lightweight work norms do most of the credibility work.
- **Assignment speed:** a single basic publish flow is more important than advanced authoring depth.
- **Review discipline:** privacy-safe summaries, proof context, shortlist/pass, intro request, and follow-up are the true org workflow.
- **Minimal access:** owner plus optional reviewer is enough for launch.
- **Defer platform sprawl:** dashboards, org maps, expertise hubs, donor reporting, templates, and heavy admin belong after launch.

---

## Facts & Decisions (Part 3)

**Canonical persona clusters**

- **Individuals:** Student/Grad, Career Switcher, Senior Advisor/Expert, Mentor/Consultant, Founder-Operator.
- **Organizations:** Founder-led small organizations, scale-ups or larger hiring teams, and NGOs/community organizations.

**Ties to metrics (Part 2)**

- Every persona has explicit paths to **TTFQI**, **TTV**, and **TTSC**.
- **PAC** is instrumented wherever values/causes influence acceptance/contract rates.
- **SUS** and task-success thresholds apply to activation, assignment publish, and match review.
- Zen Hub is optional, non-clinical, and private by default.

**Decisions captured here**

- Kept the set to **8 concrete personas** by merging near-duplicates to reduce scope creep while preserving coverage.
- All journeys avoid social content feeds and engagement traps; focus is on efficient, values-aligned matching.

**Open questions**

- Minimum verification set per persona (student vs senior expert vs NGO vs larger hiring team).
- Exact cohort bins for benchmarking TTSC/TTFQI (role family, seniority, region).
- Privacy defaults for artifacts and attestations per persona.

**Approved on**

- **Status:** Draft v0.1 (awaiting product approval)
- **Approver:** Pavlo Samoshko
- **Date:** —

# Proofound — Individual User Flows (MVP, Structured from Founder Narration)

_Last updated: 2025-10-31T12:52:02.294819Z_

This document turns the free‑text narration into clear, production‑ready user flows for **individual users**.  
Each flow follows a consistent mini‑spec: **Purpose • Entry • Steps • Inputs/Data • Needs & Feelings • System Support • Done • Metrics • Edge Cases**.

> **MVP rule:** Only flows required now are marked **[MVP]**. Items labeled “Future” indicate planned evolutions and are included so UX and data models stay forward‑compatible.

---

## 0. Legend — Mini‑Spec Template

- **Purpose** — Why this flow exists; the user’s intended outcome.
- **Entry** — Preconditions & primary triggers.
- **Steps** — Happy‑path sequence (what the user does & sees).
- **Inputs/Data** — Data required/created; visibility rules.
- **Needs & Feelings** — Cognitive/emotional needs to design for.
- **System Support** — UI, guidance, validation, automation, privacy.
- **Done** — Concrete exit state.
- **Metrics** — Leading indicators.
- **Edge Cases** — Exceptions, recovery, guardrails.

---

# Flows

## I‑00 Landing Page Narrative & CTA **[MVP]**

**Purpose:** Educate and inspire enough confidence to click **Sign up**.  
**Entry:** First visit (not authenticated).  
**Steps:** 1) Scroll a cohesive story (what/why/how) → 2) Lightweight proof (social trust, privacy stance) → 3) Primary CTA “Sign up”.  
**Inputs/Data:** UTM/referrer (analytics).  
**Needs & Feelings:** Clarity; trust; low cognitive load.  
**System Support:** Performance; accessible motion; “Privacy-first” copy; sticky CTA.  
**Done:** User clicks **Sign up**.  
**Metrics:** Landing→signup CTR; time to CTA.  
**Edge Cases:** Low bandwidth → static fallback.

---

## I‑01 Account Creation & Sign‑in (Email/Google/LinkedIn) **[MVP]**

**Purpose:** Let users start with their preferred auth method and frictionless recovery.  
**Entry:** From Landing CTA or Login.  
**Steps:** 1) Choose Email/Password, Google, or LinkedIn → 2) Email path: enter email, set password, and submit required consent choices; social path: confirm provider → 3) Email/password signups verify email before first authenticated app session → 4) Sign in.  
**Inputs/Data:** Email; password credential; name/avatar (from SSO); consent versions; session token.  
**Needs & Feelings:** Control & choice; confidence about data.  
**System Support:** Clear provider options; resilient email delivery; resend verification email; password reset; device/session management.  
**Done:** Authenticated session established.  
**Metrics:** Signup completion; verification success; first session latency.  
**Edge Cases:** SSO domain blocked; expired verification link → one‑click resend.

---

## I‑02 Consent & Policy Capture (Inside Signup/Auth) **[MVP]**

**Purpose:** Transparently capture required consent without adding a separate standalone screen.  
**Entry:** During signup, and again when required terms change.  
**Steps:** 1) Review plain-language Terms/Privacy summaries in the signup flow → 2) Accept required consent and optional marketing opt-in → 3) If policy versions change later, review updated summaries and re-accept before continuing.  
**Inputs/Data:** Consent versions; required consent timestamp; optional marketing preference.  
**Needs & Feelings:** Understanding; control; privacy reassurance.  
**System Support:** Plain-language summaries; links to full policies; versioned consent logging; re-consent gating when policy text changes.  
**Done:** All required consents recorded.  
**Metrics:** Drop‑off; time on consent.  
**Edge Cases:** Policy version changes mid-session; jurisdictional clauses; under-age lockout with guidance.

---

## I‑03 First‑Run Guided Tour (Reveal UI, Zero‑State) **[MVP]**

**Purpose:** Prevent overwhelm; orient users to core areas.  
**Entry:** First successful app visit after onboarding completion (or when requested later).  
**Steps:** 1) Blank canvas with styled background → reveal **Navigation** + hint → 2) Reveal **Dashboard** + hint → 3) Jump to **Profile** (empty state & hint) → 4) Show **Expertise Hub** (About + hint) → 5) Show **Matching Profile** (why it matters) → 6) Show **Settings** (one‑line explainer) → 7) Suggest “Start with your Profile”.  
**Inputs/Data:** Tour seen flag; per‑module “seen” state.  
**Needs & Feelings:** Calm; agency; no forced learning.  
**System Support:** Skippable; repeatable from the app later; keyboard/ARIA compatible.  
**Done:** Tour completed or dismissed; next step CTA surfaced.  
**Metrics:** Tour completion; subsequent engagement with Profile.  
**Edge Cases:** Reduced‑motion mode; partial tour resume.

---

## I‑04 Home Snapshot (Observer‑Only) **[MVP]**

**Purpose:** Provide a calm, non-interactive status view and deep-link to the right area.  
**Entry:** Home route after login.  
**Steps:** See a small set of status cards summarizing Profile, Skills and Proof, Matching, and Privacy; each card deep-links to its module.  
**Inputs/Data:** Read‑only aggregates.  
**Needs & Feelings:** Orientation; no pressure to act.  
**System Support:** Empty-state copy per card; "no busy dashboard" clarity.  
**Done:** User navigates purposefully from the home snapshot.  
**Metrics:** Card click-through; bounce from home.  
**Edge Cases:** No data → tasteful placeholders.

---

## I‑05 Profile Basics (Portfolio-First Setup) **[MVP]**

**Purpose:** Deliver day-1 value by creating a public portfolio link before deeper profile authoring.  
**Entry:** Individual onboarding after account verification/sign-in.  
**Steps:** Enter display name, handle, headline, bio, and location → submit → create public portfolio URL (`/portfolio/{handle}`) → show dedicated **Public portfolio ready** step with live URL, copy link, open portfolio, and continue-to-app actions.  
**Inputs/Data:** Display name; handle; headline; bio; location; public portfolio URL.  
**Needs & Feelings:** Immediate progress; low friction; confidence that something tangible is already live.  
**System Support:** Handle validation and uniqueness checks; safe defaults; direct-link sharing by default; search indexing disabled unless explicitly enabled later; dedicated success state; in-app portfolio shortcut once onboarding is complete.  
**Done:** Basics saved and public portfolio is live.  
**Metrics:** Completion rate; time to public portfolio ready; share-link copy/open rate.  
**Edge Cases:** Handle collision or reserved word; invalid handle characters; public route remains unavailable until minimum safe content requirements are met; onboarding error recovery without losing entered text.

---

## I‑06 Mission & Vision (Private by Default) **[MVP]**

**Purpose:** Capture purpose statements to drive values alignment.  
**Entry:** From Profile.  
**Steps:** Open modal → see guidance (“what to write”) → enter **Mission** (≤300 chars) and **Vision** (≤300) → choose visibility (private default) → save.  
**Inputs/Data:** Two short texts; visibility flag.  
**Needs & Feelings:** Reassurance; no pressure to be “perfect”.  
**System Support:** Examples; word counter; privacy explainer.  
**Done:** Statements saved; not exposed unless opted‑in.  
**Metrics:** Fill rate; later opt‑in to share.  
**Edge Cases:** Empty allowed; later edits re‑score matching.

---

## I‑07 Values & Causes (Tagged) **[MVP]**

**Purpose:** Select up to 5 **Values** and up to 5 **Causes** to inform matching.  
**Entry:** From Profile.  
**Steps:** Search typeahead OR “Browse full list” → select up to limit → rank if desired → save.  
**Inputs/Data:** Tag IDs; order.  
**Needs & Feelings:** Discovery; control; clarity.  
**System Support:** Synonyms; category browse; duplicates prevented.  
**Done:** Tags saved and visible on profile per settings.  
**Metrics:** Tag coverage; impact on match quality.  
**Edge Cases:** User can’t find term → show synonyms/nearby.

---

## I‑08 Journey — Add **Work Experience** **[MVP]**

**Purpose:** Record work with minimal friction; enable later linkage to skills & projects.  
**Entry:** Profile → Journey tab (empty‑state hint).  
**Steps:** Toggle “Work” → Organization → Role/Title → Timeline (start month, optional end month) → **Outcomes** → **Projects** → **Colleagues** → **Achievements** → Save Draft or Publish.  
**Inputs/Data:** Structured fields; outcomes/projects/colleagues/achievements are required.  
**Needs & Feelings:** Light, honest, safe; can edit later.  
**System Support:** Example prompts (e.g., “Improved accessibility for commuters”); drafts; privacy controls.  
**Done:** Work entry saved (draft or published).  
**Metrics:** Completion; average fields filled.  
**Edge Cases:** Incomplete dates; sensitive employer → allow redaction/masking.

---

## I‑09 Journey — Add **Learning Experience** **[MVP]**

**Purpose:** Capture education/certifications and intent.  
**Entry:** Profile → Journey tab.  
**Steps:** Toggle “Learning” → Provider → Credential (if any) → Dates → **Why I chose this** (private note) → Save.  
**Inputs/Data:** Provider; credential; dates; private note.  
**Needs & Feelings:** Reflection; privacy.  
**System Support:** Examples; draft/save; privacy badge on notes.  
**Done:** Learning entry saved.  
**Metrics:** Add rate; linkage to skills later.  
**Edge Cases:** Non‑credential learning; ongoing studies.

---

## I‑10 Journey — Add **Volunteering Experience** **[MVP]**

**Purpose:** Capture service contributions and connect to values/causes.  
**Entry:** Profile → Volunteering.  
**Steps:** Organization → Project → Role → Dates → Link to Values/Causes/Mission (optional) → Save.  
**Inputs/Data:** Structured fields; tag links.  
**Needs & Feelings:** Recognition; dignity; safety.  
**System Support:** Examples; drafts; visibility controls.  
**Done:** Volunteering entry saved.  
**Metrics:** Add rate; values linkage.  
**Edge Cases:** Anonymous volunteering → obfuscate details.

---

## I‑11 Expertise Hub — Introduction & Modes **[MVP]**

**Purpose:** De‑mystify the Hub; let users choose **Guided** vs **Explore Freely**.  
**Entry:** First visit to Expertise Hub.  
**Steps:** Read **About** (collapsible) → choose a mode → proceed.  
**Inputs/Data:** Mode preference.  
**Needs & Feelings:** Confidence; no pressure.  
**System Support:** Clear one‑sentence hints; skip/redo option.  
**Done:** User selects a mode.  
**Metrics:** Mode choice ratio; completion of first skill.  
**Edge Cases:** Abandon mid‑intro → show gentle nudge later.

---

## I‑12 Expertise Hub — Taxonomy Navigation (L1→L3→L4) **[MVP]**

**Purpose:** Add skills in a top‑down, understandable way.  
**Entry:** Press **Add** on an L1 domain card.  
**Steps:** Inline picker appears → pick **L3** category (with search + scrollable list) → choose specific **L4** granular skill.  
**Inputs/Data:** Selected L1/L3/L4 IDs.  
**Needs & Feelings:** Orientation; discoverability.  
**System Support:** Descriptions; examples; “only show what I’ve added” toggle for filled items.  
**Done:** L4 skill chosen for creation.  
**Metrics:** Picks to created skills; time to first add.  
**Edge Cases:** Unfamiliar terms → tooltips; synonyms.

---

## I‑13 Skill Creation (L4) — Level, Proof, Verify, Recency, Link **[MVP]**

**Purpose:** Create a credible skill record that powers matching.  
**Entry:** From I‑12 after choosing an L4.  
**Steps:** 1) Set self‑assessed **Level** (rubric 0–5) → 2) **Attach Proof** (link/file) → 3) **Request Verification** (peer/org/auto; optional) → 4) Set **Recency** (last used) → 5) **Link to Experiences** (work/learning/volunteering) → Save.  
**Inputs/Data:** Level; proof artifacts; verifier contact; recency; link refs.  
**Needs & Feelings:** Flexibility; fairness; safety.  
**System Support:** Level definitions; privacy for proofs; save as draft; later edit; anti‑overclaim nudges.  
**Done:** L4 skill saved (with or without pending verification).  
**Metrics:** Skills per user; proof attach rate; verification uptake.  
**Edge Cases:** NDA‑bound work -> private artifact notes inside a private or link-only Proof Pack.

---

## I‑14 Expertise Dashboard (Comes to Life) **[MVP]**

**Purpose:** Help users “see themselves” via simple charts.  
**Entry:** After adding some skills/links.  
**Steps:** Reveal each chart one‑by‑one with a hint: **what it is** and **what it’s for** (e.g., **Recency** shows freshness of competencies).  
**Inputs/Data:** Aggregated skill metadata.  
**Needs & Feelings:** Insight; motivation; no overwhelm.  
**System Support:** Mock data preview for empty states; accessible charts; tooltips.  
**Done:** User understands snapshot; can deep‑link to edit.  
**Metrics:** Chart views; click‑through to edits.  
**Edge Cases:** Sparse data → show “how to improve this” tips.

---

## I‑15 Matching Profile — Focus Areas & Weighting **[MVP]**

**Purpose:** Let users decide _what_ to match for and _how_ to weight values vs. skills.  
**Entry:** Matching Profile (empty).  
**Steps:** 1) Choose areas/roles/sectors → 2) Set **alignment weighting**: **Mission/Impact** ↔ **Skills/Tools** → 3) Review preview sample matches.  
**Inputs/Data:** Focus tags; weighting parameters.  
**Needs & Feelings:** Agency; dignity; equality in matching.  
**System Support:** Live preview; clear copy about philosophy of mutual choice.  
**Done:** Preferences saved.  
**Metrics:** Edit rate; subsequent match CTR.  
**Edge Cases:** Over‑narrow focus → guidance to broaden.

---

## I‑16 Matching Profile — Practical Constraints & Visibility **[MVP]**

**Purpose:** Capture constraints without exposing sensitive details.  
**Entry:** Continuing I‑15.  
**Steps:** Set salary range, location, work setting, contract type; choose volunteering openness; set **what is visible** to orgs (e.g., only show “salary overlaps”, not the exact range).  
**Inputs/Data:** Constraints; visibility flags.  
**Needs & Feelings:** Safety; no low‑balling; fairness.  
**System Support:** Clear visibility matrix; consent checkboxes.  
**Done:** Constraints stored; visibility rules applied in UI/APIs.  
**Metrics:** Profile completeness; complaint rate about visibility.  
**Edge Cases:** Multi‑currency ranges; remote‑only preferences.

---

## I‑17 Matching Results & Refresh Cadence **[MVP]**

**Purpose:** Deliver matches on the user’s terms and cadence.  
**Entry:** After I‑15/I‑16.  
**Steps:** Pick refresh schedule (daily/weekly/monthly) → View two buckets: **Assigned Matches** (org can see you) & **Open Opportunities** (near‑fit, for exploration) → Save interesting items.  
**Inputs/Data:** Schedule preference; candidate/assignment lists.  
**Needs & Feelings:** Flexibility; discovery beyond strict prefs.  
**System Support:** Filters; snooze; save searches.  
**Done:** User has an actionable list; preferences respected.  
**Metrics:** Save/apply rates; bucket engagement split.  
**Edge Cases:** No matches → suggest tweaks; stale posts flagged.

---

## I‑18 Rank Transparency & Assignment Detail **[MVP]**

**Purpose:** Show fit reasons and where the user ranks when surfaced to an org.  
**Entry:** Open a matched assignment.  
**Steps:** See **Why you match** subscores + **Your rank among top X** candidates; review role; consent to proceed or dismiss.  
**Inputs/Data:** Match vector; rank info (bounded).  
**Needs & Feelings:** Transparency; fairness.  
**System Support:** Clear explanation; guardrails against gaming.  
**Done:** Proceeded or dismissed with feedback.  
**Metrics:** View→proceed rate; dismissal reasons.  
**Edge Cases:** Rank unavailable (privacy) → show band (e.g., “Top 5”).

---

## I‑19 Express Interest / Consent to Share **[MVP]**

**Purpose:** Give explicit consent to be visible/approachable for a specific assignment.  
**Entry:** From I‑18.  
**Steps:** Review what will be shared → confirm consent → appear in org’s ranked list.  
**Inputs/Data:** Consent event; fields shared per visibility settings.  
**Needs & Feelings:** Control; informed sharing.  
**System Support:** Field‑level visibility summary; one‑tap revoke.  
**Done:** Candidate listed for the org.  
**Metrics:** Consent rate; revoke rate.  
**Edge Cases:** Consent timeout; visibility changes mid‑process.

---

## I‑20 Secure Messaging (Text‑Only, No Paste) **[MVP]**

**Purpose:** Lightweight, private, auditable conversation with the org.  
**Entry:** Org contacts user or after consent.  
**Steps:** Open thread → type messages (pasting disabled by design) → optional reveal of additional fields (controlled by the user).  
**Inputs/Data:** Message texts; reveal events.  
**Needs & Feelings:** Efficiency; safety; minimalism.  
**System Support:** No attachments; anti‑spam; content moderation; typing indicators; read receipts.  
**Done:** Clarifications exchanged OR interview scheduled.  
**Metrics:** Response latency; thread duration.  
**Edge Cases:** Attempts to share files/links → gentle block note.

---

## I‑21 Interview Scheduling (Policy Presets + SLA) **[MVP]**

**Purpose:** Coordinate a single interview quickly with preset-based defaults and a visible lifecycle.
**Entry:** From messaging.  
**Steps:** Propose/accept slots → confirm event within the active policy window (`startup`: 7 days / 30 min, `enterprise`: 14 days / 45 min, `volunteer`: 21 days / 30 min, `advanced`: 7 days / 60 min) → create meeting details using Google Meet or a manual meeting link → edit or cancel if plans change → if canceled, schedule a replacement interview for the same match without blockage → post schedule/edit/cancel updates into the conversation thread.  
**Inputs/Data:** Timezones; calendars (optional); meeting platform choice (Google Meet or manual link); lifecycle status.  
**Needs & Feelings:** Certainty; fairness; speed.  
**System Support:** Timezone auto-convert; reminders; one active future interview per match unless the current one is canceled; edit/cancel controls; actionable fallback guidance when Zoom is selected.  
**Done:** Interview is scheduled, updated, canceled, or replaced with all parties seeing the current state.  
**Metrics:** Time match→interview; no‑show rate.  
**Edge Cases:** Zoom selected → fallback to Google Meet or manual link; panel interviews; candidate/org declines → close loop.

---

## I‑22 Decision Window & Feedback **[MVP]**

**Purpose:** Ensure timely closure and learning.  
**Entry:** After interview.  
**Steps:** Both sides respond within the active feedback SLA (default: **48 hours**): accept or decline; if assignment closes, **top matched candidates receive personalized feedback**.
**Inputs/Data:** Decision; feedback notes.  
**Needs & Feelings:** Equality; closure; growth.  
**System Support:** Deadlines; templated, helpful feedback prompts.  
**Done:** Accepted engagement OR respectful decline with feedback.  
**Metrics:** SLA adherence; feedback quality score.  
**Edge Cases:** Silence → automatic expiry with explanation.

---

## I‑23 Settings — Account & Privacy **[MVP]**

**Purpose:** Manage identity, security, and privacy like any modern platform.  
**Entry:** Settings.  
**Steps:** Change email, phone, password; manage sessions; toggle visibility defaults; notification preferences.  
**Inputs/Data:** Contact; credentials; prefs.  
**Needs & Feelings:** Familiarity; control.  
**System Support:** 2FA; device list; irreversible action warnings.  
**Done:** Settings saved.  
**Metrics:** Password reset success; session revokes.  
**Edge Cases:** Compromised account → forced reset flow.

---

## I‑24 Data Portability — **Export JSON** / **Import JSON** **[MVP]**

**Purpose:** Let users own their data offline and restore it later.  
**Entry:** Settings → Data.  
**Steps:** **Export**: generate versioned JSON (`v3.0.0`) → download. **Import**: upload valid JSON payload → choose merge or replace behavior → acknowledge consent → run validation → confirm import.  
**Inputs/Data:** Versioned profile JSON schema; import mode; consent acknowledgment.  
**Needs & Feelings:** Ownership; trust.  
**System Support:** Schema versioning; validation with field-level errors; legacy export normalization when compatible; redaction of secrets.  
**Done:** File exported OR profile restored.  
**Metrics:** Export/Import counts; validation errors.  
**Edge Cases:** Mismatched schema version or invalid fields → block import with guidance; import requires explicit consent; PII-heavy payloads require explicit acknowledgment before import.

---

## I‑25 Delete Account (Immediate, No Grace Period) **[MVP]**

**Purpose:** Allow irreversible exit at user’s request.  
**Entry:** Settings → Danger Zone.  
**Steps:** Read consequences → enter account password → type exact confirmation phrase `DELETE MY ACCOUNT` → optional export reminder → delete immediately.  
**Inputs/Data:** Password confirmation; confirmation phrase; audit log.  
**Needs & Feelings:** Autonomy; clarity.  
**System Support:** Final double‑check; email confirmation of deletion.  
**Done:** Account and personal data deleted per policy.  
**Metrics:** Deletion completion; post‑delete support contacts.  
**Edge Cases:** Wrong password; wrong confirmation phrase; legal holds; queued exports blocked with notice.

---

## I‑26 Zen Hub — Optional Private Check-ins & Reflections **[MVP]**

**Purpose:** Provide an optional, private place for brief check-ins and milestone-linked reflections during stressful hiring moments without turning the product into a clinical, coaching, or content experience.  
**Entry:** Zen Hub tab.  
**Steps:** Review the privacy boundary → explicitly opt in → record a private 1-5 check-in for stress and sense of control → optionally tag it to a milestone → optionally add a private reflection manually or from an in-product milestone prompt.  
**Inputs/Data:** Opt-in status; privacy-banner acknowledgment timestamp; stress score; control score; timestamp; optional milestone tag; optional reflection text; optional linked check-in ID.  
**Needs & Feelings:** Safety; calm; control; clear boundaries.  
**System Support:** Zen entries are visible only to the user. Zen data is never shown to organizations, used in matching or ranking, or added to the public profile. Export and delete controls are always available from Zen Hub.  
**Done:** A private check-in or reflection is saved only after explicit submission.  
**Metrics:** Opt-in rate; check-in completion rate; reflection save rate; export requested/completed; delete completed.  
**Edge Cases:** User dismisses a prompt and nothing is stored; export returns a valid empty package when no entries exist; delete succeeds idempotently; multiple nearby milestone triggers are deduplicated; unsupported or missing deadline events do not create synthetic prompts.

---

# Notes for Engineering & Design

- Flows **I‑11 → I‑14** constrain the Expertise Hub to a top‑down add path (L1→L3→L4) while still allowing later linkage of skills to Journey items; ensure data model supports many‑to‑many.
- Messaging (I‑20) must **block paste & file uploads by design**; log attempts for UX tuning.
- Rank transparency (I‑18) should display **rank bands** if exact rank would reduce fairness or invite gaming.
- Decision SLAs (I‑21/I‑22): enforce reminders/escalations; allow explicit “decline” from either side.
- Data portability (I‑24) requires a **versioned JSON schema** and a safe import preview.
- Zen Hub data should be **extra‑protected** (scoped encryption, segregated storage, minimized telemetry).

# Proofound — Organization User Flows (MVP)

**Purpose:** Translate the narrated CEO journey into **distinct, production-ready organization user flows** for the MVP.  
**Scope:** Organization-side only (companies/SMEs). Individual flows are out-of-scope here.  
**Version:** 1.0 • **Date:** 2025-10-31

---

## How to read this document

Each flow includes:

- **ID & Name** — Stable reference you can map in Figma/dev issues.
- **Goal** — What the user is trying to achieve.
- **Entry** — Where the flow begins (preconditions).
- **Happy-path steps** — Canonical sequence to success.
- **Success** — Exit condition / state transition.
- **Key data** — Fields/entities created or updated.
- **Edge cases** — Errors, branches, or special considerations.
- **MVP** — Whether this belongs to MVP scope.

> This file is built directly from the provided narration. Wording is normalized for production documentation; no features were added beyond the narrative’s intent.

---

## Global assumptions from the narration

- **Portfolio-first onboarding** applies to organizations as well as individuals; org setup ends with a public portfolio-ready confirmation step before the first workspace visit.
- **Privacy & data handling**: legally public org data is public by default; sensitive/contractual data remains private.
- **First-run guidance** uses a gradual reveal of navigation and the operational home with concise hints during onboarding only.
- **Account modes**: a person can hold an **Individual** account and also act as an **Org Representative**; easy switching is required.
- **Interview policy**: lightweight presets apply by default (`default`: 7 days / 30 min, `volunteer`: 21 days / 30 min); decision feedback SLA remains 48 hours.
- **Matching results**: **Top 5** candidates for free tier; if the pool is too small, platform compiles best matches by **72 hours** post‑publish.

---

# Flows

## O‑01 Landing → Organization Sign‑Up Intent

**Goal:** Understand value and decide to create an organization account.  
**Entry:** Visitor reads the shared landing page (for individuals & orgs).  
**Happy‑path steps:** Landing → organization CTA → concise value cards and proof points → continue to organization sign-up.  
**Success:** User proceeds to org sign‑up.  
**Key data:** None.  
**Edge cases:** TL;DR behavior—value cards must be scannable; avoid walls of text.  
**MVP:** Yes.

## O‑02 Organization Sign‑Up & Email Verification

**Goal:** Create an org representative account cleanly.  
**Entry:** CTA from O‑01.  
**Happy‑path steps:** Choose **Organization account** → sign up with email/password or continue with Google/LinkedIn → accept required consent → email/password path receives verification email and verifies before first app session → sign in.  
**Success:** Org representative account created and ready for onboarding.  
**Key data:** User(OrgRep), consent records, auth provider data.  
**Edge cases:** Email deliverability; password policy; duplicate email; provider auth failure; expired verification link.  
**MVP:** Yes.

## O‑03 Minimal Org Setup (Slug, Type, and Public Basics)

**Goal:** Create the organization and its owner relationship with only the fields needed for day-1 value.  
**Entry:** First sign‑in after O‑02.  
**Happy‑path steps:** Enter **organization name**, **slug**, **organization type**, optional **legal name**, optional **mission**, and optional **website** → save.  
**Success:** Organization is created, owner membership is active, and the public org portfolio URL is generated.  
**Key data:** Org.slug, Org.name, Org.legal_name, Org.type, Org.website, OrganizationMembership(owner).  
**Edge cases:** Slug collision; reserved words; existing active membership redirects to existing org home instead of creating a duplicate org.  
**MVP:** Yes.

## O‑04 Public Org Portfolio Ready & Continue

**Goal:** Deliver a live public organization link immediately after org creation and move the user into the first assignment flow.  
**Entry:** Post O‑03.  
**Happy‑path steps:** Show dedicated **Organization link ready** step → display live `/portfolio/org/{slug}` URL → copy link or open portfolio → continue into the create-first-assignment flow.  
**Success:** Public org link is live and the user is steered toward creating the first assignment.  
**Key data:** Public org portfolio URL.  
**Edge cases:** Clipboard blocked; open-in-new-tab failure; search indexing stays off by default; public route may stay unavailable until minimum trust-card content exists; user leaves before clicking continue and later returns to org home directly.  
**MVP:** Yes.

## O‑05 First‑Run Orientation

**Goal:** Prevent overwhelm and explain the lean launch layout quickly.  
**Entry:** First org workspace visit after O‑04.  
**Happy‑path steps:** Reveal navigation with a short hint → reveal the operational home and its queue panels → explain where trust profile, assignments, and review live → suggest the next best action.  
**Success:** Tour completed or skipped and the user can navigate intentionally.  
**Key data:** Tutorial dismissed flags.  
**Edge cases:** Skip, replay, reduced motion, keyboard-only use.  
**MVP:** Yes.

## O‑06 Organization Trust Profile Completion

**Goal:** Add only the trust context needed to make assignments and match review credible.  
**Entry:** From the operational home or trust-profile prompt.  
**Happy‑path steps:** Add mission, why-join statement, up to 3 values, 1-3 proof highlights, and lightweight work norms → preview → save.  
**Success:** Trust profile is ready to support assignment views and match review.  
**Key data:** Mission, why-join statement, values, proof highlights, lightweight work norms.  
**Edge cases:** Incomplete trust profile still saves as draft; preview makes public versus private scope explicit.  
**MVP:** Yes.

## O‑07 Basic Assignment Publishing

**Goal:** Publish a high-signal assignment quickly without advanced org tooling.  
**Entry:** From the operational home or assignment CTA.  
**Happy‑path steps:** Enter title, why this role exists, outcomes, must-have skills, practical constraints, optional trust requirements, and publish.  
**Success:** Assignment is live and match generation begins.  
**Key data:** Assignment basics, skills, constraints, publish status.  
**Edge cases:** Inline fixes for missing required fields; keep editing on the same launch path rather than branching to an advanced builder.  
**MVP:** Yes.

## O‑08 Match Review Queue & Optional Reviewer Invite

**Goal:** Review privacy-safe candidate summaries and bring in lightweight collaboration only when needed.  
**Entry:** After O‑07 or from the operational home.  
**Happy‑path steps:** Open the **Assignments and Matches** queue → review privacy-safe candidate summaries with proof context and match reasons → shortlist, pass, or request intro → optionally invite a reviewer with narrow review permissions.  
**Success:** The organization has an active review queue and optional reviewer access without admin sprawl.  
**Key data:** Match review actions, intro requests, reviewer invite records.  
**Edge cases:** No matches yet state with next steps; duplicate reviewer invite; invite expiry or revoke.  
**MVP:** Yes.

## O‑09 Intro, Interview, and Feedback Follow-Up

**Goal:** Move from intro to interview and decision follow-up with clear operational discipline.  
**Entry:** From O‑08 once a candidate is shortlisted or an intro is approved.  
**Happy‑path steps:** Request or approve intro → open the message thread → schedule an interview inside the active policy window → send a timely decision and personalized feedback follow-up.  
**Success:** Intro, interview, and feedback states are updated from the same operational home.  
**Key data:** Intro state, message thread, interview record, decision status, feedback timestamps.  
**Edge cases:** Reschedule, manual meeting-link fallback, silence or SLA reminder, no-show handling.  
**MVP:** Yes.

---

## Canonical org-flow notes

- The MVP org corridor is limited to sign-up, minimal setup, public portfolio ready, first-run orientation, trust profile completion, basic assignment publishing, privacy-safe match review, optional reviewer invite, and intro/interview/feedback follow-up.
- Post-MVP org-system surfaces such as trials, seat caps, departments, hierarchy, project systems, impact-area systems, stakeholder workflows, advanced builder paths, and org-level atlas authoring are intentionally excluded from launch scope.
- BYOC candidate invites remain compatible with the same lean review queue and do not introduce a separate enterprise or government branch.
- **Interview:** policy preset, duration, platform, participants, scheduled within active preset window.
- **Decision/Feedback:** outcome with personal feedback ≤48h SLA.
- **Settings/Security:** MFA, privacy, export JSON, deletion safeguards.

## Appendix B — SLA & Matching Rules

- **Qualified introductions:** Early cohorts should still target **TTFQI ≤ 72h** in at least one cohort when pool size and activation quality allow it.
- **Interview:** Recommended presets stay lightweight: `default` (7 days / 30 min) and `volunteer` (21 days / 30 min). No enterprise-specific or advanced policy mode ships in MVP.
- **Decision:** **48 hours** default SLA to inform candidates with personalized feedback; reminders/escalations remain mandatory.

# PRD — MVP — Part 5: Scope (MVP Features)

> **Scope philosophy (for this MVP):** “Features” are **distinct, value-creating capabilities** beyond commodity plumbing (e.g., auth, basic profile, settings). Below separates **Individual** and **Organization** features, each with **Why Now** (from Part 1), **Acceptance Criteria** (pulling from Part 2 metrics and Part 4 flows), and **MoSCoW** priority for MVP.

> **Canonical MVP boundary:** Proofound MVP is a privacy-first, calm workflow for individuals and lean organizations to build trust, publish one high-signal assignment path, review privacy-safe matches, and move to intros. MVP excludes government deployment branches, org operating-system features, enterprise admin suites, payments/contracting, Zen expansion beyond private check-ins and reflections, and vanity or gamified mechanics.

---

## 5.1 Individual Features

### F1 — **Purpose Block** (Mission • Vision • Values • Causes) within Profile

**Why Now:** Replaces performative CVs with authentic, values-first signals that improve match quality and reduce bias in noisy/AI-inflated markets.  
**Acceptance Criteria:**

- User can create/edit mission, vision, values (≤5), and causes (≤5) with per-field visibility controls.
- Purpose signals are ingested by the matching engine and visible in a **Match Detail** with **PAC (Purpose-Alignment Contribution)** shown.
- Audit trail for edits; exportable as a public snippet (optional).
- **SUS ≥ 75** for editing flow; completion rate ≥ 85% among new users who start the block.  
  **MoSCoW:** **Must** (MVP); **Could:** bulk import from CV/LinkedIn text.

---

### F2 — **Calm Home Snapshot** (Observer-only status view)

**Why Now:** Reduces cognitive load and time-to-value through one quiet status surface instead of a rich dashboard product.  
**Acceptance Criteria:**

- Home shows a fixed set of status cards for Matches, Applications/Intros, Skills and Proof, Privacy, and Next Best Action.
- The home snapshot loads < 2.0s P75 with cohort baseline volumes.
- **Task success ≥ 90%** for finding the next relevant area from home; **drop-off < 10%** in the transition to the selected module.
- Zen Hub stays reachable from navigation and settings, not as a home-surface habit loop.  
  **MoSCoW:** **Must**.

---

### F3 — **Expertise Atlas** (L1→L4 taxonomy + L4 properties & proofs)

**Why Now:** Moves from keyword CVs to structured, high-signal expertise representation that AI can’t trivially game.  
**Acceptance Criteria:**

- Users move through an explicit trust ladder instead of Lite/Strong:
  - **Discoverable:** public basics, one target role or focus area, one recent L4 skill, one proof linked to that skill, and one practical preference.
  - **Match-visible:** discoverable plus three recent L4 skills, two acceptable proofs across two distinct skills, desired roles, work mode, country or city, and basic availability.
  - **Intro-eligible:** match-visible plus five recent L4 skills, four proof-linked L4 skills, three role-relevant proof-linked L4 skills, one trusted or attested proof-backed skill, fresh proof coverage, and complete intro preferences.
  - **Strongly trusted:** intro-eligible plus deeper proof coverage across contexts and at least two active trust anchors.
- Activation is **non-blocking** for product access: users can publish a portfolio and browse matching before they become intro-eligible.
- Private browse unlocks before org-visible matching. Candidate visibility to org matching starts at **Match-visible**. Qualified introductions start only at **Intro-eligible**.
- Users can still add/edit L4 properties (level, months, proof links/files) via guided flow or import.
- Auto-suggest L4s from pasted CV/JD with explain-why; user acceptance/edit-in-place.
- Time-to-activation (profile becomes **Match-visible**) **≤ 20 minutes** P50 for first-time users.
- Event tracking on add/edit; visible status on the home snapshot.  
  **MoSCoW:** **Must** (manual add + basic auto-suggest); **Should:** Gap Map basic; **Could:** bulk CSV import.

---

### F4 — **Matching Hub** (values-aware automated matching)

**Why Now:** Shrinks search overhead for both sides, targeting **TTFQI** and **TTSC** improvements.  
**Acceptance Criteria:**

- Generates ranked shortlists with composite score and **PAC** component.
- Matching and shortlist review are blind-by-default. Default reviewer surfaces are limited to Stage 0 anonymous review or Stage 1 capability + proof review and must not expose identity-bearing fields.
- **TTFQI median ≤ 72 hours** for at least one target cohort after activation (Part 2).
- Inline “Why this match” with editable constraints (location, availability, verification gates) and quick actions (intro, pass, snooze).
- Compensation visibility defaults to **overlap-only** in matching surfaces unless explicit exact-range visibility is granted.
- Setup flow always shows **sample match previews** (real near-matches when available, clearly labeled mock samples otherwise).
- Matching endpoints return eligibility guidance without hard blocking:
  - If the user is not yet **Discoverable**, return `200` with `items` (possibly empty), `eligibility`, `trustLevel`, `introEligibility`, and `topActions`.
  - If the user is **Discoverable** but not **Match-visible**, private browse remains usable while org-visible matching stays paused.
  - If intro criteria are unmet, intro actions return `409 INTRO_QUALIFICATION_NOT_MET` with missing requirements, reason codes, and next actions, without blocking browse.
- “Why this match” and pass reason codes must stay useful without exposing hidden employer names, school names, demographic markers, or private portfolio details.
- Published public portfolios do not weaken blind review. Matching surfaces may show sanitized proof summaries, never direct identity-bearing portfolio links before the allowed reveal stage.
- **Fairness note** per release with cohort checks where users opt-in to share demographics.  
  **MoSCoW:** **Must** (shortlist + why + quick actions); **Should:** snooze/feedback loops; **Could:** experiment flags for alternative scoring.

---

### F5 — **Zen Hub** (optional private check-ins and reflections)

**Why Now:** Gives users a narrow, private support surface for volatile job-search moments without expanding Proofound into a broader support program.  
**Acceptance Criteria:**

- Opt-in, non-diagnostic 1–5 check-ins (stress, sense of control) with private-by-default storage.
- Reflections linked only to milestone tags (`rejection`, `interview`, `offer`, `deadline`) and manual entry.
- Clear privacy boundary banner shown before enablement; Zen entries are visible only to the user.
- User can export Zen data as versioned JSON and permanently delete Zen data without affecting portfolio or matching state.
- Zen analytics stay inside a private partition and exclude reflection text, raw scores, trend lines, and user-level dashboarding.  
  **MoSCoW:** **Must** (opt-in + check-ins + reflections + privacy + export/delete clarity); **Post-MVP:** trends, self-assessments, schedules, resources, local discovery, guided content.

---

### F6 — **Granular Visibility & Boundary Controls**

**Why Now:** Trust and safety: users choose what’s visible to whom to avoid performative pressure and bias.  
**Acceptance Criteria:**

- Field-level visibility (public, network-only, match-only, private) for purpose, artifacts, and selected L4s.
- One-click **Redact name/photo** mode for blinded previews.
- Single **“What others can see”** summary panel with quick preview-as entry points.
- Privacy settings surfaced in relevant flows (purpose edit, artifact upload, match review).
- **Blind-by-default progressive reveal stages**
  - **Stage 0: anonymous / redacted review**
    - Visible: anonymous label, capability summary, skill clusters, proof-pack summaries, outcome evidence summaries, work-mode fit, timezone band or broad region if needed, compensation fit as `overlap / no overlap / not shared`, narrow verification labels, rank band or unordered shortlist position.
    - Hidden: name, handle, photo, exact location, employer names, school names, exact compensation, contact details, direct social/profile links, public portfolio URL, demographic or inferred bias-sensitive signals.
    - Actions: shortlist, pass, snooze, request more proof, request contextual reveal.
    - Reveal authority: org reviewer may request Stage 1 or Stage 2; system may suppress for fairness or policy reasons.
    - Consent or policy: no candidate approval needed to remain blind; redact mode and field visibility always apply.
    - Logged: `shortlist_generated`, `match_viewed`, `reveal_requested`, fairness suppression events, reviewer decision reason code.
  - **Stage 1: capability + proof review**
    - Visible: Stage 0 plus deeper proof-pack content, artifact summaries, methods/tools, outcome metrics, verification summary, and redacted class labels such as “global NGO” or “public university” when redaction is enabled.
    - Hidden: name, photo, handle, direct links, contact details, exact employer or school names when redaction is enabled, exact location, exact compensation, demographic or inferred bias-sensitive signals.
    - Actions: keep under review, shortlist, pass, request contextual reveal, request missing proof.
    - Reveal authority: org reviewer requests Stage 2; system may deny if visibility, fairness, or artifact-safety rules would be violated.
    - Consent or policy: candidate approval is not needed only while no identity-bearing field is exposed; identifying artifact metadata must stay sanitized or withheld.
    - Logged: `reveal_requested`, `reveal_denied`, `review_override_applied`, reason-ledger updates.
  - **Stage 2: contextual reveal**
    - Visible: Stage 1 plus exact timezone, metro or region, work authorization summary, availability window, and employer, school, or portfolio context only when redaction is disabled and the candidate has allowed contextual reveal.
    - Hidden: personal contact details, private social links not explicitly revealable, exact compensation unless separately allowed, demographic or inferred bias-sensitive signals.
    - Actions: request intro, request Stage 3 reveal, pass with structured feedback, continue in-platform discussion.
    - Reveal authority: org reviewer may request; candidate must approve any reveal that exposes identity-bearing context.
    - Consent or policy: explicit candidate consent required for employer, school, portfolio URL, or other identity-bearing context; fairness suppression or admin hold may still deny.
    - Logged: `reveal_requested`, `reveal_granted`, `reveal_denied`, consent capture, policy reason code.
  - **Stage 3: intro-approved reveal**
    - Visible: full name, photo, public portfolio URL if published, employer and school names according to profile visibility, full allowed verification labels, and the identified intro thread.
    - Hidden: direct email, phone, and off-platform contact details by default; exact compensation unless separately allowed.
    - Actions: approve intro, open identified thread, exchange structured intro context, request interview.
    - Reveal authority: org requests intro-approved reveal; candidate must explicitly approve.
    - Consent or policy: candidate approval and mutual intro state required; verification or fairness policy may still block stronger actions.
    - Logged: `reveal_requested`, `reveal_granted`, intro workflow start, consent version, source surface, reason code.
  - **Stage 4: interview coordination reveal**
    - Visible: direct contact channel needed for coordination, exact location only when needed for interview logistics, calendar or meeting details, exact compensation only when the candidate separately allows it or the process reaches a negotiation-safe stage.
    - Hidden: anything outside coordination scope plus demographic or inferred bias-sensitive signals.
    - Actions: schedule interview, exchange meeting details, negotiate logistics.
    - Reveal authority: either side may request after Stage 3; candidate approval required before direct contact or exact logistics are exposed.
    - Consent or policy: explicit coordination consent and interview workflow trigger required.
    - Logged: `reveal_requested`, `reveal_granted`, interview scheduling events, coordination consent, scope granted.
- **Bypass prevention and artifact handling**
  - Org reviewers cannot self-upgrade from blind review to identity reveal.
  - Hidden identity-bearing links remain absent, not merely blurred.
  - Manually uploaded artifacts that contain identifying metadata must render as sanitized, withheld, or requires-review, never silently leaked through filename, EXIF, watermark, embedded email, or author metadata.
  - Public portfolios remain explicit publication surfaces, but matching review must not expose the direct route, handle, or indexable identity hooks before the allowed reveal stage.
- **MoSCoW:** **Must** (field-level + redact + staged reveal); **Could:** audience presets.

---

### F7 — **Verification & Attestations (v1)**

**Why Now:** Credibility without heavy gatekeeping; reduces noise for orgs and anxiety for candidates.  
**Acceptance Criteria:**

- Users can complete lightweight verification through **work email** and **LinkedIn**, with canonical trust tiers:
  - `unverified`
  - `workplace_verified`
  - `identity_verified`
- Users can request **peer/mentor attests** to artifacts or L4s via magic link.
- Assignment-introduced **verification gates** are displayed pre-intro (e.g., ID, portfolio, reference).
- Contextual “Request attestation” entry points appear on proof/skill surfaces and unmet gate banners.
- Government ID verification is **not** exposed as a self-serve option in the current MVP UI.
- Time-to-first trust signal P50 **≤ 7 days** for users who start a work-email, LinkedIn, or attestation flow (from Persona flows).  
  **MoSCoW:** **Should** (lightweight verification + attestations); **Could:** stronger employment or ID checks later.

---

### F8 — **Gap Analysis & Next-Best Skills**

**Why Now:** Reduces activation time by showing the clearest skills/proof gaps against target roles and suggested matches.  
**Acceptance Criteria:**

- Gap view highlights **must/nice L4 gaps** per chosen focus area or matched assignments, with a short “why this matters” note tied to outcomes.
- Suggests top **≤5 L4s or proofs** to add; user can **accept/edit inline**, carrying over level/proof fields; activation progress updates immediately.
- Produces a **next-best action** when gaps remain (e.g., add proof, widen availability) and tracks reduction in gap count/time-to-activation.  
  **MoSCoW:** **Should** (baseline gap map + actions).

---

### F9 — **Post-Interview Feedback Loop (Individual)**

**Why Now:** Delivers timely learning and fairness after interviews, reducing uncertainty and churn.  
**Acceptance Criteria:**

- Individuals see **decision + personalized feedback** per interview within the **48h SLA**; status shows pending/received.
- Feedback is stored with the related assignment/interview and is **notified** (in-app/email).
- Users can review past feedback from the home snapshot or Matching hub without exposing private notes to orgs.  
  **MoSCoW:** **Must** (SLA-aligned feedback for candidates).

---

## 5.2 Organization Features

Lean launch rule: the org side exists to establish trust for matching, publish a high-signal assignment quickly, review privacy-safe matches, and approve intros. It is not an org operating system, enterprise admin suite, or government workflow in MVP.

### O1 — **Organization Trust Profile**

**Why Now:** Organizations need enough trust context for matching, but not a full storytelling stack.  
**Acceptance Criteria:**

- Create/edit an org summary with mission, one-line why-join statement, and up to 3 values.
- Add 1–3 proof highlights or example initiatives; no standalone impact, projects, or org-map modules.
- Add lightweight work norms that affect fit: async/sync expectations, meeting intensity, timezone expectations, accessibility accommodation, and language expectations.
- This trust context appears in the org profile, relevant assignment views, and match detail where it improves confidence and purpose-aware matching.  
  **MoSCoW:** **Must**.

---

### O2 — **Assignment Publishing**

**Why Now:** Fast, high-signal publishing is the main org-side launch job.  
**Acceptance Criteria:**

- A single launch path exists for assignment creation: title, why this role exists, outcomes, must-have skills, practical constraints, optional trust requirements, and publish.
- Optional plain-text team or reporting context may live inside the assignment instead of a standalone structure surface.
- **Time-to-publish P50 ≤ 15 minutes**; task success ≥ 90%; drop-off < 10% on final steps.
- Advanced authoring, stakeholder matrices, weight matrices, and template libraries are not part of stated MVP scope.  
  **MoSCoW:** **Must**.

---

### O3 — **Match Review and Intro Workflow**

**Why Now:** Review quality, not dashboard depth, determines day-1 value.  
**Acceptance Criteria:**

- Organizations review privacy-safe candidate summaries with proof context and match reasons per assignment.
- Reviewers can shortlist, pass, request intro, and track pending intros and decision follow-up from a simple operational home.
- The launch home is an **Assignments and Matches** view that shows open assignments, new matches, pending intros, and pending feedback.
- Dashboard analytics, fairness tiles, custom layouts, and BI-style reporting are post-MVP.  
  **MoSCoW:** **Must**.

---

### O4 — **Minimal Org Access**

**Why Now:** Some teams need light collaboration, but admin sprawl does not improve launch value.  
**Acceptance Criteria:**

- The org side works with a single owner account.
- If multi-user access is needed, keep it to **Owner** plus optional **Reviewer**.
- Reviewers can review matches and intros; owners can manage profile and assignments.
- No standalone team hub, SSO placeholder, granular export permissions, or enterprise admin branches in MVP scope.  
  **MoSCoW:** **Should**.

---

## 5.3 Out of Scope (confirming feature boundaries)

- Social **content feeds** and engagement mechanics.
- Clinical, therapeutic, coaching, or burnout-management tooling.
- Zen trend scoring, self-assessments, work-schedule guardrails, guided content libraries, external resource hubs, local-event discovery, streaks, or gamified return mechanics.
- Deep HRIS/ATS integrations beyond simple exports/placeholders in MVP.
- Automated compensation benchmarking; culture scoring; legal/contracting workflows.
- Government deployment branches, procurement-specific rollout paths, and records-retention variants beyond generic export.
- Org operating-system features, enterprise admin suites, vanity counters, gamified mechanics, and BI-style product dashboards.

---

## 5.4 Cross-Feature Acceptance Gates (MVP “Done” hooks)

- **Activation thresholds** defined and enforced for both Profiles and Assignments.
- **TTFQI**, **TTV**, **TTSC**, **PAC**, and **SUS** instrumentation live; internal ops reporting populated.
- **SUS** study executed on activation and assignment flows; targets from Part 2 met.
- **Fairness note** generated from cohort checks (opt-in demographics).
- **Privacy review** passed for Zen Hub and visibility controls; redaction works in previews and Zen audit metadata excludes content payloads.

---

## 5.5 MoSCoW Summary (MVP)

- **Must:** F1, F2, F3, F4, F5, F6, F9; O1, O2, O3.
- **Should:** F7, F8; O4.
- **Could:** Bulk import/export niceties; internal analytics refinements; SSO/SCIM; donor/investor views; exercises library.

---

## Facts & Decisions (Part 5)

- **Features vs plumbing:** Auth, base profile, settings, messaging basics are **non-features** (plumbing) and assumed present.
- **Values-aware matching:** Purpose signals are first-class (PAC) and must never be used to penalize or exclude protected groups.
- **Zen Hub boundary:** Optional, private-by-default, and never used to rank matches, org analytics, fairness workflows, or public rendering.
- **Org type flag:** Optional for copy and guidance only; it must not create separate government or enterprise workflow branches.

**Open Questions**

- Minimum verification set per persona/org in MVP (tie to Part 3).
- Exact fairness checks & thresholds to include in the “fairness note.”
- Cohort bins for TTSC/TTFQI internal reporting (role, seniority, region) to finalize with data model.

**Approval**

- **Status:** Draft v0.1 (awaiting product approval)
- **Approver:** Pavlo Samoshko
- **Date:** —

# PRD — MVP — Part 6: Out of Scope

> **Purpose:** Keep the MVP tight and prevent **stealth bloat** (quiet, incremental scope creep that dilutes focus and delays launch). Everything below is **post‑MVP** unless explicitly re-scoped later.

## 6.1 Excluded Product Capabilities (MVP)

- **Social content feeds** and engagement mechanics (likes, follows, vanity counters).
- **Clinical/diagnostic mental‑health tools** (therapy/coaching claims, screenings); using well‑being data to rank users.
- **Deep integrations**: full ATS/HRIS/CRM or email inbox integrations; **SSO/SCIM production** rollout (placeholders only).
- **Hard verification**: background checks, KYC/ID, employment verification (beyond **soft attestations**).
- **Payments & contracting**: payouts, invoicing/escrow, offer/comp negotiation, e‑signature, payroll.
- **Advanced analytics**: cohort experimentation platform, causal fairness analysis; public leaderboards.
- **Compliance programs**: SOC 2/ISO 27001 audits; strict **data residency** controls beyond basic privacy.
- **Mobile apps** (iOS/Android) and offline mode.
- **Localization at scale** (beyond base language + standard formats/timezones).
- **Public directories/SEO landing farms** for user/org profiles.
- **Generative CV/cover‑letter tools**; personality/culture **scoring** beyond explicit constraints.
- Any Zen surface beyond opt-in check-ins, milestone-linked reflections, privacy boundary, export, delete, and retention clarity.

## 6.2 Excluded Geographies / Segments (MVP)

- Government-grade deployments, procurement-specific flows, or records-retention mandates beyond generic export.
- Highly regulated sectors requiring bespoke compliance (health/defense) beyond generic controls.

## 6.3 Boundaries vs Included MVP Features

- **Included (Part 5):** Organization Trust Profile, Assignment Publishing, Match Review and Intro Workflow, Minimal Org Access, Expertise Atlas, **Gap Analysis**, Matching Hub (with **PAC**), post-interview feedback loops (individual + org), Zen Hub (private check-ins and reflections only), visibility controls, and soft **attestations**.
- **Not included:** Anything that materially expands scope beyond these (above exclusions apply).
- **Canonical MVP boundary:** Proofound MVP is a privacy-first, calm workflow for individuals and lean organizations to build trust, publish one high-signal assignment path, review privacy-safe matches, and move to intros. MVP excludes government deployment branches, org operating-system features, enterprise admin suites, payments/contracting, Zen expansion beyond private check-ins and reflections, and vanity or gamified mechanics.

---

## 6.4 Lean Organization MVP Migration Notes

- Former standalone org surfaces for structure, culture, impact, projects, expertise hub, dashboard, templates, and org-type UX branching are either collapsed into the four launch surfaces above or moved post-MVP.
- Enterprise customers may still use the MVP, but enterprise-specific procurement, SSO/SCIM, ATS/HRIS, donor/investor reporting, and government workflow branches do not define launch scope.
- Historical mentions of evidence-pack exports, org maps, JD-paste analytics, or dashboard tiles should be read as post-MVP unless they are explicitly re-scoped later.

## Facts & Decisions

- This list is **binding for MVP**; additions require a change note and re‑prioritization.
- Non‑negotiables: **no social feed**, **no diagnostic mental‑health features**, **no mandatory government-ID verification in the current self-serve MVP**, **no payments/contracting** in MVP.
- Rationale ties to Parts **1–5**: focus on faster, fairer **matches** (TTFQI/TTSC), privacy‑first, low cognitive load, and a lean org-side launch workflow.

**Status:** Draft v0.1 (awaiting product approval) · **Approver:** Pavlo Samoshko · **Date:** —

# PRD — MVP — Part 7: Functional Requirements

> **Scope:** Functional specs for all **MVP features** (from Part 5) grounded in **User Journeys** (Part 3) and **Core User Flows** (Part 4).  
> For each feature: **Inputs → Processing Rules → Outputs → Error & Empty States → Event Tracking** (analytics).  
> Canonical metrics from Part 2: **TTFQI, TTV, TTSC, PAC, SUS**.

---

## 7.1 Individual Features

### F1 — Purpose Block (Mission • Vision • Values • Causes)

**Inputs**

- User text entries: `mission`, `vision` (max length & profanity filter), `values[]` (≤5), `causes[]` (≤5; mapped to controlled tags).
- Visibility flags per field: `{public | link_only | match_only | private}`.
- Optional: import from existing resume/LinkedIn paste.

**Processing Rules**

- Validate lengths; deduplicate values/causes; normalize case.
- Map `causes` to internal tag set for **PAC** calculation; store as normalized IDs.
- Changes write an append-only **purpose_edit_log** for audit.

**Outputs**

- Profile render; **Match Detail** panel shows purpose with **PAC** badge.
- Optional public snippet export (shareable link).

**Error & Empty States**

- Empty: “Add your mission/values—improves match quality.” Suggested examples.
- Errors: disallowed content, length exceeded, save conflict → show inline; autosave retries.

**Event Tracking**

- `purpose_created/updated` {fields_changed[], field_visibility[], word_count}
- `purpose_exported` {format, link_created}
- `purpose_viewed_in_match` {match_id, pac_value}

---

### F2 — Calm Home Snapshot

**Inputs**

- Fixed card set: Matches, Applications/Intros, Skills and Proof, Privacy, Next Best Action.

**Processing Rules**

- Fetch status-card data concurrently with 2.0s P75 budget.
- “Next Best Action” computes from profile completeness, L4 gaps, and match backlog.

**Outputs**

- Home snapshot page; per-card deep-links to the relevant module.

**Error & Empty States**

- Empty: show calm placeholders and seeded examples (“No matches yet, complete 3 L4s to unlock”).
- Card fetch error: display fallback message and retry control.

**Event Tracking**

- `home_snapshot_viewed` {cards[], load_ms}
- `next_best_action_clicked` {action_type}

---

### F3 — Expertise Atlas (L1→L4 + properties & proofs)

**Inputs**

- Manual L4 add (name from taxonomy), properties: `level (0–5)`, `months_experience`, `proofs[]` (files/links), `visibility`.
- Import text/PDF (optional) to suggest L4s; user accept/edit.
- Bulk add (up to 10 L4s at once).

**Processing Rules**

- Validate files (size/type); virus-scan uploads.
- Auto-suggest pipeline extracts candidates, maps to known L4 IDs with confidence + “why” rationale.
- Compute **expertise_depth** (count, recency of proofs).
- Profile trust and activation compute four states:
  - **Discoverable:** portfolio basics plus one proof-linked recent skill and one practical preference.
  - **Match-visible:** three recent L4 skills, two proof-backed skills, desired roles, work mode, location, and basic availability.
  - **Intro-eligible:** five recent L4 skills, four proof-linked L4 skills, three role-relevant proof-linked L4 skills, one trusted or attested proof-backed skill, fresh qualifying proof, and complete intro preferences.
  - **Strongly trusted:** intro-eligible plus deeper proof coverage and multiple active trust anchors.

**Outputs**

- Hierarchical view (L1→L4) with counts; L4 detail sheet; proof gallery.
- Dashboard “Expertise depth” tile.

**Error & Empty States**

- Empty: guided starter kit (3 suggested L4s).
- Import failure: offer manual add with copy/paste capture.
- Upload error: show allowed types/size; keep unsaved changes.

**Event Tracking**

- `l4_added` {l4_id, source: manual|suggested, visibility, level}
- `l4_property_updated` {l4_id, field, old, new}
- `proof_uploaded` {l4_id, file_type, size_kb}
- `cv_import_attempted` {pages, bytes} / `cv_mapping_accept/reject` {l4_id, confidence}

---

### F4 — Matching Hub (values-aware automated matching)

**Inputs**

- From user: location mode, availability window, languages, compensation bounds, right-to-work, causes/values priority; verification readiness.
- From system: active **Assignments**, org **verification gates**, Atlas L4 set.

**Processing Rules**

- Composite `match_score` uses only `skills_fit`, `proof_fit`, `constraints_fit`, `verification_fit`, and `purpose_fit`; PAC is a bounded, positive-only subcomponent inside `purpose_fit`.
- Forbidden score inputs: protected or proxy demographic attributes, Zen or wellbeing data, names/photos/direct identity fields, school or employer prestige, social graph popularity, engagement metrics, reviewer preference notes, and manual overrides as direct score inputs.
- Only surface matches meeting minimum score + gate compatibility.
- Every ranking output carries `reasonSummary` (1-3 plain-language bullets), `reasonSections` (`Why this match`, `What may hold it back`, `What you can improve next`, and `Fairness or policy limits` only when relevant), and `rankPresentation` (`band`, `exact`, or `hidden`).
- Canonical reason-code groups: positive match, constraint mismatch, verification state, freshness or evidence quality, missing-data or confidence limits, workflow decision, manual override, and fairness or policy limitation.
- Exact scores remain internal by default. User-facing surfaces show bands or qualitative fit states; exact rank is allowed only in tightly scoped org-review surfaces when pool size and fairness guardrails pass.
- PAC treatment: positive-only, neutral when missing, and never allowed to override failed hard constraints or required verification gates.
- Verification treatment: `verification_fit` may improve ranking and required verification may gate shortlist or reveal stages, but explanation copy must stay privacy-safe and must not expose hidden identity detail.
- Freshness treatment: `proof_fit` rewards recent, relevant evidence, lowers confidence for stale evidence, and may generate refresh hints; it must not silently zero an otherwise strong match unless policy marks evidence expired.
- Missing-data treatment: missing required evidence, preferences, or verification creates explicit reason codes and recovery hints; missing protected or optional personal data is neutral. Weak confidence may move presentation from exact rank to band mode.
- Opt-in fairness checks produce cohort-level **fairness note** each release, with `insufficient_data` as a valid release outcome.
- Every ranking decision stores a trace package with `score_version`, `model_version`, `explanation_version`, `fairness_check_version`, `inputs_hash`, top-level component scores, component applicability state, reason codes, rank presentation mode, fairness status, generated timestamp, gating outcomes, stale-policy state, and reviewer override linkage when present.
- Manual override policy: reviewers may change workflow outcome, not underlying score history. Allowed override reasons are `manual_shortlist_exception`, `manual_hold_for_context`, `manual_reject_policy_or_constraints`, `verification_exception_approved`, `duplicate_candidate_resolution`, `appeal_upheld_reconsider`, `fairness_remediation_hold`, and `safety_or_trust_escalation`.
- Release fairness note requirements: include release identifier, date range, sample thresholds used, cohorts analyzed, whether exact-rank suppression or remediation was active, observed gap summary in plain language, and explicit limitations including `insufficient_data` handling.

**Outputs**

- Ranked shortlist; actions: **introduce**, **pass (with reason)**, **snooze**, **open assignment**.
- “Why not shortlisted” and near-threshold hints are action-oriented and non-numeric.
- If no strong match exists, show `No strong matches yet` plus exactly 3 recovery actions based on the top missing or stale signals.
- Suspicious ranking outcomes can be reported from Match Detail or support. The support path must capture match ID, ranking versions, reason codes, rank presentation mode, and any override linkage for audit review.

**Error & Empty States**

- Empty: show top 3 actions to raise score (e.g., add L4 proof, widen availability).
- Critical individual empty/incomplete states must always show exactly 3 recovery CTAs:
  - `Add a Proof Pack`
  - `Add a skill`
  - `Turn on matchable` (routes to matching preferences)
- Organization matching empty/no-results states must always show exactly 3 recovery CTAs, including:
  - `Turn on candidate matching`
  - `Publish assignment` (or publish updates)
  - `Add skill requirements`
- Gate mismatch: banner explaining unmet verification.
- Low-confidence or policy-limited explanations must say why detail is limited without exposing cohort comparisons or internal thresholds.
- Rate limiting: prevent mass introduces within a window.

**Event Tracking**

- `match_ranked` {match_id, assignment_id, score_version, model_version, explanation_version, fairness_check_version, rank_presentation, fairness_status, reason_codes[]}
- `shortlist_generated` {count, min_score, cohort, rank_presentation}
- `match_viewed` {match_id, rank_presentation, fairness_status}
- `match_explanation_viewed` {match_id, explanation_version, reason_codes[], rank_presentation}
- `match_actioned` {match_id, action:introduce|pass|snooze, reason?}
- `review_override_applied` {match_id, assignment_id, override_reason_code, previous_stage, new_stage, requested_scope}
- `review_override_reverted` {match_id, assignment_id, override_reason_code, previous_stage, new_stage, requested_scope}
- `match_outcome_reported` {match_id, support_path:in_product|support, suspicious_outcome:true}
- `fairness_note_published` {release_id, status:published|insufficient_data, cohorts_analyzed, exact_rank_suppressed}
- `match_settings_changed` {field, old, new}

---

### F5 — Zen Hub (optional private check-ins and reflections)

**Inputs**

- Explicit opt-in flag and privacy-boundary acknowledgment.
- Check-ins: 1-5 stress and sense-of-control inputs; optional milestone tag; optional reflection text.
- Milestone triggers limited to `rejection`, `interview`, `offer`, and `deadline`.

**Processing Rules**

- Store Zen data in segregated Zen tables and a minimal Zen audit table; never join it into ranking, matching, org review, fairness workflows, or public rendering.
- Do not compute trend scores, deltas, self-assessments, or inferred state labels in MVP.
- Show milestone prompts only in-product on the next relevant app open inside the prompt window. No email, push, SMS, auto-save, or reminder loop.

**Outputs**

- User-only check-in and reflection history with privacy-boundary copy visible from the Zen surface.
- On-demand versioned JSON export and permanent delete controls available from Zen Hub.

**Error & Empty States**

- Not opted in: show the privacy boundary and enable action only.
- Empty state: explain that Zen Hub is optional, private, and not used for matching or ranking.
- Dismissed prompt: store nothing and expire it without reminders or penalties.

**Event Tracking**

- `wellbeing_opt_in_changed` {enabled}
- `wellbeing_checkin_submitted` {trigger_type:manual|rejection|interview|offer|deadline}
- `reflection_added` {trigger_type:manual|rejection|interview|offer|deadline, length_bucket}
- `zen_export_requested` {format:json}
- `zen_export_completed` {format:json}
- `zen_delete_completed` {scope:zen_only|account_delete}

---

### F6 — Visibility & Boundary Controls

**Inputs**

- Field-level visibility settings; global **Redact** toggle (name/photo).
- Preview-as: public, network-only, match-only.

**Processing Rules**

- Enforce visibility on all reads (UI & API) with defense-in-depth checks.
- Redaction applies to profile preview and shortlist cards.
- Matching and shortlist review must honor the staged reveal model. Redaction mode overrides general public visibility inside matching surfaces until the relevant stage allows identity-bearing fields.
- Candidate-controlled reveal is the default for name, photo, exact location, employer, school, direct portfolio access, exact compensation, and contact details.
- Audit log for changes; “restore defaults” control.

**Outputs**

- Live preview; updated profile/match cards.
- “What others can see” summary buckets: public, network-only, match-only, private.
- Blind review cards, contextual reveal states, intro-approved reveal, and interview-coordination reveal all render according to the same stage contract.
- Audit trail accessible to the user.

**Error & Empty States**

- Conflicts (e.g., artifact is private but linked in public snippet): block with guidance.
- Permission errors return “Forbidden” without leaking existence.

**Event Tracking**

- `visibility_changed` {entity, field, from, to}
- `redact_mode_toggled` {enabled}
- `preview_rendered` {mode}
- `reveal_requested` {requested_scope, source_surface, reason_code, outcome}
- `reveal_granted` {requested_scope, granted_scope, source_surface, reason_code}
- `reveal_denied` {requested_scope, granted_scope, source_surface, reason_code}

---

### F7 — Verification & Attestations (v1)

**Inputs**

- Work email verification request and verification result.
- LinkedIn verification request and resulting verification signal.
- Attestation request (artifact/L4), recipient email/name, message, due date.
- Status updates from magic-link form (approve/decline + comment).

**Processing Rules**

- Derive canonical verification tiers from current trust signals:
  - `unverified`
  - `workplace_verified`
  - `identity_verified`
- Work email verification can elevate a user to `workplace_verified`.
- LinkedIn verification can elevate a user to `workplace_verified` or `identity_verified` depending on the signal returned.
- Generate signed magic links for attestations; expiry (default 14 days).
- Store attestations and verification state; surface badges on artifacts/L4s and trust bars.
- Assignment **verification gates** displayed pre-intro.
- Government ID verification remains unavailable in the self-serve MVP UI.

**Outputs**

- Verification status panel showing current tier, source, and next actions; badges on verified items; reminder emails.
- Export verification summary in Match Detail.

**Error & Empty States**

- Expired work email or attestation link → regenerate flow.
- LinkedIn auth or review failure → show retry/review guidance.
- Declined attest → feedback shown to requester.
- Missing gate → block introduce with explanation.

**Event Tracking**

- `work_email_verification_started/completed` {result}
- `linkedin_verification_started/completed` {result_level}
- `attestation_requested` {target, recipient_role}
- `attestation_completed` {target, outcome}
- `verification_gate_failed` {gate_type}

---

## 7.2 Organization Features

### O1 — Organization Trust Profile

**Inputs**: mission, one-line why-join statement, values[] (max 3), proof highlights[] (max 3), lightweight work norms, website/location/type metadata.  
**Processing**: normalize trust context, keep work norms structured, log edits, and expose only the fields needed in profile, assignment, and match-detail surfaces.  
**Outputs**: lean org profile and trust snippets used in match review.  
**Errors/Empty**: prompt for the minimum trust set rather than spawning separate profile modules.  
**Events**: `org_trust_profile_updated` {fields_changed[]}.

---

### O2 — Assignment Publishing

**Inputs**: title, why role exists, outcomes[], must-have skills[], practical constraints, optional trust requirements, optional team/reporting context.  
**Processing**: validate the single launch publish path, compute readiness, and generate a public-facing assignment brief.  
**Outputs**: published assignment, draft, preview card, and shareable link.  
**Errors/Empty**: incomplete required fields; invalid ranges; inline fixes; no advanced workflow promise in MVP.  
**Events**: `assignment_draft_saved`, `assignment_published` {assignment_id, mode: "basic"}.

---

### O3 — Match Review and Intro Workflow

**Inputs**: assignment-linked candidate summaries, proof context, match reasons, reviewer actions, intro requests, and feedback follow-up state.  
**Processing**: enforce privacy-safe review, record shortlist/pass/intro actions, and surface pending intros and decision follow-up in one operational queue.  
**Outputs**: **Assignments and Matches** home, per-assignment review queue, intro request state, and pending feedback state.  
**Errors/Empty**: no matches yet state with next steps; pending follow-up reminders without requiring dashboard analytics.  
**Events**: `match_reviewed` {action}, `intro_requested`, `org_review_queue_viewed`.

---

### O4 — Minimal Org Access

**Inputs**: member email/name and role (`owner` or `reviewer`).  
**Processing**: send magic-link invites, enforce lean permissions, and avoid branching into enterprise admin models.  
**Outputs**: member access list and invite status.  
**Errors/Empty**: already a member; invalid email; expired invite.  
**Events**: `org_access_invited` {role}, `org_access_joined`, `org_access_role_changed` {from,to}.

---

## 7.3 Cross-Cutting Functional Requirements

**Notifications & Email**

- Introduce, attestation, and invite flows send transactional emails with magic links; all have retry and unsubscribe for non-transactional digests.

**Permissions**

- Enforce role-based access throughout (Owner/Reviewer; Individual).

**Auditability**

- User-visible edit logs for purpose, visibility changes, verification actions.

**Search & Filters (basic)**

- Individuals: filter shortlist by location/availability; Orgs: filter candidates per assignment.

**Internationalization (baseline)**

- Support base language & standard formats/timezones; full localization is out-of-scope (Part 6).

---

## 7.4 Analytics & Event Schema Notes

- Every event includes `{event_id, occurred_at, user_id?, org_id?, profile_id?, assignment_id?, properties}`.
- PII minimization: avoid free-text in properties; use IDs/enums.
- Events feed internal ops reporting for **TTFQI, TTV, TTSC, PAC, SUS**, and **fairness notes**.

---

## 7.5 Dependencies / Hand-offs

- Matching score weights & fairness checks are configured server-side and versioned.
- Optional public snippet export requires server-side PDF or document-rendering service if that export ships.
- Email/magic links require a transactional email provider.

---

**Status:** Draft v0.1 (awaiting product approval) · **Approver:** Pavlo Samoshko · **Date:** —

# Part 8 — Non‑Functional Requirements (MVP)

**Scope:** Baseline qualities the MVP will meet. These are binding for launch; exceptions require a written waiver.

## Security & Privacy

- **AuthN/AuthZ:** JWT-based auth with role- and record-level authorization. Enforce row‑level security on all user‑generated content; deny-by-default policies.
- **Data classification:** Tag data as **PII / Sensitive / Public**; log policy references per table/column.
- **PII handling:** Minimize collection; isolate PII from analytics; never store PII in logs, events, or traces; redact on ingestion.
- **Encryption:** TLS 1.2+ in transit; provider encryption at rest for DB and object storage; periodic key rotation.
- **Consent & audit:** Versioned consent records (ToS, Privacy, verification) per user/org; immutable audit logs for visibility/verification changes.
- **Privacy controls:** Field‑level visibility (public/network-only/match-only/private), profile redaction mode, opt‑out for analytics/ML.
- **Vulnerability management:** Monthly dependency scans, critical fixes within 7 days; annual 3rd‑party pen test (post‑MVP).
- **Incident response:** Pager on P1 incidents; 24h preliminary report; user notification if data is materially affected.
- **Data residency posture:** Single region for MVP; clarify in Privacy Policy; add regional storage post‑MVP if required.

## Performance

- **Page SLAs:** P95 Time-to-Interactive ≤ **2.5s** (desktop broadband), ≤ **3.5s** (mid‑tier mobile). First meaningful paint budget: 1.5s (desktop).
- **API SLAs:** P95 endpoint latency ≤ **1.5s**; P99 ≤ 3s. File upload ≤ 25MB with streaming; images ≤ 10MB.
- **Query hygiene:** Indexed filters; pagination for lists; N+1 guards in ORM; batch fetching for home snapshot cards.
- **Rate limiting:** 100 requests/min per IP (burst 200) for public APIs; introduce backoff and friendly errors.
- **Batch jobs:** Nightly ETL completes by **02:00 UTC**; weekly model export completes within 2h window.

## Reliability

- **Uptime target:** ≥ **99.5%** monthly (MVP). Public status page post‑MVP.
- **Backups:** Automated nightly DB backups; object storage durability per provider. Quarterly restore test.
- **RTO/RPO:** RTO ≤ **8h**; RPO ≤ **24h**.
- **Idempotency & retries:** Idempotent write APIs where practical; exponential backoff on transient failures.
- **Alerts:** Error‐rate spikes, job failures, latency/availability SLO breaches.

## Scalability

- **Expected MVP volumes:** ~500 users / 200 assignments / 5k events/day. Headroom ×10 via indexing and caching.
- **Scale plan:** Read replicas or caching layer post‑MVP; background workers for matching recomputations; vector search (pgvector) considered Phase 1.
- **Large files:** Enforce file type/size; virus scan; presigned uploads to keep app servers stateless.

## Accessibility

- **WCAG 2.1 AA baselines:** Semantic HTML, labels, focus order, visible focus ring, keyboard nav, ARIA only when necessary, color‑contrast ≥ 4.5:1, skip links, reduced‑motion setting, screen‑reader announcements on dynamic content.
- **Testing:** Automated a11y checks in CI; manual audits on critical flows (activation, assignment creation, match review).

## Localization

- **Languages:** English UI for MVP.
- **Internationalization:** IANA timezone capture; locale‑aware dates, numbers, and currency formatting; Unicode-safe storage; left‑to‑right baseline (RTL readiness assessed post‑MVP).

## Observability

- **Structured logging:** JSON logs with request‑id; scrub PII on emit; 30‑day retention in log store.
- **Metrics:** RED (Rate/Errors/Duration) for APIs; internal launch reporting for TTSC, TTFQI, TTV, PAC, SUS, fairness note status, and queue health.
- **Tracing:** Minimal distributed traces on critical paths (match generation, assignment publish).
- **Product analytics:** Event taxonomy aligned to Part 9; sampling allowed for high‑volume events.

---

## Facts & Decisions

- **Facts:** MVP is privacy‑first (field‑level visibility, redaction, consent logs); no diagnostic MH data; well‑being data excluded from ranking.
- **Decisions:** Adopt above SLAs/SLOs; English‑only UI; single‑region hosting for MVP; nightly ETL cadence; 99.5% uptime target; rate limiting in gateway.

# Part 9 — Data Model (High‑Level)

**Scope:** Key entities, relationships, retention, and the top event schema for analytics and future ML.

## Key Entities & Relationships

- **User** — authentication identity; 1:1 with **Profile**.
- **Profile (Individual)** — public summary and private fields; 1:1 **MatchingProfile**; 1:N **Experience**, **Education**, **Artifact** (proof), **Verification**.
- **Organization (Org)** — trust profile (mission, why-join statement, values, proof highlights, lightweight work norms); 1:N **Member** (Profile) with role; 1:N **Assignment**.
- **MatchingProfile** — constraints & preferences used by matching (availability, comp, location mode, languages, causes).
- **SkillsTaxonomy** — hierarchical L1→L4 catalog; synonyms; level rubric.
- **ProfileSkill** — join table: Profile × L4 skill with `level (0–5)`, `months_experience`, `visibility`.
- **Assignment** — role context, outcomes, must-have skills, practical constraints, optional trust requirements, and publish state.
- **Match** — materialized (Profile × Assignment) ranking record with the current score trace package: `score`, top-level component scores (`skills_fit`, `proof_fit`, `constraints_fit`, `verification_fit`, `purpose_fit`), component applicability states, `score_version`, `model_version`, `explanation_version`, `fairness_check_version`, `inputs_hash`, `reason_codes`, `rank_presentation`, `fairness_status`, canonical `lifecycle_state`, `generated_at`, stale-policy state, and reviewer override linkage.
- **MatchReasonLedger** — immutable ledger of canonical reason codes and payload snapshots for each match decision, including system, reviewer, and policy-generated entries used for explanation rendering and audits.
- **MatchReviewState** — reviewer workflow state, reveal scope, shortlist timing, and manual override posture for each match.
- **Application** — explicit candidate intent submitted through an application surface; conceptually separate from **Intro** and only materialized as a first-class object when self-serve apply ships.
- **Intro** — canonical bilateral pursuit workflow for MVP. Starts from a scored **Match** or BYOC candidate invite, owns consent/interest state, and is the parent of interview handoff.
- **Interview** — scheduled evaluation event created from an active **Intro**. Every interview must link back to one intro in MVP flows.
- **Verification** — attestation requests & results for skills/experience/artifacts (soft verify v1).
- **Message** — basic contact thread or system notifications (MVP minimal).
- **ConsentRecord** — user policy acceptances with versioning and IP/agent.
- **AuditLog** — immutable changes for purpose/visibility/verification.
- **FairnessNote** — release-scoped fairness monitoring output with thresholds used, cohorts analyzed, findings, limitations, and `published|insufficient_data` status.
- **AnalyticsEvent** — anonymized interaction event.

### ER Sketch (text)

- User 1—1 Profile
- Profile 1—1 MatchingProfile
- Profile N—N SkillsTaxonomy via ProfileSkill
- Profile 1—N Experience / Education / Artifact / Verification
- Org 1—N Assignment
- Org 1—N Member (Profile) with role
- Assignment 1—N Match
- Match 0..1—1 Intro
- Assignment 0..N Application when self-serve apply exists; Application 0..1—1 Intro
- Profile N—N Assignment via Match; active Intro uniqueness is `candidate_profile_id + assignment_id`
- Intro 1—N Interview
- Any 1—N AnalyticsEvent (with anonymized ids)

## Data Retention & Deletion

- **Profiles:** Immediate irreversible deletion request handling; related records are deleted or anonymized according to legal and technical requirements.
- **Assignments/Applications:** Retain 24 months by default; allow org‑level purge on request.
- **Artifacts:** Retain while linked to active Profile/Assignment; orphan cleanup after 90 days.
- **Messages:** Retain 36 months; subject to legal holds.
- **Analytics events:** Retain 24 months then aggregate/anonymize.
- **Backups:** Follow Part 8 policy; restores purge deleted PII as part of post‑restore job.

## Top Events & Properties

- `home_snapshot_viewed` — `{ cards[], load_ms }`
- `l4_added` — `{ l4_id, source, level }`
- `match_settings_changed` — `{ field, old, new }`
- `match_ranked` — `{ match_id, assignment_id, score_version, model_version, explanation_version, fairness_check_version, rank_presentation, fairness_status, reason_codes[] }`
- `shortlist_generated` — `{ count, min_score, rank_presentation }`
- `match_viewed` — `{ match_id, rank_presentation, fairness_status }`
- `match_explanation_viewed` — `{ match_id, explanation_version, reason_codes[], rank_presentation }`
- `match_actioned` — `{ match_id, action, reason? }`
- `review_override_applied` — `{ match_id, assignment_id, override_reason_code, previous_stage, new_stage, requested_scope }`
- `review_override_reverted` — `{ match_id, assignment_id, override_reason_code, previous_stage, new_stage, requested_scope }`
- `match_outcome_reported` — `{ match_id, support_path, suspicious_outcome }`
- `fairness_note_published` — `{ release_id, status, cohorts_analyzed, exact_rank_suppressed }`
- `applied` — `{ assignment_id, match_score }`
- `interview_scheduled` — `{ application_id, scheduled_at, duration_minutes, policy_preset }`
- `assignment_published` — `{ assignment_id, mode, required_skills_count }`
- `hired` — `{ application_id }`
- `wellbeing_checkin_submitted` — `{ trigger_type }` (private Zen partition only)
- `reflection_added` — `{ trigger_type, length_bucket }` (private Zen partition only)
- `zen_export_requested` — `{ format }` (private Zen partition only)
- `zen_export_completed` — `{ format }` (private Zen partition only)
- `zen_delete_completed` — `{ scope }` (private Zen partition only)

> **Event hygiene:** No PII in properties; use ids/enums. Nightly ETL hydrates a `ml_training_data` table with positive/negative/neutral labels from events.

---

## Facts & Decisions

- **Facts:** Matches are materialized to accelerate UX; values/causes (PAC) are first‑class in scoring but never used to penalize protected groups.
- **Decisions:** Keep ER monolithic for MVP; adopt immediate deletion handling + analytics re-keying/anonymization safeguards; expand with vector search entities post‑MVP if needed.

# Part 10 — Integrations (MVP)

**Scope:** External services, auth methods, failure handling, secrets, and environment separation.

## Authentication

- **Methods:** OAuth (Google) and magic‑link email.
- **Claims:** `sub`, `email`, `role`, optional `org_id` for org context.
- **Controls:** 5 attempts/15m throttle; magic‑link expiry; device/browser hinting.

## Email (Transactional)

- **Provider:** Transactional email (e.g., Resend). Templates for verification, attestation, invitations, intros.
- **Failures:** Retry with exponential backoff (max 3); log bounces & complaints; suppress invalid recipients.

## Analytics

- **Pipeline:** Client and server events → Postgres; optional forwarder to a product analytics tool later.
- **Schema:** Use Part 9 taxonomy; validation in CI to prevent schema drift.

## Maps & Geocoding

- **Provider:** Mapbox/Places for location autocomplete.
- **Fallback:** Free‑text city + country when provider is unavailable.

## Video Conferencing

- **Providers:** Zoom API and/or Google Meet API for interview scheduling.
- **Features:** Automatic meeting link generation, calendar invites with video link, timezone handling, and lightweight preset enforcement (`default`, `volunteer`) with preset-based duration limits.
- **Fallback:** Manual link entry if API unavailable.

## Feature Flag Control APIs

- **User flags endpoint:** `/api/feature-flags` resolves audience-aware flags for activation tiering, plain-language vocabulary, privacy summary, and launch-safe guidance experiments.
- **Rollout metrics endpoint:** `/api/admin/metrics/rollout` exposes admin-only rollout indicators (activation completion, publish completion, first-10-minute activation rates, visibility reversal rate, and endpoint health for matching/publish APIs).

## Storage

- **Provider:** S3‑compatible object storage for avatars/covers/artifacts; presigned upload; antivirus scan.

## Observability

- **Provider:** Sentry (FE/BE) for error tracking; alerts on error spikes and job failures.

## Payments

- **Status:** Out of scope for MVP (see Part 6).

## Secrets & Rotation

- **Storage:** Environment variables; separate keys per environment; least‑privilege service accounts.
- **Rotation:** Quarterly rotation; immediate rotation on incident.

## Environments

- **Dev:** Local + dev cloud project; seeded with synthetic data only.
- **Preview:** Per‑PR preview deployments; sandbox API keys.
- **Prod:** Restricted maintainers; audit trail on config changes.

---

## Facts & Decisions

- **Facts:** No payments/contracting integrations in MVP; transactional email and map autocomplete are required; error tracking is mandatory.
- **Decisions:** Define explicit fallbacks for 3rd‑party outages; keep secrets in env vars with rotation; keep dev/preview/prod fully isolated.

# Part 11 — Dependencies & Constraints

**Scope:** Technology, compliance, organizational, and third‑party constraints.

## Technical Constraints

- **Stack:** Next.js/React/TypeScript; Postgres + Auth + Object Storage; ORM (Drizzle); Tailwind + Radix; Vercel; transactional email.
- **Search:** Postgres full‑text for MVP; vector search (pgvector) optional post‑MVP.
- **Realtime:** Polling is acceptable for MVP; realtime channels optional later.
- **Performance levers:** Caching and read replicas post‑MVP if needed; batch recomputation for matching.

## Compliance & Data Handling

- **Regimes:** GDPR/CCPA principles—consent, access, deletion, opt‑out of analytics/ML, data minimization.
- **Retention:** See Part 9; process verified deletion requests immediately, with legal exceptions documented by policy.
- **Cookies:** Use strictly necessary cookies by default; analytics cookies behind consent.

## Team & Timeline Constraints

- **Resourcing:** Lean team; prioritize features that directly lift TTFQI/TTSC; defer non‑critical requests.
- **Ops windows:** Nightly ETL & weekly model export windows; avoid deploys during ETL.

## Third‑Party Limits & Risks

- **Quotas/outages:** Email provider rate limits; map API quotas; object storage egress costs.
- **Video conferencing APIs:** Zoom/Google Meet rate limits; account requirements; OAuth setup; preset-based meeting durations (30 min default, volunteer fallback where needed) and manual-link fallback when provider limits apply.
- **Vendor lock‑in:** Keep portable SQL and storage paths; document exit plans (e.g., Postgres dump, S3 export).
- **Security posture:** Monitor for dependency CVEs; maintain an allowlist for uploads.

---

## Facts & Decisions

- **Facts:** MVP deliberately excludes payments, mandatory government-ID verification in the self-serve UI, deep ATS/HRIS; single‑region hosting.
- **Decisions:** Implement rate limiting and basic moderation for MVP; treat vector search/caching/SSO as post‑MVP; revisit compliance posture before GA.

# Part 12 — Acceptance Criteria (MVP “Done”)

> **Intent:** Objective, testable checks to declare the MVP “ship-ready.” All items below must pass.

---

## 12.1 Functional Acceptance (mapped to Part 5 features)

### Individuals

**F1 Purpose Block**

- [ ] Create/edit **mission, vision, values (≤5), causes (≤5)** with field-level visibility.
- [ ] Purpose signals appear in **Match Detail** with **PAC** shown when applicable.
- [ ] Audit log records purpose edits (who/when/what).

**F2 Calm Home Snapshot**

- [ ] Home shows fixed status cards for Matches, Applications/Intros, Skills and Proof, Privacy, and Next Best Action.
- [ ] “Next Best Action” suggests at least one actionable step when TTFQI=∅.

**F3 Expertise Atlas**

- [ ] The trust ladder is explicit: **Discoverable**, **Match-visible**, **Intro-eligible**, **Strongly trusted**.
- [ ] Matching remains explorable before intro eligibility, with no hard lock screen and a non-blocking readiness checklist.
- [ ] Org-visible matching starts at **Match-visible**, not merely at portfolio publication.
- [ ] Qualified introductions require deeper proof than browse visibility and never unlock from weak profiles too early.
- [ ] CV paste → receive suggestions with “why it mapped”; accept/edit-in-place.
- [ ] Profile reaches **Activation** when minimum threshold met (configurable).

**F4 Matching Hub**

- [ ] Ranked shortlist with composite score and **Why this match** explainer.
- [ ] Quick actions: **Introduce / Pass / Snooze**; near-threshold hints shown.
- [ ] Browse and match-review payloads include `trustLevel` and structured `introEligibility` when the user is not yet intro-eligible.
- [ ] Intro actions return `409 INTRO_QUALIFICATION_NOT_MET` with reason codes, missing requirements, and next actions when profile-level or assignment-level qualification fails.
- [ ] **Fairness note** generated per release when opt-in demographics exist.

**F5 Zen Hub**

- [ ] Opt-in check-ins (1–5) + reflections; privacy banner shown on first use.
- [ ] Zen data is visible only to the user, excluded from ranking/org analytics/public rendering, and supports JSON export plus permanent delete.

**F6 Visibility & Boundary Controls**

- [ ] Field-level visibility works end-to-end (public/network-only/match-only/private).
- [ ] **Redact** mode hides name/photo in previews and cards.
- [ ] “What others can see” summary panel groups fields into 4 buckets with preview-as links.

**F7 Verification & Attestations (v1)**

- [ ] Users can complete **work email** and **LinkedIn** verification, and the product shows canonical tiers `unverified`, `workplace_verified`, and `identity_verified`.
- [ ] Request attestation via magic link; status visible; reminders send.
- [ ] Assignment gates are displayed pre-intro; unmet gates block “Introduce.”
- [ ] Government ID verification is not shown as a self-serve option in the current MVP UI.

**F8 Gap Analysis & Next-Best Skills**

- [ ] Gap view surfaces must/nice L4 gaps per focus or matched assignments with “why this matters.”
- [ ] Suggested L4/proof can be accepted/edited inline; activation progress updates when applied.
- [ ] Next-best action generated while gaps remain; progress tracked via gap count/time-to-activation.

**F9 Post-Interview Feedback Loop (Individual)**

- [ ] Individual sees decision + personalized feedback within 48h SLA; status shows pending/received.
- [ ] Feedback stored with assignment/interview and notified to the user.
- [ ] Historical feedback accessible from the home snapshot or matching without exposing private notes to orgs.

### Organizations

**O1 Organization Trust Profile** — Mission, why-join statement, values, proof highlights, and lightweight work norms are enough to make matching credible.
**O2 Assignment Publishing** — One basic assignment flow handles outcomes, must-have skills, practical constraints, optional trust requirements, and publish.
**O3 Match Review and Intro Workflow** — Review privacy-safe matches, shortlist/pass, request intros, and track pending intros and feedback follow-up from an operational queue.
**O4 Minimal Org Access** — The org side works with one owner; optional reviewer access is the only extra collaboration layer promised in MVP.

---

## 12.2 Non-Functional Acceptance (Part 8 baselines)

- [ ] **Performance:** API **P95 ≤ 1.5s**; page TTI **P95 ≤ 2.5s** desktop / **≤ 3.5s** mobile on reference devices.
- [ ] **Reliability:** **RTO ≤ 8h**, **RPO ≤ 24h** documented; quarterly restore test completed.
- [ ] **Security & Privacy:** RLS policies audited; consent logs in place; PII not present in logs/events.
- [ ] **Accessibility:** Critical flows pass WCAG 2.1 AA checks; manual keyboard audit completed.
- [ ] **Localization:** Timezone & locale formatting verified; English UI confirmed.
- [ ] **Observability:** Error tracking, latency reporting, and event pipeline active.

---

## 12.3 Data Quality & Analytics Readiness (Parts 9–10)

- [ ] Event schema validated in CI; no PII in event properties.
- [ ] Internal ops reporting shows **TTSC**, **TTFQI**, **TTV**, **PAC**, **SUS**, fairness note status, and funnel conversion (view→intro→interview→hire).
- [ ] Nightly ETL → analytics DB successful; **ml_training_data** table populated with labels.

---

## 12.4 Smoke Test Playbook (must pass end-to-end)

1. **Individual activation:** Sign up → Purpose → Atlas → become Discoverable → unlock Match-visible → qualify for Intro-eligible when proof depth and trust are strong enough.
2. **Org assignment:** Create org → Trust Profile → Assignment → Publish → Review queue appears.
3. **Introduce:** From shortlist → Introduce → Message thread opens (basic) → Mark as interview scheduled.
4. **Verification:** Complete work email or LinkedIn verification and optionally request attestation → resulting tier/badge visible.
5. **Zen Hub:** Opt-in → Add check-in → Save milestone-linked reflection → Export JSON or permanently delete Zen data.
6. **Privacy:** Toggle field visibility & Redact mode → Previews reflect settings.

---

## 12.5 Sign-offs

- **Product:** feature scope & UX (Parts 3–5)
- **Engineering:** NFRs, reliability, security & data (Parts 8–9)
- **Design/Accessibility:** WCAG checks, design parity
- **Data/Analytics:** event schemas, internal ops reporting
- **Owner (Go/No‑Go):** Pavlo Samoshko

**Status:** Draft v0.1 · **Date:** —

# Part 13 — Risks & Assumptions

> Top risks with owners & mitigations; key assumptions to validate; rollback plan.

## 13.1 Top Risks

| #   | Risk                                                    | Likelihood | Impact | Owner         | Mitigation                                                                                |
| --- | ------------------------------------------------------- | ---------- | ------ | ------------- | ----------------------------------------------------------------------------------------- |
| R1  | Matching fails to deliver TTFQI ≤ 72h for first cohorts | M          | H      | Eng/Data      | Tighten defaults; seed high-intent Assignments; add “near-threshold” hints; monitor daily |
| R2  | Purpose/values misuse or perceived bias                 | M          | H      | Product/Legal | Clear privacy copy; never penalize on values; cohort fairness note; user controls         |
| R3  | Low verification completion                             | M          | M      | Product       | “Soft verify” first; reminders; scoped attestation UX; show lift where present            |
| R4  | Atlas taxonomy overwhelms users                         | M          | M      | Design        | Guided starters; auto-suggest with “why it mapped”; reduce friction to activation         |
| R5  | Email deliverability issues                             | M          | M      | Eng           | Monitor bounces; SPF/DKIM/DMARC; fallback provider                                        |
| R6  | Data leakage via mis-configured visibility              | L          | H      | Sec/Eng       | Deny-by-default RLS; privacy previews; audits in CI                                       |
| R7  | Vendor outage (auth, email, maps)                       | M          | M      | Eng           | Fallbacks (magic-link resend, free-text city); circuit breakers                           |
| R8  | Performance regressions under load                      | M          | M      | Eng           | Budgets in CI; tracing hot paths; index review; caching plan                              |
| R9  | Legal/compliance change (privacy)                       | L          | M      | Product/Legal | Versioned consent; opt-out for analytics/ML; data map                                     |
| R10 | Scope creep pre-launch                                  | M          | H      | Product       | Part 6 guardrails; change-control with impact estimate                                    |

## 13.2 Assumptions to Validate

- A1: **Shortlists with PAC** increase intro acceptance and contract rates (measure lift vs baseline).
- A2: Students/switchers can **activate** (reach matchable profile) in ≤20 minutes median.
- A3: Organizations can **publish** Assignments in ≤15 minutes median.
- A4: An optional private Zen surface does **not** reduce activation or create privacy confusion when the boundary copy is explicit.
- A5: Current auth mix (email/password plus Google and LinkedIn OAuth) is sufficient for early cohorts.

**Validation windows:** First 4–6 weeks post-launch; report weekly.

## 13.3 Kill-Switch & Rollback

- **Feature flags** guard: `FF_ACTIVATION_TIERING`, `FF_ASSIGNMENT_GUIDANCE`, `FF_UI_VOCAB_PLAIN`, `FF_PRIVACY_SUMMARY` (plus existing platform flags for legacy flows).
- **Operational rollback:** Vercel instant rollback to last green deploy; DB migration strategy uses reversible migrations.
- **Comms:** If user-impacting issue occurs, post status, email affected users (template ready).

**Status:** Draft v0.1 · **Date:** —

# Part 14 — Launch Plan

> Environments, deployment, observability, analytics, support, and post‑launch checkpoints.

## 14.1 Environments & Gating

- **Dev (local):** Full stack with seed data; feature flags default **on** unless explicitly disabled via env or DB targeting.
- **Preview (Vercel):** Per‑PR deployments; synthetic data; flags set per branch/audience; **QA sign‑off** required.
- **Prod (Vercel):** Final deployment target; staged rollout by percentage and audience with force-override support for incident response.

**Go/No‑Go Gates (must be green):**

- Part 12 acceptance suite (functional + NFR) passes.
- Security/privacy checks complete (RLS audit; consent logs).
- Internal ops reporting live for TTSC, TTFQI, TTV, PAC, SUS, fairness note status, rollout health, and queue health.
- Run smoke tests from 12.4 on Preview then on Prod after deploy.

**Release strategy:** Trunk-based with feature flags and deterministic percentage rollout; sequence is internal-only → 10% → 50% → 100%; instant rollback available in Vercel.

## 14.2 Deployment

- CI builds & tests on PR → Preview deploy on Vercel.
- Merge to main → Production deploy on Vercel.
- Reversible migrations run via migration tool; **post-deploy** job warms indexes & caches.
- Only after all flows & interactions test **green** do we declare launch-ready.

## 14.3 Observability

- **Dashboards (Ops):** API RED (rate/errors/duration), page TTI P95, job success, error rate by release, DB health.
- **User-facing surfaces:** Individuals get a calm home snapshot; orgs get a simple **Assignments and Matches** operational queue. Neither surface becomes a BI-style dashboard product in MVP.
- **Internal-only rollout reporting:** Admin metrics endpoint tracks activation completion, assignment publish completion, first-10-minute activation rates, privacy visibility reversal rate, and p95/sla-breach rates for `/api/core/matching/profile` and `/api/assignments/[id]/publish`.
- **Alerts:** 5xx spike, latency P95 breach, failed ETL, error rate by route, email bounce spike.
- **Tracing:** Critical paths (assignment publish, shortlist generation) traced end-to-end.
- **Log hygiene:** JSON logs with request-id; PII scrubbing.

## 14.4 Analytics Plan

### Executive recommendation

- Keep launch analytics narrow and operational. Measure whether users and lean orgs can activate, publish, review, and reach qualified intros without turning product surfaces into analytics products.
- Keep the canonical KPI definitions in Part 2. Internal reporting should center **TTSC**, **TTFQI**, **TTV**, **PAC**, **SUS**, and the release-scoped **fairness note**.
- Keep user-facing surfaces calm: no vanity counters, no public view counts, no leaderboard behavior, and no deep org analytics in MVP.

### Canonical KPI set

- Canonical KPI definitions live in Part 2 and are the source of truth for:
  - **TTSC**
  - **TTFQI**
  - **TTV**
  - **PAC**
  - **SUS**
  - **Fairness note status**

### Revised event taxonomy

- **Shared property contract**
  - Required IDs only when needed: `proof_pack_id`, `assignment_id`, `match_id`, `intro_id`, `interview_id`, `portfolio_id`
  - Actor metadata only as role or class, never raw identity in analytics payloads
  - Common dimensions: `persona_type`, `org_type`, `role_family`, `seniority_band`, `region_band`, `trust_level`, `override_reason_code`, `source_surface`
  - Operational flags: `privacy_tier`, `is_test_event`
- **Activation and trust context**
  - `purpose_created`
  - `purpose_updated`
  - `l4_added`
  - `proof_uploaded`
  - `attestation_requested`
  - `attestation_completed`
- **Reveal lifecycle**
  - `reveal_stage_viewed`
  - `reveal_stage_advanced`
  - `reveal_requested`
  - `reveal_granted`
  - `reveal_denied`
- **Intro lifecycle**
  - `intro_created`
  - `intro_accepted`
  - `intro_declined`
  - `intro_expired`
  - `intro_withdrawn`
- **Interview reliability**
  - `interview_scheduled`
  - `interview_rescheduled`
  - `interview_no_show_marked`
  - `interview_feedback_breach_flagged`
- **Match governance**
  - `review_override_applied`
  - `review_override_reverted`
- **Lean org workflow**
  - `org_trust_profile_updated`
  - `assignment_draft_saved`
  - `assignment_published`
  - `org_review_queue_viewed`
  - `intro_requested`
- **Zen private partition**
  - Zen Hub emits only private-partition events: `wellbeing_opt_in_changed`, `wellbeing_checkin_submitted`, `reflection_added`, `zen_export_requested`, `zen_export_completed`, and `zen_delete_completed`
- **Events explicitly excluded from analytics payloads**
  - No raw message text
  - No feedback text
  - No freeform reflection text
  - No direct public viewer identity
  - No precise location
  - No protected attributes in event properties

### User-facing vs internal analytics split

- **User-facing**
  - Individuals see a calm home snapshot with personal status only.
  - Orgs see a simple operational queue for assignments, matches, intros, and feedback follow-up.
  - No user-facing surface exposes leaderboard mechanics, streaks, public counters, or BI-style analytics.
- **Internal-only**
  - TTSC, TTFQI, TTV, PAC, SUS, fairness note status, rollout health, and queue health.
  - Privacy-safe funnel conversion and SLA compliance summaries.
  - Fairness segment slices only when minimum privacy thresholds pass.

### Acceptance criteria

- Both PRDs use the same canonical KPI names, formulas, and visibility rules.
- Every KPI definition includes exact meaning, numerator, denominator, unit, cohorting dimensions, where it appears, who can see it, exposure level, and privacy boundaries.
- All required event names are present in the canonical event taxonomy grouped by lifecycle.
- **TTSC**, **TTFQI**, **TTV**, **PAC**, **SUS**, and fairness note status are the only launch KPIs promised across documents.
- Owner-facing public-view counters and gamified streak mechanics are removed or explicitly demoted as non-goals.

### Privacy and data minimization rules

- No PII in analytics properties or internal reporting cards.
- Opt-out and consent controls are honored for non-essential telemetry.
- Zen Hub data stays partitioned and excluded from ranking, reveal, and public analytics.
- Public-view data is retained only as coarse internal diagnostics or anti-abuse signals and is never surfaced as owner-facing success metrics.
- Fairness analytics require minimum sample thresholds before any cohort slice becomes visible internally.

### Edge cases

- Zero-denominator KPIs resolve to `insufficient_data`, never `0%`.
- Repeated verification attempts are counted once for first-success Time-to-Verified and separately in lifecycle-conversion stage counts.
- Stale-to-fresh recovery must preserve the stale event in history while allowing a proof to re-enter fresh coverage.
- Withdrawn proofs and intros stop contributing positive trust lift immediately but remain auditable.
- Override reversals preserve the original override event and the reversal event for drift analysis.
- Indexing blocked by safety or depublishing keeps owner-visible status language but never exposes blocked reasons publicly.
- Expired intros, rescheduled interviews, and no-show after reschedule remain separate events so reliability metrics are not collapsed into one failure bucket.

## 14.5 Support & Incident Response

- **User support:** **hello@proofound.io** (primary).
- **Operational:** On-call pager for P1; publish post‑mortems for user‑impacting incidents.

## 14.6 Post‑Launch Checkpoints (user milestones)

- **100 users:** Validate activation completion, assignment publish speed, and first qualified intro signals; fix launch-blocking trust and verification gaps.
- **1,000 users:** Validate TTSC, TTFQI, TTV, PAC, SUS, fairness note cadence, and queue health in at least one cohort; review privacy thresholds.
- **10,000 users:** Load/latency review; enable caching/read replica if needed; consider pgvector pilot; review compliance needs.

**Status:** Draft v0.1 · **Owner:** Pavlo Samoshko · **Date:** —

# Addendum — MVP Clarifications & Acceptance Checks

## A1 Baselines & Targets for TTSC/TTFQI/TTV

- Acceptance checks:
  - Onboarding captures self-reported prior TTSC/TTFQI/TTV during the first two weeks; stored with cohort tags (persona, role family, region).
  - Baseline vs target appears in internal ops reporting by end of week two; method documented for reproducibility.
  - Events support cohort-level median + P75 for TTSC/TTFQI/TTV.

## A2 Fairness Note (Opt-in Cohorts)

- Acceptance checks:
  - Run the fairness note only when an opt-in cohort has ≥20 candidates and ≥5 decisions per cohort; otherwise show “insufficient data.”
  - Compare intro and offer/contract rates; flag when any absolute gap ≥10 percentage points across cohorts; include cohort definitions in the note.
  - No PII in the note; generated each release from event data and linked in release notes.

## A3 Visibility & Privacy Guardrails

- Acceptance checks:
  - Public portfolio is shareable by direct link by default; search indexing is off unless explicitly enabled.
  - Public route becomes unavailable when minimum safe content is not met or when safety/indexing constraints require depublishing.
  - Public portfolio indexing status is explicit: `disabled`, `eligible_not_enabled`, `enabled`, `blocked_by_safety`, or `depublished`.
  - Public-view events may exist for internal diagnostics or anti-abuse review, but owner-facing surfaces show share readiness and indexing state rather than raw view counters.
  - Public visibility defaults remain launch-safe: header/proof bar on, identity/LinkedIn trust signals allowed when present, work email off, contact off, skills off, bio off.
  - Pre-publish check blocks sharing if private artifacts/fields are referenced in public/network-only surfaces; shows inline fixes.
  - “What others can see” summary panel is always available and grouped into public/network-only/match-only/private buckets.
  - Matching and shortlist review remain blind-by-default even when the candidate has a published public portfolio.
  - Org reviewers cannot reveal identity or direct contact without the defined trigger and candidate consent path.
  - Hidden identity-bearing fields do not expose copy/open actions and do not surface direct portfolio routes before the allowed reveal stage.
  - Uploaded artifacts remain private by default, filenames are sanitized, and identifying metadata that cannot be safely stripped keeps the artifact withheld until a later reveal stage with consent.
  - Zen Hub data stored in a separate partition and excluded from ranking, org analytics, fairness workflows, and public rendering; only coarse private-partition action events are allowed, and the privacy banner explicitly states this.

## A4 Resilience & Third-Party Fallbacks

- Acceptance checks:
  - Interview scheduling allows manual video link entry if Zoom/Meet APIs fail and surfaces a fallback banner.
  - Location autocomplete falls back to free-text city + country while still allowing assignment/profile publish.
  - Transactional email retries up to three attempts with backoff; bounces logged and visible in internal ops reporting.

## A5 SLA Instrumentation (7-day Interview, 48h Feedback)

- Acceptance checks:
  - Emit SLA events (`interview_window_started`, `interview_scheduled`, `feedback_due`, `feedback_sent`) with timestamps; internal ops reporting shows compliance per assignment.
  - Alerts fire at 80% of the window and on breach for interviews and feedback (in-app + email to owners).
  - SLA status visible to org reviewers and candidates; breach reasons recorded.
  - SLA policy supports recommended presets (`default`, `volunteer`) without introducing enterprise-specific or advanced policy mode.

## A6 Matching Transparency & Governance

- Acceptance checks:
  - Show rank bands (`Top 5/10/20`) by default. Exact rank is available only for tightly scoped org-review surfaces when pool ≥30, fairness status is not elevated, and the product labels the active presentation mode.
  - If fairness suppression is active, exact rank never appears and explanation copy uses a fairness-safe reason section rather than hidden thresholds.
  - Every visible explanation is generated from canonical reason codes and rendered as plain-language `reasonSummary` plus grouped `reasonSections`.
  - Exact scores remain internal by default. User-facing views use bands or qualitative fit states, and suppression falls back to `hidden` rather than leaking raw thresholds.
  - Near-threshold hints are action-oriented and non-numeric, and the no-good-match state always shows `No strong matches yet` plus exactly 3 recovery actions.
  - Manual overrides never overwrite the original score trace and must be reviewable by actor, reason code, previous state, new state, scope, and timestamp.
  - Fairness notes must resolve to either `published` or `insufficient_data`, include sample thresholds and limitations, and avoid causal or certification language.

## A7 Activation Thresholds

- Acceptance checks:
  - Individual profile supports an explicit **trust ladder**:
    - **Discoverable:** public basics, one target role or focus area, one recent L4 skill, one acceptable proof linked to that skill, and one practical preference.
    - **Match-visible:** discoverable plus three recent L4 skills, two acceptable proofs across two distinct skills, desired roles, work mode, country or city, and basic availability.
    - **Intro-eligible:** match-visible plus five recent L4 skills, four proof-linked L4 skills, three role-relevant proof-linked L4 skills, at least one trusted or attested proof-backed skill, fresh qualifying proof, and complete intro preferences.
    - **Strongly trusted:** intro-eligible plus eight recent L4 skills, five proof-linked L4 skills across multiple contexts, and at least two active trust anchors.
  - Matching APIs are soft-gated for authenticated users:
    - `POST /api/core/matching/profile` and `POST /api/core/matching/near-matches` return `200` with `eligibility`, `trustLevel`, `introEligibility`, and `topActions` when the profile is not yet match-visible or intro-eligible.
    - `meta.softGated=true` indicates unmet visibility requirements without blocking platform use.
    - Private browse can remain active before org-visible matching.
  - Introduction actions enforce a separate qualified-introduction gate:
    - Profile-level gate requires four proof-linked L4 skills, three role-relevant proof-linked L4 skills, one trusted or attested proof-backed skill, fresh proof, and complete intro preferences.
    - Assignment-level gate requires at least two qualifying proof-linked L4 skills that map to assignment must-have skills when the assignment is sufficiently mapped, with a role-relevance fallback for sparse assignments.
    - Failed intro actions return `409 INTRO_QUALIFICATION_NOT_MET` and do not block browsing.
  - `GET /api/core/matching/matching-profile` auto-bootstraps a baseline matching profile row when missing.
  - Assignment publish readiness stays on one basic path: role, business value, ≥1 measurable outcome, practical constraints, and ≥3 must-have skills.
  - Home surfaces show current trust level, intro status, and next-best action when unmet.

## A8 Plain-Language Vocabulary Policy

- Acceptance checks:
  - User-facing copy defaults to plain terms (for example, “skills depth,” “purpose fit,” “time to first good match”) instead of internal metric codes.
  - Internal event and analytics schema names remain unchanged for continuity.
  - Advanced explanation tooltips may disclose canonical terms when explicitly requested by the user.

## A9 Matching Preview, Compensation, and Empty-State Actions

- Acceptance checks:
  - Matching setup always shows sample previews using real near-matches when available, otherwise clearly labeled mock samples.
  - Compensation is shown as overlap-only by default in matching cards and visible-fields APIs unless explicit exact-range visibility is granted.
  - Matching cards and shortlist surfaces do not surface public portfolio links, direct social links, or other identity-bearing URLs in blind stages.
  - Manually uploaded artifacts with identifying metadata render as sanitized, withheld, or requires-review until the reveal stage and consent policy permit display.
  - Empty states across Atlas, Matching, Assignment, and Privacy provide exactly three deep-linked remediation actions.

## A10 Data Export/Import Safety

- Acceptance checks:
  - Exports include schema version `3.0.0`; imports support merge/replace modes, require consent acknowledgment, and block on schema mismatch or invalid fields.
  - Legacy-compatible exports are normalized into the current portability contract when possible; failed validation applies no changes; validation and import logs are stored for audit.

## A11 Feature-Flag Rollout and Monitoring

- Acceptance checks:
  - Feature keys are stable and environment-configurable: `FF_ACTIVATION_TIERING`, `FF_ASSIGNMENT_GUIDANCE`, `FF_UI_VOCAB_PLAIN`, `FF_PRIVACY_SUMMARY`.
  - Rollout follows internal-only → 10% → 50% → 100% with deterministic audience/percentage targeting.
  - `/api/feature-flags` returns user-scoped flag states for authenticated sessions.
  - `/api/admin/metrics/rollout` returns activation/publish/privacy indicators and endpoint-health metrics used in launch decisions.

## A12 Residual Lifecycle Appendix

- **Profile lifecycle**
  - Canonical states: `draft -> active_private -> active_matchable -> restricted -> deleted`
  - Initial state: `draft`
  - Terminal states: `deleted`
  - Timeout behavior: none by default; consent expiry or policy restriction must persist `restricted`
  - Required timestamps: `created_at`, `activated_at`, `matchable_at`, `restricted_at`, `deleted_at`
  - Required audit events: `profile_created`, `profile_activated`, `profile_matchable_enabled`, `profile_restricted`, `profile_deleted`

- **Proof pack lifecycle**
  - Canonical states: `draft -> ready -> published -> submitted -> withdrawn|superseded|archived`
  - Initial state: `draft`
  - Terminal states: `withdrawn`, `superseded`, `archived`
  - Timeout behavior: freshness decay is modeled separately from publication state; withdrawn or superseded packs stop contributing positive trust lift immediately but remain auditable and exportable to the owner
  - Required timestamps: `created_at`, `ready_at`, `published_at`, `submitted_at`, `withdrawn_at`, `superseded_at`, `archived_at`
  - Required audit events: `proof_pack_created`, `proof_pack_published`, `proof_pack_withdrawn`

- **Proof freshness lifecycle**
  - Canonical states: `fresh -> review_soon -> stale -> refreshed|expired`
  - Initial state: `fresh`
  - Terminal states: `expired`
  - Timeout behavior: stale status persists until a qualifying refresh or explicit expiry; stale-to-fresh recovery must preserve the stale event in history
  - Required timestamps: `fresh_at`, `review_soon_at`, `stale_at`, `refreshed_at`, `expired_at`
  - Required audit events: `proof_freshness_state_changed`, `proof_marked_stale`

- **Proof verification lifecycle**
  - Canonical states: `requested -> opened -> completed|expired|downgraded|withdrawn`
  - Initial state: `requested`
  - Terminal states: `completed`, `expired`, `downgraded`, `withdrawn`
  - Contract: verification lifecycle describes the resulting proof-trust outcome and is distinct from the invite envelope used to request verifier action
  - Required timestamps: `requested_at`, `opened_at`, `completed_at`, `expires_at`, `expired_at`, `downgraded_at`, `withdrawn_at`
  - Required audit events: `proof_verification_requested`, `proof_verification_completed`, `proof_verification_expired`, `proof_verification_downgraded`

- **Match and reveal lifecycle**
  - Canonical states: `generated -> shortlisted -> passed -> intro_in_progress -> interview_in_progress -> closed`
  - Side states: `stale`, `hidden_due_to_policy`
  - Reveal stages: `stage0_anonymous -> stage1_capability_and_proof -> stage2_contextual_reveal -> stage3_intro_approved -> stage4_interview_coordination`
  - Initial state: `generated`
  - Terminal states: `closed`
  - Timeout behavior: stale-match reconciliation persists `stale`; fairness or policy suppression persists `hidden_due_to_policy`; intro expiry may return a match to `shortlisted`
  - Required timestamps: `generated_at`, `shortlisted_at`, `passed_at`, `intro_started_at`, `interview_started_at`, `stale_at`, `hidden_due_to_policy_at`, `closed_at`
  - Required audit events: `match_generated`, `match_shortlisted`, `match_passed`, `match_intro_started`, `match_interview_started`, `match_marked_stale`, `match_hidden_due_to_policy`, `match_closed`, `reveal_stage_viewed`, `reveal_stage_advanced`, `reveal_requested`, `reveal_granted`, `reveal_denied`, `review_override_applied`, `review_override_reverted`

- **Intro lifecycle**
  - Canonical states: `created -> accepted|declined|expired|withdrawn -> closed`
  - Initial state: `created`
  - Terminal states: `declined`, `expired`, `withdrawn`, `closed`
  - Timeout behavior: expired intros remain auditable and may return the related match to shortlist review; withdrawn intros preserve consent history
  - Required timestamps: `created_at`, `accepted_at`, `declined_at`, `expires_at`, `expired_at`, `withdrawn_at`, `closed_at`
  - Required audit events: `intro_created`, `intro_accepted`, `intro_declined`, `intro_expired`, `intro_withdrawn`

- **Interview reliability lifecycle**
  - Canonical states: `scheduled -> rescheduled|completed|no_show|cancelled`
  - Initial state: `scheduled`
  - Terminal states: `completed`, `no_show`, `cancelled`
  - Timeout behavior: repeated reschedules remain distinct events; no-show after reschedule is logged independently rather than collapsed into a single failure state
  - Required timestamps: `scheduled_at`, `rescheduled_at`, `completed_at`, `no_show_at`, `cancelled_at`, `feedback_breach_at`
  - Required audit events: `interview_scheduled`, `interview_rescheduled`, `interview_no_show_marked`, `interview_feedback_breach_flagged`

- **Verification invite lifecycle**
  - Canonical states: `pending -> opened -> accepted|declined|expired|revoked|cancelled`
  - Initial state: `pending`
  - Terminal states: `accepted`, `declined`, `expired`, `revoked`, `cancelled`
  - Contract: invite lifecycle is the request envelope and is distinct from the resulting proof verification outcome
  - Required timestamps: `created_at`, `opened_at`, `responded_at`, `expires_at`, `expired_at`, `revoked_at`, `cancelled_at`
  - Required audit events: `verification_invite_created`, `verification_invite_opened`, `verification_invite_accepted`, `verification_invite_declined`, `verification_invite_expired`, `verification_invite_revoked`, `verification_invite_resent`

- **Public portfolio distribution lifecycle**
  - Canonical states: `disabled -> eligible_not_enabled -> enabled -> blocked_by_safety|depublished`
  - Initial state: `disabled`
  - Terminal states: `blocked_by_safety`, `depublished`
  - Timeout behavior: public-view events are retained only as internal diagnostics or anti-abuse signals and never become owner-facing success counters
  - Required timestamps: `disabled_at`, `eligible_at`, `enabled_at`, `blocked_at`, `depublished_at`, `shared_at`, `public_viewed_at`
  - Required audit events: `portfolio_indexing_enabled`, `portfolio_indexing_disabled`, `portfolio_shared`, `portfolio_public_viewed`

- **Org invite lifecycle**
  - Canonical states: `pending -> accepted|expired|revoked`
  - Initial state: `pending`
  - Terminal states: `accepted`, `expired`, `revoked`
  - Timeout behavior: expired invites remain queryable and auditable; accepted invites are retained instead of being deleted
  - Required timestamps: `created_at`, `last_sent_at`, `accepted_at`, `expires_at`, `expired_at`, `revoked_at`
  - Required audit events: `org_invite_sent`, `org_invite_resent`, `org_invite_accepted`, `org_invite_expired`, `org_invite_revoked`

- **Export lifecycle**
  - Canonical states: `requested -> preparing -> ready -> downloaded|expired|failed|cancelled`
  - Initial state: `requested`
  - Terminal states: `downloaded`, `expired`, `failed`, `cancelled`
  - Timeout behavior: ready exports receive a fixed TTL; open exports are blocked when account deletion is in flight
  - Required timestamps: `requested_at`, `ready_at`, `downloaded_at`, `expires_at`, `failed_at`, `cancelled_at`
  - Required audit events: `export_requested`, `export_ready`, `export_downloaded`, `export_expired`, `export_failed`, `export_cancelled`

- **Import lifecycle**
  - Canonical states: `uploaded -> validating -> awaiting_confirmation -> applying -> completed|rejected|expired|failed|cancelled`
  - Initial state: `uploaded`
  - Terminal states: `completed`, `rejected`, `expired`, `failed`, `cancelled`
  - Timeout behavior: staged imports expire if they are not confirmed within the retention window; failed validation applies no writes
  - Required timestamps: `uploaded_at`, `validated_at`, `confirmed_at`, `applied_at`, `completed_at`, `expired_at`, `failed_at`, `cancelled_at`
  - Required audit events: `import_uploaded`, `import_validated`, `import_confirmed`, `import_applied`, `import_completed`, `import_rejected`, `import_expired`, `import_failed`

- **Deletion lifecycle**
  - Canonical states: `requested -> blocked_legal_hold|processing -> deleted|failed_requires_manual_review`
  - Initial state: `requested`
  - Terminal states: `deleted`, `failed_requires_manual_review`
  - Timeout behavior: no grace-period state in MVP; long-running deletion processing raises operational alerts instead of silently lingering
  - Required timestamps: `requested_at`, `processing_started_at`, `blocked_at`, `deleted_at`, `failed_at`
  - Required audit events: `deletion_requested`, `deletion_blocked`, `deletion_processing_started`, `deletion_completed`, `deletion_failed`

- **Application vs Intro contract**
  - `Application` and `Intro` are separate concepts.
  - `Match` is a scored eligibility record.
  - `Intro` is the canonical bilateral workflow that begins when a match or candidate invite is actively pursued.
  - `Interview` is a scheduled event created from an active intro and must always link back to that intro.
  - A matching-driven intro may exist without an application.
  - An application may create at most one intro for the same `candidate_profile_id + assignment_id`.
  - MVP recommendation: keep `Intro` as the persisted pipeline object until self-serve apply launches.
  - Duplicate rule: at most one active intro per `candidate_profile_id + assignment_id`.
  - Reopen rule: `withdrawn` intros may reopen; `expired`, `duplicate_candidate`, and `closed` remain terminal.
  - Ownership: candidate controls application withdrawal and intro consent; organization controls shortlist, interview, and decision transitions; system owns expiry and stale reconciliation.

**Status:** Draft v0.1 · **Date:** —
