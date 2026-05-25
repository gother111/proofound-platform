> Doc Class: `audit`
> Last Verified: `2026-05-16`

# Production Supabase / Backend Readiness Audit

Generated at: `2026-05-16T18:45:55Z`

Final readiness update: `2026-05-16T22:55Z`

Workspace: `/Users/yuriibakurov/proofound`

Production Supabase project checked: `Proofound` (`cjpfrgmsxwxhuomnvciq`, region `eu-west-1`, database `Postgres 17.6`)

## Verdict

`GO`

The production Supabase public-surface blocker that caused the earlier backend `NO_GO` has been remediated, rechecked, and covered by a final launch-validation pass:

- All `181` public tables now have RLS enabled.
- `0` RLS-disabled public tables are exposed to `anon` or `authenticated`.
- `0` public security-definer views are selectable by `anon` or `authenticated`.
- All local migration files are applied in production.
- Final consolidated launch validation is `GO`: `13` pass, `0` fail, `0` unverified, `1` not applicable.
- Strict authenticated organization E2E passed in the final consolidated validation run.

The one not-applicable launch gate is launch smoke without `BASE_URL`; run the same validator with `BASE_URL` after deployment when validating a specific public web URL.

## Production Changes Applied

Three production hardening migrations are now present in the Supabase migration ledger:

- `20260516172000_harden_supabase_public_surface`
- `20260516173500_tighten_public_function_execute_grants`
- `20260516180500_secure_match_score_trigger_wrappers`

The final trigger-wrapper migration hardened the match-score stale-marking trigger wrappers as `SECURITY DEFINER SET search_path = public` and revoked direct execute from `PUBLIC`, `anon`, and `authenticated`.

## Fresh Evidence

### Public Surface Audit

Command:

```bash
npm run db:audit:public-surface -- --out .artifacts/prod-supabase-backend-readiness-2026-05-16/public-surface-audit-final.json
```

Result artifact:

- `.artifacts/prod-supabase-backend-readiness-2026-05-16/public-surface-audit-final.json`

Summary:

- Public tables: `181`
- RLS enabled: `181`
- RLS disabled: `0`
- RLS-disabled exposed tables: `0`
- Security-definer views selectable by `anon` / `authenticated`: `0`
- Executable security-definer functions remaining: `11`
- Default privilege findings: `3`

The remaining executable security-definer functions are known public/RLS helper or token functions with `search_path` configured. They are not the trigger-wrapper exposure fixed in the final migration.

### Migration Ledger Audit

Command:

```bash
npm run db:audit:migrations -- --out .artifacts/prod-supabase-backend-readiness-2026-05-16/migration-ledger-audit-final.json
```

Result artifact:

- `.artifacts/prod-supabase-backend-readiness-2026-05-16/migration-ledger-audit-final.json`

Summary:

- Local migration files: `125`
- Database migration rows: `126`
- Applied local files: `125`
- Local files not applied: `0`
- Historical DB row without local file: `20260317224741_canonicalize_org_role_constraints`

The extra DB row is a known historical ledger mismatch and is not blocking the current production hardening state.

### Final Launch Validation

Command:

```bash
NEXT_DISABLE_WEBPACK_CACHE=1 NEXT_DISABLE_WEBPACK_BUILD_WORKER=1 NODE_OPTIONS=--max-old-space-size=8192 npm run launch:validate -- --output-dir .artifacts/launch-validation-2026-05-16-final-go
```

Result artifacts:

- `.artifacts/launch-validation-2026-05-16-final-go/final-launch-checklist-status.md`
- `.artifacts/launch-validation-2026-05-16-final-go/commands.json`

Summary:

- Verdict: `GO`
- P0 blocking gates: `0`
- Pass: `13`
- Fail: `0`
- Unverified: `0`
- Not applicable: `1` (`launch_smoke`, because `BASE_URL` was not configured)
- Strict org corridor E2E: PASS, `7` tests.

### Privacy Gate

Command:

```bash
npm run test:privacy:extended
```

Result:

- PASS, `31` tests.

### Repo Hygiene Checks

Commands:

```bash
npm run lint
npm run typecheck
npm run docs:freshness
```

Results:

- `npm run lint`: PASS
- `npm run typecheck`: PASS
- `npm run docs:freshness`: PASS in warning mode, with existing orphan-document warnings unrelated to this remediation.

## Strict Org E2E Status

Work completed:

- Routed strict corridor mutating requests through the shared strict API helpers so CSRF refresh and transient request retry behavior are consistent.
- Sanitized strict helper retry warnings so request cookies/tokens are not dumped into logs.
- Made the invite-accept redirect wait for URL and network-idle before closing the reviewer browser context.
- Added local production-smoke escape hatches for transactional email delivery, CSRF cookie security, and rate-limit fallback so the repo-managed Playwright `next start` server can exercise production mode locally without sending real email or requiring remote rate-limit infrastructure.
- Fixed the production organization invite form path by binding an exported server action instead of relying on an inline server-action closure.
- Fixed active-organization cache relation aliases used by backend-connected org flows.

Current evidence:

- Standalone `npm run test:e2e:org:strict`: PASS, `7` tests.
- Consolidated launch validation strict org corridor E2E: PASS, `7` tests.
- The final consolidated validator ended with verdict `GO`.

## Remaining Backend Risks

- Default privileges still grant broad privileges for future `supabase_admin` objects in `public`. Existing public table/view blockers are fixed, but default privileges should be tightened in a follow-up migration so future objects do not reopen the same exposure.
- Eleven public security-definer functions remain executable by `anon` and `authenticated`. They have configured search paths and appear to include intentional token/RLS helpers, but they should still receive a function-by-function launch review.
- External public-web launch smoke was not run in the final validator because no `BASE_URL` was provided. This is a post-deploy URL-specific check, not a remaining backend public-surface blocker.

## Bottom Line

The production Supabase public database surface is no longer in the earlier `NO_GO` state, and the backend-connected launch gates now have final `GO` evidence in the repo. The remaining items are follow-up hardening and post-deploy URL smoke, not current backend launch blockers.
