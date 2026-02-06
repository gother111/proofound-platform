# Verification Checklist (Before Merging)

Repo Truth items include citations like `(source: README.md)`. Anything else is guidance/policy.

## Always (Most PRs)

- Ensure the diff is scoped and intentional.
- Lint: `npm run lint` (source: package.json)
  - Note: lint uses `scripts/lint-or-skip.js`; ensure lint actually ran when required. (source: scripts/lint-or-skip.js)
- Typecheck: `npm run typecheck` (source: package.json)
- Unit tests: `npm run test` (source: package.json)
- Build: `npm run build` (source: package.json)

## Vercel Parity (When Deploy Might Break)

- Ensure Node version matches `.nvmrc`/engines (source: .nvmrc, package.json)
- Pull production project/env settings (creates `.vercel/`, which is gitignored): `npx vercel@latest pull --yes --environment=production` (source: .gitignore)
- Run a prod-equivalent build locally: `npx vercel@latest build --prod`
  - If CLI auth is missing, use `--token` with a valid `VERCEL_TOKEN` (do not print it).

## CI Gate Parity (When Appropriate)

- CI also runs perf budgets and go/no-go gates after starting the app. (source: .github/workflows/ci.yml)
- Perf budgets: `BASE_URL=http://localhost:3000 npm run perf:budgets` (source: scripts/perf-budgets.mjs)
- Go/no-go: `BASE_URL=http://localhost:3000 SUS_STUDY_COMPLETE=true npm run go:no-go` (source: scripts/go-no-go-check.mjs)
  - TODO: Ensure required evidence files exist before relying on this gate; do not invent missing evidence. (source: scripts/go-no-go-check.mjs)

## E2E / Accessibility (If You Touched Critical UX)

- E2E: `npm run test:e2e` (source: package.json)
- A11y: `npm run test:a11y` (source: package.json)
  - TODO: Validate `playwright.a11y.config.ts` exists; do not create it as part of docs-only work. (source: package.json)

## Manual Smoke Checks (OAuth Integrations)

- Zoom connect:
  - Visit `/app/i/settings/integrations`
  - Click "Connect Zoom" and confirm you are redirected to Zoom and then back with `?success=zoom_connected`.
- Meeting creation:
  - Schedule an interview with `platform=zoom` and confirm the record has `meeting_link` populated.

## Husky / lint-staged Policy

- If hooks fail, fix only what affects the intended change set.
- Do not use `git commit --no-verify` unless explicitly approved.
