> Doc Class: `active`
> Last Verified: `2026-05-19`

# Sentry Launch Setup

This guide covers Sentry as launch-support observability for Proofound. It is scoped to runtime errors, release tracking, and privacy-safe investigation. It is not a substitute for route-surface policy, launch-status, perf-status, backup/restore, smoke, or go/no-go evidence.

Use this with:

- [alert-configuration.md](./alert-configuration.md)
- [structured-logging.md](./structured-logging.md)
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- [SECURITY_INCIDENT_RESPONSE_RUNBOOK.md](./SECURITY_INCIDENT_RESPONSE_RUNBOOK.md)

## Current Config Files

- `instrumentation-client.ts`: client-side Sentry init and browser tracing
- `sentry.server.config.ts`: server-side Sentry init and HTTP integration
- `sentry.edge.config.ts`: edge-runtime Sentry init
- `instrumentation.ts`: Next.js instrumentation registration

All configs drop events in development unless debug mode is explicitly enabled. Server and edge configs strip user context down to `user.id` and remove request cookies, headers, and body data before sending. Client config uses the same request/user scrub and keeps session replay opt-in by default.

## Required Variables

Set only for targets where Sentry should receive events:

```env
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
```

Optional debug and replay controls:

```env
SENTRY_DEBUG=false
NEXT_PUBLIC_SENTRY_DEBUG=
NEXT_PUBLIC_SENTRY_REPLAY_SESSION_SAMPLE_RATE=0
NEXT_PUBLIC_SENTRY_REPLAY_ON_ERROR_SAMPLE_RATE=0
SENTRY_WIDEN_CLIENT_FILE_UPLOAD=0
```

Launch default is no ambient session replay. If replay is temporarily enabled for a controlled investigation, keep `maskAllText` and `blockAllMedia` enabled, record the target and reason in the launch or incident artifact, and disable replay again when the investigation is complete.

Do not expose `SENTRY_AUTH_TOKEN` or DSN-adjacent project secrets in docs, screenshots, tickets, or alert messages.

## Privacy Rules

Sentry events must not include:

- private proof content or raw evidence
- hidden identity details before reveal consent
- passwords, tokens, cookies, auth headers, API keys, or signed URLs
- uploaded file contents, private storage paths, filenames, or diagnostic dumps
- verifier private data, allegation text, internal queue IDs, or admin notes
- broad matching/ranking/fairness payloads that imply archived or post-MVP behavior

Only include route, release, request id where safe, coarse workflow state, and stable internal ids needed for debugging.

## Launch Alert Scope

Create alerts for active MVP and launch-ops risk:

- new production error issue
- error spike on signup/login, public portfolio, assignment/review, reveal, interview, decision, engagement verification, export, or delete flows
- frontend error on logged-out public surfaces
- recurring error after a resolved release
- Sentry release/source-map upload failure when source maps are expected

Do not make broad analytics routes, old Expertise Atlas UI, LinkedIn verification, public directory behavior, fairness dashboards, or native meeting-provider success launch-critical by default.

## Source Maps

Source maps may be uploaded during production builds when:

- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

are set for the build target.

Keep widened client file uploads disabled by default. Enable `SENTRY_WIDEN_CLIENT_FILE_UPLOAD=1` only when the target and reason are explicit and slower deploys are acceptable.

## Verification

Before launch, verify:

```bash
npm run test -- tests/scripts/launch-gate-config.test.ts
npm run docs:freshness
npm run lint
npm run typecheck
```

Target-specific evidence:

1. Confirm Sentry env vars exist where expected without printing values.
2. Confirm release-tagged events reach Sentry for the intended target.
3. Confirm a sample event does not include cookies, headers, request body, private proof content, hidden identity details, signed URLs, or filenames.
4. Confirm alert routing matches [alert-configuration.md](./alert-configuration.md).
5. Confirm Sentry state is referenced as support evidence only, not as final go/no-go proof.

Use provider-side test events or controlled preview-target errors where possible. Do not introduce a production route or destructive action just to test Sentry.

## Incident Use

When Sentry reports a launch issue:

1. Identify the route, workflow, release, and primary object.
2. Check whether privacy, reveal, export/delete, public projection, or admin/internal exposure is involved.
3. Preserve evidence without copying private payloads.
4. Follow the relevant incident or launch-ops runbook.
5. If a Sentry event contains sensitive data, treat it as a privacy bug and remove the field at the caller or integration boundary.
