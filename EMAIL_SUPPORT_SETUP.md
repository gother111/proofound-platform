> Doc Class: `active`
> Last Verified: `2026-05-19`

# Email Support Setup

This guide covers human support operations for `hello@proofound.io`. It is not the transactional-email provider setup; use [docs/RESEND_SETUP.md](./docs/RESEND_SETUP.md) for Resend.

Support should reinforce the locked MVP corridor: proof-first portfolios, Proof Packs, privacy-safe assignment review, consent before reveal, manual-link interviews by default, clear decisions, engagement verification, and self-service privacy rights.

## Mailbox Setup

Use a shared mailbox or helpdesk that can send and receive from `hello@proofound.io`.

Minimum setup:

- mailbox access is limited to approved operators
- MFA is enabled for every operator
- SPF, DKIM, and DMARC are configured for the sending domain
- support replies do not expose secrets, raw logs, service-role output, private proof files, signed URLs, hidden identity details, internal queue IDs, or diagnostic payloads
- support records store only what is needed to resolve the issue

Do not publish personal operator addresses in public support docs.

## Auto-Reply

Use an always-on auto-reply only if the mailbox provider supports it without leaking ticket metadata.

Subject:

```text
We received your message
```

Body:

```text
Hi,

Thanks for contacting Proofound. We received your message and will reply within one business day.

If this is a security, privacy, data-loss, or account-access issue, reply with URGENT in the subject line and include the affected account email. Do not send passwords, API keys, private proof files, or government ID documents by email.

For account deletion or data export, use the in-app privacy controls when you can. If you cannot access your account, tell us the account email and the action you need.

Proofound Support
```

Do not mention an in-app chat or help center unless those routes are active and tested.

## Intake Triage

Classify each message by the user's current workflow:

- account access: login, signup, email verification, password reset
- individual app: onboarding, first proof, Proof Packs, proof upload/import/linking, publishing, privacy settings, export, delete
- organization app: onboarding, trust page, assignments, review, shortlist, intro, reveal consent, interviews, decisions, engagement verification
- public surface: portfolio, organization trust page, public assignment/share route, footer/legal link, CTA routing
- admin/internal: verification queue, privacy/reveal dispute, launch-status, monitoring, cron or ops issue
- security/privacy: suspected leak, unauthorized access, data request, deletion/export problem

Escalate security/privacy issues immediately. Keep the first reply calm and factual; avoid promising deletion, restoration, reveal, verification, or hiring outcomes until the app state is confirmed.

## Response Principles

- Plain language first.
- Give one obvious next action.
- Keep privacy stage, trust state, proof state, and readiness state accurate.
- Ask for the minimum needed information.
- Do not request passwords, secrets, raw private evidence, or ID documents by email.
- Do not paste internal logs or provider payloads into replies.
- Do not describe broad marketplace, directory, social-score, or generic dashboard behavior.
- Send users back to the app surface that enforces the relevant auth, role, consent, archive, and privacy gates.

## Common Templates

### Verification Email Not Received

```text
Hi [Name],

Please check spam or junk first. Then request a fresh email from the same sign-in or verification screen.

If it still does not arrive, reply with the email address you used to sign up. We will check delivery status without exposing any account secrets.

Proofound Support
```

### Password Reset

```text
Hi [Name],

Open https://proofound.io/login and choose Forgot password. Enter the email address for your Proofound account and use the reset link from your inbox.

If you cannot receive the email, reply with the account email and the time you tried. We can investigate delivery, but we will not ask for your password.

Proofound Support
```

### First Proof Or Proof Pack Help

```text
Hi [Name],

The fastest path is to create one focused Proof Pack around a real capability claim.

Add 1 to 3 pieces of evidence, explain the context, and connect the proof to the outcome it supports. Portfolio-ready means the proof is clear enough to share. Intro-eligible is stricter and depends on readiness, privacy stage, and workflow fit.

If you are stuck, tell us which step is unclear and what page you are on.

Proofound Support
```

### Assignment Or Candidate Review Help

```text
Hi [Name],

Please open the assignment or review queue in your organization workspace. The next action should be on that page: review proofs, request an intro, request reveal consent, schedule or reschedule an interview, record a decision, or request engagement verification.

If the next action is missing or disabled, send the assignment name and the action you expected. Do not email candidate private proof files or hidden identity details.

Proofound Support
```

### Export Request

```text
Hi [Name],

If you can access your account, use Settings -> Privacy -> Data Rights to request an export. The app will handle the export through the current privacy workflow.

If you cannot access your account, reply with the account email and a short description of the access problem. We will verify ownership before taking any action.

Proofound Support
```

### Delete Request

```text
Hi [Name],

If you can access your account, use Settings -> Account -> Delete Account. Public projections are removed immediately and residual retention follows the current deletion policy.

If you cannot access your account, reply with the account email and the access problem. We will verify ownership before taking any action.

Proofound Support
```

Do not process deletion from a bare email reply. Use the app workflow whenever possible and escalate inaccessible-account cases for ownership verification.

### Bug Report

```text
Hi [Name],

Thanks for reporting this. Please send:

- the page or workflow
- what you expected
- what happened instead
- browser/device if relevant
- a screenshot only if it does not reveal private proof content, hidden identity details, secrets, or internal data

We will investigate and reply with the next step.

Proofound Support
```

### Security Or Privacy Concern

```text
Hi [Name],

Thanks for flagging this. We are treating it as urgent.

Please send the affected account email, the page or workflow, and a short description of what you saw. Do not send passwords, API keys, private proof files, government ID documents, or raw exports by email.

We will review the issue and follow the security/privacy response process.

Proofound Support
```

## Escalation

Escalate immediately when a message mentions:

- unauthorized access
- private proof or identity leak
- reveal without consent
- export/download sent to the wrong person
- deletion not taking effect
- admin/internal route exposed publicly
- service outage or data loss
- suspicious email, phishing, or credential exposure

Save the escalation context in the support tracker or incident record. Redact secrets and private proof content before sharing internally.

## Evidence To Keep

For each support issue, keep:

- date and time
- requester email
- affected surface or route
- workflow stage
- plain-language issue summary
- support response
- escalation owner if any
- final outcome

Do not keep unnecessary private proof files, hidden identity details, access tokens, signed URLs, or full diagnostic dumps in support records.
