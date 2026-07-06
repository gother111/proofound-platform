# Project Change Entry

- Date/time (UTC): 2026-07-06T13:25:25Z
- Branch: warroom-p0-activation
- Base commit: b2105ebf
  What changed:
- Replaced rendered user-facing insider vocabulary across app, marketing, portfolio, onboarding, matching, dashboard, verification, and API-fed copy with plain-language labels.
- Added a shared `TermHint` tooltip for readiness labels that still need product-specific names.
- Updated affected copy assertions and e2e expectations.

Why:

- P0-10 requires app and marketing surfaces to avoid unexplained terms such as corridor, attestation, trust anchor, match-visible, intro-eligible, and proof pack.

How to verify:

- `git diff --check`
- `npm run lint`
- `npm run typecheck`
- Focused affected Vitest copy/API suite from the P0-10 implementation turn.
- `npm run docs:freshness`
- `rg -n -i "corridor|attestation|trust anchor|match-visible|intro-eligible|proof pack" src/i18n --glob '*.json'`

Open risks / TODO:

- Playwright visual specs could not start the local dev server in the sandbox because binding to `0.0.0.0` returned `EPERM`; rerun visual e2e in a local shell that can bind the configured port.
