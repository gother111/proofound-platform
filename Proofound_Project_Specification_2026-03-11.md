# Proofound Project Specification — MVP Build Specification

**Status:** Project specification for implementation  
**Date:** 2026-03-11  
**Audience:** Founder, product, design, engineering, QA, ops  
**Purpose:** Provide one practical implementation-oriented specification that bridges product definition and technical execution.

---

## 1. Project overview

Proofound MVP is a proof-first, privacy-first, portfolio-first hiring and credibility corridor.

The system has two user sides:

- **individuals** who turn real work into structured proof and publish a trustworthy portfolio
- **organizations** that define clearer assignments and review people through privacy-safe, explainable proof

This is not a full recruiting suite, not a public social network, and not an ATS replacement.

---

## 2. Core product goals

### 2.1 Goals

- help users show real capability through proof rather than profile theater
- help organizations define better hiring inputs through structured assignments
- make early review privacy-safe and explainable
- make trust signals scoped, honest, and auditable
- keep the product calm, practical, and launchable

### 2.2 Non-goals

- generic recruiting administration
- open candidate marketplace at launch
- enterprise workflow suite
- ATS/HRIS replacement
- vanity growth mechanics

---

## 3. Target users

### 3.1 Individuals

Best early-fit users:

- career switchers
- early-career builders with projects
- immigrants / internationally mobile workers
- freelancers / consultants transitioning to longer-term work
- operators with strong work history but weak résumé signal

### 3.2 Organizations

Best early-fit organizations:

- NGOs
- startups
- SMEs
- accelerators / schools / programs
- lean hiring teams for project- or outcome-shaped roles

---

## 4. Product modules

### 4.1 Individual modules

- profile shell
- private context module
  - work
  - volunteering
  - education / learning
- Proof Pack module
- artifact upload/link module
- skills and outcomes mapping
- verification request module
- public portfolio module
- opportunities/match preview module
- process module
  - intros
  - reveals
  - interviews
  - decisions
- settings module
  - privacy
  - export / delete

### 4.2 Organization modules

- organization account and trust page
- team and role management
- assignment builder
- internal assignment review
- review queue
- intro and reveal management
- interview coordination
- decision recording
- engagement verification
- settings / audit view

### 4.3 Internal ops modules

- verification queue
- trust correction/revocation queue
- privacy/reveal exception queue
- pilot ops queue

---

## 5. Canonical objects

### 5.1 Individual-side objects

- profile
- experience
- volunteering
- education
- skill
- Proof Pack
- proof artifact
- verification record
- public portfolio
- match preferences
- process history
- engagement verification record

### 5.2 Organization-side objects

- organization
- organization membership
- trust page
- assignment
- match
- review record
- intro request
- reveal request
- interview
- decision
- engagement verification record

### 5.3 Shared objects

- reason code
- audit log
- visibility state
- tokenized share / invite / attestation objects

---

## 6. Canonical user roles

### 6.1 Individual

Owns profile, proof, visibility, verification requests, publication, reveal approvals, export, and deletion.

### 6.2 Organization

Supported roles:

- `org_owner`
- `org_manager`
- `org_reviewer`

Real-world mapping:

- HR / recruiter → `org_manager`
- hiring manager → `org_manager` or `org_reviewer`
- executive sponsor → `org_reviewer`
- future teammate / peer → `org_reviewer`

### 6.3 Internal ops

- trust ops
- admin / pilot ops

---

## 7. Product rules to protect

1. Proof Pack is the canonical proof object.
2. Publicly, the product is proof-first.
3. Privately, the product stores contextual scaffolding.
4. Blind-by-default review is mandatory.
5. Identity reveal requires candidate consent.
6. Public publication is separate from matching reveal.
7. Skills must be tied to proof or context.
8. Intro-eligible must be harder than portfolio-ready.
9. Verification is claim-scoped, not global.
10. No vanity counters or public popularity mechanics.

---

## 8. Individual flow specification

### 8.1 First-session flow

1. create account
2. create safe profile shell
3. add one real context
4. add 1–3 proofs
5. turn proof into structured Proof Packs
6. request useful verification
7. publish public portfolio
8. see readiness checklist

### 8.2 Profile shell fields

Required:

- display name
- handle
- headline
- broad location/timezone
- target role/focus area
- engagement type
- work preferences

### 8.3 Private context fields

#### Work

- organization name
- role/title
- timeframe
- short context
- one concrete project/outcome/responsibility

#### Volunteering

- organization/community
- role
- cause area
- timeframe
- one concrete contribution

#### Education / learning

- institution/program
- learning label
- timeframe
- one project or learning result if available

### 8.4 Proof Pack fields

Required:

- title
- short claim
- primary anchor context
- ownership statement
- timeframe
- outcomes
- linked skills
- evidence items
- visibility
- freshness state
- verification state
- schema version

### 8.5 Individual readiness states

- portfolio-ready
- discoverable
- match-visible
- intro-eligible
- strongly trusted (optional / derived)

### 8.6 Individual UI priorities

Show prominently:

- proof summaries
- outcomes
- trust state
- freshness
- next step to improve readiness

Do not center:

- big résumé forms
- social proof counts
- noisy dashboards

---

## 9. Organization flow specification

### 9.1 First-session flow

1. create organization
2. create trust page
3. invite collaborators
4. create assignment
5. publish assignment
6. review anonymized candidates
7. move candidate through intro → reveal → interview → decision
8. record engagement verification

### 9.2 Organization trust page fields

Required:

- organization name
- mission / short purpose
- why join / why the work matters
- essential operating context
- org verification path

### 9.3 Assignment builder flow

#### Step 1 — Why this role exists

Capture:

- business or organizational value to be created
- why the hire matters now

#### Step 2 — What work will actually be done

Capture:

- responsibilities
- deliverables
- expected outcomes

#### Step 3 — What proof would convince you

Capture:

- must-have skills
- proof expectations
- optional verification gates

#### Step 4 — Practical constraints

Capture:

- engagement type
- location / timezone
- timing
- compensation posture if included

#### Step 5 — Internal review and publish

Support:

- lightweight comments
- second reviewer if needed
- publish action

### 9.4 Hiring corridor

1. shortlist
2. intro request
3. candidate intro acceptance
4. reveal request
5. candidate reveal approval
6. interview round(s)
7. final decision
8. engagement recorded
9. engagement verified
10. optional proof issuance/update

### 9.5 Supported decision states

- advance
- hold
- reject
- hire / engage
- withdraw

### 9.6 Supported engagement types

- full-time
- part-time
- contract / consulting
- fractional / project

All use the same corridor.

---

## 10. Skills and verification specification

### 10.1 Skill model

Skills are not self-claimed hero objects. They are:

- derived from proof
- supported by context
- enriched by verification

### 10.2 Evidence classes

- artifact-backed
- credential-backed
- human-observed
- context-backed

### 10.3 Supported interpersonal skills

Initial bounded set:

- communication
- collaboration
- conflict resolution
- leadership
- adaptability
- reliability
- professional judgment
- language ability

### 10.4 Interpersonal-skill attestation rules

Each attestation must include:

- verifier identity/reference
- relationship to the user
- where they worked together
- duration of observation
- recency of observation
- skill(s) being attested to
- concrete observed behavior
- confidence level
- conflict / bias disclosure if relevant

Rules:

- max 2–3 skills per attestation
- no generic praise
- no anonymous endorsements
- no public counts
- weight below strong artifact-backed proof

### 10.5 Verification types

- self-claimed
- peer-attested
- org-verified
- human-reviewed
- auto-checks-passed

### 10.6 Verification freshness states

- active
- stale
- expired
- contradicted
- revoked
- corrected

### 10.7 Engagement verification

Accepted evidence examples:

- mutual attestation from both sides
- offer letter / agreement / SOW / invoice
- matching org + candidate confirmation

This is a trust state, not legal contract enforcement.

---

## 11. Privacy and visibility specification

### 11.1 Reveal stages

- stage0_anonymous
- stage1_capability_and_proof
- stage2_contextual_reveal
- stage3_intro_approved
- stage4_interview_coordination

### 11.2 Core rules

- identity-bearing data hidden in early review
- public portfolios do not weaken blind review
- candidate approval required before identity-bearing reveal
- narrowest-wins visibility logic enforced everywhere
- public portfolios non-indexed by default
- no public people directory

### 11.3 Redaction and sanitation

Manual uploads and previews must be sanitized or held if they contain:

- names
- faces
- org names
- school names
- metadata
- filenames
- screenshots with hidden PII

---

## 12. Page-level specification

### 12.1 Public pages

- individual portfolio page
- organization trust page
- assignment page

### 12.2 Individual app pages

- home
- work / volunteering / education
- Proof Packs
- verification
- portfolio
- opportunities
- process
- privacy settings
- export/delete settings

### 12.3 Organization app pages

- home
- trust page
- team & roles
- assignments
- review queue
- hiring process
- settings / audit

### 12.4 Internal ops pages

- verification queue
- trust & safety queue
- pilot ops queue
- revocation/correction queue

---

## 13. Non-functional specification

### 13.1 Security

- TLS in transit
- encryption at rest
- deny-by-default authorization
- immutable audit logging for sensitive actions
- secure file upload and scanning
- secure token handling

### 13.2 Reliability

- daily backups
- restore drill readiness
- queue retries
- smoke-testable critical path

### 13.3 Accessibility

- semantic and keyboard-safe workflows
- accessible form labels and feedback
- accessible reveal / review / interview controls

### 13.4 Performance

- responsive primary creation and review flows
- queued handling for heavy file/verification work

---

## 14. Explicit exclusions

Do not build in MVP:

- ATS / HRIS / payroll / contract-signing integrations
- reviewer marketplace UI
- sponsor marketplace UI
- enterprise dashboards
- org structure/culture/impact/projects hubs
- public candidate search index
- vanity counters
- gamified profile maintenance
- Zen expansion beyond optional private reflections/check-ins

---

## 15. Launch acceptance criteria

The MVP is launchable only if:

- proof creation, privacy, and reveal rules work reliably
- portfolio-ready and intro-eligible are clearly distinct
- private context scaffolding is present and usable
- skills are anchored to proof or context
- verification is scoped and auditable
- assignment creation is structured and outcome-focused
- hiring corridor reaches explicit `hire` and engagement verification states
- public portfolio and blind review remain separate systems

---

## 16. Suggested implementation phases

### Phase 1 — Foundation

- auth and roles
- profile shell
- private context objects
- Proof Pack model
- visibility model
- public portfolio basics

### Phase 2 — Trust and review

- verification records
- interpersonal-skill attestation v1
- assignment builder
- anonymized review queue
- reason codes

### Phase 3 — Hiring corridor

- intro and reveal
- interview states
- decision states
- engagement verification
- audit and ops polish

### Phase 4 — Pilot hardening

- smoke-test coverage
- backup/restore validation
- queue hardening
- ops dashboards for critical queues only

---

## 17. Final project statement

Build Proofound MVP as a narrow, proof-first, privacy-safe hiring and credibility corridor.

Do not expand it into generic recruiting SaaS. Do not dilute proof into unsupported profile claims. Do not weaken privacy for convenience. Keep the system simple enough to launch and strong enough to be trusted.
