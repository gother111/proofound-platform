> Doc Class: `reference-spec`
> Last Verified: `2026-03-09`

# Proofound MVP PRD

**Canonical handoff source:** This file is the single source of truth for the Proofound MVP PRD.  
**Derivative docs:** `PRD_for_a_web_platform_MVP.md` is a compatibility mirror. `Proofound_PRD_MVP.md` is an executive summary only.  
**Audience:** Product, design, engineering, analytics, QA.

---

## 1. Product Frame

### 1.1 Category and Promise

Proofound is a proof-first credibility and connection platform for individuals and lean organizations. It replaces low-signal CV-first workflows with structured evidence of real work, privacy-safe matching, and qualified introductions.

### 1.2 MVP Promise

Proofound MVP guarantees a day-1 win:

- individuals can publish and share a public portfolio link immediately after onboarding
- organizations can publish a public trust profile and one high-signal assignment path immediately after onboarding
- both sides can move through a blind-by-default matching corridor toward qualified intros without turning the product into an analytics surface, open people index, or content feed

### 1.3 Primary Outcome

The north-star outcome is **TTSC**: Time-to-Signed-Contract.

Supporting MVP metrics:

- **TTFQI**: Time-to-First Qualified Intro
- **TTV**: Time-to-Value
- **PAC**: Purpose-Alignment Contribution
- **SUS**: System Usability Scale
- **Fairness note status**: release-level privacy-safe fairness reporting state

### 1.4 MVP Boundary

Proofound MVP is a privacy-first, calm workflow for:

- individuals to build trust, publish a proof-first portfolio, become Match-visible, and move toward qualified intros
- lean organizations to publish a trust profile, publish assignments, review privacy-safe matches, and coordinate intros and interviews

MVP excludes:

- public candidate directories or searchable public people indexes
- enterprise admin suites, org operating-system surfaces, or BI-style analytics surfaces
- ATS, HRIS, or marketplace integrations
- payments, contracting, milestone billing, or employer-of-record workflows
- government deployment branches
- gamified profile maintenance, public counters, leaderboards, or streak mechanics
- Zen Hub expansion beyond optional private check-ins and reflections

---

## 2. Canonical Vocabulary

### 2.1 Core Entities

- **Proof Pack**
  - The canonical evidence object across profile, matching, org review, export, and BYOC.
- **Artifact**
  - One atomic evidence item attached to a Proof Pack, such as a file, link, image, credential, assessment, or reference.
- **Proof**
  - The claim and trust judgment about real work, including provenance, freshness, verification, and outcome credibility.
- **Proof Card**
  - A submission-safe presentation of one selected Proof Pack for invite, assignment, intro, or review flows.

### 2.2 Trust and Eligibility Terms

- **Profile readiness tiers**
  - `Discoverable`
  - `Match-visible`
  - `Intro-eligible`
  - `Strongly trusted`
- **User trust tier**
  - `unverified`
  - `workplace_verified`
  - `identity_verified`
- **Proof Pack verification status**
  - `unverified`
  - `partially_verified`
  - `verified`
  - `disputed`
- **Proof freshness state**
  - `fresh`
  - `review_soon`
  - `stale`
  - `expired`

### 2.3 Matching Privacy Model

Proofound matching is **blind-by-default** and uses **progressive reveal**.

Canonical reveal stages:

- `stage0_anonymous`
- `stage1_capability_and_proof`
- `stage2_contextual_reveal`
- `stage3_intro_approved`
- `stage4_interview_coordination`

**Redaction** is not a competing privacy model. It is an owner-facing visibility control used in previews, published surfaces, and allowed reveal surfaces.

### 2.4 Public Distribution Model

- MVP includes a **public portfolio** for individuals and organizations.
- MVP includes **portfolio indexing** as a controlled distribution state.
- Direct-link sharing is in scope.
- Indexing is off by default and must be explicitly enabled when safety rules pass.
- A searchable people index or open browse index is out of scope.

### 2.5 Workflow Objects

- **match**
  - A ranked connection candidate between an individual and an assignment.
- **intro**
  - A consented introduction created after qualification and reveal rules pass.
- **interview**
  - A scheduled or completed interview tied to a match or intro.
- **feedback follow-up**
  - The 48-hour post-interview decision and feedback process.
- **Zen Hub**
  - Optional private check-ins and reflections stored in a private partition and excluded from ranking, reveal, org review, fairness workflows, and public rendering.

---

## 3. Users and Core Journeys

### 3.1 Individuals

Primary MVP user groups:

- new graduates
- career switchers
- immigrants in new markets
- mid-career movers
- senior experts and advisors

Canonical individual journey:

1. Sign up and complete onboarding.
2. Publish a public portfolio link.
3. Build a profile using skills, preferences, and Proof Packs.
4. Reach `Discoverable`, then `Match-visible`.
5. Browse matching surfaces without being hard-blocked if not yet `Intro-eligible`.
6. Become `Intro-eligible` through stronger proof coverage, freshness, and trust signals.
7. Move through blind-by-default review, intro, interview, and feedback follow-up.
8. Optionally use Zen Hub privately without affecting any ranking or review surface.

### 3.2 Organizations

Primary MVP org groups:

- NGOs
- startups
- SMEs
- larger hiring teams using the same lean owner-plus-reviewer workflow

Canonical organization journey:

1. Sign up and create an organization.
2. Publish a public organization trust profile.
3. Create one assignment with outcomes, constraints, must-have skills, and optional verification gates.
4. Review privacy-safe matches in an Assignments and Matches queue.
5. Shortlist, pass, or request intros without early identity reveal.
6. Coordinate intros, interviews, and 48-hour feedback follow-up.

### 3.3 Experience Rules

- The individual product surface is a **Home snapshot**, not an analytics product.
- The organization product surface is an **Assignments and Matches queue**, not a BI-style analytics surface.
- Matching is consent-based and proof-first, not application-first.
- Published public portfolios never weaken blind-by-default matching behavior.

---

## 4. MVP Product Requirements

## 4.1 Shared Requirements

- Auth supports email and password plus Google and LinkedIn OAuth.
- Required consent is captured inside auth and onboarding.
- Privacy controls are field-level and must apply consistently across profile, public portfolio, matching, and reveal stages.
- Export and delete flows are part of MVP.
- Government ID verification is not exposed in the self-serve MVP UI.

## 4.2 Individual Product Surfaces

### A. Onboarding and Public Portfolio

- Onboarding is portfolio-first.
- Individual onboarding collects display name, handle, headline, bio, and location.
- Onboarding ends with a dedicated **Public portfolio ready** step.
- Public individual URL: `/portfolio/{handle}`
- Public portfolio defaults to a minimal safe allowlist:
  - header on
  - proof bar on
  - work email off
  - contact off
  - skills off
  - bio off
- Search indexing is disabled by default.

### B. Profile, Skills, and Proof Packs

- The profile is proof-first and uses Proof Packs as the canonical evidence object.
- Skills and profile credibility must point to linked Proof Packs, not loose artifact counts.
- Artifacts may appear only as child evidence units inside a Proof Pack.
- A Proof Pack may be:
  - owner-only
  - link-only
  - matched-org visible
  - public
- Child artifact permissions may narrow exposure but never widen it.

### C. Matching Readiness and Matching

- Readiness is expressed through the profile readiness tiers:
  - `Discoverable`
  - `Match-visible`
  - `Intro-eligible`
  - `Strongly trusted`
- Product access is not hard-blocked before `Intro-eligible`.
- Private browse may be available before org-visible matching.
- Org-visible matching starts at `Match-visible`.
- Qualified intros start only at `Intro-eligible`.
- Matching explanations may reference:
  - skill fit
  - proof strength
  - constraints fit
  - verification readiness
  - purpose fit
  - fairness or policy limitations when relevant
- Matching explanations must never expose hidden identity-bearing information.

### D. Intros, Interviews, and Feedback Follow-up

- Intro creation requires qualification and reveal-stage rules to pass.
- Interview scheduling supports Google Meet and manual links.
- Zoom may be shown only as fallback guidance, not as a guaranteed live integration.
- Both sides participate in a **48-hour feedback follow-up** after interview completion.
- Personalized feedback is in scope when an assignment closes and policy requires it.

### E. Zen Hub

- Zen Hub is optional.
- Zen data is visible only to the user.
- Zen data is excluded from ranking, reveal, org review, fairness workflows, public rendering, and user-facing analytics.
- Zen supports export and delete.

### F. Settings, Export, and Delete

- Export supports versioned JSON.
- Delete is immediate and irreversible with explicit confirmation.
- Visibility controls must provide a clear “what others can see” summary.

## 4.3 Organization Product Surfaces

### A. Onboarding and Public Portfolio

- Organization onboarding is portfolio-first.
- The organization setup creates:
  - organization record
  - active owner membership
  - public organization portfolio route
- Public org URL: `/portfolio/org/{slug}`
- Onboarding ends with an **Organization portfolio ready** step that emphasizes copy and share actions.

### B. Organization Trust Profile

- Organization trust profile includes:
  - mission
  - why-join statement
  - values
  - proof highlights
  - lightweight work norms
- This is the minimum org trust surface required for matching credibility in MVP.

### C. Assignment Publishing

- MVP supports one basic assignment path.
- Assignment fields include:
  - role
  - outcomes
  - must-have skills
  - practical constraints
  - optional trust requirements
  - masked budget handling where used
- Assignment publishing is designed for speed and clarity, not analytics depth.

### D. Match Review and Intro Workflow

- Orgs review privacy-safe matches in an Assignments and Matches queue.
- Allowed org review actions:
  - shortlist
  - pass
  - request intro
  - request reveal where policy allows
- Public portfolio links, direct identity, and contact details must stay hidden in blind stages.

### E. Minimal Org Access

- MVP org collaboration includes:
  - one owner
  - optional reviewer access
- Multi-layer admin suites, templates, org maps, donor reporting, and heavy operations tooling are out of scope.

### F. BYOC Candidate Invites

- Organizations may invite a known candidate by email.
- The candidate claims the invite using the matching email.
- Submission uses a Proof Card derived from a selected Proof Pack.
- Proof Card remains a render surface, not a separate stored entity.

---

## 5. Canonical Lifecycle Models

## 5.1 Profile Readiness

Profile readiness is a product-readiness model, not a legal status model.

- `Discoverable`
  - public basics, one target role or focus area, one recent L4 skill, one qualifying Proof Pack linked to that skill, and one practical preference
- `Match-visible`
  - `Discoverable` plus broader role, work-mode, location, availability, and stronger Proof Pack coverage
- `Intro-eligible`
  - `Match-visible` plus stronger role-relevant Proof Pack coverage, fresh qualifying proof, and complete intro preferences
- `Strongly trusted`
  - `Intro-eligible` plus deeper proof coverage across contexts and at least two active trust anchors

## 5.2 User Trust Tier

User trust tier is user-level and derived from trust signals.

- `unverified`
- `workplace_verified`
- `identity_verified`

Rules:

- Work email verification may elevate a user to `workplace_verified`.
- LinkedIn verification may elevate a user to `workplace_verified` or `identity_verified` depending on signal strength.
- Attestations can strengthen trust reasoning but do not replace the canonical user trust tier model.

## 5.3 Proof Pack Lifecycle

Proof Pack lifecycle is separate from profile readiness and user trust tier.

- `draft`
- `ready`
- `published`
- `submitted`
- `withdrawn`
- `superseded`
- `archived`

Rules:

- `draft -> ready` only when publish-eligible fields are complete.
- `ready -> published` only when visibility and eligibility rules pass.
- `published -> submitted` when attached to an assignment, invite, intro, or review flow.
- `withdrawn` and `superseded` stop contributing positive trust lift immediately but remain exportable and auditable to the owner.

## 5.4 Proof Pack Verification and Freshness

### Proof Pack verification status

- `unverified`
- `partially_verified`
- `verified`
- `disputed`

### Proof freshness state

- `fresh`
- `review_soon`
- `stale`
- `expired`

Rules:

- Proof Pack verification status is pack-level.
- `disputed` suppresses positive trust language and trust lift until resolved.
- `stale` lowers confidence and current-trust contribution but does not erase historical evidence.

## 5.5 Match and Reveal Lifecycle

### Match state

- `generated`
- `shortlisted`
- `passed`
- `intro_in_progress`
- `interview_in_progress`
- `closed`

### Side states

- `stale`
- `hidden_due_to_policy`

### Reveal stages

- `stage0_anonymous`
- `stage1_capability_and_proof`
- `stage2_contextual_reveal`
- `stage3_intro_approved`
- `stage4_interview_coordination`

Rules:

- Stage 0 and Stage 1 are the default org review corridor.
- Identity-bearing reveal requires the appropriate stage and consent path.
- Public portfolio publication does not override reveal restrictions.

## 5.6 Intro Lifecycle

- `created`
- `accepted`
- `declined`
- `expired`
- `withdrawn`
- `closed`

Rules:

- Intros are created only after qualification and reveal rules pass.
- Expired or withdrawn intros remain auditable.

## 5.7 Interview Lifecycle

- `scheduled`
- `rescheduled`
- `completed`
- `no_show`
- `cancelled`

Rules:

- A canceled interview may be replaced by a new interview for the same match.
- Schedule, reschedule, and cancel updates are posted into the related thread as user-visible context.

## 5.8 Feedback Follow-up Lifecycle

- `not_due`
- `due`
- `submitted`
- `breached`
- `closed`

Rules:

- Feedback follow-up begins after interview completion.
- The default policy is a **48-hour feedback follow-up**.
- Status must be visible to both relevant participants at the correct scope.

## 5.9 Public Portfolio Distribution Lifecycle

- `disabled`
- `eligible_not_enabled`
- `enabled`
- `blocked_by_safety`
- `depublished`

Rules:

- Public portfolios are shareable by direct link when enabled.
- Indexing is controlled separately from publication and is off by default.
- Safety rules may block or depublish a public surface.
- Public-view data remains internal diagnostics only and never becomes an owner-facing vanity counter.

---

## 6. Matching and Privacy Contract

### 6.1 What Blind-by-Default Means

Early review must not expose:

- full name
- photo
- direct social links
- public portfolio URL
- exact location
- contact details
- employer or school names when those are identity-bearing
- demographic or inferred bias-sensitive signals

### 6.2 What Reviewers May See Early

Stage 0 and Stage 1 may include only:

- anonymized candidate label
- skill clusters and capability summaries
- Proof Pack summaries
- outcome evidence summaries
- broad constraints fit
- coarse verification and trust-safe status language
- rank band or qualitative fit state where allowed

### 6.3 Visibility and Redaction

- Field-level visibility applies everywhere.
- Redaction is a control that affects previews and allowed renders.
- Hidden fields must not leak copy actions, deep links, filenames, metadata, or identity-bearing preview data.
- Manually uploaded artifacts with identifying metadata must render as sanitized, withheld, or requires-review until a later allowed reveal stage.

### 6.4 Public Portfolio Interaction with Matching

- Public portfolios are explicit publication surfaces.
- Matching review must not expose a direct portfolio route, handle, or identity-bearing URL before the allowed reveal stage.
- Sanitized Proof Pack summaries may appear in matching without exposing the public route.

---

## 7. Metrics and Analytics Contract

## 7.1 Canonical KPI Definitions

- **TTSC**
  - Median elapsed time from activation to signed contract.
- **TTFQI**
  - Median elapsed time from activation to first qualified intro.
- **TTV**
  - Median elapsed time from activation to first meaningful step such as an interview scheduled or accepted async task.
- **PAC**
  - Purpose-Alignment Contribution inside matching and explanation only.
- **SUS**
  - Launch usability benchmark for activation, assignment publishing, and match review.
- **Fairness note status**
  - Release-level state: `published` or `insufficient_data`

These are the only launch KPIs promised across the PRD.

## 7.2 User-Facing vs Internal Analytics

### User-facing

- Individuals see a Home snapshot with status and next-best actions.
- Organizations see an Assignments and Matches queue with operational follow-up state.
- No user-facing surface includes public view counters, leaderboards, streaks, or BI-style analytics.

### Internal-only

- TTSC
- TTFQI
- TTV
- PAC
- SUS
- fairness note status
- activation, publish, intro, interview, and feedback follow-up operational health

## 7.3 Canonical Event Taxonomy

### Account and onboarding

- `account_signed_up`
- `individual_onboarding_completed`
- `organization_onboarding_completed`

### Public portfolio distribution

- `portfolio_shared`
- `portfolio_public_viewed`
- `portfolio_indexing_state_changed`

### Proof Packs and trust evidence

- `proof_pack_created`
- `proof_pack_ready`
- `proof_pack_published`
- `proof_pack_submitted`
- `proof_pack_withdrawn`
- `proof_pack_superseded`
- `proof_pack_verification_requested`
- `proof_pack_verification_completed`
- `proof_pack_verification_expired`
- `proof_pack_verification_downgraded`
- `proof_pack_freshness_state_changed`
- `attestation_requested`
- `attestation_completed`
- `user_trust_tier_changed`

### Matching and reveal

- `match_generated`
- `match_shortlisted`
- `match_passed`
- `match_hidden_due_to_policy`
- `reveal_stage_viewed`
- `reveal_stage_advanced`
- `reveal_requested`
- `reveal_granted`
- `reveal_denied`

### Intro lifecycle

- `intro_created`
- `intro_accepted`
- `intro_declined`
- `intro_expired`
- `intro_withdrawn`

### Interview and feedback follow-up

- `interview_scheduled`
- `interview_rescheduled`
- `interview_completed`
- `interview_cancelled`
- `interview_no_show_marked`
- `feedback_follow_up_due`
- `feedback_follow_up_submitted`
- `feedback_follow_up_breached`

### Organization workflow

- `org_trust_profile_updated`
- `assignment_draft_saved`
- `assignment_published`
- `org_review_queue_viewed`
- `candidate_invite_sent`
- `candidate_invite_claimed`
- `proof_card_submitted`
- `verification_gate_failed`

### Zen Hub private partition

- `zen_opt_in_changed`
- `zen_checkin_submitted`
- `zen_reflection_saved`
- `zen_export_requested`
- `zen_export_completed`
- `zen_delete_completed`

## 7.4 Event Privacy Rules

- No PII in analytics properties.
- No raw message bodies.
- No feedback text.
- No Zen reflection text.
- No direct public viewer identity.
- No precise location.
- No protected attributes in event payloads.
- Zen events stay in a private partition.

## 7.5 Metric to Event Mapping

- **Activation completion**
  - `individual_onboarding_completed`, `organization_onboarding_completed`, readiness transitions to `Match-visible`
- **Share readiness and usage**
  - `portfolio_shared`, `portfolio_indexing_state_changed`
- **TTFQI**
  - `intro_created`
- **TTV**
  - `interview_scheduled` or equivalent meaningful-step event
- **TTSC**
  - contract-attestation or signed-contract event recorded in the operational pipeline that closes the intro or assignment corridor
- **48-hour feedback follow-up compliance**
  - `feedback_follow_up_due`, `feedback_follow_up_submitted`, `feedback_follow_up_breached`
- **Fairness note status**
  - derived from release-level event aggregation only when privacy thresholds pass

## 7.6 Explicit Analytics Exclusions

The MVP analytics contract does not require:

- warehouse refresh jobs as a product acceptance criterion
- ML training-label population
- public analytics surfaces
- owner-facing public view analytics

Those may exist operationally later, but they are not part of the MVP product contract.

---

## 8. Acceptance Criteria

## 8.1 Canonical Vocabulary and Scope

- Proof Pack, artifact, proof, and Proof Card are used consistently with non-overlapping meanings.
- `PRD_for_a_web_platform_MVP.master-latest.md` is the canonical handoff PRD.
- Public portfolio and portfolio indexing are explicit.
- Public directory language is absent from the MVP contract.
- Blind-by-default progressive reveal is the only canonical matching privacy model.
- Redaction is documented only as a supporting visibility control.

## 8.2 Individual Product Acceptance

- Individual onboarding ends with a public portfolio-ready step and live shareable URL.
- Individuals can create and publish Proof Packs and control visibility.
- Matching remains explorable before `Intro-eligible` without implying org visibility too early.
- Qualified intros are blocked until `Intro-eligible`.
- Interviews support schedule, reschedule, cancel, and replacement scheduling.
- 48-hour feedback follow-up status is visible and auditable.
- Zen Hub remains private, optional, and excluded from ranking and public rendering.

## 8.3 Organization Product Acceptance

- Org onboarding ends with a public portfolio-ready step and live shareable URL.
- Organization trust profile, assignment publishing, and review queue all align with the lean org MVP scope.
- The org review corridor uses privacy-safe matching and staged reveal.
- Optional reviewer access works without introducing enterprise admin scope.
- BYOC candidate invites use Proof Cards derived from Proof Packs.

## 8.4 Lifecycle and State Acceptance

- Profile readiness tiers, user trust tier, Proof Pack verification status, and Proof Pack lifecycle are documented as separate state systems.
- Match, intro, interview, feedback follow-up, and portfolio distribution each have one canonical lifecycle.
- Public portfolio publication does not weaken reveal restrictions in matching.

## 8.5 Analytics and Privacy Acceptance

- KPI names, definitions, and privacy boundaries are consistent across product, analytics, and QA handoff language.
- Every internal metric named in the PRD maps to explicit source events.
- No user-facing product requirement depends on BI-style analytics surfaces.
- Zen Hub analytics rules match Zen Hub privacy rules everywhere in the PRD.

---

## 9. QA Handoff Checklist

- Verify individual onboarding creates `/portfolio/{handle}` and ends with a dedicated portfolio-ready step.
- Verify org onboarding creates `/portfolio/org/{slug}` and ends with a dedicated portfolio-ready step.
- Verify blind-by-default stages never surface public portfolio URLs or identity-bearing data too early.
- Verify Proof Pack visibility and artifact visibility interact correctly when a pack is public but a child artifact is more private.
- Verify `Match-visible` and `Intro-eligible` are treated as separate thresholds.
- Verify user trust tier and Proof Pack verification status appear as separate concepts in product copy and QA scenarios.
- Verify 48-hour feedback follow-up appears as a workflow state, not just narrative text.
- Verify Zen Hub export and delete work while Zen data stays absent from ranking and org-facing surfaces.

---

## 10. Out of Scope

- Public candidate directory or search-first people marketplace
- Deep org analytics, fairness tiles, BI-style analytics surfaces, or custom analytics layouts
- ATS or HRIS connectors
- Payments, contracts, milestones, or payroll
- Government ID self-serve verification
- Gamified proof maintenance, vanity counters, badges as separate product objects, or public testimonials as a core MVP mechanic
- Zen content library, coaching product, therapy workflows, or outbound wellbeing experiences

---

## 11. Final Approval Checklist

- One canonical PRD source exists.
- Canonical vocabulary is stable and unambiguous.
- Proof Pack, verification, matching, public portfolio, and lifecycle states align.
- Acceptance criteria match analytics rules and event names.
- Out-of-scope language matches the included MVP features.
- User journeys do not reintroduce removed scope.
