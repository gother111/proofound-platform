# Proofound Current Truth

> Doc Class: `active`
> Last Verified: `2026-05-19`

This document records the current repo-grounded truth for the locked Proofound MVP after the May 19, 2026 surface sweep, route inventory, docs, privacy, and launch-corridor verification passes.

## Current Authority Stack

Active MVP authority is:

1. `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
2. `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`
3. `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
4. `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
5. `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md`
6. Fresh repo-grounded audits and evidence

`Proofound_Project_Specification_2026-03-11.md` is preserved reference context only. It must not broaden or outrank the active authority stack.

This stack is now stated consistently in the main active governance docs reviewed in this pass: `AGENTS.md`, `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`, `README.md`, `Prompt.md`, `project/Prompt.md`, `Implement.md`, `project/Implement.md`, `Plans.md`, `project/Plans.md`, `Architecture.md`, `project/Architecture.md`, `DESIGN.md`, and `docs/mvp-launch-master-checklist.md`.

## Current Pilot Status

Repo status is `MVP pilot ready for the narrow locked corridor, subject to the normal final launch evidence bundle and live/staging signoff`.

Current evidence from recent verification passes:

- Default unit/component/API suite passes: `365` files, `1783` tests.
- Production build passes.
- Core privacy suite passes after network access to the configured Supabase test project.
- Extended privacy suite passes after network access to the configured Supabase test project.
- Production-threshold dependency audit passes the high/critical launch gate, with moderate transitive advisories still present.
- Route inventory and launch-surface tests align on `140` compiled API handlers and `51` compiled app page handlers.
- Focused route inventory verification passes: `4` files and `25` tests.

The GTM plan remains narrow: 3 to 5 design partners, founder-led/manual support, one concrete assignment per partner, proof-first review, blind-by-default review, consented reveal, and engagement verification.

## Current Route And Surface Truth

Current filesystem counts:

- API route handlers under `src/app/api/**/route.ts`: `140`
- App page handlers under `src/app/**/page.tsx`: `51`

Current launch-surface policy:

- API routes: `110` active launch, `16` internal-only launch ops, `14` archived compiled compatibility handlers
- Page routes: `48` active launch, `3` internal-only launch ops, `0` archived compiled page handlers
- Hard-gated named pages remain out of the compiled page surface: individual opportunities, org team, and org settings/team.

The compiled archived API compatibility handlers are explicitly covered by `tests/api/launch-surface-inventory.test.ts` and classified as archived by `src/lib/launch/surface-policy.ts`. They do not define current launch scope.

Removed or archived surfaces are not described as current launch infrastructure in the active source stack. Current docs describe weekly digest, Python internal worker scheduling, CV import cleanup, fairness automation, broad public directory, ATS replacement, marketplace expansion, and AI scoring/screening/recruiting as disabled, archived, excluded, historical, or advisory.

## Stale Term Classification

Search scope: Markdown files excluding `docs/archive/**`, `project/changes/entries/**`, and `agent/scratchpad/entries/**`.

| Term or term family                                  | Classification                                                   | Notes                                                                                                                                                                                                                                       |
| ---------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `future of work`                                     | allowed historical/advisory                                      | No current non-archive occurrence found in this pass.                                                                                                                                                                                       |
| `stewardship`                                        | allowed historical/advisory                                      | No current non-archive occurrence found in this pass.                                                                                                                                                                                       |
| `open standards`                                     | allowed historical/advisory                                      | No current non-archive occurrence found in this pass.                                                                                                                                                                                       |
| `ATS replacement`, `public directory`, `marketplace` | allowed historical/advisory                                      | Current occurrences are MVP exclusions, GTM guardrails, historical/reference docs, or vendor-name uses such as Zoom Marketplace.                                                                                                            |
| `AI recruiter`, `AI screening`, `AI scoring`         | allowed historical/advisory, with one advisory rewrite candidate | Active AI docs use these as explicit prohibitions. `FULL_PRODUCT_ARCHITECTURE_PLAN.md` still contains a future-looking AI scoring roadmap row; it is reference-only, but should be rewritten or archived if that document is ever promoted. |
| `dashboard`                                          | allowed historical/advisory                                      | Current uses are actual route names, admin/ops UI labels, vendor dashboard instructions, or explicit warnings against dashboard-heavy scope. Older dashboard-sprawl reports remain advisory.                                                |
| `platform`                                           | allowed historical/advisory                                      | Current uses are mostly generic technical wording, vendor/deployment wording, or explicit anti-sprawl guidance. It should not be used as product positioning for launch.                                                                    |
| `protocol`                                           | allowed historical/advisory                                      | Current uses are technical, mostly URL/network wording.                                                                                                                                                                                     |
| `fairness notes`                                     | allowed historical/advisory                                      | Remaining occurrences are history, stale-test audit notes, or superseded notes. `VERCEL_CRON_LIMIT_WORKAROUND.md` was rewritten as historical-only so it no longer presents fairness automation as current.                                 |
| `weekly digest`                                      | allowed historical/advisory                                      | Current occurrences state the route/delivery is disabled or removed from active launch infrastructure.                                                                                                                                      |
| `Python worker`                                      | allowed historical/advisory                                      | Current occurrences state it is archived/non-MVP or not active scheduler evidence.                                                                                                                                                          |
| `CV import cleanup`                                  | allowed historical/advisory                                      | Current occurrences state it is removed/non-MVP or not scheduled.                                                                                                                                                                           |

No remaining occurrence from the searched set is classified as `should be removed` after this pass. The only `needs rewrite` item is advisory: `FULL_PRODUCT_ARCHITECTURE_PLAN.md` should not keep an AI-scoring roadmap row if it is ever treated as active or launch-adjacent.

## Superseded Documents

These documents are superseded or reference-only and must not broaden the locked MVP:

- `Proofound_Project_Specification_2026-03-11.md`
- `PRD_for_a_web_platform_MVP.master-latest.md`
- `PRD_for_a_web_platform_MVP.md`
- `Proofound_PRD_MVP.md`
- `PRD_TECHNICAL_REQUIREMENTS.md`
- `LAUNCH_RUNBOOK.md`
- `FULL_PRODUCT_ARCHITECTURE_PLAN.md`
- `DATA_SECURITY_PRIVACY_ARCHITECTURE.md`
- `SYSTEM_ARCHITECTURE_COMPREHENSIVE.md`
- `SYSTEM_ARCHITECTURE_SUPPLEMENT.md`
- `USER_FLOWS_TECHNICAL_SPECIFICATIONS.md`
- Historical audit/status reports under `docs/proofound-hard-audit-*`, `audit/`, `project/Documentation.md`, `Documentation.md`, and `metrics.md`

## Release Blockers

No blocker was reproduced by the requested local verification stack.

Remaining caution:

- The requested checks do not replace a fresh production/staging go/no-go bundle, live smoke, perf budgets, or operator signoff.
- This document reflects the current local checkout after focused MVP surface-sweep commits, not a production deployment.

## Verification Results

| Command                         | Result                      | Notes                                                                                                                                                                                                                                                                          |
| ------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run docs:freshness`        | PASS                        | Exit `0`; rerun on 2026-05-19 with no findings.                                                                                                                                                                                                                                |
| `npm run test`                  | PASS                        | May 14 evidence: `365` files and `1783` tests passed. Local warning noise included Vite websocket `EPERM`, localstorage-file warnings, and expected negative-path logs.                                                                                                        |
| `npm run build`                 | PASS                        | May 14 evidence: Next.js production build completed. Warnings included `next-intl` webpack cache parsing, large cache string serialization, edge-runtime static-generation warning, and localstorage-file warnings.                                                            |
| `npm run test:privacy`          | PASS after network rerun    | May 14 evidence: sandbox run failed with DNS `ENOTFOUND` for the Supabase test host; approved network rerun passed `2` files and `22` tests.                                                                                                                                   |
| `npm run test:privacy:extended` | PASS after network approval | May 14 evidence: passed `2` files and `31` tests against the Supabase test project.                                                                                                                                                                                            |
| `npm run audit:prod`            | PASS with moderate findings | 2026-05-19 evidence: sandbox run failed with DNS `ENOTFOUND` for npm registry; approved network rerun exited `0` at the high/critical threshold and reported 9 moderate transitive advisories in `protobufjs` via `@xenova/transformers` and `ws` via `react-email`/Socket.IO. |
| `npm run audit:all`             | UNVERIFIED                  | 2026-05-19 sandbox run failed with DNS `ENOTFOUND`; escalated external audit was rejected by local policy because it sends dependency metadata to the npm registry. Rerun only with explicit user approval for that disclosure.                                                |
| `npm run test:launch:routes`    | PASS                        | 2026-05-19 rerun passed `4` files and `25` tests; this is the focused route/archived-surface confirmation used for the route inventory section.                                                                                                                                |
