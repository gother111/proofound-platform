# Current Repo Summary

Generated: 2026-05-14T11:40:35.794Z

## Repository State

- Branch: `master`
- Commit: `0cd61d6944dab03348cbee44322861230dc8c1a3`
- Git status summary: 76 changed/untracked entries

```text
M .artifacts/launch-readiness-summary.md
 M .artifacts/proofound-priority-file-map.md
 M .artifacts/proofound-route-inventory.md
 M .artifacts/stale-build-state-cleanup-summary.md
 M .github/workflows/ci.yml
 M .github/workflows/strict-quality.yml
 M .nvmrc
 M AGENTS.md
 M Architecture.md
 M CROSS_DOCUMENT_PRIVACY_AUDIT.md
 M DATA_SECURITY_PRIVACY_ARCHITECTURE.md
 M DESIGN.md
 M IDENTITY_VERIFICATION_IMPLEMENTATION.md
 M Implement.md
 M LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md
 M MCP_STATUS.md
 M PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md
 M PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md
 M PRD_TECHNICAL_REQUIREMENTS.md
 M PRD_for_a_web_platform_MVP.master-latest.md
 M PRD_for_a_web_platform_MVP.md
 M PRODUCTION_CHECKLIST.md
 M Plans.md
 M Prompt.md
 M Proofound_Core_User_Flows_v1.md
 M Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md
 M Proofound_PRD_MVP.md
 M README.md
 M SYSTEM_ARCHITECTURE_COMPREHENSIVE.md
 M SYSTEM_ARCHITECTURE_SUPPLEMENT.md
 M USER_FLOWS_TECHNICAL_SPECIFICATIONS.md
 M VERCEL_CRON_LIMIT_WORKAROUND.md
 M agent/checklists/verification.md
 M agent/runbooks/setup.md
 M docs/API_REFERENCE.md
 M docs/CRON_SETUP.md
 M docs/DEPLOYMENT_CHECKLIST.md
 M docs/DOCS_REGISTRY.md
 M docs/ENV_VARIABLES.md
 M docs/deployment-guide.md
 M docs/local-dev.md
 M docs/mvp-launch-master-checklist.md
 M package-lock.json
 M package.json
 M project/Architecture.md
 M project/Implement.md
 M project/Plans.md
 M project/Prompt.md
 M scripts/generate-api-reference.mjs
 M scripts/lib/cron-job-org-config.mjs
 D scripts/next-dev-node20.mjs
 D scripts/playwright-node20.mjs
 M scripts/run-mvp-strict-gates.mjs
 M scripts/smoke-learning-provider.ts
 M services/gcp-cv-ocr/package-lock.json
 M services/gcp-cv-ocr/package.json
 M setup.md
 D src/app/api/data-export/route.ts
 M src/lib/launch/__tests__/surface-policy.test.ts
 M src/lib/launch/final-launch-validation-runner.ts
 M src/lib/launch/surface-policy.ts
 D tests/api/data-export-route.test.ts
 M tests/api/launch-surface-inventory.test.ts
 M tests/scripts/cron-scheduling.test.ts
 M tests/scripts/launch-gate-config.test.ts
 M tests/scripts/proofound-ticket-finisher.test.ts
 M tests/ui/command-palette-archived-links.test.tsx
 M tests/ui/verifications-page.test.tsx
 M vercel.json
?? .artifacts/launch-validation-2026-05-14/
?? .artifacts/project-source-refresh-2026-05-14/
?? agent/scratchpad/entries/2026-05-14T09-34-57Z__master__ae792f40.md
?? docs/CURRENT_TRUTH.md
?? project/changes/entries/2026-05-14T09-34-48Z__master__ae792f40.md
?? scripts/next-dev-node24.mjs
?? scripts/playwright-node24.mjs
```

## Runtime And Package Manager

- Launch-gate Node/npm: `v24.15.0` / `11.12.1` from `/opt/homebrew/opt/node@24/bin`
- Evidence-generation Node/npm after Node 24 PATH override: `v24.15.0` / `11.12.1`
- packageManager: `npm@11.12.1`
- engines.node: `24.x`
- Lockfiles present: `package-lock.json`

## Framework Versions

- next: `^15.5.18`
- react: `^18.2.0`
- reactDom: `^18.2.0`
- typescript: `^5`
- tailwind: `^3.3.0`
- supabase: `^2.39.7`
- drizzle: `^0.45.2`
- sentry: `^10.27.0`
- vercelAnalytics: `^1.5.0`

## Deployment Stack Visible In Repo

- Next.js App Router on Vercel.
- Supabase Auth/Postgres/Storage with Drizzle ORM.
- Resend/React Email for transactional email.
- Sentry, Vercel Analytics, Vercel Speed Insights, and Vercel/KV references are present.
- Cron and launch monitor routes are implemented under `src/app/api/cron/**` and `src/app/api/monitoring/**`.

## Current Route Surface

- Current app route count: 49
- Current API route count: 138
- Classification counts: `active_launch_path=155`, `internal_only_launch_ops=19`, `archived=13`

## Verification Summary

- Command results: 17 PASS, 2 FAIL, 0 BLOCKED.
- Current build status: PASS.
- Current test status summary: lint/typecheck/default test/privacy/extended privacy/route tests/landing/strict org corridor all passed in current logs.
- Current launch-readiness status: aggregate local repo launch validation is `GO` with 0 P0 blockers; explicit local launch smoke is `fail` because `full_org_corridor_review_to_engagement_verification` failed.

## Current Blockers / Risks

- Explicit `npm run test:launch:smoke -- --base-url http://localhost:3000` failed the full org corridor review-to-engagement-verification scenario.
- `monitor:launch` failed because the fresh launch smoke artifact was failing and reported P1/P2 monitor failures.
- `launch:validate` produced GO only because launch smoke was not applicable without `BASE_URL`; do not use it alone as live launch proof.
- Worktree is dirty and includes many pre-existing changes outside this package.

## Safe To Treat As Current Docs

- `agent/scratchpad/README.md`
- `docs/API_REFERENCE.md`
- `docs/backlog/README.md`
- `docs/CRON_SETUP.md`
- `docs/DEPLOYMENT_CHECKLIST.md`
- `docs/ENV_VARIABLES.md`
- `project/changes/README.md`
- `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md`

## Docs That Look Stale Or Superseded

- `.artifacts/codebase-structure-audit.md`
- `.artifacts/final-post-fix-backend-security-privacy-mvp-readiness-audit-2026-04-29-rerun.md`
- `.artifacts/final-post-fix-backend-security-privacy-mvp-readiness-audit-2026-04-29.md`
- `.artifacts/launch-readiness-summary.md`
- `.artifacts/launch-validation-2026-03-25/26_go_no_go_memo.md`
- `.artifacts/launch-validation-2026-03-25/final-launch-checklist-status.md`
- `.artifacts/launch-validation-2026-04-14/final-launch-checklist-status.md`
- `.artifacts/launch-validation-2026-04-15/final-launch-checklist-status.md`
- `.artifacts/launch-validation-2026-04-15/full-launch-execution-checklist.md`
- `.artifacts/launch-validation-2026-04-24/final-launch-checklist-status.md`
- `.artifacts/launch-validation-2026-04-24/full-launch-execution-checklist.md`
- `.artifacts/launch-validation-2026-04-24/mvp-browser-launch-readiness-continuation.md`
- `.artifacts/launch-validation-2026-04-27/final-launch-checklist-status.md`
- `.artifacts/launch-validation-2026-04-27/full-launch-execution-checklist.md`
- `.artifacts/launch-validation-2026-04-29/final-launch-checklist-status.md`
- `.artifacts/launch-validation-2026-04-30/final-launch-checklist-status.md`
- `.artifacts/launch-validation-2026-04-30/full-launch-execution-checklist.md`
- `.artifacts/launch-validation-2026-05-02/final-launch-checklist-status.md`
- `.artifacts/launch-validation-2026-05-14/final-launch-checklist-status.md`
- `.artifacts/launch-validation-test-0E5oIP/final-launch-checklist-status.md`
- `.artifacts/launch-validation-test-2u3wsM/final-launch-checklist-status.md`
- `.artifacts/launch-validation-test-6aSWUx/final-launch-checklist-status.md`
- `.artifacts/launch-validation-test-6qVUrm/final-launch-checklist-status.md`
- `.artifacts/launch-validation-test-7JVn3w/final-launch-checklist-status.md`
- `.artifacts/launch-validation-test-92GFqX/final-launch-checklist-status.md`
- `.artifacts/launch-validation-test-A9zYEc/final-launch-checklist-status.md`
- `.artifacts/launch-validation-test-abpKxt/final-launch-checklist-status.md`
- `.artifacts/launch-validation-test-aJAIAd/final-launch-checklist-status.md`
- `.artifacts/launch-validation-test-azylWd/final-launch-checklist-status.md`
- `.artifacts/launch-validation-test-bO5yrr/final-launch-checklist-status.md`
- `.artifacts/launch-validation-test-BzqzlK/final-launch-checklist-status.md`
- `.artifacts/launch-validation-test-C2jliw/final-launch-checklist-status.md`
- `.artifacts/launch-validation-test-Cv3U3W/final-launch-checklist-status.md`
- `.artifacts/launch-validation-test-ddNdmS/final-launch-checklist-status.md`
- `.artifacts/launch-validation-test-fUGqC6/final-launch-checklist-status.md`
- `.artifacts/launch-validation-test-HQFBbe/final-launch-checklist-status.md`
- `.artifacts/launch-validation-test-I4ZnoF/final-launch-checklist-status.md`
- `.artifacts/launch-validation-test-i8SgOC/final-launch-checklist-status.md`
- `.artifacts/launch-validation-test-IXNAwa/final-launch-checklist-status.md`
- `.artifacts/launch-validation-test-JRYskf/final-launch-checklist-status.md`
