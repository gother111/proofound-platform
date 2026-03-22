> Reference-only wrapper: active MVP implementation now uses `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`, `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`, `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`, and `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`.
> Do not use this file as the active MVP product contract.

# Proofound MVP PRD — Proof-First Hiring Corridor

**Status:** Aligned rewrite for current MVP  
**Date:** 2026-03-11  
**Audience:** Founder, product, design, engineering, QA, GTM  
**Authority:** This document aligns to `Proofound_Project_Specification_2026-03-11.md`. If any section conflicts with the Project Specification, the Project Specification wins.

---

## 0. Purpose of this PRD

This PRD defines the launch-bound product behavior for Proofound MVP.

It exists to:

- turn the Project Specification into a buildable product definition
- remove legacy scope drift and ambiguity
- give product, design, and engineering one shared reference for MVP decisions
- keep the product narrow enough to launch and trustworthy enough to matter

This rewrite intentionally replaces broader legacy product sprawl with launch-binding requirements only.

---

## 1. Product frame

### 1.1 Product category and promise

Proofound MVP is a **proof-first, privacy-first hiring credibility corridor** centered on **Proof Packs**.

It helps:

- individuals prove what they can do through structured proof, not just CV bullets
- organizations review people through proof-backed, privacy-safe, explainable signal instead of profile theater

### 1.2 Core trust problem

The MVP solves a trust problem on both sides:

- individuals struggle to present credible capability without relying on weak résumé language, pedigree, or performative networking
- organizations struggle to separate real capability from polished self-claim, keyword stuffing, and AI-generated application noise

### 1.3 Core wedge

The MVP wedge is:

- portable proof of real work
- privacy-safe blind-by-default review
- explainable matching and shortlist logic
- a calm public proof portfolio that is shareable from day one

The MVP is **not**:

- generic AI recruiting
- a full ATS replacement
- a public candidate directory
- a social network or content feed
- a generic org operating system

### 1.4 Included user groups

**Individuals**

- career switchers
- early-career people with real projects but weak résumé signal
- internationally mobile talent with credibility gaps in new markets
- freelancers / consultants moving toward longer-term work
- experienced operators or specialists who have real work to show but dislike CV theater

**Organizations**

- mission-driven NGOs
- startups and SMEs
- schools, accelerators, and lean programs
- teams hiring for project-shaped, outcome-shaped, or credibility-sensitive work

### 1.5 Minimum valuable experience by user type

**Individual minimum win**

- create a safe profile shell
- add at least one real context and 1–3 real proofs
- publish a clean public proof-based portfolio
- understand what remains to become match-visible and intro-eligible

**Organization minimum win**

- publish a clean org trust page
- create one strong assignment through a structured builder
- review privacy-safe proof-backed candidates
- move one candidate through intro, reveal, interview, and decision

---

## 2. MVP boundaries

### 2.1 What the MVP includes

The MVP includes:

- proof-based individual portfolios
- private work / volunteering / education context scaffolding
- Proof Packs and child evidence items
- skill mapping linked to proof and context
- scoped verification and structured human attestations
- organization trust pages
- one structured assignment corridor
- blind-by-default shortlist review with progressive reveal
- intro, interview, decision, and engagement verification workflow
- export / delete / privacy controls
- auditability and manual operations where needed for trust

### 2.2 What the MVP does not include

The MVP excludes:

- ATS / HRIS / payroll / contract-signing integrations
- enterprise org suite features
- company dashboard sprawl
- org structure / culture / impact / projects blocks
- public people directory
- social feed behavior
- reviewer marketplace UI
- sponsor / bounty marketplace UI
- full two-sided marketplace assumptions at launch
- vanity metrics, endorsement counts, streaks, or gamified loops
- Zen expansion beyond optional private check-ins and reflections

### 2.3 What is post-MVP

Post-MVP only:

- one ATS integration corridor
- deeper automation of verification
- richer export / handoff into existing hiring systems
- reviewer network expansion
- sponsor / bounty rails
- broader employer analytics
- university / first-proof program productization
- enterprise integrations and deeper admin tooling

---

## 3. Canonical product model

Proofound MVP is built from four layers:

1. **Context layer**  
   Private real-life profile context: work experience, volunteering, education / learning.

2. **Proof layer**  
   Proof Packs and child evidence items: artifacts, uploads, links, outcomes, credentials, engagement evidence.

3. **Capability layer**  
   Skills and role signals supported by context and proof.

4. **Verification layer**  
   Scoped verification, freshness, disputes, trust state, and engagement confirmation.

**Design rule:** Proofound stays proof-first in what it shows and context-rich in what it stores.

---

## 4. Canonical objects in MVP

### 4.1 Individual-side objects

- profile
- work experience
- volunteering experience
- education / learning experience
- skill record
- Proof Pack
- proof evidence item
- verification record
- public portfolio page
- matching preferences
- intro / reveal / interview / decision history
- engagement verification record

### 4.2 Organization-side objects

- organization account
- organization trust profile
- team membership
- assignment
- candidate review record
- intro request
- reveal request
- interview record
- decision record
- engagement verification record

### 4.3 Shared workflow objects

- match
- reason code
- audit log
- visibility state
- capability / invite / attestation token

---

## 5. Individual product surfaces

### 5.1 Safe shell and onboarding

The first user journey is:

1. create a safe profile shell
2. add one real context
3. add 1–3 real proofs
4. structure proof into Proof Packs
5. request verification where useful
6. publish a public proof portfolio
7. progress toward intro eligibility

The first action should feel like **“add proof”**, not **“complete your profile.”**

### 5.2 Private profile context

The individual private workspace includes three private-by-default contextual layers:

- work experience
- volunteering experience
- education / learning experience

These are not public résumé sections by default.
They exist to anchor proofs, explain context, and improve matching coherence.

Minimum structure per context type:

**Work experience**

- organization name
- role / title
- timeframe
- one concrete outcome or project
- optional details later

**Volunteering experience**

- organization / cause
- role or contribution type
- timeframe
- one concrete outcome or activity

**Education / learning experience**

- provider / institution
- program / course / credential
- timeframe
- optional note on relevance

### 5.3 Proof Packs

Proof Pack is the canonical proof object.

Each Proof Pack must contain:

- title
- short summary
- one primary anchor context
- optional secondary contexts
- role / ownership statement
- timeframe
- outcomes / impact
- linked skills
- visibility state
- freshness state
- verification summary
- child evidence items

Child evidence items may include:

- uploaded files
- URLs
- case-study fragments
- credential references
- engagement evidence
- review notes or structured observations

Rules:

- no loose artifact pile without structure
- no orphan Proof Packs for intro-eligible users
- at least one primary context anchor is required for intro-eligible readiness

### 5.4 Skills logic

Skills remain in MVP, but they are not the hero object.

Canonical rules:

- skills must link to proof and/or real context
- unsupported floating skill bullets do not earn trust lift
- proof-backed skills are stronger than self-claimed skills
- interpersonal skills are allowed, but through bounded human-observed logic

Evidence classes supported in MVP:

- artifact-backed
- credential-backed
- human-observed
- context-backed

### 5.5 Verification and attestations

Verification is scoped, not global.

Supported verification types in MVP:

- self-claimed
- peer-attested
- org-verified
- human-reviewed
- auto-checks-passed where applicable

For universal / interpersonal skills, MVP supports bounded structured attestations for a limited set of skills such as:

- communication
- collaboration
- leadership
- conflict resolution
- adaptability
- professional judgment
- reliability

Attestations must capture:

- verifier identity and relationship
- context in which the behavior was observed
- observation duration and recency
- skill being attested
- observed behaviors
- confidence level
- conflict / bias disclosure

### 5.6 Public portfolio

The public portfolio is a calm trust surface, not a classic résumé and not a social feed.

It should emphasize:

- selected proof
- selected outcomes
- selected trust summaries
- minimal identity and role framing

It should de-emphasize:

- unsupported profile claims
- raw counts
- vanity metrics
- decorative taxonomy depth

### 5.7 Matching readiness tiers

Individual readiness tiers:

- **Portfolio-ready**
- **Discoverable**
- **Match-visible**
- **Intro-eligible**
- **Strongly trusted**

Product protection rule:

- portfolio-ready should be easy
- intro-eligible should be meaningfully harder

Intro-eligible users must have:

- at least one relevant anchored Proof Pack
- one non-self trust anchor relevant to the assignment corridor
- complete enough preferences and constraints to support serious matching

### 5.8 Process surfaces

The individual process area includes:

- intros
- reveals
- interviews
- decisions / feedback
- engagement verification status

Individuals can:

- accept or decline intro
- approve or reject reveal
- coordinate interviews
- receive decisions and candidate-visible feedback
- see what is missing for stronger trust readiness

---

## 6. Organization product surfaces

### 6.1 Organization onboarding and trust page

Organizations can:

- create org account
- verify basic trust posture
- publish a public organization trust page
- define mission, work context, and why the work matters

The trust page should emphasize:

- mission / purpose
- type of work offered
- clarity of assignments
- seriousness of review process

### 6.2 Team roles

MVP supports three lightweight org roles only:

- `org_owner`
- `org_manager`
- `org_reviewer`

MVP mapping guidance:

- HR / recruiter → `org_manager`
- hiring manager → `org_manager` or `org_reviewer`
- executive sponsor → `org_reviewer` unless true owner rights are required
- future teammate / peer → `org_reviewer`

Do not build a complex enterprise approval matrix.

### 6.3 Assignment builder

The organization assignment builder is one of the core product surfaces.

It must force organizations to answer:

- why this role exists
- what business value or real outcomes matter
- what proof would count
- what practical constraints are real

Assignment builder steps:

1. why this role exists
2. what work will actually be done
3. what proof would count
4. what practical constraints are real
5. internal review and publish

Each assignment includes:

- title
- engagement type
- work mode / location constraints
- role purpose
- expected outcomes
- must-have skills
- proof expectations
- optional verification gates
- timing / availability constraints
- optional compensation overlap logic if used

### 6.4 Review queue

Organizations review candidates through privacy-safe proof-backed summaries.

The review queue should emphasize:

- anonymized proof summaries
- outcomes
- proof quality
- verification fit
- reason codes
- clear decision actions

### 6.5 Hiring corridor

The canonical organization corridor is:

1. review
2. shortlist
3. request intro
4. request reveal
5. interview(s)
6. final decision
7. engagement verification
8. optional proof issuance or support

Supported decision states:

- pass
- hold
- reject
- hire
- withdraw
- advance to another interview step

Supported engagement types in MVP:

- full-time
- part-time
- contract / consulting
- fractional / project

### 6.6 Candidate invite / BYOC corridor

Organizations may invite a candidate into the assignment corridor, but:

- Proofound still owns proof structure and privacy-safe review logic
- BYOC should not bypass trust, reveal, or audit rules

---

## 7. Shared product capabilities

### 7.1 Blind-by-default review

Matching and shortlist review are blind by default.

Before reveal, organizations should not see:

- name
- photo
- direct portfolio URL inside matching surfaces
- exact employer names when redaction applies
- exact school names when redaction applies
- direct contact information
- unnecessary bias-sensitive identity signals

### 7.2 Progressive reveal

Reveal is staged.

Canonical reveal progression:

- Stage 0: anonymous / redacted review
- Stage 1: capability + proof review
- Stage 2: contextual reveal
- Stage 3: intro-approved reveal
- Stage 4: interview coordination reveal

Identity-bearing reveal requires candidate consent.

### 7.3 Visibility model

Canonical visibility scopes:

- `owner_only`
- `matched_org`
- `link_only`
- `public`
- `internal_only`

Rules:

- narrowest-wins across parent, child, reveal, and policy ceiling
- public portfolio publication never overrides blind review
- PII must not leak through metadata, logs, filenames, analytics, or rendering

### 7.4 Matching logic

Matching exists to help organizations review better and help candidates surface relevant proof.

Matching inputs in MVP may include:

- proof relevance
- skill fit
- proof freshness
- verification fit
- engagement-type fit
- work mode / location / timezone fit
- practical constraints

Matching output rules:

- explanation is required
- reason codes are required
- exact ranking is de-emphasized early
- proof-backed explanation matters more than black-box scoring

### 7.5 Engagement verification

A hire decision and an engagement verification are not the same thing.

After `hire`, Proofound may record:

- offer / contract / engagement confirmation
- mutual attestation or equivalent verification artifact
- later issuance of a new proof or engagement-backed proof update

Proofound does not become payroll, onboarding, or contract management software in MVP.

---

## 8. UX and UI logic

### 8.1 Experience principles

The product should feel:

- calm
- trustworthy
- uncluttered
- practical
- structured but not bureaucratic
- serious without feeling corporate-heavy

### 8.2 Interface principles

- proof comes before profile decoration
- public surfaces feel editorial and credible, not social or gamified
- review surfaces prioritize explanation, evidence, and clarity
- private scaffolding supports the user quietly instead of demanding résumé-style form filling
- empty states direct users to one concrete next action
- plain language beats internal jargon

### 8.3 Visual emphasis

Emphasize:

- proof summaries
- outcomes
- ownership / role context
- freshness
- trust state
- privacy state
- assignment clarity

De-emphasize:

- raw counts
- vanity signals
- decorative dashboards
- noisy taxonomy depth

### 8.4 MVP site map

```text
PUBLIC
- Individual portfolio page
- Organization trust page
- Assignment page

INDIVIDUAL APP
- Home
- Profile context
  - Work
  - Volunteering
  - Education / learning
- Proof
  - Proof Packs
  - Verification
- Portfolio
- Opportunities
- Process
  - Intros
  - Reveals
  - Interviews
  - Decisions / feedback
- Settings
  - Privacy
  - Export / delete

ORGANIZATION APP
- Home
- Organization trust profile
- Team & roles
- Assignments
  - Draft
  - Internal review
  - Live
- Review queue
- Hiring process
  - Intros
  - Reveals
  - Interviews
  - Decisions
  - Engagement verification
- Settings / audit

INTERNAL OPS
- Verification queue
- Trust and safety review
- Pilot operations
- Disputes / revocations
```

---

## 9. Hard constraints

### 9.1 Proof-first constraints

- Proof Pack is the canonical proof object.
- Public trust, match explanation, and org review must resolve back to proof.
- Skills must be linked to proof or context.
- Intro-eligible users must have at least one relevant non-self trust anchor.
- No orphan Proof Packs for intro-eligible users.

### 9.2 Privacy constraints

- blind-by-default review is mandatory
- progressive reveal is mandatory
- candidate consent is required for identity-bearing reveal
- public publication never weakens review-stage privacy
- field-level visibility and narrowest-wins must be enforced
- PII must not leak via metadata, logs, filenames, analytics, or rendering

### 9.3 Verification constraints

- verification is scoped, not global
- email is transport, not proof of truth
- public trust language must stay narrow and honest
- contradicted or stale verification must stop providing trust lift
- human-observed soft-skill attestations must stay structured and bounded

### 9.4 UX constraints

- portfolio-ready must be easy
- intro-eligible must be harder
- first action is “add proof” not “complete your profile”
- no vanity counters or public popularity metrics
- interface must remain calm, clear, and minimal

### 9.5 Scope constraints

- no ATS / HRIS / payroll / contract-signing integration in MVP
- no enterprise org suite in MVP
- no public candidate directory in MVP
- no reviewer marketplace UI in MVP
- no sponsor marketplace UI in MVP
- no large analytics or dashboard sprawl in MVP
- no Zen expansion beyond optional private check-ins and reflections

---

## 10. Success signals and launch priorities

### 10.1 What the MVP optimizes first

The MVP optimizes first for:

1. proof creation
2. proof quality
3. first verified proof
4. shareability
5. proof-backed introductions

Hiring speed matters, but hiring-speed theater must not distort early product priorities.

### 10.2 Core launch metrics

- time to portfolio-ready
- time to first verified proof
- proof quality score distribution
- percent of Proof Packs with active non-self trust anchors
- share-to-open rate on public portfolios
- time to first qualified intro
- assignment publish quality / completeness
- intro-to-interview conversion
- interview-to-decision cycle time
- engagement verification completion rate

---

## 11. Product acceptance summary

This PRD is considered aligned when:

- individual onboarding explicitly includes private scaffolding and proof anchoring
- Proof Pack is treated as the canonical proof object across all user-facing flows
- org workflow includes an explicit interview-to-hire corridor
- engagement types are normalized to one field with four supported values
- privacy and reveal rules are consistent across all surfaces
- scoped verification semantics replace loose trust inflation
- excluded legacy modules remain out of MVP scope

---

## 12. Final PRD statement

Proofound MVP is a narrow, proof-first hiring credibility corridor centered on Proof Packs.

It helps individuals turn real work into structured Proof Packs and publish a trustworthy proof portfolio.
It helps organizations define stronger assignments and review candidates through privacy-safe, explainable proof-backed early review.
It includes private contextual scaffolding, bounded verification, and an explicit hiring-to-engagement flow.
