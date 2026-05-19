> Doc Class: `active`
> Last Verified: `2026-05-19`

# Security Incident Response Runbook

This runbook covers launch-safe response for security, privacy, and no-leak incidents in the locked MVP corridor. It is operational guidance, not legal advice or proof of compliance by itself.

Use this with:

- [alert-configuration.md](./alert-configuration.md)
- [sentry-setup.md](./sentry-setup.md)
- [structured-logging.md](./structured-logging.md)
- [RESEND_SETUP.md](./RESEND_SETUP.md)
- [internal-ops/reveal-privacy-dispute-sop.md](./internal-ops/reveal-privacy-dispute-sop.md)
- [internal-ops/redaction-risky-upload-sop.md](./internal-ops/redaction-risky-upload-sop.md)

## Severity

- `P1`: confirmed or likely private data exposure, reveal without consent, public proof leak, export/delete safety failure, auth bypass, admin/internal route exposure, service-role or secret exposure, production app unavailable
- `P2`: suspected privacy leak without confirmed exposure, verification/reveal dispute stuck, risky upload visible where it should not be, security alert on an active MVP workflow, protected monitor failure
- `P3`: suspicious activity, noisy alerts, stale evidence, policy/documentation drift without active exposure

GDPR breach assessment and any external notification decision must be made by the designated legal/privacy owner. Start the evidence clock immediately when personal data exposure is suspected, but do not promise a regulatory conclusion before assessment.

## First 15 Minutes

1. Acknowledge the incident in the approved operator channel.
2. Assign an incident owner.
3. Identify the affected route, workflow, primary object, and target environment.
4. Preserve evidence without copying private payloads into chat, docs, screenshots, or tickets.
5. Decide whether to enter safe mode:
   - pause new intros
   - block reveal actions
   - hide unsafe public projection
   - disable affected upload/import path
   - revoke exposed token or signed URL
   - rotate exposed credential

Do not run destructive production, database, auth, permission, billing, or infrastructure actions without an explicit target and owner approval unless immediate containment requires credential revocation.

## Evidence Rules

Preserve:

- timestamp and target
- route or workflow
- release/deployment id
- request id or correlation id when available
- affected object id where safe
- redacted alert/log excerpt
- owner and decision timeline

Do not preserve in shared docs/tickets:

- passwords, session cookies, auth headers, API keys, provider tokens, service-role keys
- private proof content, raw evidence, uploaded file contents, private storage paths, signed URLs, filenames
- hidden candidate identity details before consent
- verifier private data, allegation text, admin notes, internal queue payloads
- raw request/response bodies, raw AI prompts, raw model responses, diagnostic dumps

If unsafe evidence was already pasted somewhere, treat that as a secondary privacy incident and remove/redact it.

## Incident Classes

### Public Projection Or Portfolio Leak

Examples:

- hidden portfolio content visible publicly
- private Proof Pack evidence visible on public portfolio
- public export includes private-only fields
- public organization trust page exposes internal review details

Containment:

- unpublish or hide affected public projection
- block affected public route if needed
- preserve route and object ids only
- verify no cached public response remains visible

Verification:

- public portfolio render
- public summary/export routes
- privacy/effective-visibility tests
- Browser check for the affected public route when safe

### Reveal Or Identity Leak

Examples:

- candidate identity exposed before consent
- contact details visible in blind review
- reveal request approved without candidate consent

Containment:

- pause reveal and intro actions for affected assignment/conversation
- hide identity-bearing fields in review surfaces
- move issue to privacy/reveal dispute queue

Verification:

- reveal route tests
- org review/candidate proof card checks
- internal queue state
- manual Browser check only with safe test data

### Upload, Import, Or Proof Content Leak

Examples:

- private upload returns public URL
- quarantine file visible publicly
- uploaded artifact text logged or sent to external service without approved path

Containment:

- revoke signed URLs
- disable affected upload/import path
- move item to manual review or redaction queue
- delete unsafe cached/text-derived projection if required by policy

Verification:

- upload privacy tests
- storage policy tests
- redaction/risky upload SOP
- affected route/API behavior

### Auth, Token, Or Session Incident

Examples:

- token replay succeeds where it should fail
- password reset, invite, verification, or reveal token crosses actors
- session cookie/header appears in logs or Sentry

Containment:

- revoke exposed token or capability
- rotate affected secret when required
- pause affected token redemption route if the blast radius is unclear
- preserve only hashed/redacted token references

Verification:

- capability-token and workflow idempotency tests
- affected route tests
- Sentry/logging redaction checks

### Admin/Internal Exposure

Examples:

- internal queue exposed publicly
- launch-status/perf-status returns private diagnostics to public users
- admin audit or diagnostics route lacks required auth

Containment:

- block the route or require auth immediately
- reduce returned payload to minimal safe shape
- audit access logs for the affected time window

Verification:

- route-surface inventory tests
- authz policy tests
- internal monitoring route tests

## Assessment

Answer with evidence:

- What route/workflow was affected?
- What object and data class were involved?
- Was private data actually exposed or only at risk?
- Which users/orgs could access it?
- Did the issue affect public, authenticated owner, organization, or admin/internal surfaces?
- What was the earliest known exposure time?
- What containment action was taken?
- What tests or manual checks prove containment?

Classify data conservatively. When uncertain, treat as potentially exposed until disproven.

## Notification

External notification decisions depend on legal/privacy assessment. Prepare materials in plain language, but do not send breach notices until approved.

Notification drafts must avoid:

- secrets or internal vulnerability detail that increases risk
- private proof content or hidden identity details
- speculative cause or blame
- promises that cannot be verified

If user notification is required, use transactional email via approved sender configuration and save evidence of what was sent without exposing recipient lists broadly.

## Remediation

Remediation should include:

- code/configuration fix
- tests that reproduce and prevent recurrence
- route-surface classification check if applicable
- privacy/no-leak review
- docs/runbook update when behavior changes
- launch artifact update with residual risk

Credential or secret rotation must be target-specific and recorded without values.

## Post-Incident Review

Within one week for P1/P2:

- timeline
- root cause
- data involved
- containment and verification evidence
- user/regulatory notification decision
- tests added
- docs/runbooks updated
- remaining risks
- owner and due date for follow-ups

Store incident records under the approved internal location. Do not create public repo incident files with private evidence unless explicitly approved and redacted.

## Quick Reference

1. Acknowledge and assign owner.
2. Preserve redacted evidence.
3. Contain the unsafe route, token, projection, upload, reveal, or credential.
4. Assess data exposure.
5. Verify containment with tests and safe manual checks.
6. Coordinate legal/privacy notification if needed.
7. Patch, test, document, and record residual risk.
