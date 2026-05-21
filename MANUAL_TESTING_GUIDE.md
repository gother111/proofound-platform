> Doc Class: `reference-spec`
> Last Verified: `2026-05-21`

# Manual Testing Guide

This guide describes the current human QA path for the locked Proofound MVP. It is intentionally narrower than older platform-era manual guides.

## Ground Rules

- Use the authority order in `AGENTS.md` when manual findings conflict with older docs.
- Treat proof-first assignment review, Proof Packs, assignments, verification, consented reveal, interviews, decisions, and engagement verification as the active corridor.
- Treat manual-link interview scheduling as the default interview path.
- Run connected-provider checks only when a target explicitly enables that provider.
- Record target URL, account role, viewport, result, and any remaining `UNVERIFIED` item.

## 1. Public And Auth

Routes:

- `/`
- `/signup`
- `/signup/individual`
- `/signup/organization`
- `/login`
- `/privacy`
- `/terms`
- `/cookies`
- `/portfolio/<handle>`
- `/portfolio/org/<slug>`

Checks:

- Landing copy is proof-first, calm, and specific.
- Signup and login have obvious primary actions and recoverable error states.
- Footer/legal links are reachable.
- Public individual and organization pages either render safe public projections or a safe unavailable state.
- Public surfaces do not expose private proof, hidden verification state, proof-review participant contact details, reveal status, or admin diagnostics.

## 2. Individual Corridor

Routes:

- `/onboarding`
- `/app/i/home`
- `/app/i/portfolio`
- `/app/i/verifications`
- `/app/i/communications`
- `/app/i/interviews`
- `/app/i/settings/privacy`

Checks:

- First-time flow starts with proof creation and readiness, not broad profile theater.
- Profile context remains private unless explicitly published.
- Proof Pack state, proof quality, anchor context, verification state, and publishing readiness are understandable.
- Verification requests use bounded, claim-scoped copy.
- Communications preserve privacy before reveal and make intro/reveal/interview/decision states clear.
- Export/delete/privacy controls are discoverable and do not overstate trust.
- Empty, loading, error, disabled, success, archived/gated, and mobile states are covered where relevant.

## 3. Organization Corridor

Routes:

- `/app/o/<slug>/home`
- `/app/o/<slug>/profile`
- `/app/o/<slug>/portfolio`
- `/app/o/<slug>/assignments`
- `/app/o/<slug>/assignments/new`
- `/app/o/<slug>/matching`
- `/app/o/<slug>/shortlist`
- `/app/o/<slug>/communications`
- `/app/o/<slug>/interviews`

Checks:

- Organization onboarding/profile/trust surfaces stay focused on the current organization, not broad directory behavior.
- Assignment list/create/edit/review/publish paths make the primary object and next action obvious.
- Proof-submission review cards explain why a match is relevant without ranking theater or hidden identity leaks.
- Matching and shortlist shortcuts stay inside the assignment review corridor.
- Intro request, reveal request, proof-review participant consent, interview scheduling/reschedule, decision recording, engage/close, and engagement verification are understandable.
- Team/role behavior, if active for the target, enforces current permissions.
- Empty, loading, error, disabled, success, archived/gated, and mobile states are covered where relevant.

## 4. Admin And Internal Ops

Routes:

- `/admin`
- `/admin/verification`
- `/admin/audit`

Checks:

- Public and standard users fail closed.
- Queue content is visible only to authorized admins.
- Verification, privacy/reveal dispute, risky-upload, and pilot-ops queue labels match the internal ops SOPs.
- Audit logs are protected and useful for launch-safe manual review.
- Monitoring and launch-status diagnostics remain internal/authenticated.

## 5. Accessibility And Visual QA

Use desktop and mobile viewports.

- Public, individual, organization, and admin surfaces have a clear primary object and next action.
- Text fits containers without overlap.
- Keyboard navigation reaches all critical controls.
- Focus states are visible.
- Error states are written in plain language.
- The UI avoids generic dashboards, vanity metrics, broad platform claims, and internal jargon.

## 6. Automation Companions

Run or cite the strongest available automated checks:

- `npm run docs:freshness`
- `npm run test:launch:routes`
- `npm run test:launch:workflow`
- `npm run test:launch:org-corridor`
- `npm run test:launch:privacy`
- `npm run test:launch:portfolio`
- `npm run test:e2e:providers:advisory` only if connected-provider scheduling is intentionally in scope for the target
- `npm run test:a11y:strict`
- `BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run monitor:launch`
- `BASE_URL=<production-candidate-url> SUS_STUDY_COMPLETE=true CRON_SECRET=<secret> npm run go:no-go`

If a check cannot run, record the exact reason and the manual evidence that partially covers it. Do not convert that into a launch `PASS`.
