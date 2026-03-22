# Proofound MVP Launch Runbook — Aligned Rewrite

**Status:** Aligned rewrite for current MVP  
**Date:** 2026-03-11  
**Audience:** Engineering, ops, QA, founder, product  
**Authority:** This is the active launch runbook beneath `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`, `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`, and `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`. `Proofound_Project_Specification_2026-03-11.md` is reference-only context and must not broaden this runbook.

---

## 0. Purpose and operating posture

This runbook defines how the Proofound MVP is launched and operated safely.

It assumes:

- a narrow MVP corridor
- pilot-stage usage and manual oversight where needed
- privacy and trust protections as launch-critical gates
- no ATS / HRIS integration at launch
- no attempt to pretend the market is dense when supply or review quality is thin

### Operating principles

- Protect proof integrity before chasing throughput.
- Protect privacy before chasing convenience.
- Protect assignment quality before chasing posting volume.
- Prefer manual intervention over unsafe automation during launch.
- Keep the product corridor honest: portfolio-ready can be easy, intro-eligible cannot be cheapened.

---

## 1. Roles and ownership

### 1.1 Core operating roles

- **Incident owner** — accountable for live incident coordination
- **Technical lead** — investigates code, data, infrastructure, and security issues
- **Product / ops lead** — decides user-facing fallback behavior and manual interventions
- **Support / verification lead** — manages verification queue, trust escalations, and user communications

### 1.2 Manual review queues

Manual queues are expected in MVP for:

- proof items flagged by ingest or redaction risk
- verification requests requiring human handling
- privacy / reveal disputes
- sensitive assignment or candidate complaints
- engagement verification edge cases

---

## 2. Launch-blocking gates

The product must not launch broadly until all launch-blocking gates pass.

### 2.1 Product and scope gates

- the shipped product matches the active Project Specification scope
- no excluded org modules are active in launch UI
- no public candidate directory exists
- no vanity counters or public popularity surfaces exist
- ATS / HRIS integrations are not active in launch flow

### 2.2 Privacy and trust gates

- blind-by-default review is enforced in production
- reveal requires candidate consent for identity-bearing access
- public portfolio rendering does not leak private or review-stage-only information
- file metadata and filenames do not leak sensitive information across public or review surfaces
- scoped verification language is honest and conservative
- stale or contradicted verification cannot continue to lift trust invisibly

### 2.3 Workflow gates

- assignment create / edit / publish works end to end
- review queue respects privacy stages
- intro request and duplicate-intro guard work correctly
- reveal request and timeout behavior work correctly
- interview scheduling and reschedule behavior work correctly
- decision states include explicit hire support
- engagement verification path exists and is auditable
- export / delete work correctly

### 2.4 Technical and operational gates

- backups and restore checks have been run
- critical alerts are configured
- smoke tests pass on staging and production candidate builds
- transactional email for workflow-critical messages is functional
- manual ops queues are staffed and documented

---

## 3. Smoke-test matrix

Minimum smoke coverage before launch and after every production deployment:

### 3.1 Individual corridor

- create account and safe shell
- add one context item
- create one Proof Pack with one proof item
- request verification
- publish public portfolio
- progress to readiness checkpoint
- accept / decline reveal request
- receive decision and candidate-visible feedback
- export data
- delete account

### 3.2 Organization corridor

- create org account and trust page
- invite collaborator with allowed role
- create assignment draft
- publish assignment
- review privacy-safe candidates
- request intro
- request reveal
- schedule and reschedule interview
- record decision including `hire`
- record engagement verification

### 3.3 Trust / privacy corridor

- confirm no identity leakage at Stage 0 and Stage 1 review
- confirm public portfolio does not override review-stage hiding
- confirm email notifications do not expose hidden information
- confirm quarantined / risky proof items do not render unsafely

---

## 4. Fallback states and safe mode

### 4.1 Canonical fallback states

Use explicit fallback states rather than silent degradation.

Supported fallback modes:

- `browse_only_low_candidate_supply`
- `proof_building_weak_coverage`
- `fairness_suppressed_ranking`
- `intro_hold_insufficient_qualified_intros`
- `manual_verification_only`
- `reveal_hold_privacy_review`

### 4.2 Safe mode actions

Safe mode may:

- pause new intros
- hold reveals pending manual review
- suppress exact ranking and show rank bands or unordered review
- require manual verification review before certain proof becomes review-visible
- route risky assignments or proof into ops handling

### 4.3 Fallback rules

- never fake density if supply quality is weak
- never auto-reveal to preserve flow speed
- never promote weak proof as strong trust just to keep conversion up
- when in doubt, degrade gracefully toward caution and manual review

---

## 5. Monitoring and alerts

### 5.1 Critical-path monitoring

Monitor these paths continuously:

- auth and session health
- proof upload and ingest
- public portfolio rendering
- assignment publishing
- review queue actions
- intro creation and expiry
- reveal request and approval
- interview scheduling
- decision recording
- engagement verification recording
- export and delete

### 5.2 Critical alert categories

- auth outage or login failure spikes
- storage / upload failure spikes
- transactional email failures for workflow-critical messages
- privacy leak or policy-violation detection
- failed lifecycle transitions on intro / reveal / interview / decision paths
- backup / restore failures

### 5.3 SLO posture

MVP SLOs should stay pragmatic and protect user trust:

- core flows should remain available and predictable during pilot operation
- critical privacy and workflow incidents are treated as urgent even if volume is small
- manual review backlog must be visible and owned

---

## 6. Incident response and rollback

### 6.1 Incident classes

- **Class A** — privacy leak, identity leak, data corruption, broken reveal controls, destructive export/delete failure
- **Class B** — broken candidate or org workflow, email delivery failure on critical path, assignment publish failure, severe ingest failure
- **Class C** — degraded UX, non-critical analytics issues, minor admin-tool failures

### 6.2 Rollback triggers

Immediate rollback or feature disable is required when:

- blind review is broken
- reveal grants identity without consent
- public portfolio leaks private fields
- destructive data operations are unsafe
- core intro / interview / decision corridor is unreliable

### 6.3 Standard incident steps

1. classify incident
2. stop or isolate unsafe behavior
3. move affected flow into fallback or safe mode
4. investigate root cause
5. patch or rollback
6. verify staging + production fix with smoke tests
7. document incident and follow-up actions

---

## 7. Backup, restore, and deployment verification

### 7.1 Backup discipline

- production backups must run on schedule
- restore drill must be proven before broad launch
- destructive migrations must have rollback plan and verification checklist

### 7.2 Deployment verification

After every production deployment:

- run smoke tests for both individual and organization corridors
- confirm public portfolio rendering
- confirm proof ingest health
- confirm one full intro → reveal → interview → decision path
- confirm alerts and queue health remain normal

---

## 8. Post-launch review

After launch, review at a fixed cadence:

- proof quality and trust-anchor coverage
- readiness progression and activation drop-offs
- assignment quality and publish completeness
- intro-to-interview conversion
- interview-to-decision cycle time
- engagement verification completion
- privacy incidents, reveal friction, and manual ops load

Use post-launch review to strengthen trust and clarity, not to reintroduce excluded MVP scope.

---

## 9. Explicit non-launch items

The runbook must not assume launch support for:

- ATS integrations
- HRIS / payroll / contract-signing systems
- reviewer marketplace operations
- sponsor / bounty marketplace operations
- enterprise org analytics suites
- public candidate browsing

---

## 10. Final runbook statement

The Proofound MVP should be operated as a narrow, trust-sensitive, manually supervised launch corridor.

If speed, automation, or apparent growth conflicts with proof integrity, privacy, or assignment quality, the trust-preserving option wins.
