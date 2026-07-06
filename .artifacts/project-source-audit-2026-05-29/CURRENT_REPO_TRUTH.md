# Current Repo Truth

Generated: 2026-05-29
Workspace: `/Users/yuriibakurov/proofound`

## Current Repo Status

- Branch: `master` (`git branch --show-current`)
- Head: `874f1da8a` (`git rev-parse --short HEAD`)
- Initial `git status --short`: clean.
- Final intentional change: only `.artifacts/project-source-audit-2026-05-29/`.
- Runtime caveat: shell `node` is `v25.4.0`, while `package.json` declares Node `24.x`. Repo scripts still passed in this environment, but this is a setup mismatch to record.

## Current Route Counts

- API route handlers under `src/app/api/**/route.ts`: `124`
- App page routes under `src/app/**/page.tsx`: `51`
- Non-API route handlers under `src/app/**/route.ts` outside `src/app/api`: `9`
- Current API classification by `src/lib/launch/surface-policy.ts`: `107` active launch, `16` internal-only launch ops, `1` archived compiled compatibility route.
- Current page classification: `48` active launch, `3` internal-only launch ops.
- Current non-API route handler classification: `8` active, `1` archived (`/dev/resolve-home`).

Evidence: `find src/app/api -name route.ts | wc -l`; `find src/app -name page.tsx | wc -l`; `find src/app -name route.ts | rg -v '^src/app/api/'`; `npx tsx` route-classification helper; `src/lib/launch/surface-policy.ts`.

## Current Active Launch Surface Summary

Current active launch surface remains the proof-first MVP corridor:

- Public entry, legal, auth, portfolio, org trust, verification, and invite pages.
- Individual app corridor: home, profile, portfolio, matching, preferences, communications/messages, interviews, verifications, settings, privacy, audit log.
- Organization app corridor: home, assignments, assignment review, matching, shortlist, communications/messages, interviews, profile, portfolio, invitations.
- Internal-only launch ops: admin, admin audit, admin verification, launch monitoring/cron/admin APIs.

Evidence: `src/lib/launch/surface-policy.ts`; `tests/api/launch-surface-inventory.test.ts`; `tests/api/launch-page-inventory.test.ts`; `npm run test:launch:routes`.

## Current Compiled Route-Surface Concerns

- `/api/assignments/[id]/pipeline` still compiles but is classified as archived by policy.
- `/dev/resolve-home` compiles as a non-API route handler and is classified as archived/fail-closed development compatibility.
- Older docs saying the current route surface is `140` APIs, `187` APIs, or `91` pages are stale.

Evidence: route classification helper; `src/lib/launch/surface-policy.ts`; `tests/api/launch-surface-inventory.test.ts`.

## Current Test / Build Status

| Command                                                                                                                                              | Result                               | Notes                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git status --short`                                                                                                                                 | PASS                                 | Initially clean.                                                                                                                                                              |
| `find . -maxdepth 3 -type f ( -name "*.md" -o -name "*.txt" -o -name "*.json" ) \| sort`                                                             | RAN / NOISY                          | Included `node_modules`, so it was not useful as the decision inventory. A pruned `rg --files` inventory was used for analysis.                                               |
| `npm run lint`                                                                                                                                       | PASS                                 | Exit `0`.                                                                                                                                                                     |
| `npm run typecheck`                                                                                                                                  | PASS                                 | Exit `0`.                                                                                                                                                                     |
| `npm run build`                                                                                                                                      | PASS                                 | Build completed. Warnings: `next-intl` webpack cache parsing, large cache string serialization, edge runtime static-generation notice, `--localstorage-file` warnings.        |
| `npm run docs:freshness`                                                                                                                             | PASS                                 | `docs:freshness passed with no findings`.                                                                                                                                     |
| `npm run test:privacy`                                                                                                                               | PASS after permission rerun          | Sandbox DNS failed on Supabase host; network-permitted rerun passed `2` files / `22` tests.                                                                                   |
| `npm run test:privacy:extended`                                                                                                                      | PASS after permission rerun          | Sandbox DNS failed on Supabase host; network-permitted rerun passed `2` files / `31` tests.                                                                                   |
| `npm run test -- tests/api/launch-surface-inventory.test.ts tests/api/launch-page-inventory.test.ts src/lib/launch/__tests__/surface-policy.test.ts` | PASS                                 | Corrected the prompt's `**tests**` path to existing `__tests__`; passed `3` files / `21` tests.                                                                               |
| `npm run test:launch:routes`                                                                                                                         | PASS                                 | Passed `4` files / `21` tests.                                                                                                                                                |
| `npm run test:e2e:landing`                                                                                                                           | PASS after permission rerun          | Sandbox server bind failed on port `33100`; local-server-permitted rerun passed `11` tests.                                                                                   |
| `npm run test:launch:smoke -- --artifact .artifacts/project-source-audit-2026-05-29/launch-smoke-report.json`                                        | PASS after permission rerun          | Sandbox run failed on local server/tsx IPC; permitted rerun passed all `6` smoke checks.                                                                                      |
| `npm run monitor:launch -- --artifact .artifacts/project-source-audit-2026-05-29/launch-smoke-report.json`                                           | PASS after server + permission rerun | Initial run failed endpoint checks because no server was running; second sandbox run still could not fetch endpoints; permitted rerun against `npm run start` passed `10/10`. |

## Current Privacy / RLS Status

Current status: PASS in this audit after network permission.

Evidence:

- `npm run test:privacy`: `2` files / `22` tests passed.
- `npm run test:privacy:extended`: `2` files / `31` tests passed.
- Source: `tests/privacy/rls-policies.test.ts`, `tests/privacy/rls-policies-extended.test.ts`, `tests/privacy/rls-mvp-isolation.test.ts`, `tests/lib/ai-redaction.test.ts`.

## Current Org Corridor Status

Current status: PASS in local launch smoke.

Evidence:

- `npm run test:launch:smoke -- --artifact .artifacts/project-source-audit-2026-05-29/launch-smoke-report.json`
- Smoke check `full_org_corridor_review_to_engagement_verification`: `PASS`.
- Smoke artifact generated at `2026-05-29T16:13:23.271Z`.

## Current Landing / Signup Status

Current status: PASS for landing E2E.

Evidence:

- `npm run test:e2e:landing`: `11 passed`.
- Tested homepage shell, scroll story, wheel gesture lock, CTA routes, console errors, network background, mobile story, headings, image alt/decorative handling, and accessible link names.

## Current Known Blockers

No repo-local functional blocker was reproduced in this pass.

Full production launch remains blocked / unverified by external evidence:

1. Named incident/support owners for the intended launch.
2. Critical alert configuration proof.
3. Backup checkpoint and isolated restore proof for the intended production-candidate target.
4. Founder go/no-go signoff after reviewing the fresh evidence.

Evidence: `.artifacts/launch-readiness-summary.md`; `.artifacts/launch-validation-2026-05-20/final-launch-checklist-status.md`; current command results in this file.

## Current Non-Blocking Watch Items

- Node runtime mismatch: shell Node `v25.4.0`; repo declares Node `24.x`.
- Build warnings are non-fatal but should remain watch items.
- Full org launch smoke is slow: recorded response time around `349540ms` in monitor synthetic-smoke details.
- Assignment publish/list latency remains a watch item from older launch summaries; not retested as a performance budget in this pass.
- Production live status was not tested against `https://proofound.io` to avoid production-target mutation risk.
