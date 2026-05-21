> Doc Class: `active`
> Last Verified: `2026-05-19`

# Block 7: Launch-Safe Verification Trust Model

> Canonical scope note: the locked MVP source of truth sets the launch promise, followed by the aligned PRD, technical requirements, launch runbook, GTM plan, and fresh repo evidence. This policy defines the scoped trust model beneath that promise. It must not be read as a generic identity-verification or broad verified-badge spec.

## Recommendation summary

- Proofound MVP must use a narrow, scoped trust model, not a generic `verified` state.
- Verification stays dimensional. A person, org-linked fact, claim, artifact, or engagement record can each carry different evidence.
- The user-facing badge family must match the canonical PRD:
  - `self-claimed`
  - `peer-attested`
  - `org-verified`
  - `human-reviewed`
  - `auto-checks-passed`
- Public portfolio and matching surfaces show only active, positive, privacy-safe badges.
- `verification_records` and `summary.slots` remain the canonical backend model. The trust model below is the user-facing projection layer over that model.
- Proofound must not imply KYC, legal identity proof, background checks, employment certification, payroll verification, or regulatory compliance unless a future product explicitly adds those checks.

## Evidence-layer state model

### Verification type

- `self-claimed`
- `peer-attested`
- `org-verified`
- `human-reviewed`
- `auto-checks-passed`

### Verification record state

- `pending`
- `active`
- `stale`
- `expired`
- `declined`
- `contradicted`
- `revoked`
- `corrected`

### Proof rung

- `Claim`
- `Proof`
- `Deep Case`

Interpretation rules:

- Every claim, artifact, or engagement record starts as `self-claimed(active)` when the owner saves it.
- A request for peer, org, human, or automated review creates a separate verification record in `pending`.
- Successful completion creates an `active` record under one of the four non-self verification types.
- Freshness moves `active -> stale -> expired` by rule without deleting history.
- Any non-self active record may move to `contradicted`, `revoked`, or `corrected`.
- Corrections append new history. They do not overwrite or erase prior verification records.

## Verification badge family

### `self-claimed`

- Evidence source: owner-entered claim, uploaded artifact, self-declared role fact, or owner-created engagement record.
- Trust meaning: the owner is making the claim directly and Proofound has provenance to the submitting account and timestamp.
- Explicitly does not prove: independent validation, authorship, identity, employment, contract completion, or factual accuracy.
- Freshness rule: no expiry because it is not an active positive trust signal.
- Where it can appear: owner profile, Proof Pack editor, Proof Pack detail, and authorized org review detail.
- Product behavior: the item remains usable, shareable, and eligible for verification requests.
- Required copy: `Provided by the owner. Not independently verified by Proofound.`

### `peer-attested`

- Evidence source: one or more eligible peer attestations tied to a specific claim, skill, outcome, contribution, or engagement fact.
- Trust meaning: an eligible peer confirmed the specific scoped item based on direct knowledge.
- Explicitly does not prove: legal identity, current employment, or every other claim on the profile.
- Freshness rule: active for 24 months from the latest accepted attestation, then `stale`, then `expired`.
- Where it can appear: Proof Pack detail, matching evidence summaries, org review trust panels, and public portfolio only when the attested item is public and still active.
- Product behavior: scoped trust boost only. It must not silently upgrade unrelated claims.
- Required copy: `A peer attested to this specific item. It does not verify the entire profile.`

### `org-verified`

- Evidence source: verified work-email control, org-admin confirmation, or another authorized org-controlled channel confirming a scoped org-linked fact.
- Trust meaning: Proofound observed or received an organization-linked confirmation for the specific relationship, role fact, assignment fact, or engagement fact at the time checked.
- Explicitly does not prove: registry certification, payroll confirmation, compliance clearance, or every title, duty, or date on the profile.
- Freshness rule: active for 12 months from the latest successful org-linked check, then `stale`, then `expired`.
- Where it can appear: owner verification settings, Proof Pack header or claim rows when relevant, matching summaries, org review, and public portfolio only when active.
- Product behavior: may satisfy org-linked verification gates when the assignment explicitly requires that trust type.
- Required copy: `Proofound confirmed an organization-linked signal for this specific fact at the time checked.`

### `human-reviewed`

- Evidence source: scoped manual Proofound review of a claim, artifact, or engagement record.
- Trust meaning: an internal reviewer assessed the submitted evidence and marked the specific item as sufficiently corroborated for MVP trust purposes.
- Explicitly does not prove: legal certification, compliance approval, or that no future contradiction can arise.
- Freshness rule: active for 24 months unless the underlying evidence changes materially, then `stale` or `expired`.
- Where it can appear: owner verification history, org review trust panels, and public or matching surfaces only as a narrow active badge for public-safe items.
- Product behavior: manual review is a lightweight MVP override and correction path, not a large reviewer ops system.
- Required copy: `This specific item was manually reviewed by Proofound. It is not a legal certification.`

### `auto-checks-passed`

- Evidence source: machine-verifiable integrity or provenance checks such as domain control, token proof, link reachability, file integrity consistency, or metadata consistency checks.
- Trust meaning: the item passed the specific machine-verifiable checks Proofound ran.
- Explicitly does not prove: truth of the full narrative, authorship, legal identity, or hard fraud guarantees.
- Freshness rule: check-class dependent. The badge must downgrade at the moment the underlying machine-verifiable signal is no longer valid.
- Where it can appear: owner verification detail, artifact rows, org review trust panels, and public portfolio only when the check is active and safe to summarize briefly.
- Product behavior: supports provenance and integrity confidence, but never overclaims factual truth.
- Required copy: `This item passed specific automated integrity or provenance checks.`

## Canonical model vs coarse states

- `verification_records` remain the canonical trust judgments.
- `summary.slots` remain the source of truth for slot-level state and compatibility projections.
- The five badge types above are the user-facing evidence-layer model.
- Existing coarse product states remain unchanged:
  - user trust tier: `unverified`, `workplace_verified`, `identity_verified`
  - Proof Pack verification status: `unverified`, `partially_verified`, `verified`, `disputed`
- Badge evidence informs those coarse states conservatively:
  - `unverified` user trust tier persists unless active workplace-linked or identity-linked evidence exists under the existing user-trust rules
  - `unverified` Proof Pack verification status applies when a pack has no active scoped non-self verification evidence
  - `partially_verified` applies when some scoped items have active non-self verification evidence but coverage is incomplete
  - `verified` applies only when pack-level threshold rules are satisfied
  - `disputed` applies when a material contradiction or dispute suppresses active positive pack-level trust
- The badge layer is more granular than the coarse states and must not be flattened into a single public claim of `verified`.
- Compatibility fields or older provider-derived states, including work-email or LinkedIn history, must stay account-side unless a current scoped verification record makes the specific fact launch-safe to project.

## Verification source and eligibility model

### Who can verify what

- Owner:
  - may create `self-claimed` items only
- Eligible peers:
  - may create `peer-attested` records for scoped claims, outcomes, contribution narratives, or engagement facts they directly observed
- Verified org representatives:
  - may create `org-verified` records for scoped org-linked facts such as role relationship, assignment participation, or engagement confirmation
- Proofound internal reviewers:
  - may create `human-reviewed` records for scoped claims, artifacts, or engagement evidence
- Platform systems:
  - may create `auto-checks-passed` records for system-verifiable checks only

### Attestor eligibility rules

- A peer attestor must:
  - have a valid account or secure attestation token
  - attest to a specific item, not a whole profile
  - supply a relationship basis such as collaborator, manager, client, or teammate
- An org attestor must:
  - be authorized for the relevant org context or verify control of an approved org channel
  - attest only to facts the organization can reasonably confirm
- Internal reviewers must:
  - act through authenticated reviewer tooling
  - use scoped reason codes rather than free-form public comments

### Conflict-of-interest rules

- Users cannot verify themselves beyond `self-claimed`.
- Family members, duplicate accounts, or accounts controlled by the same natural person are ineligible as peer attestors.
- An org attestor cannot verify a fact if they are not authorized for the relevant org context.
- Internal reviewers cannot approve their own submitted evidence.

### Duplicate, contradictory, revocation, and correction handling

- Duplicate attestations for the same item from the same attestor are merged into the newest active record and older duplicates become superseded history.
- Multiple positive attestations may coexist when they come from distinct eligible attestors.
- Contradictory evidence does not silently average out.
- When contradiction is material, the affected active badge is removed from public and matching surfaces immediately and the record moves to `contradicted` or remains `pending` under review.
- Revocation is used when a prior verification should no longer be trusted.
- Correction is used when the core fact remains valid but the prior verification record needs amendment.
- Both flows append new history and preserve prior records.

## Freshness, expiry, and downgrade rules

### Action-link expiry and resend

- Work-email action links expire after 24 hours.
- Attestation and claim-review response links expire after 7 days.
- Resend must issue a new single-use token and invalidate the old token immediately.
- Opening an expired or superseded token must never auto-complete an old request. The user should see neutral copy such as `This link is no longer active. Request the latest verification email.`

### Active trust windows

- `peer-attested`: 24 months active, then `stale`, then `expired`
- `org-verified`: 12 months active, then `stale`, then `expired`
- `human-reviewed`: 24 months active unless the underlying evidence changes materially
- `auto-checks-passed`: check-class dependent and must downgrade as soon as the underlying machine-verifiable condition no longer holds
- `self-claimed`: no active trust window because it is not an active positive trust signal

### Stale and expired behavior

- Once an active trust window lapses, the signal stops contributing to public badges, matching boosts, and active org review trust summaries immediately.
- Owner profile and org review retain the historical record with muted `stale` or `expired` treatment plus the checked date and refresh action.
- `declined` is a request outcome, not a public-facing negative badge.

### Downgrade precedence

- `revoked`, `contradicted`, and `disputed` outrank freshness. They remove active trust immediately.
- `expired` outranks `active`.
- `corrected` preserves history while pointing to the newer current record.
- `superseded` keeps history but no longer contributes to active trust.
- Conflict scope defaults to the affected slot or claim only. Unrelated items are downgraded only if the same evidence directly underpinned them.

## Product-surface display rules

| Surface          | Show                                                                                                                            | Hide                                                                                              | Action behavior                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Owner profile    | All current and historical states, including pending, stale, expired, declined, contradicted, revoked, and corrected            | Raw verifier private data unless the owner already supplied it                                    | Request, resend, refresh, dispute, remove                                        |
| Proof Pack       | Person-level summary plus claim-level, artifact-level, and engagement-level statuses when visible in review context             | Raw allegation text, verifier private email, internal moderation notes                            | Each item shows its own status; `self-claimed` items remain usable and shareable |
| Matching         | Active positive signals only: `peer-attested`, `org-verified`, `human-reviewed`, `auto-checks-passed` when relevant to the item | Negative states, `self-claimed` badges, verifier identity                                         | Stale or contradicted signals stop boosting and stop satisfying trust filters    |
| Public portfolio | Active positive badges only, scoped to the visible person, claim, artifact, or engagement item                                  | `self-claimed`, `pending`, `declined`, `stale`, `expired`, `contradicted`, `revoked`, `corrected` | If no active badge exists, show no trust badge rather than a warning             |
| Org review       | Full trust matrix by person, role claim, artifact, and engagement record, with dates, source class, freshness state, and issues | Raw allegation text and unnecessary PII                                                           | Resend, dispute intake, manual review, reason-coded downgrade history            |

## Conflict handling and request outcomes

### Declined and disputed attestations

- A declined attestation appears to the requester as `declined` on the request record.
- The underlying item remains `self-claimed` unless other active evidence exists.
- A disputed attestation removes the positive badge from public and matching surfaces immediately.
- During a dispute, owner and org review surfaces use calm copy such as `Verification under review`.

### Mixed evidence

- If one eligible attester accepts and another declines the same claim, the item may still appear with `peer-attested` if at least one accepted attestation remains active and undisputed.
- Org review should show that evidence is mixed. Public surfaces should still show only the active positive badge, not the conflicting request history.

### Contradictions

- Contradictions may come from re-verification, changed profile facts, conflicting verifier claims, moderation review, or imported evidence that invalidates an earlier snapshot.
- When contradiction is detected, active public trust is removed immediately for the affected scope.
- Public surfaces show no negative badge. Owner and org review surfaces show conservative status language only.

## Contract and engagement verification

Minimum viable acceptable proofs in MVP:

- mutual attestation from both sides on the same engagement record
- uploaded signed agreement or uploaded sent agreement evidence
- uploaded invoice, statement of work, offer letter, or equivalent engagement artifact
- a matching combination of an organization confirmation plus a proof-review participant confirmation on the same engagement fact

Interpretation rules:

- Mutual attestation is acceptable MVP proof for engagement confirmation, but it is not legal contract enforcement.
- Uploaded evidence may strengthen or replace missing mutual attestation if the reviewer or org confirmation path supports it.
- Later integrations such as DocuSign, HRIS, payroll, background checks, and hard identity checks are post-MVP only.

## Acceptance criteria

- The verification policy defines one user-facing badge family and explicitly separates it from the underlying canonical slot model and coarse trust states.
- Every badge states what it proves, what it does not prove, its freshness rule, where it appears, and how it is lost.
- Public surfaces never use bare `verified` as a trust label.
- `self-claimed` is never treated as a public-positive trust badge.
- Expired, contradicted, or disputed evidence is removed immediately from public and matching trust reasoning.
- Declined attestation requests are treated as request outcomes, not public negative badges.
- Work-email link expiry and attestation-link expiry are explicit, including resend rotation behavior.
- Contract and engagement proof stays MVP-light and explicitly excludes KYC, payroll, and compliance theater.
- Analytics and audit requirements are privacy-safe and mandatory for every trust-state transition.

## Edge cases and conflict scenarios

- Org-linked confirmation is active but later contradicted:
  - Remove active `org-verified` from public and matching immediately.
  - Show `Verification under review` only in owner and org review surfaces until resolved.
- One attester accepts and another declines the same claim:
  - Keep `peer-attested` only if at least one eligible positive attestation remains active and undisputed.
  - Show mixed evidence detail in org review.
- An artifact is edited after a non-self badge was active:
  - Mark the prior non-self verification as non-current or superseded.
  - Remove the active public badge until the changed artifact is refreshed or re-reviewed.
- An old link is opened after resend:
  - Show `This link is no longer active. Request the latest verification email.`
  - Never allow the old token to submit, refresh, or overwrite a newer request state.
- A public portfolio renders an item with only owner-originated evidence:
  - Do not show a public-positive trust badge.
  - Keep the item visible only according to its normal public visibility rules.

## Event tracking

### Analytics events

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
- `intro_blocked_by_verification`

### Audit events

- token issued
- token invalidated by resend
- token expired
- request created
- request viewed
- response submitted
- state changed
- conflict detected
- dispute opened
- dispute resolved
- manual override or revocation

### Required event payload fields

- privacy-safe actor ID
- owner type and owner ID
- subject type and subject ID
- verification slot
- verification type before and after
- verification record state before and after
- proof rung before and after, when applicable
- evidence source kind
- verifier class
- reason code
- timestamps
- related request ID or record ID

### Prohibited analytics payload content

- raw verifier email
- raw allegation text
- uploaded artifact contents
- free-form admin notes
