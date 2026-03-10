> Doc Class: `active`
> Last Verified: `2026-02-26`

# Production Readiness Checklist

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

- [ ] `BASE_URL=http://localhost:3000 CRON_SECRET=<secret> npm run monitor:launch`
- [ ] `BASE_URL=http://localhost:3000 npm run perf:budgets`
- [ ] `BASE_URL=http://localhost:3000 SUS_STUDY_COMPLETE=true CRON_SECRET=<secret> npm run go:no-go`
- [ ] `/api/health`, `/api/monitoring/perf-status`, and `/api/monitoring/launch-status` healthy.

## Migration and Data Safety

- [ ] `npm run db:drift-check`
- [ ] `npm run db:migrate` (when migration files changed)
- [ ] `npm run db:backup:checkpoint` (before high-risk DDL)
- [ ] `npm run db:restore:verify -- --checkpoint <dir>` after a restore rehearsal
- [ ] Never use `npm run db:push` in production migration workflow.

## Environment and Integrations

- [ ] Required strict E2E env vars set (Supabase + provider OAuth + deterministic provider user).
- [ ] `PII_HASH_SALT` configured for auth/signup test paths.
- [ ] Sentry configured for runtime and build/source maps.
- [ ] Cron secret set and cron endpoints protected.

## Deployment Readiness

- [ ] Build artifact generated successfully.
- [ ] Required checks are green.
- [ ] Release notes prepared.
- [ ] Rollback strategy documented.

## Post-Deploy Validation

- [ ] `curl -sS https://proofound.io/api/health`
- [ ] Deployed commit/version matches intended release.
- [ ] No critical Sentry spikes after deployment.

## Canonical Sources

- `agent/checklists/verification.md`
- `agent/runbooks/setup.md`
- `docs/testing-strategy.md`
