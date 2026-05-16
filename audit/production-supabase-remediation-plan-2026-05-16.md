> Doc Class: `audit`
> Last Verified: `2026-05-16`

# Production Supabase Public Surface Remediation Summary

Generated after `audit/production-supabase-backend-readiness-2026-05-16.md`.

## Current Verdict

`IMPLEMENTED_FOR_PUBLIC_SURFACE`

The original public-surface remediation plan has been executed in production through three migrations:

- `20260516172000_harden_supabase_public_surface`
- `20260516173500_tighten_public_function_execute_grants`
- `20260516180500_secure_match_score_trigger_wrappers`

Fresh audit artifacts show the launch-blocking public-surface findings are cleared:

- RLS-disabled exposed tables: `0`
- Security-definer views selectable by `anon` / `authenticated`: `0`
- Local migration files not applied in production: `0`

## What Changed

The remediation moved the earlier `NO_GO` public database surface to a hardened baseline:

- Enabled RLS on the previously exposed public tables.
- Removed direct `anon` / `authenticated` table access from server-owned and internal tables.
- Hardened public views so the prior security-definer view exposure is gone.
- Tightened direct execute grants for functions that should not be callable by public API roles.
- Hardened match-score trigger wrappers with explicit `SECURITY DEFINER SET search_path = public` and revoked direct execution from public API roles.

## Evidence

Primary artifacts:

- `.artifacts/prod-supabase-backend-readiness-2026-05-16/public-surface-audit-after-trigger-wrapper.json`
- `.artifacts/prod-supabase-backend-readiness-2026-05-16/migration-ledger-audit-after-trigger-wrapper.json`
- `audit/production-supabase-backend-readiness-2026-05-16.md`

Key command results:

- `npm run db:audit:public-surface -- --out .artifacts/prod-supabase-backend-readiness-2026-05-16/public-surface-audit-after-trigger-wrapper.json`: PASS, public-surface blockers cleared.
- `npm run db:audit:migrations -- --out .artifacts/prod-supabase-backend-readiness-2026-05-16/migration-ledger-audit-after-trigger-wrapper.json`: PASS for local files, with only the known historical DB-only row.
- `npm run test:privacy:extended`: PASS, `31` tests.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm run docs:freshness`: PASS in warning mode.

## Remaining Follow-Ups

These are not the original public RLS/view blockers, but they should stay on the backend hardening list:

- Tighten default privileges for future `supabase_admin` objects in `public` so new tables/functions/sequences do not automatically reopen broad access.
- Review the remaining `11` executable public security-definer functions one by one. Current audit shows `search_path` configured, but public execute should remain intentional, not accidental.
- Rerun `npm run test:e2e:org:strict` from a stable local terminal or CI runner. The current Codex desktop runner detached or terminated Playwright processes before a clean final result after the remediation.

## Operational Note

The current blocker is verification confidence in the strict authenticated org corridor, not the production public-surface state. Do not reapply the old remediation draft; use the current audit artifacts as the source of truth.
