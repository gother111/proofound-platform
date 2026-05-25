> Doc Class: `governance`
> Sync Pair: `preflight.md`
> Last Verified: `2026-05-19`

# Preflight Checklist (Before Making Changes)

Repo Truth items include citations like `(source: README.md)`. Everything else is policy.

- Read the project memory first: `project/Prompt.md`, `project/Architecture.md`, `project/Plans.md`, `project/Implement.md`, `project/Documentation.md`.
- Use sharded log entries for new work:
  - `npm run log:session` -> `agent/scratchpad/entries/`
  - `npm run log:change` -> `project/changes/entries/`
  - Do not append per-task updates to `agent/scratchpad.md` or `project/Documentation.md`.
- Confirm git state:
  - Run `git status` and ensure you understand what is already modified/uncommitted.
  - Plan to stage only files relevant to the task.
  - For real changes, follow this sequence: branch -> commit -> push -> PR -> checks green -> merge.
  - Never push directly to `master`; use PRs to merge.
- Confirm Node/tooling expectations:
  - Node version matches `.nvmrc` and `package.json` engines. (source: .nvmrc, package.json)
- If you expect deploy impact (Next config, env validation, route handlers, build-time imports):
  - Run `npm run vercel:preflight` to validate local Vercel linkage, expected production branch, and required env key presence.
  - Run the local Vercel pre-commit gate (install/lint/typecheck/test/build + `npm run vercel:pull:production` + `npm run vercel:build:production`) before committing.
  - Confirm `.vercel/output/config.json` and `.vercel/output/builds.json` exist after the prebuilt build.
  - Confirm required GitHub Actions secrets exist (CI uses these for strict E2E gates):
    - `E2E_PROVIDER_USER_ID`, `E2E_PROVIDER_USER_EMAIL`, `E2E_PROVIDER_USER_PASSWORD`
    - Verify via: `gh secret list`
  - Confirm production prebuilt deployment automation is configured:
    - Workflow exists: `.github/workflows/retry-vercel-deploy.yml`
    - GitHub secrets exist: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
    - Health URL in workflow matches the production domain (`https://proofound.io/api/health` unless intentionally changed).
  - If Vercel Git auto-deploys remain enabled for production, expect duplicate deployment activity until they are intentionally disabled in project settings.
- If you touch launch docs, route policy, archived behavior, or operator guidance:
  - Check `docs/DOCS_REGISTRY.md` and `.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md`.
  - Keep active docs dated and classified against the locked MVP corridor, internal launch-ops, archive, or post-MVP.
- If you touch UI, landing, public pages, navigation, or visual hierarchy:
  - Read `DESIGN.md` before editing.
  - Use Browser for representative desktop/mobile route checks when rendered behavior matters.
- If you touch public, privacy, reveal, export/delete, upload, admin, internal-ops, or API route surfaces:
  - Run focused route-surface, privacy/no-leak, and permission tests for the affected surface.
- If you touch database, migrations, storage policies, or production-candidate data:
  - Confirm the target and operator approval before mutation.
  - Run drift, backup/checkpoint, migration audit, repo-owned migrate, and isolated restore verification where production-candidate or production data is involved.
  - Never use `npm run db:push` against production. Use canonical SQL migrations under `src/db/migrations/` and apply via `npm run db:migrate` (prefer `DIRECT_URL` for DDL).
- Confirm env var hygiene:
  - Use `.env.example` and `docs/ENV_VARIABLES.md`; never commit `.env.local` or `.env`. (source: .env.example, docs/ENV_VARIABLES.md, .gitignore)
- Confirm hooks behavior:
  - Husky pre-commit runs `lint-staged` when available. (source: .husky/pre-commit)
- Safety (policy):
  - Do not attempt dependency installs for docs-only work.
  - Do not paste secrets into tracked files.
