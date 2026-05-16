import { expect, test } from '@playwright/test';

async function prepareLandingVisualViewport(
  page: import('@playwright/test').Page,
  viewport: { width: number; height: number }
) {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.setViewportSize(viewport);
  await page.addInitScript(() => {
    const version = 'v1.1.2026-02-12';
    localStorage.setItem('proofound-cookie-consent', `${version}-declined`);
    localStorage.setItem(
      'proofound-cookie-preferences',
      JSON.stringify({
        version,
        essential: true,
        analytics: false,
        marketing: false,
        timestamp: '2026-05-16T00:00:00.000Z',
      })
    );
  });
}

async function stabilizeLandingVisual(page: import('@playwright/test').Page) {
  await expect(page.getByRole('heading', { name: 'Proof behind the claim' })).toBeVisible();

  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }

      nextjs-portal {
        display: none !important;
      }

      [data-nextjs-toast],
      [data-nextjs-dialog-overlay],
      [data-nextjs-dev-tools-button],
      [data-nextjs-build-indicator] {
        display: none !important;
      }
    `,
  });

  await page.evaluate(async () => {
    if ('fonts' in document) {
      await document.fonts.ready;
    }
    window.scrollTo(0, 0);
  });
}

/**
 * Landing visual contract locked to the current proof-first landing baseline.
 *
 * These tests are intentionally Chromium-only to avoid cross-browser
 * rendering noise in CI baseline comparisons.
 */
test.describe('Landing Visual Baseline', () => {
  test('matches desktop baseline screenshot', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Visual baseline is locked to Chromium in CI');

    await prepareLandingVisualViewport(page, { width: 1440, height: 1024 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await stabilizeLandingVisual(page);

    await expect(page).toHaveScreenshot('landing-home-af705d4-linux-chromium.png', {
      animations: 'disabled',
      caret: 'hide',
      fullPage: false,
      // CI font/rasterization variance can exceed 1% even with deterministic styles.
      maxDiffPixelRatio: 0.03,
    });
  });

  test('matches mobile baseline screenshot', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Visual baseline is locked to Chromium in CI');

    await prepareLandingVisualViewport(page, { width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await stabilizeLandingVisual(page);

    await expect(page).toHaveScreenshot('landing-home-mobile-390x844-linux-chromium.png', {
      animations: 'disabled',
      caret: 'hide',
      fullPage: false,
      maxDiffPixelRatio: 0.03,
    });
  });
});
