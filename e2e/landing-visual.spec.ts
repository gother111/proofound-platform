import { expect, test } from '@playwright/test';

/**
 * Landing visual contract for the locked MVP homepage corridor.
 *
 * This test is intentionally Chromium-only and desktop-only to avoid
 * cross-browser rendering noise in CI baseline comparisons.
 */
test.describe('Landing Visual Baseline (locked MVP)', () => {
  test('matches baseline screenshot', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Visual baseline is locked to Chromium in CI');

    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 1024 });

    await page.goto('/', { waitUntil: 'networkidle' });

    // Make animation-heavy sections deterministic for stable snapshots.
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          caret-color: transparent !important;
        }
      `,
    });

    await page.evaluate(async () => {
      if ('fonts' in document) {
        await document.fonts.ready;
      }
      window.scrollTo(0, 0);
    });

    await expect(page).toHaveScreenshot('landing-home-locked-mvp-linux-chromium.png', {
      animations: 'disabled',
      caret: 'hide',
      fullPage: false,
      maxDiffPixelRatio: 0.03,
    });
  });
});
