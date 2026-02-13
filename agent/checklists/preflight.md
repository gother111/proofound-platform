> Doc Class: `governance`
> Sync Pair: `preflight.md`
> Last Verified: `2026-02-12`

# Preflight Checklist (Before Making Changes)

Repo Truth items include citations like `(source: README.md)`. Everything else is policy.

- Read the project memory first: `project/Prompt.md`, `project/Architecture.md`, `project/Plans.md`, `project/Implement.md`, `project/Documentation.md`.
- Confirm git state:
  - Run `git status` and ensure you understand what is already modified/uncommitted.
  - Plan to stage only files relevant to the task.
  - For real changes, follow this sequence: branch -> commit -> push -> PR -> checks green -> merge.
  - Never push directly to `master`; use PRs to merge.
- Confirm Node/tooling expectations:
  - Node version matches `.nvmrc` and `package.json` engines. (source: .nvmrc, package.json)
- If you expect deploy impact (Next config, env validation, route handlers, build-time imports):
  - Run `npm run vercel:preflight` to validate local Vercel linkage, expected production branch, and required env key presence.
  - Run the local Vercel pre-commit gate (install/lint/typecheck/test/build + `vercel build --prod`) before committing.
  - Confirm required GitHub Actions secrets exist (CI uses these for strict E2E gates):
    - `E2E_PROVIDER_USER_ID`, `E2E_PROVIDER_USER_EMAIL`, `E2E_PROVIDER_USER_PASSWORD`
    - Verify via: `gh secret list`
  - Confirm deploy-retry automation is configured:
    - Workflow exists: `.github/workflows/retry-vercel-deploy.yml`
    - GitHub secret exists: `VERCEL_DEPLOY_HOOK_URL`
    - Health URL in workflow matches the production domain (`https://proofound.io/api/health` unless intentionally changed).
- Confirm env var hygiene:
  - Use `.env.example` and `docs/ENV_VARIABLES.md`; never commit `.env.local` or `.env`. (source: .env.example, docs/ENV_VARIABLES.md, .gitignore)
- Confirm hooks behavior:
  - Husky pre-commit runs `lint-staged` when available. (source: .husky/pre-commit)
- Safety (policy):
  - Do not attempt dependency installs for docs-only work.
  - Do not paste secrets into tracked files.
  - Never use `npm run db:push` against production. Use canonical SQL migrations under `src/db/migrations/` and apply via `npm run db:migrate` (prefer `DIRECT_URL` for DDL).
