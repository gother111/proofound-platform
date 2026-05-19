> Doc Class: `reference-spec`
> Last Verified: `2026-05-19`

# Manual Testing Checklist

Use this as the quick human smoke checklist for the locked MVP corridor. It complements `docs/testing-strategy.md`, `docs/verification-checklist.md`, and `.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md`.

## Setup

- [ ] Use the intended target URL and account role for the pass.
- [ ] Keep manual-link interview scheduling as the default posture.
- [ ] Enable connected-provider checks only when the target explicitly launches that provider path.
- [ ] Use separate browser profiles or incognito windows for individual, organization, and admin checks.
- [ ] Do not paste secrets or private proof content into screenshots or shared notes.

## Public / Logged-Out

- [ ] `/` renders with proof-first positioning and CTAs route to the correct signup/login paths.
- [ ] `/signup`, `/signup/individual`, and `/signup/organization` orient the persona choice clearly.
- [ ] `/login` handles success, invalid credentials, and protected-route redirects.
- [ ] `/privacy`, `/terms`, `/cookies`, and `/cookies/settings` are reachable from public navigation or footer links.
- [ ] `/portfolio/<handle>` and `/portfolio/org/<slug>` render either a safe public projection or the launch-safe unavailable state.
- [ ] Public pages do not expose private proof, contact, reveal, verification, or admin diagnostics.

## Individual App

- [ ] `/onboarding` starts with one Proof Pack or first-proof action, not generic profile completion.
- [ ] `/app/i/home` orients the user toward proof readiness and current next actions.
- [ ] `/app/i/portfolio` shows private profile context, Proof Packs, public publishing state, and readiness without public-directory language.
- [ ] `/app/i/verifications` shows incoming/sent verification requests with bounded, claim-scoped language.
- [ ] `/app/i/communications` covers messages, reveal, interview, decision, and feedback states without identity leaks before consent.
- [ ] `/app/i/interviews` shows interview and decision context if active.
- [ ] `/app/i/settings/privacy` supports visibility, export, delete/account lifecycle, and audit/history expectations.
- [ ] Empty, loading, error, disabled, success, gated, and mobile states are understandable.

## Organization App

- [ ] `/app/o/<slug>/home` orients the organization to assignments and proof review.
- [ ] `/app/o/<slug>/profile` and `/app/o/<slug>/portfolio` maintain the organization trust-page posture.
- [ ] `/app/o/<slug>/assignments` supports assignment list, create, review, edit, and publish paths.
- [ ] `/app/o/<slug>/assignments/new` makes purpose, work, proof, constraints, and readiness requirements clear before publish.
- [ ] `/app/o/<slug>/matching` and `/app/o/<slug>/shortlist` route into the active assignment/review corridor instead of broad marketplace behavior.
- [ ] `/app/o/<slug>/communications` covers intro, reveal, interview, decision, and engagement-verification communications.
- [ ] `/app/o/<slug>/interviews` supports interview scheduling/reschedule/cancel/complete and decision follow-up with manual links.
- [ ] Organization pages preserve role permissions, privacy ceilings, and candidate consent before identity/contact reveal.

## Internal / Admin / Ops

- [ ] `/admin` fails closed for non-admin users and does not leak diagnostics.
- [ ] `/admin/verification` shows verification/privacy/reveal/risky-upload/pilot ops queues only to authorized admins.
- [ ] `/admin/audit` shows protected audit logs and pagination only to authorized admins.
- [ ] Internal monitoring and launch-status surfaces are authenticated or internal-only.

## Accessibility, Mobile, And Stability

- [ ] Keyboard-only navigation reaches the primary action on representative public, individual, organization, and admin surfaces.
- [ ] Focus indicators are visible.
- [ ] Main content skip links work on public routes.
- [ ] Mobile viewport has no horizontal overflow on representative public, app, org, and admin surfaces.
- [ ] No critical console/runtime errors appear on happy paths.
- [ ] No repeated failing network calls appear in active launch flows.

## Companion Automated Checks

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run docs:freshness`
- [ ] `npm run test:launch:routes`
- [ ] `npm run test:launch:workflow`
- [ ] `npm run test:launch:org-corridor`
- [ ] `npm run test:launch:privacy`
- [ ] `npm run test:e2e:providers:strict`
- [ ] `npm run test:a11y:strict`
