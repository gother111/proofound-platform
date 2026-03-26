> Doc Class: `active`
> Last Verified: `2026-03-25`

# Phase 2: Trust and Review Canonicalization

Execution crosswalk: authoritative MVP `Phase 2 — Trust and review`.

Current status: `PLANNED`, gated behind Phase 1.

Phase goal: keep the active launch corridor fully canonical and claim-scoped while making any remaining compatibility obligations explicit, bounded, and temporary.

| Task ID | Task | Owner | Depends On | Launch Blocking | Exit Criteria | Evidence / Verification |
| --- | --- | --- | --- | --- | --- | --- |
| `P2-1` | Decide the fate of the remaining legacy verification compatibility branches, especially historical token responders and compatibility-only request paths. Rerun one historical path only if it can be seeded safely; otherwise explicitly archive or retain it with a dated expiry note. | Backend | `Phase 1 PASS` | `Yes` if active launch behavior still depends on the compatibility path; otherwise `No` | Every remaining compatibility branch has an explicit disposition: rerun-backed retain, archive, or removal candidate. No branch remains in “we should probably keep it” limbo. | Start from [`../block-8-report.md`](../block-8-report.md), [`../block-5-report.md`](../block-5-report.md), [`../../src/app/api/verify/[token]/route.ts`](../../src/app/api/verify/[token]/route.ts), [`../../src/app/api/verify/custom/[token]/route.ts`](../../src/app/api/verify/custom/[token]/route.ts), and [`../../src/lib/verification/request-feed.ts`](../../src/lib/verification/request-feed.ts). |
| `P2-2` | Remove any remaining launch-client dependence on compatibility-only verification fields or transport branches so the active launch web and mobile clients use canonical claim-scoped verification behavior only. | Backend + Frontend | `P2-1` | `Yes` | No active launch client relies on legacy verification transport or compatibility-only fields for live request creation, listing, sent-item management, or status display. | Repeat the focused repo searches captured in [`../block-5-report.md`](../block-5-report.md), then rerun the canonical launch clients that consume verification state, feed, or request actions. |
| `P2-3` | Reconfirm blind review, candidate-consented reveal, verification status, and RLS or authz truth after the canonicalization work. | QA + Platform | `P2-2` | `Yes` if any rerun regresses, otherwise `No` | All currently green trust and review rows remain `PASS` after the cleanup. No regression is accepted to preserve a compatibility branch. | Run `npm run test -- tests/api/verification-status-route.test.ts tests/ui/verification-status-options.test.tsx tests/api/org-match-review-route.test.ts tests/api/conversation-reveal-route.test.ts tests/api/engagement-verifications-route.test.ts tests/lib/authz-policy.test.ts tests/lib/workflow-decision-record.test.ts`; then run `npm run test:privacy` and `npm run test:privacy:extended` sequentially. |

Phase notes:

- This phase must not widen scope to preserve legacy expertise-prefixed transport or older trust semantics.
- Compatibility that no longer protects a live MVP corridor should be archived, not celebrated.
