> Doc Class: `active`
> Last Verified: `2026-05-19`

# Production Readiness Checklist

Use this as a launch operator checklist together with
[`docs/backlog/phase-exit-checklist.md`](backlog/phase-exit-checklist.md) and the current sweep
artifact at
[`../.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md`](../.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md).

Current 2026-05-19 status: local route-surface, public-copy, strict org, launch smoke, local launch
monitor, restore-contract, and docs-freshness evidence exists. Production readiness is still not
complete until the intended production-candidate target has fresh backup checkpoint, isolated
restore rehearsal, and final go/no-go evidence.

## Testing and Quality Gates

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `npm run test:launch:smoke`
- [ ] `npm run test:e2e:landing`
- [ ] `npm run test:e2e:auth:real`
- [ ] `npm run test:a11y:strict`
- [ ] `npm run test:strict:quality`
- [ ] `npm run test:e2e:individual:strict`
- [ ] `npm run test:e2e:org:strict`
- [ ] `npm run test:e2e:privacy:strict`
- [ ] `npm run test:e2e:providers:strict`

## Privacy and Security

- [ ] `npm run test:privacy`
- [ ] `npm run test:privacy:extended`
- [ ] Auth and CSRF behavior validated for protected APIs.
- [ ] RLS behavior validated against latest migrations.

## Performance and Go / No-Go

- [ ] `BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run monitor:launch`
- [ ] `BASE_URL=<production-candidate-url> npm run perf:budgets`
- [ ] `BASE_URL=<production-candidate-url> SUS_STUDY_COMPLETE=true CRON_SECRET=<secret> npm run go:no-go`
- [ ] `/api/health` returns minimal `status:"ok"`.
- [ ] Authenticated `/api/monitoring/perf-status` is healthy and includes `/api/assignments` latency samples.
- [ ] Authenticated `/api/monitoring/launch-status` reports the full launch monitor contract as ready.

## Migration and Data Safety

- [ ] `npm run db:drift-check`
- [ ] `npm run db:migrate` (when migration files changed)
- [ ] Confirm the intended database target before running backup or restore scripts.
- [ ] `npm run db:backup:checkpoint` against the production-candidate target.
- [ ] `npm run db:restore:verify -- --checkpoint <dir>` against an isolated recovery target.
- [ ] Restore drill outcome is saved with date, target class, and owner.
- [ ] Never use `npm run db:push` in production migration workflow.

## Environment and Integrations

- [ ] Required strict E2E env vars set for the intended target.
- [ ] Provider strict credentials are set only for provider flows that are intentionally in scope for the run; manual-link interview posture remains the locked MVP default.
- [ ] `PII_HASH_SALT` configured for auth/signup test paths.
- [ ] Sentry configured for runtime and build/source maps.
- [ ] `CRON_SECRET` or `INTERNAL_API_SECRET` set for internal launch-ops routes.
- [ ] Cron and monitoring endpoints reject unauthenticated requests.

## Deployment Readiness

- [ ] Build artifact generated successfully.
- [ ] Required checks are green.
- [ ] Release notes prepared.
- [ ] Rollback strategy documented.

## Post-Deploy Validation

- [ ] `curl -sS https://proofound.io/api/health`
- [ ] Public health returns only `status` and `timestamp`.
- [ ] Authenticated launch-status and perf-status checks pass on the deployed target.
- [ ] Deployed Vercel deployment metadata matches intended release.
- [ ] No critical Sentry spikes after deployment.

## Canonical Sources

- `agent/checklists/verification.md`
- `agent/runbooks/setup.md`
- `docs/testing-strategy.md`
