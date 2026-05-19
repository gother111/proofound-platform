# Proofound MVP — Locked Source of Truth

> Doc Class: `active`
> Last Verified: `2026-05-19`

**Status:** Locked for MVP planning and implementation  
**Date:** 2026-03-11  
**Audience:** Founder, product, design, engineering, GTM, QA, ops  
**Purpose:** This document replaces ambiguity with a single current definition of the Proofound MVP.

## 0. Document authority and precedence

This document is the current source of truth for the MVP.

When this document conflicts with older narrative, exploratory, audit, or implementation-adjacent material, this document wins.

Precedence order:

1. `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
2. `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md` for launch-bound product behavior
3. `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md` for implementation and technical requirements
4. `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md` for operating guidance only
5. `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md` for market framing and launch messaging only
6. Fresh repo-grounded audits and evidence for current-state verification only

`Proofound_Project_Specification_2026-03-11.md` is preserved reference context. It must not broaden or outrank the active stack above.

### AI assistive layer note

The MVP may include an optional, button-click assistive AI layer only where it directly strengthens Proof Pack clarity, assignment clarity, claim-scoped verification requests, or privacy preflight.

This AI layer is subordinate to the locked MVP. It does not change the product definition, wedge, trust model, privacy model, or launch boundaries.

The controlling addendum is:

- `docs/ai/Proofound_AI_Assistive_Layer_Source_Of_Truth_Addendum_2026-05-03.md`

If the AI addendum conflicts with this locked source of truth, this locked source of truth wins.

This document is intentionally narrower than the broader company vision. For MVP, Proofound is a proof-backed hiring credibility corridor centered on Proof Packs. The public portfolio is a selected output surface, not the product center.

---

## 1. What the MVP is

### 1.1 Exact purpose of the MVP

Proofound MVP is a **proof-first, privacy-first hiring credibility corridor** centered on **Proof Packs**.

It helps:

- individuals turn real work into structured Proof Packs and publish a trustworthy proof portfolio
- organizations define clearer assignments and review people through proof-backed, explainable, privacy-safe early review instead of CV theater

The MVP exists to solve a trust problem:

- candidates struggle to present credible capability without relying on weak résumé language, pedigree, or profile performance
- organizations struggle to distinguish real capability from polished self-claim, keyword stuffing, and AI-generated application noise

### 1.2 One-sentence product promise

**Proofound helps people turn real work into structured Proof Packs, and helps organizations review candidates through proof instead of profile theater.**

### 1.3 Core wedge

The MVP wedge is **portable proof of real work, reviewed in a blind-by-default and explainable way**.

The wedge is **not**:

- generic AI recruiting
- generic skills-based hiring
- a nicer public profile
- an ATS replacement

### 1.4 Target user groups included in MVP

#### Individuals

Primary early-fit individual users:

- career switchers
- early-career people with real projects but weak résumé signal
- immigrants or internationally mobile workers with credibility gaps in new markets
- freelancers or consultants moving toward longer-term work
- experienced operators or specialists who have real work to show but dislike CV / networking theater

#### Organizations

Primary early-fit organizations:

- mission-driven NGOs
- startups
- SMEs
- schools, accelerators, programs, or small hiring teams using lean workflows
- teams hiring for project-shaped, outcome-shaped, or credibility-sensitive roles

### 1.5 Minimum valuable experience for each user type

#### Individual minimum win

A new individual can:

- create a safe profile shell
- attach real proof to at least one real-life context
- publish a clean public proof-based portfolio link
- understand what is still needed to become match-visible and intro-eligible

#### Organization minimum win

A new organization can:

- publish a clean trust page
- create one strong assignment through a structured builder
- review privacy-safe proof-backed candidate summaries
- move one candidate through intro, reveal, interview, and decision

---

## 2. What the MVP is not

### 2.1 Intentionally excluded from MVP

The MVP is **not**:

- a general recruiting suite
- a full ATS
- an HRIS or payroll/onboarding system
- a project management platform
- a marketplace with broad two-sided liquidity at launch
- an enterprise admin suite
- a public people directory
- a social network or content feed
- a gamified profile product
- a mental-health product beyond optional private check-ins and reflections
- an AI candidate scoring, ranking, hiring recommendation, fit-verdict, or automated review decision product

### 2.2 Explicitly postponed to post-MVP or later

Post-MVP only:

- ATS integrations such as Teamtailor, Greenhouse, Lever, etc.
- HRIS, payroll, background check, DocuSign, and contract-enforcement integrations
- full reviewer marketplace
- full sponsor / bounty marketplace
- enterprise dashboards and broad org analytics
- org structure maps, culture hubs, project systems, or enterprise capability dashboards
- advanced multi-ATS sync, webhooks, and middleware behavior
- public searchable people index
- rich community / chapter / network features
- large-scale multi-language product expansion

### 2.3 Focus-protection boundaries

The following rules exist to prevent scope creep:

- The MVP ships one clean corridor for individuals and one clean corridor for organizations.
- The MVP emphasizes proof, trust, privacy, and matching clarity over breadth.
- Any feature that does not strengthen proof quality, trust, shareability, or review quality should be cut or postponed.
- Assistive AI is allowed only as optional support for proof quality, assignment clarity, verification wording, and privacy preflight. It must not introduce scoring, ranking, automated hiring recommendations, black-box review intelligence, or AI-first positioning.
- “Platform vision” is allowed in the data model and object model, but not as UI sprawl.

---

## 3. Core product definition

## 3.1 Canonical product model

Proofound MVP is built from four layers:

1. **Context layer**  
   Private real-life profile context: work experience, volunteering, education / learning.

2. **Proof layer**  
   Proof Packs and child evidence items: artifacts, links, files, outcomes, case fragments, credentials, engagement evidence.

3. **Capability layer**  
   Skills and role signals derived from or supported by proof and context.

4. **Verification layer**  
   Scoped verification, attestations, freshness, disputes, trust state, and engagement confirmation.

This means Proofound stays **proof-first in what it shows** while becoming **context-rich in what it stores**.

## 3.2 Canonical objects in MVP

### Individual-side objects

- Individual profile
- Work experience (private by default)
- Volunteering experience (private by default)
- Education / learning experience (private by default)
- Skill record
- Proof Pack
- Proof item / artifact
- Verification record
- Public portfolio page
- Matching preferences
- Intro / reveal / interview / decision history
- Engagement verification record

### Organization-side objects

- Organization account
- Organization trust profile
- Team membership and role assignment
- Assignment
- Candidate review record
- Intro request
- Reveal request
- Interview schedule and feedback
- Decision record
- Engagement verification record

### Shared workflow objects

- Match
- Reason code
- Audit log
- Visibility state
- Capability token / invite token / attestation token

---

## 4. Functional scope

## 4.1 Individual-side functionality included in MVP

Individuals can:

- sign up and create a profile shell
- set work preferences and engagement preferences
- add private work, volunteering, and education / learning context
- import or upload proof
- create and edit Proof Packs
- map skills and outcomes to proof
- control per-field and per-proof visibility
- request scoped verification or attestation
- publish a public portfolio link
- browse opportunities and private match previews
- become match-visible and later intro-eligible
- approve or reject reveal requests
- coordinate interviews
- receive decisions and feedback
- export their data and delete their account

## 4.2 Organization-side functionality included in MVP

Organizations can:

- create an organization account and org trust page
- invite internal collaborators using lightweight roles
- create and publish one assignment corridor
- define business value, outcomes, constraints, must-have skills, and proof expectations
- add narrow role-specific verification gates beyond the baseline profile-readiness threshold
- review privacy-safe matches and proof summaries
- shortlist, pass, request intro, request reveal, schedule interview, and record decision
- verify engagement outcome after a hire / contract / placement
- optionally issue or support new proof after a completed engagement
- export operationally relevant records

## 4.3 Shared product capabilities included in MVP

- blind-by-default review
- progressive reveal
- field-level visibility
- public portfolio pages for individuals and organizations
- explainable matching with reason codes
- proof freshness state
- scoped verification state
- audit logs for sensitive actions
- privacy-safe notifications and transactional emails
- manual ops support for verification and pilot coordination

---

## 5. Profile structure and private scaffolding

## 5.1 Public profile principle

Publicly, the product is **proof-first**.

The public portfolio is not a traditional résumé. It is a calm trust surface built around:

- headline
- high-level role focus
- selected Proof Packs
- selected outcomes
- selected verification summaries
- selected public-safe context

Minimum individual public-readiness threshold:

- one safe shell
- one real private context
- one anchored public-safe Proof Pack
- one accepted, clear, non-self verification tied to anchored proof or context
- an accessible public portfolio publication state

## 5.2 Private foundational scaffolding included from the beginning

The MVP includes three private contextual layers for individuals:

- **work experience**
- **volunteering experience**
- **education / learning experience**

These are part of the profile architecture from day one.

They are included because proofs alone can become disconnected evidence. Context is needed to answer:

- where the work happened
- in what role or capacity
- over what time period
- with what level of ownership
- in what real-world environment

These sections are **private by default** and are **not** intended to recreate a public résumé.

## 5.3 Minimum structure of each private layer

### Work experience

Minimum fields:

- organization name
- role / title
- start and end date or ongoing state
- short role context
- one concrete project, outcome, or responsibility

Optional later:

- collaborators
- key learnings
- broader achievements

### Volunteering experience

Minimum fields:

- organization or community name
- role
- cause / area
- timeframe
- one concrete contribution, project, or impact statement

### Education / learning experience

Minimum fields:

- institution / program / learning environment
- course / degree / credential / informal learning label
- timeframe
- one project, output, or practical learning result if available

## 5.4 How proof connects to these private layers

Rules:

- Every Proof Pack must have **one primary anchor context**.
- A Proof Pack may have secondary links, but one anchor is mandatory.
- Intro-eligible users must not have orphan Proof Packs with no real context.
- A proof can attach to:
  - a work experience
  - a volunteering experience
  - an education / learning experience
  - an assignment completed inside Proofound
  - a direct engagement verification record

Example:

- Work experience: Product Operations Manager at Company X
- Proof Pack: Reduced onboarding-related support tickets by 23%
- Child evidence: deck, workflow artifact, dashboard screenshot, manager attestation
- Linked skills: operations design, communication, analysis, stakeholder management

## 5.5 Why this scaffolding exists

The private scaffolding is included to make the profile:

- coherent
- trustworthy
- easier to review
- easier for the user to maintain
- more useful for matching and explanation

It is not included to bring back public résumé theater.

---

## 6. Proof system logic

## 6.1 Canonical proof object

The **Proof Pack** is the canonical proof object in the MVP.

The public portfolio is a selected publication surface derived from Proof Packs; it is not the core object.

Everything important should resolve back to Proof Packs:

- public portfolios
- match explanations
- org review cards
- intros
- verification records
- exports
- later integrations

## 6.2 Minimum Proof Pack structure

Each Proof Pack must be able to hold:

- title / label
- short claim or summary
- primary anchor context
- role / ownership statement
- timeframe
- outcomes or impact statement
- linked skills used
- linked evidence items
- verification state
- freshness state
- visibility state
- schema version / portability data

### Child evidence items may include

- file upload
- URL
- repo / commit / PR link
- case study excerpt
- slide / deck
- image or screenshot
- credential / certificate
- engagement evidence
- structured reviewer note

## 6.3 Proof quality model

The MVP uses a simple Proof Quality Score internally and, where helpful, in plain language externally.

The score is based on:

- **evidence** — is there enough concrete evidence?
- **outcomes** — is a real result or output described?
- **verification** — is there non-self trust support?
- **freshness** — how current is the proof?
- **clarity** — is the claim understandable and scoped?

The MVP must not treat “has an upload” as equal to “strong proof.”

## 6.4 Proof import model

MVP proof creation should support:

- upload
- paste link
- import from an existing work sample or credential URL
- attach proof created inside Proofound assignment flows

The first-session goal is to let users bring in 1–3 real proofs fast.

## 6.5 No loose artifact logic

Rules:

- Artifacts are child evidence, not the core object.
- Loose uploads do not count as strong signal by themselves.
- Skills cannot be “verified” by artifact count alone.
- A profile must not become intro-eligible through disconnected files and claims.

---

## 7. Skills logic

## 7.1 Skills stay in MVP

Skills remain part of the MVP because the product still needs to describe capability clearly.

But the MVP does **not** use skills as isolated self-claimed bullets.

## 7.2 Canonical skill rule

Skills are primarily:

- derived from proof
- supported by context
- enriched by verification

Skills are not the hero object. Proof is.

## 7.3 Skill evidence classes

Every skill should be supported by one or more evidence classes:

1. **Artifact-backed**  
   Direct proof exists through a real artifact, output, or demonstrable result.

2. **Credential-backed**  
   Supported by a course, license, assessment, certificate, or formal qualification.

3. **Human-observed**  
   Supported by a scoped attestation from someone who directly observed the user in practice.

4. **Context-backed**  
   Supported by role context or experience context, even if a public artifact is not available.

## 7.4 Skills that are hard to prove directly

The MVP explicitly supports a bounded set of universal / interpersonal skills that may rely more on human observation than direct artifact proof.

Initial supported examples:

- communication
- collaboration
- conflict resolution
- leadership
- adaptability
- reliability
- professional judgment
- language ability

These skills are allowed in MVP, but they must never become generic endorsement fluff.

## 7.5 Universal / interpersonal skill rules

Rules:

- A universal skill attestation must be scoped to specific observed behavior, not whole-person praise.
- Each attestation may cover a maximum of 2–3 skills.
- These skills may influence matching and review, but must be weighted below strong artifact-backed proof.
- The platform must not show public popularity counters, endorsement counts, or social proof vanity for these skills.

---

## 8. Verification logic

## 8.1 Verification principles

Verification in MVP is:

- scoped
- explainable
- attached to specific claims or facts
- freshness-aware
- privacy-safe

Verification is **not** global reputation magic.

## 8.2 Canonical verification types in MVP

### Self-claimed

The user entered the claim. No independent validation.

### Peer-attested

A scoped claim was attested by an eligible peer who directly observed the work.

### Org-verified

A scoped claim or relationship fact was verified by an authorized organization representative or trusted org-controlled channel.

### Human-reviewed

A scoped item was manually reviewed by Proofound trust operations or a controlled internal review lane.

### Auto-checks-passed

A machine-verifiable signal passed for that item.

## 8.3 Verification freshness states

Verification and trust signals may be:

- active
- stale
- expired
- contradicted
- revoked
- corrected

Stale or contradicted verification must not silently keep lifting trust.

## 8.4 Human verification model for universal / interpersonal skills

For a valid human-observed skill attestation, the verifier must provide:

- who they are
- relationship to the user
- where they worked together
- how long they observed the user
- how recently they observed the behavior
- which exact skill(s) they are attesting to
- which concrete behavior they directly observed
- confidence level
- conflict or bias disclosure where relevant

The UI should present this as **observed in practice**, not as a generic badge.

## 8.5 What is not acceptable verification in MVP

Not acceptable as strong verification:

- vague recommendation text
- generic “great person” praise
- social endorsements without context
- unlimited endorsement counts
- anonymous attestations
- a single click on an email link with no scoped statement

Email or token links are delivery mechanisms, not trust semantics by themselves.

## 8.6 Engagement verification

Engagement verification is distinct from the hiring decision.

Rules:

- `hire` or `engage` is an organization process state.
- `engagement verified` is a trust state.
- `Proof Pack issued` is a proof state.

Minimum acceptable MVP evidence for engagement verification:

- mutual attestation from both sides on the same engagement fact
- uploaded offer letter, signed agreement, SOW, invoice, or equivalent evidence
- matching org confirmation plus candidate confirmation

This is acceptable for MVP trust purposes, but it is **not** legal contract enforcement.

---

## 9. Privacy logic

## 9.1 Canonical privacy model

The MVP uses **blind-by-default progressive reveal**.

Canonical reveal stages:

- `stage0_anonymous`
- `stage1_capability_and_proof`
- `stage2_contextual_reveal`
- `stage3_intro_approved`
- `stage4_interview_coordination`

## 9.2 Core privacy rules

- Identity-bearing information is hidden in early review.
- Public portfolio publication does not weaken blind review.
- Candidate approval is required before identity-bearing reveal.
- Public route, handle, direct contact details, employer names, school names, and similar identity-bearing data must not leak during anonymous review stages.

## 9.3 Field-level visibility

Every field and proof object must respect field-level visibility.

The effective visibility rule is:

**narrowest applicable rule wins**

That means visibility is constrained by:

- parent object visibility
- child object visibility
- workflow reveal ceiling
- moderation / policy ceiling
- public-safety ceiling

## 9.4 Public portfolio rules

Public portfolios are:

- explicit publication surfaces
- separate from matching reveal
- shareable by direct link
- non-indexed by default in MVP

The MVP does **not** include:

- public people browse
- open candidate search index
- vanity counters or visible view counts

## 9.5 Redaction rules

Redaction is a supporting control, not a separate privacy system.

Redaction may hide or sanitize:

- names
- faces
- metadata
- file names
- org names
- identity-bearing screenshots

If a manually uploaded artifact contains identity-bearing metadata, it must be sanitized, withheld, or queued for later reveal.

---

## 10. Matching logic

## 10.1 Matching purpose

Matching exists to help each side reach better-fit introductions faster using stronger signal than CV filtering.

## 10.2 Matching inputs in MVP

Matching may consider:

- relevant skills
- proof strength
- outcomes and ownership
- freshness
- verification readiness
- availability and timing
- timezone / language fit
- purpose or mission fit where relevant
- engagement type fit
- policy or fairness constraints

## 10.3 Explainability rules

Every meaningful match decision must be explainable in plain language.

The MVP must provide reason-coded explanations such as:

- strong proof overlap
- role-relevant outcomes
- missing required proof
- constraint mismatch
- insufficient verification for gated intro
- fairness or policy suppression

The system must not depend on black-box ranking language.

## 10.4 Matching output policy

Early review may show:

- anonymized candidate label
- skill clusters
- proof summaries
- outcome summaries
- broad fit summaries
- trust-safe verification summaries
- fit band or rank band

Early review may **not** show:

- direct identity
- direct public portfolio route
- precise comp details unless allowed
- hidden context fields
- public contact routes

---

## 11. Readiness tiers and thresholds

## 11.1 Product rule to protect

**Make portfolio-ready narrow and verified. Make intro-eligible hard.**

## 11.2 Individual readiness tiers

### Portfolio-ready

Minimum:

- account created
- profile shell complete
- at least 1 Proof Pack
- at least 1 anchor context
- at least 1 accepted, clear, non-self verification tied to anchored proof or context
- public portfolio link live with safe defaults

### Discoverable

Minimum:

- portfolio-ready
- target role / focus area set
- engagement preferences saved

### Match-visible

Minimum:

- discoverable
- at least 3 relevant skills supported by proof or context
- at least 2 Proof Packs or 1 strong Proof Pack plus 1 contextual Proof Pack
- availability / practical constraints saved

### Intro-eligible

Minimum:

- match-visible
- at least 1 role-relevant fresh Proof Pack
- at least 1 active non-self trust anchor on a relevant proof, experience, or engagement fact
- no unresolved contradiction or policy block affecting the relevant role corridor

### Strongly trusted

Not required for MVP activation, but possible when proof quality, freshness, and verification coverage are materially stronger.

## 11.3 Organization readiness thresholds

### Org-ready

Minimum:

- org account created
- verified working org email or domain path
- public org trust page live

### Assignment-ready

Minimum:

- org-ready
- one assignment with business value, outcomes, must-have skills, and practical constraints

### Review-ready

Minimum:

- assignment-ready
- at least one active org owner or manager
- at least one reviewer assigned or owner acting as reviewer

---

## 12. Individual journey from zero to useful

## 12.1 First-time individual journey

### Step 1 — Create a safe profile shell

Collect only:

- name / display name
- handle
- headline
- broad location / timezone
- target role or focus area
- engagement type and work preferences

### Step 2 — Add one real context

Prompt the user to add at least one of:

- work experience
- volunteering experience
- education / learning experience

### Step 3 — Add 1–3 real proofs

Prompt the user to:

- upload
- paste a link
- import an existing proof
- attach a credential or case study

### Step 4 — Turn proof into structured proof

For each proof:

- summarize what it was
- define what the user did
- define outcomes
- link skills used
- link to the relevant context
- choose visibility

### Step 5 — Request required verification

Prompt for:

- org verification
- peer attestation
- human review lane
- auto-check where available

### Step 6 — Publish a public proof portfolio

The user gets a live shareable portfolio link with safe defaults.

### Step 7 — Progress toward intro eligibility

The user sees a plain-language checklist:

- add more relevant proof
- strengthen freshness
- request at least one non-self trust anchor
- complete constraints and availability

## 12.2 Empty-state rule

The empty state must say some version of:
**Add your first proof**

It must **not** center generic résumé completion.

---

## 13. Organization workflow

## 13.1 First-time organization journey

### Step 1 — Create organization and trust page

Collect only what is needed to make the org credible:

- org name
- verified work email / domain path
- mission / short purpose
- why join / why this work matters
- essential working context

### Step 2 — Invite internal collaborators

Use only three MVP roles:

- `org_owner`
- `org_manager`
- `org_reviewer`

Suggested real-world mapping:

- HR / recruiter → `org_manager`
- hiring manager → `org_manager` or `org_reviewer`
- executive sponsor → `org_reviewer` unless they need management permissions
- peer / future teammate → `org_reviewer`

### Step 3 — Create one assignment

The assignment builder is structured around clarity, not job-description fluff.

#### Assignment builder steps

1. **Why this role exists**  
   What business value or organizational value should this role create?

2. **What work will actually be done**  
   What responsibilities, deliverables, and outcomes matter?

3. **What proof would convince you**  
   What evidence, skills, or signals would make this candidate credible?

4. **What practical constraints apply**  
   Engagement type, location, timezone, timing, compensation posture if included.

5. **Internal review and publish**  
   Review, approve, and publish.

### Step 4 — Review privacy-safe matches

The org sees proof-backed, anonymized summaries.

### Step 5 — Move candidates through the hiring corridor

The org workflow is:

- shortlist
- intro request
- candidate intro acceptance
- reveal request
- candidate reveal approval
- interview round(s)
- final decision
- engagement record
- engagement verification
- optional proof issuance

---

## 14. Hiring logic and conclusion states

## 14.1 Hiring must be explicit in MVP

The MVP includes a clear hiring conclusion step.

Canonical org-side sequence:

1. Review privacy-safe candidate summaries
2. Shortlist
3. Request intro
4. Candidate accepts intro
5. Request reveal
6. Candidate approves reveal
7. Interview round 1
8. Interview round 2+ if needed
9. Final decision
10. Engagement recorded
11. Engagement verified
12. Optional proof issued / updated

## 14.2 Supported decision states

Minimum decision states:

- advance
- hold
- reject
- hire / engage
- withdraw

## 14.3 Supported engagement types

The MVP supports one structured field:

- full-time
- part-time
- contract / consulting
- fractional / project

These do **not** create separate products or separate end-to-end flows.

The same core corridor is used for all engagement types.

---

## 15. UX and UI logic

## 15.1 Experience principles

The product should feel:

- calm
- trustworthy
- uncluttered
- practical
- structured but not bureaucratic
- serious without feeling corporate-heavy

## 15.2 Interface design principles

- Proof comes before profile decoration.
- Public surfaces feel editorial and credible, not social or gamified.
- Match and review surfaces prioritize explanation, evidence, and clarity.
- Private scaffolding should support the user quietly instead of demanding résumé-like form filling.
- Empty states should direct users toward one concrete next action.
- Use plain language instead of internal jargon where possible.

## 15.3 Visual emphasis

The interface should visually emphasize:

- proof summaries
- outcomes
- ownership / role context
- freshness
- trust state
- privacy state
- assignment clarity

The interface should visually de-emphasize:

- raw counts
- vanity signals
- decorative dashboards
- noisy taxonomy depth

## 15.4 Information visibility rules in interface

### Public portfolio

Emphasize:

- selected proof
- selected outcomes
- selected trust summaries
- minimal identity and role framing

### Individual private workspace

Emphasize:

- proof creation
- private context scaffolding
- readiness checklist
- privacy controls
- verification progress

### Org trust page

Emphasize:

- mission / purpose
- what kind of work is being offered
- assignment quality
- review clarity

### Org review queue

Emphasize:

- anonymized proof summaries
- reason codes
- proof quality
- verification fit
- decision actions

## 15.5 Site map / platform map for MVP

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

## 15.6 What must not appear in MVP UI

Do not show in MVP UI:

- public view counts
- public endorsement counts
- streaks, leaderboards, or gamified loops
- open people discovery directory
- enterprise capability dashboarding
- org structure / culture / impact / projects operating-system surfaces
- marketplace storefronts for reviewers or sponsors
- large BI-style analytics surfaces

---

## 16. Organization assignment and stakeholder logic

## 16.1 Stakeholder involvement rule

The MVP supports multiple internal stakeholders, but in a lean way.

Do **not** build a complex enterprise approval matrix.

### Supported internal authoring pattern

- one owner or manager creates the assignment
- one additional manager or reviewer may review before publish
- optional reviewer comments are allowed
- executive or peer review is optional, not structurally required in the core flow

## 16.2 HR / manager / executive / peer support

The product should support those people participating through the lightweight role system, not through separate workflow engines.

### Recommended MVP mapping

- required author or approver: HR / recruiter or hiring manager
- second required author or approver: hiring manager or recruiter
- optional reviewer: executive sponsor
- optional reviewer: future teammate / peer

## 16.3 Assignment quality rule

The assignment builder must actively push organizations to answer:

- what actual value the hire should create
- what real outcomes matter
- what proof would count
- what practical constraints are real

The product must not let the role collapse into vague, generic job-description language without friction.

---

## 17. Hard constraints

The following rules are non-negotiable for MVP.

### 17.1 Proof-first rules

- Proof Pack is the canonical proof object.
- Public proof, match explanation, and org review must resolve back to proof.
- Skills must be linked to proof or context, not float as unsupported bullet points.
- Intro-eligible users must have at least one relevant non-self trust anchor.
- No orphan Proof Packs for intro-eligible users.

### 17.2 Privacy rules

- Blind-by-default review is mandatory.
- Progressive reveal is mandatory.
- Identity-bearing reveal requires candidate consent.
- Public publication must never override review-stage privacy.
- Field-level visibility and narrowest-wins must be enforced across all surfaces.
- PII must not leak via metadata, logs, analytics, filenames, or public rendering.

### 17.3 Trust and verification rules

- Verification is scoped, not global.
- Email is transport, not verification semantics.
- Public trust language must stay narrow and honest.
- Contradicted or stale verification must stop providing trust lift.
- Human-observed soft-skill attestations must stay structured and bounded.

### 17.4 UX rules

- Public portfolio-ready must stay narrow and require the minimum proof-plus-verification threshold.
- Intro-eligible must be harder.
- The first user action is “add proof,” not “complete your profile.”
- No vanity counters, public scoreboards, or gamified profile maintenance.
- The interface must stay calm, clear, and minimal.

### 17.5 Scope rules

- No ATS / HRIS / payroll / contract-signing integration in MVP.
- No enterprise org suite in MVP.
- No public candidate directory in MVP.
- No reviewer marketplace UI in MVP.
- No sponsor marketplace UI in MVP.
- No Zen expansion beyond optional private check-ins and reflections.
- No large analytics or dashboard sprawl in MVP.

### 17.6 Architectural / platform rules

- MVP must support exportability and future interoperability through a versioned proof schema.
- Privacy and auditability are launch-critical, not post-launch polish.
- Manual ops is acceptable in MVP where it strengthens trust or pilot control.
- The platform should be integration-ready later, but integrations are not launch scope.

---

## 18. MVP metrics and success signals

## 18.1 Primary launch priorities

The MVP should optimize first for:

1. proof creation
2. proof quality
3. first verified proof
4. shareability
5. proof-backed introductions

Hiring-speed theater must not outweigh trust quality in early product decisions.

## 18.2 Core operating metrics

Track at minimum:

- time to first portfolio-ready state
- time to first verified proof
- proof quality score distribution
- percentage of proof packs with active non-self trust anchors
- share-to-open rate on public portfolios
- time to first qualified intro
- assignment publish quality / completeness
- intro to interview conversion
- interview to decision cycle time
- engagement verification completion rate

---

## 19. What belongs post-MVP

Post-MVP priorities once the core corridor is working:

- one ATS integration corridor
- stronger export / handoff into existing hiring systems
- richer verification automation
- reviewer network expansion
- university or first-proof program productization
- sponsor / bounty rails
- broader employer analytics
- deeper trust automation and automation-assisted review

---

## 20. Documentation consolidation directives for Yuri

Use this section as the execution handoff for updating the current doc set.

### 20.1 Keep and strengthen

- Proof Pack as canonical object
- public proof-based portfolio
- org trust page
- structured assignment builder
- blind-by-default matching and reveal
- reason-coded matching
- interview and feedback lifecycle
- export / delete / privacy controls
- auditability
- private work / volunteering / education scaffolding
- scoped verification and engagement verification

### 20.2 Rewrite or tighten

- replace any skill-first activation language with proof-first, context-backed readiness
- replace weak “verification = email approval” language with scoped verification semantics
- add explicit hiring conclusion, engagement verification, and optional proof issuance
- add explicit support for multiple engagement types via one structured field
- add explicit universal / interpersonal skill attestation rules
- make public portfolio narrow and verified while keeping intro eligibility harder

### 20.3 Remove or move out of MVP

- org structure block
- culture block
- impact block
- projects block
- enterprise expertise hub
- company dashboard sprawl
- team hub as separate product surface
- broad templates and advanced enterprise authoring systems
- reviewer marketplace UI
- sponsor / bounty marketplace UI
- ATS / HRIS integrations
- vanity view counters
- Zen expansion beyond private optional check-ins and reflections

### 20.4 Update current docs so they no longer contradict this source-of-truth

Specific cleanup tasks:

- replace any “Lite = 3 skills + 1 proof overall” logic where it implies serious trust readiness
- delete or move broad org-surface requirements to post-MVP appendix
- delete any visible vanity metrics from public or owner-facing MVP surfaces
- remove any language that suggests public candidate browsing
- keep proof-first day-1 activation as the primary UX promise, with a fast portfolio output as the first visible reward
- ensure technical requirements and implementation tasks treat privacy / RLS proof as launch-critical

---

## 21. Final locked MVP statement

Proofound MVP is a narrow, proof-first hiring credibility corridor centered on Proof Packs.

It helps individuals turn real work into structured Proof Packs and publish a trustworthy proof portfolio.
It helps organizations define clearer assignments and review people through privacy-safe, explainable proof-backed early review.
It includes private contextual scaffolding, bounded verification, and an explicit intro-to-engagement corridor.
It excludes generic HR SaaS sprawl, public marketplace sprawl, vanity mechanics, and integration-heavy replacement ambitions.

That is the MVP to build.

---

## Appendix A. Controlled AI/OCR Rollout Boundary

This appendix does not change the locked MVP. It only records the allowed release boundary for optional assistive AI and the temporary OCR beta.

Production-eligible after gates:

- Proof Pack Assistant
- Assignment Clarity Assistant
- Verification Request Composer
- Privacy Preflight
- Suggestion Event Tracking

Gemini assistive AI may be production-eligible only after live model smoke, app-level hard caps, launch-status checks, privacy tests, and raw-prompt logging checks pass.

Invite-only production beta:

- Proof Artifact Text Extraction using Google Cloud Document AI OCR

The OCR beta is not CV import. OCR output is draft text only and must not auto-publish, auto-verify, auto-score, auto-rank, shortlist, recommend, or affect match, review, verification, reveal, trust-state, or hiring-decision state.

OCR requires explicit user consent per document and must be feature-flagged, invite-gated, page-limited, file-size-limited, spend-capped, and safe to disable. Google Cloud budgets are alerts only; hard caps must be enforced in app/service code. Cloud Run max instances starts at `1` and must not exceed `3` during beta.

The temporary Google Cloud credit window is expected to expire around `2026-08-03`; the disable-or-pay decision is due by `2026-07-24`.

Excluded:

- CV import wizard
- AI candidate scoring, ranking, shortlisting, suitability judgments, hiring recommendations, verification decisions, or trust-state decisions
- Gemini skill extractor for employer review
- taxonomy shortlist or reranker
- Cloud Vision OCR
- moving core infrastructure from Vercel/Supabase to Google Cloud

---

## Appendix B. Narrow Optional AI Addendum

This appendix does not rewrite the MVP definition. It only permits a small optional assistive layer inside the existing proof-first hiring corridor.

Allowed AI support is limited to:

- improving Proof Pack clarity
- improving assignment clarity
- drafting claim-scoped verification request wording for user review
- providing privacy preflight and redaction hints on short sanitized text
- reducing user friction inside existing MVP flows

AI must not:

- score, rank, shortlist, recommend, or compare candidates
- generate suitability judgments or fit verdicts
- make, automate, or influence hiring, reveal, verification, trust-state, or engagement decisions
- create trust lift, proof-quality lift, verification lift, or readiness lift from model output alone
- become product positioning or be marketed as an AI-led recruiting, screening, or hiring product

Required controls:

- provider abstraction, feature flag, and kill switch
- spend caps enforced in application or service code
- redaction and privacy rules before model invocation
- audit metadata for feature name, actor, object, provider, model, token count, cost, redaction summary, and fallback status
- deterministic fallback behavior when AI is disabled, unavailable, over budget, or unsafe
- no raw PII, private file content, original filenames, signed URLs, API keys, tokens, cookies, session IDs, or raw prompts in logs by default
- user review before any AI-assisted wording is saved, sent, or published
