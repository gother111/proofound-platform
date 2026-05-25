# Logging Migration Guide

> Doc Class: `active`
> Last Verified: `2026-05-19`

Proofound uses structured logging for launch-relevant application code. This
guide is for replacing ad hoc `console.*` calls when touching active MVP,
internal launch-ops, API, and shared library surfaces.

Do not use this guide to revive archived Expertise Atlas, Zen/wellbeing, broad
admin dashboard, dashboard-customization, native Zoom/video, marketplace, or
other post-MVP code paths. Archived code can keep historical console usage unless
that archive is intentionally restored to active launch scope.

## Current Scope

Prioritize active surfaces:

- Public/auth surfaces: landing, signup, login, legal, public portfolio and org
  trust routes.
- Individual app: onboarding, Proof Packs, proof upload/import/linking,
  verification requests, portfolio publishing, privacy, export, and delete.
- Organization app: onboarding, trust profile, assignments, review queue,
  shortlist/matching, intro/reveal consent, interviews, decisions, and
  engagement verification.
- Internal launch ops: `/admin`, `/admin/verification`, `/admin/audit`, internal
  ops queues, audit logging, launch-status, smoke, and monitor routes.
- Shared active libraries under `src/lib/**` when they are imported by the
  active MVP corridor.

## Logger Usage

Create a namespaced logger for the module:

```typescript
import { createLogger } from '@/lib/logger';

const logger = createLogger('AssignmentsPublishRoute');
```

Use structured context instead of interpolated strings:

```typescript
logger.info('Assignment published', {
  assignmentId,
  organizationId,
});
```

Log errors with the error object plus minimum-necessary metadata:

```typescript
try {
  await publishAssignment(assignmentId);
} catch (error) {
  logger.error('Assignment publish failed', error, {
    assignmentId,
    organizationId,
  });
}
```

## Level Guidance

- `debug`: local troubleshooting details that should not be needed in normal
  operations.
- `info`: important successful milestones, such as launch smoke completion,
  proof import completion, or assignment publication.
- `warn`: recoverable problems, slow paths, degraded fallback behavior, or
  missing optional context.
- `error`: failed user actions, failed route operations, failed internal jobs, or
  unexpected exceptions.

## Privacy Rules

Never log raw private proof content, extracted text, original filenames, storage
paths, signed URLs, verifier private text, reveal-sensitive identity details,
private profile context, tokens, passwords, service role credentials, API keys,
or full request/response bodies.

Use stable identifiers and derived facts:

```typescript
logger.warn('Risky upload held for review', {
  uploadedFileId,
  ownerId,
  reviewReasonCount: reviewReasons.length,
});
```

Avoid leaking raw content:

```typescript
logger.warn('Risky upload held for review', {
  uploadedFileId,
  // Do not include originalFilename, privateStoragePath, signedUrl, or rawText.
});
```

## Migration Pattern

1. Read the active route/component/library first and confirm it belongs to the
   locked MVP corridor or internal launch ops.
2. Replace `console.log` with `logger.debug` or `logger.info`, depending on
   whether the event matters operationally.
3. Replace `console.warn` with `logger.warn`.
4. Replace `console.error` with `logger.error`.
5. Convert string-concatenated details into a context object with redacted,
   minimum-necessary fields.
6. Run the focused tests for the touched surface, then `npm run lint` and
   `npm run typecheck` when the change touches active TypeScript.

## Finding Console Calls

Use `rg`, not `grep`, for repo searches:

```bash
rg -n 'console\.(log|warn|error|debug)' src -g '*.ts' -g '*.tsx' -g '!src/archive/**'
```

When auditing launch-relevant code only, start with:

```bash
rg -n 'console\.(log|warn|error|debug)' src/app src/lib -g '*.ts' -g '*.tsx' -g '!src/archive/**'
```

Then inspect import chains before assuming a file is active. Some modules under
`src/lib` are retained reference or compatibility code, while compiled routes and
mounted components carry more launch risk.

## Good Active Examples

- Launch validation runner progress can write human-readable command progress
  when it is explicitly a CLI/operator output.
- Logger implementations may use `console.*` internally.
- Mock clients may keep small local-development console output if it never runs
  in production and does not include secrets.

## Bad Active Examples

- API routes logging raw request bodies or database rows.
- Admin routes logging raw queue metadata, audit changes, IP/user-agent bundles,
  storage paths, or extracted proof text.
- Public routes logging portfolio private state or publication eligibility
  details.
- UI components logging private form contents, reveal state, or verification
  payloads.

## Verification

For logging-only edits:

```bash
npm run lint
npm run typecheck
```

For launch-surface edits, also run focused tests for the touched area. Examples:

```bash
npm run test -- tests/api/admin-internal-ops-queue-route.test.ts tests/ui/admin-verification-dashboard.test.tsx
npm run test -- tests/api/assignments-publish-route.test.ts tests/lib/launch-assignment-publish-smoke.test.ts
npm run test:launch:routes
```

If a console call is intentionally retained, leave a small code comment only when
the reason is not obvious from the file context.
