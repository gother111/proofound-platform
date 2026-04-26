import { expect, test } from '@playwright/test';

const isOrgMode = process.env.MOCK_ORG_MODE === 'true';

async function prepareEmptyStateViewport(page: import('@playwright/test').Page) {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.addInitScript(() => {
    localStorage.setItem('proofound-cookie-consent', 'v1.0.2025-11-06-declined');
  });
}

async function stabilizeEmptyState(page: import('@playwright/test').Page) {
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

test.describe('Matching and messages empty-state visual contract', () => {
  test('individual matching readiness stays focused and uncluttered', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Empty-state visual baselines are Chromium-only');
    test.skip(isOrgMode, 'Run individual empty-state contract without MOCK_ORG_MODE=true');

    await prepareEmptyStateViewport(page);
    await page.goto('/app/i/matching', { waitUntil: 'domcontentloaded' });
    await stabilizeEmptyState(page);

    await expect(page.getByRole('heading', { name: 'Matching' })).toBeVisible();
    await expect(page.getByText('No matches yet')).toBeVisible();
    await expect(page.getByText('Nothing needs your attention right now.')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Perfect-Fit');

    await expect(page.locator('main')).toHaveScreenshot('individual-matching-readiness.png', {
      animations: 'disabled',
      caret: 'hide',
      fullPage: false,
      maxDiffPixelRatio: 0.03,
    });
  });

  test('individual messages empty state explains privacy clearly', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Empty-state visual baselines are Chromium-only');
    test.skip(isOrgMode, 'Run individual empty-state contract without MOCK_ORG_MODE=true');

    await prepareEmptyStateViewport(page);
    await page.goto('/app/i/messages', { waitUntil: 'domcontentloaded' });
    await stabilizeEmptyState(page);

    await expect(page.getByText('No conversations yet')).toBeVisible();
    await expect(
      page.getByText('Your identity remains private until the reveal step.')
    ).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Start matching to begin conversations');

    await expect(page.locator('main')).toHaveScreenshot('individual-messages-empty.png', {
      animations: 'disabled',
      caret: 'hide',
      fullPage: false,
      maxDiffPixelRatio: 0.03,
    });
  });

  test('organization matching empty state shows the corridor sequence', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Empty-state visual baselines are Chromium-only');
    test.skip(!isOrgMode, 'Run organization empty-state contract with MOCK_ORG_MODE=true');

    await prepareEmptyStateViewport(page);
    await page.goto('/app/o/test-org/matching', { waitUntil: 'domcontentloaded' });
    await stabilizeEmptyState(page);

    await expect(
      page.getByRole('heading', { name: 'Open matching with one clear assignment' })
    ).toBeVisible();
    await expect(page.getByText('Corridor sequence')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Find Perfect-Fit Contributors');

    await expect(page.locator('main')).toHaveScreenshot('organization-matching-empty.png', {
      animations: 'disabled',
      caret: 'hide',
      fullPage: false,
      maxDiffPixelRatio: 0.03,
    });
  });

  test('organization messages empty state stays proof-safe', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Empty-state visual baselines are Chromium-only');
    test.skip(!isOrgMode, 'Run organization empty-state contract with MOCK_ORG_MODE=true');

    await prepareEmptyStateViewport(page);
    await page.goto('/app/o/test-org/messages', { waitUntil: 'domcontentloaded' });
    await stabilizeEmptyState(page);

    await expect(page.getByText('No conversations yet')).toBeVisible();
    await expect(
      page.getByText('Candidate identity remains protected before reveal')
    ).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Start matching to begin conversations');

    await expect(page.locator('main')).toHaveScreenshot('organization-messages-empty.png', {
      animations: 'disabled',
      caret: 'hide',
      fullPage: false,
      maxDiffPixelRatio: 0.03,
    });
  });
});
