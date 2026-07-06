> Doc Class: `governance`
> Last Verified: `2026-05-19`

# GEO Audit Workflow

Use this runbook when auditing Proofound public web surfaces for generative engine optimization without importing third-party Claude skill packs directly into the repo. GEO work must not widen the locked MVP public surface.

## Scope

- Active public launch pages: `/`, public portfolio pages, public organization trust pages, and active assignment/public-share pages when enabled by route policy.
- Trust and legal pages: `/privacy`, `/terms`, `/cookies`, `/cookies/settings`
- Technical surfaces: `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/llms-full.txt`
- Public portfolios are privacy-gated and should be audited only through their existing publication rules
- Archived public marketing pages such as `/about`, `/manifesto`, `/careers`, `/contact`, and `/support` should remain unavailable as launch surfaces unless `src/lib/launch/surface-policy.ts` changes.

## Command

```bash
npm run geo:audit -- https://proofound.io
```

Optional output file:

```bash
npm run geo:audit -- https://proofound.io --output artifacts/geo-audit/proofound-io.md
```

## What It Checks

- Canonical, robots, Open Graph, and Twitter metadata presence
- SSR JSON-LD presence in the initial HTML response
- Simple AI-citability heuristics for paragraphs, headings, and list structure
- `robots.txt` treatment of major AI crawlers
- `sitemap.xml` size and portfolio URL presence
- `llms.txt` and `llms-full.txt` availability
- Archived public marketing pages return the route-policy outcome instead of being treated as missing SEO content

## Guardrails

- Treat the repo as the source of truth for visibility and privacy semantics.
- Never add structured data that exposes fields hidden by portfolio visibility controls.
- Do not interpret a public portfolio route as indexable unless it is already `public_indexable`.
- If GEO recommendations conflict with privacy or trust constraints, privacy wins.
- Do not add or revive broad marketing pages just to improve GEO coverage during MVP launch hardening.
