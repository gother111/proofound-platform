> Doc Class: `active`
> Last Verified: `2026-03-10`

# Proofound MVP Launch Runbook

**Version:** 2.0  
**Last Updated:** March 10, 2026  
**Document Owner:** Product Owner and Technical Lead  
**Purpose:** Operator-facing launch, fallback, incident, and rollback runbook for the proof-first MVP

---

## 0. Canonical Override

Source precedence for this runbook:

1. `PRD_for_a_web_platform_MVP.master-latest.md`
2. `docs/launch-operations-mvp.md`
3. `PRD_TECHNICAL_REQUIREMENTS.md` Section 7
4. This runbook

This runbook is an execution summary of the canonical launch contract. It must not override the master PRD on product behavior, visibility, reveal, deletion, fallback, or rollout scope.

### MVP-safe operating principles

- Proof-first, portfolio-first, privacy-first, bias-aware, explainable, and calm by design.
- Do not pretend the market is dense when it is not.
- Do not hide weak shortlist states behind loading, silence, or false confidence.
- Keep public portfolio value, browse-safe review, export, delete, and unpublish available even when intros are paused.
- Treat fallback states, fairness suppression, and intro hold as protected states, not bugs to conceal.

---

## 1. Roles and Ownership

### Incident ownership

| Area                                                        | Owner                       | Default SLA                                     |
| ----------------------------------------------------------- | --------------------------- | ----------------------------------------------- |
| `P1` and `P2` technical incidents                           | Engineering on-call         | `P1` acknowledge in 15 minutes, `P2` in 4 hours |
| Thin-market triage, feedback quality, fallback-state review | Product or operations owner | 1 business day                                  |
| Verification manual queue, disputes, trust-tier review      | Trust Ops                   | 1 business day                                  |

### Core operating roles

- Engineering on-call:
  - auth, token redemption, portfolio rendering, export, delete/unpublish, deploy rollback, queue health
- Product or operations owner:
  - pilot coordination, assignment-quality triage, fallback-state review, structured feedback quality
- Trust Ops:
  - verification review, dispute review, trust-tier changes, audited admin interventions

### Manual review queues

- `verification_pending_manual`
- `intro_hold`
- `fairness_remediation`
- `thin_assignment_supply`
- `thin_candidate_supply`
- `feedback_pending`

---

## 2. Pre-Launch Gates

Launch is blocked by failures on trust-critical and privacy-critical flows. It is not blocked by every optional feature or post-MVP corridor.

### Launch-blocking gates

- Signup and login work end to end.
- Public portfolio publish and render work with correct visibility and metadata.
- Assignment publish works or returns explicit block reasons.
- Shortlist generation works and shows named fallback states when quality is low.
- Invite or token redemption succeeds once and fails closed on replay.
- Verification request path records pending state correctly.
- Structured feedback submission stores required fields and clears due state.
- Export generation works or fails safely.
- Delete or unpublish removes public projections and triggers invalidation.
- Sensitive actions write audit logs.
- No privacy or visibility regression exists on core flows.

### Monitored but not launch-blocking

- Wider analytics completeness beyond required launch thresholds
- Reviewer and sponsor alpha corridors
- Non-core dashboard experiments

### Smoke-test matrix

| Flow                 | Required result                                                 |
| -------------------- | --------------------------------------------------------------- |
| Signup / auth        | account creation or login succeeds, session established         |
| Portfolio publish    | route resolves with correct visibility and metadata             |
| Assignment publish   | assignment reaches live eligible state or explicit block reason |
| Match shortlist      | shortlist or named fallback state appears, never silent empty   |
| Invite redemption    | token redeems once, scoped action succeeds                      |
| Verification request | request recorded and pending state visible                      |
| Feedback submission  | structured feedback stored and due state cleared                |
| Export               | requested export generated or safely failed                     |
| Delete / unpublish   | object removed from public projection and cache invalidated     |

---

## 3. Rollout Corridor

This runbook follows the canonical 12-week rollout corridor. Older beta-wave, waitlist, and social-growth plans are deprecated.

| Window     | Classification           | Focus                                                                                                                         |
| ---------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Weeks 1-4  | launch-blocking          | memberships, visibility, permissions, token security, upload quarantine, structured feedback, reconciliation, launch monitors |
| Weeks 5-8  | early post-launch        | curated org pilots, first public events or missions, public-safe case studies, thin-market fallback tuning                    |
| Weeks 9-12 | later expansion corridor | reviewer network incubation, university first-proof corridor, employer pilot corridor, sponsor and bounty alpha readiness     |

### Pilot assumptions

- 3 to 5 early organization partners
- 30 to 75 initial individuals across proof-ready and first-proof cohorts
- 1 to 2 flagship Events or Missions
- No public candidate directory
- No ATS or HRIS integration
- No dense-market launch claims

---

## 4. Fallback and Safe Mode

### Canonical fallback states

- `browse_only_low_candidate_supply`
- `browse_only_low_assignment_supply`
- `proof_building_weak_coverage`
- `trust_pending_verification`
- `fairness_suppressed_ranking`
- `intro_hold_insufficient_qualified_intros`

### Fallback rules

- Never hide an empty or weak shortlist state.
- Keep browse-safe review live when intros are paused.
- Show near-threshold or fallback lanes only within the canonical fallback contract.
- Do not widen reveal, ranking precision, or intro behavior to compensate for thin supply.
- Next-best-action copy must stay calm and operational.

### Safe mode

Enable safe mode when trust, privacy, or launch-critical correctness is at risk.

Safe mode actions:

- kill new intros
- force rank-band mode
- keep portfolio, share, export, delete, and unpublish live
- disable pilot-only features
- preserve privacy and reveal boundaries

---

## 5. Monitoring, SLOs, and Alerts

### Synthetic monitors

Required launch monitors:

- `/`
- `/login`
- `/api/health`
- public portfolio render
- assignment publish path
- shortlist path
- invite redemption path
- verification request path
- feedback submission path
- export path
- delete or unpublish path

### Monitor severity

- `P1`: auth, token redemption, portfolio render, export, delete, unpublish
- `P2`: shortlist, verification queue, feedback, assignment publish
- `P3`: monitor drift or high fallback volume without user-visible breakage

### SLO and alert contract

Launch SLOs:

- core auth and portfolio availability: `99.5%`
- export and delete successful completion: `99%`
- public cache invalidation after delete or withdraw: `5 minutes` p95

Alert thresholds:

- 2 consecutive `P1` monitor failures within 5 minutes
- 3 consecutive `P2` monitor failures within 15 minutes
- verification or feedback queue backlog older than 24 hours
- public cache invalidation lag above 5 minutes p95

### Critical-path tracing

Trace end to end:

- auth
- invite redemption
- portfolio publish
- shortlist generation
- feedback submission
- export
- delete or unpublish

Required trace dimensions:

- request id
- principal id or system actor
- object refs
- outcome state
- latency
- failure class

---

## 6. Incident Response and Rollback

### Incident classes

| Severity | Definition                                              | Examples                                                                                    |
| -------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `P1`     | trust-critical or privacy-critical user-visible failure | auth broken, token redemption broken, deleted content still public, wrong export visibility |
| `P2`     | degraded but safe flow                                  | shortlist degraded, verification backlog, feedback queue stalled                            |
| `P3`     | operational pressure without core correctness failure   | thin-market fallback volume high, monitor drift, queue growth below breach level            |

### Rollback triggers

Rollback immediately when:

- auth or token redemption breaks
- public deleted or withdrawn content remains visible
- export returns the wrong visibility projection
- shortlist leaks identity or bypasses fairness-safe fallback
- audit logging fails on sensitive actions

Monitor before rollback when:

- analytics ETL drifts without user-visible correctness issues
- optional provider integrations degrade while manual fallback remains safe

### Standard incident steps

1. Acknowledge the incident and classify severity.
2. Confirm whether the failure is user-visible, privacy-impacting, or trust-impacting.
3. Put the relevant corridor into safe mode if needed.
4. Check traces, recent deploys, queue health, and visibility-sensitive surfaces.
5. Restore correct behavior or roll back.
6. Re-run the smoke-test matrix for the affected flow.
7. Log the incident, owner, root cause, and follow-up action.

### Destructive-data incident guidance

Examples:

- accidental internal deletion of records
- unsafe depublish or visibility regression
- broken reconciliation after delete or withdraw

Rules:

- Do not treat soft delete as the user-facing recovery model.
- Use the reconciliation ledger and audit trail to understand what changed.
- Invalidate public caches immediately.
- Cancel in-flight exports if a confirmed delete requires it.
- Restore from backup only for true platform incidents, not to undo a normal user-initiated delete workflow.
- Record the incident outcome and prevention action in terms of audited destructive-action controls, not delayed-delete product states.

---

## 7. Backup, Restore, and Deployment Verification

### Backup and restore discipline

- Keep regular Supabase backups enabled.
- Verify restore procedure on a safe environment at a recurring cadence.
- After restore testing, validate:
  - row counts on key tables
  - auth and session behavior
  - portfolio rendering
  - shortlist generation
  - export and delete/unpublish paths

### Deployment verification

Before production deploy:

- confirm environment variables are present
- confirm migrations, if any, are reviewed and applied through the canonical path
- confirm smoke-test coverage is ready for the affected flows

After production deploy:

- verify auth
- verify public portfolio render
- verify assignment publish
- verify shortlist generation or named fallback state
- verify token redemption
- verify export
- verify delete or unpublish
- verify no unexpected audit-log gaps

---

## 8. Post-Launch Review

Review within the first business day after launch and then weekly during the rollout corridor.

Required review topics:

- monitor failures and alert noise
- queue depth and stale-state counts
- fallback-state volume and time-in-state
- structured feedback completion and SLA breaches
- verification dispute backlog
- privacy, visibility, export, or deletion incidents
- pilot learnings that require narrowing or clarifying docs

Outcomes:

- fix launch-blocking regressions first
- document verified operator learnings
- keep non-canonical growth or marketplace assumptions out of active launch docs

---

## 9. Canonical Change Log

| Date       | Version | Notes                                                                                                                |
| ---------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| 2026-03-10 | 2.0     | Rewrote the runbook to align with the canonical master PRD, Block 9 launch operations, and March 2026 audit findings |
| 2026-03-08 | 1.1     | Prior runbook revision                                                                                               |
| 2025-11-05 | 1.0     | Initial runbook created                                                                                              |
