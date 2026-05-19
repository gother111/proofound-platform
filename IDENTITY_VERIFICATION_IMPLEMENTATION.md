> Doc Class: `reference-spec`
> Last Verified: `2026-05-19`

# Scoped Verification Implementation Context

> This file is implementation context, not the canonical MVP product contract.
> Launch scope is defined first by `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`, then by `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`, `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`, `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`, `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md`, and fresh repo-grounded evidence. This document is reference-only implementation context.

## Purpose

This document records how verification-related implementation work in the repo should be interpreted after the MVP scope lock.

The launch product promise is a scoped trust model, not a generic identity-verification product and not a broad `verified badge` promise.

## Canonical MVP Interpretation

- Proofound MVP uses narrow trust signals attached to specific people, org-linked facts, claims, artifacts, or engagement records.
- The launch-safe user-facing trust families are documented in `docs/verification-policy-mvp.md`.
- Organization-linked checks, peer attestations, human review, and automated integrity checks may coexist without implying legal identity proof or profile-wide certification.
- Government-ID self-serve verification is not a canonical MVP promise.
- Any legacy implementation for stronger identity checks must be treated as optional implementation history unless the locked MVP authority stack explicitly promotes it.

## Implementation History in This Repo

Historical implementation work introduced verification-related surfaces such as:

- work-email verification
- organization-linked confirmation flows
- external identity-provider experiments
- status pages and trust-state UI

That history is still useful for engineering context, but it should not be read as evidence that every path is launch-binding.

## Launch-Safe Verification Categories

### Org-linked verification

- Used for facts an organization can legitimately confirm, such as role relationship, assignment participation, or engagement context.
- Supports conservative trust gating without claiming payroll, compliance, or registry certification.

### Peer attestation

- Used for scoped claims, outcomes, or contribution facts that a peer directly observed.
- Must stay attached to the specific item under review rather than upgrading the whole profile.

### Human review

- Used as a lightweight manual override or dispute-resolution path for MVP trust operations.
- Must remain reason-coded and narrow in scope.

### Engagement verification

- Used when the platform can confirm a limited workflow event or participation fact.
- Must not be marketed as a broad identity or background check.

## Legacy Provider Notes

Some older implementation work references providers or flows such as:

- work-email verification
- LinkedIn-derived signals
- Veriff or other document-check vendors

Those references should now be interpreted as implementation options or historical experiments. They do not redefine the locked MVP trust contract on their own.

## Product Copy Guidance

- Do not use broad `Verified` language without scope.
- Prefer phrases such as `org-verified for this fact`, `peer-attested`, `human-reviewed`, or `auto-checks passed`.
- Do not imply KYC, legal identity certification, compliance clearance, payroll confirmation, or background screening unless a later product explicitly adds those checks.

## Verification Review Rule

When implementation and product wording conflict:

1. follow the locked MVP authority stack
2. follow `docs/verification-policy-mvp.md`
3. narrow the product claim rather than broadening it

## Open Follow-up

- Audit live UI copy for any remaining generic `verified` language.
- Keep historical provider integrations behind clear non-canonical wording until a future product decision promotes them.
