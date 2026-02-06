# Preflight Checklist (Before Making Changes)

Repo Truth items include citations like `(source: README.md)`. Everything else is policy.

- Read the project memory first: `project/Prompt.md`, `project/Architecture.md`, `project/Plans.md`, `project/Implement.md`, `project/Documentation.md`.
- Confirm git state:
  - Run `git status` and ensure you understand what is already modified/uncommitted.
  - Plan to stage only files relevant to the task.
- Confirm Node/tooling expectations:
  - Node version matches `.nvmrc` and `package.json` engines. (source: .nvmrc, package.json)
- If you expect deploy impact (Next config, env validation, route handlers, build-time imports):
  - Run the local Vercel pre-commit gate (install/lint/typecheck/test/build + `vercel build --prod`) before committing.
- Confirm env var hygiene:
  - Use `.env.example` and `docs/ENV_VARIABLES.md`; never commit `.env.local` or `.env`. (source: .env.example, docs/ENV_VARIABLES.md, .gitignore)
- Confirm hooks behavior:
  - Husky pre-commit runs `lint-staged` when available. (source: .husky/pre-commit)
- Safety (policy):
  - Do not attempt dependency installs for docs-only work.
  - Do not paste secrets into tracked files.
