> Doc Class: `audit`
> Last Verified: `2026-05-16`

# Production Supabase / Backend Readiness Audit

Generated at: `2026-05-16T18:45:55Z`

Workspace: `/Users/yuriibakurov/proofound`

Production Supabase project checked: `Proofound` (`cjpfrgmsxwxhuomnvciq`, region `eu-west-1`, database `Postgres 17.6`)

## Verdict

`PARTIAL_GO`

The production Supabase public-surface blocker that caused the earlier backend `NO_GO` has been remediated and rechecked:

- All `181` public tables now have RLS enabled.
- `0` RLS-disabled public tables are exposed to `anon` or `authenticated`.
- `0` public security-definer views are selectable by `anon` or `authenticated`.
- All local migration files are applied in production.

This is not a final launch `GO` yet because the strict authenticated organization E2E gate could not be completed reliably in the current Codex runner after the remediation. The corridor passed once against a separated local app process during this run, but subsequent Playwright processes in this desktop session detached or were terminated before producing a final result. Treat strict org E2E as `UNVERIFIED` until it is rerun cleanly from a stable terminal or CI runner.

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
npm run db:audit:public-surface -- --out .artifacts/prod-supabase-backend-readiness-2026-05-16/public-surface-audit-after-trigger-wrapper.json
```

Result artifact:

- `.artifacts/prod-supabase-backend-readiness-2026-05-16/public-surface-audit-after-trigger-wrapper.json`

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
npm run db:audit:migrations -- --out .artifacts/prod-supabase-backend-readiness-2026-05-16/migration-ledger-audit-after-trigger-wrapper.json
```

Result artifact:

- `.artifacts/prod-supabase-backend-readiness-2026-05-16/migration-ledger-audit-after-trigger-wrapper.json`

Summary:

- Local migration files: `125`
- Database migration rows: `126`
- Applied local files: `125`
- Local files not applied: `0`
- Historical DB row without local file: `20260317224741_canonicalize_org_role_constraints`

The extra DB row is a known historical ledger mismatch and is not blocking the current production hardening state.

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

- Stabilized the Next dev wrapper so the custom `.next-dev-PORT/package.json` CommonJS marker is only written when missing or incorrect.
- Added clean-directory retry/fallback behavior for `.next-dev-PORT`.
- Forwarded stop signals from the Node 24 dev wrapper to its child process.
- Routed strict corridor mutating requests through the shared strict API helpers so CSRF refresh and transient request retry behavior are consistent.
- Sanitized strict helper retry warnings so request cookies/tokens are not dumped into logs.
- Made the invite-accept redirect wait for URL and network-idle before closing the reviewer browser context.

Current evidence:

- The full authenticated org corridor passed once against a separated local app process before the later runner instability.
- Subsequent Codex-managed Playwright runs detached or were terminated before producing a final pass/fail artifact.
- One direct run exposed a dev-server `uncaughtException` around an aborted invite-accept redirect; the test was updated to avoid closing the reviewer context while the redirect was still settling.

Required follow-up:

- Rerun `npm run test:e2e:org:strict` from a stable local terminal or CI runner.
- If it still fails, capture the final failure artifact and continue from the invite-accept/Next dev-server crash path.

## Remaining Backend Risks

- Default privileges still grant broad privileges for future `supabase_admin` objects in `public`. Existing public table/view blockers are fixed, but default privileges should be tightened in a follow-up migration so future objects do not reopen the same exposure.
- Eleven public security-definer functions remain executable by `anon` and `authenticated`. They have configured search paths and appear to include intentional token/RLS helpers, but they should still receive a function-by-function launch review.
- Strict authenticated org E2E remains unverified in this runner and is the main remaining launch-readiness evidence gap.

## Bottom Line

The production Supabase public database surface is no longer in the earlier `NO_GO` state. The remaining blocker is not the public RLS/view exposure; it is final strict org E2E verification in a stable runner.
