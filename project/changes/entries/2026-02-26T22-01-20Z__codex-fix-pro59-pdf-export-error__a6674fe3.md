# Project Change Entry

- Date/time (UTC): 2026-02-26T22:01:20Z
- Branch: codex-fix-pro59-pdf-export-error
- Base commit: a6674fe3
  What changed:
- Switched portfolio PDF generation to `pdfkit/js/pdfkit.standalone.js` to avoid serverless AFM font asset lookup failures.
- Added TypeScript module declaration for `pdfkit/js/pdfkit.standalone.js`.
- Enriched `/api/portfolio/export` failure logging with `name` and `message`.
- Deployed branch preview now serves commit `a6674fe3806eccabb2f2cf730f340f2bcfe0a0f8`.

Why:

- Preview runtime logs for prior build showed export `500` with `ENOENT` + `Helvetica` signatures, consistent with missing PDFKit font assets in serverless bundles.
- Standalone PDFKit bundle removes dependency on external AFM file reads in this route path.

How to verify:

- `npm run lint` (PASS)
- `npm run typecheck` (PASS)
- `npm run test -- tests/portfolio-pdf.test.ts tests/api/portfolio-export-route.test.ts` (PASS)
- `curl -sS https://proofound-platform-git-codex-fi-996268-pavlo-samoshkos-projects.vercel.app/api/health` includes version `a6674fe...` (PASS)
- Unauthenticated preview request to `/api/portfolio/export` returns `401` JSON instead of `500` (PASS)

Open risks / TODO:

- Owner-authenticated preview smoke (`Download trust PDF` from `/portfolio/<handle>`) still needs confirmation with a real owner account session.
- Production `proofound.io` is still on `a8e6f035...` until branch is merged/deployed to `master`.
