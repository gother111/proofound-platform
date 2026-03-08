> Doc Class: `active`
> Last Verified: `2026-03-08`

# Block 7: Canonical Verification Policy and Badge Semantics

## A. Canonical verification model

- Proofound MVP supports these verification types: `veriff_identity`, `linkedin_identity`, `linkedin_workplace`, `work_email`, `skill_attestation_peer`, `skill_attestation_manager`, `impact_attestation`, `org_domain`, `org_registry_manual`, and `platform_manual_review`.
- Deferred from MVP: employer HRIS or payroll integrations, demographic verification, background checks, government or legal registry automation beyond manual review, and any badge that implies legal certification.
- Canonical verification states are `pending`, `verified`, `expired`, `superseded`, `downgraded`, `contradicted`, `disputed`, `revoked`, `declined`, `failed`, and `cancelled`.
- `pending` means requested or collected but not completed. `verified` means the evidence reached the supported threshold for that verification type. `expired` means freshness lapsed without a contradiction. `superseded` means replaced by a newer record in the same verification slot. `downgraded` means still historically relevant but no longer strong enough for the prior trust label. `contradicted` means later evidence materially conflicts with the prior record. `disputed` means a formal challenge is open. `revoked` means Proofound invalidated the verification after review. `declined`, `failed`, and `cancelled` preserve terminal workflow outcomes without claiming trust.
- Proof artifacts remain the atomic evidence units. Proof packs remain shareable evidence bundles. Verification records are the canonical trust judgments over a subject, with optional links back to one artifact, one request, one response, and one verification slot.
- Canonical subject mapping is fixed in MVP. Identity and workplace checks attach to `individual_profile`. Skill and impact attestations attach to `skill`, `impact_story`, or a general artifact-attestation slot for other proof-backed claims. Organization trust checks attach to `organization`.
- Verification slots are the stable trust surfaces Proofound renders and reasons over: `individual.identity`, `individual.workplace`, `skill.attestation`, `impact_story.attestation`, `artifact.attestation`, `organization.domain`, and `organization.platform_review`.

## B. Badge and trust-label semantics

- `Identity checked` means identity evidence was reviewed by Proofound or an approved provider. It does not mean skill, employment, conduct, or fit is guaranteed.
- `Workplace confirmed` means the person controlled a work email or LinkedIn workplace signal tied to an organization at the time checked. It does not prove current employment beyond the freshness window.
- `Evidence attested` means a named claim or artifact was confirmed by an eligible verifier. It does not make every profile claim true.
- `Domain confirmed` means Proofound confirmed domain control or an equivalent domain signal for the organization. It does not certify legal, financial, or security compliance.
- `Platform reviewed` means Proofound reviewed defined trust basics for an organization. It does not certify legal, financial, security, or regulatory compliance.
- `Verification expired` means a prior check is still in history, but its freshness window has passed. It does not mean the claim is false.
- `Verification under review` means a dispute or review is open, so Proofound is showing a conservative state. It does not confirm the record is wrong.
- `Verification changed since issue` means later evidence materially weakens or conflicts with the prior verification. It does not erase the historical record.
- `Verification revoked` means Proofound invalidated the prior verification after review. It does not remove audit history.
- `Trust review pending`, `Trust review changed`, and `Trust review revoked` are the organization-facing variants of the same conservative semantics.
- Public portfolio shows calm labels only, never raw verifier identities, raw allegation text, or sensitive contradiction metadata.
- Org review shows label, verification kind, verifier class, verified date, freshness date, and state reason.
- Internal and admin surfaces may also show slot, linked contradictions, linked disputes, source request IDs, and audit references.

## C. Verifier eligibility and trust policy

- Eligible verifier classes in MVP are `system_provider`, `system_signal`, `authenticated_manager`, `authenticated_peer`, `authenticated_external`, and `manual_platform_reviewer`.
- `system_provider` covers Veriff and official LinkedIn identity signals. Minimum requirement: provider-backed success event captured in canonical metadata.
- `system_signal` covers work email control and organization domain signals. Minimum requirement: Proofound observed control of the email or domain at verification time.
- `authenticated_manager` requires an authenticated Proofound user or signed token response with captured relationship snapshot, plus same-organization evidence stronger than a free-email claim.
- `authenticated_peer` requires an authenticated Proofound user or signed token response with captured relationship snapshot. Same-organization evidence is preferred and weighted below manager attestations.
- `authenticated_external` covers clients, partners, and collaborators. Free-email domains are allowed only here and carry lower weight.
- `manual_platform_reviewer` requires a human Proofound review with an evidence checklist captured in metadata.
- Trust weighting for MVP is fixed and conservative: provider or manual platform review is strongest, then authenticated manager, then authenticated peer, then authenticated external, then low-confidence token-only external evidence.
- Low-confidence, mismatched-domain, or weak relationship evidence may support `pending`, `warning`, or `under review` internally, but it must not produce a stronger public badge.
- Domain and email matching stay evidence, not proof by themselves. A matching domain increases confidence for workplace or org review, but it does not override contradictions or freshness expiry.

## D. Verification lifecycle and expiry policy

- Creation starts as `pending` with `requested_at`, `request_expires_at`, and optional follow-up timestamps. Completion moves to `verified`, `declined`, `failed`, or `cancelled`.
- Every canonical record tracks `requested_at`, `completed_at`, `verified_at`, `expires_at`, `superseded_at`, `downgraded_at`, `contradicted_at`, `disputed_at`, `revoked_at`, and `last_refreshed_at` when applicable.
- Refresh in MVP updates an existing slot record or creates a newer record that supersedes the old one. Old rows remain in history and audit even when they stop contributing to live trust.
- Freshness defaults are: work email 12 months, LinkedIn workplace 12 months, LinkedIn identity 24 months, Veriff identity 24 months, org domain 12 months, org registry manual 24 months, and platform manual review 24 months.
- Skill and impact attestations do not hard-expire in MVP, but they become stale for trust reasoning after 24 months without refresh and stop contributing to the active evidence-attested count.
- When a live record expires, public badges degrade immediately to `Verification expired` and stop counting as active trust. History remains visible internally and auditable.
- When a newer stronger or corrected record replaces an older record in the same slot, the prior row becomes `superseded` instead of being deleted.
- `downgraded`, `contradicted`, `disputed`, and `revoked` all remove the stronger trust badge from public and matching surfaces immediately.

## E. Contradiction and integrity handling

- Contradiction types in MVP are `identity_mismatch`, `workplace_mismatch`, `verifier_identity_mismatch`, `relationship_mismatch`, `subject_chronology_mismatch`, `artifact_authenticity_concern`, `org_domain_control_mismatch`, and `platform_review_evidence_invalidated`.
- Contradictions are detected from re-verification with a different outcome, changed profile or verifier facts, conflicting verifier claims, admin moderation input, or imported updates that invalidate an older snapshot.
- On contradiction, Proofound creates a `verification_contradictions` row, appends a verification state transition, links the contradicting record when known, and downgrades the live trust state to `contradicted` or `downgraded`.
- Public and org-facing displays must immediately soften or remove the prior trust badge. The conservative copy is `Verification changed since issue` or `Verification under review`.
- Internal queues must show contradiction type, severity, detection source, linked verification IDs, and audit metadata. Public surfaces never show raw allegation text.
- Integrity states are `clear`, `warning`, and `contradicted`. `warning` keeps history but blocks trust upgrades when confidence is limited. `contradicted` removes active trust immediately.

## F. Dispute and remediation flow

- A verification may be disputed by the subject owner, an organization admin for org trust records, the original verifier for impersonation or misattribution claims, or a platform admin.
- Allowed dispute reasons are `wrong_person`, `wrong_organization`, `outdated_employment_or_role`, `verifier_misattributed`, `artifact_forged_or_incorrect`, `unauthorized_or_abusive_request`, and `admin_review_error`.
- Opening a dispute creates a `verification_disputes` row, moves the live verification state to `disputed` or marks it as under review, and removes that record from positive trust reasoning until resolved.
- Resolution actions are `uphold`, `request_refresh`, `downgrade`, `revoke`, and `supersede_with_corrected_record`.
- Only Proofound admins resolve disputes in MVP. Resolution may keep the record verified, downgrade it, revoke it, or supersede it with a corrected record.
- Users see calm status language during and after resolution: `Verification under review`, `Verification changed since issue`, or `Verification revoked` depending on the outcome.

## G. Schema / API / service-layer impact

- `verification_records` now carries `verification_slot`, `verifier_class`, `dispute_state`, `badge_semantics_version`, `requested_at`, `expires_at`, `last_refreshed_at`, `superseded_at`, `superseded_by_verification_id`, `downgraded_at`, `contradicted_at`, `contradicted_by_verification_id`, `disputed_at`, and `revoked_at`.
- New tables are `verification_contradictions` and `verification_disputes`. They preserve conflict and remediation history separately from the live record.
- Canonical enums now use the richer verification kinds and states. Legacy canonical `accepted` values are migrated to `verified`. Legacy integrity `flagged` values are migrated to `warning`.
- `/api/verification/status` and `/api/mobile/v1/verification/status` now return canonical summary payloads with badge semantics, active issues, slot summaries, and legacy compatibility projections.
- Portfolio and org public trust cues now derive from canonical verification summaries instead of raw booleans alone.
- Verification gates now treat the canonical policy summary as the source of truth for identity and workplace eligibility, while keeping existing compatibility behavior for older rows.
- Legacy `individual_profiles.verification_tier*`, `individual_profiles.verification_status`, `individual_profiles.verification_method`, `organizations.trust_status`, and `organizations.verified` remain compatibility projections while callers migrate.

## H. UI and product-language contract

- Candidate-facing identity copy: `Identity checked`, `Workplace confirmed`, `Evidence attested`, `Verification expired`, `Verification under review`, `Verification changed since issue`, `Verification revoked`.
- Organization-facing public copy: `Platform reviewed`, `Domain confirmed`, `Trust review pending`, `Trust review changed`, `Trust review revoked`.
- Org-review and admin copy may show the public label plus verifier class, verification kind, verified date, and freshness date.
- Expired records should appear muted but still clearly historical. Disputed and contradicted records should appear conservative and non-accusatory. Revoked records should appear stronger than expired but still calm.
- Candidate-facing public views should hide raw verifier identity and raw dispute details. Org-review views may show structured reasons and timestamps because they are part of trust review, not public marketing copy.

## I. Analytics / audit requirements

- Required structured events are `verification_requested`, `verification_completed`, `verification_expired`, `verification_refreshed`, `verification_contradicted`, `verification_disputed`, `verification_downgraded`, `verification_superseded`, `verification_revoked`, and `verification_restored`.
- Required payload fields are privacy-safe identifiers and enums only: verification record ID, owner type, subject type, verification kind, verification slot, verifier class, state transition, reason code, badge semantics version, and timestamps.
- Audit logs must capture actor type, actor ID when available, transition trigger, previous state, next state, linked contradiction ID, linked dispute ID, and metadata snapshot.
- Public analytics and matching analytics must reason only over active, non-disputed, non-contradicted, non-revoked trust signals.

## J. Acceptance criteria

- A canonical verification record can represent all supported MVP verification kinds without relying on a single boolean.
- `verification_records.status` supports `verified`, `expired`, `superseded`, `downgraded`, `contradicted`, `disputed`, and `revoked`, and those states are auditable through state transitions.
- Legacy canonical rows with `accepted` and `flagged` are migrated to `verified` and `warning`.
- `/api/verification/status` and the mobile equivalent return compatibility fields plus canonical `summary.publicBadges`, `summary.slots`, and `summary.activeIssues`.
- Public portfolio identity and organization trust labels come from canonical summaries and use conservative badge copy.
- Work email verification stops contributing active trust after its freshness window and surfaces `Verification expired` instead of silently remaining verified.
- Contradictions create auditable records, remove stronger public trust, and surface `Verification changed since issue` or `Verification under review`.
- Open disputes suppress positive trust reasoning until resolution and preserve history after resolution.
- Audit coverage exists for completion, expiry, contradiction, dispute, downgrade, revoke, refresh, and supersede flows.

## K. Risks / tradeoffs

- The main product risk is overclaiming trust with generic `verified` language. The safest MVP recommendation is to keep calm, narrow labels tied to a specific slot and evidence type.
- The main implementation risk is partial migration, where some surfaces still read legacy booleans directly. Compatibility projections reduce breakage, but every new trust surface should use the canonical summary.
- Contradiction handling can be too weak if it silently logs without downgrading live trust, and too heavy if every mismatch revokes immediately. The safest MVP path is immediate downgrade plus review queue, with revocation reserved for confirmed invalidation.
- Attestation evidence can overclaim if verifier class or relationship confidence is weak. The safest MVP default is to allow weaker evidence to stay internal or pending, not to grant stronger public badges.
