> Doc Class: `active`
> Last Verified: `2026-03-09`

# Block 7: Launch-Safe Verification Trust Ladder

## Recommendation summary

- Proofound MVP must use a narrow trust ladder, not a generic `verified` state.
- Verification stays dimensional. Person verification, role or workplace verification, claim attestation, and artifact verification are separate judgments and must not silently upgrade each other.
- Public portfolio and matching surfaces show active positive trust signals only. Expired, declined, disputed, contradicted, and revoked states remain visible to the owner, org review, and internal or admin surfaces only.
- `verification_records` and `summary.slots` remain the canonical backend model. The ladder below is the user-facing projection layer over that model.
- Proofound must not imply KYC, legal identity proof, background checks, employment certification, or regulatory compliance unless a future product explicitly adds those checks.

## Verification ladder

### `Unverified`

- Evidence source: no completed third-party or system evidence beyond account and profile creation.
- Trust meaning: Proofound has not completed verification evidence for this person, claim, role claim, or artifact.
- Explicitly does not prove: authenticity, identity, employment, authorship, or claim accuracy.
- Freshness rule: not applicable.
- Where it can appear: owner profile settings, org review empty states, request-verification entry points.
- Product benefits unlocked: the item can be shared and submitted for verification.
- Downgrade conditions: not applicable.
- Required copy: `No verification evidence has been completed for this item yet.`

### `Self-asserted`

- Evidence source: user-entered claim, uploaded artifact, or self-declared role claim with no completed third-party confirmation.
- Trust meaning: the candidate is making the claim directly, but Proofound has not independently confirmed it.
- Explicitly does not prove: authenticity, authorship, employment, title, dates, identity, or completeness of the surrounding profile.
- Freshness rule: no expiry because it is not an active trust signal.
- Where it can appear: owner profile, Proof Pack, org review, claim detail views.
- Product benefits unlocked: the item can be shared, included in a Proof Pack, and submitted for attestation or review.
- Downgrade conditions: removed if the user deletes or unpublishes the item.
- Required copy: `Provided by the candidate. Not independently verified by Proofound.`

### `Attested`

- Evidence source: one or more eligible third-party attestations tied to a specific claim, skill, outcome, or role-related statement.
- Trust meaning: an eligible verifier confirmed the specific claim based on direct professional knowledge.
- Explicitly does not prove: legal identity, current employment, or every other claim on the profile.
- Freshness rule: active for 24 months from the most recent accepted attestation. After 24 months it becomes stale and stops counting as active trust.
- Where it can appear: Proof Pack, org review, matching claim summaries, and public portfolio only when the attested claim is visible and still active.
- Product benefits unlocked: claim-level trust boost, attested count in Proof Pack, and trust-based matching or review support for that claim.
- Downgrade conditions: stale age-out, dispute, contradiction, verifier misattribution, or admin revocation.
- Required copy: `A third party attested to this specific claim. This does not verify the entire profile.`

### `Artifact-verified`

- Evidence source: a specific artifact passed platform review or claim-specific corroboration tied to that artifact.
- Trust meaning: the named artifact itself cleared Proofound's MVP threshold for authenticity, provenance, or direct corroboration.
- Explicitly does not prove: that the candidate currently holds the related role or that every narrative claim around the artifact is true.
- Freshness rule: active for 24 months from review or corroboration, then stale until refreshed.
- Where it can appear: inside the artifact view in Proof Pack, org review, matching evidence panels, and public portfolio only for that specific artifact.
- Product benefits unlocked: artifact-level trust cue and higher confidence for artifact-based review.
- Downgrade conditions: material metadata change, failed re-corroboration, dispute, contradiction, or revocation.
- Required copy: `This specific artifact was checked or corroborated. It does not verify every claim associated with it.`

### `Workplace-verified`

- Evidence source: verified work-email control or an approved workplace signal such as LinkedIn workplace evidence.
- Trust meaning: Proofound observed an employer-linked signal tied to the candidate at the time of the check.
- Explicitly does not prove: current employment beyond the freshness window, job title, seniority, performance, payroll status, or legal employment status.
- Freshness rule: active for 12 months from the latest successful check.
- Where it can appear: owner profile, Proof Pack header, matching summaries, org review, and public portfolio only when active.
- Product benefits unlocked: workplace trust badge, organization-linking support, and workplace-gated trust boosts or filters.
- Downgrade conditions: freshness expiry, contradiction, open dispute, revoked signal, or loss of control over the underlying channel.
- Required copy: `Proofound confirmed an employer-linked signal at the time checked. It does not guarantee current employment or job title.`

### `Identity checked`

- Evidence source: approved provider-backed person-match signal only.
- Trust meaning: Proofound received a provider-backed result that this account holder matched a person identity check at verification time.
- Explicitly does not prove: KYC completion, legal identity certification, sanctions screening, background checks, employment, qualifications, or that every profile detail is true.
- Freshness rule: active for 24 months from the latest successful provider result.
- Where it can appear: owner profile, Proof Pack header, matching summaries, org review, and public portfolio only when active.
- Product benefits unlocked: top person-level trust badge and eligibility for identity-required trust gates.
- Downgrade conditions: freshness expiry, contradiction, dispute, provider reversal, or manual revocation.
- Required copy: `Proofound received a provider-backed identity-check signal for this account. It is not a legal identity certification or background check.`

## Badge semantics

### Canonical model vs ladder

- `verification_records` remain the canonical trust judgments.
- `summary.slots` remain the source of truth for slot-level state and compatibility projections.
- The launch-safe ladder is the user-facing projection over those slots:
  - `individual.identity` -> `Identity checked`
  - `individual.workplace` -> `Workplace-verified`
  - `skill.attestation` and `impact_story.attestation` -> `Attested`
  - `artifact.attestation` or artifact-specific review -> `Artifact-verified`
- Legacy `verificationTier` values such as `workplace_verified` and `identity_verified` remain compatibility fields only. They are not the canonical language shown to users.

### What is being verified

- Person verification answers: `Is this account tied to a provider-backed person check?`
- Role or workplace verification answers: `Did Proofound observe an employer-linked signal or an eligible attester confirming this role-related claim?`
- Artifact verification answers: `Did this specific artifact clear a corroboration or review threshold?`

### Cross-signal limits

- `Identity checked` does not imply `Workplace-verified`.
- `Workplace-verified` does not imply `Attested`.
- `Artifact-verified` does not imply the full role claim or full profile is true.
- `Attested` applies to the specific claim being attested. It must not upgrade unrelated claims.
- Partial verification is allowed and must be explicit. Example: a candidate may be `Identity checked` while a current employer claim is only `Self-asserted`. A separate artifact may be `Artifact-verified` while the person remains `Self-asserted`.

## Freshness, expiry, and downgrade rules

### Action-link expiry and resend

- Work-email action links expire after 24 hours.
- Attestation and claim-review response links expire after 7 days.
- Resend must issue a new single-use token and invalidate the old token immediately.
- Opening an expired or superseded token must never auto-complete an old request. The user should see neutral copy such as `This link is no longer active. Request the latest verification email.`

### Active trust windows

- `Identity checked`: 24 months
- `Workplace-verified`: 12 months
- `Attested`: 24 months active, then stale
- `Artifact-verified`: 24 months active, then stale
- `Self-asserted` and `Unverified`: no active trust window because they are not active trust

### Stale and expired behavior

- Once an active trust window lapses, the signal stops contributing to public badges, matching boosts, and active org review trust summaries immediately.
- Owner profile and org review retain the historical record with muted `Expired` or `Stale` treatment plus the checked date and refresh action.
- `declined` is a request outcome, not a public-facing negative badge.

### Downgrade precedence

- `revoked`, `disputed`, and `contradicted` outrank freshness. They remove active trust immediately.
- `expired` outranks `verified`.
- `superseded` keeps history but no longer contributes to active trust.
- Conflict scope defaults to the affected slot or claim only. Unrelated items are downgraded only if the same evidence directly underpinned them.

## Product-surface display rules

| Surface          | Show                                                                                                                           | Hide                                                                                                   | Action behavior                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Owner profile    | All current and historical states, including pending, expired, declined, disputed, contradicted, and revoked                   | Raw verifier private data unless the owner already supplied it                                         | Request, resend, refresh, dispute, remove                                                         |
| Proof Pack       | Person-level summary plus claim-level and artifact-level statuses; stale and under-review states when opened in review context | Raw allegation text, verifier private email, internal moderation notes                                 | Each item shows its own status; self-asserted items remain shareable but labeled as self-asserted |
| Matching         | Active positive signals only: `Identity checked`, `Workplace-verified`, active `Attested`, active `Artifact-verified`          | Negative states, self-asserted badges, verifier identity                                               | Expired or disputed signals stop boosting and stop satisfying trust filters                       |
| Public portfolio | Active positive badges only, scoped to the visible person, claim, or artifact                                                  | `Unverified`, `Self-asserted`, `Pending`, `Declined`, `Expired`, `Disputed`, `Contradicted`, `Revoked` | If no active badge exists, show no trust badge rather than a warning                              |
| Org review       | Full trust matrix by person, role claim, and artifact, with dates, source class, freshness state, and issue state              | Raw allegation text and unnecessary PII                                                                | Resend, dispute intake, manual review, reason-coded downgrade history                             |

## Conflict handling and request outcomes

### Declined and disputed attestations

- A declined attestation appears to the requester as `Declined` on the request record.
- The underlying claim remains `Self-asserted` unless other active evidence exists.
- A disputed attestation removes the positive badge from public and matching surfaces immediately.
- During a dispute, owner and org review surfaces use calm copy such as `Verification under review`.

### Mixed evidence

- If one eligible attester accepts and another declines the same claim, the claim may still appear as `Attested` if at least one accepted attestation remains active and undisputed.
- Org review should show that evidence is mixed. Public surfaces should still show only the active positive badge, not the conflicting request history.

### Contradictions

- Contradictions may come from re-verification, changed profile facts, conflicting verifier claims, moderation review, or imported evidence that invalidates an earlier snapshot.
- When contradiction is detected, active public trust is removed immediately for the affected slot or claim.
- Public surfaces show no negative badge. Owner and org review surfaces show conservative status language only.

## Acceptance criteria

- The verification section defines one user-facing ladder and explicitly separates it from the underlying canonical slot model.
- Every status states what it proves, what it does not prove, its freshness rule, where it appears, what it unlocks, and how it is lost.
- The policy explicitly separates person verification, role or workplace verification, and artifact verification.
- Partial verification is explicitly allowed and illustrated.
- Public surfaces never use bare `verified` as a trust label.
- Expired or disputed evidence is removed immediately from public and matching trust reasoning.
- Declined attestation requests are treated as request outcomes, not public negative badges.
- Work-email link expiry and attestation-link expiry are explicit, including resend rotation behavior.
- Analytics and audit requirements are privacy-safe and mandatory for every trust-state transition.

## Edge cases and conflict scenarios

- Work email is active but LinkedIn workplace evidence later conflicts:
  - Remove active `Workplace-verified` from public and matching immediately.
  - Show `Verification under review` only in owner and org review surfaces until resolved.
- `Identity checked` remains active while workplace evidence expires:
  - Keep `Identity checked`.
  - Remove `Workplace-verified`.
  - Treat the role or employment claim as only partially verified.
- One attester accepts and another declines the same claim:
  - Keep `Attested` only if at least one eligible positive attestation remains active and undisputed.
  - Show mixed evidence detail in org review.
- An artifact is edited after being verified:
  - Mark the prior artifact verification `superseded`.
  - Remove the active artifact badge until the changed artifact is reviewed again.
- An old link is opened after resend:
  - Show `This link is no longer active. Request the latest verification email.`
  - Never allow the old token to submit, refresh, or overwrite a newer request state.

## Event tracking

### Analytics events

- `verification_requested`
- `verification_link_sent`
- `verification_link_resent`
- `verification_link_opened`
- `verification_completed`
- `verification_declined`
- `verification_expired`
- `verification_downgraded`
- `verification_contradicted`
- `verification_disputed`
- `verification_revoked`
- `verification_restored`
- `verification_badge_earned`
- `verification_badge_lost`

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
- ladder status before and after
- canonical state before and after
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
