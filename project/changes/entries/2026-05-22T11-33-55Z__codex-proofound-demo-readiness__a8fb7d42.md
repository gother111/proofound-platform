# Project Change Entry

- Date/time (UTC): 2026-05-22T11:33:55Z
- Branch: codex/proofound-demo-readiness
- Base commit: a8fb7d42
  What changed:
- Added demo-path guidance to the organization assignment builder, candidate Proof Pack invite flow, and org shortlist surfaces.
- Added fallback proof-first explanation bullets for sparse org match cards.
- Added the 2026-05-22 demo-readiness audit and three walkthrough scripts under `docs/internal-ops/`.

Why:

- Covers Linear PRO-212 through PRO-220 for the three demo-critical MVP moments: structured assignment creation, candidate Proof Pack submission, and explainable shortlist review.

How to verify:

- `npm run test -- tests/ui/assignment-builder-mode-entry.test.tsx tests/ui/candidate-invite-client.test.tsx tests/ui/match-result-card.test.tsx tests/ui/matching-organization-view-beta.test.tsx`
- `npm run lint`
- `npm run typecheck`
- `npm run docs:freshness`
- Browser plugin, in-app Browser: org demo login checked `/app/o/greenpath-ngo/assignments/new` on desktop and narrow viewport, `/app/o/greenpath-ngo/assignments?matching=23aa8ebd-d650-4e88-afec-016866cb48f3`, and `/app/o/greenpath-ngo/profile`; individual demo login checked `/app/i/profile?profileView=full&tab=proof_packs`.

Open risks / TODO:

- No valid local candidate-invite token fixture was found, so candidate Proof Pack changes are covered by focused UI tests and the signed-in individual profile proof-pack route rather than an end-to-end invite-token submission.
