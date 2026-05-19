> Doc Class: `active`
> Last Verified: `2026-05-19`

# Analytics Privacy Setup

This guide covers privacy-safe analytics setup for the locked MVP corridor. It is an operator guide, not proof of GDPR compliance by itself and not a reason to revive broad analytics dashboards.

Current launch posture:

- Broad public analytics collection endpoints are archived compatibility surfaces:
  - `/api/analytics/events`
  - `/api/analytics/track`
  - `/api/analytics/tour-event`
  - `/api/analytics/web-vitals`
- Admin analytics and fairness dashboards are archived outside the locked MVP corridor.
- Retained analytics helpers are used for narrow product, lifecycle, performance, privacy, audit, and launch-ops signals inside active workflows.
- `PII_HASH_SALT` is required anywhere `src/lib/analytics.ts` hashes request IP and user-agent values.

Use this with:

- [docs/API_REFERENCE.md](./docs/API_REFERENCE.md)
- [docs/ENV_VARIABLES.md](./docs/ENV_VARIABLES.md)
- [docs/DEPLOYMENT_CHECKLIST.md](./docs/DEPLOYMENT_CHECKLIST.md)
- [docs/structured-logging.md](./docs/structured-logging.md)
- [docs/verification-policy-mvp.md](./docs/verification-policy-mvp.md)

## Privacy Contract

Analytics must support launch decisions without widening the product into a generic dashboard, public directory, marketplace, or social-score system.

Allowed launch analytics:

- onboarding and readiness milestones
- Proof Pack and proof workflow events
- assignment, review, shortlist, intro, reveal consent, interview, decision, and engagement-verification lifecycle events
- privacy settings, export, delete, and audit interactions
- route smoke, launch status, performance, and internal ops health signals
- privacy-safe aggregate counts needed for launch operations

Not allowed in analytics payloads:

- raw IP addresses
- raw user-agent strings
- emails, names, phone numbers, or precise addresses
- private proof content, raw evidence, uploaded file contents, storage paths, signed URLs, or filenames
- hidden candidate identity details before reveal consent
- verifier private data, allegation text, admin notes, internal queue IDs, or diagnostic dumps
- broad match-score, ranking, fairness-note, or public-directory claims that imply non-MVP behavior

`src/lib/analytics.ts` sanitizes common file/path properties before persistence. That is a backstop, not permission to send sensitive data.

## Environment Variables

Set `PII_HASH_SALT` for any target that persists analytics events through `src/lib/analytics.ts`.

```env
PII_HASH_SALT=<64-character-hex-secret>
```

Generate a target-specific value:

```bash
openssl rand -hex 32
```

Store it only in the target secret manager or local `.env.local`. Do not commit it, paste it into docs, include it in screenshots, or print it in terminal output.

Use separate salts for local, preview, and production unless an explicit privacy review approves another choice. Rotating the salt breaks cross-rotation hash continuity, so record the rotation time in the launch or incident artifact when rotation is needed.

## Database And Migration Rules

Do not edit migration SQL with a live secret. Do not paste salts into SQL files. Do not use `db:push` for production or production-candidate launch work.

For launch targets, follow the current migration runbooks:

```bash
npm run db:drift-check
npm run db:migration-audit
npm run db:migrate
npm run db:restore:verify -- --checkpoint <checkpoint-dir>
```

Before applying analytics-related migrations to a production-candidate or production target:

1. Confirm the exact target and operator approval.
2. Capture a fresh backup/checkpoint.
3. Confirm the migration ledger and drift status.
4. Apply repo-owned migrations only.
5. Run the isolated restore rehearsal required by launch gates.
6. Save evidence without secrets or private analytics rows.

## Route-Surface Alignment

Do not use archived analytics endpoints as launch evidence. Current API reference classifies broad `/api/analytics/*` endpoints as archived compatibility.

If an active workflow emits analytics internally, verify the workflow behavior itself and confirm the emitted payload is minimal and privacy-safe. The existence of an analytics event does not make a route, dashboard, feature, or metric part of the MVP.

## Verification

Run focused checks before relying on analytics behavior:

```bash
npm run test -- tests/api/archived-api-handlers-route.test.ts
npm run test -- tests/api/launch-surface-inventory.test.ts
npm run test -- tests/api/user-privacy-settings-route.test.ts
npm run test -- tests/lib/api-latency-log.test.ts
npm run docs:freshness
```

For production-candidate launch evidence:

- confirm `PII_HASH_SALT` exists without printing its value
- confirm archived `/api/analytics/*` routes return archived behavior
- sample active workflow analytics payloads for no private proof content, hidden identity details, secrets, signed URLs, filenames, raw IP, raw user-agent, or internal queue IDs
- confirm privacy/export/delete events are tied to app state and audit behavior, not email-only or manual-only claims
- record any skipped verification with the exact reason

## Troubleshooting

### `PII_HASH_SALT` Missing

`src/lib/utils/privacy.ts` throws when hashing receives a non-empty value without `PII_HASH_SALT`. Add the secret to the selected target and redeploy or restart that target.

### Analytics Route Appears Gone

That is expected for the broad analytics collection endpoints. Check [docs/API_REFERENCE.md](./docs/API_REFERENCE.md) and route-surface policy before treating an archived route as a regression.

### Payload Contains Sensitive Data

Treat this as a privacy bug:

1. Stop relying on that event as launch evidence.
2. Remove sensitive fields at the caller.
3. Add or extend a focused test for the workflow.
4. Redact or delete unsafe captured evidence according to the incident or privacy runbook.

### Hashes Differ Between Targets

Different salts produce different hashes. That is expected when targets use separate secrets. Do not copy production salts into local or preview environments just to compare hashes.

## Launch Evidence To Save

Save analytics launch evidence in the current launch/sweep artifact, not in this setup guide:

- target URL or environment name
- confirmation that `PII_HASH_SALT` exists, without value
- focused test results
- archived route checks for broad analytics endpoints
- sampled active workflow payload review, redacted if needed
- migration/backup/restore evidence if analytics schema changed
- remaining unverified analytics surfaces or privacy risks
