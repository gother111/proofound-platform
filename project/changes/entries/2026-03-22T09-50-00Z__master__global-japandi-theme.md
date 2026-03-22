## 2026-03-22: Global Japandi theme rollout

What changed:

- Replaced the global Proofound color system with a unified Japandi palette in `src/app/globals.css`, `tailwind.config.ts`, and `src/design/brand-tokens.json`.
- Removed active dark-mode token behavior and fixed the toast layer to use the light theme consistently.
- Updated public snippet generation and rendering so new and existing shared snippets use the Japandi light theme by default.
- Refreshed `docs/STYLEMAP.md` so the active design-system guidance matches the new global palette and light-only theme contract.

Why:

- The app was using a split visual system: legacy forest/terracotta colors across product surfaces and a softer Japandi palette on the landing page. This rollout makes the whole app feel like one product.

How to verify:

- `npm run lint`
- `npm run build`
- `npm run typecheck`
- `npm run docs:freshness`
- `npm run test:e2e:landing`
- `npm run test:e2e:landing:visual`
- Manually inspect `/`, `/login`, `/signup`, `/reset-password`, and a public snippet/share flow for palette consistency and readable contrast.

Open follow-ups:

- There are still dormant `dark:` utility branches across the repo. They no longer define a supported theme surface, but they should be cleaned up incrementally when those areas are touched next.
