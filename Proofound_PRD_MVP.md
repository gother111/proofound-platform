# Proofound — PRD (MVP)

**Owner:** Pavlo Samoshko (Product)  
**Version:** v1.0 — 2025‑10‑26

---

## 0) Positioning (One‑Pager)

**Category:** A credibility engineering platform for impactful connections — unprecedented possibilities for work, business, and individual transformation. **Backed by evidence, not vanity metrics.**

**Why Now (placeholders):** _(Founder to fill with figures later)_  
• % of AI‑assisted CVs → …  
• Avg. time‑to‑hire in EU NGOs/SMEs → …  
• Burnout/meaning metrics → …

**Primary Outcome (MVP):** Guarantee a day-1 win: publish and share a clean public proof portfolio link on signup day. Matching remains the core downstream outcome and is tracked via **Time‑to‑First‑Accepted Match** (median) and **% assignments with ≥3 qualified matches in 7 days**.

**Principles:** Transparency • Non‑discrimination • Authenticity • Trustworthiness • Never monetize inequality/exclusion.

---

## Canonical Product Object: Proof Pack

### Executive recommendation

- Proofound should treat the **Proof Pack** as the canonical product, storage, and review object across portfolio, matching, org review, exports, and BYOC intake.
- An **artifact** is one atomic evidence unit, such as a file, link, image, credential, reference, or assessment.
- A **proof** is the claim and trust judgment about real work, including verification, freshness, provenance, and outcome credibility.
- A **Proof Pack** is the bounded container that assembles a brief, contribution, outputs, artifacts, outcome claims, trust state, privacy rules, and portability metadata into one reviewable unit of real work.
- In MVP, every Proof Pack has exactly one primary linked subject: `role`, `assignment`, `capability`, or `domain`. Additional related skills or artifacts may be attached, but the pack stays bounded around one primary subject.
- A candidate **Proof Card** is not a separate canonical entity. It is a submission-safe render of a selected Proof Pack for an invite, assignment, intro, or review flow.

### Canonical entity definition

- The canonical stored object is **Proof Pack**. Artifacts are child evidence units of a pack. Verification records and freshness states are judgments over the pack or its linked artifacts.
- A Proof Pack is owned and maintained by one creator, either an individual profile or an organization.
- A Proof Pack is the default evidence object shown anywhere Proofound asks, "What real work supports this claim?"
- When the primary linked subject is a capability, the pack is the canonical evidence object for that L4 skill claim. Matching and profile credibility reason over the pack, not over loose artifact counts.
- A pack may be public, link-only, matched-org visible, or owner-only, but child artifact visibility can narrow exposure further and never widen it.

### Required MVP schema

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

### Lifecycle / states / transitions

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

### Surface-by-surface product behavior

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

### Acceptance criteria

- Proof Pack is explicitly defined as the canonical storage and product-logic object.
- Artifact, proof, and Proof Pack have separate definitions and are used consistently.
- MVP-required versus later-only fields are explicitly separated.
- Proof Pack behavior is defined for profile, public portfolio, matching, org review, BYOC review, and export.
- L4 capability claims are explicitly supported by linked Proof Packs.
- Withdrawn, disputed, stale, partially verified, duplicate, and overlapping packs have defined behavior.
- Permissions are explicit when a pack is partially public but one or more child artifacts are private.

### Event tracking

- `proof_pack_created`
- `proof_pack_updated`
- `proof_pack_ready`
- `proof_pack_published`
- `proof_pack_submitted`
- `proof_pack_withdrawn`
- `proof_pack_superseded`
- `proof_pack_exported`
- `proof_pack_disputed`
- `proof_pack_became_stale`
- `proof_pack_portfolio_visibility_changed`
- `proof_card_submitted` with linked `proof_pack_id`

### Edge cases / failure modes

- **Withdrawn pack:** hidden from public portfolio and matching boosts, but preserved in owner history and prior submission audit.
- **Disputed pack:** visible with conservative "under review" language and removed from positive trust reasoning until resolved.
- **Partially verified pack:** visible with narrow verification summaries only on the verified dimensions.
- **Stale pack:** still renderable when otherwise eligible, but visually muted and excluded from "current evidence" counts.
- **Duplicate or overlapping packs:** flag likely duplicates when the same creator submits materially overlapping evidence for the same primary linked subject. Do not auto-merge in MVP. Allow `supersedes` or `related` relationships and prefer the latest non-withdrawn non-superseded pack on public and matching surfaces.
- **Pack public, artifact private:** artifact-level permissions always win. The pack may remain partially public while private child artifacts are redacted or omitted.

### Out of scope

- blockchain or on-chain signatures
- heavy legal, government, or employer-of-record verification
- automatic duplicate merging
- complex marketplace pricing or incentive mechanics
- multi-pack storytelling systems beyond simple related or superseded links

---

## 1) Scope: MVP vs Future

| Area             | **MVP (Now)**                                                              | Future (Post‑MVP)                                                 |
| ---------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Auth             | Email/password; Google, LinkedIn OAuth                                     | Apple, GitHub, Facebook; MFA; SSO (SAML/OIDC)                     |
| Profiles         | Proof Pack-based profile; public portfolio; privacy controls               | Rich portfolios; imports; team profiles                           |
| Matching         | Opt‑in suggestions; user/org weights; explainability; **top 5–10 results** | Adaptive weights; team/role matching; scheduling                  |
| Assignments      | Outcomes, proof reqs, masked budgets                                       | Contracts, milestones, payments                                   |
| BYOC intake      | Org email invites; candidate claim + Proof Card submission from Proof Pack | Auto-ingest to assignment scoring; ATS connectors                 |
| Verification     | Email/domain + referee; seniority-weighted (not visible)                   | Multi‑ref trees; doc checks; registry lookups; continuous signals |
| Cluster Snapshot | **Private, compute‑only** (no public UI)                                   | Personal UI, graph analytics, org network views                   |
| Messaging        | Post‑match text; links + **PDF ≤5 MB**                                     | Voice/video, scheduling, doc exchange                             |
| Moderation       | AI flagging + user reports                                                 | Appeals portal; transparency reports                              |
| Localization     | EN only                                                                    | SV + RTL + CJK                                                    |
| Monetization     | Free + pilot codes; NGOs free                                              | Subs, verification credits, payment fees                          |

---

## 2) Users & Access

**Launch geography:** EU.  
**Segments (Individuals):** students, older workers, experts, career switchers, immigrants.  
**Segments (Orgs):** NGOs, startups, SMEs.

**Allow‑list (Private Beta):**  
• **Individuals:** all basic info complete; every claim requiring evidence has ≥1 ready Proof Pack.  
• **Organizations:** verified entity (domain email + website/registry #) before matching.

**Beta Waves:**

- **Wave 1:** 5 NGOs, 20 SMEs, 1,000 individuals.
- **Wave 2:** +10 NGOs, +30 SMEs, +2,000 individuals.

---

## 3) Information Architecture & Navigation

**Global nav:** Home · **Public Portfolio** · **Matches** · Profile · For Organizations · Zen Hub (Coming Soon) · Settings.  
**Settings:** Toggle Individual ↔ Organization; privacy/export/delete; notifications; language.

---

## 4) Functional Requirements (by Epic)

### 4.1 Auth & Accounts **[MVP]**

- **Flows:** Email/password; OAuth (Google, LinkedIn). Sessions; logout; device recognition; 18+ age‑gate.
- **AC:** P95 sign‑in < 5s; clear errors; rate limits; brute‑force protection.

### 4.2 Profiles (Individual) **[MVP]**

- **Fields (public unless private):** avatar; Mission · Vision · Values · Causes; **Expertise Atlas** (grouped/ranked skills); professional; education; volunteering; featured Proof Packs.
- **Private:** name, region (not exact), email, masked contacts, salary band (masked), availability, timezone.
- **Proof model:** Proof Packs are the canonical review units. Each pack can include one or more artifacts, and one artifact can support multiple packs or claims when context differs.
- **AC:** required fields; link validation; duplicate‑proof detection; WYSIWYG preview; granular visibility.
- **Day-1 publish UX:** onboarding must end with a dedicated "public portfolio ready" step that shows `/portfolio/{handle}`, copy action, view action, and continue action.
- **Day-1 privacy default:** minimal safe fields are public by default for shareability; contact and work-email remain hidden until explicitly enabled.

### 4.3 Organizations & Assignments **[MVP]**

- **Fields:** role (title‑inflation guardrails), location/remote, timelines, start date, **budget range (masked)**, proof requirements, expertise mapping, expected outcomes/impact, mission/values.
- **Org verification:** required **before** matching (domain email + checks).
- **Public org portfolio URL:** organizations get a clean public route at `/portfolio/org/{slug}` and an onboarding success step focused on copying and sharing this link on day 1.
- **BYOC candidate invites:** owners/admins can invite existing candidates by email, candidates must claim with matching email, and submit a structured Proof Card that renders a selected Proof Pack for review.
- **AC:** Draft → Publish → Close; edit history; audit log; masked budgets respected everywhere.
- **AC (BYOC):** one active invite per org/email; status lifecycle `pending → claimed → proof_submitted` (+ `revoked`/`expired`); resend/revoke available to org admins.

### 4.4 Matching & Recommendations **[MVP]**

- **Model:** No “apply.” Users toggle **Available for Match** and set preferences.
- **Inputs:** Expertise Atlas; mission/values; availability; location/timezone; salary band; industry; languages.
- **Canonical score contract:** Ranking uses only `skills_fit`, `proof_fit`, `constraints_fit`, `verification_fit`, and `purpose_fit`. PAC is a bounded, positive-only subcomponent inside `purpose_fit`, not a separate override channel.
- **Forbidden ranking inputs:** protected or proxy demographic attributes; Zen or wellbeing data; names, photos, direct identity fields, school or employer prestige, social graph popularity, engagement metrics, reviewer preference notes, and manual overrides as direct score inputs.
- **Results set:** **Top 5–10** matches per assignment (configurable).
- **Activation tiers:** Lite requires ≥3 skills with recency, ≥1 ready Proof Pack, purpose present, and matching constraints saved; Strong requires ≥10 skills with recency plus the same Proof Pack, purpose, and constraint requirements.
- **Soft gating:** Matching stays accessible even before Lite completion. Unmet criteria are surfaced as readiness checklist actions instead of hard API blocking.
- **User explanation model:** Each ranked result carries `reasonSummary` (1–3 plain-language bullets), `reasonSections` (`Why this match`, `What may hold it back`, `What you can improve next`, `Fairness or policy limits` only when relevant), and `rankPresentation` (`band` by default, `exact` only in tightly scoped org review when fairness rules pass, `hidden` when policy suppression is active).
- **Explanation rules:** Plain language only. Never expose protected-class logic, cohort comparisons, internal thresholds, other candidates’ details, or numeric uplift promises. Near-threshold hints stay action-oriented and non-numeric in MVP.
- **Verification, freshness, and missing data:** Verification can improve `verification_fit` and can gate shortlist or reveal stages when required, but it must not expose sensitive identity details in explanation copy. Fresh, relevant proof can strengthen `proof_fit`; stale proof lowers confidence and may generate “refresh evidence” hints, but does not silently zero an otherwise strong match unless evidence is expired under policy. Missing required evidence, preferences, or verification creates explicit reason codes and recovery hints; missing protected or optional personal data is neutral.
- **Cold‑start:** Editorial “Starter Matches”; if <5 strong results, show “Near Matches” with missing/strength notes.
- **Empty/incomplete recovery pattern (critical paths):**
  - Individual empty or not-matchable states always show 3 clear actions: `Add a Proof Pack`, `Add a skill`, `Turn on matchable`.
  - `Turn on matchable` routes to matching preferences.
  - If results are empty due to active filters, show `Reset filters` before the 3 actions.
  - Organization matching empty/no-result states always show 3 clear actions, including `Turn on candidate matching`.
- **No-good-match state:** If no strong match exists, the product shows `No strong matches yet` plus exactly 3 recovery actions chosen from proof, skill, preference, or verification gaps.
- **Refresh defaults:** Employment → **daily**; Volunteering → **weekly** (user‑configurable; system min daily).
- **AC:** First suggestions within 24h of profile readiness; reasons render consistently from canonical reason codes; exact score remains internal by default.

### 4.4A Matching Transparency & Governance **[MVP]**

- **Executive recommendation:** Matching transparency is a three-layer contract: plain-language user explanations, an internal canonical reason-code ledger, and governance controls for versioning, fairness monitoring, and reviewer overrides.
- **Canonical reason-code ledger:** Every ranking decision must resolve to controlled reason-code groups: positive match, constraint mismatch, verification state, freshness or evidence quality, missing-data or confidence limits, workflow decision, manual override, and fairness or policy limitation.
- **Ranking trace package:** Each ranking output stores `score_version`, `model_version`, `explanation_version`, `fairness_check_version`, `inputs_hash`, top-level component scores, component applicability or missing-data state, reason codes, rank presentation mode, fairness status, generated timestamp, gating outcomes, stale-policy state, and any reviewer override linkage.
- **PAC treatment:** PAC may improve ranking only through real values or causes overlap inside `purpose_fit`. Missing PAC data is neutral. PAC must never create exclusion on its own and must never override failed hard constraints or required verification gates.
- **Override governance:** Reviewers may change workflow outcome, not underlying score history. Every override must log actor, scope, enumerated override reason, optional reviewer note, timestamp, previous state, new state, and affected reveal scope. Reviewer notes are annotations, not canonical reasons.
- **Override reason taxonomy:** `manual_shortlist_exception`, `manual_hold_for_context`, `manual_reject_policy_or_constraints`, `verification_exception_approved`, `duplicate_candidate_resolution`, `appeal_upheld_reconsider`, `fairness_remediation_hold`, `safety_or_trust_escalation`.
- **Fairness and audit package:** MVP fairness is release-level cohort monitoring on opt-in data only. Fairness notes must support `published` and `insufficient_data`, include thresholds and limitations, and must not claim causal proof or certification. Manual overrides and fairness suppressions must feed analytics for override frequency and outcome drift.
- **Appeal and support path:** Suspicious ranking outcomes can be reported from Match Detail or support. The support case must capture match ID, ranking versions, reason codes, rank presentation mode, and any override record. Appeals trigger review and audit lookup, not a guaranteed rerank.
- **Edge cases and abuse risks:** Pools that are too small for exact rank, stale or partially verified proof, one-sided missing data, fairness suppression, repeated manual overrides, and attempts to reverse-engineer thresholds must all resolve to conservative explanations and audit-ready logs.

### 4.5 Verification v1.0 **[MVP]**

- **Flow:** Email link to verifier → view Proof Pack with linked artifact context → Accept/Decline/Cannot Verify (+reason). Domain verification for org emails.
- **Who verifies:** employment/volunteer → org rep (domain); side projects → qualified peers (link to the relevant Proof Pack and linked artifact context + short rubric).
- **Seniority:** derived from Expertise Atlas; **not visible**; used as weight.
- **SLA:** target 72h; auto‑nudge 48h & 7d; expiry 14d.
- **Appeal:** user may submit context; human review ≤72h.
- **Public vs Private:** Public status (unverified/pending/verified), verifier role/org (contact masked), timestamp. Private: emails, notes, IP/device info.

### 4.6 Cluster Snapshot v1.0 **[MVP]**

- **Definition:** Active ties linked to ongoing processes in last **60 days**; older ties → Legacy.
- **Visibility:** **Private only**; used by algorithms. No public UI in MVP.

### 4.7 Messaging (Post‑Match) **[MVP]**

- **Identity reveal:** messaging and coordination must follow the blind-by-default staged reveal contract below rather than exposing identity as soon as a match exists.
- **Attachments:** links + **PDF ≤5 MB** only.
- **AC:** report/block; no cold DMs; moderation hooks.

### 4.8 Admin & Moderation **[MVP]**

- AI keyword/ML flagging + user reports (≤50 words reason). Queue: pending/reviewed/actioned.
- Violations: 1 warning → second critical violation → timed suspension.
- **Political policy:** factual role descriptions allowed; **advocacy/proselytizing disallowed**.
- **Examples:**
  - ✅ “Policy analyst at Ministry of X (2019–2022).”
  - ✅ “Organized civic tech hackathon, outcomes linked here.”
  - ❌ “Vote for party X / donate to Y.”
  - ❌ “Promotional content for political campaign.”

---

## 5) Trust, Safety, Privacy & Compliance **[MVP]**

**Core policy statement:** Matching and shortlist review are blind-by-default. Identity, contact, exact location, compensation specifics, portfolio links, and other bias-sensitive signals stay hidden unless a later reveal stage explicitly permits them. Reveal is stage-bound, purpose-bound, candidate-controlled when identity-bearing, and fully audited. Public portfolio publication does not weaken blind review inside matching surfaces.

**Bias minimization:** No race/gender/age/YOE filters. Demographic data and inferred bias-sensitive signals never appear in matching or shortlist review. Early review exposes only bias-safe attributes and proof summaries.  
**Fraud signals (respectful):** domain mismatch; bounced refs; velocity spikes; duplicate artifacts; inconsistent timelines; device anomalies.  
**Response:** **“Confidence pending”** label + targeted proof request; no silent penalties; appeal path.  
**Privacy:** GDPR‑aligned. Optional additional context allowed only through the staged reveal rules below; fine‑grained visibility and consent for public indexing remain separate controls.  
**Retention:** auth/app logs **180d**; audit logs **2y**; soft‑delete purge **30d**; messages retained **until match closes** (user can export).  
**Security:** OWASP Top‑10; rate limits; encryption; least‑privilege roles; audit logs.  
**DPIA/DPA:** DPIA maintained from Day 1; DPA available on request (future enterprise).

**Reveal stages and rules**

- **Stage 0: anonymous / redacted review**
  - Visible: anonymous candidate label, capability summary, skill clusters, proof-pack summaries, outcome evidence summaries, work-mode fit, timezone band or broad region if needed, compensation fit as `overlap / no overlap / not shared`, narrow verification labels, rank band or unordered shortlist position.
  - Hidden: name, handle, photo, exact location, employer names, school names, exact compensation, contact details, public portfolio URL, direct social/profile links, demographic or inferred bias-sensitive signals.
  - Allowed actions: shortlist, pass, snooze, request more proof, request contextual reveal.
  - Trigger: org reviewer may request Stage 1 or Stage 2 review; system may suppress reveal for fairness or policy reasons.
  - Consent or policy: no candidate approval needed to remain in blind review; redact mode and field visibility always apply.
  - Logged: `shortlist_generated`, `match_viewed`, `reveal_requested`, fairness suppression events, reviewer decision reason code.
- **Stage 1: capability + proof review**
  - Visible: Stage 0 fields plus deeper proof-pack content, artifact summaries, methods, tools, outcome metrics, verification summary, and redacted class labels such as “global NGO” or “public university” when redaction is enabled.
  - Hidden: name, photo, handle, direct links, contact details, exact employer or school names when redaction is enabled, exact location, exact compensation, demographic or inferred bias-sensitive signals.
  - Allowed actions: keep under review, shortlist, pass, request contextual reveal, request missing proof.
  - Trigger: org reviewer requests Stage 2; system may deny if artifact safety, visibility, or fairness rules would be violated.
  - Consent or policy: candidate approval is not needed only while no identity-bearing field is exposed; identifying artifact metadata must stay sanitized or withheld.
  - Logged: `reveal_requested`, `reveal_denied`, `review_override_applied`, reason-ledger updates.
- **Stage 2: contextual reveal**
  - Visible: Stage 1 fields plus exact timezone, metro or region, work authorization summary, availability window, and employer, school, or portfolio context only when redaction is disabled and the candidate has allowed contextual reveal.
  - Hidden: personal contact details, private social links not explicitly revealable, exact compensation unless exact-range visibility is separately enabled, demographic or inferred bias-sensitive signals.
  - Allowed actions: request intro, request Stage 3 reveal, pass with structured feedback, continue in-platform discussion.
  - Trigger: org reviewer can request; candidate must approve any reveal that exposes identity-bearing context.
  - Consent or policy: explicit candidate consent required if employer, school, portfolio URL, or other identity-bearing context would be unmasked; fairness suppression or admin hold can still deny.
  - Logged: `reveal_requested`, `reveal_granted`, `reveal_denied`, consent capture, policy reason code.
- **Stage 3: intro-approved reveal**
  - Visible: full name, photo, public portfolio URL if published, employer and school names according to profile visibility, full allowed verification labels, and the identified in-product intro thread.
  - Hidden: direct email, phone, and off-platform contact details by default; exact compensation unless separately allowed.
  - Allowed actions: approve intro, open identified thread, exchange structured intro context, request interview.
  - Trigger: org requests intro-approved reveal; candidate must explicitly approve.
  - Consent or policy: candidate approval and mutual intro state are required; verification or fairness policy may still block stronger actions.
  - Logged: `reveal_requested`, `reveal_granted`, intro workflow start, consent version, source surface, reason code.
- **Stage 4: interview coordination reveal**
  - Visible: direct contact channel needed for coordination, exact location only when needed for interview logistics, calendar or meeting details, and exact compensation only when the candidate separately allows it or the process reaches a negotiation-safe stage.
  - Hidden: anything outside coordination scope plus demographic or inferred bias-sensitive signals.
  - Allowed actions: schedule interview, exchange meeting details, negotiate logistics.
  - Trigger: either side may request after Stage 3; candidate approval is required before direct contact or exact logistics are exposed.
  - Consent or policy: explicit coordination consent and interview workflow trigger required.
  - Logged: `reveal_requested`, `reveal_granted`, interview scheduling events, coordination consent, scope granted.

**UI / workflow behavior**

- Matching feed and shortlist default to Stage 0 or Stage 1 only. They do not show identity-bearing fields by default.
- Exact rank is hidden by default. Show rank bands such as `Top 5`, `Top 10`, `Top 20`, or no ordered rank when fairness suppression is active.
- “Why this match” and pass reason codes may reference skills fit, proof strength, logistics fit, verification readiness, compensation overlap, or fairness protection, but never hidden employer names, school names, demographic markers, or private portfolio details.
- Compensation in review surfaces stays overlap-only until a later stage explicitly allows exact-range reveal.
- Verification badges remain conservative in early stages and do not expose raw verifier identities or detailed provenance.
- Public portfolio links are not surfaced in blind stages even if a published portfolio exists. Matching may show sanitized proof summaries but never direct identity-bearing URLs.
- Manually uploaded artifacts that contain identifying metadata must render as sanitized, withheld, or requires-review. The product must not silently leak EXIF, filename identity, embedded email, watermark, or author metadata.

**Permissions and consent logic**

- Candidate-controlled reveal is the default for any reveal that exposes identity, direct portfolio access, employer or school names, exact compensation, exact location, or contact details.
- Org reviewers may request reveal, but they cannot self-upgrade from blind review to identity reveal.
- Platform admins may override only for abuse, trust, or legal-review reasons. Overrides require explicit reason code, actor identity, and audit entry.
- Redaction mode overrides general visibility defaults inside matching surfaces. If redaction is on, identity-bearing fields stay hidden until the relevant reveal stage even if they are public elsewhere.

**Audit events**

- Required reveal event families: `reveal_requested`, `reveal_granted`, `reveal_denied`, `review_override_applied`, `review_override_reverted`, plus intro and interview workflow transitions tied to reveal scope.
- Audit logs must capture actor type and ID, target profile, org, assignment, and match IDs, requested and granted stage, source surface, trigger type, reason code, outcome, consent state, policy version, and timestamp.
- Audit logs must not store raw message bodies, raw artifact text, raw contact values, or freeform hidden content. Use IDs, enums, hashes, and snapshot metadata only.

**Edge cases / bypass prevention**

- If an org reviewer tries to bypass reveal, the product must not expose copy or open actions for hidden fields. Hidden identity-bearing links remain absent, not merely blurred, and repeated denied attempts are logged.
- Public portfolios remain explicit publication surfaces, but matching review must not expose the direct route, handle, or indexable identity hooks before the allowed stage.
- Uploaded artifacts stay private by default, filenames are sanitized, safe preview is required before any reveal-stage display, and identifying metadata that cannot be safely stripped keeps the artifact withheld until a later stage with consent.
- Reason codes must use controlled enums and never expose hidden employer, school, demographic, health, or protected-class information.

**Acceptance criteria**

- Matching and shortlist text is explicitly blind-by-default with progressive reveal.
- All five stages define visible fields, hidden fields, allowed actions, reveal authority, consent or policy gate, and audit events.
- Name, photo, exact location, compensation, contact details, school and employer names, demographic or inferred signals, public portfolio links, and verification badges each have explicit stage behavior.
- Org reviewers cannot reveal identity or direct contact without the defined trigger and consent path.
- Exact rank is hidden by default and rank-band behavior is explicit.
- Artifact metadata handling covers filenames, embedded metadata, and unsafe previews.

---

## 6) Analytics & Metrics **[MVP]**

**North Star:** Time‑to‑First‑Accepted Match (median).  
**North Star 2:** % assignments with ≥3 qualified matches in 7d.

**First 10 Minutes Activation Success (MVP):**

- **Individual success statement:** "I created my portfolio share link and exported my trust PDF."
  - Measured as both actions completed within 10 minutes of `individual_onboarding_completed`:
    - `portfolio_share_link_copied`
    - `portfolio_pdf_export_succeeded`
- **Company success statement:** "I copied my public organization portfolio link and can share it now."
  - Measured as `portfolio_share_link_copied` within 10 minutes of `organization_onboarding_completed`.
- **Boundary rule:** an action at exactly 10:00 is counted (`<= 10 minutes`).
- **KPI formulas:**
  - Individual activation rate (10m) = successful individuals within 10m / new individuals
  - Company activation rate (10m) = successful organization creators within 10m / new organization creators

**Day‑1 Admin Dashboard (tiles):**

1. Time‑to‑first‑match (median)
2. % profiles “Ready for Match” (24h)
3. Org verification completion rate
4. Match acceptance rate (+ decline reasons)
5. Safety: report rate & resolution SLA
6. Individual first-10-minute activation rate
7. Company first-10-minute activation rate

**Core Events:** `signed_up`, `created_profile`, `profile_ready_for_match`, `org_verified`, `individual_onboarding_completed`, `organization_onboarding_completed`, `portfolio_share_link_copied`, `portfolio_pdf_export_succeeded`, `assignment_template_applied`, `assignment_publish_succeeded`, `assignment_published`, `match_suggested`, `match_viewed`, `match_accepted`, `match_declined(reason)`, `message_sent`, `verification_requested`, `verification_completed(status)`, `content_reported`, `candidate_invite_sent`, `candidate_invite_opened`, `candidate_invite_claimed`, `candidate_proof_card_submitted`.

**Targets (90d):** profile completion ≥60% D+1; first suggestion <24h; acceptance ≥20%; ≥50% assignments with ≥3 qualified matches in 7d; verified users ≥30% by D+14; report rate <1% with <24h SLA.

**Instrumentation Map:** Metric → Events → Owner → Review cadence (weekly).

---

## 7) Performance, Reliability & Ops **[MVP baselines]**

**Web Vitals:** LCP < 2.5s (P75); INP < 200ms (P75); CLS < 0.1.  
**API SLAs:** Read P95 < 800ms; Write P95 < 1200ms.  
**Rate limits:** 60 req/min IP; 120 req/min user token (burst 2×); stricter for auth/verification.  
**Scale:** Private beta up to 5–15 RPS sustained; scale 10× via autoscaling.  
**Uptime:** 99.5% MVP (→ 99.9% post‑beta). Maintenance Sun 02:00–04:00 CET (read‑only).  
**Incidents:** Sev‑1/2/3; status page; postmortems ≤72h.

---

## 8) Integrations & Platform **[MVP → Future]**

**Stack (MVP):** Next.js 15 + TypeScript + React + Tailwind + Supabase (Postgres + Auth) + Resend + Vercel Analytics; file links preferred; signed URLs for small files; CDN.  
**Future:** Apple/GitHub/Facebook auth; Twilio/Vonage SMS; Daily/Vonage video; **Stripe** for future monetization; FeatureFlags table → Unleash/Flipt.

---

## 9) Monetization **[MVP]**

Free; **all pilots get 3 months**; NGOs test free. No transaction fees. Limit **5 free assignments/org**.

---

## 10) Launch Plan **[MVP]**

**Channels:** NGO federations; university career centers; incubators; credibility‑focused creators.  
**Assets:** 90‑sec explainer; onboarding webinar; email sequences (ind/org).  
**Support:** Business hours (human response target <8h) → off‑hours next business day.  
**Exit criteria:** ≥50% assignments with ≥3 qualified matches in 7d; acceptance ≥20%; report rate <1% with <24h SLA for 4 weeks; SLOs met 30 days.  
**Kill/pivot:** acceptance <10% after 2 iterations; org verification <30% after 2 outreach cycles; NPS <0 for 2 cycles.

---

## 11) Open Items

• Insert “Why Now” figures. • Finalize proof categories and default weight guardrails text. • Document moderator RACI.
