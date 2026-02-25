# Project Change Entry

- Date/time (UTC): 2026-02-25T10:24:39Z
- Branch: codex-pro-45-move-visibility-settings
- Base commit: 70020bd0
  What changed:
- Moved portfolio visibility controls component from `src/app/portfolio/[handle]/visibility-card.tsx` to `src/components/settings/PortfolioVisibilityCard.tsx`.
- Updated `src/components/settings/SettingsContent.tsx` to render `PortfolioVisibilityCard` in `Privacy & Data` tab above `PrivacyOverview`.
- Updated `src/app/portfolio/[handle]/page.tsx` to remove the owner-only `PortfolioVisibilityCard` render and obsolete import.
- Added `tests/ui/settings-privacy-visibility-placement.test.tsx` to verify visibility controls are present in privacy settings.
- Updated `tests/ui/settings-integrations-discoverability.test.tsx` to mock `PortfolioVisibilityCard` and keep integrations discoverability test isolated.

Why:

- Resolve PRO-45 by removing visibility controls from the public profile surface and relocating them to settings where privacy controls belong.

How to verify:

- `npm run lint` (PASS)
- `npm run typecheck` (PASS)
- `npm run test -- tests/ui/settings-privacy-visibility-placement.test.tsx tests/ui/settings-integrations-discoverability.test.tsx` (PASS)
- `npm run test` (FAIL: unrelated existing failures in `tests/ui/public-org-portfolio-page.test.tsx` caused by Next request-scope cookies context)

Open risks / TODO:

- Users accustomed to changing visibility on the portfolio page may need one visit to settings to discover the new location.
- Existing unrelated unit test failures remain in `tests/ui/public-org-portfolio-page.test.tsx` and should be handled separately.
