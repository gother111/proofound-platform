> Doc Class: `active`
> Last Verified: `2026-04-27`

# Internal Ops SOP Index

This folder is the current pilot-stage manual ops source for the locked MVP.

Scope guard:

- Keep Proofound centered on Proof Packs, privacy-safe review, assignment clarity, and the hiring corridor.
- Treat the public portfolio as a derived surface, not the product center.
- Do not use these SOPs to add broader moderation, recruiting, or enterprise workflow behavior.

## Live owners

- `Support / verification lead`
- `Product / ops lead`
- `Engineering on-call`

Named launch owner roster:

- [launch-owner-roster-2026-04-27.md](./launch-owner-roster-2026-04-27.md)

Current production launch evidence:

- [production-launch-evidence-2026-04-27.md](./production-launch-evidence-2026-04-27.md)

## Doc list

| Document | Owner | Escalation owner | Intended use | Queue mapping |
| --- | --- | --- | --- | --- |
| [verification-review-sop.md](./verification-review-sop.md) | `Support / verification lead` | `Product / ops lead`, then `Engineering on-call` for system faults | Claim-scoped manual verification review, partly/no attestation responses, stale trust, contradiction handling | `verification` |
| [redaction-risky-upload-sop.md](./redaction-risky-upload-sop.md) | `Support / verification lead` | `Product / ops lead`, then `Engineering on-call` for leak or ingest faults | Risky-upload review when ingest holds evidence for filename, metadata, or identity-bearing risk | `correction_revocation` shown as `redaction / risky upload` |
| [reveal-privacy-dispute-sop.md](./reveal-privacy-dispute-sop.md) | `Product / ops lead` | `Engineering on-call` for active privacy leaks or broken reveal controls | Reveal timeout disputes, privacy complaints, consent disputes, identity-exposure incidents | `privacy_reveal_exception` shown as `privacy / reveal disputes` |
| [assignment-quality-checklist.md](./assignment-quality-checklist.md) | `Product / ops lead` | `Support / verification lead` for trust/privacy concerns | Pre-publish assignment quality check and pilot triage when an assignment is too vague for the corridor | `pilot_ops` |
| [engagement-verification-evidence-checklist.md](./engagement-verification-evidence-checklist.md) | `Support / verification lead` | `Product / ops lead` | Decide whether post-hire evidence is strong enough to mark engagement verified in MVP | `pilot_ops` |
| [workflow-comms-templates.md](./workflow-comms-templates.md) | `Support / verification lead` | `Product / ops lead` | Plain-language email and candidate comms templates for manual pilot handling | Used across all four queues |

## Queue surfaces

- Internal queue view: `/admin/verification`
- Audit trail view: `/admin/audit`
- Queue API: `GET /api/admin/internal-ops/queues`
- Queue action API: `PATCH /api/admin/internal-ops/queues/[id]`

## Pilot handling rules

- Every sensitive queue action must leave an audit event in `admin_audit_log`.
- Resolve, cancel, and reopen actions require an operator note.
- If privacy, consent, or identity-bearing reveal is in doubt, keep the narrower privacy state in place until the dispute is resolved.
- If assignment quality is weak, fix assignment clarity before pushing more candidate review.
- If evidence is not sufficient to support trust or engagement verification, keep the state pending instead of upgrading optimistically.
