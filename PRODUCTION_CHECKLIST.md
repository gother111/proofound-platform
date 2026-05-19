# Production Deployment Checklist

> Doc Class: `active`
> Last Verified: `2026-05-19`

This checklist is an execution aid for a production-candidate Proofound deployment. It does not broaden MVP scope.

Launch authority order:

1. `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
2. `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`
3. `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
4. `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
5. `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md`
6. Fresh repo-grounded launch evidence

For current launch gates, also read:

- `docs/production-readiness-checklist.md`
- `docs/release-checklist.md`
- `docs/backlog/phase-exit-checklist.md`
- `docs/testing-strategy.md`
- `.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md`

## Environment Variables

Set these in the target deployment environment.

### Required Runtime Variables

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - Supabase project URL.
  - Browser-safe public value.

- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Supabase anon/public key.
  - Browser-safe public value.

- [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - Secret key for server-side admin operations only.
  - Must never be exposed to client code or logs.

- [ ] `DATABASE_URL`
  - Pooled PostgreSQL runtime connection string.
  - Use the Supabase pooler port for runtime traffic.

- [ ] `DIRECT_URL`
  - Direct PostgreSQL connection string for migrations/tooling.
  - Keep separate from the pooled runtime connection.

- [ ] `NEXT_PUBLIC_SITE_URL`
  - Public production-candidate URL without trailing slash.

- [ ] `SITE_URL`
  - Server-side site URL for canonical links, emails, and callbacks.

- [ ] `CRON_SECRET`
  - Bearer token for `/api/cron/*` routes.
  - Generate a fresh secret for the target.

### Target-Scoped Provider Variables

Manual-link interview scheduling is the locked MVP default. Connected providers are optional, target-scoped checks only when the intended launch target explicitly enables them.

- [ ] Google provider credentials, only if the target intentionally enables Google Calendar or Google Meet.
  - Store client ID, client secret, and callback path/domain in the target environment manager.
  - Verify the target callback URL in the provider console.
  - Keep a manual-link fallback passing.

- [ ] LinkedIn provider credentials, only if the target intentionally enables account-side verification history.
  - LinkedIn account-side checks must not grant public trust, candidate reveal, or intro eligibility by themselves.

- [ ] Zoom-native credentials are not a launch requirement.
  - Do not block launch on Zoom app review, Zoom OAuth credentials, or Zoom-specific scheduling tests.
  - See `OAUTH_SETUP_GUIDE.md` for retained provider-reference posture.

### Optional Variables

- [ ] `RESEND_API_KEY`, if email sending is enabled.
- [ ] `EMAIL_FROM`, if email sending is enabled.
- [ ] `RATE_LIMIT_WINDOW_SECONDS`, if overriding the default rate limit window.
- [ ] `RATE_LIMIT_MAX`, if overriding the default limit.
- [ ] `NEXT_PUBLIC_CRISP_WEBSITE_ID`, if support chat is intentionally enabled.

## Database And Recovery

- [ ] Take a fresh production-candidate backup checkpoint:
  - `npm run db:backup:checkpoint`

- [ ] Apply versioned migrations only:
  - `npm run db:migrate`

- [ ] Do not run `npm run db:push` against production.

- [ ] Rehearse restore in an isolated target:
  - `npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json`
  - Keep the checkpoint directory readable until final `go:no-go` has consumed the restore report.

- [ ] Confirm RLS policies and triggers are present.

- [ ] Confirm account export, delete, audit-log visibility, and deletion failure/manual-review states still behave as intended.

## Auth And Privacy

- [ ] Supabase Site URL matches the production-candidate URL.
- [ ] Supabase redirect URLs include:
  - `/auth/callback`
  - `/reset-password/confirm`
  - `/verify-email`

- [ ] Sensitive routes require authentication.
- [ ] Organization routes verify active membership and role.
- [ ] Admin/internal routes fail closed for non-admin users.
- [ ] Public portfolio and organization trust pages do not leak hidden proof, contact, verification, reveal, or private context data.
- [ ] Candidate reveal requires consent before identity/contact exposure.
- [ ] Public health remains minimal; diagnostics remain internal.

## MVP Corridor Smoke

Use the target production-candidate URL for these checks.

- [ ] Public landing, login, signup, legal links, metadata, and CTA routing.
- [ ] Public individual portfolio and public organization trust page.
- [ ] Individual onboarding and first proof flow.
- [ ] Proof Pack creation/import/linking and proof quality/readiness states.
- [ ] Verification request surfaces.
- [ ] Public portfolio publishing controls.
- [ ] Organization onboarding/profile/trust page.
- [ ] Assignment list, create, edit, review, and publish.
- [ ] Review queue, shortlist, candidate proof review cards, and reason-code explanations.
- [ ] Intro request, reveal request, candidate consent, interview scheduling/reschedule, decision recording, and engagement verification.
- [ ] Admin/internal launch ops: verification queue, audit surfaces, launch status, and monitoring.
- [ ] Empty, loading, error, disabled, success, archived, gated, mobile, and desktop states where relevant.

## Required Checks

Run the best relevant checks available for the target. Record pass/fail and exact reason for any skipped check.

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run docs:freshness`
- [ ] `npm run test:launch:routes`
- [ ] `npm run test:launch:workflow`
- [ ] `npm run test:launch:org-corridor`
- [ ] `npm run test:launch:privacy`
- [ ] `npm run test:a11y`
- [ ] `npm run test:strict:quality`
- [ ] `npm run test:e2e:org:strict`
- [ ] `BASE_URL=<production-candidate-url> npm run monitor:launch`
- [ ] Authenticated `/api/monitoring/launch-status`
- [ ] Authenticated `/api/monitoring/perf-status`, including `/api/assignments` latency samples.
- [ ] `.artifacts/launch-restore-report.json` exists, is fresh, and points to readable checkpoint evidence.
- [ ] `BASE_URL=<production-candidate-url> CRON_SECRET=<target-secret> npm run go:no-go`

## Browser Checks

Use the in-app Browser or Playwright on representative desktop and mobile viewports.

- [ ] Public landing and public portfolio.
- [ ] Individual proof portfolio, verification, communication, and privacy settings.
- [ ] Organization assignments, review, interviews, communications, and trust page.
- [ ] Admin verification and audit surfaces.
- [ ] Confirm no visible runtime error, no horizontal overflow, clear primary object/action, and no stale broad-platform language.

## Launch Decision

Before marking the target ready, confirm the evidence artifact includes:

- surface inventory and classification summary
- files or configuration changed for the target
- security/privacy behavior changed or explicitly unchanged
- tests/docs updated or retired
- Browser/visual evidence
- commands/checks run with pass/fail status
- remaining risks or `UNVERIFIED` items

Known final production-candidate blockers remain open until fresh target evidence exists for backup checkpoint, isolated restore rehearsal, authenticated monitoring, assignment performance, and final go/no-go.
