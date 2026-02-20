# Project Change Entry

- Date/time (UTC): 2026-02-20T11:46:29Z
- Branch: codex-seo-sitemap-robots
- Base commit: 8bffc494
  What changed:
- Added generated sitemap route at `src/app/sitemap.ts` for public marketing/legal pages.
- Updated `src/app/robots.txt/route.ts` to compute sitemap URL from `NEXT_PUBLIC_SITE_URL` / `SITE_URL` with `https://proofound.io` fallback.

Why:

- Complete SEO infrastructure after landing merge so crawlers can discover canonical public URLs automatically and consistently across environments.

How to verify:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Open `/robots.txt` and verify it includes `Sitemap: <site-url>/sitemap.xml`.
- Open `/sitemap.xml` and verify homepage + marketing/legal paths are listed.

Open risks / TODO:

- Ensure production `NEXT_PUBLIC_SITE_URL` / `SITE_URL` remains canonical to avoid non-prod sitemap URLs in crawl directives.
