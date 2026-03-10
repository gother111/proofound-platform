> Doc Class: `reference-spec`
> Last Verified: `2026-03-10`

# Proofound MVP PRD Compatibility Mirror

This file is a compatibility mirror for consumers that still open `PRD_for_a_web_platform_MVP.md`.

**Canonical source of truth:** `PRD_for_a_web_platform_MVP.master-latest.md`  
**Mirror policy:** This file must never introduce terms, states, events, or scope that differ from the canonical PRD.

## Canonical MVP Contract

- Proof Pack is the canonical evidence object.
- Artifact is an atomic evidence item inside a Proof Pack.
- Proof is the claim and trust judgment attached to real work.
- Proof Card is a submission-safe render of a selected Proof Pack.
- Matching is blind-by-default and uses progressive reveal.
- Public portfolios are in scope.
- Portfolio indexing is controlled and off by default.
- Public directory behavior is out of scope.
- Profile readiness tiers are:
  - `Discoverable`
  - `Match-visible`
  - `Intro-eligible`
  - `Strongly trusted`
- User trust tier is:
  - `unverified`
  - `workplace_verified`
  - `identity_verified`
- Proof Pack verification status is:
  - `unverified`
  - `partially_verified`
  - `verified`
  - `disputed`
- Organization trust tiers now exist as a separate org-level state model:
  - `Unreviewed`
  - `Basic trusted`
  - `Reviewed`
  - `Restricted`
- Sensitive-domain and child-safety review exist in MVP-lite form for higher-risk organization contexts.
- Assignment workflows now include canonical MVP guardrails for default license posture, creator portfolio rights, unpaid-scope blocking, sponsor or commercial-path escalation, and cross-border review restrictions.
- Events & Missions exist as an MVP-light organization container for grouping multiple assignments under one shared initiative and producing public-safe outcome summaries when eligible.
- Reviewer marketplace, sponsors, impact bounties, and anti-exploitation guardrails exist only as a post-MVP alpha corridor in the canonical PRD and do not expand MVP launch scope.
- Canonical principals now distinguish individual, organization, membership, reviewer, sponsor, and trust-ops actors, with permissions granted only through active principal context and active membership where applicable.
- One canonical visibility matrix governs profile fields, Proof Packs, child evidence, attestations, intro artifacts, interview feedback, public pages, exports, and import validation. The narrowest applicable scope always wins.
- Canonical product roles are:
  - `individual`
  - `org_owner`
  - `org_manager`
  - `org_reviewer`
  - `sponsor_actor` post-MVP alpha only
  - `trust_admin`
- Invite, BYOC, and attestation links now share one single-use, hashed, revocable token contract with regeneration, replay protection, rate limiting, and audit logging.
- Uploaded evidence follows a quarantine-first ingest path. Links-only evidence follows a separate lower-trust validation path and does not bypass proof or visibility controls.
- Canonical structured feedback is rubric-first, calm, and private. No individual feedback becomes public in MVP.
- Delete, withdraw, depublish, export, and re-import now use one deterministic reconciliation ledger in the canonical PRD.
- Operational shortlist fallback and a minimal next-best-action layer are canonical MVP-safe operating behaviors, not optional UX flourishes.
- Canonical launch appendices now cover the background job catalog, technical foundation, launch monitors and rollback rules, rollout corridor, and contradiction cleanup.
- Proof Pack portability uses a versioned JSON-LD-shaped export, deterministic `portability_hash`, explicit provenance, explicit freshness, and an MVP-safe `signature_status`.
- Canonical lifecycle state machines for assignment, application, submission, verification, Proof Pack, intro, interview, and engagement verification exist only in the master PRD.
- Workflow objects are:
  - `match`
  - `intro`
  - `interview`
  - `feedback follow-up`
- Zen Hub is optional, private, and excluded from ranking, reveal, org review, fairness workflows, and public rendering.

## Proof Pack Canonical Schema & Portability (MVP)

- Proof Packs are the canonical portable proof object for profile credibility, public portfolio cards, matching summaries, org review, and owner export.
- Canonical top-level fields are:
  - `proof_pack_id`
  - `owner_user_id`
  - `source_artifact_id`
  - `source_submission_id`
  - `title`
  - `summary`
  - `capability_tags`
  - `l4_links`
  - `tools_used`
  - `context`
  - `evidence[]`
  - `outcomes[]`
  - `links[]`
  - `created_at`
  - `updated_at`
  - `freshness_score`
  - `freshness_updated_at`
  - `provenance`
  - `verifier_records`
  - `visibility`
  - `export_schema_version`
  - `portability_hash`
  - `signature_status`
- Source pointers are nullable, but packs built directly by the owner must use `provenance.origin_type = manual_pack_builder`.
- Export scopes are:
  - `owner_full`, importable and owner-visible
  - `public_safe`, visibility-filtered and not importable as trusted owner proof
- `export_schema_version` starts at `1.0.0`.
- `portability_hash` is SHA-256 over canonical JSON serialization of the selected export payload with sorted keys, UTF-8 encoding, stable array order, and no transport-only wrapper fields.
- `signature_status` is MVP-safe and limited to `unsigned`, `hash_verified`, and `invalid`.
- Detached signatures, key rotation, countersigning, and third-party verification are deferred post-MVP.
- Pack freshness reuses current thresholds:
  - `fresh` up to 90 days
  - `review_soon` 91 to 180 days
  - `stale` 181 to 365 days
  - `expired` beyond 365 days or explicit expiry
- `freshness_score` maps deterministically:
  - `100`, `70`, `40`, `10`
- Provenance is required on every exported pack and must record source type, reference ID, capture actor, capture surface, linked review references, linked auto-check references, and completeness state.
- Public portfolio pages render only the public-safe projection of a Proof Pack. Hidden child evidence is withheld and must not leak filenames, URLs, verifier PII, or internal notes.
- Canonical Proof Pack portability events are:
  - `proof_pack_created`
  - `proof_pack_updated`
  - `proof_pack_exported`
  - `proof_pack_import_validated`
  - `proof_pack_import_completed`
  - `proof_pack_freshness_changed`
  - `proof_pack_signature_status_changed`

## Mirror Usage Rules

- Use `PRD_for_a_web_platform_MVP.master-latest.md` for implementation details, analytics taxonomy, lifecycle states, acceptance criteria, and QA handoff.
- Treat principal identity, membership states, visibility matrices, permission matrices, token security, ingest contracts, reconciliation rules, fallback contracts, and launch appendices as canonical only in the master PRD.
- Treat the canonical lifecycle state-machine block as master-only detail. This mirror should not duplicate those tables, edge-case rules, timestamps, or payload examples.
- Treat organization trust tiers, sensitive-domain review rules, and child-safety guardrails as canonical only in the master PRD. This mirror summarizes their presence but does not duplicate the full operating detail.
- Treat Events & Missions operating detail as canonical only in the master PRD. This mirror records only the lightweight container contract and does not duplicate the full corridor behavior.
- Legacy org role aliases such as `owner/admin/member/viewer` must not be treated as canonical product vocabulary if they differ from the master PRD role matrix.
- Use this mirror only when an older file path is hard-coded into a workflow that still expects `PRD_for_a_web_platform_MVP.md`.
- If this file and the canonical PRD ever differ, the canonical PRD wins immediately.
