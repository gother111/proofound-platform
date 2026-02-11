# Launch Gate Matrix v1 (Strict)

Date: 2026-02-11
Target domain: `https://proofound.io`
Scope: Full two-sided MVP launch gate for individual, organization, matching, admin, and public sharing flows.

## Command Matrix

| Gate                   | Command                                                                   | Status         | Notes                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Lint                   | `npm run lint`                                                            | PASS           | No ESLint warnings or errors.                                                                                                        |
| Typecheck              | `npm run typecheck`                                                       | PASS           | No TypeScript errors.                                                                                                                |
| Unit/Integration tests | `npm run test`                                                            | PASS           | 41 files, 240 tests passed.                                                                                                          |
| Build                  | `npm run build`                                                           | PASS           | Production build completed successfully.                                                                                             |
| Accessibility          | `npm run test:a11y`                                                       | PASS           | 18 Playwright a11y tests passed.                                                                                                     |
| Privacy/RLS            | `npm run test:privacy:all`                                                | FAIL           | Missing `.env.test` Supabase credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). |
| Critical Chromium E2E  | `npm run test:e2e:critical`                                               | FAIL (SKIPPED) | Skipped because seeded credentials (`E2E_INDIVIDUAL_EMAIL`, `E2E_INDIVIDUAL_PASSWORD`) were not set.                                 |
| Perf budgets           | `BASE_URL=http://localhost:3000 npm run perf:budgets`                     | FAIL           | Health check timeout: local server was not running for budget audit.                                                                 |
| Go/No-Go               | `BASE_URL=http://localhost:3000 SUS_STUDY_COMPLETE=true npm run go:no-go` | FAIL           | `fetch failed` because gate target server was unavailable.                                                                           |
| Migration audit        | `npm run db:audit:migrations`                                             | FAIL           | Drift detected (`file_not_applied=15`, `applied_missing_file=100`).                                                                  |
| Vercel preflight       | `npm run vercel:preflight`                                                | PASS           | Vercel linkage and env key presence checks passed.                                                                                   |

## Pre-DDL Safety Step

| Command                        | Status | Notes                                                         |
| ------------------------------ | ------ | ------------------------------------------------------------- |
| `npm run db:backup:checkpoint` | PASS   | Checkpoint created under `/tmp/proofound-db-checkpoints/...`. |

## Blocking Summary

Launch is `NO-GO` until all FAIL rows above are resolved and rerun as PASS under the same matrix.

## Manual Production Smoke (Pending)

Run on `https://proofound.io` after all automated gates pass:

1. Individual profile and skills update.
2. `/portfolio/{handle}` share path.
3. `/p/{token}` and `/p/{token}/embed` share paths.
4. Organization assignment creation and match list view.
5. Mutual interest to conversation flow.
6. Admin dashboard core pages.
