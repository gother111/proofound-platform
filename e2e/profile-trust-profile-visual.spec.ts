import { expect, test } from '@playwright/test';

const isOrgMode = process.env.MOCK_ORG_MODE === 'true';

async function prepareProfileViewport(page: import('@playwright/test').Page) {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.addInitScript(() => {
    localStorage.setItem('proofound-cookie-consent', 'v1.0.2025-11-06-declined');
  });
}

async function stabilizeProfile(page: import('@playwright/test').Page) {
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

test.describe('Profile visual contract', () => {
  test('individual profile keeps the proof-first setup focused', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Profile visual baselines are Chromium-only');
    test.skip(isOrgMode, 'Run individual profile contract without MOCK_ORG_MODE=true');

    await prepareProfileViewport(page);
    await page.goto('/app/i/home', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Your Proof Wallet' })).toBeVisible();
    await page.getByRole('link', { name: 'Profile', exact: true }).click();
    await expect(page).toHaveURL(/\/app\/i\/profile/);
    await stabilizeProfile(page);

    await expect(
      page.getByRole('heading', { name: 'Start with proof, not profile polish' })
    ).toBeVisible();
    await expect(page.getByText('Next action')).toBeVisible();
    await expect(page.getByTestId('guided-dominant-proof-cta')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Complete everything');
    await expect(page.locator('body')).not.toContainText('Profile polish checklist');

    await expect(page.locator('main')).toHaveScreenshot('individual-profile-proof-first.png', {
      animations: 'disabled',
      caret: 'hide',
      fullPage: false,
      maxDiffPixelRatio: 0.03,
    });
  });

  test('organization profile keeps launch essentials visible', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Profile visual baselines are Chromium-only');
    test.skip(!isOrgMode, 'Run organization profile contract with MOCK_ORG_MODE=true');

    await prepareProfileViewport(page);
    await page.goto('/app/o/test-org/home', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Corridor Queue' })).toBeVisible();
    await page.getByRole('link', { name: 'Organization Profile', exact: true }).click();
    await expect(page).toHaveURL(/\/app\/o\/test-org\/profile/);
    await stabilizeProfile(page);

    await expect(page.getByRole('heading', { name: 'Organization Profile' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Launch corridor' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Organization profile', exact: true })
    ).toBeVisible();
    await expect(page.getByText('Launch essentials')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Selected corridor');
    await expect(page.locator('body')).not.toContainText('Policy & Trust');

    await expect(page.locator('main')).toHaveScreenshot('organization-trust-profile.png', {
      animations: 'disabled',
      caret: 'hide',
      fullPage: false,
      maxDiffPixelRatio: 0.03,
    });
  });
});
