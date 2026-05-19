> Doc Class: `archive`
> Last Verified: `2026-05-19`

# Legacy Go/No-Go Script Archive

This folder preserves the pre-TypeScript `go-no-go-check.mjs` implementation as historical launch-ops context only.

The active command is `npm run go:no-go`, which runs `scripts/go-no-go-check.ts`. The TypeScript gate checks the current MVP launch contract, including launch smoke freshness, restore-readiness script presence, authenticated perf status, launch status, safe-mode flags, AI no-go guards, and optional synthetics.
