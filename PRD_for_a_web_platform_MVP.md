# Addendum — Public Portfolio Brief (v0.1)

Objective: Make day-1 value tangible for both personas by guaranteeing a public, shareable portfolio URL that can be copied and sent immediately.

Portfolio-first promise (day 1):

- Primary promise: "I built a clean proof-based portfolio link and can share it today."
- Secondary promise: matching remains available but is not the first user promise.

Core sections (single template, responsive):

- Header: name, handle, headline/positioning; quick proof bar (identity, work email, LinkedIn) with owner-controlled visibility.
- Mission/values/bio: concise, structured; owner can hide.
- Expertise/skills snapshot: 3–6 top skills with levels; owner can hide.
- Trust signals: featured Proof Packs, verified skills, peer attestations, and identity/work-email/LinkedIn badges.
- Contact: mailto + shareable link; owner can hide contact email.

Owner controls and visibility:

- Owner-only visibility toggles for header, proof bar items, skills, bio, contact.
- Public view is read-only; owner actions hidden from public viewers.
- Day-1 defaults publish only a minimal safe allowlist; contact/work-email remain hidden unless explicitly enabled.

URL contracts:

- Individual public URL: `/portfolio/{handle}`
- Organization public URL: `/portfolio/org/{slug}`
- In-app shortcuts: `/app/i/portfolio` and `/app/o/{slug}/portfolio` (redirect to public URLs)

Onboarding completion requirement:

- Onboarding ends with a dedicated "Public portfolio ready" step for both personas.
- Step shows live URL, copy button, open/view button, and continue-to-app action.

Exports:

- PDF export: trust summary, skills, contact; respects visibility flags.
- Text pack (ATS-friendly): plain-text summary; respects visibility flags.

Portfolio diagnostics:

- Share activation and indexing status are tracked so owners can confirm whether a portfolio is ready to distribute safely.
- Raw public-view events may be captured for internal diagnostics or anti-abuse review, but they are not surfaced as owner-facing success counters.

Out of scope for v0.1:

- No ATS/LinkedIn API integrations, dashboards, advanced analytics, multi-language, or custom templates; single clean layout only.

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

## 2.2 Executive Recommendation

- Treat trust formation and proof quality as the primary product analytics layer for MVP.
- Measure Proof Packs, verification lifecycle, freshness, reveal progression, intro reliability, override governance, and public portfolio safety before funnel velocity.
- Keep **TTSC** as the North Star Metric. Keep **TTFQI**, **TTV**, fairness notes, effort reduction, and first-session activation as secondary outcome metrics rather than the primary product-health lens.

## 2.3 Revised KPI Set

| KPI                                        | Exact meaning                                                                                                                                                                                                                                                                                                                                                                                                                     | Numerator                                                                                                                                   | Denominator                                                   | Unit                           | Cohorting dimensions                                                                              | Where it appears                                                                    | Who can see it                                                                      | Internal-only or user-facing                                              | Privacy boundaries                                                                                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Proof Quality Score**                    | Weighted 0-100 quality score for an active published Proof Pack as evidence of credible work: verification integrity `30%`, outcome evidence strength `25%`, freshness state `20%`, proof coverage contribution `15%`, provenance/completeness `10%`. Roll up as median `PQS` across active published packs for a person, org, assignment, or cohort. Users see only the band: `weak`, `developing`, `strong`, `high confidence`. | n/a                                                                                                                                         | n/a                                                           | score `0-100` and band         | persona type, org type, role family, seniority band, region band, verification tier, pack type    | owner trust-health card, org assignment trust summary, internal trust dashboard     | profile owner for own band, org owner for own assignment summary, product/ops/admin | Banded user-facing; raw score internal                                    | Never expose component math, raw evidence weightings, restricted artifact detail, or cross-user rank comparisons.                                      |
| **Proof freshness**                        | Share of active published Proof Packs that remain current enough to count as live trust evidence.                                                                                                                                                                                                                                                                                                                                 | active published packs in `fresh` state                                                                                                     | all active published packs                                    | percent                        | persona type, org type, role family, seniority band, region band, proof type                      | owner trust-health card, org assignment trust summary, internal trust dashboard     | owner for own profile or portfolio, org owner for own assignment, product/ops/admin | User-facing for own objects; aggregate internal                           | Show only owner or authorized org aggregate; do not expose another user’s pack-level freshness outside permitted review surfaces.                      |
| **Proof coverage**                         | Share of active declared claims or assignment requirements backed by at least one active published Proof Pack above the minimum quality threshold.                                                                                                                                                                                                                                                                                | active declared claims or required slots backed by a qualifying active published pack                                                       | all active declared claims or required slots in scope         | percent                        | persona type, org type, assignment type, role family, seniority band, region band                 | owner trust-health card, assignment readiness, internal trust dashboard             | owner for own profile/org, org owner for own assignment, product/ops/admin          | User-facing for own objects; aggregate internal                           | Coverage exposes only scoped counts, never hidden claim text, reviewer notes, or restricted pack contents.                                             |
| **Time-to-Verified**                       | Median elapsed time from `proof_pack_created` to the first successful `proof_verification_completed`.                                                                                                                                                                                                                                                                                                                             | elapsed hours for proof packs that reach first successful verification in scope                                                             | proof packs that reach first successful verification in scope | hours (median)                 | persona type, org type, proof type, role family, seniority band, region band, verification tier   | internal trust dashboard, verification ops dashboard, owner proof status timeline   | proof owner for own object status, product/ops/admin for aggregates                 | Aggregate internal; owner sees only own proof status                      | No public disclosure of verification timestamps beyond the owner and authorized reviewers already entitled to see proof state.                         |
| **Verification lifecycle conversion**      | Conversion through the proof verification funnel. Primary rate is completed verifications divided by verification requests created. Secondary rates track opened, accepted, expired, and downgraded stages.                                                                                                                                                                                                                       | stage-specific completed, opened, accepted, expired, or downgraded verification records                                                     | verification requests created                                 | percent by stage               | persona type, org type, proof type, verification tier, role family, region band                   | internal trust dashboard, verification ops dashboard, owner proof request state     | proof owner for own request state, product/ops/admin for funnel aggregates          | Funnel internals are internal-only; owner sees current request state only | No verifier identity, freeform verifier text, or raw message content in analytics properties or user-facing summaries.                                 |
| **Intro expiry rate**                      | Share of created intros that expire before acceptance or progress.                                                                                                                                                                                                                                                                                                                                                                | intros expired                                                                                                                              | intros created                                                | percent                        | persona type, org type, assignment type, role family, seniority band, region band                 | org assignment dashboard, internal trust dashboard                                  | org assignment owner for own assignments, product/ops/admin                         | Org-facing aggregate and internal                                         | Do not expose counterparty identity or reason text outside authorized assignment owners and internal staff.                                            |
| **Withdrawal rate**                        | Share of submitted proof-backed workflows that are later withdrawn by the owner or counterparty. Applies to proof submissions and intros in scope.                                                                                                                                                                                                                                                                                | withdrawn proof submissions or withdrawn intros                                                                                             | submitted proof submissions or submitted intros in scope      | percent                        | persona type, org type, proof type, assignment type, role family, region band                     | internal trust dashboard, limited owner object status                               | object owner for own status, product/ops/admin for aggregates                       | Internal-only except own-object status                                    | Never expose who withdrew another user’s object or any withdrawal rationale text beyond authorized workflow participants.                              |
| **No-show rate**                           | Share of scheduled interviews that are marked as no-show.                                                                                                                                                                                                                                                                                                                                                                         | interviews marked no-show                                                                                                                   | scheduled interviews                                          | percent                        | persona type, org type, assignment type, interview type, role family, seniority band, region band | org assignment dashboard, internal trust dashboard, interview reliability dashboard | org assignment owner for own aggregate, product/ops/admin                           | Org-facing aggregate and internal                                         | No cross-user no-show leaderboard, no public reputation surface, no analytics properties with personal excuses or feedback text.                       |
| **Reveal-stage conversion**                | Share of matches that progress from one reveal stage to the next, tracked at `stage0->1`, `1->2`, `2->3`, and `3->4`.                                                                                                                                                                                                                                                                                                             | matches reaching the next reveal stage                                                                                                      | matches eligible for the current reveal stage                 | percent by stage               | persona type, org type, assignment type, reveal stage, role family, seniority band, region band   | internal trust dashboard, assignment review dashboard                               | org reviewers for own assignment aggregate, product/ops/admin                       | Internal-only with limited assignment aggregate                           | No identity-bearing reveal details, no per-candidate progression scoreboard, and no hidden-field leakage through analytics.                            |
| **Override usage**                         | Share of reviewed matches with at least one manual override.                                                                                                                                                                                                                                                                                                                                                                      | reviewed matches with at least one override                                                                                                 | reviewed matches                                              | percent                        | org type, assignment type, reviewer role, role family, region band, override reason code          | internal governance dashboard                                                       | product/ops/admin, compliance leads                                                 | Internal-only                                                             | No public or reviewer-to-reviewer ranking. Keep actor identity in audit systems, not in analytics dashboards exposed beyond authorized internal staff. |
| **Override-to-outcome drift**              | Difference in downstream verified outcome rate between override-promoted matches and non-overridden matches within the same score band and cohort.                                                                                                                                                                                                                                                                                | verified downstream outcomes for override-promoted matches minus verified downstream outcomes for non-overridden matches in matched cohorts | compared population within the same score band and cohort     | percentage-point delta         | org type, assignment type, reviewer role, score band, role family, seniority band, region band    | internal governance dashboard                                                       | product/ops/admin, compliance leads                                                 | Internal-only                                                             | Never surface per-reviewer or per-candidate drift publicly. Suppress views below minimum sample thresholds.                                            |
| **Public portfolio indexing status**       | Distribution of published public portfolios across `disabled`, `eligible_not_enabled`, `enabled`, `blocked_by_safety`, and `depublished`.                                                                                                                                                                                                                                                                                         | portfolios in a given indexing state                                                                                                        | published public portfolios in scope                          | count and percent distribution | persona type, org type, portfolio type, region band, indexing status                              | owner portfolio settings, internal public-portfolio health dashboard                | portfolio owner for own status, product/ops/admin for aggregate distribution        | Owner-facing for own status; aggregate internal                           | No public exposure of blocked-by-safety reasons beyond owner-safe language. No search-referrer or viewer identity in owner surfaces.                   |
| **Public portfolio reveal / share events** | Share activation rate for public portfolios. A portfolio counts as activated when it is shared at least once after publication. Public-view volume is diagnostic only and not a success KPI.                                                                                                                                                                                                                                      | active public portfolios shared at least once                                                                                               | active public portfolios                                      | percent                        | persona type, org type, portfolio type, region band, source surface                               | owner portfolio settings, internal public-portfolio distribution dashboard          | portfolio owner for own share actions, product/ops/admin for aggregate              | Share status user-facing; raw public-view counts internal diagnostic only | Do not expose public-view counts, viewer identity, or precise referrers to owners. Referrer classes stay aggregated and internal.                      |
| **Assignment fulfillment rate**            | Share of eligible published assignments that reach `fulfilled` through a proof-backed intro and verified hire or engagement.                                                                                                                                                                                                                                                                                                      | eligible published assignments reaching `fulfilled` via proof-backed intro and verified outcome                                             | eligible published assignments                                | percent                        | org type, assignment type, role family, seniority band, region band                               | org assignment dashboard, internal trust dashboard                                  | org owners for own aggregate, product/ops/admin                                     | Org-facing aggregate and internal                                         | No exposure of individual candidate identity or contract details beyond existing assignment permissions.                                               |

## 2.4 Secondary Outcome Metrics

- **TTSC (North Star Metric):** Median elapsed calendar days from activation to a signed employment or engagement agreement attributable to the platform. Track median and P75 by cohort.
- **TTFQI:** Median elapsed time from activation to the first qualified introduction where thresholds and consent are satisfied.
- **TTV:** Median elapsed time from activation to the first meaningful step such as an interview scheduled or async task accepted.
- **Fairness note / fairness gap:** Release-level fairness note generated only for opt-in cohorts above minimum privacy thresholds; compare intro and contract outcomes without exposing protected attributes in user-facing surfaces.
- **Effort reduction:** Self-reported hours saved plus measured on-platform steps for profile activation, proof preparation, and assignment publishing.
- **First-session activation:** Persona-specific success inside a strict 10-minute window from onboarding completion; individual flow uses `portfolio_share_link_copied` plus `portfolio_pdf_export_succeeded`, and organization flow uses `assignment_template_applied` plus `assignment_publish_succeeded`.

## 2.5 Anti-Goals / Non-Metrics (MVP)

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
- **Proof Quality Score (PQS):** The weighted quality score over active published Proof Packs used for trust-health rollups; users see only the qualitative band, not the raw formula components.

**Decisions captured here**

- **NSM = TTSC** for both sides; track cohort medians + P75.
- Trust-first KPI layer is primary for product analytics: **PQS**, proof freshness, proof coverage, Time-to-Verified, verification lifecycle conversion, intro expiry, withdrawal, no-show, reveal-stage conversion, override usage, override-to-outcome drift, public portfolio indexing status, public portfolio share activation, and assignment fulfillment rate.
- Purpose/values signals remain **first-class** in scoring and are evaluated for lift as a secondary matching diagnostic, not a vanity KPI.
- User-facing analytics remain minimal and status-oriented: own proof freshness, own proof coverage, own verification state, own PQS band, own portfolio indexing status, and own share actions.
- Public portfolio public-view events remain diagnostic only and are not surfaced as owner-facing success counters.
- Zen Hub is optional, private, and excluded from matching, ranking, reveal, fairness workflows, and public rendering.
- Zen analytics are limited to coarse private-partition action events and never include reflection text or raw scores.
- UX quality is still tracked with **SUS** + task success + drop-off; no social feed.

**Open questions**

- **Contract verification:** acceptable proofs (mutual attestation, doc upload, third-party integration later)?
- **Baselines:** how collected for TTSC/Effort (onboarding survey vs. control cohorts)?
- **Fairness controls:** which de-biasing techniques in MVP (blinding, calibration, periodic fairness audit)?
- **Cohort definitions:** by role family, seniority, geography—exact bins for dashboarding.
- **Freshness policy:** exact freshness decay windows and minimum qualifying PQS thresholds by proof type and role family.
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

- **Actions:** Buys Starter; completes mobile payment.
- **Feelings:** Relieved.
- **Friction:** Mobile pay friction.
- **Metrics:** Mobile checkout success; drop-off by step.
- **Design Ops:** Apple/Google Pay; one-screen checkout.

**Retention**

- **Actions:** Uses **Dashboard**; adds 1 artifact/week; optionally opens Zen Hub after a rejection to capture a private reflection.
- **Feelings:** Progressing; occasional discouragement.
- **Friction:** Quiet match weeks.
- **Metrics:** 4-week retention; artifacts cadence; TTFQI→interview rate.
- **Design Ops:** Auto-suggest L4s from uploaded CV; optional Zen prompts tied to milestones.

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

- **Actions:** Import projects to **Profile**; map to Expertise Hub (auto-scan suggests L4s like “Time-series cleaning,” “ETL in Python”). **Gap Map** highlights top L4s to add.
- **Feelings:** Oriented.
- **Friction:** Mapping confidence.
- **Metrics:** Auto-map acceptance rate; time-to-activation.
- **Design Ops:** “Why it mapped” explainer; edit-in-place L4 properties.

**Decision**

- **Actions:** Configures **Matching Profile** (remote; causes: climate); sees shortlists gated by verification.
- **Feelings:** Cost-sensitive.
- **Friction:** Which verification matters?
- **Metrics:** Verification pack attach rate; PAC contribution vs acceptance rate.
- **Design Ops:** “Switch Pack”: portfolio review + 1 verified project + mock interview.

**Purchase**

- **Actions:** Buys Switch Pack; books async review.
- **Feelings:** Motivated.
- **Friction:** Scheduling.
- **Metrics:** Time-to-first verified proof.
- **Design Ops:** 48-hour async SLA; calendar picker with soonest slot.

**Retention**

- **Actions:** Follows Gap Map; applies to 3 roles; optionally uses Zen Hub to capture a private rejection reflection.
- **Feelings:** Resilient.
- **Friction:** Limited feedback on declines.
- **Metrics:** Interview & offer rates; TTSC.
- **Design Ops:** “Why not shortlisted” insights; practice tasks that lift match score + link back to L4 gaps.

---

### 3) Ola, 38 — senior security engineer, time-poor advisor

**Goal:** Low-lift paid advisory with vetted orgs.  
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

- **Actions:** Reviews 2 NGO briefs; requests NDA before details.
- **Feelings:** Professional.
- **Friction:** NDA loops.
- **Metrics:** NDA turnaround time; drop-offs.
- **Design Ops:** One-click NDA; org security self-assessment badge on Assignments.

**Purchase**

- **Actions:** Accepts paid advisory sprint.
- **Feelings:** Clear.
- **Friction:** Onboarding overhead.
- **Metrics:** Time-to-onboard < 15m.
- **Design Ops:** Sprint starter brief; Slack/Teams bridge.

**Retention**

- **Actions:** Quarterly micro-advisories; **Dashboard** shows impact letters; exports credential.
- **Feelings:** Recognized.
- **Friction:** Recognition outside platform.
- **Metrics:** Repeat engagements; credential views.
- **Design Ops:** Public credential page; nudges when availability changes.

---

### 4) Dmitry, 59 — manufacturing expert, mentorship-first

**Goal:** Light mentorship/consulting; desktop-first.  
**Context:** Prefers simple scheduling and payouts.

**Definition of Done (MVP):** 3 pro-bono sessions completed; paid sessions enabled; first payout achieved.

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
- **Design Ops:** Pre-goal template for mentees; deposit for paid slots after 3 pro-bono.

**Purchase**

- **Actions:** Enables paid sessions; connects payouts.
- **Feelings:** Valued.
- **Friction:** Payout setup.
- **Metrics:** Time-to-first payout.
- **Design Ops:** Stripe Connect guide; earnings widget.

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
- **Metrics:** Demo → trial start.
- **Design Ops:** “Shortlist in inbox” workflow; example match-review queue.

**Consideration**

- **Actions:** Create an **Org Profile** with mission, why-join statement, values, proof highlights, and work norms; publish a basic assignment with outcomes, must-have skills, practical constraints, and optional trust requirements.
- **Feelings:** Structured.
- **Friction:** Writing a sharp role brief quickly.
- **Metrics:** Time-to-publish Assignment; manager task success.
- **Design Ops:** Clear prompts for outcomes, constraints, and proof-backed trust context.

**Decision**

- **Actions:** Picks a plan and invites one reviewer if needed.
- **Feelings:** ROI-oriented.
- **Friction:** Budget approval.
- **Metrics:** Trial-to-purchase; time to first live assignment.
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
- **Metrics:** Demo → trial start.
- **Design Ops:** Safe-data templates; proof-first org profile example.

**Consideration**

- **Actions:** Build an **Org Profile** with mission, values, proof highlights, and lightweight work norms; create a basic volunteer **Assignment** with outcomes, must-have skills, practical constraints, and verification gates where needed.
- **Feelings:** Confident.
- **Friction:** Staff training.
- **Metrics:** Time-to-first Assignment; task success.
- **Design Ops:** One lean setup path; train-the-trainer notes kept minimal.

**Decision**

- **Actions:** Chooses NGO plan with volunteer screening.
- **Feelings:** Reassured.
- **Friction:** Cost.
- **Metrics:** Conversion to paid.
- **Design Ops:** Invoice + discount; emphasis on faster qualified intros.

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
- **Organizations:** Scale-ups/Enterprises (HR/Talent), NGOs, Government departments.

**Ties to metrics (Part 2)**

- Every persona has explicit paths to **TTFQI**, **TTV**, and **TTSC**.
- **PAC** is instrumented wherever values/causes influence acceptance/contract rates.
- **SUS** and task-success thresholds apply to activation, assignment publish, and match review.
- Zen Hub is optional, non-clinical, and private by default.

**Decisions captured here**

- Kept the set to **8 concrete personas** by merging near-duplicates to reduce scope creep while preserving coverage.
- All journeys avoid social content feeds and engagement traps; focus is on efficient, values-aligned matching.

**Open questions**

- Minimum verification set per persona (student vs senior expert vs NGO vs enterprise team).
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
**Steps:** 1) Choose Email/Google/LinkedIn → 2) Email: enter email + set password OR magic link; SSO: confirm provider → 3) Verify email → 4) Sign in.  
**Inputs/Data:** Email; name/avatar (from SSO); session token.  
**Needs & Feelings:** Control & choice; confidence about data.  
**System Support:** Clear provider options; passwordless option; resilient email delivery; resend link; device/session management.  
**Done:** Authenticated session established.  
**Metrics:** Signup completion; verification success; first session latency.  
**Edge Cases:** SSO domain blocked; expired link → one‑click resend.

---

## I‑02 Consent & Policy with AI‑assist **[MVP]**

**Purpose:** Transparent consent for Terms, Privacy, and Verification policy.  
**Entry:** First login or when terms change.  
**Steps:** 1) Read human‑readable summaries → 2) Optional “Ask AI” quick explanation → 3) Accept required consents.  
**Inputs/Data:** Consent versions & timestamps.  
**Needs & Feelings:** Understanding; control; privacy reassurance.  
**System Support:** Plain‑language summaries; download PDFs; log consent; link to data practices.  
**Done:** All required consents recorded.  
**Metrics:** Drop‑off; time on consent.  
**Edge Cases:** Jurisdictional clauses; under‑age lockout with guidance.

---

## I‑03 First‑Run Guided Tour (Reveal UI, Zero‑State) **[MVP]**

**Purpose:** Prevent overwhelm; orient users to core areas.  
**Entry:** First successful login (or when requested later).  
**Steps:** 1) Blank canvas with styled background → reveal **Navigation** + hint → 2) Reveal **Dashboard** + hint → 3) Jump to **Profile** (empty state & hint) → 4) Show **Expertise Hub** (About + hint) → 5) Show **Matching Profile** (why it matters) → 6) Show **Settings** (one‑line explainer) → 7) Suggest “Start with your Profile”.  
**Inputs/Data:** Tour seen flag; per‑module “seen” state.  
**Needs & Feelings:** Calm; agency; no forced learning.  
**System Support:** Skippable; repeatable; keyboard/ARIA compatible.  
**Done:** Tour completed or dismissed; next step CTA surfaced.  
**Metrics:** Tour completion; subsequent engagement with Profile.  
**Edge Cases:** Reduced‑motion mode; partial tour resume.

---

## I‑04 Home Dashboard (Observer‑Only Snapshot) **[MVP]**

**Purpose:** Provide a non‑interactive snapshot and deep‑link to the right area.  
**Entry:** Home route after login.  
**Steps:** See cards/tiles summarizing Profile, Expertise, and Matching; clicking a tile deep‑links to its module.  
**Inputs/Data:** Read‑only aggregates.  
**Needs & Feelings:** Orientation; no pressure to act.  
**System Support:** Empty‑state copy per tile; “no actions here” clarity.  
**Done:** User navigates purposefully from dashboard.  
**Metrics:** Tile click‑through; bounce from home.  
**Edge Cases:** No data → tasteful placeholders.

---

## I‑05 Profile Basics (Avatar, Cover, Core Info) **[MVP]**

**Purpose:** Establish a familiar identity surface.  
**Entry:** From tour nudge or Profile.  
**Steps:** Upload avatar; set cover image; add headline, location, timezone, languages; preview → save.  
**Inputs/Data:** Images; text fields.  
**Needs & Feelings:** Safe, familiar; low friction.  
**System Support:** Image cropper; content filters; autosave drafts.  
**Done:** Basics saved.  
**Metrics:** Completion rate; time to first save.  
**Edge Cases:** Large images; offensive content → block with feedback.

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
**Steps:** Toggle “Work” → Organization → Role/Title → Dates → Location (optional) → **What I did** (few short sentences) → **Impact** (brief example‑guided) → **Projects** (optional, names/briefs; continuous vs time‑boxed) → Save Draft or Publish.  
**Inputs/Data:** Structured fields; short texts.  
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

**Purpose:** Coordinate a single interview quickly with preset-based policy defaults.
**Entry:** From messaging.  
**Steps:** Propose/accept slots → confirm event within the active policy window (`startup`: 7 days, `enterprise`: 14 days, `volunteer`: 21 days; `advanced` configurable) → select duration within preset limits → calendar sync → video call link generated (Zoom or Google Meet).
**Inputs/Data:** Timezones; calendars (optional); video call platform preference (Zoom or Google Meet).  
**Needs & Feelings:** Certainty; fairness; speed.  
**System Support:** Timezone auto‑convert; reminders; reschedule allowed once; automatic video call link generation via Zoom or Google Meet integration.  
**Done:** Interview held within SLA.  
**Metrics:** Time match→interview; no‑show rate.  
**Edge Cases:** Panel interviews; candidate/org declines → close loop.

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
**Steps:** **Export**: generate JSON → download. **Import**: upload valid JSON → preview what will be restored → confirm.  
**Inputs/Data:** Profile JSON schema.  
**Needs & Feelings:** Ownership; trust.  
**System Support:** Schema versioning; validation; redaction of secrets.  
**Done:** File exported OR profile restored.  
**Metrics:** Export/Import counts; validation errors.  
**Edge Cases:** Mismatched schema version → guided migration.

---

## I‑25 Delete Account (Immediate, No Grace Period) **[MVP]**

**Purpose:** Allow irreversible exit at user’s request.  
**Entry:** Settings → Danger Zone.  
**Steps:** Read consequences → type confirmation phrase → optional export reminder → delete immediately.  
**Inputs/Data:** Confirmation; audit log.  
**Needs & Feelings:** Autonomy; clarity.  
**System Support:** Final double‑check; email confirmation of deletion.  
**Done:** Account and personal data deleted per policy.  
**Metrics:** Deletion completion; post‑delete support contacts.  
**Edge Cases:** Legal holds; queued exports blocked with notice.

---

## I‑26 Zen Hub — Optional Private Check-ins & Reflections **[MVP]**

**Purpose:** Provide an optional, private place for brief check-ins and milestone-linked reflections during stressful hiring moments without turning the product into a clinical, coaching, or content experience.  
**Entry:** Zen Hub tab.  
**Steps:** Review the privacy boundary → explicitly opt in → record a private 1-5 check-in for stress and sense of control → optionally tag it to a milestone → optionally add a private reflection manually or from an in-product milestone prompt.  
**Inputs/Data:** Opt-in status; privacy-banner acknowledgment timestamp; stress score; control score; timestamp; optional milestone tag; optional reflection text; optional linked check-in ID.  
**Needs & Feelings:** Privacy; clarity; autonomy; calm.  
**System Support:** Zen entries are visible only to the user. Zen data is never shown to organizations, used in matching or ranking, or added to the public profile. Export and delete controls are always available from Zen Hub.  
**Done:** A private check-in or reflection is saved only after explicit submission.  
**Metrics:** Opt-in rate; check-in completion rate; reflection save rate; export requested/completed; delete completed.  
**Edge Cases:** Dismissing a milestone prompt stores nothing; multiple prompts dedupe by type and time window; exports can be empty; delete succeeds idempotently; deadline prompts are never fabricated without a supported tracked event.

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

- **Free trial** exists for organizations; shows concise value cards before commitment.
- **Privacy & data handling**: legally public org data is public by default; sensitive/contractual data remains private.
- **First-run guidance** uses a **gradual reveal** of UI (nav, dashboard cards) with **concise hints** and **mock data** during onboarding only.
- **Account modes**: a person can hold an **Individual** account and also act as an **Org Representative**; easy switching is required.
- **Trial seats**: free trial permits **up to 5 seats** (CEO + 4).
- **Interview policy**: policy presets apply by default with mode-specific windows/durations (`startup`: 7 days/30 min, `enterprise`: 14 days/45 min, `volunteer`: 21 days/30 min). Advanced policy mode retains strict controls; decision feedback SLA remains 48 hours.
- **Matching results**: **Top 5** candidates for free tier; if the pool is too small, platform compiles best matches by **72 hours** post‑publish.

---

# Flows

## O‑01 Landing → Trial Intent

**Goal:** Understand value and decide to try the platform.  
**Entry:** Visitor reads the shared landing page (for individuals & orgs).  
**Happy‑path steps:** Landing → “Start Free Trial (Organizations)” → Value cards (concise).  
**Success:** User proceeds to org sign‑up.  
**Key data:** None.  
**Edge cases:** TL;DR behavior—value cards must be scannable; avoid walls of text.  
**MVP:** Yes.

## O‑02 Organization Sign‑Up & Email Verification

**Goal:** Create an org representative account cleanly.  
**Entry:** CTA from O‑01.  
**Happy‑path steps:** Choose **Organization account** → enter **name, work email, title, password** → submit → receive **verification email** → verify.  
**Success:** Account verified; user can sign in.  
**Key data:** User(OrgRep), Org placeholder.  
**Edge cases:** Email deliverability; password policy; duplicate email.  
**MVP:** Yes.

## O‑03 Minimal Org Setup (Slug & Names)

**Goal:** Provide only essentials before seeing value.  
**Entry:** First sign‑in after O‑02.  
**Happy‑path steps:** Form with **org slug**, **display name**, **legal name** → save.  
**Success:** Org created with minimal profile; hint that more details can be added later.  
**Key data:** Org.slug, Org.name, Org.legal_name.  
**Edge cases:** Slug collision; reserved words.  
**MVP:** Yes.

## O‑04 Trial Activation & Consent

**Goal:** Start free trial with clear terms and reassurance.  
**Entry:** Post O‑03.  
**Happy‑path steps:** Show **value cards** → accept **ToS/Privacy** → optional note on **security/privacy contact** → start trial.  
**Success:** Trial active; seat limit set.  
**Key data:** Trial.start_at, Trial.end_at, Trial.seat_cap=5.  
**Edge cases:** Decline terms → return to dashboard with limited access.  
**MVP:** Yes.

## O‑05 First‑Run Guided Tour (Nav + Dashboard)

**Goal:** Prevent overwhelm; explain layout & purpose swiftly.  
**Entry:** Trial starts / first dashboard view.  
**Happy‑path steps:** Gradual reveal of **nav bar** (with hint) → **dashboard cards** one by one with **mock data** while hints visible → on dismiss, cards revert to **empty defaults**.  
**Success:** Tour completed or skipped; user orients.  
**Key data:** Dismissed_tutorial flags.  
**Edge cases:** Skip/replay; accessibility (keyboard, reduced motion).  
**MVP:** Yes.

## O‑06 Structure Overview: Tabs & Quick Intros

**Goal:** High‑level understanding of what exists (Profile, Assignments, Atlas, Team, Settings).  
**Entry:** End of O‑05 or via “Show me around.”  
**Happy‑path steps:** One‑screen intro per tab → concise “why it matters.”  
**Success:** User navigates intentionally.  
**Key data:** None.  
**Edge cases:** Do not deep‑dive yet; keep scannable.  
**MVP:** Yes.

## O‑07 Account‑Mode Linking & Switching (Individual ↔ Org Rep)

**Goal:** Allow a person to connect personal & org representative identities and switch easily.  
**Entry:** From header switcher or settings.  
**Happy‑path steps:** Link accounts (work email ↔ personal identity) → switch context via header control.  
**Success:** Context reflects chosen mode.  
**Key data:** LinkedAccount(user_id_personal, user_id_orgrep).  
**Edge cases:** Org policy forbids linking; visibility rules differ per mode.  
**MVP:** Yes.

## O‑08 Team Setup: Departments, Hierarchy, Seats

**Goal:** Model company structure & invite collaborators (trial cap = 5 seats).  
**Entry:** Team tab.  
**Happy‑path steps:** Create **departments** → set **hierarchy** → **invite members** by work email → assign **roles** and **departments**.  
**Success:** Team active with roles and seat usage displayed.  
**Key data:** Dept tree, Invites, Roles/Permissions.  
**Edge cases:** Seat cap reached; resend invite; revoke access.  
**MVP:** Yes.

## O‑09 Org Profile Completion (Core Data)

**Goal:** Fill sensitive but essential org details with reassurance.  
**Entry:** Profile tab.  
**Happy‑path steps:** Enter **org number/registry**, **locations**, **industries**, **legal structure**, **ownership & voting rights**; add **mission/vision (free text)**, **values/causes (preset tags)**; upload **logo & cover**.  
**Success:** Profile saved; public vs private fields respected.  
**Key data:** Org registry IDs; governance & transparency fields.  
**Edge cases:** Public‑by‑law defaults vs confidential flags.  
**MVP:** Yes.

## O‑10 Impact Areas — Create, Edit, Publish

**Goal:** Declare public impact areas with strong guidance.  
**Entry:** Profile → Impact Areas.  
**Happy‑path steps:** Add **impact area** via dialog → field‑level hints → **save draft** → **publish** (public by design) → edit later.  
**Success:** Impact areas visible on public org profile.  
**Key data:** ImpactArea entities (title, scope, metrics optional).  
**Edge cases:** Draft vs published; versioning.  
**MVP:** Yes.

## O‑11 Projects — Create, Edit, Confidentiality

**Goal:** Track org projects with confidentiality controls.  
**Entry:** Profile → Projects.  
**Happy‑path steps:** Create project (name, scope, team, status) → mark **confidential/NDA** if needed → save draft/publish (respect visibility).  
**Success:** Project stored; visibility enforced.  
**Key data:** Project, Confidentiality flags, Team links.  
**Edge cases:** Redactions on public views; access control for private projects.  
**MVP:** Yes.

## O‑12 Bindings: Link Projects/Impact Areas ↔ Team & Competencies

**Goal:** Connect work and impact to people and competencies.  
**Entry:** From Project/ImpactArea editors or Atlas/Team views.  
**Happy‑path steps:** Select **project/impact area** → link **team members** and **competencies** (from Atlas) → save.  
**Success:** Relationships appear in Team and Atlas.  
**Key data:** Link tables (Project↔User, ImpactArea↔Competency).  
**Edge cases:** Permission checks; circular edits.  
**MVP:** Yes.

## O‑13 Assignment Creation (5‑Step) with Stakeholders

**Goal:** Define a high‑quality assignment aligned to business value.  
**Entry:** Assignments → “Create First Assignment.”  
**Happy‑path steps:**

1. **Business Value (BV)** — creator assigns **stakeholders** (e.g., CTO/HR/Lead/CEO) and drafts BV; stakeholders can review/comment.
2. **Target Outcomes (TO)** — measurable outcomes & improvement targets.
3. **Weight Matrix** — relative weights: **mission/purpose fit**, **expertise depth**, **work mode** (onsite/hybrid/remote; hard/soft requirement).
4. **Practicals** — budget/salary range, location, availability window.
5. **Expertise Mapping** — pick competencies (Atlas) and tie each to **BV/TO**; optional **education requirements** must include a short **justification**.  
   **Success:** Validated draft ready to publish.  
   **Key data:** Assignment with stakeholders, weights, mappings, education justification texts.  
   **Edge cases:** Missing stakeholder input; conflicting weights; justification omitted when education is marked “required.”  
   **MVP:** Yes.

## O‑14 Publish Assignment (Free Tier Constraints)

**Goal:** Make the assignment discoverable and ready for matching.  
**Entry:** From O‑13.  
**Happy‑path steps:** Review summary → confirm visibility → publish.  
**Success:** Assignment live; matching pipeline starts.  
**Key data:** Assignment.status=Published; subscription tier.  
**Edge cases:** Editing after publish; tier upgrade prompt.  
**MVP:** Yes.

## O‑14A BYOC Candidate Invites & Proof Card Intake

**Goal:** Let organizations bring known candidates into the platform without CV-first review.  
**Entry:** Candidates area in org workspace (`Invited candidates` tab).  
**Happy‑path steps:** Add one or many candidate emails → send invite links → candidate opens invite, authenticates with the same email, claims invite, and submits a Proof Card link (`/p/[token]`) that renders a selected Proof Pack generated from structured profile data.  
**Success:** Invite status transitions to `proof_submitted`, and org reviewers can open the submitted Proof Card and its linked Proof Pack from the queue.  
**Key data:** CandidateInvite(status lifecycle, token hash, claimant, proof snippet/token, linked proof pack, timestamps).  
**Edge cases:** Duplicate active invite blocked per org/email, expired/revoked token, claimant email mismatch, resend/revoke actions.  
**MVP:** Yes.

## O‑15 Intake Matches & Review

**Goal:** Receive and evaluate best candidates quickly.  
**Entry:** After O‑14; matching engine runs.  
**Happy‑path steps:** System compiles **Top 5** candidates (free tier) immediately or within **72h**; show **ranked list** with **subscores** and “why this match.”  
**Success:** Shortlist created.  
**Key data:** CandidateMatch(score, subscores, rationale).  
**Edge cases:** Insufficient pool → partial list + ETA; stale profiles.  
**MVP:** Yes.

## O‑16 Candidate Pipeline: Message & Schedule Single Interview

**Goal:** Move shortlisted candidates through one structured touchpoint.  
**Entry:** From O‑15 shortlist.  
**Happy‑path steps:** Open **message thread** → propose slot(s) via Zoom or Google Meet within active policy window (`startup`: 7 days, `enterprise`: 14 days, `volunteer`: 21 days; `advanced` configurable) and duration limits (30/45/30/60 min max) → system generates video call link automatically; auto‑invite **assigned stakeholders**; confirm time.
**Success:** Interview completed.  
**Key data:** Conversation, Calendar event, Participants, Video call link.  
**Edge cases:** Time‑zone collisions; no‑shows; reschedule once.  
**MVP:** Yes.

## O‑17 Decision & Feedback (48h SLA)

**Goal:** Decide promptly and provide personal feedback.  
**Entry:** After O‑16.  
**Happy‑path steps:** Collect stakeholder inputs → choose **hire/advance/hold/reject** → send **personalized feedback** to each candidate within **48h**.  
**Success:** Candidate informed; pipeline updated.  
**Key data:** Decision records, Feedback artifacts.  
**Edge cases:** Breach of SLA → reminder/escalation; templated but personalized guidance.  
**MVP:** Yes.

## O‑18 Enterprise Expertise Atlas: Intro & Dashboard

**Goal:** Familiarize with org‑level Atlas without overload.  
**Entry:** Atlas tab.  
**Happy‑path steps:** Collapsible **About** (value & future use cases) → gradual reveal of dashboard **graphs with mock data** → revert to empty after tour.  
**Success:** User understands purpose; no data required yet.  
**Key data:** Tutorial flags.  
**Edge cases:** Skip/replay; performance on empty datasets.  
**MVP:** Yes (intro only).

## O‑19 Enterprise Atlas: L1→L4 Competencies (Show‑Only‑Added)

**Goal:** Create and manage org competencies with progressive disclosure.  
**Entry:** Atlas after O‑18.  
**Happy‑path steps:** Show **six L1 domain cards** → on click, list **only L2 categories that have items added** → select L2 to see only added **L3** → expand **L4 competencies**; add/edit competencies; bind to **Impact Areas** and **Projects**.  
**Success:** Competency structure saved; bindings visible.  
**Key data:** Competency(L1‑L4), bindings.  
**Edge cases:** Permissions; bulk edits; taxonomy updates.  
**MVP:** Yes (foundational authoring).

## O‑20 Settings, Security & Data Lifecycle

**Goal:** Manage org security and compliance with strong safeguards.  
**Entry:** Settings tab or header menu.  
**Happy‑path steps:** Change password; setup **MFA**; manage privacy defaults; manage team/roles; **export JSON** of org data; **delete org** with multi‑step confirmations and manual text entry.  
**Success:** Settings applied; exports/downloads complete; deletions irreversible.  
**Key data:** Security settings, Export package, Deletion logs.  
**Edge cases:** Legal hold blocking deletion; restore from JSON (future); role‑based access to sensitive actions.  
**MVP:** Yes (MFA, privacy, export, guarded delete).

---

## Appendix A — Entities & References (from narration)

- **Org**: slug, name, legal_name, registry_ids, locations, industries, legal_structure, ownership/voting, mission, vision, values, causes, pledges, logos, cover.
- **User(OrgRep)**: name, work_email, title, role.
- **Team/Dept**: tree structure; roles/permissions; seat cap in trial.
- **ImpactArea**: public by default; fields guided by hints; draft/publish states.
- **Project**: name, scope, team, status; confidentiality/NDA flags; draft/publish.
- **Competency (L1–L4)**: taxonomy items; bindings to ImpactArea/Project.
- **Assignment**: BV, TO, weights, practicals, expertise mapping, education justification, stakeholders.
- **Match**: score, subscores, rationale; rank.
- **Interview**: policy preset, duration, platform, participants, scheduled within active preset window.
- **Decision/Feedback**: outcome with personal feedback ≤48h SLA.
- **Settings/Security**: MFA, privacy, export JSON, deletion safeguards.

## Appendix B — SLA & Trial Rules

- **Free tier:** Top 5 candidates; **≤72h** to populate if pool is small; **5 seats** (CEO + 4).
- **Interview:** Preset defaults apply by policy (`startup`: 7 days/30 min, `enterprise`: 14 days/45 min, `volunteer`: 21 days/30 min); **advanced** policy mode allows stricter custom handling with max duration guardrails.
- **Decision:** **48 hours** default SLA to inform candidates with personalized feedback; reminders/escalations remain mandatory.

# PRD — MVP — Part 5: Scope (MVP Features)

> **Scope philosophy (for this MVP):** “Features” are **distinct, value-creating capabilities** beyond commodity plumbing (e.g., auth, basic profile, settings). Below separates **Individual** and **Organization** features, each with **Why Now** (from Part 1), **Acceptance Criteria** (pulling from Part 2 metrics and Part 4 flows), and **MoSCoW** priority for MVP.

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

### F2 — **Customizable Dashboard** (Tiles from key hubs)

**Why Now:** Reduces cognitive load and time-to-value through a single, user-curated view.  
**Acceptance Criteria:**

- Add/remove/reorder tiles for: Matches, Applications/Intros, Expertise depth, Evidence/Artifacts, Next Best Action.
- Dashboard loads < 2.0s P75 with cohort baseline volumes.
- **Task success ≥ 90%** for add/remove tile; **drop-off < 10%** in final two steps.
- Zen Hub stays reachable from navigation and settings, not as a default dashboard habit surface.  
  **MoSCoW:** **Must** (core tiles); **Should:** per-persona presets; **Could:** multiple layouts.

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
- Event tracking on add/edit; visible **Expertise depth** tile on Dashboard.  
  **MoSCoW:** **Must** (manual add + basic auto-suggest); **Should:** Gap Map basic; **Could:** bulk CSV import.

---

### F4 — **Matching Hub** (values-aware automated matching)

**Why Now:** Shrinks search overhead for both sides, targeting **TTFQI** and **TTSC** improvements.  
**Acceptance Criteria:**

- Generates ranked shortlists with composite score and **PAC** component.
- **TTFQI median ≤ 72 hours** for at least one target cohort after activation (Part 2).
- Inline “Why this match” with editable constraints (location, availability, verification gates) and quick actions (intro, pass, snooze).
- Compensation visibility defaults to **overlap-only** in matching surfaces unless explicit exact-range visibility is granted.
- Setup flow always shows **sample match previews** (real near-matches when available, clearly labeled mock samples otherwise).
- Matching endpoints return eligibility guidance without hard blocking:
  - If the user is not yet **Discoverable**, return `200` with `items` (possibly empty), `eligibility`, `trustLevel`, `introEligibility`, and `topActions`.
  - If the user is **Discoverable** but not **Match-visible**, private browse remains usable while org-visible matching stays paused.
  - If intro criteria are unmet, intro actions return `409 INTRO_QUALIFICATION_NOT_MET` with missing requirements, reason codes, and next actions, without blocking browse.
- **Fairness note** per release with cohort checks where users opt-in to share demographics.  
  **MoSCoW:** **Must** (shortlist + why + quick actions); **Should:** snooze/feedback loops; **Could:** experiment flags for alternative scoring.

---

### F5 — **Zen Hub** (optional private check-ins and reflections)

**Why Now:** Gives users a narrow, private support surface for volatile job-search moments without expanding Proofound into a broader support program.  
**Acceptance Criteria:**

- Opt-in, non-diagnostic 1–5 check-ins (stress, sense of control) with private-by-default storage.
- Reflections linked only to `rejection`, `interview`, `offer`, and `deadline`, plus manual entry.
- Clear privacy boundary banner states that Zen entries are visible only to the user and are never used in matching, ranking, or public profile rendering.
- User can export Zen data as versioned JSON and can permanently delete it from Zen Hub.
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
  **MoSCoW:** **Must** (field-level + redact); **Could:** audience presets.

---

### F7 — **Verification & Attestations (v1)**

**Why Now:** Credibility without heavy gatekeeping; reduces noise for orgs and anxiety for candidates.  
**Acceptance Criteria:**

- Users can request **peer/mentor attests** to artifacts or L4s via magic link.
- Assignment-introduced **verification gates** are displayed pre-intro (e.g., ID, portfolio, reference).
- Contextual “Request attestation” entry points appear on proof/skill surfaces and unmet gate banners.
- Time-to-first verified proof P50 **≤ 7 days** for users who request it (from Persona flows).  
  **MoSCoW:** **Should** (soft verify/attest); **Could:** ID or employment verification later.

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
- Users can review past feedback from the Dashboard/Matching hub without exposing private notes to orgs.  
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
- Deep HRIS/ATS integrations beyond simple exports/placeholders in MVP.
- Automated compensation benchmarking; culture scoring; legal/contracting workflows.

---

## 5.4 Cross-Feature Acceptance Gates (MVP “Done” hooks)

- **Activation thresholds** defined and enforced for both Profiles and Assignments.
- **TTFQI**, **TTV**, **TTSC** instrumentation live; baseline dashboards populated.
- **SUS** study executed on activation and assignment flows; targets from Part 2 met.
- **Fairness note** generated from cohort checks (opt-in demographics).
- **Privacy review** passed for Zen Hub and visibility controls; redaction works in previews.

---

## 5.5 MoSCoW Summary (MVP)

- **Must:** F1, F2, F3, F4, F5, F6, F9; O1, O6, O7, O8, O9, O10, O11.
- **Should:** F7, F8; O2, O3, O4, O5, O12.
- **Could:** Bulk import/export niceties; richer analytics; SSO/SCIM; donor/investor views; exercises library.

---

## Facts & Decisions (Part 5)

- **Features vs plumbing:** Auth, base profile, settings, messaging basics are **non-features** (plumbing) and assumed present.
- **Values-aware matching:** Purpose signals are first-class (PAC) and must never be used to penalize or exclude protected groups.
- **Zen Hub boundary:** Optional, private-by-default, and never used to rank matches, feed org analytics, power fairness workflows, or affect public rendering.
- **Org type flag:** Mandatory at creation, enabling tailored copy and presets without branching the platform.

**Open Questions**

- Minimum verification set per persona/org in MVP (tie to Part 3).
- Exact fairness checks & thresholds to include in the “fairness note.”
- Cohort bins for TTSC/TTFQI dashboards (role, seniority, region) to finalize with data model.

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
- Zen trend scoring, self-assessments, work-schedule guardrails, guided content libraries, external resource hubs, local-event discovery, streaks, or gamified return mechanics.

## 6.2 Excluded Geographies / Segments (MVP)

- Government-grade deployments, procurement-specific flows, or records-retention mandates beyond generic export.
- Highly regulated sectors requiring bespoke compliance (health/defense) beyond generic controls.

## 6.3 Boundaries vs Included MVP Features

- **Included (Part 5):** Organization Trust Profile, Assignment Publishing, Match Review and Intro Workflow, Minimal Org Access, Expertise Atlas, **Gap Analysis**, Matching Hub (with **PAC**), post-interview feedback loops (individual + org), Zen Hub (private check-ins and reflections only), visibility controls, and soft **attestations**.
- **Not included:** Anything that materially expands scope beyond these (above exclusions apply).

---

## 6.4 Lean Organization MVP Migration Notes

- Former standalone org surfaces for structure, culture, impact, projects, expertise hub, dashboard, templates, and org-type UX branching are either collapsed into the four launch surfaces above or moved post-MVP.
- Enterprise customers may still use the MVP, but enterprise-specific procurement, SSO/SCIM, ATS/HRIS, donor/investor reporting, and government workflow branches do not define launch scope.
- Historical mentions of evidence-pack exports, org maps, JD-paste analytics, or dashboard tiles should be read as post-MVP unless they are explicitly re-scoped later.

## Facts & Decisions

- This list is **binding for MVP**; additions require a change note and re‑prioritization.
- Non‑negotiables: **no social feed**, **no diagnostic mental‑health features**, **no hard verification**, **no payments/contracting** in MVP.
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

### F2 — Customizable Dashboard (Tiles)

**Inputs**

- Tile config: ordered list of tiles (Matches, Applications/Intros, Expertise Depth, Evidence/Artifacts, Next Best Action).
- Persona preset (optional).

**Processing Rules**

- Persist user-specific layout; fetch tile data concurrently with 2.0s P75 budget.
- “Next Best Action” computes from profile completeness, L4 gaps, and match backlog.

**Outputs**

- Dashboard page; per-tile quick actions (e.g., open shortlist, add L4, review privacy settings).

**Error & Empty States**

- Empty: show skeletons and seeded examples (“No matches yet—complete 3 L4s to unlock”).
- Tile fetch error: display fallback message and retry control.

**Event Tracking**

- `dashboard_viewed` {tiles[], load_ms}
- `dashboard_tile_added/removed/reordered` {tile, position}
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
- Filtered zero-result state must show `Reset filters` before the 3 recovery CTAs.
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
- Audit log for changes; “restore defaults” control.

**Outputs**

- Live preview; updated profile/match cards.
- “What others can see” summary buckets: public, network-only, match-only, private.
- Audit trail accessible to the user.

**Error & Empty States**

- Conflicts (e.g., artifact is private but linked in public snippet): block with guidance.
- Permission errors return “Forbidden” without leaking existence.

**Event Tracking**

- `visibility_changed` {entity, field, from, to}
- `redact_mode_toggled` {enabled}
- `preview_rendered` {mode}

---

### F7 — Verification & Attestations (v1)

**Inputs**

- Attestation request (artifact/L4), recipient email/name, message, due date.
- Status updates from magic-link form (approve/decline + comment).

**Processing Rules**

- Generate signed magic links; expiry (default 14 days).
- Store attestations; surface badges on artifacts/L4s.
- Assignment **verification gates** displayed pre-intro.

**Outputs**

- Attestation status panel; badges on verified items; reminder emails.
- Export verification summary in Match Detail.

**Error & Empty States**

- Expired link → regenerate flow; declined attest → feedback shown to requester.
- Missing gate → block introduce with explanation.

**Event Tracking**

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

- Enforce role-based access throughout (Owner/Manager/Reviewer; Individual).

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
- Events feed dashboards for **TTFQI, TTV, TTSC**, **SUS study tags**, and **fairness notes**.

---

## 7.5 Dependencies / Hand-offs

- Matching score weights & fairness checks are configured server-side and versioned.
- Evidence Pack export requires server-side PDF service.
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
- **Query hygiene:** Indexed filters; pagination for lists; N+1 guards in ORM; batch fetching for dashboard tiles.
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
- **Testing:** Automated a11y checks in CI; manual audits on critical flows (activation, assignment creation, checkout if used).

## Localization

- **Languages:** English UI for MVP.
- **Internationalization:** IANA timezone capture; locale‑aware dates, numbers, and currency formatting; Unicode-safe storage; left‑to‑right baseline (RTL readiness assessed post‑MVP).

## Observability

- **Structured logging:** JSON logs with request‑id; scrub PII on emit; 30‑day retention in log store.
- **Metrics:** RED (Rate/Errors/Duration) for APIs; trust-health dashboards for PQS, proof freshness, proof coverage, TTSC, TTFQI, and TTV.
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
- **Organization (Org)** — profile (mission/vision/values/causes, culture, impact); 1:N **Member** (Profile) with role; 1:N **Assignment**.
- **MatchingProfile** — constraints & preferences used by matching (availability, comp, location mode, languages, causes).
- **SkillsTaxonomy** — hierarchical L1→L4 catalog; synonyms; level rubric.
- **ProfileSkill** — join table: Profile × L4 skill with `level (0–5)`, `months_experience`, `visibility`.
- **Assignment** — role & outcomes, must/nice L4 skills, verification gates, logistics, and weights.
- **Match** — materialized (Profile × Assignment) ranking record with the current score trace package: `score`, top-level component scores (`skills_fit`, `proof_fit`, `constraints_fit`, `verification_fit`, `purpose_fit`), component applicability states, `score_version`, `model_version`, `explanation_version`, `fairness_check_version`, `inputs_hash`, `reason_codes`, `rank_presentation`, `fairness_status`, `generated_at`, stale-policy state, and reviewer override linkage.
- **MatchReasonLedger** — immutable ledger of canonical reason codes and payload snapshots for each match decision, including system, reviewer, and policy-generated entries used for explanation rendering and audits.
- **MatchReviewState** — reviewer workflow state, reveal scope, shortlist timing, and manual override posture for each match.
- **Application** — candidate intent + answers, attached artifacts; links to **Interview** events.
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
- Assignment 1—N Application
- Profile N—N Assignment via Application; Profile × Assignment → Match (scored)
- Application 1—N Interview
- Any 1—N AnalyticsEvent (with anonymized ids)

## Data Retention & Deletion

- **Profiles:** Immediate irreversible deletion request handling; related records are deleted or anonymized according to legal and technical requirements.
- **Assignments/Applications:** Retain 24 months by default; allow org‑level purge on request.
- **Artifacts:** Retain while linked to active Profile/Assignment; orphan cleanup after 90 days.
- **Messages:** Retain 36 months; subject to legal holds.
- **Analytics events:** Retain 24 months then aggregate/anonymize.
- **Backups:** Follow Part 8 policy; restores purge deleted PII as part of post‑restore job.

## Top Events & Properties

- `dashboard_viewed` — `{ tiles[], load_ms }`
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
- `assignment_published` — `{ assignment_id, builderMode, minimumRequiredSkills }`
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
- **Features:** Automatic meeting link generation, calendar invites with video link, timezone handling, and policy preset enforcement (`startup`, `enterprise`, `volunteer`, `advanced`) with preset-based duration limits.
- **Fallback:** Manual link entry if API unavailable.

## Feature Flag Control APIs

- **User flags endpoint:** `/api/feature-flags` resolves audience-aware flags for activation tiering, assignment builder mode, plain-language vocabulary, and privacy summary.
- **Rollout metrics endpoint:** `/api/admin/metrics/rollout` exposes admin-only rollout indicators (activation completion, publish completion, individual/company first-10-minute activation rates, visibility reversal rate, tier/mode breakdown, and endpoint health for matching/publish APIs).

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
- **Video conferencing APIs:** Zoom/Google Meet rate limits; account requirements; OAuth setup; preset-based meeting durations (30/45 min defaults by policy, up to 60 min in advanced mode) and manual-link fallback when provider limits apply.
- **Vendor lock‑in:** Keep portable SQL and storage paths; document exit plans (e.g., Postgres dump, S3 export).
- **Security posture:** Monitor for dependency CVEs; maintain an allowlist for uploads.

---

## Facts & Decisions

- **Facts:** MVP deliberately excludes payments, hard verification, deep ATS/HRIS; single‑region hosting.
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

**F2 Customizable Dashboard**

- [ ] Add/remove/reorder tiles; layout persists across sessions/devices.
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

- [ ] Request attestation via magic link; status visible; reminders send.
- [ ] Assignment gates are displayed pre-intro; unmet gates block “Introduce.”

**F8 Gap Analysis & Next-Best Skills**

- [ ] Gap view surfaces must/nice L4 gaps per focus or matched assignments with “why this matters.”
- [ ] Suggested L4/proof can be accepted/edited inline; activation progress updates when applied.
- [ ] Next-best action generated while gaps remain; progress tracked via gap count/time-to-activation.

**F9 Post-Interview Feedback Loop (Individual)**

- [ ] Individual sees decision + personalized feedback within 48h SLA; status shows pending/received.
- [ ] Feedback stored with assignment/interview and notified to the user.
- [ ] Historical feedback accessible from dashboard/matching without exposing private notes to orgs.

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
- [ ] **Observability:** Error tracking, latency dashboards, and event pipeline active.

---

## 12.3 Data Quality & Analytics Readiness (Parts 9–10)

- [ ] Event schema validated in CI; no PII in event properties.
- [ ] Dashboards show **NSM (TTSC)**, **TTFQI**, **TTV**, and funnel conversion (view→intro→interview→hire).
- [ ] Nightly ETL → analytics DB successful; **ml_training_data** table populated with labels.

---

## 12.4 Smoke Test Playbook (must pass end-to-end)

1. **Individual activation:** Sign up → Purpose → Atlas → become Discoverable → unlock Match-visible → qualify for Intro-eligible when proof depth and trust are strong enough.
2. **Org assignment:** Create org → Purpose → Assignment (Basic default) → Publish → Shortlist appears; Advanced path retains strict 5-step.
3. **Introduce:** From shortlist → Introduce → Message thread opens (basic) → Mark as interview scheduled.
4. **Verification:** Request attestation → Approver completes → Badge visible.
5. **Zen Hub:** Opt-in → Add check-in → Save milestone-linked reflection → Export JSON or permanently delete Zen data.
6. **Privacy:** Toggle field visibility & Redact mode → Previews reflect settings.

---

## 12.5 Sign-offs

- **Product:** feature scope & UX (Parts 3–5)
- **Engineering:** NFRs, reliability, security & data (Parts 8–9)
- **Design/Accessibility:** WCAG checks, design parity
- **Data/Analytics:** event schemas, dashboards
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
- A5: Email-first onboarding is sufficient for early cohorts (SSO later).

**Validation windows:** First 4–6 weeks post-launch; report weekly.

## 13.3 Kill-Switch & Rollback

- **Feature flags** guard: `FF_ACTIVATION_TIERING`, `FF_ASSIGNMENT_BASIC_MODE`, `FF_UI_VOCAB_PLAIN`, `FF_PRIVACY_SUMMARY` (plus existing platform flags for legacy flows).
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
- Analytics dashboards live for trust health and secondary outcomes (PQS, proof freshness, proof coverage, TTSC, TTFQI, TTV).
- Run smoke tests from 12.4 on Preview then on Prod after deploy.

**Release strategy:** Trunk-based with feature flags and deterministic percentage rollout; sequence is internal-only → 10% → 50% → 100%; instant rollback available in Vercel.

## 14.2 Deployment

- CI builds & tests on PR → Preview deploy on Vercel.
- Merge to main → Production deploy on Vercel.
- Reversible migrations run via migration tool; **post-deploy** job warms indexes & caches.
- Only after all flows & interactions test **green** do we declare launch-ready.

## 14.3 Observability

- **Dashboards (Ops):** API RED (rate/errors/duration), page TTI P95, job success, error rate by release, DB health.
- **Dashboards (Product):** Trust health first: **PQS** bands, proof freshness, proof coverage, verification lifecycle conversion, reveal-stage conversion, intro expiry rate, no-show rate, assignment fulfillment rate, then secondary outcomes **TTSC**, **TTFQI**, **TTV**, and fairness note summary.
- **Rollout dashboard:** Admin metrics endpoint tracks activation completion, assignment publish completion, individual/company first-10-minute activation rates, privacy visibility reversal rate, activation tier mix, builder-mode mix, and p95/sla-breach rates for `/api/core/matching/profile` and `/api/assignments/[id]/publish`.
- **Alerts:** 5xx spike, latency P95 breach, failed ETL, error rate by route, email bounce spike.
- **Tracing:** Critical paths (assignment publish, shortlist generation) traced end-to-end.
- **Log hygiene:** JSON logs with request-id; PII scrubbing.

## 14.4 Analytics Plan

### Executive recommendation

- Instrument trust formation before funnel velocity. The analytics model should explain whether Proofound is improving proof quality, verification confidence, reveal safety, and assignment fulfillment, not just whether users move faster through a funnel.
- Keep the canonical KPI definitions in Part 2. Product and ops dashboards should order metrics as trust health first, secondary speed and efficiency outcomes second.
- Keep launch-safe observability narrow: measure only what is needed to validate trust quality, proof quality, and launch readiness.

### Revised KPI set

- Canonical KPI definitions live in Part 2 and are the source of truth for:
  - **Proof Quality Score**
  - **proof freshness**
  - **proof coverage**
  - **Time-to-Verified**
  - **verification lifecycle conversion**
  - **intro expiry rate**
  - **withdrawal rate**
  - **no-show rate**
  - **reveal-stage conversion**
  - **override usage**
  - **override-to-outcome drift**
  - **public portfolio indexing status**
  - **public portfolio reveal / share events**
  - **assignment fulfillment rate**
- Secondary outcome metrics remain **TTSC**, **TTFQI**, **TTV**, fairness note / fairness gap, effort reduction, and first-session activation.

### Revised event taxonomy

- **Shared property contract**
  - Required IDs only when needed: `proof_pack_id`, `assignment_id`, `match_id`, `intro_id`, `interview_id`, `portfolio_id`
  - Actor metadata only as role or class, never raw identity in analytics payloads
  - Common dimensions: `persona_type`, `org_type`, `role_family`, `seniority_band`, `region_band`, `verification_tier`, `reveal_stage`, `override_reason_code`, `indexing_status`, `source_surface`
  - Operational flags: `privacy_tier`, `is_test_event`
- **Proof lifecycle**
  - `proof_pack_created`
  - `proof_pack_published`
  - `proof_verification_requested`
  - `proof_verification_completed`
  - `proof_verification_expired`
  - `proof_verification_downgraded`
  - `proof_freshness_state_changed`
  - `proof_marked_stale`
  - `proof_pack_withdrawn`
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
- **Public portfolio distribution**
  - `portfolio_indexing_enabled`
  - `portfolio_indexing_disabled`
  - `portfolio_shared`
  - `portfolio_public_viewed`
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
  - Own proof freshness
  - Own proof coverage
  - Own verification status and verification request state
  - Own Proof Quality Score band
  - Own portfolio indexing status
  - Own portfolio share actions
- **Org-facing**
  - Assignment fulfillment rate
  - Intro expiry rate
  - No-show rate
  - High-level reveal-stage conversion by assignment
  - Never override drift or individual reviewer behavior
- **Internal-only**
  - Raw PQS distributions
  - Override usage
  - Override-to-outcome drift
  - Detailed verification lifecycle funnel
  - Raw public portfolio views and referrer classes
  - Fairness segment slices unless minimum privacy thresholds pass

### Acceptance criteria

- Both PRDs use the same trust-first KPI names, formulas, and visibility rules.
- Every KPI definition includes exact meaning, numerator, denominator, unit, cohorting dimensions, where it appears, who can see it, exposure level, and privacy boundaries.
- All required event names are present in the canonical event taxonomy grouped by lifecycle.
- **TTSC**, **TTFQI**, and **TTV** remain present but are clearly secondary to trust and proof instrumentation.
- Owner-facing public-view counters and gamified streak mechanics are removed or explicitly demoted as non-goals.

### Privacy and data minimization rules

- No PII in analytics properties or dashboard cards.
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

- **100 users:** Validate trust instrumentation coverage, onboarding friction points, and Atlas starter success; fix launch-blocking proof and verification gaps.
- **1,000 users:** Validate proof freshness, proof coverage, assignment fulfillment, indexing safety, and TTFQI median target in at least one cohort; review fairness note cadence.
- **10,000 users:** Load/latency review; enable caching/read replica if needed; consider pgvector pilot; review compliance needs.

**Status:** Draft v0.1 · **Owner:** Pavlo Samoshko · **Date:** —

# Addendum — MVP Clarifications & Acceptance Checks

## A1 Baselines & Targets for TTSC/TTFQI/TTV

- Acceptance checks:
  - Onboarding captures self-reported prior TTSC/TTFQI/TTV during the first two weeks; stored with cohort tags (persona, role family, region).
  - Baseline vs target appears on the trust-first analytics dashboard by end of week two; method documented for reproducibility.
  - Events support cohort-level median + P75 for TTSC/TTFQI/TTV.

## A2 Fairness Note (Opt-in Cohorts)

- Acceptance checks:
  - Run the fairness note only when an opt-in cohort has ≥20 candidates and ≥5 decisions per cohort; otherwise show “insufficient data.”
  - Compare intro and offer/contract rates; flag when any absolute gap ≥10 percentage points across cohorts; include cohort definitions in the note.
  - No PII in the note; generated each release from event data and linked in release notes.

## A3 Visibility & Privacy Guardrails

- Acceptance checks:
  - “Preview as” (public/network-only/match-only) available before publish/export; sensitive fields default to match-only.
  - Public portfolio indexing status is explicit: `disabled`, `eligible_not_enabled`, `enabled`, `blocked_by_safety`, or `depublished`.
  - Public-view events may exist for internal diagnostics or anti-abuse review, but owner-facing surfaces show share readiness and indexing state rather than raw view counters.
  - Pre-publish check blocks sharing if private artifacts/fields are referenced in public/network-only surfaces; shows inline fixes.
  - “What others can see” summary panel is always available and grouped into public/network-only/match-only/private buckets.
  - Zen Hub data stored in a separate partition and excluded from ranking, org analytics, fairness workflows, and public rendering; only coarse private-partition action events are allowed, and the privacy banner explicitly states this.

## A4 Resilience & Third-Party Fallbacks

- Acceptance checks:
  - Interview scheduling allows manual video link entry if Zoom/Meet APIs fail and surfaces a fallback banner.
  - Location autocomplete falls back to free-text city + country while still allowing assignment/profile publish.
  - Transactional email retries up to three attempts with backoff; bounces logged and visible on an ops dashboard.

## A5 SLA Instrumentation (7-day Interview, 48h Feedback)

- Acceptance checks:
  - Emit SLA events (`interview_window_started`, `interview_scheduled`, `feedback_due`, `feedback_sent`) with timestamps; dashboard shows compliance per assignment.
  - Alerts fire at 80% of the window and on breach for interviews and feedback (in-app + email to owners).
  - SLA status visible to org reviewers and candidates; breach reasons recorded.
  - SLA policy supports recommended presets (startup, enterprise, volunteer) while preserving strict limits in advanced policy mode.

## A6 Matching Transparency & Governance

- Acceptance checks:
  - Show rank bands (`Top 5/10/20`) by default. Exact rank is available only for tightly scoped org-review surfaces when pool ≥30, fairness status is not elevated, and the product labels the active presentation mode.
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
  - Assignment publish readiness is mode-specific:
    - **Basic:** role, business value, ≥1 measurable outcome, practicals, and ≥3 must-have skills (default entry path).
    - **Advanced:** full 5-step completeness including stakeholders and weight matrix; exposed only after explicit opt-in; education marked “required” must include justification.
  - Dashboards show current trust level, intro status, and next-best action when unmet.

## A8 Plain-Language Vocabulary Policy

- Acceptance checks:
  - User-facing copy defaults to plain terms (for example, “skills depth,” “purpose fit,” “time to first good match”) instead of internal metric codes.
  - Internal event and analytics schema names remain unchanged for continuity.
  - Advanced explanation tooltips may disclose canonical terms when explicitly requested by the user.

## A9 Matching Preview, Compensation, and Empty-State Actions

- Acceptance checks:
  - Matching setup always shows sample previews using real near-matches when available, otherwise clearly labeled mock samples.
  - Compensation is shown as overlap-only by default in matching cards and visible-fields APIs unless explicit exact-range visibility is granted.
  - Empty states across Atlas, Matching, Assignment, and Privacy provide exactly three deep-linked remediation actions.

## A10 Data Export/Import Safety

- Acceptance checks:
  - Exports include schema version; imports run dry-run validation with a summary of changes; block on schema mismatch or invalid fields.
  - User sees preview of fields to be overwritten; no changes apply on failed validation; validation logs stored for audit.

## A11 Feature-Flag Rollout and Monitoring

- Acceptance checks:
  - Feature keys are stable and environment-configurable: `FF_ACTIVATION_TIERING`, `FF_ASSIGNMENT_BASIC_MODE`, `FF_UI_VOCAB_PLAIN`, `FF_PRIVACY_SUMMARY`.
  - Rollout follows internal-only → 10% → 50% → 100% with deterministic audience/percentage targeting.
  - `/api/feature-flags` returns user-scoped flag states for authenticated sessions.
  - `/api/admin/metrics/rollout` returns activation/publish/privacy indicators and endpoint-health metrics used in launch decisions.

**Status:** Draft v0.1 · **Date:** —
