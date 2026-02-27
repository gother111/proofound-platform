# Project Change Entry

- Date/time (UTC): 2026-02-27T17:21:26Z
- Branch: codex-implement-figma-pdf-profile-design
- Base commit: ec3f28c4

What changed:

- Created Figma PDF template file with two captured variants (individual + organization): [Proofound Public Profile PDF Template](https://www.figma.com/design/M4u99xeJsfYZX1CF62263t).
- Replaced `src/lib/portfolio/pdf.ts` with a branded PDFKit renderer aligned to the Figma template and platform tokens for both individual and organization export layouts.
- Added organization export data loader in `src/lib/portfolio/export-data.ts` via `fetchOrganizationTrustExportData`.
- Added new org export API route: `src/app/api/portfolio/org/[slug]/export/route.ts` with auth + active-member access checks.
- Added org download CTA component: `src/app/portfolio/org/[slug]/DownloadOrganizationPdfButton.tsx`, wired into `src/app/portfolio/org/[slug]/page.tsx` for signed-in active members only.
- Added route-level test coverage for org export (`tests/api/portfolio-org-export-route.test.ts`) and updated `tests/ui/public-org-portfolio-page.test.tsx` mock shape for auth call.

Why:

- Public profile PDF exports were visually inconsistent with the platform design system and only covered the individual portfolio flow.
- Product requirement called for a Figma-designed, platform-consistent template implemented in downloadable PDFs across public profiles.

How to verify:

- `npm run typecheck` (PASS)
- `npm run test -- tests/portfolio-pdf.test.ts tests/api/portfolio-export-route.test.ts tests/api/portfolio-org-export-route.test.ts tests/ui/public-org-portfolio-page.test.tsx` (PASS)
- `npm run lint` (PASS with existing unrelated Next.js warnings in landing files)
- Manual:
- Open `/portfolio/<handle>` as owner and confirm `Download trust PDF` returns branded PDF.
- Open `/portfolio/org/<slug>` as active org member and confirm `Download profile PDF` returns branded org PDF.

Open risks / TODO:

- Individual and org PDFs currently use built-in PDF fonts (`Times-Bold`/`Helvetica`) to avoid runtime font asset dependencies; if exact Crimson Pro rendering is required in PDF bytes, add embedded font assets and register them explicitly.
- Additional pagination logic can be added later for very long narrative sections (current layout intentionally keeps export concise and single-page oriented).
