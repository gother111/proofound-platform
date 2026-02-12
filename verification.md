# Verification Checklist (Mirror)

> Doc Class: `governance`
> Sync Pair: `agent/checklists/verification.md`
> Last Verified: `2026-02-12`

## Core Verification

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Docs Verification

- `npm run docs:freshness`

## Optional Live Verification

- `curl -sS https://proofound.io/api/health`
- Vercel deployment status and environment key presence checks

## Canonical Reference

- `agent/checklists/verification.md`
