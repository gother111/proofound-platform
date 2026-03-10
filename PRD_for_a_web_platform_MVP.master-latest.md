> Doc Class: `reference-spec`
> Last Verified: `2026-03-10`

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

### 1.5 Canonical Scope Cleanup and Legacy Section Reconciliation

#### Facts & Decisions

- The canonical MVP corridor is: Proofound MVP is a proof-first, portfolio-first, privacy-first corridor for creating proof, publishing public trust surfaces, verifying credibility, explaining matches, and moving both sides toward qualified intros.
- This section is a governance override for the full PRD, including later org, analytics, Zen, export, and monetization references.
- Source precedence for launch:
  - `PRD_for_a_web_platform_MVP.master-latest.md` defines canonical product behavior and scope.
  - `PRD_TECHNICAL_REQUIREMENTS.md` Section 7 defines the authoritative technical launch contract and hardening decisions.
  - `LAUNCH_RUNBOOK.md` is operator-facing execution guidance only and must not redefine product or technical behavior.
  - mirrored, archived, and executive-summary docs are reference-only and non-authoritative.
- Contradiction rule:
  - newer canonical section wins
  - older conflicting text is deprecated and must be removed, rewritten, or moved to a post-MVP appendix
  - historical language is reference-only and not launch-binding
- This section does not add scope. It removes ambiguity and prevents older narrative blocks from redefining MVP.

#### Legacy pattern resolutions

- **Micro-wins, streaks, and momentum loops**
  - Remove from MVP requirements.
  - If motivational copy remains, rewrite it as calm progress guidance with no loop, streak, score, badge, recovery mechanic, or retention mechanic.
- **Public profile or portfolio view counters**
  - Remove from owner-facing and public-facing product requirements.
  - Internal diagnostics may still count views operationally, but those counts must not appear as vanity surfaces.
- **Expanded Zen Hub or local-resource flows**
  - Keep Zen only in reduced form as optional private check-ins and reflections.
  - Move local-resource discovery, coaching, therapy-style flows, outbound wellbeing journeys, and similar resource-expansion behavior to post-MVP appendix material.
- **Org Structure, Culture, Projects, and Enterprise Expertise Hub bloat**
  - Remove as MVP requirements.
  - Rewrite surviving org-facing text to the lean org corridor already defined in this PRD:
    - trust profile
    - one assignment path
    - match review queue
    - minimal access
  - Move org maps, project libraries, expertise hubs, templates, heavy operations tooling, and enterprise-style admin surfaces to post-MVP appendix material.
- **Donor or investor export surfaces beyond launch needs**
  - Move to post-MVP appendix material.
  - Retain only canonical owner export and public-safe export already required for proof portability or public portfolio trust.
- **Premium-pack or purchase-journey assumptions**
  - Remove from canonical MVP unless directly required for launch.
  - If business context must remain in the document, move pricing, packaging, checkout, or purchase assumptions to a separate commercial appendix or post-MVP note rather than product requirements.

#### Deprecated / Moved / Retained

| Legacy section or pattern          | Disposition                       | Canonical replacement                                                                                                       |
| ---------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Micro-wins streaks                 | Deprecated                        | Calm progress guidance based on publication state, readiness state, trust state, or share state                             |
| Portfolio or profile counters      | Deprecated                        | Internal diagnostics only, never owner-facing or public-facing vanity metrics                                               |
| Expanded Zen Hub                   | Retained in reduced form          | Optional private check-ins and reflections only, excluded from ranking, reveal, public rendering, and user-facing analytics |
| Local-resource flows               | Moved to post-MVP appendix        | None in MVP beyond reduced Zen privacy rules                                                                                |
| Org Structure / Culture / Projects | Deprecated                        | Lean org trust profile plus one assignment path, match review queue, and minimal access                                     |
| Enterprise Expertise Hub           | Moved to post-MVP appendix        | No expertise-hub product surface in MVP                                                                                     |
| Donor or investor exports          | Moved to post-MVP appendix        | Owner export and public-safe export only where already required for proof and portfolio trust                               |
| Premium pack or purchase journey   | Deprecated unless launch-critical | No canonical MVP requirement; commercial framing belongs outside the product contract                                       |

#### Exact rewrite guidance

- Replace any `dashboard`, `hub`, `ops center`, `command center`, or `analytics surface` framing on user-facing MVP surfaces with calm workflow, status, queue, or review language.
- Replace any org section promising structure maps, project catalogs, culture systems, expertise hubs, donor reporting, investor reporting, or enterprise admin tooling with the existing lean org trust-profile and assignment-review model.
- Replace any counter-based success language with publication state, readiness state, trust state, reveal state, or share state.
- Rewrite Zen text to private optional reflection only, with explicit exclusion from ranking, reveal, org review, public rendering, fairness workflows, and user-facing analytics.
- Rewrite monetization, pricing, packaging, checkout, or purchase-flow wording as non-canonical for MVP unless the section is explicitly post-MVP.
- Where deletion is cleaner than rewrite, delete the older text instead of preserving downgraded legacy concepts.

#### Out of Scope

- Vanity counters on owner-facing or public-facing surfaces
- Streaks, momentum loops, leaderboards, or other gamified behavior mechanics
- Broad org admin suites, org operating-system surfaces, or enterprise expertise surfaces
- Donor or investor reporting exports beyond canonical owner export and public-safe export
- Expanded Zen resource flows, local-resource journeys, coaching product behavior, or therapy-style product branches
- Premium purchase journeys, checkout flows, or packaging assumptions unless they are launch-critical and explicitly approved elsewhere

#### Acceptance Criteria

- No contradictory MVP scope statements remain anywhere in the canonical PRD.
- No vanity metrics remain on owner-facing surfaces.
- No gamified behavior loops remain unless explicitly justified in a scoped exception.
- No old broad org admin surfaces remain as MVP requirements.
- Every retained legacy concept is either reduced to the canonical corridor or moved to a post-MVP appendix.

#### Editing Pass Checklist

- Search for: `streak`, `counter`, `views`, `dashboard`, `hub`, `org structure`, `projects`, `expertise`, `donor`, `investor`, `premium`, `purchase`, `Zen`, `local resource`.
- Classify each hit as remove, rewrite, move to post-MVP appendix, or retain in reduced form.
- Ensure every user-facing surface maps back to the canonical MVP corridor defined above.
- Ensure no section reintroduces public people-index behavior, analytics-product behavior, or enterprise-suite behavior.
- Recheck `Out of Scope` and `Acceptance Criteria` after cleanup edits so later wording does not reintroduce deprecated scope.

### 1.5A Final Contradiction Cleanup and Canonical Override Matrix

### Purpose

Prevent older mirrored or legacy text from re-expanding Proofound into generic recruiting or HR software.
This section is now a short override note only. The full final reconciliation matrix, operating appendices, and legacy cleanup rules live in `12. Final Reconciliation Addendum, Operating Appendices, and Legacy Cleanup`.

### Facts & Decisions

- The canonical master PRD remains the only normative product document.
- `PRD_TECHNICAL_REQUIREMENTS.md` Section 7 is the authoritative technical launch companion for auth, storage, privacy, observability, reliability, and rollout hardening.
- `LAUNCH_RUNBOOK.md` is execution-only and may summarize launch operations, but it cannot override product scope, visibility, reveal, export, delete, or rollback rules defined in the master PRD and Section 7.
- The compatibility mirror is summary-only.
- Executive summary and archived legacy docs are reference-only.
- If this section and Section 12 ever overlap, Section 12 wins immediately.

### Deprecated / Narrowed / Moved / Removed

- Use the canonical cleanup table in Section 12.2 as the final disposition matrix.
- Legacy or mirrored wording that conflicts with the master PRD is deprecated immediately even if not yet deleted from archived docs.

### Visibility / Privacy Implications

- No mirror or legacy doc may weaken blind-by-default reveal.
- No legacy ops wording may widen public visibility, export scope, or sponsor disclosure.

### Events / Analytics Implications

- Legacy event names may persist only as compatibility aliases mapped into canonical events.
- Analytics surfaces must not reintroduce BI-style user products or org admin expansion.

### Out of Scope

- preserving legacy semantics for backward documentation compatibility when they conflict with launch truth

### Open Questions

- None for MVP.

### Acceptance Criteria

- No older broad org-management or recruiting-SaaS language can override the proof-first MVP.
- Mirror and executive-summary docs remain secondary and summary-only.
- Deprecated and moved concepts are explicitly labeled in Section 12 so future edits do not reintroduce them by accident.
- Canonical role, visibility, deletion, fallback, and sponsor rules are the only launch-binding rules.

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

### 2.6 Canonical Principal, Identity, and Membership Model (MVP)

### Purpose

Define one canonical principal model for permissions, attribution, audit logs, invite flows, and public trust surfaces.

### Facts & Decisions

- Every action is performed by exactly one `principal`.
- A human may hold multiple principals over time or concurrently, but permissions are evaluated per principal and per active membership.
- Public attribution is narrower than audit attribution. Audit logs always record the acting principal. Public surfaces show only the minimum allowed attribution.

### Canonical Definitions / Object Model

| Object                 | Canonical definition                                                                                                                           | Key fields                                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `individual_principal` | A human acting on their own profile, Proof Packs, portfolio, exports, intros, and feedback surfaces.                                           | `principal_id`, `user_id`, `principal_type=individual`, `status=active\|suspended\|deleted`                                     |
| `org_principal`        | The organization entity used for org profile ownership, assignment publishing, trust tier, and public attribution.                             | `org_id`, `principal_type=organization`, `org_trust_tier`, `status=active\|restricted\|suspended`                               |
| `org_membership`       | The relationship between a human principal and an org principal. Permissions are granted through this object, not through org existence alone. | `membership_id`, `org_id`, `user_id`, `role`, `state`, `invited_by`, `accepted_at`, `inactive_at`, `suspended_at`, `removed_at` |
| `reviewer_principal`   | A human principal acting in a scoped review capacity for an org or a later reviewer-network corridor.                                          | `principal_id`, `reviewer_kind=org_reviewer\|network_reviewer`, `scope_ref`, `status`                                           |
| `sponsor_principal`    | A human or org-side actor linked to sponsor metadata in the post-MVP alpha corridor only.                                                      | `principal_id`, `sponsor_id`, `status`, `scope_ref`                                                                             |
| `trust_ops_principal`  | Internal admin or trust-ops actor for verification, disputes, moderation, trust tier changes, and audit review.                                | `principal_id`, `principal_type=trust_ops`, `capability_set`, `status`                                                          |

### Membership States and Lifecycle Rules

| State                        | Meaning                                                                        | Allowed next states                                              |
| ---------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `invited_pending`            | Invite issued, not yet accepted. No org permissions.                           | `active`, `declined`, `expired`, `revoked`                       |
| `active`                     | Accepted membership with live permissions.                                     | `inactive`, `suspended`, `removed`, `ownership_transfer_pending` |
| `inactive`                   | Membership kept for attribution history but not usable for new actions.        | `active`, `removed`                                              |
| `ownership_transfer_pending` | Owner transfer initiated and awaiting explicit acceptance by the target owner. | `active`, `removed`                                              |
| `suspended`                  | Membership temporarily blocked by owner or trust-ops.                          | `active`, `removed`                                              |
| `removed`                    | Membership terminated. Historical attribution remains.                         | none                                                             |
| `declined`                   | Invite recipient declined.                                                     | none                                                             |
| `expired`                    | Invite expired without acceptance.                                             | none                                                             |
| `revoked`                    | Invite or pending transfer revoked before acceptance.                          | none                                                             |

### Canonical Rules

- Only an `active` membership grants org permissions.
- `inactive`, `suspended`, `removed`, `declined`, `expired`, and `revoked` memberships grant zero org permissions.
- Ownership transfer requires:
  - current owner initiates transfer
  - target has `active` membership or accepts an owner-targeted invite
  - target explicitly accepts transfer
  - previous owner becomes `org_manager` or `inactive`, never silently removed
- Org public attribution uses `org_principal.display_name` by default.
- Human public attribution appears only when the relevant object is public-safe and the acting human's identity is allowed on that surface.
- Audit logs always store:
  - acting `principal_id`
  - actor type
  - acting membership if any
  - target object
  - prior state
  - new state
  - source surface
  - timestamp

### Roles / Permissions Implications

- Permissions are evaluated as `principal capabilities + active membership + object ownership + visibility ceiling + workflow state`.
- A human with both individual and org memberships must choose a principal context for each state-changing action.
- No action may execute under an inferred org context.

### Visibility / Privacy Implications

- Public attribution defaults to org-level or owner-safe labels, not personal identity.
- Removed or suspended memberships remain visible only in internal audit history.
- Past org actions remain auditable even after membership removal.

### Events / Analytics Implications

Canonical events:

- `principal_created`
- `membership_invited`
- `membership_accepted`
- `membership_suspended`
- `membership_reactivated`
- `membership_removed`
- `ownership_transfer_started`
- `ownership_transfer_completed`

### Out of Scope

- SCIM
- nested departments
- delegated legal entities
- shared mailbox principals
- public org staff directories

### Open Questions

- None for MVP.

### Acceptance Criteria

- An org action without an `active` membership is rejected deterministically.
- Ownership transfer is never implicit and always leaves an auditable before/after chain.
- Public portfolio attribution never exposes a removed member purely because they acted historically.
- Audit exports always show acting principal, membership, and target object together.

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

## 4.1A Global Visibility Matrix and Conflict Rules (MVP)

### Purpose

Define one enforceable visibility contract across profile fields, proof objects, attestations, intros, feedback, public pages, and export/import flows.

### Facts & Decisions

- Visibility is governed by one effective rule: the narrowest applicable rule wins.
- Parent objects may set a maximum outward scope. Child objects may narrow but never widen that scope.
- Public publication and matching reveal are separate systems. Public status never overrides reveal limits.

### Canonical Definitions / Object Model

Visibility scopes:

- `owner_only`
- `matched_org`
- `link_only`
- `public`
- `internal_only` for Trust Ops and system-only records

Effective visibility:

- `effective_visibility = min(parent_max_visibility, child_visibility, workflow_reveal_ceiling, policy_ceiling)`

Conflict rules:

- Child evidence overrides pack visibility only by narrowing exposure.
- Workflow objects use the stricter of object visibility and reveal stage.
- `internal_only` is never user-configurable and never exported on public-safe surfaces.

### Global Visibility Matrix

Legend:

- `F` full allowed view
- `C` coarse or filtered view only
- `N` no access
- `A` audited internal access only

| Object                    | Owner                                           | Org reviewer                                                                                          | Matched org                                                            | Public viewer                      | Admin / trust ops |
| ------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------- | ----------------- |
| Profile fields            | `F`                                             | `C/F` only for fields permitted by reveal stage and field scope                                       | `C/F` only when matched and allowed by reveal stage                    | `C` public-safe allowlist only     | `A`               |
| Proof Packs               | `F`                                             | `C/F` only when pack scope and reveal stage allow                                                     | `C/F` only when pack scope and reveal stage allow                      | `C` public-safe projection only    | `A`               |
| Child evidence            | `F`                                             | `C/F` only if child evidence scope permits                                                            | `C/F` only if child evidence scope permits                             | `C` public-safe evidence only      | `A`               |
| Attestations              | `F`                                             | `C` verification result and scope, never raw verifier PII unless later reveal stage explicitly allows | `C` same rule as org reviewer                                          | `C` coarse public-safe status only | `A`               |
| Intro artifacts           | `F` if party to intro                           | `F` if party to intro and active membership                                                           | `N` unless party to intro                                              | `N`                                | `A`               |
| Interview feedback        | `F` candidate-visible subset plus owner export  | `F` own-org subset only                                                                               | `N` unless the matched org is the interviewing org                     | `N`                                | `A`               |
| Public portfolio pages    | `F` current public-safe page plus owner preview | `C` same as public plus matched-only overlays where explicitly allowed                                | `C` same as public unless reveal stage allows more                     | `C` current public page only       | `A`               |
| Owner export              | `F`                                             | `N` unless org owns the exported org object                                                           | `N`                                                                    | `N`                                | `A`               |
| Public-safe export        | `F`                                             | `C` only if current object is public-safe and they already have access                                | `C` only if current object is public-safe and they already have access | `C` current public-safe state only | `A`               |
| Import validation reports | `F` for importing owner                         | `N`                                                                                                   | `N`                                                                    | `N`                                | `A`               |

### State Rules

- `withdrawn`, `deleted`, `restricted`, `disputed`, and `contradicted` states immediately recalculate effective visibility.
- Cached public pages, snippets, and public-safe exports must re-evaluate current effective visibility at access time or be invalidated immediately.

### Roles / Permissions Implications

- Viewing permission is insufficient without passing effective visibility.
- Reveal grants may widen matched-org visibility only up to the approved reveal stage and never affect public visibility.

### Visibility / Privacy Implications

- Public-safe surfaces must suppress:
  - raw filenames
  - hidden child counts
  - verifier identity
  - private org notes
  - reveal-only metadata
- `link_only` is wider than `matched_org` for distribution, so `link_only` may never be auto-derived from a matched-org state.

### Events / Analytics Implications

Canonical events:

- `visibility_scope_changed`
- `effective_visibility_recalculated`
- `public_projection_invalidated`
- `reveal_ceiling_changed`

### Out of Scope

- field-by-field public customization beyond the existing allowlist model
- public comments
- public viewer identity tracking
- social sharing counters

### Open Questions

- None for MVP.

### Acceptance Criteria

- A public Proof Pack with a private child artifact never exposes the child artifact publicly or in public-safe export.
- A matched org never sees a field that exceeds both field scope and reveal stage.
- A withdrawn or deleted object disappears from public surfaces immediately after invalidation.
- Admin access is always audited and never changes public visibility by itself.

## 4.1B Canonical Role-Permission Matrix (MVP)

### Purpose

Define deterministic, testable permissions across individual, org, sponsor, and trust roles.

### Facts & Decisions

- Roles are capability bundles, not labels for UI copy only.
- Permissions are denied by default.
- Membership state, object ownership, and workflow state are required inputs to every permission check.

### Canonical Roles

- `individual`
- `org_owner`
- `org_manager`
- `org_reviewer`
- `sponsor_actor` post-MVP alpha only
- `trust_admin`

### Role-Permission Matrix

Legend:

- `Y` allowed
- `C` conditional
- `N` not allowed

| Permission                                   | Individual                          | Org owner                     | Org manager                     | Org reviewer                    | Sponsor actor                         | Trust admin                         |
| -------------------------------------------- | ----------------------------------- | ----------------------------- | ------------------------------- | ------------------------------- | ------------------------------------- | ----------------------------------- |
| Create or edit own profile and Proof Packs   | `Y`                                 | `N`                           | `N`                             | `N`                             | `N`                                   | `N`                                 |
| Create or edit org profile                   | `N`                                 | `Y`                           | `C` org profile basics only     | `N`                             | `N`                                   | `C` only during trust action        |
| Create or edit assignments                   | `N`                                 | `Y`                           | `Y`                             | `N`                             | `N`                                   | `N`                                 |
| Review matches, shortlist, pass              | `N`                                 | `Y`                           | `Y`                             | `Y`                             | `N`                                   | `C` audit-only, no routine steering |
| Request reveal or intro                      | `C` consent path only               | `Y`                           | `Y`                             | `C` if org policy grants        | `N`                                   | `N`                                 |
| Submit or request attestation / verification | `Y` for own proof                   | `C` org-side attestation only | `C` org-side attestation only   | `C` assigned review only        | `N`                                   | `Y`                                 |
| Invite org members or reviewers              | `N`                                 | `Y`                           | `C` no owner invite or transfer | `N`                             | `N`                                   | `C` only for admin recovery         |
| Accept membership invite                     | `N` unless target user              | `N` unless target user        | `N` unless target user          | `N` unless target user          | `N` unless target user                | `N`                                 |
| Transfer ownership                           | `N`                                 | `Y`                           | `N`                             | `N`                             | `N`                                   | `C` emergency recovery only         |
| Export own data                              | `Y`                                 | `Y` for org-owned exports     | `C` org operational export only | `C` review packet export only   | `C` sponsor packet metadata only      | `Y` internal audit export           |
| Delete own content                           | `Y`                                 | `Y` org-owned objects only    | `C` non-org-core drafts only    | `N`                             | `N`                                   | `C` trust or safety takedown only   |
| Change org trust tier                        | `N`                                 | `N` request only              | `N`                             | `N`                             | `N`                                   | `Y`                                 |
| Open or resolve dispute                      | `Y` own records                     | `Y` own org records           | `Y` own org records             | `C` can flag, not resolve       | `C` sponsor-linked cases only         | `Y`                                 |
| View analytics                               | `C` own portfolio and progress only | `Y` org-safe analytics        | `Y` org-safe analytics          | `C` review-queue analytics only | `C` sponsor-linked alpha metrics only | `Y`                                 |
| View internal moderation notes               | `N`                                 | `N`                           | `N`                             | `N`                             | `N`                                   | `Y`                                 |

### Deterministic Conditional Rules

- `org_manager` cannot:
  - transfer ownership
  - change org trust tier
  - access internal moderation notes
  - invite another owner
- `org_reviewer` cannot:
  - edit org profile
  - manage membership
  - export full org audit logs
  - see hidden identity before reveal rules allow
- `sponsor_actor` is inactive unless the sponsor corridor is enabled.
- `trust_admin` may intervene only with reason-coded audit logging and never as a silent product-side reviewer override.

### Visibility / Privacy Implications

- Permission grants never bypass visibility ceilings.
- Export permissions are scoped by current visibility, object ownership, and workflow role.

### Events / Analytics Implications

Canonical events:

- `permission_denied`
- `permission_granted_via_membership`
- `role_capability_used`
- `trust_admin_action_logged`

### Out of Scope

- custom org roles
- per-user ACL editors
- department inheritance
- sponsor-side candidate browsing

### Open Questions

- None for MVP.

### Acceptance Criteria

- The same action requested by an `org_manager` and an `org_reviewer` yields different, testable outcomes where required.
- A `trust_admin` action always logs reason code, prior state, new state, and source surface.
- No role can widen visibility or reveal identity by permission alone.
- Sponsor actions remain dormant unless the sponsor corridor is explicitly enabled.

## 4.1C Invite, Magic-Link, and Attestation-Link Security Contract (MVP)

### Purpose

Define one secure contract for membership invites, BYOC invites, and attestation links.

### Facts & Decisions

- All invite and attestation tokens are opaque, single-use, hashed at rest, and revocable.
- Token redemption is fail-closed.
- Regeneration revokes all prior unredeemed tokens of the same type and scope.

### Canonical Definitions / Object Model

Token types:

- `membership_invite_token`
- `candidate_invite_token`
- `attestation_request_token`

Required fields:

- `token_id`
- `token_type`
- `token_hash`
- `target_email`
- `scope_ref_id`
- `issued_by_principal_id`
- `issued_at`
- `expires_at`
- `revoked_at`
- `redeemed_at`
- `attempt_count`
- `last_attempt_at`
- `suspicious_flag`
- `redeem_session_nonce`

Token states:

- `issued`
- `redeemed`
- `expired`
- `revoked`

### Lifecycle Rules

| Token type            | Default expiry | Redemption rule                                                                       | Regeneration rule                                                                       |
| --------------------- | -------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Membership invite     | 7 days         | Must be redeemed by the invited email identity                                        | New token revokes prior active membership invite tokens for the same org + target       |
| BYOC candidate invite | 7 days         | Must be redeemed by the invited email identity                                        | New token revokes prior active candidate invite tokens for the same assignment + target |
| Attestation request   | 14 days        | May be redeemed by the addressed counterparty without creating broader account access | New token revokes prior active attestation tokens for the same proof request            |

### Replay Protection and Session Binding

- First successful token lookup issues a short-lived `redeem_session_nonce` bound to the browser session for 15 minutes.
- State-changing redemption requires both:
  - valid opaque token
  - matching `redeem_session_nonce`
- After successful redemption:
  - `redeemed_at` is written
  - token state becomes `redeemed`
  - all subsequent attempts return `invalid_or_consumed`
- Token previews must not expose hidden object data before final validation.

### Rate Limiting and Abuse Rules

- Max 5 redemption attempts per token per 15 minutes.
- Max 10 failed token attempts per IP per hour across invite-like flows.
- Max 3 token regenerations per inviter per target per 24 hours.
- Suspicious patterns:
  - repeated wrong-recipient redemption attempts
  - repeated expired-token retries
  - fan-out attempts across many tokens from one IP
  - repeated regenerate-and-redeem loops
- Suspicious patterns set `suspicious_flag = true`, emit `token_abuse_flagged`, and may temporarily block the flow.

### Failure Handling

- Invalid recipient: return neutral failure, do not disclose intended recipient.
- Expired token: offer resend or request-new-link path only if the requester is already authenticated or can prove control of target email.
- Revoked token: fail closed with neutral copy.
- Suspicious retries: throttle, audit, and optionally require authenticated re-entry by inviter.

### Audit Logging

Canonical events:

- `token_issued`
- `token_previewed`
- `token_redeemed`
- `token_revoked`
- `token_expired`
- `token_regenerated`
- `token_abuse_flagged`

Audit payload must include:

- token type
- scope ref
- issuing principal
- target email hash
- IP hash
- user agent hash
- attempt outcome
- timestamp

### Out of Scope

- passwordless platform login as a generic auth model
- reusable invite links
- unaudited admin backdoors
- sharing invite URLs between recipients

### Open Questions

- None for MVP.

### Acceptance Criteria

- Regenerating an invite invalidates every prior active invite for that scope and target.
- A redeemed token cannot be replayed in the same or another session.
- The wrong recipient cannot learn who the invite was meant for.
- Suspicious retry spikes are throttled and logged automatically.

## 4.1D Upload Quarantine and File-Ingest Pipeline (MVP)

### Purpose

Define a minimal safe ingest path for uploaded evidence and a separate contract for links-only evidence.

### Facts & Decisions

- Uploaded files are private and quarantined by default.
- No uploaded file may attach to a Proof Pack or public surface before scan and metadata checks pass.
- Links-only evidence is not binary ingest. It is validated separately and remains lower-trust until corroborated.

### Canonical Definitions / Object Model

Required ingest fields:

- `ingest_id`
- `owner_principal_id`
- `ingest_type=upload|link`
- `source_ref`
- `scan_status`
- `metadata_status`
- `attach_status`
- `safe_for_public`
- `rejection_reason`
- `received_at`

Upload ingest states:

- `received`
- `quarantined`
- `scan_passed`
- `scan_failed`
- `metadata_extracted`
- `attachable`
- `attached`
- `rejected`

Link ingest states:

- `received`
- `validated`
- `metadata_extracted`
- `attachable`
- `attached`
- `rejected`

### Allowed File Types and Limits

Allowed upload MIME families in MVP:

- `application/pdf`
- `image/png`
- `image/jpeg`
- `image/webp`
- `text/plain`
- `text/markdown`

Rejected in MVP:

- archives
- executables
- office macro formats
- spreadsheets
- presentations
- audio
- video

Limits:

- max file size `25 MB`
- max 10 files per batch
- max aggregate uploaded evidence per Proof Pack `100 MB`

### Canonical Upload Flow

1. `received`
2. `quarantined`
3. malware or safety scan
4. metadata extraction
5. `attachable`
6. user confirms attach to a draft Proof Pack or artifact
7. attachment becomes eligible for later visibility rules

Unsafe upload handling:

- `scan_failed` or metadata violation moves record to `rejected`
- rejected files are never attached
- public-safe promotion is impossible
- user sees a calm rejection reason
- internal logs keep coarse rejection metadata only

### Links-Only Evidence Rules

- No binary quarantine step.
- Link validation checks:
  - scheme allowlist `https`
  - resolvable URL
  - content-type sniff if reachable
  - preview metadata extraction where available
- Links remain `public_link_unverified` until corroborated by other proof, attestation, or review.
- Links can be attached after validation, but public rendering still follows pack visibility and public-safety review.

### Roles / Permissions Implications

- Individuals may upload and attach to their own drafts.
- Org actors may upload only to org-owned assignment or review artifacts where explicitly permitted.
- Trust Ops may inspect quarantined metadata and rejection reasons, not repurpose user files.

### Visibility / Privacy Implications

- Quarantined uploads are `owner_only` or `internal_only`.
- Metadata extraction must suppress EXIF, GPS, author names, and hidden document properties before any public-safe use.
- Public-safe image promotion is allowed only after explicit public eligibility review.

### Events / Analytics Implications

Canonical events:

- `file_ingest_received`
- `file_scan_passed`
- `file_scan_failed`
- `file_metadata_extracted`
- `file_attached`
- `file_rejected`
- `link_validated`
- `link_rejected`

### Out of Scope

- video portfolios
- malware adjudication consoles
- OCR-heavy review tooling
- large media libraries
- office document editing

### Open Questions

- None for MVP.

### Acceptance Criteria

- An uploaded PDF cannot be attached until scan and metadata extraction succeed.
- An unsafe upload is rejected and never appears on profile, matching, or public surfaces.
- A link-only artifact follows a separate lower-trust path and never bypasses proof or visibility rules.
- Public-safe rendering strips identifying metadata from uploaded images and documents.

## 4.2 Individual Product Surfaces

### A. Onboarding and Public Portfolio

- Onboarding is portfolio-first.
- Individual onboarding collects display name, handle, headline, bio, and location.
- Onboarding ends with a dedicated **Public portfolio ready** step.
- Public individual URL: `/portfolio/{handle}`
- Public portfolio is created as a day-1 public URL when minimum publishable threshold is met.
- Default publication state is `public_link_only`:
  - live and shareable
  - non-indexed by default
  - separately controlled from matching reveal
- Public portfolio defaults to a minimal safe allowlist controlled by field-level visibility and public-safety ceilings:
  - header on
  - proof bar on
  - work email off
  - contact off
  - skills off
  - bio off
- Search indexing is disabled by default and requires an explicit separate opt-in.

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
- Zen does not expand into local-resource discovery, coaching, therapy-style support, or outbound wellbeing journeys in MVP.

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
- The default public state is `public_link_only`, with indexing opt-in handled separately and public rendering constrained by field-level visibility and policy ceilings.

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
- Broader employer, community, discovery, and operations surfaces remain later-corridor material and must not be read as launch scope.

### F. BYOC Candidate Invites

- Organizations may invite a known candidate by email.
- The candidate claims the invite using the matching email.
- Submission uses a Proof Card derived from a selected Proof Pack.
- Proof Card remains a render surface, not a separate stored entity.

### G. Organization Trust Tiers and Sensitive-Domain Safety (MVP-lite / post-MVP corridor)

- Proofound uses a lightweight organization trust-tier model to decide how far an organization can move through publishing, intro, and sensitive-domain workflows.
- This is an MVP safety and gating layer, not full KYC, not compliance certification, and not an enterprise trust-and-safety suite.
- Organization trust tier is a separate org-level state model. It does not replace user trust tier, Proof Pack verification status, or moderation and suspension states.

#### Organization trust tiers

- `Unreviewed`
  - default for newly created organizations
  - standard public trust profile may exist
  - standard non-sensitive assignments may publish
  - sensitive-domain publishing and stronger verification-path requests stay queued or unavailable until more trust signals exist
- `Basic trusted`
  - standard assignment publishing works normally
  - standard intro corridor access works normally
  - stronger verification-path requests or sensitive-domain requests may still queue for review
- `Reviewed`
  - Proofound completed a scoped product-safety review for the organization
  - sensitive-domain publishing may proceed when the specific organization and assignment pass review
  - certain stronger verification-path requests may be accepted, still with case-by-case review
- `Restricted`
  - assignment publishing, intro requests, or visibility may be paused, limited, or hidden pending review
  - this is an operational safety state, not a public accusation and not a permanent status by default

#### Early-version inputs that influence org trust tier

- verified work email or verified domain control
- org profile completeness
- manual admin review
- issue and dispute history

#### What org trust tier affects

- visibility of organization assignments inside matching surfaces
- whether an assignment can publish normally, queue for review, or pause
- whether the organization can move a candidate into intro request flow
- whether the organization can request certain stronger verification or sensitive review paths

#### Sensitive-domain and child-safety guardrails

Sensitive categories that require additional review in MVP-lite:

- child-facing work, youth programs, schools, tutoring, and mentoring
- healthcare, mental health, therapy, care, and safeguarding
- housing, shelter, crisis support, domestic-violence support, or similar vulnerable-population support
- legal aid, immigration support, or similar high-vulnerability support contexts
- roles involving direct access to minors, vulnerable adults, or sensitive personal data

Queued for review:

- sensitive-domain organizations
- sensitive-domain assignments
- requests for stronger verification paths
- orgs with incomplete trust signals or unresolved review context

Blocked or paused:

- `Restricted` organizations
- assignments that imply unsafe direct child contact outside a verified institutional context
- exploitative unpaid work patterns inside sensitive domains
- repeat abuse or dispute patterns that indicate elevated risk

#### Abuse prevention signals

- suspicious assignment patterns, including repeated reposting with shifting expectations, identity evasiveness, or inconsistent org details
- exploitative unpaid work patterns, especially when responsibilities are high-risk or operationally significant
- repeated dispute triggers across assignments, intro requests, or verification-related workflows

#### Audit and admin tooling

- an internal admin queue with reason codes for review, escalation, restriction, and release
- an append-only trust tier change log with actor, timestamp, prior tier, new tier, and reason code
- moderation notes visible only to internal admins and authorized reviewers
- org-facing product surfaces show only coarse status and next step, never internal moderation rationale

#### Analytics

- trust tier distribution across organizations
- escalation rates from `Unreviewed` or `Basic trusted` into manual review
- abuse flags and repeated safety-trigger counts

#### MVP-lite vs post-MVP corridor

MVP-lite:

- manual review
- coarse heuristics
- limited sensitive-domain categories
- internal notes and reason codes
- simple queue, gating, and restriction actions

Post-MVP corridor:

- richer verification-path requests
- a stronger review rubric for sensitive-domain organizations
- limited appeal and re-review workflows
- stronger domain-authorization proofs for high-risk contexts
- better queue tooling and operator triage support

#### Facts & Decisions

- Organizations use four product trust tiers:
  - `Unreviewed`
  - `Basic trusted`
  - `Reviewed`
  - `Restricted`
- MVP-lite trust tiering is a lightweight operational safety model for publishing, intros, and sensitive-domain access.
- Sensitive-domain guardrails focus on a short list of higher-risk contexts and keep review manual by default.
- Org trust tier remains separate from:
  - user trust tier
  - Proof Pack verification status
  - moderation, suspension, or account-ban states
- `Reviewed` means Proofound completed a scoped product-safety review. It does not mean legal certification, enterprise compliance approval, or blanket endorsement.
- `Restricted` is reversible and operational.

#### Open Questions

- Whether some sensitive-domain categories need narrower sub-rules before launch, especially around child-facing volunteer work
- Whether post-MVP should require stronger org authorization proofs for certain healthcare, education, or care contexts
- Whether repeated dispute thresholds should differ for publishing restrictions versus intro restrictions

#### Out of Scope

- full KYC
- sanctions screening
- background checks
- payroll verification
- enterprise trust-and-safety case management
- public display of moderation notes or detailed internal risk scoring

#### Acceptance Criteria

- Scenario: a new organization completes onboarding with a standard profile and a verified work email.
  - Result: it starts as `Unreviewed`, may publish a standard non-sensitive assignment, and cannot bypass sensitive-domain review automatically.
- Scenario: an organization has sufficient trust signals and no meaningful issue history.
  - Result: it may become `Basic trusted`, publish normal assignments, and use the standard intro corridor.
- Scenario: an organization operates in a sensitive domain and passes scoped admin review.
  - Result: it may become `Reviewed` and publish the reviewed sensitive-domain assignment path without implying full compliance approval.
- Scenario: an organization shows repeat dispute or abuse signals.
  - Result: it may move to `Restricted`, and publishing or intro actions may pause or hide pending review.
- Scenario: an internal reviewer adds moderation notes.
  - Result: internal admins and authorized reviewers can see the notes, while org-facing surfaces receive only coarse status and next step.
- Scenario: analytics reporting is generated for org trust and safety.
  - Result: trust tier distribution, escalation rates, and abuse flags are available internally only and do not create a user-facing analytics product.

### H. Legal, Licensing, Cross-Border, and Assignment Guardrails (MVP)

- This block connects assignment publishing, assignment acceptance, proof ownership, trust review, and dispute handling to a clear MVP policy posture.
- It is product policy for how Proofound behaves in assignment workflows. It is not a substitute for local legal advice, not a full sanctions engine, and not a custom contract builder.
- The goal is to keep creator rights, org usage rights, unpaid-work limits, cross-border restrictions, and privacy-safe auditability explicit before work starts.

#### Creator rights and default license posture

- Default license posture is narrow and explicit.
- The creator keeps ownership of pre-existing materials and keeps portfolio rights to show public-safe proof of the work according to Proofound visibility and trust rules.
- The organization receives defined usage rights only for accepted assignment work:
  - evaluate submitted work for selection or review
  - run, use, and internally share the accepted deliverable for the assignment, engagement, or pilot it was created for
- MVP does not assume exclusive transfer, blanket work-for-hire treatment, or silent ownership assignment by default.
- If both parties agree to different terms, the system must record that as `alternate license terms recorded` at assignment acceptance with explicit acknowledgement from both sides.
- Assignment copy alone must not silently override the default posture.
- Proofound may continue to store and render public-safe proof according to current visibility, trust, and audit policy unless the recorded alternate terms explicitly narrow that allowed surface.

#### Assignment guardrails

- Unpaid test work must not turn into unpaid production, unpaid client-deliverable work, or unpaid commercially used work.
- Unpaid scope is allowed only when the assignment is clearly bounded, evaluative, or genuinely pro-bono or public-interest in nature.
- Pro-bono is allowed only when:
  - the organization declares non-commercial or social-good use
  - the requested scope is limited and time-bounded
  - the deliverable is not the organization's real operating output, client output, or production substitute
- A paid, sponsor-backed, bounty-backed, or otherwise commercial path is required when the work is:
  - revenue-linked
  - production-bound
  - operationally significant
  - client-deliverable
  - broader than a bounded evaluation task
- The system may label such cases `sponsor/commercial path required` or `unpaid scope blocked`.

#### Enforcement points

- Assignment draft:
  - flag scope patterns that look like unpaid commercial or operational work
  - require the org to classify the assignment as evaluative, pro-bono, or commercial-backed
- Assignment publish:
  - block publish when unpaid commercial use appears unresolved
  - queue policy-sensitive cases for manual review where needed
- Assignment acceptance:
  - show the creator the current rights and usage summary before they accept
  - prevent acceptance if the assignment is blocked for unpaid-use or jurisdiction reasons

Canonical warning language should remain calm and explicit, for example:

- `This assignment exceeds Proofound's unpaid evaluation corridor and requires a paid, sponsor-backed, or otherwise commercial path before it can proceed.`
- `Proofound allows limited pro-bono work only when the scope is bounded and the work is not being used as unpaid commercial output.`

#### Cross-border constraints

- MVP cross-border handling is a review-and-restriction layer, not a promise of full automated sanctions screening.
- The system may raise `cross-border review required` when:
  - the organization, creator, assignment location, or deliverable category sits in a sanctioned or export-sensitive corridor
  - the assignment carries geography restrictions that affect lawful participation
  - policy requires manual review before work, proof sharing, or acceptance may proceed
- Geography restrictions may apply by assignment, organization, creator location, or deliverable category when the workflow is not allowed in a given jurisdiction.
- A `restricted jurisdiction` outcome means the product must:
  - block publish
  - hold acceptance
  - or suppress the restricted workflow step
  - while showing neutral copy and a reason code
- Restricted cases route to manual review or a do-not-proceed outcome. MVP must not rely on soft warnings alone when the corridor is policy-blocked.

#### Privacy, compliance, and residency posture

- MVP behavior remains GDPR and CCPA aligned in product terms:
  - collect the minimum necessary assignment and trust data
  - show policy-versioned notice and acceptance where rights or restrictions matter
  - support export and deletion rights through the existing privacy surfaces
  - keep policy-sensitive actions append-only and auditable
- Residency posture remains MVP single-region hosting, with current residency disclosed honestly when relevant.
- MVP does not promise country-by-country localization or automatic regional pinning.
- If a residency-sensitive case cannot proceed under the current posture, the system routes it to manual review or blocks it with neutral copy rather than implying unsupported coverage.

#### Dispute-policy hooks

- Policy is referenced from:
  - assignment draft and publish validation
  - assignment details before acceptance
  - the assignment acceptance summary
  - the public policy pages for terms, privacy, and dispute handling
- At assignment acceptance, users must see a concise rights and policy summary that covers:
  - creator portfolio rights
  - org usage rights
  - whether alternate terms are recorded
  - unpaid-work limits
  - jurisdiction restrictions when present
  - where to open a dispute
- Disputes remain intake-first and lightweight in MVP, but every dispute must link back to auditable assignment state and policy context.
- Dispute and policy audit records must share the same minimum reference set:
  - `assignment_id`
  - actor
  - counterpart reference when available
  - policy version
  - reason code
  - linked proof or evidence reference when present
  - timestamp
  - resolution state

#### Product copy requirements

- Assignment publish, acceptance, and restriction copy must use operational language, not legal threat language.
- Users should understand:
  - what rights they keep
  - what rights the other party receives
  - why an unpaid path is limited
  - why a cross-border restriction or manual review exists
  - where to go if they disagree
- Avoid copy that implies:
  - automatic IP transfer by default
  - full legal clearance
  - full sanctions screening
  - full compliance certification

#### Facts & Decisions

- MVP default license posture is non-exclusive and assignment-bounded.
- Creators keep portfolio rights by default.
- Organizations receive defined usage rights for accepted work, not blanket ownership by default.
- Alternate terms are allowed only through explicit recorded acknowledgement at assignment acceptance.
- Unpaid test work must not become unpaid commercial or operational work.
- Pro-bono is allowed only for bounded, genuinely non-commercial or public-interest use.
- Cross-border policy in MVP is a manual review and restriction framework, not a definitive screening guarantee.
- Privacy and dispute hooks reuse the existing append-only auditability posture already defined elsewhere in the PRD.
- Residency posture for MVP remains single-region unless a future product posture explicitly expands it.

#### Out of Scope

- default work-for-hire or blanket exclusive-transfer assumptions
- custom contract drafting
- payroll, escrow, or payout handling
- full sanctions screening
- export-law certification
- country-by-country data residency promises
- full legal adjudication workflow

#### Acceptance Criteria

- Scenario: a creator accepts a standard assignment with no alternate terms.
  - Result: the acceptance summary states that the creator keeps portfolio rights, the organization receives assignment-bounded usage rights, and the action records policy version, actor, timestamp, and assignment reference.
- Scenario: both parties agree to different rights than the default posture.
  - Result: the system records `alternate license terms recorded`, requires explicit acknowledgement, and does not rely on assignment copy alone to override the default.
- Scenario: an organization attempts to publish unpaid work that is really production or client-deliverable work.
  - Result: the workflow is blocked as `unpaid scope blocked` or routed to `sponsor/commercial path required` before publish or acceptance can proceed.
- Scenario: an organization posts a bounded social-good task with limited evaluative scope.
  - Result: the assignment may proceed as pro-bono when the declared use, scope, and guardrails stay inside the allowed corridor.
- Scenario: a cross-border restriction applies to the organization, creator, assignment, or deliverable category.
  - Result: the system raises `cross-border review required` or `restricted jurisdiction`, blocks or holds the affected step, and shows neutral reason-coded copy rather than a soft warning only.
- Scenario: a user disputes assignment terms, cross-border handling, or policy enforcement.
  - Result: the dispute links to the assignment and policy audit trail using shared references for assignment, actor, policy version, reason code, timestamps, and resolution state.
- Scenario: privacy or residency posture is questioned at acceptance time.
  - Result: the product discloses the current MVP single-region posture honestly, does not promise unsupported localization, and routes unsupported residency-sensitive cases to review or a block.

### I. Events & Missions Container (MVP-light / Early Corridor)

- Events & Missions exist to let an organization group multiple assignments under one shared real-world initiative without turning Proofound into a full event-management suite.
- The container gives assignments richer proof context, makes related submissions easier to interpret as part of one initiative, and enables a lightweight public outcome case-study surface when public-safe evidence exists.
- This is a calm extension of assignment publishing, portfolio trust, and pilot storytelling. It is not a second operating system for event logistics.

#### Why Events & Missions exist in Proofound

- group multiple assignments under a shared real-world initiative
- create richer proof context across related assignments and public trust surfaces
- enable public outcome case studies that show what an initiative produced without exposing hidden evidence

#### Minimal MVP-light event object

- `event_id`
- `organization_id`
- `title`
- `summary`
- `start_date`
- `end_date`
- `locale`
- `timezone`
- `cause_tags`
- `assignment_ids[]`
- `public_visibility`
- `case_study_status`

#### Supported behaviors

- An organization can create one event or mission as a lightweight container around a real-world initiative.
- The organization can attach multiple assignments to that event.
- Submissions, proof review, and verification still happen per assignment, Proof Pack, and artifact. The event does not replace assignment-level workflow.
- The event may generate a lightweight public outcome summary when enough public-safe proof exists.

#### Public case-study output

- Public case-study output is a privacy-safe summary, not a raw evidence dump.
- Proof highlights may use only already public-safe proof or artifact summaries that are allowed on the relevant public surface.
- Hidden or private evidence must never leak through event copy, proof highlights, metadata, or deep links.
- If public-safe evidence becomes hidden later, the event summary and proof highlights must immediately stop showing that evidence while the broader event page may remain public if its remaining summary is still safe.

#### Discovery, portfolio context, and pilot storytelling

- Events improve discovery by giving assignments a clearer real-world context, such as a program, campaign, field mission, cohort, or pilot.
- Events strengthen portfolio context by connecting multiple assignment outcomes back to one recognizable initiative.
- Events support pilot storytelling by letting Proofound show what happened across related assignments without promising a heavy analytics or event-operations product.

#### Edge cases

- If an assignment is removed from an event, the event keeps the remaining assignment links and public summary must recalculate without assuming the removed assignment still belongs.
- If an event is cancelled, its historical context may remain visible, but it must no longer behave like an active initiative.
- If an event remains public after some proofs are hidden, the public event surface must degrade gracefully to the remaining public-safe summary and proof highlights only.

#### Event analytics

- internal events created
- assignments attached per event
- lightweight public outcome summaries published
- case-study views
- proof-highlight usage

Analytics for events are internal only and must remain lightweight. They exist to understand adoption, discovery context, and storytelling utility, not to create a user-facing event dashboard.

#### Facts & Decisions

- Events & Missions are a lightweight container for grouping multiple assignments under one shared initiative.
- The event object in MVP-light is limited to:
  - `event_id`
  - `organization_id`
  - `title`
  - `summary`
  - `start_date`
  - `end_date`
  - `locale`
  - `timezone`
  - `cause_tags`
  - `assignment_ids[]`
  - `public_visibility`
  - `case_study_status`
- Assignment submission, proof verification, and artifact-level review remain assignment-scoped and evidence-scoped. The event container does not replace those contracts.
- Public event output is limited to a lightweight privacy-safe outcome summary plus public-safe proof highlights where available.
- Event discovery value is contextual, narrative, and proof-oriented. It is not a marketplace browse layer and not an analytics product.
- `public_visibility` and `case_study_status` remain coarse controls in MVP-light, not a large workflow state machine.

#### Out of Scope

- ticketing
- attendee CRM
- calendar suite behavior
- registration, RSVP, or attendee management
- complex logistics management
- scheduling orchestration across participants
- turning Events & Missions into a standalone event-management SaaS

#### Acceptance Criteria

- Scenario: an organization creates one event and links multiple assignments under a shared initiative.
  - Result: the event gives those assignments shared context, while submission and verification still happen per assignment, Proof Pack, and artifact.
- Scenario: an event generates a public outcome summary.
  - Result: the summary uses only privacy-safe copy and public-safe proof highlights, with no hidden or private evidence leakage.
- Scenario: an assignment is removed from an event.
  - Result: the event updates its assignment list and outcome summary without breaking the remaining linked assignments or their proofs.
- Scenario: an event is cancelled.
  - Result: the event may remain as historical context, but it no longer presents itself as active ongoing work.
- Scenario: some proofs tied to a public event later become hidden.
  - Result: the event may stay public, but all summary text and proof highlights immediately stop referencing the hidden proofs.
- Scenario: event analytics are reviewed internally.
  - Result: Proofound can see event creation, assignment grouping, case-study publication, case-study views, and proof-highlight usage without creating a user-facing dashboard.

## 4.4 Public Portfolio Trust Layer, Share Metadata, and Indexing Rules (MVP)

### Purpose of public portfolio pages in MVP

- Public portfolio pages give individuals and organizations one clean, shareable trust surface on day 1.
- Day-1 public publication defaults to `public_link_only`: live and shareable, but non-indexed unless the owner later opts in and public-safety checks pass.
- The page helps a public viewer quickly understand who this person or organization is, what public proof exists, and how current that proof is.
- The page is not a public marketplace listing, not a social feed, and not a directory page.
- Public publication is separate from matching reveal. A public page never widens blind review or reveal-stage permissions inside matching workflows.

### Public page types

- Individual portfolio page at the canonical portfolio route.
- Organization portfolio page at the canonical organization portfolio route.
- Optional proof detail surface, implemented either as a public proof detail page or a proof modal contract.

Rules for the optional proof detail surface:

- It shows only data that is already public on the parent portfolio.
- It must not introduce private metadata, reviewer notes, raw artifacts, or identity-bearing hidden fields.
- If it is a standalone route, it inherits the same visibility, noindex, withdrawal, and preview-safety rules as the parent portfolio.
- If it is implemented as a modal, copied links must still resolve safely and must not expose hidden proof content.

### Exact MVP rules for public trust information

Allowed public trust information:

- Proof counts reflect only currently public proofs.
- Verification badges may use scoped labels already defined in the PRD, such as Proof Pack verification status or user trust tier labels.
- Freshness appears as one simple plain-language state derived from the current proof freshness model.
- Proof summary appears as short, public-safe summaries of the most relevant visible proofs.

Hard exclusions:

- No private reviewer notes.
- No verifier identity details.
- No raw uploaded documents unless they were already approved as public-safe proof media.
- No hidden contact data, private links, match-only evidence, reveal-gated data, or internal moderation context.
- No derived trust claim that overstates what has actually been checked.
- No blanket page-level claim such as "fully verified" unless the scope is explicitly accurate and visible on page.

### Structured metadata requirements

Canonical URL:

- Only the stable portfolio route is canonical for an individual or organization.
- Snippet, tokenized, embed, preview, and admin-owner views are never canonical.
- Old handles or slugs may redirect to the new canonical route only while the page remains public.

Page title rules:

- Individual page title: `{Public Name or Handle} | Proofound`
- Organization page title: `{Public Organization Name or Slug} | Proofound`
- Optional public proof detail title: `{Public Proof Title} | {Portfolio Name} | Proofound`
- A title may append one short public-safe descriptor only if that same descriptor is already visible on page.

Meta description rules:

- Use one concise public-safe summary from the page's visible summary or proof summary.
- Fall back to a generic Proofound-branded description when the page is link-only, sparse, or safety-limited.
- Never include private fields, unverifiable superlatives, or hidden organizations or clients.

OG and Twitter preview rules:

- Include title, description, canonical URL, preview image, and site name.
- Link-only and noindex pages use a generic branded preview if a page-specific preview could expose hidden information.
- Indexable pages may use public-safe page-specific preview copy and image.

Structured data rules:

- If included, keep it minimal: `WebPage` plus `Person` or `Organization`.
- `CreativeWork` is optional only for a standalone public proof detail page.
- Review, rating, job, directory, and collection schema are out of scope for MVP public pages.

### Indexing rules

Safe default behavior:

- A newly public page is shareable by direct link but not indexable.
- This default state is `public_link_only`.

Indexable state:

- A page may become indexable only when the owner explicitly enables indexing and the current page content passes public-safety checks.
- Field-level visibility, policy ceilings, moderation state, and withdrawn or withheld proof state all apply before the page may become indexable.

Noindex states:

- Unpublished pages.
- Link-only pages.
- Pages with redaction or hidden-content blockers.
- Withdrawn or moderated pages.
- Tokenized snippet or embed surfaces.

Owner controls:

- The owner can enable or disable indexing separately from publication.
- The owner can depublish the page entirely.

Withdrawal and depublish behavior:

- Depublish removes public access and moves the page to noindex.
- Withdrawn proofs are removed from public rendering immediately.
- Public pages that fall below safety requirements downgrade to noindex or unavailable, depending on severity.

### Share safety

- Copied links always respect the current visibility state at open time.
- If a proof becomes private, withdrawn, deleted, or blocked, public pages and proof detail surfaces stop showing it immediately.
- Public snippets and previews must not keep exposing withdrawn or private proof text or thumbnails.
- Cache invalidation is required on publish and depublish, indexing toggle, proof withdrawal or deletion, handle or slug rename, and proof summary or public preview image changes.
- Stale external caches may persist briefly, but Proofound-controlled page responses, metadata, and preview generation must update immediately after the state change.
- Matching reveal state must not influence signed-out public page rendering, copied links, or metadata generation.

### Public verification summary behavior

- A signed-out viewer should understand in a few seconds whose portfolio this is, what kind of proof is present, whether some proof has been checked, and how recent the visible proof is.
- The page must not show reviewer notes, internal decision rationale, moderation notes, or workflow-specific reveal context.
- The page must not use misleading page-level "verified" claims.
- Preferred scoped language includes:
  - "contains verified proofs"
  - "workplace verified account"
  - "fresh proof updated recently"
- Absence of a badge is not a negative fraud claim.

### PDF and text export relationship to public visibility

- Owner exports remain separate private product behavior.
- If MVP exposes public PDF or text export from a public portfolio, that export must render only the current public-safe page state.
- Public export must not include hidden fields, withdrawn proofs, reviewer notes, or richer owner-only export data.
- If the page is depublished or the proof is withdrawn, public export links must stop resolving or regenerate without the removed content.

### Public analytics

Internal-only MVP instrumentation may include:

- Views.
- Shares or share-link copies.
- Proof detail opens.
- Outbound contact clicks or contact-request clicks.

Boundaries:

- These metrics support product health, debugging, and abuse monitoring.
- They are not public counters.
- They are not a public ranking mechanism.
- They do not turn the portfolio into a growth dashboard in MVP.

### Edge cases

- Renamed handle:
  - the old canonical URL redirects only while the new page remains public; otherwise the old URL resolves unavailable
- Deleted proof:
  - the proof disappears from the public page, metadata, proof counts, and previews immediately
- Hidden proof still linked somewhere:
  - the old deep link resolves to unavailable or a safe fallback that exposes no hidden content
- Public page with zero proofs:
  - the page may remain public as a minimal identity shell if other minimum public-safe content exists
  - it must not make strong trust claims
  - it remains noindex by default until stronger public-safe proof exists

### Facts & Decisions

- Public portfolio is a day-1 share surface.
- The default stable public state is `public_link_only`.
- One clean template is the MVP default across individual and organization pages.
- Direct-link sharing is the primary distribution mode.
- Indexing is separate and opt-in only.
- Public rendering is controlled by field-level visibility plus policy ceilings, with the narrowest safe result winning.
- Public publication is not a reveal shortcut and must never weaken blind review or stage-based consent rules.
- Public trust language must stay scoped and honest.
- Private, withdrawn, and reveal-gated content never leaks into public pages, metadata, previews, or exports.
- Proofound does not ship a public directory or SEO-farm surface in MVP.

### Open Questions

- Should the optional proof detail surface launch first as modal-only or route-based?
- Should owners later get a minimal private summary of public traffic without turning MVP into an analytics product?
- What minimum quality bar, if any, should be required before a zero-proof page may opt into indexing?

### Acceptance Criteria

- A public viewer can understand identity, proof presence, proof freshness, and scoped verification quickly.
- Day-1 public pages default to `public_link_only` and remain non-indexed unless explicit opt-in and public-safety checks pass.
- No private reviewer notes or reveal-only fields appear on any public surface.
- Field-level visibility and policy ceilings govern stable public rendering.
- Copied links always resolve according to current visibility.
- Noindex and depublish behavior works for pages that are link-only, withdrawn, or blocked.
- Deleted or withdrawn proofs disappear from page body, previews, counts, and proof detail surfaces.
- Metadata is canonical, minimal, and privacy-safe.
- Structured data, if present, stays limited to page-level schema and avoids directory or review schema.
- Public analytics exist only as internal instrumentation.
- Public export never exceeds current public visibility.
- The MVP still has no public directory behavior.

### Launch Checklist

- Canonical metadata implemented for individual and organization portfolios.
- Generic fallback preview copy and image exist for noindex or sparse pages.
- Proof withdrawal invalidates public page fragments and previews.
- Noindex and sitemap behavior tested for each publication state.
- Old handle or slug redirects tested.
- Public proof-detail fallback tested for hidden or deleted proof.
- No private notes or verifier identities present in page source, metadata, previews, or export.

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

## 5.4A Proof Pack Canonical Schema & Portability (MVP)

### Facts & Decisions

- The Proof Pack is the canonical portable proof object for portfolio credibility, matching summaries, org review, owner export, and bring-your-own-candidate proof-card flows.
- MVP portability must improve trust and reuse without introducing heavyweight infrastructure.
- Launch portability is structured and versioned, but intentionally narrow:
  - deterministic export metadata
  - explicit provenance
  - scoped public verification status
  - export portability across owner-visible and public-safe views
- Launch does not require detached signatures, public verification ledgers, wallet infrastructure, third-party credential registries, or cryptographic verification networks.

### Canonical object relationships

- `proof_artifacts`
  - Atomic evidence objects such as files, links, images, credentials, references, or assessments.
- `proof_packs`
  - Canonical reviewable proof objects that group claims, context, evidence, outcomes, trust state, privacy, and portability.
- `proof_pack_items`
  - Ordered membership rows that connect artifacts into a pack.
- `verification_records`
  - Trust judgments, refresh state, contradiction state, dispute state, and verification outcomes linked to the relevant pack or artifact.
- `submissions`
  - Contextual proof delivery into assignment, invite, match, intro, verification, or manual review flows.
- `proof_card`
  - A render surface derived from a selected Proof Pack for submission, review, invite, or export contexts. It is not a separate canonical stored object.

### Launch portability contract

- MVP supports two export scopes only:
  - `owner_full`
    - owner-visible structured export for reuse, download, and later re-import validation
  - `public_safe`
    - public-safe projection suitable for public portfolio rendering or public-safe portability
- Every exported Proof Pack must carry launch-safe metadata:
  - `export_schema_version`
  - `export_scope`
  - `portability_hash`
  - `verification_status`
  - `freshness_state`
  - `generated_at`
  - `provenance_summary`
- The launch export format is versioned structured JSON.
- A JSON-LD-compatible mapping may be added later, but full JSON-LD infrastructure is not required for launch and must not be treated as a launch dependency.
- Deterministic hashing is required at the product-policy level:
  - the same unchanged export scope produces the same `portability_hash`
  - a change to included canonical content changes the `portability_hash`
  - transport metadata and delivery wrappers do not affect the hash

### Provenance and integrity fields

- Every Proof Pack must retain a canonical provenance summary that answers:
  - how the pack entered the system
  - which workflow or source object it came from when known
  - when it was captured or last refreshed
  - which actor class captured or confirmed it
  - whether required references are complete, partial, or missing
- Launch-safe provenance fields include:
  - `origin_type`
  - `origin_ref`
  - `captured_at`
  - `captured_by_actor_type`
  - `capture_surface`
  - `completeness_state`
  - `last_verified_at`
  - `last_refreshed_at`
- Launch integrity behavior is limited to deterministic hashing and export-version tracking.
- Detached signatures, signer identity chains, public signature verification, countersigning, and external trust registries are post-launch extensions only.

### Public verification status behavior

- Launch public trust behavior is coarse and scoped.
- Public-safe surfaces may show only:
  - current verification status
  - current freshness state
  - a latest public-safe effective date
  - a plain-language provenance summary already allowed by policy
- Launch does not require a full public verification log.
- When proof is withdrawn, deleted, disputed beyond public-safe scope, or no longer public, the public-safe status must downgrade or disappear immediately according to visibility rules.

### Import and export rules

- `owner_full` exports may be used for owner-directed portability and later validation.
- `public_safe` exports must never include owner-private, reveal-gated, or verifier-private data.
- Import validation must be explicit and fail closed when required canonical fields or references are missing.
- Trusted attach or reuse must not occur silently from incomplete or scope-mismatched exports.
- Launch may support import preview and validation before attach; it does not require generalized cross-platform import automation.

### Visibility rules

- Default Proof Pack visibility is private.
- Pack-level visibility is the maximum outward visibility; child artifacts may only narrow exposure.
- Public-safe exports and public portfolio cards must apply field-level visibility and policy ceilings before serialization.
- If a pack is public but a child artifact is more private, the child artifact is withheld without leaking filenames, source URLs, counts, or other private metadata.

### API and product implications

- APIs and product surfaces must reason over `proof_packs`, `proof_artifacts`, `proof_pack_items`, `verification_records`, and `submissions` as the canonical proof model.
- Compatibility tables or metadata fields may still exist internally, but they must map into this model rather than compete with it.
- Launch product surfaces that rely on Proof Packs include:
  - public portfolio
  - matching summaries
  - org review
  - exports
  - BYOC proof-card flows

### Deferred post-launch extensions

- Full JSON-LD export infrastructure with hosted contexts
- Detached signatures and signature verification UX
- Public verification ledgers or public event feeds
- Third-party credential network interoperability
- Rich public methodology or integrity reports

### Acceptance Criteria

- Proof Packs remain the canonical proof object across portfolio, matching, org review, exports, and BYOC.
- `proof_artifacts`, `proof_pack_items`, `verification_records`, and `submissions` have distinct roles and are described without overlap.
- `owner_full` and `public_safe` exports are defined clearly and do not widen visibility.
- Launch portability uses explicit versioning, provenance, and deterministic export metadata without promising heavyweight trust infrastructure.
- Public-safe trust rendering stays coarse, honest, and immediately responsive to visibility or withdrawal changes.
- A `public_safe` export cannot be imported as a trusted owner pack.
- Dry-run validation reports missing evidence, version incompatibility, and ID or hash conflicts deterministically.
- A stale pack remains visible historically but is marked stale and stops satisfying fresh-proof gates.
- A pack with private child evidence still renders publicly using only allowed pack-level and child-level fields.
- Public portfolio cards never leak hidden filenames, URLs, source references, or private verifier detail.
- Event names, acceptance bullets, and API implications remain consistent with the canonical analytics taxonomy in this PRD.

## 5.5 Verification, Provenance, Badges, and Proof Ladder (MVP)

This block defines the MVP evidence-layer trust model. It is narrower than KYC, background checks, sanctions screening, legal identity certification, or compliance certification. It explains how Proofound produces conservative trust cues inside the existing coarse models of profile readiness, user trust tier, and Proof Pack verification status. It does not replace those coarse product-level states.

### 5.5.1 Verification goals

- reduce false signal by keeping every trust cue scoped to a person, claim, artifact, org relationship, or engagement record
- increase explainability by stating what each badge means, what it does not mean, and where it was earned
- preserve user control and privacy by keeping sensitive evidence private by default and only exposing concise public-safe summaries
- keep verification incremental, not blocking all use, so users can publish, browse, and improve trust over time

### 5.5.2 State model

The MVP trust model has three layers that operate together:

- **verification type**
  - `self-claimed`
  - `peer-attested`
  - `org-verified`
  - `human-reviewed`
  - `auto-checks-passed`
- **verification record state**
  - `pending`
  - `active`
  - `stale`
  - `expired`
  - `declined`
  - `contradicted`
  - `revoked`
  - `corrected`
- **proof rung**
  - `Claim`
  - `Proof`
  - `Deep Case`

Interpretation rules:

- Every claim, artifact, or engagement record starts as `self-claimed` with record state `active` once the owner saves it.
- A request for peer, org, human, or automated review creates a separate verification record in `pending`.
- A successful verification completes as `active` under one of the four non-self verification types.
- Freshness moves `active -> stale -> expired` by rule without deleting history.
- Any non-self active record may move to `contradicted`, `revoked`, or `corrected`.
- Corrections append a new record and preserve prior history. Corrections do not overwrite or erase prior verification records.

Coarse-state interaction rules:

- User trust tier remains the coarse user-level summary.
- Proof Pack verification status remains the coarse pack-level summary.
- Badge evidence informs those summaries conservatively:
  - `unverified` user trust tier persists unless active workplace-linked or identity-linked evidence exists under the existing user-trust rules
  - `unverified` Proof Pack verification status applies when a pack has no active scoped non-self verification evidence
  - `partially_verified` applies when some scoped items in the pack have active non-self verification evidence but coverage is incomplete
  - `verified` applies only when the pack meets the pack-level threshold for active scoped verification coverage
  - `disputed` applies when a material contradiction or dispute suppresses active positive pack-level trust
- The badge layer is more granular than the coarse states and must not be flattened into a single public claim of "verified."

### 5.5.3 Verification types and badge semantics

Public rule:

- Public surfaces show only active, positive, privacy-safe badges.
- `self-claimed` is visible to the owner and authorized review surfaces, but it is not shown as a public trust badge.
- `declined`, `contradicted`, `revoked`, `corrected`, `stale`, and `expired` are visible in owner and authorized review surfaces only unless a muted public-safe freshness summary is explicitly needed later.

#### `self-claimed`

- Means:
  - the owner created the claim, artifact, or engagement record directly
  - Proofound has a provenance trail to the submitting account and timestamp
- Does not mean:
  - independent validation
  - proof of authorship, identity, employment, contract completion, or factual accuracy
- Appears in UI:
  - owner profile
  - Proof Pack editor and detail views
  - authorized org review detail views when deeper evidence context is allowed

#### `peer-attested`

- Means:
  - an eligible peer attested to a scoped claim, outcome, role contribution, or engagement fact based on direct knowledge
  - the attestation applies only to the specific item or statement it references
- Does not mean:
  - platform endorsement of the entire profile
  - legal identity confirmation
  - current employment confirmation
  - enterprise-grade reference checking
- Appears in UI:
  - Proof Pack detail
  - matching evidence summaries when the attested item is visible
  - org review trust panels
  - public portfolio only when the attested item is public and the attestation is still active

#### `org-verified`

- Means:
  - a verified organization representative or eligible org-controlled channel confirmed a scoped relationship, role, assignment, or engagement fact
  - acceptable MVP examples include domain-confirmed work email, verified org-admin confirmation, or authorized org attestation on a specific claim
- Does not mean:
  - government registry certification
  - payroll verification
  - compliance clearance
  - proof of every title, duty, or date on the profile
- Appears in UI:
  - owner verification settings
  - Proof Pack header or claim rows when the org-linked fact is in scope
  - org review trust panels
  - public portfolio only as a concise active trust summary

#### `human-reviewed`

- Means:
  - a Proofound internal reviewer manually assessed submitted evidence and marked a scoped item as sufficiently corroborated for MVP trust purposes
  - the review decision is attached to a specific claim, artifact, or engagement record
- Does not mean:
  - legal certification
  - compliance approval
  - a promise that no future contradiction will arise
- Appears in UI:
  - owner verification history
  - org review trust panels
  - public portfolio or matching only as a narrow badge if the reviewed item is active and public-safe

#### `auto-checks-passed`

- Means:
  - Proofound ran machine-verifiable integrity or provenance checks and the item passed those checks
  - acceptable MVP examples include domain control, token proof, link reachability at check time, file integrity consistency, or metadata consistency checks
- Does not mean:
  - truth of the full narrative
  - authorship
  - legal identity
  - hard fraud detection guarantees
- Appears in UI:
  - owner verification detail
  - Proof Pack artifact rows
  - org review trust panels
  - public portfolio only when the check is active and safe to summarize briefly

### 5.5.4 Verification source model

#### Who can verify what

- Owner:
  - can create `self-claimed` items only
- Eligible peers:
  - can create `peer-attested` records for scoped claims, contribution narratives, outcomes, or engagement facts they directly observed
- Verified org representatives:
  - can create `org-verified` records for scoped org-linked facts such as role relationship, assignment participation, or engagement confirmation
- Proofound internal reviewers:
  - can create `human-reviewed` records for scoped claims, artifacts, or engagement evidence
- Platform systems:
  - can create `auto-checks-passed` records for system-verifiable checks only

#### Attestor eligibility rules

- A peer attestor must:
  - have a valid account or secure attestation token
  - attest to a specific claim or engagement fact, not a whole profile
  - provide a relationship basis such as collaborator, manager, client, or teammate
- An org attestor must:
  - be an authorized representative of the relevant organization or verify control of an approved org channel
  - attest only to facts the organization can reasonably confirm
- Internal reviewers must:
  - act through authenticated reviewer tooling
  - use scoped reason codes rather than free-form public comments

#### Conflict-of-interest rules

- Users cannot verify themselves beyond `self-claimed`.
- Family members, duplicate accounts, or accounts controlled by the same natural person are ineligible as peer attestors.
- An org attestor cannot verify a fact if they are not authorized for the relevant org context.
- Internal reviewers cannot approve their own submitted evidence.

#### Duplicate and contradictory attestation handling

- Duplicate attestations for the same item from the same attestor are merged into the newest active record and older duplicates become superseded history.
- Multiple positive attestations may coexist when they come from distinct eligible attestors.
- Contradictory evidence does not silently average out.
- When contradiction is material, the affected active badge is removed from public and matching surfaces immediately and the record moves to `contradicted` or remains `pending` under review.

#### Revocation and correction flow

- Revocation is used when a prior verification should no longer be trusted.
- Correction is used when the core fact remains valid but the prior verification record needs amendment.
- Both flows append new history, preserve prior records, and emit explicit lifecycle events.

### 5.5.5 Verification flow and transitions

Canonical flow:

1. Owner creates a claim, artifact, or engagement record.
2. The item is stored as `self-claimed(active)`.
3. A peer request, org request, human review request, or automated check creates a new verification record in `pending`.
4. Successful completion creates one of:
   - `peer-attested(active)`
   - `org-verified(active)`
   - `human-reviewed(active)`
   - `auto-checks-passed(active)`
5. Freshness rules move the record to `stale`, then `expired`, if not refreshed.
6. A dispute, contradiction, or policy issue may move the record to `contradicted` or `revoked`.
7. A correction appends a new `corrected` record plus a new current active record when applicable.

Freshness defaults for MVP:

- `peer-attested`: active for 24 months, then `stale`, then `expired`
- `org-verified`: active for 12 months unless refreshed sooner by a newer org-controlled check
- `human-reviewed`: active for 24 months unless underlying evidence changes materially
- `auto-checks-passed`: freshness depends on check class, but it must downgrade at the moment the underlying machine-verifiable signal is no longer valid
- `self-claimed`: no expiry, but it does not count as a positive trust anchor

Material-change rule:

- If the owner edits evidence materially after a non-self verification was earned, the prior non-self record becomes non-current. The item returns to `self-claimed(active)` plus a historical superseded verification trail until refreshed or re-reviewed.

### 5.5.6 Proof Ladder

#### `Claim`

- Qualifies when:
  - a narrative, artifact, or engagement fact exists
  - only `self-claimed` or shallow automated provenance checks exist
- Effect:
  - the item is usable, shareable, and reviewable
  - it does not satisfy stronger verification gates by itself

#### `Proof`

- Qualifies when:
  - at least one scoped non-self verification is active
  - or an acceptable MVP evidence bundle exists, such as a signed agreement upload plus a consistent engagement record
- Effect:
  - the item may satisfy assignment verification gates if the gate asks only for scoped proof
  - matching trust and ranking may improve

#### `Deep Case`

- Qualifies when:
  - the item already qualifies as `Proof`
  - and includes meaningful context, outcome detail, and corroborating evidence strong enough for higher-confidence review
- Effect:
  - the item supports stronger explainability and higher review confidence
  - it does not create a new legal or compliance status

Freshness and nudging rules:

- Stale items remain visible privately and historically auditable.
- Stale items should trigger owner nudges to refresh, deepen, or replace the evidence.
- Freshness affects ranking, gate satisfaction, and public trust summaries before it affects storage or audit retention.

### 5.5.7 Verification gates for matching and intro

#### Hard block

- A required verification gate blocks intro creation when the required item is:
  - missing
  - still `pending`
  - `expired`
  - `contradicted`
  - `revoked`
- Hard blocks apply only when the assignment or workflow explicitly requires that verification type or proof rung.

#### Lowers trust or ranking only

- `self-claimed` only evidence
- `stale` verification
- unverifiable external proof links
- incomplete `Deep Case` context when only `Proof` level exists
- positive but narrow verification that does not cover the exact claim in question

#### Informational only

- reviewer notes
- source mix
- superseded historical records
- prior declines that no longer control the active state

### 5.5.8 Contract and engagement verification

Minimum viable acceptable proofs in MVP:

- mutual attestation from both sides on the same engagement record
- uploaded signed agreement or uploaded sent agreement evidence
- uploaded invoice, statement of work, offer letter, or equivalent engagement artifact
- a matching combination of an org confirmation plus a candidate confirmation on the same engagement fact

Interpretation rules:

- Mutual attestation is acceptable MVP proof for engagement confirmation, but it is not legal contract enforcement.
- Uploaded evidence may strengthen or replace missing mutual attestation if the reviewer or org confirmation path supports it.
- Later integrations such as DocuSign, HRIS, payroll, background checks, and hard identity checks are post-MVP only.

### 5.5.9 Auditability and public trust layer

Auditability rules:

- Verification history is append-only and immutable in practice.
- Each state transition keeps actor class, timestamp, scoped subject, prior state, new state, and reason code.
- History is never deleted just because the current badge is no longer active.

Visibility rules:

- Full verification detail is visible to:
  - the owner
  - authorized org reviewers in the relevant workflow context
  - internal reviewers and admins
- The public sees only:
  - concise active badge summaries
  - scoped public-safe trust language
  - no private notes, reviewer comments, or sensitive evidence text

### 5.5.10 Edge cases

#### Expired attestations

- An expired attestation stops counting as an active trust signal immediately.
- Historical detail remains visible privately.

#### Unverifiable external links

- If a link cannot be reached or no longer resolves to reviewable evidence, any dependent `auto-checks-passed` record expires or is contradicted based on severity.
- The underlying item may remain `self-claimed`.

#### Reviewer disagreement

- Disagreement between reviewers or between review sources removes the public active badge for the affected scope until a current resolution exists.
- Authorized review surfaces show mixed evidence rather than fabricating certainty.

#### Malicious verification attempts

- Suspicious attestation or org-verification attempts move to internal review and do not create a public-positive badge.
- Proven abuse can revoke the affected verification record and invalidate the attestor path.

#### Withdrawn evidence

- If the owner withdraws or deletes the underlying evidence, the related positive badge stops contributing to public trust immediately.
- Audit history remains, but the current item no longer qualifies for active proof.

### 5.5.11 Facts & Decisions

- MVP uses incremental verification, not all-or-nothing account approval.
- Hard verification, KYC, compliance certification, payroll checks, and enterprise reviewer ops are out of scope for MVP.
- Badge names shown to users are exactly:
  - `self-claimed`
  - `peer-attested`
  - `org-verified`
  - `human-reviewed`
  - `auto-checks-passed`
- Existing coarse product states remain unchanged:
  - user trust tier: `unverified`, `workplace_verified`, `identity_verified`
  - Proof Pack verification status: `unverified`, `partially_verified`, `verified`, `disputed`
- Badge evidence informs those coarse states, but does not rename them.
- Public trust remains conservative. Public surfaces show concise active positives only.

### 5.5.12 Open Questions

- Whether some `auto-checks-passed` classes should have shorter freshness windows by check type after launch
- Whether reviewer disagreement needs a dedicated post-MVP reviewer arbitration queue
- Whether certain org-verification paths should require stronger authorization proofs in post-MVP org-admin tooling
- Whether Deep Case should eventually surface a richer private rubric to reviewers without changing public semantics

### 5.5.13 Acceptance Criteria

- Scenario: a user adds a case study with no external verification.
  - Result: the item is `self-claimed(active)`, qualifies for `Claim`, is shareable, and does not satisfy a hard verification gate by itself.
- Scenario: an eligible collaborator confirms one specific outcome.
  - Result: the scoped item earns `peer-attested(active)`, may qualify as `Proof`, and does not silently upgrade unrelated claims.
- Scenario: an org admin confirms the candidate worked on a specific assignment.
  - Result: the scoped item earns `org-verified(active)` and may satisfy an org-required gate if that gate asked for org-linked confirmation.
- Scenario: an internal reviewer checks uploaded agreement evidence.
  - Result: the engagement record earns `human-reviewed(active)` and remains explicitly narrower than legal certification.
- Scenario: a platform provenance check passes on an uploaded artifact.
  - Result: the artifact earns `auto-checks-passed(active)`, but the PRD still states that this does not prove authorship or truth of the entire narrative.
- Scenario: a required verification gate is still pending at intro time.
  - Result: intro is blocked and the system records a verification-gate failure rather than silently lowering rank only.
- Scenario: an attestation becomes stale.
  - Result: it stops boosting trust and gate satisfaction, remains visible privately, and triggers a refresh nudge.
- Scenario: contradictory evidence arrives after a badge was active.
  - Result: the public badge is removed immediately for the affected scope, history remains auditable, and the record moves to `contradicted` or internal review.
- Scenario: evidence is corrected.
  - Result: the correction appends new history rather than overwriting the prior record.
- Scenario: a public portfolio is rendered.
  - Result: only active, positive, privacy-safe badges are shown; private notes and reviewer comments never render publicly.

## 5.6 Match and Reveal Lifecycle

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

## 5.7 Intro Lifecycle

- `created`
- `accepted`
- `declined`
- `expired`
- `withdrawn`
- `closed`

Rules:

- Intros are created only after qualification and reveal rules pass.
- Expired or withdrawn intros remain auditable.

## 5.8 Interview Lifecycle

- `scheduled`
- `rescheduled`
- `completed`
- `no_show`
- `cancelled`

Rules:

- A canceled interview may be replaced by a new interview for the same match.
- Schedule, reschedule, and cancel updates are posted into the related thread as user-visible context.

## 5.9 Feedback Follow-up Lifecycle

- `not_due`
- `due`
- `submitted`
- `breached`
- `closed`

Rules:

- Feedback follow-up begins after interview completion.
- The default policy is a **48-hour feedback follow-up**.
- Status must be visible to both relevant participants at the correct scope.

## 5.9A Structured Feedback Rubric and Visibility Contract (MVP)

### Purpose

Define one calm, structured feedback rubric for assignment review, interview follow-up, and outcome follow-up.

### Facts & Decisions

- Feedback must be structured first and free text second.
- Feedback must stay factual, scope-bound, and non-harmful.
- No individual feedback becomes public in MVP.

### Canonical Definitions / Object Model

Required fields:

- `feedback_id`
- `feedback_type=assignment_review|interview_follow_up|outcome_follow_up`
- `subject_ref_id`
- `submitted_by_principal_id`
- `visibility_scope=org_internal|candidate_visible|internal_only`
- `reason_code`
- `dimension_scores[]`
- `next_step_code`
- `free_text_optional`
- `submitted_at`
- `due_at`

Canonical dimensions and allowed values:

| Dimension                 | Allowed values                                                    |
| ------------------------- | ----------------------------------------------------------------- |
| `capability_fit`          | `strong_fit`, `developing_fit`, `not_yet_fit`                     |
| `proof_strength`          | `clear_evidence`, `partial_evidence`, `insufficient_evidence`     |
| `scope_alignment`         | `aligned`, `partially_aligned`, `not_aligned`                     |
| `trust_readiness`         | `verified_enough`, `verification_pending`, `needs_stronger_proof` |
| `communication_readiness` | `clear`, `adequate`, `unclear`                                    |
| `logistics_alignment`     | `aligned`, `manageable_gap`, `blocking_gap`                       |

Free-text rule:

- optional
- max 280 characters
- factual and action-oriented only
- forbidden content:
  - protected-class commentary
  - medical or mental-health inference
  - personality diagnoses
  - accent, age, family, or `culture fit` judgments
  - vague insults or comparative ranking language

### Visibility Rules

| Feedback type       | Candidate sees                                        | Org sees              | Public | Admin / trust ops       |
| ------------------- | ----------------------------------------------------- | --------------------- | ------ | ----------------------- |
| Assignment review   | only when a final close decision is sent              | full org-owned record | none   | audited internal access |
| Interview follow-up | candidate-visible structured result and optional note | full org-owned record | none   | audited internal access |
| Outcome follow-up   | candidate-visible                                     | full org-owned record | none   | audited internal access |

### Turnaround Expectations

- Assignment review closeout: within 5 business days of final review state or assignment close.
- Interview follow-up: within 48 hours of interview completion.
- Outcome follow-up: within 7 calendar days of final decision or corridor close.

### Roles / Permissions Implications

- `org_reviewer`, `org_manager`, and `org_owner` may submit org-side structured feedback within scope.
- `individual` may submit candidate-side outcome reflections only where the workflow explicitly allows it.
- `trust_admin` may review or redact policy-violating feedback.

### Events / Analytics Implications

Canonical events:

- `feedback_due`
- `feedback_submitted`
- `feedback_breached`
- `feedback_redacted_for_policy`

Analytics allowed:

- completion rate
- turnaround compliance
- reason-code distribution
- next-step distribution

Analytics excluded:

- raw free-text mining
- public sentiment scoring

### Out of Scope

- public testimonials
- freeform reviewer essays as the primary contract
- star ratings
- personality scoring
- `culture fit` models

### Open Questions

- None for MVP.

### Acceptance Criteria

- Every closed interview or outcome requires structured feedback fields before the workflow is complete.
- Public pages never expose interview or outcome feedback.
- Free text exceeding policy bounds is rejected or redacted.
- Feedback dashboards use reason codes and dimension values, not raw narrative text.

## 5.10 Public Portfolio Distribution Lifecycle

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

## 5.10A Canonical Lifecycle State Machines and Edge-Case Rules (MVP)

This block is the canonical lifecycle contract for backend implementation, UI state rendering, QA, and analytics. It supersedes fragmented lifecycle wording elsewhere in Section 5 wherever wording conflicts, and must remain consistent with `PRD_TECHNICAL_REQUIREMENTS.md` Appendix A1.

### Canonical rules

- One active state exists per object record at a time.
- Transitions are append-only in audit history and must preserve prior state, next state, actor, trigger, reason code, and timestamp.
- Terminal records are not reopened in place. Recovery uses either a new record or an explicit superseding record.
- Edge cases must never be hidden behind calm UI wording. They require explicit `reason_code` values and canonical timestamps.
- `application` is the candidate-intent object. `submission` is the proof-delivery object. Passive matching alone does not create an application.
- `verification`, `proof freshness`, `Proof Pack lifecycle`, `public portfolio distribution`, and `contract / engagement verification` remain separate state systems even when they influence one another.

### State machines

#### Assignment

| Valid state | Allowed transitions | Transition triggers                                                                 | Who can cause transition                      | Audit requirements                                                                                                                          |
| ----------- | ------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `draft`     | `active`, `closed`  | Org publishes after readiness checks pass, or closes before publish                 | Org owner/admin                               | `assignment_id`, `from_state`, `to_state`, `reason_code`, actor class/id, `created_at`, `state_changed_at`, `published_at` or `closed_at`   |
| `active`    | `hold`, `closed`    | Org pauses, system expiry fires, assignment is filled, manual close, org withdrawal | Org owner/admin, system for expiry            | Include immutable `closure_reason` when closing: `expired`, `filled`, `cancelled`, `withdrawn_by_org`; include `expires_at` when applicable |
| `hold`      | `active`, `closed`  | Org resumes, org closes manually, or hold policy closes it                          | Org owner/admin, system if a hold auto-closes | `held_at`, `resumed_at` or `closed_at`, actor, reason code                                                                                  |
| `closed`    | None                | Terminal                                                                            | None                                          | Preserve final `closure_reason`, downstream termination references, and `closed_at`                                                         |

#### Application

Application is a first-class object for explicit candidate intent. It exists only when a candidate applies or claims an assignment-linked invite.

| Valid state    | Allowed transitions                           | Transition triggers                                                                          | Who can cause transition                       | Audit requirements                                                                                                               |
| -------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `draft`        | `submitted`, `withdrawn`                      | Candidate starts then submits, or abandons before submit                                     | Candidate                                      | `application_id`, `assignment_id`, `candidate_profile_id`, `created_at`, `submitted_at` or `withdrawn_at`, actor, source surface |
| `submitted`    | `under_review`, `withdrawn`, `closed`         | Org opens review, candidate withdraws, or assignment closes                                  | Org owner/admin or reviewer, candidate, system | `submitted_at`, `state_changed_at`, reason code, actor                                                                           |
| `under_review` | `advanced`, `rejected`, `withdrawn`, `closed` | Org advances to intro/interview corridor, rejects, candidate withdraws, or assignment closes | Org owner/admin or reviewer, candidate, system | `review_started_at`, `advanced_at` or `rejected_at`, reason code, actor                                                          |
| `advanced`     | `closed`                                      | Downstream intro/interview corridor takes over or assignment closes                          | System, org owner/admin                        | `advanced_at`, downstream object reference, `closed_at`                                                                          |
| `rejected`     | `closed`                                      | Rejection finalized and application corridor ends                                            | System                                         | `rejected_at`, `closed_at`, rejection reason                                                                                     |
| `withdrawn`    | `closed`                                      | Withdrawal finalized                                                                         | System                                         | `withdrawn_at`, withdrawal actor, `closed_at`                                                                                    |
| `closed`       | None                                          | Terminal                                                                                     | None                                           | Preserve terminal reason and linked downstream object ids                                                                        |

Duplicate rule:

- A candidate may have only one non-terminal application per `assignment_id`.
- A repeated apply attempt returns the existing active record and emits `duplicate_application_blocked`.

#### Submission

Submission is the proof-delivery object tied to assignment, application, intro, verification, or manual review context.

| Valid state    | Allowed transitions                                   | Transition triggers                                                                                                      | Who can cause transition                      | Audit requirements                                                                                                                        |
| -------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `draft`        | `submitted`, `withdrawn`                              | Owner saves draft then submits, or discards before send                                                                  | Candidate, org submitter, or authorized owner | `submission_id`, `submission_kind`, context ids, `created_at`, `submitted_at` or `withdrawn_at`, actor                                    |
| `submitted`    | `under_review`, `withdrawn`, `rejected`, `superseded` | Reviewer opens review, owner withdraws, system auto-rejects late or invalid submission, or newer replacement is accepted | Reviewer, owner, system                       | `submitted_at`, `submission_deadline_at` when used, `state_changed_at`, reason code, late flag if `submitted_at > submission_deadline_at` |
| `under_review` | `accepted`, `rejected`, `withdrawn`, `superseded`     | Reviewer accepts or rejects, owner withdraws, or newer submission replaces it                                            | Reviewer, owner                               | `review_started_at`, `reviewed_at`, `accepted_at` or `rejected_at`, actor, reason                                                         |
| `accepted`     | `superseded`                                          | Newer accepted submission replaces current accepted record                                                               | Reviewer, system                              | `accepted_at`, `superseded_at`, `superseded_by_submission_id`                                                                             |
| `rejected`     | `superseded`                                          | Newer accepted submission replaces historical rejected record                                                            | Reviewer, system                              | `rejected_at`, `superseded_at`, reason                                                                                                    |
| `withdrawn`    | None                                                  | Terminal                                                                                                                 | None                                          | Preserve `withdrawn_at` and withdrawing actor                                                                                             |
| `superseded`   | None                                                  | Terminal                                                                                                                 | None                                          | Preserve replacement reference and `superseded_at`                                                                                        |

Late submission rule:

- Late delivery is deterministic, not subjective.
- The system must derive lateness from `submitted_at > submission_deadline_at`.
- The transition must log `reason_code = late_submission`, whether the final state remains `submitted` for manual review or moves immediately to `rejected`.

#### Verification

Verification uses the verification-record model as the canonical source of truth.

| Valid state                                     | Allowed transitions                                                          | Transition triggers                                                                                                                                          | Who can cause transition                           | Audit requirements                                                                                                    |
| ----------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `pending`                                       | `verified`, `expired`, `declined`, `cancelled`, `failed`, `disputed`         | Attestor responds positively, request times out, attestor declines, requester cancels, verification fails, or conflicting evidence arrives before completion | Attestor, requester, system, internal reviewer     | `verification_record_id`, `verification_kind`, `subject_type/id`, `requested_at`, `request_expires_at`, actor, reason |
| `verified`                                      | `expired`, `superseded`, `downgraded`, `contradicted`, `disputed`, `revoked` | Freshness expires, newer record replaces it, material edits reduce confidence, conflicting evidence is accepted, dispute opens, or reviewer/admin revokes    | System, internal reviewer, authorized org verifier | `verified_at`, `expires_at`, `superseded_at`, `contradicted_at`, `disputed_at`, `revoked_at`, reason                  |
| `expired`                                       | `superseded`, `verified`                                                     | Newer record refreshes it, or explicit re-verification completes                                                                                             | System, attestor, internal reviewer                | `expired_at`, replacement reference, actor                                                                            |
| `superseded`                                    | None                                                                         | Terminal history state                                                                                                                                       | None                                               | Preserve `superseded_by_verification_id`                                                                              |
| `downgraded`                                    | `verified`, `superseded`, `revoked`, `disputed`                              | Stronger supporting evidence arrives, replacement record takes over, revocation occurs, or dispute opens                                                     | Internal reviewer, system                          | `downgraded_at`, reason, actor                                                                                        |
| `contradicted`                                  | `disputed`, `superseded`, `revoked`                                          | Material contradiction confirmed, dispute opened for review, replacement record created, or revoked permanently                                              | Internal reviewer, system                          | `contradicted_at`, contradiction reference, reason                                                                    |
| `disputed`                                      | `verified`, `contradicted`, `revoked`, `superseded`                          | Reviewer resolves in favor of the claim, against the claim, revokes it, or replaces it                                                                       | Internal reviewer, admin                           | `dispute_state`, `disputed_at`, resolution actor, reason                                                              |
| `revoked` / `declined` / `cancelled` / `failed` | None                                                                         | Terminal                                                                                                                                                     | None                                               | Preserve terminal timestamp, actor, and failure or decline reason                                                     |

Conflict rule:

- Conflicting attestations do not average out.
- Material conflicts move the affected record to `disputed` while under review, or directly to `contradicted` once the contradictory evidence is accepted.
- Public-positive trust lift stops immediately at the first material conflict.

#### Proof Pack

Proof Pack lifecycle remains distinct from verification status, freshness, and portfolio distribution.

| Valid state  | Allowed transitions                                | Transition triggers                                                                                | Who can cause transition                              | Audit requirements                                                      |
| ------------ | -------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| `draft`      | `ready`, `archived`                                | Owner completes minimum required fields, or archives unused draft                                  | Owner                                                 | `proof_pack_id`, `created_at`, `state_changed_at`, actor                |
| `ready`      | `published`, `submitted`, `withdrawn`, `archived`  | Owner publishes, uses it in a workflow, withdraws it, or archives it                               | Owner                                                 | `published_at`, `submitted_at`, `withdrawn_at`, actor, visibility scope |
| `published`  | `submitted`, `withdrawn`, `superseded`, `archived` | Pack is used in workflow, owner withdraws public use, newer pack replaces it, or owner archives it | Owner, system when superseded by explicit replacement | `published_at`, `withdrawn_at`, `superseded_at`, replacement reference  |
| `submitted`  | `withdrawn`, `superseded`, `archived`              | Owner withdraws from future use, newer pack replaces it, or owner archives residual history        | Owner, system                                         | linked `submission_id`, `state_changed_at`, reason                      |
| `withdrawn`  | `superseded`, `archived`                           | Owner replaces it with a successor or archives it                                                  | Owner                                                 | `withdrawn_at`, actor, reason                                           |
| `superseded` | `archived`                                         | Historical successor relationship is finalized                                                     | System, owner                                         | `superseded_at`, `superseded_by_pack_id`                                |
| `archived`   | None                                               | Terminal                                                                                           | None                                                  | Preserve full audit trail and exportability                             |

#### Introduction

The introduction lifecycle is the canonical product layer aligned to Appendix A1. Existing event names such as `intro_pending` and `intro_accepted` remain valid machine-stable aliases.

| Valid state | Allowed transitions                                      | Transition triggers                                                                            | Who can cause transition      | Audit requirements                                                                                                                         |
| ----------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `pending`   | `accepted`, `declined`, `expired`, `withdrawn`, `closed` | Counterparty accepts, declines, intro timer expires, requester withdraws, or assignment closes | Candidate, org member, system | `intro_id`, `assignment_id`, `candidate_profile_id`, `org_id`, `created_at`, `accepted_at` or `declined_at` or `expires_at`, actor, reason |
| `accepted`  | `handoff`, `withdrawn`, `closed`                         | Reveal is approved and interview corridor starts, either party withdraws, or assignment closes | Candidate, org member, system | `accepted_at`, reveal reference if used, actor, reason                                                                                     |
| `declined`  | `closed`                                                 | Decline is finalized                                                                           | System                        | `declined_at`, reason                                                                                                                      |
| `expired`   | `closed`                                                 | 14-day intro timer ends without response                                                       | System                        | `expires_at`, reminder log, reason `intro_expired`                                                                                         |
| `withdrawn` | `closed`                                                 | Requester or counterparty withdraws active intro                                               | Candidate, org member         | `withdrawn_at`, actor, reason                                                                                                              |
| `handoff`   | `closed`                                                 | Interview object created or the handoff corridor otherwise terminates                          | System                        | downstream `interview_id`, `state_changed_at`                                                                                              |
| `closed`    | None                                                     | Terminal                                                                                       | None                          | Preserve terminal reason and downstream references                                                                                         |

Reveal rule:

- Reveal remains an audited gate between `accepted` and `handoff`.
- Reveal approval is required before any identity-bearing move into interview coordination.

#### Interview

Decision-overdue is a derived SLA condition on interview completion, not a separate interview state.

| Valid state   | Allowed transitions                                          | Transition triggers                                                                                       | Who can cause transition      | Audit requirements                                                                                            |
| ------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `pending`     | `scheduled`, `closed`                                        | Either side requests interview and slot is being coordinated, or the corridor closes before scheduling    | Candidate, org member, system | `interview_id`, `assignment_id`, `intro_id`, `created_at`, `state_changed_at`, actor                          |
| `scheduled`   | `rescheduled`, `completed`, `cancelled`, `no_show`, `closed` | Time changes, host marks complete, org cancels, org reports no-show, or assignment closes                 | Org owner/admin, host, system | `scheduled_for`, `reschedule_count`, `completed_at` or `cancelled_at` or `no_show_reported_at`, actor, reason |
| `rescheduled` | `completed`, `cancelled`, `no_show`, `closed`                | Updated slot occurs, cancellation, no-show, or assignment closes                                          | Org owner/admin, host, system | Preserve prior schedule history and incremented `reschedule_count`                                            |
| `completed`   | `closed`                                                     | Decision and candidate-visible feedback obligations are satisfied, or the corridor is otherwise finalized | Org owner/admin, system       | `completed_at`, `decision_due_at`, `feedback_due_at`, `closed_at`, decision reference                         |
| `cancelled`   | `closed`                                                     | Cancellation finalized                                                                                    | System                        | `cancelled_at`, actor, reason                                                                                 |
| `no_show`     | `closed`                                                     | No-show is finalized or recovered by a new interview record                                               | Org owner/admin, system       | `no_show_reported_at`, reporter, reason, recovery interview reference if any                                  |
| `closed`      | None                                                         | Terminal                                                                                                  | None                          | Preserve terminal reason and any replacement interview id                                                     |

Decision-overdue rule:

- `decision overdue` is a derived SLA breach when an interview is `completed` and no candidate-visible decision plus required feedback is recorded by `decision_due_at`.
- The system must emit an auditable overdue event and reminder cadence, but the interview remains `completed` until a final closure transition occurs.

#### Contract / engagement verification

This model is the MVP trust contract for engagement confirmation. It is not legal contract enforcement, payroll proof, or enterprise compliance.

| Valid state                        | Allowed transitions                                                                                              | Transition triggers                                                                                                                                    | Who can cause transition                                 | Audit requirements                                                                                |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `reported`                         | `pending_counterparty_attestation`, `pending_document_review`, `reported_unverified`, `withdrawn`, `superseded`  | One side reports engagement, sends counterparty request, uploads evidence for review, leaves it as unverified report, withdraws, or replaces it        | Candidate, org representative, internal reviewer         | `engagement_verification_id`, `engagement_id`, `created_at`, `reported_at`, actor, source surface |
| `pending_counterparty_attestation` | `verified`, `reported_unverified`, `disputed`, `withdrawn`, `superseded`                                         | Counterparty attests, request expires without corroboration, counterparty disputes, reporter withdraws, or record is replaced                          | Candidate, org representative, system, internal reviewer | `counterparty_requested_at`, `counterparty_responded_at`, `request_expires_at`, actor, reason     |
| `pending_document_review`          | `verified`, `reported_unverified`, `disputed`, `withdrawn`, `superseded`                                         | Reviewer or authorized org verifies uploaded document, review fails to corroborate, dispute opens, reporter withdraws, or record is replaced           | Internal reviewer, authorized org verifier, system       | `document_uploaded_at`, `review_started_at`, `reviewed_at`, actor, reason                         |
| `reported_unverified`              | `pending_counterparty_attestation`, `pending_document_review`, `verified`, `disputed`, `withdrawn`, `superseded` | More corroboration is requested later, document review starts, stronger evidence verifies it, dispute opens, reporter withdraws, or replacement occurs | Candidate, org representative, internal reviewer, system | `reported_unverified_at`, actor, reason                                                           |
| `verified`                         | `disputed`, `withdrawn`, `superseded`                                                                            | Later contradiction or withdrawal opens dispute, owner retracts record, or newer verified record replaces it                                           | Candidate, org representative, internal reviewer         | `verified_at`, verification method, actor, reason                                                 |
| `disputed`                         | `verified`, `reported_unverified`, `withdrawn`, `superseded`                                                     | Review resolves positively, degrades to unverified report, reporter withdraws, or replacement record takes over                                        | Internal reviewer, admin                                 | `disputed_at`, resolution actor, reason                                                           |
| `withdrawn`                        | None                                                                                                             | Terminal                                                                                                                                               | None                                                     | Preserve `withdrawn_at`, withdrawing actor, reason                                                |
| `superseded`                       | None                                                                                                             | Terminal                                                                                                                                               | None                                                     | Preserve successor reference and `superseded_at`                                                  |

Verification threshold:

- `verified` requires either:
  - mutual attestation from both sides on the same engagement record, or
  - at least one uploaded document plus org verification or human review
- One-sided claims, one-sided attestation, or uploaded evidence without corroboration remain `reported_unverified`.

### Edge-case matrix

| Edge case                                   | Canonical handling                                                                                                                                                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Withdrawn application                       | Move `draft`, `submitted`, or `under_review` application to `withdrawn`, then `closed`; preserve `withdrawn_at`, actor, and reason; do not delete related submissions                                         |
| Duplicate application                       | Return existing non-terminal application for that `assignment_id`; emit `duplicate_application_blocked`; do not create a second active record                                                                 |
| Expired assignment                          | Move assignment to `closed` with `closure_reason = expired`; terminate open applications, intros, and interviews with explicit `assignment_closed` or `assignment_expired` reasons                            |
| Late submission                             | Compare `submitted_at` to `submission_deadline_at`; log `reason_code = late_submission`; route to manual review or deterministic rejection according to assignment policy                                     |
| Verification requested but no response      | Keep verification in `pending` until `request_expires_at`; then move to `expired`; trust lift never begins; emit `verification_request_expired`                                                               |
| Conflicting attestations                    | Remove active trust lift immediately; move to `disputed` while under review or `contradicted` once material conflict is accepted                                                                              |
| Intro expired                               | Keep intro in `pending` until expiry timer ends, then move to `expired`, then `closed`; re-entry requires a new intro record                                                                                  |
| Intro declined                              | Move intro to `declined`, then `closed`; preserve actor and decline reason; same record may not be reopened                                                                                                   |
| Interview no-show                           | Move active scheduled or rescheduled interview to `no_show`, then `closed`; any recovery starts a new interview record and links back to the prior no-show                                                    |
| Decision overdue                            | Treat as derived SLA breach on `completed` interview with missing candidate-visible decision and feedback by `decision_due_at`; emit escalation events; do not fabricate a new hidden state                   |
| Offer or engagement accepted then withdrawn | If not yet corroborated, move engagement verification to `withdrawn`; if previously `verified`, move immediately to `disputed` until the withdrawal claim is resolved                                         |
| Contract claimed but not yet verified       | Keep engagement verification in `reported`, `pending_counterparty_attestation`, `pending_document_review`, or `reported_unverified`; it may be analytics-visible but must not satisfy hard verification gates |

### Lifecycle effects matrix

| State or condition                                      | Trust visibility                                            | Public portfolio display                                                                            | Matching eligibility                                                | Analytics treatment                                 |
| ------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------- |
| `assignment.active`                                     | Neutral                                                     | Not a portfolio signal                                                                              | Eligible for matching and application                               | Counts as open assignment inventory                 |
| `assignment.closed`                                     | Neutral                                                     | Public assignment page may remain historical if separately allowed                                  | Stops new applications, intros, and interview progression           | Counts in closure reasons and time-to-close metrics |
| `application.withdrawn` or `application.rejected`       | Neutral to mildly negative only in private workflow context | Never public                                                                                        | Candidate is no longer eligible for that application corridor       | Counts as funnel drop-off with explicit reason      |
| `submission.accepted`                                   | Supports workflow readiness only                            | May strengthen linked public-safe proof if the linked Proof Pack is public                          | Can satisfy workflow delivery requirements                          | Counts as accepted delivery event                   |
| `submission.rejected` with `late_submission`            | No positive trust lift                                      | Never public on its own                                                                             | Does not satisfy workflow requirement                               | Counts separately as late-delivery failure          |
| `verification.verified`                                 | Positive scoped trust signal                                | Public only as narrow, privacy-safe trust language                                                  | May satisfy hard verification gates                                 | Counts as successful verification                   |
| `verification.expired` or `downgraded`                  | Stops active gate satisfaction and reduces trust lift       | Public-safe freshness language only, if allowed                                                     | May block gates or reduce ranking depending on requirement type     | Counts in expiry and refresh backlog metrics        |
| `verification.disputed`, `contradicted`, or `revoked`   | Positive trust lift removed immediately                     | No public-positive badge                                                                            | Hard-blocks any gate that depended on that verification             | Counts as integrity or dispute event                |
| `proof_pack.published`                                  | Positive only if linked proof is otherwise strong           | Eligible for public rendering according to visibility rules                                         | Eligible for matching use if visibility and readiness pass          | Counts as publication event                         |
| `proof_pack.withdrawn` or `superseded`                  | Stops positive lift from that pack immediately              | Removed from public rendering immediately                                                           | No longer satisfies future workflow needs unless replacement exists | Counts as withdrawal or replacement event           |
| `intro.accepted`                                        | Neutral                                                     | Never public                                                                                        | Eligible to proceed to reveal and interview corridor                | Counts as successful intro conversion               |
| `intro.expired`, `intro.declined`, or `intro.withdrawn` | Neutral in public, visible privately for workflow history   | Never public                                                                                        | Stops that intro corridor; re-entry requires new intro              | Counts as terminal intro outcome                    |
| `interview.no_show`                                     | Negative workflow signal, not a public fraud claim          | Never public                                                                                        | Stops that interview record; recovery requires new interview        | Counts in no-show rate and recovery metrics         |
| `interview.completed` with decision overdue             | Neutral publicly; operationally negative for org SLA health | Never public                                                                                        | Candidate remains pending outcome; no automatic disqualification    | Counts as SLA breach and escalation                 |
| `engagement.reported_unverified`                        | Reported only; no strong trust lift                         | May appear only as owner-private or authorized-review reported history, not a public verified claim | Must not satisfy hard contract or proof gates                       | Counts as reported but unverified engagement        |
| `engagement.verified`                                   | Positive scoped trust signal for engagement completion      | Public-safe summary allowed only if the linked proof is public and privacy-safe                     | May satisfy engagement-confirmation gates                           | Counts as verified engagement outcome               |
| `engagement.disputed` or `engagement.withdrawn`         | Positive lift removed immediately                           | Public verified language removed immediately                                                        | No longer satisfies any engagement gate                             | Counts as dispute or withdrawal event               |

### Canonical timestamps and retention

Common timestamps required on every lifecycle object:

- `created_at`
- `updated_at`
- `state_changed_at`

Object-specific timestamps:

- Assignment: `published_at`, `held_at`, `resumed_at`, `closed_at`, `expires_at`
- Application: `submitted_at`, `review_started_at`, `advanced_at`, `rejected_at`, `withdrawn_at`, `closed_at`
- Submission: `submission_deadline_at`, `submitted_at`, `reviewed_at`, `accepted_at`, `rejected_at`, `withdrawn_at`, `superseded_at`
- Verification: `requested_at`, `request_expires_at`, `verified_at`, `expired_at`, `superseded_at`, `downgraded_at`, `contradicted_at`, `disputed_at`, `revoked_at`, `cancelled_at`
- Proof Pack: `published_at`, `submitted_at`, `withdrawn_at`, `superseded_at`, `archived_at`
- Introduction: `accepted_at`, `declined_at`, `withdrawn_at`, `expires_at`, `handoff_at`, `closed_at`
- Interview: `scheduled_for`, `rescheduled_at`, `completed_at`, `cancelled_at`, `no_show_reported_at`, `decision_due_at`, `feedback_due_at`, `closed_at`
- Contract / engagement verification: `reported_at`, `counterparty_requested_at`, `counterparty_responded_at`, `document_uploaded_at`, `reviewed_at`, `reported_unverified_at`, `verified_at`, `disputed_at`, `withdrawn_at`, `superseded_at`

Retention rules:

- Auth and application logs: retain 180 days
- Audit logs: retain 2 years
- Analytics events: retain 2 years, then anonymize and archive
- Withdrawn, disputed, superseded, and closed records remain auditable and owner-exportable for their retention window even when they no longer count toward trust, visibility, or eligibility

### Example transition payloads

`application_submitted`

```json
{
  "event": "application_submitted",
  "application_id": "app_123",
  "assignment_id": "asg_456",
  "candidate_profile_id": "pro_789",
  "from_state": "draft",
  "to_state": "submitted",
  "actor_type": "candidate",
  "actor_id": "pro_789",
  "reason_code": "candidate_submit",
  "occurred_at": "2026-03-10T10:30:00Z"
}
```

`submission_rejected_late`

```json
{
  "event": "submission_rejected",
  "submission_id": "sub_123",
  "assignment_id": "asg_456",
  "application_id": "app_123",
  "from_state": "submitted",
  "to_state": "rejected",
  "actor_type": "system",
  "reason_code": "late_submission",
  "submitted_at": "2026-03-10T10:35:00Z",
  "submission_deadline_at": "2026-03-10T10:00:00Z",
  "occurred_at": "2026-03-10T10:35:01Z"
}
```

`verification_expired_no_response`

```json
{
  "event": "verification_request_expired",
  "verification_record_id": "ver_123",
  "verification_kind": "skill_attestation_peer",
  "subject_type": "proof_artifact",
  "subject_id": "art_456",
  "from_state": "pending",
  "to_state": "expired",
  "actor_type": "system",
  "reason_code": "no_response",
  "request_expires_at": "2026-03-24T12:00:00Z",
  "occurred_at": "2026-03-24T12:00:01Z"
}
```

`intro_expired`

```json
{
  "event": "intro_expired",
  "intro_id": "intro_123",
  "assignment_id": "asg_456",
  "candidate_profile_id": "pro_789",
  "org_id": "org_321",
  "from_state": "pending",
  "to_state": "expired",
  "actor_type": "system",
  "reason_code": "intro_timeout",
  "expires_at": "2026-03-24T12:00:00Z",
  "occurred_at": "2026-03-24T12:00:01Z"
}
```

`engagement_verified`

```json
{
  "event": "engagement_verified",
  "engagement_verification_id": "eng_123",
  "engagement_id": "engagement_456",
  "from_state": "pending_document_review",
  "to_state": "verified",
  "actor_type": "manual_platform_reviewer",
  "actor_id": "rev_789",
  "reason_code": "document_plus_org_confirmation",
  "verification_method": "uploaded_agreement_and_org_confirmation",
  "verified_at": "2026-03-25T09:15:00Z",
  "occurred_at": "2026-03-25T09:15:00Z"
}
```

### Facts & Decisions

- The master PRD now contains one canonical lifecycle contract for assignment, application, submission, verification, Proof Pack, introduction, interview, and contract / engagement verification.
- `application` is first-class and remains separate from `submission`.
- Calm UI language must never erase deterministic backend state, auditability, or edge-case handling.
- Contract / engagement verification is a trust signal only. It is not legal contract enforcement, payroll verification, or enterprise compliance.
- `decision overdue` is modeled as a derived SLA condition, not a competing persisted lifecycle state.
- Existing machine-stable events from Appendix A1 remain valid and should map cleanly to this block.

### Open Questions

- Should the later implementation standardize one storage enum family directly to these product-state names, or keep explicit alias mapping where current schema names differ?
- Which engagement document classes, if any, should automatically qualify for human-review priority at launch?
- Should future post-MVP policy distinguish offer acceptance from engagement completion as separate trust objects, or keep one engagement-verification object with richer reason codes?

### Acceptance Criteria

- Backend and QA can derive one legal transition map for each of the eight lifecycle objects without relying on implied product behavior.
- Illegal transitions are explicitly rejectable for each object.
- Duplicate-guard behavior is deterministic for applications, verification requests, and active intros.
- Assignment closure deterministically terminates open downstream records with explicit reasons.
- Withdrawn, disputed, contradicted, superseded, and closed records remain auditable and exportable for their retention window.
- `reported_unverified` engagement never satisfies a hard verification gate.
- `verified` engagement affects trust visibility and analytics without implying legal enforceability.
- Timeout handling is explicit for intro expiry, verification no-response expiry, and decision-overdue SLA breach.

## 5.10B Deletion, Withdrawal, Export, and Re-import Reconciliation Ledger (MVP)

### Purpose

Define deterministic system behavior when content is deleted, withdrawn, depublished, exported, or re-imported.

### Facts & Decisions

- Reconciliation is an append-only ledger, not ad hoc cleanup.
- Delete and withdraw affect trust, visibility, exportability, and downstream references separately.
- Older soft-delete language in non-canonical docs is deprecated for product behavior.

### Canonical Definitions / Object Model

`reconciliation_ledger_entry` fields:

- `ledger_entry_id`
- `target_object_type`
- `target_object_id`
- `action_type=delete|withdraw|depublish|export|reimport`
- `prior_state`
- `new_state`
- `initiated_by_principal_id`
- `dependency_refs[]`
- `public_cache_action`
- `export_impact`
- `import_impact`
- `slug_lock_until`
- `occurred_at`

### Deterministic Reconciliation Rules

- Deleted proof referenced elsewhere:
  - parent Proof Pack recalculates immediately
  - public page removes the proof immediately
  - events or case studies queue rebuild
  - historical references become `missing_source` internally, never public placeholders with hidden detail
- Withdrawn verification:
  - positive trust lift stops immediately
  - public verification log becomes coarse withdrawn or unavailable state only if already allowed by policy
  - matching gates recalculate immediately
- Public page cache invalidation:
  - issue purge or rebuild within 5 minutes
  - fallback is `noindex` plus stale-content suppression if purge lags
- Slug and handle reuse safety:
  - deleted or depublished public handles and slugs are locked for 90 days before reuse
  - exact reuse is blocked during the lock window
- Export after delete request:
  - once delete is confirmed, no new export jobs may start for that object
  - in-flight export jobs are cancelled if they have not produced a final artifact
  - already completed exports remain outside platform control
- Re-import with missing child evidence from older exports:
  - import succeeds only as `incomplete_import`
  - missing children receive withheld references
  - imported object gets no stronger trust lift than the surviving evidence supports
- Depublish:
  - removes public route, metadata, previews, and public-safe exports
  - does not erase owner-visible audit history
- Withdraw:
  - removes future trust or public lift
  - preserves owner auditability and permitted internal history

### Roles / Permissions Implications

- Owners may delete or withdraw only objects they own.
- Org actors may depublish org-owned pages and withdraw org-owned proof or events within scope.
- Trust Ops may force takedown or restricted visibility with audited reason codes.

### Visibility / Privacy Implications

- Public-safe export always reflects current public-safe state, never historical wider state.
- Old exports are never treated as a license to republish deleted or withdrawn material inside the platform.

### Events / Analytics Implications

Canonical events:

- `reconciliation_entry_written`
- `public_cache_invalidation_requested`
- `public_cache_invalidation_completed`
- `export_cancelled_by_delete`
- `reimport_marked_incomplete`

### Out of Scope

- remote deletion of user-downloaded files
- public tombstone pages with detailed history
- instant handle reuse
- full legal hold system

### Open Questions

- None for MVP.

### Acceptance Criteria

- Deleting a proof that appears on a public page removes it from the page, previews, and public-safe export deterministically.
- Re-importing an old export with missing child evidence does not recreate full trust or public lift.
- Slug reuse is blocked for the defined safety window.
- Withdrawn verification immediately removes positive trust lift without deleting audit history.

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
- Effective visibility follows the narrowest-wins rule across pack scope, child-artifact scope, workflow reveal ceiling, moderation state, and policy ceiling.
- Redaction is a supporting control for previews and allowed renders. It is not a separate reveal system.
- Matching reveal, public publication, owner preview, export, and operator review are separate render contexts and must not widen one another implicitly.
- Minimal data collection and PII minimization are launch requirements. Raw PII must not appear in logs, traces, analytics, or public-safe rendering.
- Hidden fields must not leak through copy actions, deep links, filenames, metadata, or identity-bearing preview data.
- Manually uploaded artifacts with identifying metadata must render as sanitized, withheld, or requires-review until a later allowed reveal stage.

### 6.4 Public Portfolio Interaction with Matching

- Public portfolios are explicit publication surfaces.
- Matching review must not expose a direct portfolio route, handle, or identity-bearing URL before the allowed reveal stage.
- Public portfolio publication never overrides blind review, stage-based reveal, or consent-gated identity exposure.
- Reveal remains stage-based, bias-aware, and consent-gated even when a public portfolio exists.
- Sanitized Proof Pack summaries may appear in matching without exposing the public route.

### 6.5 Explainable Matching Reason Codes, Overrides, and Fairness Operations (MVP)

This section defines the canonical MVP contract for deterministic shortlist explanations, reviewer and manager actions, override governance, and fairness operations. It is normative for product, design, analytics, and QA. Current repo enums and events may remain in compatibility mode temporarily, but they must map into this contract rather than compete with it.

#### Facts & Decisions

- One canonical explainability record must exist for every scoring output, shortlist decision, intro-eligibility failure, shortlist rejection, manual pass, manual snooze, manual hold, reveal denial, assignment expiry effect, and post-review override.
- The canonical explainability record is append-only and must preserve both:
  - the automatic system reasons produced at score time
  - the manual reviewer or manager reasons added later
- Manual reasons and overrides never erase the original automatic reasons.
- User-visible explanation order is deterministic and follows the canonical score-factor order below. The same structured inputs must produce the same factor order, reason-code order, and tie-break result.
- Score factors define explanation and audit order only. They do not promise user-visible numeric weights.
- PAC remains a bounded positive contribution inside `mission_values_alignment`, consistent with the technical requirements contract.
- Forbidden inputs remain protected attributes and their proxies, Zen or wellbeing data, identity prestige signals, popularity or engagement metrics, and reviewer notes or overrides as score inputs.
- Fairness operations are required MVP system behavior, not an optional analytics add-on. At minimum they include weekly snapshots for active review pools and a release-candidate snapshot before launch or any material scoring change.

#### Canonical scoring frame

```ts
type MatchScoreFactor =
  | 'capability_band_fit'
  | 'tool_fluency'
  | 'mission_values_alignment'
  | 'freshness'
  | 'availability_deadline_fit'
  | 'language_timezone_fit';
```

- User-facing "Why this match" ordering must always follow `MatchScoreFactor`.
- `capability_band_fit` is the launch-safe replacement for broad skill and depth fit language.
- `tool_fluency` is canonical in the PRD even if current implementation still represents some of it indirectly through skills, proof fit, or role evidence.
- `mission_values_alignment` covers purpose and values overlap only when real overlap exists. Missing data remains neutral.
- `availability_deadline_fit` covers practical timing fit, not compensation or recruiter preference.
- `language_timezone_fit` combines communication and coordination fit for explanation ordering.

Compatibility note with current repo codes:

| Canonical factor            | Current repo aliases or partial representations                          |
| --------------------------- | ------------------------------------------------------------------------ |
| `capability_band_fit`       | `skills_strong`, `skills_gap`, parts of current proof-fit language       |
| `tool_fluency`              | currently partial through `skills_strong`, proof evidence, focus signals |
| `mission_values_alignment`  | `purpose_alignment_strong`, `purpose_alignment_partial`                  |
| `freshness`                 | current freshness and stale-policy trace fields                          |
| `availability_deadline_fit` | `logistics_fit`, `availability_mismatch`                                 |
| `language_timezone_fit`     | `language_fit`, `language_mismatch`, `timezone_mismatch`                 |

#### Canonical reason-code taxonomy

```ts
type AutoMatchReasonCode =
  | 'include_capability_band_fit'
  | 'include_tool_fluency_fit'
  | 'include_mission_values_alignment'
  | 'include_freshness_current'
  | 'include_deadline_fit'
  | 'include_language_timezone_fit'
  | 'intro_block_capability_gap'
  | 'intro_block_tool_gap'
  | 'intro_block_freshness'
  | 'intro_block_deadline_conflict'
  | 'intro_block_language_timezone_mismatch'
  | 'intro_block_reveal_policy'
  | 'intro_block_assignment_expired'
  | 'reject_capability_gap'
  | 'reject_tool_gap'
  | 'reject_values_mismatch'
  | 'reject_stale_proof'
  | 'reject_deadline_conflict'
  | 'reject_language_timezone_mismatch'
  | 'block_assignment_closed'
  | 'block_assignment_expired'
  | 'block_reveal_policy'
  | 'block_private_proof_unusable'
  | 'fairness_warning_active'
  | 'fairness_ranking_suppressed';

type ManualReviewReasonCode = 'manual_pass_for_now' | 'manual_snooze' | 'manual_hold_for_review';

type PostReviewOverrideReasonCode =
  | 'override_keep_under_review'
  | 'override_shortlist_manual'
  | 'override_reject_manual';
```

- Automatic codes are used for:
  - shortlist inclusion
  - intro eligibility failure
  - shortlist rejection
  - reveal or assignment blockers
- Manual review codes are used only for reviewer or manager actions such as pass, snooze, and hold.
- Post-review override codes are used only when a human changes the review-state outcome after seeing the automatic result.
- Every rejection, pass, hold, snooze, intro block, or reveal block must include at least one blocker code. Supportive inclusion codes may also be present when they clarify what was strong.

Automatic versus manual sources:

- `source = system`
  - derivable from structured assignment inputs, structured profile inputs, freshness state, reveal policy, fairness status, and assignment lifecycle state
- `source = reviewer` or `source = manager`
  - limited to `ManualReviewReasonCode`
- `source = override`
  - limited to `PostReviewOverrideReasonCode`

Compatibility note with current repo enums:

| Current repo code             | Canonical bucket or likely alias                                |
| ----------------------------- | --------------------------------------------------------------- |
| `skills_strong`               | `include_capability_band_fit`                                   |
| `skills_gap`                  | `intro_block_capability_gap` or `reject_capability_gap`         |
| `verification_ready`          | launch-safe support signal inside shortlist inclusion           |
| `logistics_fit`               | `include_deadline_fit`                                          |
| `language_fit`                | `include_language_timezone_fit`                                 |
| `shortlist_selected`          | shortlist inclusion state, not a score factor                   |
| `passed_for_now`              | `manual_pass_for_now`                                           |
| `rejected_constraints`        | `reject_capability_gap`, `reject_deadline_conflict`, or related |
| `override_keep_under_review`  | `override_keep_under_review`                                    |
| `override_shortlist_manual`   | `override_shortlist_manual`                                     |
| `override_reject_manual`      | `override_reject_manual`                                        |
| `fairness_warning_active`     | `fairness_warning_active`                                       |
| `fairness_ranking_suppressed` | `fairness_ranking_suppressed`                                   |

#### Exact user-visible behavior

- Individuals see:
  - the top 1 to 3 plain-language reasons only
  - current shortlist, reveal, or intro state
  - the next best action, such as refresh proof, widen availability, or wait for review
  - no reviewer notes, no protected-class language, and no concealed proof details
- Organizations see:
  - deterministic ordered reasons grouped by "why this match" and "what may hold it back"
  - shortlist or intro blockers
  - generic language for manual states such as "kept under review"
  - no hidden candidate notes and no hidden field values
- Admins and auditors see:
  - full ledger rows
  - source, actor, and timestamps
  - `score_version`, `model_version`, `weights_version`, `explanation_version`
  - override linkage
  - reveal-stage transition history
  - fairness snapshot references

#### Privacy boundaries

- No protected-class inference leakage is allowed in counterpart-facing explanations, analytics payloads, or fairness dashboards.
- No hidden reviewer or manager notes may be shown cross-party.
- Free-text justification must not be used directly in fairness dashboards when coded or hashed alternatives suffice.
- Hidden or private proofs that would improve ranking but cannot be used may surface only as a generic policy-safe explanation such as "additional non-shareable evidence exists but cannot be used at this stage." They must never reveal the concealed content, owner intent, filename, source URL, or identity-bearing metadata.
- Public portfolio publication does not weaken blind-by-default review or reveal policy.

#### Override rules

- Allowed override actors:
  - organization `owner`
  - organization `admin`
  - organization `member`
  - platform admin for policy remediation or fairness remediation only
- Disallowed override actors:
  - organization `viewer`
  - platform admin performing routine shortlist steering
- Override is allowed only when:
  - the assignment is still active
  - the match is still live
  - no protected-boundary or reveal-policy bypass occurs
  - the override does not expose hidden identity or hidden notes outside the allowed reveal corridor
- Mandatory override justification:
  - exactly one `PostReviewOverrideReasonCode`
  - non-empty internal justification
  - actor id and actor role
  - prior state and new state
  - prior reveal scope and new reveal scope
- Logging requirements:
  - append the override to the reason ledger
  - retain a note hash for analytics-safe joins
  - retain raw justification only in a private audit surface
  - emit the override lifecycle event
- Ranking effect:
  - override changes review state and allowed workflow state
  - override does not rewrite the system score, factor values, or original score trace
  - any manual display ordering must be logged as display-state override metadata rather than ranking recomputation

#### Fairness operations and audit data

- Each reviewable match must remain auditable through deterministic operations data containing at minimum:
  - `score_version`
  - `model_version`
  - `weights_version`
  - `explanation_version`
  - `inputs_hash`
  - `tie_break_vector`
  - `reason_codes`
  - `decision_surface`
  - `decision_state`
  - `source`
  - `override_count`
  - `reveal_stage_transitions`
  - `reason_code_distribution`
  - `fairness_status`
  - `fairness_snapshot_id`
  - periodic snapshot metadata including cadence, snapshot window, and generated timestamp
- Fairness operations must support:
  - reason-code distribution reporting
  - override count reporting
  - reveal-stage transition reporting
  - score-version and weights-version review
  - approved internal cohort analysis only when privacy thresholds pass
- Fairness outputs are internal only and must remain aggregate-first.

#### "Why this match" UX contract

- Plain language only.
- Deterministic order following `MatchScoreFactor`.
- No black-box wording such as "the model thinks" or "the algorithm decided."
- No promise of numeric decomposition on counterpart-facing surfaces.
- No comparative ranking language when fairness suppression is active.
- The explanation must answer:
  - what looks strong
  - what is missing or blocked
  - what the next best step is

#### Edge cases

- Empty shortlist:
  - show a calm empty state with explicit blocker reasons
  - log `shortlist_decision_logged` with at least one blocker code
- Ties:
  - resolve with the canonical tie-break vector already stored in the score trace
  - preserve the same factor and reason ordering for tied candidates
- Stale proofs:
  - must produce `intro_block_freshness` or `reject_stale_proof` as appropriate
  - must appear before any manual reason in user-facing ordering
- Private proofs that would improve ranking but cannot be used:
  - log `block_private_proof_unusable`
  - keep explanation generic and policy-safe
- Expired assignment:
  - log `intro_block_assignment_expired` or `block_assignment_expired`
  - do not allow shortlist advancement or intro creation

#### Canonical events and payloads

- `match_scored`
  - minimum fields: `match_id`, `assignment_id`, `profile_id`, `org_id`, `score_version`, `model_version`, `weights_version`, `explanation_version`, `factor_order`, `reason_codes`, `inputs_hash`, `source`, `occurred_at`

```json
{
  "event": "match_scored",
  "match_id": "9a5c6d63-5a8f-4f2d-b20a-4d67f7d3ef91",
  "assignment_id": "f0fb23a3-d601-40ce-b0c7-4f320d5ef6bb",
  "profile_id": "5f997dc7-8151-4bb0-bb63-7c31cb9e6d02",
  "org_id": "fb6390ce-00d4-47e1-a317-3e9d8ec7bf78",
  "score_version": "match-score/v1",
  "model_version": "core-rules/v1",
  "weights_version": "core-rules/v1",
  "explanation_version": "reason-codes/v1",
  "factor_order": [
    "capability_band_fit",
    "tool_fluency",
    "mission_values_alignment",
    "freshness",
    "availability_deadline_fit",
    "language_timezone_fit"
  ],
  "reason_codes": [
    "include_capability_band_fit",
    "include_mission_values_alignment",
    "include_deadline_fit"
  ],
  "inputs_hash": "6df0d3d64b7d1f45c3c4d5a0d88b44f58d40f6a3b1e9185df21d4bbf5d5f928a",
  "source": "system",
  "occurred_at": "2026-03-10T10:00:00Z"
}
```

- `reason_code_assigned`
  - minimum fields: `match_id`, `reason_code`, `reason_family`, `decision_surface`, `decision_state`, `source`, `actor_type`, `score_version`, `occurred_at`

```json
{
  "event": "reason_code_assigned",
  "match_id": "9a5c6d63-5a8f-4f2d-b20a-4d67f7d3ef91",
  "reason_code": "intro_block_freshness",
  "reason_family": "automatic",
  "decision_surface": "org_review_queue",
  "decision_state": "intro_blocked",
  "source": "system",
  "actor_type": "system",
  "score_version": "match-score/v1",
  "occurred_at": "2026-03-10T10:00:00Z"
}
```

- `shortlist_decision_logged`
  - minimum fields: `match_id`, `assignment_id`, `decision_state`, `reason_codes`, `decision_surface`, `source`, `actor_type`, `occurred_at`

```json
{
  "event": "shortlist_decision_logged",
  "match_id": "9a5c6d63-5a8f-4f2d-b20a-4d67f7d3ef91",
  "assignment_id": "f0fb23a3-d601-40ce-b0c7-4f320d5ef6bb",
  "decision_state": "shortlisted",
  "reason_codes": [
    "include_capability_band_fit",
    "include_tool_fluency_fit",
    "include_deadline_fit"
  ],
  "decision_surface": "org_review_queue",
  "source": "system",
  "actor_type": "system",
  "occurred_at": "2026-03-10T10:01:00Z"
}
```

- `override_applied`
  - minimum fields: `match_id`, `assignment_id`, `org_id`, `override_reason_code`, `previous_state`, `new_state`, `previous_reveal_scope`, `new_reveal_scope`, `actor_type`, `actor_role`, `source`, `occurred_at`

```json
{
  "event": "override_applied",
  "match_id": "9a5c6d63-5a8f-4f2d-b20a-4d67f7d3ef91",
  "assignment_id": "f0fb23a3-d601-40ce-b0c7-4f320d5ef6bb",
  "org_id": "fb6390ce-00d4-47e1-a317-3e9d8ec7bf78",
  "override_reason_code": "override_shortlist_manual",
  "previous_state": "passed",
  "new_state": "shortlisted",
  "previous_reveal_scope": "blind",
  "new_reveal_scope": "shortlist_identity",
  "actor_type": "organization_member",
  "actor_role": "admin",
  "source": "reviewer",
  "occurred_at": "2026-03-10T10:03:00Z"
}
```

- `override_revoked`
  - minimum fields: `match_id`, `assignment_id`, `org_id`, `override_reason_code`, `previous_state`, `new_state`, `previous_reveal_scope`, `new_reveal_scope`, `actor_type`, `actor_role`, `source`, `occurred_at`

```json
{
  "event": "override_revoked",
  "match_id": "9a5c6d63-5a8f-4f2d-b20a-4d67f7d3ef91",
  "assignment_id": "f0fb23a3-d601-40ce-b0c7-4f320d5ef6bb",
  "org_id": "fb6390ce-00d4-47e1-a317-3e9d8ec7bf78",
  "override_reason_code": "override_shortlist_manual",
  "previous_state": "shortlisted",
  "new_state": "passed",
  "previous_reveal_scope": "shortlist_identity",
  "new_reveal_scope": "blind",
  "actor_type": "organization_member",
  "actor_role": "admin",
  "source": "reviewer",
  "occurred_at": "2026-03-10T10:08:00Z"
}
```

- `fairness_snapshot_created`
  - minimum fields: `fairness_snapshot_id`, `assignment_id`, `score_version`, `weights_version`, `snapshot_cadence`, `window_start`, `window_end`, `reason_code_distribution`, `override_counts`, `reveal_stage_transitions`, `source`, `occurred_at`

```json
{
  "event": "fairness_snapshot_created",
  "fairness_snapshot_id": "6c0f4b71-c417-4308-91ff-39d869cc4dc0",
  "assignment_id": "f0fb23a3-d601-40ce-b0c7-4f320d5ef6bb",
  "score_version": "match-score/v1",
  "weights_version": "core-rules/v1",
  "snapshot_cadence": "weekly",
  "window_start": "2026-03-03T00:00:00Z",
  "window_end": "2026-03-10T00:00:00Z",
  "reason_code_distribution": {
    "include_capability_band_fit": 18,
    "intro_block_freshness": 4,
    "reject_deadline_conflict": 3
  },
  "override_counts": {
    "override_shortlist_manual": 2,
    "override_reject_manual": 1
  },
  "reveal_stage_transitions": {
    "blind_to_shortlist_identity": 6,
    "shortlist_identity_to_full_identity": 2
  },
  "source": "system",
  "occurred_at": "2026-03-10T10:15:00Z"
}
```

Payload rules:

- No protected attributes or protected-attribute proxies.
- No raw internal notes.
- `reason_code_distribution`, `override_counts`, and transition reporting must remain aggregate-first.

Compatibility aliases to current implementation events:

| Canonical event             | Current implementation alias                                              |
| --------------------------- | ------------------------------------------------------------------------- |
| `match_scored`              | `match_generated` plus score trace persistence                            |
| `reason_code_assigned`      | reason-ledger insert tied to scoring or review mutation                   |
| `shortlist_decision_logged` | `match_shortlisted` or `match_passed` plus review-state ledger write      |
| `override_applied`          | `review_override_applied`                                                 |
| `override_revoked`          | `review_override_reverted`                                                |
| `fairness_snapshot_created` | `fairness_evaluations` persistence plus optional internal analytics event |

#### Open Questions

- When should `tool_fluency` split into dedicated persisted code enums instead of compatibility mapping through existing skills and proof signals?
- Does MVP need a second fairness snapshot cadence beyond weekly active-pool snapshots and release-candidate checkpoints?
- Should the compatibility mirror PRD later carry a condensed version of this section, or remain source-of-truth light?

#### Acceptance Criteria

- The `6.5` section exists only once and uses the heading `Explainable Matching Reason Codes, Overrides, and Fairness Operations (MVP)`.
- All six canonical score factors are defined and the explanation order matches them exactly.
- Automatic reason codes, manual review reason codes, and post-review override reason codes are defined separately.
- Counterpart-facing behavior is specified separately for individuals, organizations, and admins or auditors.
- Overrides cannot be saved without an allowed actor, exactly one override code, and a non-empty internal justification.
- Overrides change decision state and permitted workflow state only. They do not rewrite the original system score or factor trace.
- Fairness operations require `score_version`, reason-code distribution, override counts, reveal-stage transitions, `fairness_snapshot_id`, and periodic snapshot metadata.
- Counterpart-facing surfaces never expose hidden reviewer notes, protected-class language, or concealed proof details.
- The "Why this match" contract remains plain-language, deterministic, and free of black-box wording.
- Empty shortlist, ties, stale proof, private-proof-unusable, and expired-assignment states all have explicit logged behavior.
- The section defines the canonical events `match_scored`, `reason_code_assigned`, `shortlist_decision_logged`, `override_applied`, `override_revoked`, and `fairness_snapshot_created` with example payloads and compatibility aliases.

### 6.5A Operational Shortlist Fallback Contract (MVP)

### Purpose

Define system behavior when shortlist quality is low, no candidate clears threshold, only near-threshold candidates exist, assignment inputs are weak, or supply is thin.

### Facts & Decisions

- Empty or weak shortlist is an explicit operating state, not a silent failure.
- The product must prefer calm fallback over false certainty.
- Matching may widen only within explicit org-allowed settings.

### Canonical Definitions / Object Model

Operating states:

- `qualified_shortlist_ready`
- `near_threshold_only`
- `no_qualified_candidates`
- `assignment_under_specified`
- `supply_thin`
- `fairness_suppressed`

Near-threshold candidate definition:

- no hard policy block
- no reveal-policy block
- no fairness suppression block
- only soft blockers such as small capability gap, proof thinness, or manageable logistics gap

### System Behavior

| Scenario                             | System behavior                                               | User-facing action                                                |
| ------------------------------------ | ------------------------------------------------------------- | ----------------------------------------------------------------- |
| Shortlist quality too low            | show `near_threshold_only` or `no_qualified_candidates` state | explain blocker family and next best action                       |
| No candidates pass threshold         | suppress intro creation, keep browse-safe review live         | suggest assignment edits, BYOC, or wait                           |
| Only near-threshold candidates exist | show them in a clearly labeled near-threshold lane            | allow request for more proof, not direct auto-intro               |
| Assignment under-specified           | block exact ranking and intro corridor                        | require role, outcomes, must-have skills, and constraints cleanup |
| Supply too thin                      | keep portfolio and review corridor live, pause intro promises | offer BYOC and opt-in radius expansion if allowed                 |

### Fallback UX Rules

- Show near-threshold candidates only when the org has enabled `show near-threshold`.
- Suggest assignment edits using reason-coded prompts:
  - clarify must-have skills
  - narrow or broaden constraints
  - reduce proof strictness
  - split one assignment into smaller scopes
- BYOC prompt is shown when:
  - supply is thin
  - shortlist is empty
  - org has a known candidate path
- Radius expansion is allowed only if the org opted into wider geography or async work modes.
- Request-more-proof prompt is shown only to candidates already in the corridor and only when stronger proof could plausibly change state.

### Roles / Permissions Implications

- `org_owner`, `org_manager`, and permitted `org_reviewer` roles may choose fallback actions within their review permissions.
- `trust_admin` may observe fallback rates but not silently override them.

### Visibility / Privacy Implications

- Near-threshold lanes never widen reveal stage.
- Under-specified-assignment warnings never expose hidden candidate detail.

### Events / Analytics Implications

Canonical events:

- `shortlist_operating_state_entered`
- `near_threshold_candidate_shown`
- `assignment_edit_suggested`
- `byoc_prompted`
- `radius_expansion_prompted`
- `more_proof_requested`

### Out of Scope

- auto-lowering thresholds without disclosure
- fake waitlists
- dense-market ranking theatrics
- generic recruiting funnel dashboards

### Open Questions

- None for MVP.

### Acceptance Criteria

- An empty shortlist always renders a named operating state with explicit next actions.
- Near-threshold candidates are clearly labeled and never presented as qualified intros.
- Under-specified assignments are blocked from exact ranking until fixed.
- Fallback analytics can distinguish thin supply from poor assignment definition.

### 6.5B Overwhelm Watch and Next-Best-Action Layer (MVP-lite)

### Purpose

Provide one minimal cognitive-load reduction layer without re-expanding Zen or introducing behavioral surveillance.

### Facts & Decisions

- The system shows at most one primary next best action and one optional secondary action at a time.
- Overwhelm watch is operational, not medical, diagnostic, or therapeutic.
- No hidden psychological scoring is permitted.

### Canonical Definitions / Object Model

`next_best_action_record` fields:

- `nba_id`
- `principal_id`
- `surface=individual|organization`
- `primary_action_code`
- `secondary_action_code`
- `reason_family`
- `generated_at`
- `cooldown_until`

Reason families:

- `stalled_setup`
- `proof_thin`
- `verification_pending`
- `assignment_under_specified`
- `thin_supply`
- `decision_overdue`
- `fallback_active`

### Overwhelm / Risk Signals

Signals allowed:

- 3 or more incomplete required steps after 7 days
- repeated entry into fallback states
- repeated draft abandonment
- verification about to expire
- decision or feedback overdue
- assignment publish blocked twice for missing basics

Signals intentionally not collected:

- keystroke dynamics
- emotion inference
- mental-health inference
- off-platform browsing
- passive microphone or camera data
- social graph activity

### Nudge Rules

- Max one in-product nudge per surface every 24 hours.
- Email nudges allowed only for:
  - verification pending expiry
  - overdue feedback
  - unclaimed invites nearing expiry
- Copy must be calm and operational.
- Nudges may not use scarcity theater, shame, or health framing.

### Roles / Permissions Implications

- Individuals see only their own next action.
- Org roles see only org-relevant next actions according to their permissions.
- Trust Ops can view aggregated reason families only.

### Visibility / Privacy Implications

- Next-best-action records are private to the principal context that owns them.
- No public or matched-org surface may infer overwhelm state from missing activity.

### Events / Analytics Implications

Canonical events:

- `next_best_action_generated`
- `next_best_action_dismissed`
- `next_best_action_completed`
- `overwhelm_watch_signal_detected`

Analytics allowed:

- action completion rate
- reason-family distribution
- stale-state reduction

### Out of Scope

- mental wellness scoring
- streak systems
- gamified nudges
- intervention chatbots

### Open Questions

- None for MVP.

### Acceptance Criteria

- The system never shows more than one primary action at once on a given surface.
- No disallowed behavioral telemetry is collected.
- Nudges remain calm and infrequent.
- Overdue operational states can trigger next-best actions without exposing private workflow detail publicly.

---

### 6.6 Capability Band Rubrics by Domain (MVP)

This block defines the lean MVP rubric contract for capability bands by domain. It exists because explainable matching cannot depend forever on undefined future rubrics, yet MVP also cannot ship an enormous ontology. The launch contract is a small shared band ladder plus domain-specific evidence expectations.

Capability bands exist instead of generic years-of-experience logic because years served is a weak cross-domain proxy. Ten years in hospitality, software, design, or event operations does not mean the same observable capability, independence, or proof quality. Proofound therefore uses capability bands to summarize what a person appears able to do in a scoped domain capability, based on evidence quality and corroboration, not only elapsed time.

The master brief still treats full domain rubric coverage as unfinished. MVP now locks a minimal version so explainable matching, proof review, and reviewer guidance do not rely on an abstract future system.

#### Facts & Decisions

- MVP uses one shared four-band ladder across launch domains:
  - `Band 1`
    - assisted / foundational execution
  - `Band 2`
    - working / reliable execution
  - `Band 3`
    - independent / end-to-end execution
  - `Band 4`
    - leading / shaping / mentoring execution
- Capability bands measure observable scope, independence, repeatability, and evidence quality. They do not encode years served directly.
- MVP uses a lean, extensible rubric framework rather than a giant universal capability ontology.
- Launch-supported rubric domains are:
  - `design`
  - `software / data`
  - `culinary / hospitality`
  - `events / operations`
- Each launch domain starts with a small curated list of high-signal capabilities only. Exhaustive domain coverage is explicitly out of scope for MVP.
- Capability-band provenance states are:
  - `self-claimed`
  - `inferred`
  - `attested`
  - `verified`
- These provenance states are not replacements for the canonical trust badge family elsewhere in the PRD. They are a rubric-specific way to describe how much support exists behind a capability-band assignment.
- Every rubric row set carries a `rubric_version`.
- Rubric edits must be additive or explicitly versioned. Rows must not be silently rewritten in ways that change prior meaning.

#### Shared band semantics

| band / range | domain-neutral meaning        | reviewer shorthand                                               |
| ------------ | ----------------------------- | ---------------------------------------------------------------- |
| `Band 1`     | assisted / foundational       | participates with supervision or constrained responsibility      |
| `Band 2`     | working / reliable            | executes defined tasks or service moments consistently           |
| `Band 3`     | independent / end-to-end      | owns delivery or accountable execution with limited supervision  |
| `Band 4`     | leading / shaping / mentoring | shapes systems, standards, orchestration, or other people’s work |

#### Lean rubric framework

MVP rubric rows use this compact schema:

| field                    | meaning                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `domain`                 | one of the launch-supported rubric domains only                                                                          |
| `capability`             | a lean, human-readable unit such as `interaction design`, `backend delivery`, `line service`, or `run-of-show execution` |
| `band / range`           | one of the shared `Band 1` to `Band 4` values                                                                            |
| `evidence expectations`  | the minimum observable proof or corroboration expected for that capability and band                                      |
| `example artifact types` | illustrative artifact or evidence examples only, never a mandatory checklist                                             |

#### Band-assignment provenance rules

- `self-claimed`
  - the owner selected the band directly
  - no outside corroboration is yet required
- `inferred`
  - the system suggested a likely band based on structured evidence, artifacts, outcomes, and related profile signals
  - this may support recall, reviewer triage, and next-best-action guidance
  - this is not a standalone proof claim and must not be rendered as verified fact
- `attested`
  - the band is supported by scoped active non-self evidence such as `peer-attested`, `org-verified`, or `human-reviewed` records tied to the capability or its qualifying artifacts
  - attestation is capability-scoped and must not silently upgrade unrelated claims
- `verified`
  - the capability-band assignment has enough active scoped evidence to satisfy the rubric threshold for that capability and band
  - verification uses the existing verification model and evidence-layer rules already defined elsewhere in the PRD

Reconciliation rule:

- `self-claimed`, `inferred`, `attested`, and `verified` describe rubric provenance only.
- The canonical verification badge family remains:
  - `self-claimed`
  - `peer-attested`
  - `org-verified`
  - `human-reviewed`
  - `auto-checks-passed`
- Matching and review may derive an `attested` or `verified` capability band from those underlying scoped badge records, but the rubric block does not replace or rename them.

#### How capability bands feed matching and proofs

Matching rules:

- Matching may use `self-claimed` and `inferred` capability bands for recall, soft ranking, and next-best-action guidance.
- Explainable shortlist reasons may reference capability bands only when the supporting provenance state is available internally or shown appropriately on the surface.
- Hard gating, stronger shortlist confidence, or stronger intro language should require `attested` or `verified` support when the assignment asks for stronger proof.
- Public-safe proof summaries must never present `inferred` as if it were verified fact.
- Capability-band explanations must stay scoped to the specific capability and must not inflate into a whole-profile claim such as "senior across the board."

Proof interpretation rules:

- Proof strength is not identical to capability band.
- A higher capability band with weak evidence remains weakly trusted.
- A lower capability band with strong evidence may still be highly usable for matching when the assignment needs reliable execution more than leadership scope.
- Capability band answers "at what observable level does this person appear able to perform this capability?"
- Proof answers "how well-supported is that claim?"

#### Reviewer guidance

Reviewer principles:

- Reviewers assess observable scope, independence, and repeatability, not polish, pedigree, or prestige.
- One polished artifact should not imply `Band 4`.
- Brand-name employers, years worked, titles, school prestige, follower counts, or aesthetic polish should not be treated as direct proxies for band.
- Evidence must be read in domain context.
- Reviewer confidence must remain scoped to the capability being judged.

Band guidance:

- `Band 1`
  - enough evidence: participation, supervised execution, constrained contribution, or narrow task support
  - do not over-interpret as independent ownership
- `Band 2`
  - enough evidence: reliable execution on defined tasks, repeatable delivery, or steady performance in bounded service moments
  - do not over-interpret as system ownership or leadership
- `Band 3`
  - enough evidence: independent ownership, end-to-end delivery, or repeated accountable execution with clear outcomes
  - do not over-interpret as mentoring, organization-wide standard setting, or strategy leadership without stronger proof
- `Band 4`
  - enough evidence: leadership, system-shaping decisions, mentoring, orchestration, or repeated high-stakes ownership with visible downstream effect
  - do not infer from tenure alone or a single flagship artifact

#### Change management

- Each released rubric row set must declare a `rubric_version`.
- Later edits must be additive or create a new explicit version when semantics change.
- New domains may be added later without changing the shared four-band ladder.
- Post-MVP domain expansion should begin with a small curated capability set and grow only when matching demand, review volume, or repeated evidence patterns justify expansion.

#### Sample rubric rows

These rows are illustrative MVP launch examples. They show how the framework stays lean and buildable without creating a giant ontology.

| domain                   | capability              | band / range | evidence expectations                                                                                                                                          | example artifact types                                                                                        |
| ------------------------ | ----------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `design`                 | `interaction design`    | `Band 2`     | Repeated evidence of designing bounded flows or screens that shipped, with rationale, iterations, or usability feedback showing reliable task-level execution. | shipped screen flows, annotated wireframes, usability notes, product handoff files                            |
| `design`                 | `design systems`        | `Band 4`     | Strong evidence of system stewardship across teams, component governance, standards, adoption, and mentoring or shaping downstream design consistency.         | component library docs, governance guidelines, adoption metrics, review rituals, cross-team rollout artifacts |
| `software / data`        | `backend delivery`      | `Band 3`     | Clear evidence of independently shipping services, APIs, or data pipelines end to end, with accountable outcomes and maintainable delivery.                    | merged PRs, service docs, runbooks, incident notes, architecture decision records                             |
| `software / data`        | `data analysis`         | `Band 2`     | Evidence of reliable analysis on defined questions, including structured outputs, interpretation, and repeatable communication of findings.                    | analysis notebooks, dashboards, experiment readouts, SQL or model summaries                                   |
| `culinary / hospitality` | `line service`          | `Band 2`     | Evidence of consistent execution during defined service periods, with repeatable station performance, timing, and standards adherence.                         | service logs, station checklists, menu service photos, supervisor attestations                                |
| `culinary / hospitality` | `menu development`      | `Band 4`     | Strong evidence of shaping menu direction, testing, costing, mentoring kitchen execution, and repeated responsibility for high-stakes culinary decisions.      | menu iteration docs, costing sheets, launch menus, kitchen training materials, event or venue outcomes        |
| `events / operations`    | `run-of-show execution` | `Band 3`     | Evidence of independently owning event execution from prep through live operations, including issue handling and accountable delivery outcomes.                | run sheets, live ops plans, postmortems, organizer confirmations, event outcome reports                       |
| `events / operations`    | `vendor coordination`   | `Band 2`     | Evidence of reliably coordinating defined vendor workflows, timelines, or logistics across repeated engagements without implying total event ownership.        | vendor schedules, coordination checklists, timeline docs, delivery confirmations                              |

#### Open Questions

- Which capabilities inside each launch domain should become the first canonical curated row set for `rubric_version = v1`?
- Whether `verified` capability bands should require a different evidence-count threshold by domain, or whether the first release can rely on reviewer judgment plus the shared band semantics above
- Whether later post-MVP reviewer tooling should expose a private confidence score separate from the public-safe capability band
- Whether some assignments should be allowed to require only `attested` support for a capability while reserving `verified` for more sensitive or higher-stakes contexts

#### Acceptance Criteria

- The canonical PRD defines capability bands as a replacement for generic years-of-experience logic, not as an extra label layered on top of years served.
- The rubric model uses one shared four-band ladder across all MVP domains.
- The lean rubric framework explicitly includes:
  - `domain`
  - `capability`
  - `band / range`
  - `evidence expectations`
  - `example artifact types`
- The launch-supported rubric domains are exactly:
  - `design`
  - `software / data`
  - `culinary / hospitality`
  - `events / operations`
- The PRD defines `self-claimed`, `inferred`, `attested`, and `verified` as capability-band provenance states and states clearly that they do not replace the canonical trust badge family.
- Matching and proof language stay distinct:
  - capability band may inform ranking and explanation
  - proof strength still depends on scoped evidence and verification quality
- Reviewer guidance states what counts as enough evidence for each band and what must not be over-interpreted.
- Change-management rules require `rubric_version`, additive change by default, and future domain additions without changing the shared band ladder.
- Sample rubric tables are included and remain lean rather than attempting exhaustive ontology coverage.
- Scenario: a user self-claims `Band 3` in `backend delivery` but provides only a vague repository link.
  - Result: the band remains `self-claimed`, may inform recall or reviewer triage, and does not justify strong proof language by itself.
- Scenario: a candidate provides repeated event run sheets and outcome evidence confirmed by an organizer.
  - Result: `run-of-show execution` may qualify for `Band 3 attested`.
- Scenario: a chef lists 12 years in hospitality with no scoped evidence.
  - Result: years alone do not assign `Band 4`.
- Scenario: a designer provides design-system governance docs, component-library artifacts, and cross-team adoption evidence.
  - Result: `design systems` may qualify for `Band 4 verified` if the scoped evidence meets the rubric threshold.

### 6.7 Public Verification Log and Algorithm Transparency Surface (MVP-safe)

#### Why this exists

- Build trust without turning launch into a public audit product.
- Keep public verification behavior legible, coarse, and privacy-safe.
- Make scoring or policy changes explainable at the product-policy level without exposing raw model internals.

#### Launch-safe public trust behavior

- Launch may show a coarse public verification summary only where proof is already public and policy allows it.
- That public-safe summary may include only:
  - current verification status
  - current freshness state
  - latest public-safe effective date
  - short provenance language already allowed by the public proof policy
- Launch does not require a full public verification log, full public event history, or public reviewer ledger.
- If the proof is withdrawn, deleted, disputed beyond public-safe scope, or no longer public, any public-safe trust summary must downgrade or disappear immediately.

#### Internal versus public scope

| Audience          | Launch-safe scope                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Public viewer     | current public-safe verification status, freshness state, latest public-safe date, and a short provenance label only           |
| Proof owner       | full owner-visible history, richer provenance, non-public verification records, portability metadata, and remediation guidance |
| Org reviewer      | workflow-scoped verification and freshness detail for proof already visible in the current review corridor                     |
| Admin / trust ops | full audit trail, disputes, review reasons, internal version metadata, and private investigation context                       |

- Public, owner, reviewer, and admin transparency surfaces are different products and must not collapse into one another.

#### Algorithm and scoring change transparency

- Proofound should maintain a plain-language product-policy changelog for meaningful matching or scoring changes.
- Launch changelog entries may include:
  - version label
  - effective date
  - affected surface
  - short summary of what changed in plain language
- Launch changelog entries must not include:
  - raw weights
  - exploit-enabling thresholds
  - hidden feature inventory
  - private cohort analysis
  - reviewer heuristics or private moderation logic
- Public phrasing stays scoped and calm, for example:
  - `matching system updated`
  - `proof freshness treatment updated`
  - `explanation wording refined`

#### What remains private

- reviewer private notes
- admin reason text
- verifier identity beyond already approved public-safe scope
- hidden field values and reveal-gated identity
- raw scoring traces, raw weights, and sensitive fairness operations data
- protected-class inference or protected-signal discussion

#### Deferred post-launch extensions

- Full public verification log or public event ledger
- Rich public methodology notes or accountability reports
- Public score-trace or ranking-trace disclosure
- Broader trust-report publishing infrastructure

#### Facts & Decisions

- Launch transparency is summary-first, scoped, and privacy-boundaried.
- Proofound may ship a coarse public verification summary, but not a full public verification log unless already supported as a minimal surface.
- Launch algorithm or scoring transparency is a plain-language product-policy changelog, not raw model disclosure.
- Public transparency reuses existing verification, freshness, provenance, and version vocabulary instead of inventing a parallel system.

#### Acceptance Criteria

- Public-safe trust rendering stays coarse and never exposes reviewer notes, hidden fields, reveal-gated identity, or raw score internals.
- Withdrawn, deleted, or no-longer-public proof loses public-safe trust rendering immediately or downgrades to a coarse unavailable state where policy allows it.
- Any launch changelog for scoring or matching changes uses plain language, version label, and effective date without exposing raw weights or thresholds.
- The section cannot be read as requiring a full public verification log, public audit ledger, or broader accountability infrastructure at launch.

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
- `proof_pack_updated`
- `proof_pack_ready`
- `proof_pack_published`
- `proof_pack_submitted`
- `proof_pack_withdrawn`
- `proof_pack_superseded`
- `proof_pack_exported`
- `proof_pack_import_validated`
- `proof_pack_import_completed`
- `proof_pack_verification_requested`
- `proof_pack_verification_completed`
- `proof_pack_verification_expired`
- `proof_pack_verification_downgraded`
- `proof_pack_freshness_changed`
- `proof_pack_signature_status_changed`
- `verification_record_created`
- `verification_request_submitted`
- `verification_auto_check_passed`
- `verification_auto_check_failed`
- `verification_human_review_completed`
- `attestation_requested`
- `attestation_completed`
- `attestation_declined`
- `verification_contradicted`
- `verification_corrected`
- `verification_revoked`
- `proof_ladder_promoted`
- `proof_refresh_nudged`
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
- `intro_blocked_by_verification`

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
- `org_trust_tier_changed`
- `assignment_draft_saved`
- `assignment_published`
- `org_sensitive_domain_review_queued`
- `assignment_blocked_by_safety`
- `org_review_queue_viewed`
- `org_flagged_for_abuse`
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

## 7.3A Canonical Async / Background Job Catalog (MVP)

### Purpose

Define the minimum job inventory, contracts, retries, idempotency, and observability rules for launch.

### Facts & Decisions

- Jobs are explicit product contracts, not implementation accidents.
- Every job must be idempotent by key.
- Failed jobs must degrade safely without widening visibility or trust.

### Canonical Job Catalog

| Job key                         | Trigger                                     | Inputs                                                               | Outputs                                            | Retry / idempotency                                            | Failure handling                                                     | Observability                                      |
| ------------------------------- | ------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------- |
| `attestation_reminder_dispatch` | attestation due window                      | `attestation_request_id`, contact refs, due state                    | reminder send record                               | retry 3x with backoff; idempotent by request + reminder window | stop after max retries, mark `reminder_failed`, keep request pending | queue depth, send success rate, aged pending count |
| `proof_freshness_decay`         | daily schedule or proof state change        | `proof_pack_id`, freshness timestamps                                | updated freshness state, optional nudge task       | retry 5x; idempotent by pack + freshness window                | keep prior state, log error, no optimistic downgrade skip            | stale count, decay lag                             |
| `public_page_indexing_sync`     | publish, depublish, noindex change          | route ref, page status                                               | index or deindex request, cache invalidation       | retry 5x; idempotent by route + target state                   | fall back to `noindex` and internal alert                            | invalidation latency, sync success                 |
| `public_cache_invalidation`     | visibility, delete, withdraw, slug change   | object refs, affected routes                                         | cache purge or rebuild completion                  | retry 5x; idempotent by object + version                       | temporary stale suppression banner internally only                   | invalidation lag, stale-hit count                  |
| `owner_export_generation`       | owner export request                        | object refs, export scope                                            | generated export artifact or error                 | retry 2x; idempotent by export request id                      | fail closed, never emit partial public-safe artifact as owner export | generation time, failure rate                      |
| `import_validation`             | import upload                               | payload, schema version, actor                                       | validation result, importable or incomplete status | retry 2x; idempotent by payload hash                           | keep object unimported, emit validation error                        | validation error distribution                      |
| `event_case_study_rebuild`      | event assignment set or public proof change | event id, assignment refs                                            | rebuilt public-safe event summary                  | retry 5x; idempotent by event + content version                | retain prior safe summary or remove unsafe highlights                | rebuild duration, stale summary count              |
| `analytics_etl_projection`      | scheduled window close or event batch       | canonical event slice                                                | warehouse or reporting projection                  | retry 5x; idempotent by event window + checksum                | hold projection, mark reconciliation error                           | null rate, ordering mismatch rate                  |
| `notification_retry`            | transient send failure                      | notification id, channel                                             | final send outcome                                 | retry 5x with channel backoff; idempotent by notification id   | mark `failed_permanent`, no duplicate user-facing fan-out            | retry depth, permanent fail rate                   |
| `cleanup_retention_enforcement` | daily retention pass                        | expired tokens, temp files, stale drafts, cancelled export artifacts | removed temp assets and expired records            | retry 3x; idempotent by object + retention window              | log and retry later, never purge non-expired objects                 | retention lag, orphan count                        |

### Roles / Permissions Implications

- Jobs execute as system actors with scoped capabilities only.
- System jobs may not silently create public visibility or trust lift.

### Visibility / Privacy Implications

- Jobs must re-evaluate effective visibility at execution time.
- Export, indexing, and rebuild jobs must use current policy, not request-time assumptions only.

### Events / Analytics Implications

Canonical job events:

- `job_enqueued`
- `job_started`
- `job_succeeded`
- `job_failed`
- `job_dead_lettered`
- `job_retry_scheduled`

### Out of Scope

- generic background-worker marketplace
- unbounded fan-out jobs
- silent self-healing that changes user-visible state without audit

### Open Questions

- None for MVP.

### Acceptance Criteria

- Each canonical job has a stable job key, inputs, outputs, retry rule, and observability owner.
- Re-running any job after partial failure is safe.
- A failed job never widens visibility or publishes stale hidden content.
- Analytics ETL reports reconciliation drift explicitly instead of silently dropping mismatches.

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
- **Org trust and safety operations**
  - `org_trust_tier_changed`, `org_sensitive_domain_review_queued`, `assignment_blocked_by_safety`, `org_flagged_for_abuse`
- **Fairness note status**
  - derived from release-level event aggregation only when privacy thresholds pass

## 7.6 Trust, Proof Quality, and Verification Lifecycle Analytics (MVP)

### Purpose

- The MVP analytics plan must measure not only speed and workflow movement, but also whether Proofound is producing trustworthy, reusable, verifiable proof.
- Trust must be first-class in analytics because Proofound is a trust-oriented product, not only a workflow product.
- Trust and proof-value analytics are internal launch instrumentation for product, ops, and engineering, not a license to turn the product into a BI surface.
- This block extends TTSC, TTFQI, TTV, PAC, SUS, and fairness note status with first-class proof quality, verification, freshness, fulfillment, reuse, and trust lifecycle metrics.

### Proof Quality Score (MVP)

- MVP uses one compact **Proof Quality Score** from `0-100`.
- The score is intentionally simple and equal-weighted across five understandable dimensions:
  - **evidence completeness**
  - **verifiability**
  - **outcomes clarity**
  - **artifact clarity / structure**
  - **freshness**
- Each dimension is scored as:
  - `0`
    - missing, weak, or unusable
  - `10`
    - partial or acceptable
  - `20`
    - strong or launch-grade
- The Proof Quality Score is the sum of the five dimension scores.
- Score bands:
  - `0-39`
    - weak
  - `40-69`
    - usable but incomplete
  - `70-84`
    - strong
  - `85-100`
    - excellent
- User-facing product surfaces may show only a guidance band, readiness state, or next-best action by default, not a raw numeric score.
- Internal product and trust-ops dashboards may use the exact score, score distribution, and dimension-level breakdown.
- The Proof Quality Score is a trust-quality heuristic only. It is not a ranking override, not a fairness substitute, and must not bypass verification gates, reveal rules, or privacy policy.

### Metric Definitions

- **Time-to-Verified**
  - Median elapsed time from `proof_pack_created` to first successful `verification_completed` for that proof pack.
  - If a workflow has no proof pack yet, use `submission_created` as the fallback start event.
  - Proofound should prefer the proof-pack clock whenever a pack exists and only fall back to the submission clock when a pack has not yet been issued.
- **Assignment fulfillment rate**
  - Share of published assignments that reach at least one verified proof-backed completion outcome within the measurement window.
- **Proof reuse rate**
  - Share of issued proof packs that are later used in at least one downstream match, intro, interview, or contract event.
- **Proof freshness distribution**
  - Distribution of qualifying proof packs across `fresh`, `review_soon`, `stale`, and `expired`.
- **Reviewer SLA adherence**
  - Share of verification-review cases completed within the defined reviewer SLA target.
- **Sponsor conversion rate**
  - Share of sponsor-backed verification or review opportunities that convert to a completed verified artifact.
- **Organization repeat rate**
  - Share of organizations that publish, verify, or complete another proof-backed workflow after their first completed proof-backed workflow.
- **Learner retention after first verified artifact**
  - Share of learners who return after their first verified artifact and create, update, share, or reuse proof again within the measurement window.

Launch-blocking internal trust metrics are:

- Proof Quality Score coverage
- Time-to-Verified
- assignment fulfillment rate
- proof reuse rate
- proof freshness distribution
- reviewer SLA adherence

Tracked at launch but not launch-blocking because they require longer observation windows:

- sponsor conversion rate
- organization repeat rate
- learner retention after first verified artifact

### Verification Lifecycle Funnel

The canonical MVP verification lifecycle funnel is:

1. assignment viewed
2. application started
3. application submitted
4. submission created
5. evidence attached
6. attestation requested
7. verification completed
8. proof pack issued
9. proof pack shared / exported
10. proof used in match / intro / interview / contract

Canonical stage-to-event mapping:

- **assignment viewed**
  - `assignment_viewed`
- **application started**
  - `application_started`
- **application submitted**
  - `application_submitted`
- **submission created**
  - `submission_created`
- **evidence attached**
  - `evidence_attached`
- **attestation requested**
  - `attestation_requested`
- **verification completed**
  - `verification_completed`
- **proof pack issued**
  - `proof_pack_issued`
- **proof pack shared / exported**
  - `proof_pack_shared`, `proof_pack_exported`
- **proof used in match / intro / interview / contract**
  - `proof_used_in_match`, `proof_used_in_intro`, `proof_used_in_interview`, `proof_used_in_contract`

The final stage may be rolled up for funnel reporting, but the machine-stable events must still stay separate so downstream usage can be measured by surface and outcome type.

### Dashboards

Launch analytics must support three separate analytics views by audience:

- **User-facing progress metrics**
  - verification status
  - proof freshness
  - proof quality guidance band
  - next-best action
  - proof pack issued or shared state
- **Internal product metrics**
  - Proof Quality Score distribution
  - Time-to-Verified
  - assignment, application, and submission funnel conversion
  - proof reuse rate
  - sponsor conversion rate
  - organization repeat rate
  - learner retention after first verified artifact
- **Admin / trust ops metrics**
  - reviewer queue depth
  - reviewer SLA adherence
  - verification completion, failure, and expiry
  - stale-proof backlog
  - trust anomalies and override reason codes
  - audit completeness and ETL reconciliation health

The user-facing view must remain calm and progress-oriented. It is not a BI dashboard and must not expose internal trust scoring detail casually.

### Event Taxonomy Additions

This block extends the event taxonomy with explicit lifecycle and trust events for MVP analytics. Event payloads must use ID-like, enum-like, timestamp, or bounded reason-code fields only. They must not use free-text PII.

- `assignment_viewed`
  - `assignment_id`, `viewer_type`, `source_surface`, `org_id`
- `application_started`
  - `assignment_id`, `candidate_id`, `org_id`, `source_surface`
- `application_submitted`
  - `assignment_id`, `candidate_id`, `submission_id`, `org_id`
- `submission_created`
  - `submission_id`, `assignment_id`, `candidate_id`, `submission_type`
- `evidence_attached`
  - `submission_id`, `proof_pack_id`, `artifact_id`, `artifact_kind`, `visibility`
- `attestation_requested`
  - `submission_id`, `proof_pack_id`, `verification_request_id`, `attestation_type`, `requested_party_type`
- `verification_completed`
  - `verification_record_id`, `submission_id`, `proof_pack_id`, `verification_type`, `verification_result`, `time_to_verified_hours`
- `proof_pack_issued`
  - `proof_pack_id`, `submission_id`, `owner_id`, `proof_quality_score_band`, `freshness_state`
- `proof_pack_shared`
  - `proof_pack_id`, `share_method`, `destination_type`, `source_surface`
- `proof_pack_exported`
  - `proof_pack_id`, `export_format`, `export_scope`, `source_surface`
- `proof_used_in_match`
  - `proof_pack_id`, `match_id`, `assignment_id`, `org_id`
- `proof_used_in_intro`
  - `proof_pack_id`, `intro_id`, `assignment_id`, `org_id`
- `proof_used_in_interview`
  - `proof_pack_id`, `interview_id`, `assignment_id`, `org_id`
- `proof_used_in_contract`
  - `proof_pack_id`, `contract_id`, `assignment_id`, `org_id`

Reviewer SLA reporting note:

- MVP does not require a dedicated `reviewer_sla_breached` event if reviewer queue and completion timestamps already exist in source systems.
- Reviewer SLA adherence may be warehouse-derived from review assignment and completion timestamps.
- If the implementation already emits review-stage queue events, those events should be reused rather than duplicated.

### Privacy Rules

- No PII in analytics events.
- No raw message text, freeform feedback text, or direct public viewer identity.
- No Zen or private wellbeing content in trust scoring.
- Demographics are opt-in only and never used casually.
- No demographic or protected-attribute fields in routine trust or product analytics streams.
- Trust analytics must not widen reveal scope, reconstruct identity, or backdoor access to identity-bearing data.
- Event payloads must use opaque IDs, enums, timestamps, and bounded reason codes only.

### Data Quality and ETL Checks Required Before Launch

- Schema validation is required for every launch-critical event.
- Event ingestion must deduplicate idempotently by event key.
- Lifecycle ordering must validate assignment -> application -> submission -> verification -> issue -> share or export -> downstream use.
- Source-table reconciliation is required for launch-critical counts and status distributions.
- Null-rate monitoring is required on all required fields.
- Forbidden-payload scanning must block PII and Zen or private wellbeing leakage.
- Freshness-state reconciliation must match source-of-truth verification and proof tables.
- Dashboard aggregates must reconcile to warehouse and source-of-truth queries before launch.

Launch thresholds:

- forbidden payload violations: `0%`
- schema validation failures on launch-critical events: `0%`
- required-field null rate on launch-blocking metrics: `<=1%`
- required-field null rate on non-blocking trust metrics: `<=3%`
- event ordering or reconciliation mismatches on launch-blocking flows: `<=0.5%`
- dashboard aggregate variance versus source-of-truth queries: `<=1%`

### Facts & Decisions

- TTSC, TTFQI, TTV, PAC, SUS, and fairness note status remain the canonical launch KPI family.
- Proof quality, freshness, verification, fulfillment, reuse, and reviewer SLA metrics are first-class internal trust metrics for MVP.
- Trust is a product value and must be treated as a first-class analytics dimension, not a side note to speed metrics.
- User-facing surfaces remain status and guidance surfaces rather than analytics dashboards.
- The PRD now standardizes explicit lifecycle event names for this funnel. Implementation aliases may exist temporarily, but analytics handoff should map to the canonical names in this block.
- Reviewer SLA adherence may be warehouse-derived at MVP if source timestamps are reliable.
- Proof reuse may be measured through a combination of direct event emission and join-based attribution in MVP.

### Open Questions

- Should sponsor-backed verification be modeled as its own first-class review opportunity object, or derived from funding metadata attached to review requests?
- What exact observation windows should launch reporting use for organization repeat rate and learner retention after first verified artifact?
- If implementation still emits older trust-lifecycle event names in some paths, where should the alias mapping live so engineering and analytics stay synchronized?

### Acceptance Criteria

- Launch dashboards exist for:
  - user-facing progress metrics surface
  - internal product trust dashboard
  - admin / trust ops dashboard
- Launch-blocking metrics are:
  - Proof Quality Score coverage
  - Time-to-Verified
  - assignment fulfillment rate
  - proof reuse rate
  - proof freshness distribution
  - reviewer SLA adherence
- Tracked at launch but not launch-blocking:
  - sponsor conversion rate
  - organization repeat rate
  - learner retention after first verified artifact
- Launch-critical trust events validate against required event schemas with `0%` schema failures.
- Launch-critical trust events contain `0%` forbidden payload violations.
- Required-field null rate stays at `<=1%` for launch-blocking metrics and `<=3%` for non-blocking trust metrics.
- Event ordering or source reconciliation mismatches stay at `<=0.5%` on launch-blocking flows.
- Dashboard aggregate variance versus source-of-truth queries stays at `<=1%`.
- Privacy launch gates are:
  - zero PII payload violations
  - zero Zen or private wellbeing leakage into trust scoring
  - no casual demographic use in trust or product dashboards
- Manual review of the final section confirms:
  - the KPI family still includes Proof Quality Score, Time-to-Verified, fulfillment rate, reviewer SLA adherence, sponsor conversion, and trust-oriented KPIs
  - trust is first-class in analytics without turning the user product into a BI experience
  - the funnel starts at assignment viewing and ends at downstream proof use

## 7.7 Explicit Analytics Exclusions

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
- `1.5 Canonical Scope Cleanup and Legacy Section Reconciliation` governs contradictions across the full document, and newer canonical language overrides older conflicting text.
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
- Org trust tiers and sensitive-domain review gating stay lightweight, operational, and separate from user trust tier, Proof Pack verification status, and moderation-ban states.
- The org review corridor uses privacy-safe matching and staged reveal.
- Optional reviewer access works without introducing enterprise admin scope.
- BYOC candidate invites use Proof Cards derived from Proof Packs.

## 8.4 Lifecycle and State Acceptance

- Profile readiness tiers, user trust tier, Proof Pack verification status, and Proof Pack lifecycle are documented as separate state systems.
- Assignment, application, submission, verification, Proof Pack, intro, interview, engagement verification, feedback follow-up, and portfolio distribution each have one canonical lifecycle or derived SLA contract.
- Public portfolio publication does not weaken reveal restrictions in matching.

## 8.5 Analytics and Privacy Acceptance

- KPI names, definitions, and privacy boundaries are consistent across product, analytics, and QA handoff language.
- Every internal metric named in the PRD maps to explicit source events.
- No user-facing product requirement depends on BI-style analytics surfaces.
- Zen Hub analytics rules match Zen Hub privacy rules everywhere in the PRD.
- Org trust-tier distribution, escalation rates, and abuse flags remain internal-only and do not create user-facing trust dashboards or exposure surfaces.
- Launch trust dashboards are defined for product, operations, and admin trust or audit use without changing the calm user-facing product surface.
- Launch-blocking trust metrics are explicitly identified as Proof Quality Score coverage, Time-to-Verified, assignment fulfillment rate, proof reuse rate, proof freshness distribution, and reviewer SLA adherence.
- Sponsor conversion rate, organization repeat rate, and learner retention after first verified artifact are tracked at launch but are not go or no-go blockers.
- Launch-critical trust events pass schema validation with `0%` schema failures and `0%` forbidden-payload violations.
- ETL validation covers idempotent deduplication, lifecycle ordering, proof-trust snapshot reconciliation, dashboard aggregate parity, and exclusion of Zen or private-partition data from warehouse outputs.
- Required-field null rates stay within `<=1%` for launch-blocking trust metrics and `<=3%` for non-blocking trust metrics.
- Event ordering or source reconciliation mismatches on launch-blocking flows stay within `<=0.5%`.
- Dashboard aggregate variance versus source-of-truth queries stays within `<=1%`.

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

## 9.1 Canonical Technical Foundation Appendix (MVP)

### Purpose

Record the compact implementation-oriented foundation that all PRD behavior assumes.

### Facts & Decisions

- Launch stack is implementation-driven and intentionally narrow.
- This appendix summarizes the product-facing technical baseline only.
- `PRD_TECHNICAL_REQUIREMENTS.md` Section 7 remains the authoritative technical launch contract and wins on implementation detail if wording ever overlaps.

### Canonical Technical Foundation

- Web and app layer:
  - Next.js App Router web application
  - React and TypeScript
  - route-driven individual, org, admin, and public portfolio surfaces
- API and validation layer:
  - App Router route handlers
  - server-side auth checks
  - schema validation at request boundaries
  - reason-coded business rules
- Database and storage:
  - Postgres via Supabase
  - Drizzle schema and SQL migrations
  - RLS plus server-side authorization checks
  - append-only audit and lifecycle records for sensitive actions
- Auth model:
  - Supabase Auth
  - SSR cookie sessions for interactive web use
  - scoped capability tokens for invite, attestation, recovery, and review flows
- File storage:
  - private-by-default object storage
  - quarantine-first upload path
  - public-safe promotion only for allowed safe media
- Async model:
  - Postgres-backed queue tables backed by durable launch-safe storage
  - idempotent workers and cron-triggered processing
- Observability:
  - structured app logs
  - Sentry for errors and release health
  - Vercel Analytics for web vitals
  - Supabase dashboard for database health
  - one uptime monitor
  - internal audit routes for trust and security review
- Export and import endpoints:
  - owner export endpoints for versioned JSON
  - public-safe export projection for public objects only
  - import preview and validation before trusted attach

### Roles / Permissions Implications

- Auth, visibility, and audit concerns live at the API boundary, not just in UI code.
- Internal admin and Trust Ops routes remain separate from public and user routes.

### Visibility / Privacy Implications

- No client-only trust or visibility enforcement is canonical.
- Sensitive data, audit logs, and private files must remain server-enforced and policy-checked.

### Events / Analytics Implications

- Every state-changing API call must emit canonical product events or documented compatibility aliases.
- Export, import, reveal, trust, and cache invalidation actions require audit logging.

### Out of Scope

- mobile native apps
- GraphQL
- Redis as a required launch dependency
- enterprise SSO
- multi-region residency at launch

### Open Questions

- None for MVP.

### Acceptance Criteria

- The appendix matches the current product direction: Next.js, Supabase, Drizzle, scoped tokens, private-by-default storage, structured observability.
- Supabase SSR cookie auth, RLS plus server-side authorization, English-only runtime, Postgres-backed workers, and the narrow observability stack all match the technical launch contract.
- No appendix text implies a broader infra stack than launch actually requires.
- Export/import and upload behaviors align with the canonical visibility and ingest contracts.

## 9.2 Launch Runbook, Synthetic Monitors, and SLO / Alert Contract (MVP)

### Purpose

Define launch gates, smoke tests, synthetic monitors, SLOs, alert thresholds, tracing, rollback, and incident ownership in one compact appendix.

### Facts & Decisions

- Launch is blocked by failures on trust-critical and privacy-critical paths, not by every non-core feature.
- Synthetic monitoring must test both success and safe fallback.
- Rollback is required when a release breaks core trust or privacy paths.
- This appendix stays aligned with `PRD_TECHNICAL_REQUIREMENTS.md` Section 7 and `LAUNCH_RUNBOOK.md`; it does not redefine the technical launch stack.

### Pre-Launch Gates

Launch-blocking before launch:

- auth signup and login
- public portfolio publish and render
- assignment publish
- shortlist generation with safe fallback
- invite or token redemption
- export
- delete or unpublish
- audit logging on sensitive actions
- no privacy or visibility regression in core flows

Non-blocking but monitored:

- wider analytics completeness beyond required thresholds
- post-MVP alpha sponsor or reviewer features
- non-core dashboard experiments

### Smoke-Test Matrix

| Flow                 | Required result                                                 |
| -------------------- | --------------------------------------------------------------- |
| Signup / auth        | account creation or login succeeds, session established         |
| Portfolio publish    | route resolves with correct visibility and metadata             |
| Assignment publish   | assignment reaches live eligible state or explicit block reason |
| Match shortlist      | shortlist or named fallback state appears, never silent empty   |
| Invite redemption    | token redeemed once, scoped action succeeds                     |
| Verification request | request recorded and pending state visible                      |
| Feedback submission  | structured feedback stored and due state cleared                |
| Export               | requested export generated or safely failed                     |
| Delete / unpublish   | object removed from public projection and cache invalidated     |

### Synthetic Monitors

Required launch monitors:

- `/`
- `/login`
- `/api/health` public-safe contract only
- public portfolio render
- assignment publish path
- shortlist path
- invite redemption path
- export path
- delete or unpublish path

Monitor severity:

- `P1` auth, token redemption, portfolio render, export, delete, unpublish
- `P2` shortlist, verification queue, feedback, assignment publish
- `P3` lagging analytics or monitor drift without user-visible breakage

### SLO / Alert Thresholds

Launch SLOs:

- core auth and portfolio availability `99.5%`
- export and delete successful completion `99%`
- public cache invalidation after delete or withdraw within `5 minutes` p95
- alert on:
  - 2 consecutive `P1` monitor failures in 5 minutes
  - 3 consecutive `P2` monitor failures in 15 minutes
  - queue backlog older than 24 hours for verification or feedback
  - public cache invalidation lag above 5 minutes p95

### Critical-Path Tracing

Trace these paths end to end:

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

### Rollback Rules

Rollback immediately when:

- auth or token redemption breaks
- public deleted or withdrawn content remains publicly visible
- export returns the wrong visibility projection
- shortlist leaks identity or bypasses fairness-safe fallback
- audit logging fails on sensitive actions

Monitor post-launch before rollback when:

- analytics ETL drifts without affecting user-visible correctness
- optional provider integrations degrade while manual fallback remains safe

### Incident Ownership

- Engineering on-call owns P1 and P2 technical incidents.
- Product or operations owner owns thin-market triage, structured feedback quality, and fallback-state review within 1 business day.
- Trust Ops owns verification, disputes, and trust-tier queue response within 1 business day.

### Out of Scope

- 24/7 enterprise NOC
- public status page automation
- multi-region failover
- complex SRE tooling

### Open Questions

- None for MVP.

### Acceptance Criteria

- Launch-blocking and monitor-only failures are explicitly separated.
- Every critical path has a smoke test and synthetic monitor.
- Rollback conditions are tied to trust, privacy, export, and visibility correctness.
- Incident ownership is explicit and non-overlapping.

## 9.3 Pilot, Rollout, and Roadmap Appendix (12-Week Corridor)

### Purpose

Capture the operating rollout plan without widening launch scope.
This appendix is now summarized here only. The final operating roadmap, pilot assumptions, checkpoints, and exit criteria live in `12.3 Pilot, Rollout, and 12-Week Roadmap Appendix`.

### Facts & Decisions

- MVP must launch narrow.
- Post-launch learning should come from curated pilots, not open marketplace sprawl.
- Reviewer network, sponsor corridor, university corridor, and employer corridor are phased expansions.
- If this appendix and Section 12.3 overlap, Section 12.3 wins immediately.

### 12-Week Roadmap

- See Section 12.3 for the final phased roadmap and corridor split.

### Initial Pilot Assumptions

- 2 NGOs + 1 commune or equivalent early partners is the default pilot anchor.
- 30 to 75 initial individuals across proof-ready and first-proof cohorts.
- 2 to 3 public Events or Missions with multiple assignments is the working pilot target.
- No open candidate marketplace and no public searchable people index.

### Target Early Partners

- mission-driven SMEs
- startups with bounded project work
- NGOs with clear outcomes and limited hiring corridors
- university or bootcamp partners only in the later first-proof corridor, not as a launch requirement
- community ambassador or local chapter concepts are later corridor operating experiments, not launch scope

### First Public Events / Missions

- See Section 12.3 for the final events and missions corridor.

### Outcome Case-Study Publishing

- See Section 12.3 for the final case-study publishing rules.

### Reviewer Network Incubation

- Not launch-blocking. Final reviewer incubation rules live in Sections 12.3 and 12.4.

### University / First-Proof Corridor

- Not launch-blocking. Final first-proof corridor rules live in Section 12.3.

### Employer Pilot Corridor

- Not launch-blocking. Final employer pilot and analytics corridor rules live in Section 12.3.

### Out of Scope

- broad consumer launch
- dense-market automation
- recruiting marketplace expansion
- employer self-serve analytics suites
- campus social features

### Open Questions

- None for launch.

### Acceptance Criteria

- Launch-blocking work is clearly separated from early post-launch and later expansion.
- Curated pilot assumptions stay narrow and credible.
- Events, case studies, reviewer incubation, university corridor, and employer pilots do not backdoor generic recruiting-SaaS scope into launch.

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

## 11. Reviewer Marketplace, Impact Bounties, Sponsors, and Anti-Exploitation Guardrails (Post-MVP Alpha Corridor)

### Purpose

Keep the post-MVP alpha corridor visible without making this section a second competing spec.

### Facts & Decisions

- This corridor remains **Post-MVP Alpha** and **not launch-blocking**.
- The full consolidated corridor now lives in `12.4 Reviewer Marketplace, Impact Bounties, Sponsor Corridor`.
- If this section and Section 12.4 ever overlap, Section 12.4 wins immediately.
- MVP remains unchanged:
  - no payments
  - no escrow
  - no generalized billing
  - no open marketplace liquidity mechanics

### Out of Scope

- full marketplace liquidity systems
- complex payouts
- escrow engine
- tax/legal automation
- generalized billing platform
- duplicating the consolidated corridor spec outside Section 12

### Acceptance Criteria

- This section clearly states it is a non-launch-blocking alpha corridor.
- The detailed operating rules live in Section 12.4.

## 11.1 Reviewer SLA Defaults, Bounty Pricing Bands, Sponsor Corridor, and Legal Template Hooks (Post-MVP Alpha)

### Purpose

Strengthen the post-MVP alpha corridor without making it launch-blocking.
This section is now a short pointer only. Final SLA, pricing-band, sponsor metadata, and legal hook rules live in Sections 12.4 and 12.6.

### Facts & Decisions

- This section is inactive unless the reviewer or sponsor corridor is enabled.
- These defaults are placeholders for alpha operations, not launch promises.
- No payout, escrow, or billing engine is implied.
- If this section and Sections 12.4 or 12.6 overlap, Section 12 wins immediately.

### Roles / Permissions Implications

- `sponsor_actor` may manage sponsor metadata only on linked sponsor objects.
- `trust_admin` may review disputes and sponsor compliance state.
- Org actors may link sponsor metadata only where their org owns the underlying assignment or review object.

### Visibility / Privacy Implications

- Sponsor display is coarse by default.
- Reviewer SLA state is internal or org-owned only.
- Bounty amount exact values remain optional and non-public unless future policy narrows otherwise.

### Events / Analytics Implications

- Use the consolidated alpha events in Section 12.4.

### Out of Scope

- payouts
- invoicing
- escrow
- legal negotiation workflow
- public reviewer marketplace browsing

### Open Questions

- Exact public visibility of bounty bands may remain closed for alpha unless explicitly enabled.

### Acceptance Criteria

- The alpha corridor can operate with metadata, SLAs, and policy hooks without implying a billing product.
- The detailed operating defaults are defined in Sections 12.4 and 12.6 rather than duplicated here.

---

## 12. Final Reconciliation Addendum, Operating Appendices, and Legacy Cleanup

### 12.1 Canonical Scope Statement

#### Purpose

Restate the final MVP corridor in one decisive launch-safe block and prevent broader ambitions from becoming accidental blockers.

#### Facts & Decisions

- Proofound MVP is centered on:
  - proof creation
  - verification and provenance
  - explainable matching
  - privacy-safe progressive reveal
  - intros, interviews, and feedback follow-up
  - public portfolio trust
  - lean organization assignment workflows
- Proofound is proof-first, portfolio-first, privacy-first, bias-aware, explainable, and calm by design.
- Proofound is not a generic recruitment SaaS, HR admin suite, engagement product, or gamified portfolio-maintenance tool.
- Broader ambitions remain represented only as:
  - appendices
  - MVP-lite corridors
  - Post-MVP Alpha corridors
  - later expansion corridors
- Broader ambition material must never override launch-blocking MVP sections.

#### Scope tag

`MVP`

#### Core rules or object model

- Canonical launch objects remain:
  - `proof_pack`
  - `artifact`
  - `proof_card`
  - `match`
  - `intro`
  - `interview`
  - `feedback_follow_up`
  - `assignment`
- Launch-critical corridors are:
  - proof building and publishing
  - verification and attestations
  - visibility and privacy controls
  - explainable matching
  - intro and interview workflow
  - public trust surfaces
  - lean org review and assignment handling
- Any feature not directly strengthening those corridors is appendix-only unless another canonical MVP section explicitly marks it as required.

#### Privacy / visibility implications

- Blind-by-default reveal, narrowest-scope-wins visibility, and private-by-default evidence remain launch-binding.
- Public portfolio trust must stay public-safe and must not leak reviewer notes, raw evidence internals, hidden identity, or private wellbeing content.

#### Events / analytics implications

- Launch-blocking instrumentation stays anchored to the canonical MVP event taxonomy and `7.6 Trust, Proof Quality, and Verification Lifecycle Analytics (MVP)`.
- Appendix metrics may be tracked later without becoming launch gates unless explicitly promoted into the canonical KPI contract.

#### Out of Scope

- public people directory behavior
- dense marketplace liquidity
- ATS, HRIS, payroll, escrow, or generalized billing
- vanity engagement loops
- broad org operating-system surfaces
- sponsor and reviewer marketplace mechanics as launch blockers

#### Acceptance Criteria

- The MVP corridor is stated once and unambiguously.
- Broader ambition material is clearly labeled as appendix, MVP-lite, Post-MVP Alpha, or later.
- No reader can reasonably interpret the master PRD as requiring generic recruiting-suite or engagement-product scope for launch.

### 12.2 Final Contradiction Cleanup Table

#### Purpose

Resolve lingering legacy scope conflicts with one deterministic disposition table.

#### Facts & Decisions

- Newer canonical sections win immediately.
- Older mirrored text, historical summaries, and archived legacy PRD language must never override this master PRD.
- Anything still useful but non-core moves to an appendix or post-MVP corridor rather than remaining ambiguous in MVP.

#### Scope tag

`MVP`

#### Core rules or object model

- Disposition enums:
  - `keep as-is`
  - `rewrite and narrow`
  - `move to appendix`
  - `deprecate/remove`
- Rule:
  - exactly one primary disposition must apply to each legacy theme
  - if ambiguity remains, the narrower launch-safe reading wins

#### Final contradiction cleanup table

| legacy section / theme                                                                                               | keep as-is | rewrite and narrow | move to appendix | deprecate/remove | reason                                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------ | ---------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Zen Hub mood-responsive UI                                                                                           |            | Yes                |                  |                  | Keep only optional private check-ins and reflections; remove mood-reactive product behavior, adaptive UX logic, and any implication that wellbeing changes ranking, trust, or reveal |
| self-assessments                                                                                                     |            | Yes                |                  |                  | Self-claims may exist only as low-trust owner-entered profile input or rubric guidance; they must not act as standalone trust proof or ranking authority                             |
| work schedule / burnout guardrails                                                                                   |            |                    | Yes              |                  | Useful for later safety and labor-boundary exploration, but not part of launch MVP trust or matching logic                                                                           |
| local in-person discovery / external resource library                                                                |            |                    | Yes              |                  | These are discovery or support corridors, not proof-first launch requirements                                                                                                        |
| micro-wins streaks                                                                                                   |            |                    |                  | Yes              | Streak mechanics contradict calm UX and create engagement-product drift                                                                                                              |
| vanity / engagement loops                                                                                            |            |                    |                  | Yes              | Public counters, habit loops, leaderboards, and retention nudges are non-canonical and conflict with proof-first trust design                                                        |
| over-expanded org surfaces such as structure, culture, impact hubs, project libraries, enterprise expertise surfaces |            | Yes                |                  |                  | Narrow to trust profile, assignment publishing, match review, minimal access, and approved MVP-lite corridors only                                                                   |
| donor / investor export framing                                                                                      |            |                    | Yes              |                  | Broader funding and stakeholder reporting may matter later, but launch keeps only canonical owner export and public-safe trust export                                                |
| premium-pack / purchase-journey assumptions                                                                          |            |                    |                  | Yes              | Pricing-packaging and purchase-flow assumptions are not canonical MVP product behavior                                                                                               |

#### Privacy / visibility implications

- No legacy theme may widen public visibility, reveal hidden identity, expose private wellbeing signals, or create sponsor disclosure by default.
- Self-assessment and future support signals remain private or low-trust unless another canonical section explicitly narrows their use.

#### Events / analytics implications

- Deprecated engagement-loop concepts must not produce launch event requirements.
- Zen or private wellbeing events remain segregated from trust, ranking, fairness, and public analytics.
- Appendix-only corridors may define future instrumentation, but those events are not launch-blocking.

#### Out of Scope

- preserving conflicting legacy behavior for convenience
- treating archived PRD wording as normative launch scope

#### Acceptance Criteria

- Each listed legacy theme has one unambiguous disposition.
- No mirrored or archived wording can override this table.
- Any still-useful non-core concept is clearly appendix-only or later-corridor only.

### 12.3 Pilot, Rollout, and 12-Week Roadmap Appendix

#### Purpose

Capture the broader operating plan while keeping launch scope disciplined and testable.

#### Facts & Decisions

- The pilot plan exists to validate Proofound through curated proof-first use, not open-market scale.
- This appendix is planning guidance only. It is not launch scope and it does not create launch-blocking requirements beyond Sections 9.2 and 9.3.
- The roadmap is split into:
  - launch-blocking MVP
  - early post-launch corridor
  - later expansion
- Foundation and proof-hardening work come before reviewer marketplace, sponsor, employer, university, or community expansion.
- Community, university, and ambassador concepts are operating corridors, not launch dependencies.

#### Scope tag

`MVP-lite`

#### Core rules or object model

##### 12-week phased roadmap

| phase / weeks                     | corridor                                  | classification             | required focus                                                                                                                                               |
| --------------------------------- | ----------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Foundation, Weeks 1-2             | canonical launch foundation               | launch-blocking MVP        | principals and memberships, visibility matrix, permission matrix, token security, upload quarantine, publish-safe portfolio and org trust surfaces           |
| Verification hardening, Weeks 3-4 | proof and trust hardening                 | launch-blocking MVP        | verification flow quality, attestations, structured feedback, reconciliation ledger, explainable matching consistency, launch monitors                       |
| Weeks 5-8                         | curated operating pilots                  | early post-launch corridor | 2 NGOs + 1 commune or equivalent, 2 to 3 public events or missions with multiple assignments, early public outcome case studies, thin-market fallback tuning |
| Weeks 9-10                        | reviewer and bounty incubation            | later expansion            | reviewer network incubation, reviewer assignment alpha, bounty and sponsor metadata readiness, lightweight dispute intake                                    |
| Weeks 11-12                       | employer, university, community corridors | later expansion            | university or first-proof partnership corridor, narrow employer proof-fit learning corridor, community ambassador or local chapter concept                   |

##### corridor split

- `launch-blocking MVP`
  - proof creation and publishing
  - verification and provenance hardening
  - explainable matching and progressive reveal
  - intros, interviews, feedback
  - public portfolio trust
  - lean org assignment workflows
- `early post-launch corridor`
  - curated partner pilots
  - early public-safe case studies
  - missions or events as grouped assignment containers
- `later expansion`
  - reviewer marketplace alpha
  - sponsor and bounty corridor
  - university first-proof programs
  - employer proof-fit learning corridor
  - ambassador or local chapter experiments

##### pilot assumptions

- 2 NGOs + 1 commune or equivalent early partners
- 30 to 75 initial individuals across proof-ready and first-proof cohorts
- 2 to 3 public events or missions with multiple assignments
- early public outcome case studies based on verified public-safe proof
- reviewer network incubation begins only after launch stability
- university or first-proof partnership corridor is later, not launch-blocking
- employer corridor is narrow, proof-first, and non-generic
- community ambassador or local chapter concept remains exploratory

##### operating checkpoints and risks

| checkpoint                               | default timing | pass condition                                                   | primary risk if missed                                   |
| ---------------------------------------- | -------------- | ---------------------------------------------------------------- | -------------------------------------------------------- |
| foundation readiness                     | end of week 2  | privacy, visibility, and token controls stable                   | launch blocked by trust or security regression           |
| verification hardening                   | end of week 4  | proof issuance, attestation, feedback, and reconciliation stable | weak proof trust and poor pilot credibility              |
| first pilot activation                   | weeks 5-6      | first partners publish and complete bounded assignments          | partner onboarding drift into services-heavy ops         |
| first public-safe case study             | weeks 7-8      | verified outcome can be published safely                         | storytelling pressure widens scope or leaks private data |
| reviewer alpha readiness                 | weeks 9-10     | reviewer metadata, conflicts, SLA, and dispute intake defined    | exploitation or inconsistent review quality              |
| employer and first-proof corridor review | weeks 11-12    | narrow hypotheses validated without ATS drift                    | product starts behaving like generic recruiting software |

##### pilot exit criteria

- at least 2 NGOs + 1 commune or equivalent have completed bounded assignment workflows
- at least 2 public events or missions have multiple assignments with public-safe outcome summaries
- early case studies are published without private leakage or over-claiming
- first reviewer incubation rules exist and are internally operable
- first-proof and employer pilot corridors remain narrow and non-generic

#### Privacy / visibility implications

- Public case studies require explicit consent, public-safe proof, and no hidden identity leakage.
- Reviewer and sponsor corridor work must remain internal or scoped until later corridors are intentionally enabled.
- Community and local chapter experiments must not create public people-index behavior.

#### Events / analytics implications

- Launch analytics track only launch-blocking metrics as defined in Section 7.6.
- Early post-launch corridor may add:
  - event or mission completion counts
  - partner repeat activity
  - case-study publication readiness
- Later corridor may add:
  - reviewer SLA readiness
  - employer corridor signal quality
  - first-proof corridor retention

#### Out of Scope

- broad consumer launch
- self-serve employer analytics suites
- open reviewer marketplace
- event-management software expansion
- campus social feed behavior

#### Acceptance Criteria

- Launch-blocking MVP work is clearly separated from early post-launch and later corridors.
- Pilot assumptions match the requested partner and mission constraints.
- Community, university, employer, reviewer, and sponsor ambitions are visible without becoming launch blockers.

### 12.4 Reviewer Marketplace, Impact Bounties, Sponsor Corridor

#### Purpose

Define the disciplined post-MVP alpha corridor that reduces review bottlenecks and exploitation risk without turning Proofound into a payments or marketplace platform at launch.

#### Facts & Decisions

- This corridor exists to:
  - reduce verification bottlenecks
  - reduce reviewer exploitation
  - support social-good and sponsored proof work later
- This corridor is explicitly **not launch-blocking**.
- This corridor is post-launch planning only and must not be read as active MVP launch scope.
- The corridor is internal or scoped alpha infrastructure first, not a public two-sided marketplace.
- Full payouts, escrow, payroll, legal automation, and generalized billing remain out of scope.

#### Scope tag

`Post-MVP Alpha`

#### Core rules or object model

##### launch status

- `launch-blocking for MVP`: none
- `alpha minimum once enabled`:
  - reviewer directory alpha
  - reviewer assignment model
  - reviewer eligibility and conflict rules
  - reviewer SLA defaults
  - sponsor metadata model
  - impact bounty metadata and states
  - pro-bono caps and warnings
  - lightweight dispute intake
  - audit logging
  - internal alpha metrics

##### reviewer directory alpha

- Visibility:
  - org owners
  - authorized internal Proofound operators
- Not visible as:
  - public browse directory
  - candidate-facing marketplace
  - automated liquidity feed

##### reviewer assignment model

- assignment mode:
  - `manual_internal_match`
  - `manual_org_selection_from_scoped_directory`
- reviewer fields:
  - `reviewer_id`
  - `display_name`
  - `specialty_headline`
  - `expertise_domains[]`
  - `sectors[]`
  - `geography_or_timezone`
  - `languages[]`
  - `supported_review_types[]`
  - `availability_state`
  - `active_capacity_band`
  - `target_first_response_sla`
  - `target_completion_sla`
  - `conflict_disclosures[]`
  - `visibility_scope`
  - `admin_vetted`
  - `sla_adherence_band`
  - `dispute_rate_band`

##### reviewer eligibility and conflict rules

- eligibility requirements:
  - verified account
  - accepted reviewer policy
  - completed reviewer onboarding
  - at least one qualifying expertise or trust signal
  - no active sanctions
  - no unresolved abuse flags
- conflict rules:
  - no self-review
  - no direct current employer or reporting-line review
  - no undisclosed financial or personal conflict
  - no same-bounty sponsor conflict without explicit internal approval

##### reviewer SLA defaults

| SLA field                   | default                 |
| --------------------------- | ----------------------- |
| accept or decline           | within 3 business days  |
| completion after acceptance | within 5 business days  |
| dispute acknowledgement     | within 2 business days  |
| dispute resolution target   | within 10 business days |

- SLA breach state is internal and analytics-visible, not public by default.

##### sponsor metadata model

- sponsor fields:
  - `sponsor_id`
  - `sponsor_type`
  - `display_name`
  - `funding_state=pending|confirmed|withdrawn`
  - `program_type`
  - `purpose_tag`
  - `allowed_impact_categories[]`
  - `commitment_band_or_amount_ceiling`
  - `disclosure_scope`
  - `linked_review_or_bounty_ref`
  - `policy_version`
  - `internal_audit_refs[]`

- sponsor conversion concepts:
  - `sponsor_pending -> sponsor_confirmed`
  - `sponsor_confirmed -> verified_artifact_completed`
  - `sponsor_confirmed -> corridor_dropped`

##### impact bounty model

- bounty fields:
  - `bounty_id`
  - `pricing_band_code`
  - `currency_code`
  - `display_range_min`
  - `display_range_max`
  - `pricing_source=manual|sponsor_defined`
  - `sponsor_id`
  - `assignment_ref`
  - `impact_category`
  - `terms_ref`
  - `visibility_scope`
  - `rationale_note`
- bounty states:
  - `none`
  - `draft`
  - `sponsor_pending`
  - `sponsor_confirmed`
  - `reviewer_invited`
  - `accepted`
  - `in_review`
  - `closed_completed`
  - `closed_cancelled`
  - `closed_disputed`
- pricing-band placeholders:
  - `band_a_micro`
  - `band_b_standard`
  - `band_c_complex`
  - `band_d_custom`
- fee placeholders:
  - platform fee, reviewer fee, or sponsor fee may exist later as policy placeholders only
  - no active fee engine is implied

##### anti-exploitation logic

- unpaid scope is blocked when:
  - work is clearly commercial or revenue-linked and exceeds the free review corridor
  - expected labor or urgency exceeds unpaid thresholds
  - the org has exhausted pro-bono allowance
  - repeated unpaid requests indicate labor substitution
- bounty, sponsor, or commercial path is required when:
  - pro-bono caps are exceeded
  - scarce specialist reviewer expertise is required
  - review urgency exceeds standard alpha SLA
  - internal trust ops flags elevated exploitation risk
- pro-bono enforcement:
  - rolling org counters
  - warning thresholds
  - publish and acceptance blocks
  - logged overrides with rationale
- calm warning examples:
  - `This review request exceeds the current pro-bono corridor and requires sponsor-backed or bounty-backed support before it can proceed.`
  - `Proofound limits repeated unpaid commercial review requests to reduce reviewer exploitation.`

##### lightweight dispute intake

- intake fields:
  - `reason_code`
  - `summary`
  - `evidence_links[]`
  - `reviewer_ref`
  - `assignment_ref`
  - `bounty_ref`
  - `reporter_role`
- statuses:
  - `submitted`
  - `triaged`
  - `under_review`
  - `needs_more_info`
- resolution states:
  - `resolved_upheld`
  - `resolved_adjusted`
  - `resolved_rejected`
  - `closed`

#### Privacy / visibility implications

- Reviewer profiles are scoped and non-public in alpha.
- Exact bounty values remain optional and non-public by default.
- Sponsor display is coarse unless future policy explicitly widens disclosure.
- Disputes, conflict disclosures, and reviewer performance details remain internal or tightly scoped.

#### Events / analytics implications

- Canonical alpha events:
  - `review_sla_started`
  - `review_sla_breached`
  - `reviewer_assigned`
  - `sponsor_metadata_confirmed`
  - `bounty_band_assigned`
  - `dispute_acknowledged`
  - `dispute_resolved`
- Internal alpha metrics:
  - reviewer SLA adherence
  - bounty usage
  - dispute rate
  - pro-bono cap triggers
  - sponsor conversion rate

#### Out of Scope

- full payouts engine
- escrow engine
- payroll
- generalized billing platform
- legal automation
- public reviewer marketplace browsing
- automated marketplace liquidity or dynamic pricing

#### Acceptance Criteria

- The corridor clearly states why it exists and that it is not launch-blocking.
- Reviewer directory, assignment model, eligibility, conflicts, SLAs, sponsor fields, bounty states, and dispute intake are all defined.
- Anti-exploitation rules, pro-bono caps, and sponsor or commercial-path triggers are explicit.
- The corridor remains metadata-and-policy based and does not imply payments, escrow, or billing infrastructure.

### 12.5 KPI and Analytics Appendix for Broader Master-Brief Ambitions

#### Purpose

Complement the MVP analytics contract with broader ambition metrics without replacing the launch-critical analytics defined in Section 7.6.

#### Facts & Decisions

- Section 7.6 remains the detailed MVP trust analytics contract.
- This appendix clarifies broader ambition KPIs, audience split, privacy rules, and launch-versus-post-launch tracking status.
- Nothing in this appendix adds a launch KPI or launch dashboard requirement beyond Section 7.6.
- User-facing analytics remain calm, bounded, and non-BI.

#### Scope tag

`MVP-lite`

#### Core rules or object model

##### metric definitions

| metric                                          | definition                                                                                                                        | audience class                                            | tracked at launch                             |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------- |
| Proof Quality Score                             | Composite `0-100` trust-quality heuristic based on completeness, verifiability, outcomes clarity, artifact clarity, and freshness | internal product, trust ops; user sees guidance band only | Yes                                           |
| Time-to-Verified                                | Median elapsed time from `proof_pack_created` or fallback `submission_created` to first successful `verification_completed`       | internal product, trust ops                               | Yes                                           |
| Fulfillment Rate per assignment                 | Share of published assignments that reach at least one verified proof-backed completion outcome in the window                     | internal product, trust ops                               | Yes                                           |
| Cause Coverage / NGO & geography diversity      | Distribution of active proof-backed work across cause categories, NGO participation, and geography bands                          | internal product, trust ops                               | Post-launch corridor                          |
| learner retention after first verified artifact | Share of first-proof users who return to create, update, share, or reuse proof within the measurement window                      | internal product                                          | Tracked at launch, not launch-blocking        |
| organization repeat rate                        | Share of orgs that publish, verify, or complete another proof-backed workflow after their first completed one                     | internal product                                          | Tracked at launch, not launch-blocking        |
| sponsor conversion rate                         | Share of sponsor-backed review or verification opportunities that convert to a completed verified artifact                        | trust ops, alpha ops                                      | Tracked only when sponsor corridor is enabled |
| reviewer SLA adherence                          | Share of review cases completed within defined reviewer SLA                                                                       | trust ops                                                 | Yes, where review corridor exists             |
| proof reuse rate                                | Share of issued Proof Packs later used in a downstream match, intro, interview, or engagement event                               | internal product                                          | Yes                                           |
| proof freshness distribution                    | Distribution of qualifying Proof Packs across `fresh`, `review_soon`, `stale`, `expired`                                          | user-facing guidance, internal product, trust ops         | Yes                                           |

##### audience split

- `user-facing metrics`
  - verification status
  - proof freshness state
  - proof quality guidance band
  - next-best action
  - publication or share state
- `internal product metrics`
  - Proof Quality Score distribution
  - Time-to-Verified
  - Fulfillment Rate per assignment
  - proof reuse rate
  - learner retention after first verified artifact
  - organization repeat rate
  - Cause Coverage / NGO & geography diversity
- `trust / ops metrics`
  - reviewer SLA adherence
  - sponsor conversion rate
  - stale-proof backlog
  - dispute rate
  - audit and ETL health

##### launch vs post-launch tracking

- `launch-tracked and launch-critical`
  - Proof Quality Score coverage
  - Time-to-Verified
  - Fulfillment Rate per assignment
  - proof reuse rate
  - proof freshness distribution
  - reviewer SLA adherence where applicable
- `launch-tracked but not launch-blocking`
  - learner retention after first verified artifact
  - organization repeat rate
- `post-launch corridor metrics`
  - Cause Coverage / NGO & geography diversity
  - sponsor conversion rate unless sponsor corridor is enabled
  - bounty usage and reviewer dispute metrics

#### Privacy / visibility implications

- Privacy-safe analytics only.
- No PII in event properties.
- No raw feedback text, no hidden identity, and no direct public viewer identity in analytics streams.
- No Zen or private wellbeing signals may be used for trust, ranking, fairness, or public accountability metrics.
- Cause or geography diversity metrics must use coarse bands and privacy-safe aggregation only.

#### Events / analytics implications

- This appendix depends on the canonical event taxonomy in Section 7.
- If future corridor metrics need new events, those events must stay corridor-scoped until promoted into the canonical analytics contract.

#### Out of Scope

- user-facing BI dashboards
- PII-rich analytics payloads
- trust or ranking logic based on private wellbeing content
- precise geography or protected-class exposure in public reporting

#### Acceptance Criteria

- All requested broader ambition metrics are defined.
- User-facing, internal product, and trust-ops metrics are clearly separated.
- Launch-tracked versus post-launch-only metrics are explicit.
- Privacy rules prevent PII, Zen leakage, and wellbeing-derived trust or ranking.

### 12.6 Legal Templates and Policy Hooks Appendix

#### Purpose

Translate legal and policy ambitions into product-operational implementation requirements without turning the PRD into legal prose.

#### Facts & Decisions

- Product flows must reference policy templates and versioned acceptance hooks rather than embedding bespoke legal drafting logic.
- Creators retain portfolio rights by default.
- Organizations receive defined non-exclusive usage rights unless otherwise agreed through approved template variants.
- Anti-unpaid-commercial-work and sponsor-path routing are product enforcement requirements, not optional policy notes.

#### Scope tag

`MVP-lite`

#### Core rules or object model

##### required template and policy hooks

- `assignment_terms_template_id`
- `license_template_id`
- `dispute_policy_version`
- `privacy_notice_version`
- `acceptance_copy_version`
- `sponsor_terms_template_id` where corridor-enabled
- `cross_border_review_flag`
- `sanctions_or_export_review_flag`

##### default licensing posture

- creator retains portfolio rights
- org receives defined non-exclusive usage rights for the accepted assignment, engagement, or pilot unless another approved agreement applies
- broader exclusivity or transfer cannot be implied by default product copy

##### anti-unpaid-commercial-work guardrails

- block unpaid work when the assignment is clearly commercial and exceeds the unpaid evaluation corridor
- block disguised free labor or repeated commercial review splitting
- require sponsor, bounty, or paid commercial path when thresholds are exceeded

##### pro-bono boundary conditions

- allowed only within bounded non-commercial or social-good corridor
- must respect review labor thresholds and org-level cap counters
- must show warnings before hard block

##### when bounty, sponsor, or commercial path is required

- commercial work exceeds unpaid corridor
- specialist review labor exceeds cap
- urgency exceeds standard unpaid review path
- repeated org behavior indicates labor substitution

##### cross-border / export-control / sanctions hooks

- assignment creation and acceptance must support a coarse compliance review flag
- restricted jurisdictions or sanctions concerns may pause publish, acceptance, sponsor activation, or cross-border collaboration until manually cleared
- product must support reason-coded hold states without exposing sensitive internal rationale publicly

##### GDPR / CCPA aligned posture

- data minimization by default
- private-by-default evidence and identity
- export and delete paths remain available
- analytics use opaque IDs and bounded reason codes
- consent and acceptance moments must reference current policy version

##### EU data residency toggle

- future corridor only unless separately made launch scope
- represented as a platform capability toggle, not a launch promise

##### product copy requirements

- assignment publish and acceptance flows must plainly state:
  - what rights the creator retains
  - what rights the org receives
  - whether the assignment is unpaid, sponsor-backed, or commercial-path required
  - which dispute policy applies
  - whether any cross-border restrictions or review holds apply

#### Privacy / visibility implications

- Legal and compliance holds must not expose sensitive review details publicly.
- Acceptance and policy versions may be stored and audited internally while only coarse user-facing status is shown.

#### Events / analytics implications

- required product-policy events:
  - `assignment_terms_presented`
  - `assignment_terms_accepted`
  - `license_template_bound`
  - `commercial_path_required`
  - `cross_border_review_flagged`
  - `dispute_policy_bound`

#### Out of Scope

- legal automation
- contract authoring platform behavior
- escrow, invoicing, payroll, or tax handling
- jurisdiction-specific legal prose in the product spec

#### Acceptance Criteria

- Assignment terms, licensing posture, dispute hooks, cross-border holds, and unpaid-work guardrails are implementation-ready.
- Required acceptance-flow copy requirements are explicit.
- The appendix remains product-policy oriented rather than legalistic.

### 12.7 Transparency, Trust, and Public Accountability Appendix

#### Purpose

Make public trust ambitions explicit while preserving privacy, reviewer safety, and launch discipline.

#### Facts & Decisions

- Proofound should be publicly legible about verification and scoring changes without exposing private internals.
- Public transparency must remain narrower than owner history, reviewer tooling, or trust-ops audit tooling.
- Launch-safe transparency is summary-first, versioned, and privacy-boundaried.
- Launch does not require a broader public accountability surface than the coarse public-safe trust behavior already defined elsewhere in this PRD.

#### Scope tag

`MVP-lite`

#### Core rules or object model

##### public verification log concept

- public-safe fields:
  - current verification status
  - freshness state
  - latest public-safe change timing
  - coarse provenance summary
  - revocation or expiry status where applicable

##### algorithm / scoring changelog concept

- required fields:
  - `change_label`
  - `effective_date`
  - `version`
  - `affected_surface`
  - `public_summary`
- changelog scope:
  - matching explanation updates
  - trust scoring heuristic updates
  - rubric logic updates where public-safe

##### what is visible publicly

- public-safe verification status
- public-safe freshness state
- public-safe revocation state
- version labels and effective dates for public scoring or transparency notes

##### what remains private

- reviewer private notes
- trust-ops investigation details
- hidden evidence internals
- identity or reveal-gated private fields
- protected-class inference or sensitive moderation rationale

##### badge, revocation, and freshness transparency rules

- badges must map to current verification state only
- revocation must remove active verified language immediately
- freshness changes may be shown publicly only in coarse public-safe form

##### trust-ops visibility boundaries

- trust ops sees full audit trail
- org reviewer sees workflow-scoped trust detail only
- public viewer sees only the narrow public-safe summary

##### launch-safe vs later

- `launch-safe`
  - public verification log summary
  - public scoring or algorithm changelog note
  - version labels and effective dates
- `later`
  - richer public trust reports
  - expanded public methodology notes
  - broader accountability publishing

#### Privacy / visibility implications

- Public transparency is intentionally incomplete where fuller disclosure would weaken privacy, reviewer safety, or abuse resistance.
- No public transparency surface may expose private evidence or reviewer rationale.

#### Events / analytics implications

- transparency events:
  - `public_verification_log_viewed`
  - `algorithm_changelog_viewed`
  - `verification_public_state_changed`

#### Out of Scope

- public release of reviewer notes
- public exposure of hidden evidence
- public ranking traces or protected-attribute reasoning

#### Acceptance Criteria

- Public versus private visibility boundaries are explicit.
- Version labels and effective dates are required.
- Badge, revocation, and freshness transparency rules are deterministic.
- Launch-safe transparency is clearly separated from later accountability expansions.

### 12.8 Branding, Accessibility, and Product Identity Refinement

#### Purpose

Make the broader identity direction explicit enough for product and docs consistency without turning the PRD into a brand book.

#### Facts & Decisions

- Product name consistency matters across public portfolio, org trust, assignment, and export surfaces.
- The interface and documentation tone must remain calm, decluttered, and trust-oriented.
- Accessibility and multilingual readiness are product requirements, not optional polish.

#### Scope tag

`MVP-lite`

#### Core rules or object model

- product naming:
  - use `Proofound` consistently
  - avoid alternate product labels that imply generic recruiting suite, social feed, or engagement app
- optional non-binding tagline examples:
  - `Proof-first pathways to trusted work`
  - `Show the work. Trust the proof.`
  - `Credibility built from real evidence`
- design language constraints:
  - calm
  - decluttered
  - Japandi / Wabi-sabi minimalism
  - high contrast support
  - reduced motion option
  - multilingual copy readiness
- UI behavior implications:
  - no noisy urgency mechanics
  - no gamified celebratory loops
  - clear hierarchy
  - quiet reveal transitions
  - explicit privacy language
- documentation tone implications:
  - calm
  - plain
  - trust-oriented
  - non-hype
  - non-legalese

#### Privacy / visibility implications

- Identity refinement must not encourage public oversharing, vanity counters, or coercive reveal behavior.
- Accessibility and multilingual copy must preserve clarity around privacy, verification, and consent.

#### Events / analytics implications

- No brand or design requirement introduces vanity analytics or engagement loops.
- Accessibility and reduced-motion preferences may be tracked only in privacy-safe product telemetry where already permitted.

#### Out of Scope

- full brand book
- marketing campaign planning
- motion-heavy identity systems
- attention-maximizing growth UX patterns

#### Acceptance Criteria

- Product naming stays consistent.
- Calm visual and copy constraints are explicit.
- High contrast, reduced motion, and multilingual readiness are named as product-operational requirements.
- Identity guidance reinforces Proofound’s calm, privacy-first posture rather than generic growth-product behavior.

### 12.9 Launch Sufficiency vs Broader Ambition

#### Purpose

Close the reconciliation pass with one explicit operating recommendation about what is ready for launch and what remains intentionally corridor-only.

#### Facts & Decisions

- `fully launch-sufficient now`
  - proof creation and proof publishing
  - verification and provenance
  - explainable matching
  - privacy-safe progressive reveal
  - intros, interviews, and structured feedback
  - public portfolio trust
  - lean org assignment workflows
  - launch-safe analytics and privacy controls
- `represented as appendix or corridor only`
  - pilot roadmap and curated partner rollout
  - reviewer directory alpha
  - impact bounty and sponsor corridor
  - broader KPI ambitions
  - legal template hooks beyond launch core
  - public accountability expansion
  - employer, university, and community corridor concepts
- `explicitly post-MVP`
  - payouts
  - escrow
  - payroll
  - generalized billing
  - open reviewer marketplace
  - ATS or HRIS expansion
  - donor, investor, or enterprise reporting suites
- This division is correct because Proofound’s credibility depends on a narrow trustworthy launch corridor, not on prematurely simulating an all-in-one labor, funding, analytics, or recruiting platform.
- This section is a reading aid only. It must not be used to widen launch scope beyond the canonical MVP sections and Section 7 technical contract.

#### Scope tag

`MVP`

#### Core rules or object model

- launch recommendation enum:
  - `launch-sufficient`
  - `corridor-only`
  - `post-mvp`
- Any section not explicitly in `launch-sufficient` must not block MVP implementation or pilot launch readiness.

#### Privacy / visibility implications

- Corridor and later ambitions must not justify visibility expansion at launch.
- Public trust surfaces stay narrower than internal or later accountability ambitions.

#### Events / analytics implications

- Only launch-sufficient metrics and event contracts are launch gates.
- Corridor metrics may be collected later without changing launch readiness criteria.

#### Out of Scope

- re-expanding launch to satisfy every master-brief ambition immediately
- treating appendix ambition as unfinished MVP scope

#### Acceptance Criteria

- The launch-sufficient corridor is explicit and defensible.
- Appendix and corridor material is clearly identified as non-blocking.
- Post-MVP exclusions remain explicit.
- The final division matches Proofound’s proof-first, privacy-first, calm launch discipline.

---

## 13. Final Approval Checklist

- One canonical PRD source exists.
- Canonical vocabulary is stable and unambiguous.
- Proof Pack, verification, matching, public portfolio, and lifecycle states align.
- Acceptance criteria match analytics rules and event names.
- Out-of-scope language matches the included MVP features.
- User journeys do not reintroduce removed scope.

## 14. Final Reconciliation Note

- This document is authoritative for Proofound MVP product behavior, scope, vocabulary, lifecycle rules, visibility rules, and launch-safe user experience.
- It defers launch implementation and hardening detail to `PRD_TECHNICAL_REQUIREMENTS.md` Section 7 and defers operator procedure to `LAUNCH_RUNBOOK.md`.
- Archived, mirrored, summary, or deprecated assumptions must not be used for MVP launch implementation.
