# Project Change Entry

- Date/time (UTC): 2026-02-26T19:16:19Z
- Branch: codex-fix-pro59-pdf-export-error
- Base commit: 70020bd

What changed:

- Hardened `GET /api/portfolio/export` to run as `nodejs` and `force-dynamic`, return `Uint8Array` PDF bytes directly, and make analytics emission non-blocking/failure-tolerant.
- Improved `DownloadPdfButton` error handling with status-aware messaging (`401`, `404`, fallback), response type validation, and empty-blob guards.
- Added regression test coverage for `/api/portfolio/export` in `tests/api/portfolio-export-route.test.ts`:
- unauthenticated `401`
- missing profile `404`
- successful PDF headers/body
- analytics failure does not block PDF response

Why:

- PRO-59 reported owner-side PDF download errors on the public individual portfolio profile.
- The export flow lacked route-level tests and blocked on analytics emission in the request path.

How to verify:

- `npm run lint` -> PASS
- `npm run typecheck` -> PASS
- `npm run test -- tests/portfolio-pdf.test.ts tests/api/portfolio-export-route.test.ts` -> PASS (5 tests)
- `npm run test` -> FAIL (unrelated existing failures in `tests/ui/public-org-portfolio-page.test.tsx` about Next request-scope cookies)

Open risks / TODO:

- Full-suite failure is currently unrelated to PRO-59 and remains in `tests/ui/public-org-portfolio-page.test.tsx`.
- Manual owner smoke on `/portfolio/[handle]` in a running app environment is still recommended before release.
