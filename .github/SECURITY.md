# Security Policy

> Last Verified: `2026-05-19`

Proofound welcomes responsible security reports for the public web app, active API routes, authentication, privacy/no-leak behavior, file upload handling, public portfolio/public organization trust surfaces, organization review flows, reveal/consent, export/delete, and admin/internal route protection.

## Reporting A Vulnerability

Email: `security@proofound.io`

Include:

- a short description of the issue
- affected URL, route, or workflow
- steps to reproduce with test accounts or your own data
- expected impact
- screenshots or logs only if they do not include private proof content, hidden identity details, secrets, tokens, cookies, signed URLs, or private user data
- your contact information for follow-up

Do not send passwords, API keys, session cookies, government ID documents, private proof files, raw exports, or other sensitive material by email.

## Response Expectations

- We aim to acknowledge reports within 24 hours.
- We triage impact against active launch surfaces and privacy/no-leak risk.
- Critical privacy, auth, token, public projection, upload, or admin/internal exposure issues receive priority handling.
- We coordinate disclosure timing after the issue is understood and a fix path is in place.

Timelines can vary based on severity, reproducibility, and whether a provider or infrastructure owner is involved.

## In Scope

- `https://proofound.io`
- active MVP and launch-ops API routes
- signup, login, verification, password reset, invite, and token redemption flows
- public portfolio and public organization trust pages
- assignment/review, reveal consent, interview, decision, and engagement-verification workflows
- export/delete and privacy settings
- file upload/import and private proof storage behavior
- admin/internal route authorization and no-leak behavior

## Out Of Scope

- social engineering
- denial-of-service testing without prior approval
- physical attacks
- attacks requiring access to a device/account you do not own
- broad scraping or enumeration without a specific vulnerability
- previously reported issues already under remediation
- theoretical findings without a reproducible path
- archived/post-MVP surfaces unless they expose active data, active routes, or launch behavior

## Safe Harbor

We support good-faith research when you:

- avoid privacy violations and service disruption
- use only accounts and data you own or have explicit permission to test
- access only the minimum data needed to demonstrate the issue
- stop testing and report promptly if you encounter private data
- give us reasonable time to investigate before public disclosure

## Recognition

We do not currently operate a paid bug bounty program. We may acknowledge valid reports with permission from the reporter.

## Security Posture

Proofound’s active launch posture emphasizes:

- privacy-first public projection
- blind-by-default review and consent before reveal
- scoped verification rather than broad identity claims
- private proof/document storage
- route-surface policy for archived and internal surfaces
- structured logging and Sentry redaction boundaries
- repo-owned launch checks, smoke evidence, and go/no-go gates

Security and compliance claims should be based on current evidence and applicable legal/privacy review, not on this policy alone.
