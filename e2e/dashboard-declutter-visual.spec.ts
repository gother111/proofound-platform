import { expect, test } from '@playwright/test';

const isOrgMode = process.env.MOCK_ORG_MODE === 'true';

async function prepareDashboardViewport(page: import('@playwright/test').Page) {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.addInitScript(() => {
    localStorage.setItem('proofound-cookie-consent', 'v1.0.2025-11-06-declined');
  });
}

async function stabilizeDashboard(page: import('@playwright/test').Page) {
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
}

test.describe('Dashboard declutter visual contract', () => {
  test('individual dashboard keeps only the focused launch surfaces', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Dashboard visual baselines are Chromium-only');
    test.skip(isOrgMode, 'Run individual dashboard contract without MOCK_ORG_MODE=true');

    await prepareDashboardViewport(page);
    await page.goto('/app/i/home', { waitUntil: 'domcontentloaded' });
    await stabilizeDashboard(page);

    await expect(page.getByRole('heading', { name: 'Your Proof Wallet' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Readiness Checklist' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Proof Readiness' })).toBeVisible();

    await expect(page.locator('body')).not.toContainText('Current State');
    await expect(page.locator('body')).not.toContainText('Privacy by design');
    await expect(page.locator('body')).not.toContainText('Trust by default');
    await expect(page.locator('body')).not.toContainText('Identity Verification');
    await expect(page.locator('body')).not.toContainText('Profile active');
    await expect(page.locator('body')).not.toContainText('Request next');

    await expect(page.locator('main')).toHaveScreenshot('individual-dashboard-declutter.png', {
      animations: 'disabled',
      caret: 'hide',
      fullPage: false,
      maxDiffPixelRatio: 0.03,
    });
  });

  test('organization dashboard keeps only the focused launch surfaces', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Dashboard visual baselines are Chromium-only');
    test.skip(!isOrgMode, 'Run organization dashboard contract with MOCK_ORG_MODE=true');

    await prepareDashboardViewport(page);
    await page.goto('/app/o/test-org/home', { waitUntil: 'domcontentloaded' });
    await stabilizeDashboard(page);

    await expect(page.getByRole('heading', { name: 'Corridor Queue' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Launch Summary' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Minimal Access' })).toBeVisible();

    await expect(page.locator('body')).not.toContainText('Selected corridor');
    await expect(page.locator('body')).not.toContainText('Review only what matters');
    await expect(page.locator('body')).not.toContainText('Policy & Trust');
    await expect(page.locator('body')).not.toContainText('Current State');
    await expect(page.locator('body')).not.toContainText('Intake');
    await expect(page.locator('body')).not.toContainText('Validation');
    await expect(page.locator('body')).not.toContainText('Decision');

    await expect(page.locator('main')).toHaveScreenshot('organization-dashboard-declutter.png', {
      animations: 'disabled',
      caret: 'hide',
      fullPage: false,
      maxDiffPixelRatio: 0.03,
    });
  });
});
