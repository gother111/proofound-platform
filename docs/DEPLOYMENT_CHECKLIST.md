> Doc Class: `active`
> Last Verified: `2026-05-19`

# Deployment Checklist

Use this checklist for a production-candidate deployment of the locked Proofound MVP corridor. It
is an operator companion to
[`docs/production-readiness-checklist.md`](production-readiness-checklist.md),
[`docs/release-checklist.md`](release-checklist.md), and the current sweep artifact at
[`../.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md`](../.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md).

Current 2026-05-19 status: local surface, route-policy, strict org, launch smoke, local monitor,
restore-contract, docs-freshness, and public Browser fallback evidence exists. Do not treat a
deployment as launch-ready until the intended production-candidate target has fresh backup
checkpoint, isolated restore rehearsal, authenticated launch-monitor/perf evidence, and final
go/no-go evidence.

## 1. Target and Secrets

- [ ] Confirm the target URL and database target before running any command that can affect data.
- [ ] Confirm `NEXT_PUBLIC_SITE_URL` matches the target deployment URL.
- [ ] Confirm no production run is using `NEXT_PUBLIC_USE_MOCK_SUPABASE=true`, `MOCK_ADMIN_MODE`,
      `MOCK_PLATFORM_ROLE`, or `MOBILE_MOCK_AUTH`.
- [ ] Confirm required secrets are present in the target environment:
  - `DATABASE_URL`
  - `DIRECT_URL` when database scripts require a direct connection
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RESEND_API_KEY`
  - `EMAIL_FROM`
  - `CRON_SECRET` or `INTERNAL_API_SECRET`
  - `PII_HASH_SALT`
- [ ] Confirm provider credentials are set only for flows intentionally in scope for the run.
- [ ] Keep `STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=false` unless connected-provider scheduling is
      explicitly launch-blocking for this target. Manual interview links remain the locked MVP default.
- [ ] Do not print secrets in logs, screenshots, artifacts, or chat.

## 2. Pre-Deploy Checks

Run the best relevant local gates before promoting a deployment:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run docs:freshness
npm run test:launch:routes
npm run test:launch:smoke
```

For release-candidate evidence, also run the strict corridor checks that match the target:

```bash
npm run test:e2e:landing
npm run test:e2e:auth:real
npm run test:a11y:strict
npm run test:e2e:individual:strict
npm run test:e2e:org:strict
npm run test:e2e:privacy:strict
```

Run `npm run test:e2e:providers:advisory` only if connected-provider scheduling is intentionally
in scope for the target.

If a check cannot run, record the exact blocker and the manual verification path in the launch
evidence.

## 3. Database and Storage Safety

Use repo-owned scripts and the migration ledger as the normal deployment path. Dashboard SQL paste
flows are not launch evidence.

- [ ] `npm run db:drift-check`
- [ ] `npm run db:backup:checkpoint` against the production-candidate target.
- [ ] `npm run db:audit:migrations`
- [ ] If migrations changed, run `npm run db:migrate` and confirm
      `public.app_migration_ledger` records the expected migration ids.
- [ ] `npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json`
      against an isolated recovery target.
- [ ] Save restore-drill evidence with date, target class, owner, and result.
- [ ] Confirm Supabase storage buckets and policies are represented by migrations or documented
      infra setup, not an untracked one-off paste.
- [ ] Do not use `npm run db:push` in production workflows.
- [ ] Do not verify restore behavior against the live production database.

## 4. Deploy

### Vercel Git Deployment

- [ ] Working tree is clean.
- [ ] Release branch or commit matches the intended deployment.
- [ ] No `.env`, secret dump, local export, or private data file is committed.
- [ ] Push the intended branch or merge through the normal protected path.
- [ ] Watch the Vercel deployment logs until build completion.

### Vercel CLI Deployment

Only use CLI deploys when they are the intended release path for the target:

```bash
vercel --prod
```

- [ ] Confirm the CLI is linked to the correct Vercel project.
- [ ] Confirm the promoted deployment URL matches the intended target.
- [ ] Save deployment id, commit sha, and URL in launch evidence.

## 5. Scheduler Ownership

Use [`docs/CRON_SETUP.md`](CRON_SETUP.md) as the canonical scheduler table.

- [ ] Vercel Cron schedules exactly the active launch automation routes in `vercel.json`:
  - `/api/cron/decision-reminders`
  - `/api/cron/refresh-matches`
  - `/api/cron/refresh-matches-worker`
  - `/api/cron/sla-enforcement`
- [ ] cron-job.org is enabled only for active observability:
  - `/api/cron/health-check`
  - `/api/cron/performance-check`
- [ ] Archived, removed, manual-only, and Vercel-owned routes are not enabled in cron-job.org.
- [ ] Protected cron routes reject unauthenticated requests and accept the configured secret.

## 6. Post-Deploy Public Smoke

Use Browser for representative desktop and mobile checks when validating local or deployed web
surfaces.

- [ ] Landing page loads and CTA routing points to signup/login or the intended MVP entry.
- [ ] Signup and login entry routes load without console/runtime errors.
- [ ] Public individual portfolio renders without private proof leakage.
- [ ] Public organization trust page renders only public trust/profile content.
- [ ] Public assignment/share surfaces return the intended active, gated, archived, or 404/410
      behavior.
- [ ] Footer, legal links, metadata, SEO tags, and JSON-LD are present where expected.
- [ ] Public `/api/health` returns minimal health only, with no secret, user, database, or internal
      diagnostic details.

## 7. Post-Deploy Authenticated Smoke

Use the production-candidate target, not stale local evidence, for launch signoff.

- [ ] Individual onboarding and first proof flow is understandable.
- [ ] Proof Packs, proof upload/import/linking, proof quality, and anchor context are clear.
- [ ] Verification requests, publishing, privacy settings, export, and delete flows preserve
      no-leak behavior.
- [ ] Organization onboarding, trust profile, assignments, review queue, candidate proof review,
      intro request, reveal consent, interview, decision, and engagement verification surfaces stay in
      the locked MVP corridor.
- [ ] Admin/internal launch-ops routes are protected and show only role-appropriate queue or
      diagnostic data.
- [ ] Empty, loading, error, disabled, success, archived, and gated states are covered for the
      representative active surfaces.

## 8. Monitoring and Go / No-Go

```bash
BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run monitor:launch
BASE_URL=<production-candidate-url> npm run perf:budgets
npm run db:backup:checkpoint
npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json
BASE_URL=<production-candidate-url> SUS_STUDY_COMPLETE=true CRON_SECRET=<secret> npm run go:no-go
```

- [ ] Authenticated `/api/monitoring/launch-status` reports the expected launch monitor contract.
- [ ] Authenticated `/api/monitoring/perf-status` is healthy and includes `/api/assignments`
      latency samples.
- [ ] Sentry or equivalent runtime monitoring is receiving release-tagged events.
- [ ] Vercel logs show no critical errors after smoke.
- [ ] Resend logs show expected signup, verification, reset, invite, and workflow email behavior.
- [ ] Final go/no-go artifact records target URL, deployment id, commit sha, owner, date, and any
      unresolved risks.

## 9. Rollback

- [ ] Identify the last known good deployment in Vercel.
- [ ] Promote the last known good deployment if the release has a critical runtime, privacy,
      security, or data issue.
- [ ] If a migration ran, do not improvise a live database rollback. Use the checkpoint and restore
      runbook evidence to decide whether to fix forward, isolate recovery, or pause launch.
- [ ] Record incident notes, user-visible impact, and remediation owner.

## 10. Launch Is Successful When

- [ ] Build and required checks pass for the intended commit.
- [ ] Public and authenticated MVP corridor surfaces pass desktop and mobile smoke.
- [ ] No public surface leaks private proof, candidate, org, assignment, or diagnostic data.
- [ ] Cron ownership matches the canonical route classification.
- [ ] Fresh backup checkpoint and isolated restore rehearsal are recorded.
- [ ] Authenticated launch monitor and perf checks pass on the production-candidate target.
- [ ] Final go/no-go is green, or the remaining risks are explicitly accepted by the launch owner.
