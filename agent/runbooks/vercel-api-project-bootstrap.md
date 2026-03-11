> Doc Class: `runbook`
> Last Verified: `2026-03-11`

# Vercel API Project Bootstrap

Use this runbook when the repo-side `apps/api` extraction needs a dedicated Vercel project.

## Goal

- Create or update the `proofound-platform-api` project with `apps/api` as its root directory.
- Sync the canonical environment variables from `proofound-platform`.
- Verify the API project can build independently before routing public `/api/*` traffic to it.

## Prerequisites

- `VERCEL_TOKEN` is available in the shell.
- `VERCEL_ORG_ID` is available, or the repo is already linked through `.vercel/project.json`.
- The canonical web project is still `proofound-platform`.

## Commands

- Ensure the child project exists and has the expected root:
  - `npm run vercel:api:ensure`
- Sync env vars from the canonical project:
  - `npm run vercel:api:sync-env`
- Do both in sequence:
  - `npm run vercel:api:bootstrap`

## Local linking for deploys

- Link the repository for multi-project Vercel usage:
  - `npx -y vercel@latest link --repo --yes --token "$VERCEL_TOKEN"`
- Link `apps/api` to the dedicated project:
  - `npx -y vercel@latest link --yes --project proofound-platform-api --team "$VERCEL_ORG_ID" --cwd apps/api --token "$VERCEL_TOKEN"`

## Verification

- Local API build:
  - `npm run build:api`
- Remote preview deploy:
  - `npx -y vercel@latest deploy --cwd apps/api --yes --token "$VERCEL_TOKEN"`
- Health check on the preview deployment:
  - `curl -sS https://<deployment-host>/api/health`

## Current limitation

- This runbook creates and verifies the API project, but it does not cut over `proofound.io/api/*` traffic yet.
- Same-domain rewrites must be added separately after the child project has a stable deployment path.
