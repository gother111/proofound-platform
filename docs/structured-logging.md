> Doc Class: `active`
> Last Verified: `2026-05-19`

# Structured Logging Guide

Structured logging supports launch operations, privacy-safe incident response, and debugging. It must stay subordinate to the locked MVP corridor and the current privacy/no-leak contract.

Use this with:

- [alert-configuration.md](./alert-configuration.md)
- [sentry-setup.md](./sentry-setup.md)
- [ANALYTICS_GDPR_SETUP.md](../ANALYTICS_GDPR_SETUP.md)
- [SECURITY_INCIDENT_RESPONSE_RUNBOOK.md](./SECURITY_INCIDENT_RESPONSE_RUNBOOK.md)

## Launch Contract

Logs may help answer:

- which active route or workflow failed
- which primary object was involved, such as assignment, Proof Pack, reveal request, interview, decision, engagement verification, or queue item
- whether fallback/safe mode is working
- whether launch-status, perf-status, cron, or external provider checks are stale or failing

Logs must not become a second product database, broad analytics dashboard, public directory, or hidden matching/ranking system.

## Allowed Log Fields

Prefer:

- stable internal ids when needed for debugging
- route, method, status, duration, and release
- request id or correlation id
- coarse persona or role where already authorized
- workflow state and reason code
- queue type, not private queue content
- counts and thresholds
- sanitized error class and message

Avoid logging direct user identifiers unless they are necessary for incident response. When an actor id is needed, use the internal id and keep it out of public screenshots and support replies.

## Prohibited Log Content

Never log:

- passwords, session cookies, auth headers, API keys, tokens, or signed URLs
- raw request or response bodies
- email addresses, names, phone numbers, precise addresses, or raw IP/user-agent strings
- private proof content, raw evidence, uploaded file contents, filenames, or private storage paths
- hidden identity details before reveal consent
- verifier private data, allegation text, admin notes, or internal queue item payloads
- raw AI prompts, raw model responses, provider keys, or private document text
- broad match-score/ranking/fairness payloads that imply archived or post-MVP behavior

Use `src/lib/privacy/log-redaction.ts` or route-specific redaction before writing errors from user-controlled input.

## Event Naming

Use dot-separated event names:

```text
<domain>.<object>.<state>
```

Good examples:

- `portfolio.public.render_failed`
- `assignment.publish.blocked`
- `proof_pack.verification.state_changed`
- `reveal.consent.blocked`
- `decision.recorded`
- `engagement_verification.confirmation_failed`
- `launch_status.monitor_missing`
- `perf_status.assignment_latency_missing`

Avoid generic names such as `dashboard.loaded`, `match.computed`, or `user.updated` when the workflow and object can be clearer.

## Error Logging Pattern

```typescript
log.error('assignment.publish.failed', {
  assignmentId,
  orgId,
  reasonCode,
  status,
  durationMs,
  error: error instanceof Error ? error.message : 'Unknown error',
});
```

Do not include the request body, participant private content, proof text, file paths, or hidden identity details.

## Safe Debugging Pattern

```typescript
log.warn('reveal.consent.blocked', {
  conversationId,
  assignmentId,
  reasonCode: 'candidate_consent_missing',
});
```

The app surface should show the user-facing explanation. The log should preserve only enough context for an operator to find the gated object.

## Log Levels

- `debug`: local development only, never required for launch evidence
- `info`: successful state changes and launch monitor summaries
- `warn`: blocked workflow, fallback, stale evidence, missing monitor, degraded dependency
- `error`: failed active MVP route or unsafe state

Production default should remain `LOG_LEVEL=info`. Increase verbosity only for a target and time window that is explicitly approved.

## Migration From Console Calls

When replacing `console.*`:

1. Use a specific event name.
2. Move only safe context into metadata.
3. Redact before logging user-controlled or provider-controlled values.
4. Keep stack traces only in protected server logs/Sentry, not public responses.
5. Add a focused test when the log guards privacy-sensitive behavior.

Do not migrate a risky console call by preserving the same raw payload under a structured logger.

## Monitoring Integration

For launch, use:

- Vercel runtime logs
- Sentry or equivalent protected error monitoring
- protected `/api/monitoring/launch-status`
- protected `/api/monitoring/perf-status`

External log aggregation such as Datadog, CloudWatch, or Mezmo is post-launch unless a target, retention policy, access policy, and redaction review are explicitly approved.

## Querying Logs

Local development examples:

```bash
npm run dev
```

Filter locally only when needed, and avoid saving raw log exports that may include private data.

Production log review must happen in protected provider consoles. Do not download broad production logs to local files unless the incident owner approves the target, time range, and redaction plan.

## Verification

Run:

```bash
npm run test -- tests/lib/api-errors.test.ts
npm run test -- tests/lib/api-latency-log.test.ts
npm run test -- tests/scripts/launch-gate-config.test.ts
npm run docs:freshness
```

Manual review for launch:

- public errors return generic responses
- protected logs preserve enough route/workflow context for debugging
- no sampled log includes private proof content, hidden identity details, secrets, signed URLs, filenames, raw prompt/model text, or raw request bodies
- launch-status/perf-status evidence is checked directly, not inferred from log presence

## Incident Evidence

When logs support an incident or launch gate, save only:

- target and time window
- route/workflow
- redacted event name and reason code
- operator conclusion
- link to protected provider evidence when available

Do not paste full log payloads into public docs, support replies, screenshots, or tickets.
