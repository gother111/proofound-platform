> Doc Class: `active`
> Last Verified: `2026-05-19`

# Resend Transactional Email Setup

This guide covers Proofound's Resend setup for launch-safe transactional email. It does not prove that a specific production, preview, or local target is configured. Confirm the target environment before treating email as ready.

Use this with:

- [ENV_VARIABLES.md](./ENV_VARIABLES.md)
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- [CRON_SETUP.md](./CRON_SETUP.md)
- [API_REFERENCE.md](./API_REFERENCE.md)

## Launch Posture

Resend is the configured provider for transactional email. The current code reads:

- `RESEND_API_KEY` as the required provider secret
- `EMAIL_FROM` as the sender override
- `EMAIL_REPLY_TO` as the reply-to override
- `PROOFOUND_SKIP_TRANSACTIONAL_EMAIL_DELIVERY` as a test/local skip switch when explicitly enabled

`src/lib/email/config.ts` normalizes sender addresses to the approved Proofound sender domain and falls back to `Proofound <no-reply@proofound.io>`. Keep sender and reply-to addresses on approved Proofound-controlled domains.

Do not record or publish `RESEND_API_KEY` values in docs, screenshots, logs, tickets, or support messages.

## Active Email Families

Treat these as transactional workflow email, not marketing or digest traffic:

- Auth email verification and password reset
- Work-email verification
- Organization/team invitation where active
- Candidate/assignment invitation where active
- Verification request, approval, rejection, and feedback messages where active
- Reveal, interview, decision, and engagement-verification workflow messages where active
- Account deletion lifecycle messages where active in the product flow
- Internal launch-ops failure visibility through protected monitoring, not public email diagnostics

Emails must support the locked MVP corridor: proof first, privacy staged, explicit consent before reveal, manual-link interviews by default, clear decisions, and no public directory behavior.

## Privacy Guardrails

Transactional emails may identify the action the user needs to take, but they must not include private proof content, raw evidence text, hidden candidate identity details, internal queue IDs, private storage paths, signed URLs, service-role data, secrets, diagnostic payloads, or broad profile/match-score claims.

Email links should route through existing app surfaces that enforce auth, role, consent, archive, and readiness gates. Public email links may only target intentionally public surfaces such as published portfolios, public organization trust pages, or public assignment/share pages that are active under route-surface policy.

For reveal, verification, export, delete, assignment, and admin/internal paths, the email copy should explain the next action in plain language and let the app surface show the detailed state.

## Provider Setup

1. Create or confirm a Resend account for the intended Proofound sending domain.
2. Add the sending domain in Resend.
3. Add the DNS records Resend provides for SPF and DKIM.
4. Add a DMARC record for the domain before production launch.
5. Wait for DNS propagation and confirm the domain is verified in Resend.
6. Create a sending-access API key for the intended target.
7. Store the key only in the target environment's secret manager.

Use a separate key per production, preview, and local/operator target where feasible so credentials can be rotated without broad blast radius.

## Environment Variables

Production and preview targets must set:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM="Proofound <no-reply@proofound.io>"
EMAIL_REPLY_TO="Proofound <hello@proofound.io>"
```

Local development may omit `RESEND_API_KEY`; in development, missing provider configuration returns a mock success from `src/lib/email/sender.ts`. Do not treat that mock path as production delivery evidence.

Use `PROOFOUND_SKIP_TRANSACTIONAL_EMAIL_DELIVERY=true` only for explicit test or dry-run targets. It intentionally skips provider delivery and therefore cannot count as a successful email launch check.

## Route And Cron Alignment

The active launch cron email route is:

- `/api/cron/decision-reminders`

Archived standalone deletion cron routes are not active launch infrastructure:

- `/api/cron/send-deletion-reminders`
- `/api/cron/process-deletions`

Follow [CRON_SETUP.md](./CRON_SETUP.md) and [API_REFERENCE.md](./API_REFERENCE.md) for the current route-surface classification. Do not create cron-job.org jobs or Vercel cron entries from older historical docs.

## Verification

Run static checks before any live send:

```bash
npm run lint
npm run typecheck
npm run docs:freshness
npm run test -- tests/lib/workflow-email-privacy.test.ts
npm run test -- src/app/api/cron/decision-reminders/__tests__/route.test.ts
```

For target-specific launch evidence:

1. Confirm `RESEND_API_KEY`, `EMAIL_FROM`, and `EMAIL_REPLY_TO` are present for the intended target without printing their values.
2. Confirm the Resend domain is verified in the provider dashboard.
3. Trigger one low-risk transactional flow on the intended target, such as a controlled password reset or work-email verification.
4. Confirm the message arrives, the link opens the correct gated app surface, and the Resend dashboard shows successful delivery.
5. Confirm the email body contains no private proof content, hidden identity details, secrets, signed URLs, queue IDs, or diagnostic payloads.
6. Confirm `/api/cron/decision-reminders` is protected by cron auth and sends only the expected decision-reminder workflow when eligible records exist.

Do not run live email sends from this guide without an explicit target, recipient, and operator approval.

## Troubleshooting

If emails do not send:

- Confirm `RESEND_API_KEY` exists in the target environment without printing the value.
- Confirm the deployed target was restarted or redeployed after secret changes.
- Confirm the Resend domain is verified and DNS has propagated.
- Check protected application logs for provider errors without exposing secret values.
- Check Resend logs for invalid key, unverified domain, rate-limit, bounce, or complaint errors.
- Confirm `PROOFOUND_SKIP_TRANSACTIONAL_EMAIL_DELIVERY` is not enabled on a target where live delivery is expected.

If emails arrive but links fail:

- Confirm `NEXT_PUBLIC_SITE_URL` and canonical URL helpers point to the intended target.
- Confirm return paths are sanitized and do not leak internal URLs.
- Confirm archived, gated, and role-protected routes return the expected 404/410/redirect/auth behavior.

If emails reveal too much:

- Treat it as a privacy bug.
- Remove private proof content, hidden identity details, queue IDs, private storage links, signed URLs, and diagnostic payloads from the template.
- Keep detailed state inside the authenticated app surface instead of the email.

## Launch Evidence To Save

Record launch evidence in the current sweep or launch artifact, not in this setup guide:

- Target name and URL
- Confirmation that required email variables exist, without values
- Resend domain verification status
- Static check command results
- One representative delivery result per active launch workflow family where feasible
- Privacy/no-leak notes for sampled email bodies
- Any skipped or unverified workflow with the reason

Keep screenshots redacted if they show recipient addresses, message IDs, private names, proof content, or provider metadata.
