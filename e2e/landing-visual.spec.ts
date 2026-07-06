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
  await expect(
    page.getByRole('heading', {
      name: 'Hire and get hired through verified proof, not CV noise',
    })
  ).toBeVisible();

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

async function expectHeroCtasInsideViewport(page: import('@playwright/test').Page) {
  const viewport = page.viewportSize();
  const individualBox = await page.getByTestId('landing-hero-individual-cta').boundingBox();
  const organizationBox = await page.getByTestId('landing-hero-organization-cta').boundingBox();

  expect(viewport).not.toBeNull();
  expect(individualBox).not.toBeNull();
  expect(organizationBox).not.toBeNull();
  expect(individualBox!.y + individualBox!.height).toBeLessThanOrEqual(viewport!.height);
  expect(organizationBox!.y + organizationBox!.height).toBeLessThanOrEqual(viewport!.height);
}

async function expectRenderedScreenshot(page: import('@playwright/test').Page) {
  const screenshot = await page.screenshot({
    fullPage: false,
  });

  expect(screenshot.byteLength).toBeGreaterThan(40_000);
}

test.describe('Landing Visual Smoke', () => {
  test('renders the desktop hero without hiding primary actions', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Visual smoke is locked to Chromium in CI');

    await prepareLandingVisualViewport(page, { width: 1440, height: 1024 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await stabilizeLandingVisual(page);

    await expect(page.getByTestId('landing-hero-section')).toBeVisible();
    await expectHeroCtasInsideViewport(page);
    await expect(page.getByTestId('landing-header')).toBeVisible();
    await expectRenderedScreenshot(page);
  });

  test('renders the mobile hero without horizontal overflow', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Visual smoke is locked to Chromium in CI');

    await prepareLandingVisualViewport(page, { width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await stabilizeLandingVisual(page);

    await expect(page.getByTestId('landing-hero-section')).toBeVisible();
    await expectHeroCtasInsideViewport(page);
    await expect(page.getByTestId('landing-header')).toBeVisible();
    await expect(page.getByRole('link', { name: /Talk to us/i }).first()).toBeVisible();

    const hasNoHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1
    );
    expect(hasNoHorizontalOverflow).toBe(true);
    await expectRenderedScreenshot(page);
  });
});
