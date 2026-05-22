import { expect, test } from '@playwright/test';

const isOrgMode = process.env.MOCK_ORG_MODE === 'true';
const VISUAL_ASSIGNMENT_ID = '11111111-1111-4111-8111-111111111111';

async function prepareFilledViewport(page: import('@playwright/test').Page) {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.addInitScript(() => {
    localStorage.setItem('proofound-cookie-consent', 'v1.0.2025-11-06-declined');
  });
}

async function stabilizeFilledState(page: import('@playwright/test').Page) {
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

test.describe('Filled-state visual contract', () => {
  test('individual communications messages stay proof-safe with fixture thread', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Filled-state visual baselines are Chromium-only');
    test.skip(isOrgMode, 'Run individual filled-state contract without MOCK_ORG_MODE=true');

    await prepareFilledViewport(page);
    await page.goto(
      '/app/i/communications?section=messages&conversation=visual-masked-conversation',
      { waitUntil: 'domcontentloaded' }
    );
    await page.waitForResponse(
      (response) => response.url().includes('/api/conversations') && response.status() === 200
    );
    await stabilizeFilledState(page);

    await expect(page.getByRole('heading', { name: 'Organization', level: 3 })).toBeVisible();
    await expect(page.getByText('Identity protected until reveal approval')).toBeVisible();

    await expect(page.getByRole('main', { name: 'Main content' })).toHaveScreenshot(
      'individual-communications-messages-filled.png',
      {
        animations: 'disabled',
        caret: 'hide',
        fullPage: false,
        maxDiffPixelRatio: 0.03,
      }
    );
  });

  test('individual communications interviews show staged workflow fixtures', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Filled-state visual baselines are Chromium-only');
    test.skip(isOrgMode, 'Run individual filled-state contract without MOCK_ORG_MODE=true');

    await prepareFilledViewport(page);
    await page.goto('/app/i/communications?section=interviews', { waitUntil: 'domcontentloaded' });
    await stabilizeFilledState(page);

    await expect(page.getByText('Nordic Future Labs', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Interviews' })).toBeVisible();

    await expect(page.getByRole('main', { name: 'Main content' })).toHaveScreenshot(
      'individual-communications-interviews-filled.png',
      {
        animations: 'disabled',
        caret: 'hide',
        fullPage: false,
        maxDiffPixelRatio: 0.03,
      }
    );
  });

  test('standalone interviews route redirects into communications hub', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Filled-state visual baselines are Chromium-only');
    test.skip(isOrgMode, 'Run individual filled-state contract without MOCK_ORG_MODE=true');

    await prepareFilledViewport(page);
    await page.goto('/app/i/interviews', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/app\/i\/communications\?section=interviews/);
    await expect(page.getByText('Nordic Future Labs', { exact: true })).toBeVisible({
      timeout: 30000,
    });
    await stabilizeFilledState(page);
  });

  test('public portfolio fixture renders proof-first profile', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Filled-state visual baselines are Chromium-only');
    test.skip(isOrgMode, 'Run individual filled-state contract without MOCK_ORG_MODE=true');

    await prepareFilledViewport(page);
    await page.goto('/portfolio/demo-proofound', { waitUntil: 'domcontentloaded' });
    await stabilizeFilledState(page);

    await expect(page.getByRole('heading', { name: 'Mika Andersson' })).toBeVisible();

    await expect(page.getByRole('main')).toHaveScreenshot(
      'public-portfolio-demo-proofound-filled.png',
      {
        animations: 'disabled',
        caret: 'hide',
        fullPage: false,
        maxDiffPixelRatio: 0.03,
      }
    );
  });

  test('individual matching preferences stay focused with fixture profile', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Filled-state visual baselines are Chromium-only');
    test.skip(isOrgMode, 'Run individual filled-state contract without MOCK_ORG_MODE=true');

    await prepareFilledViewport(page);
    await page.goto('/app/i/matching/preferences', { waitUntil: 'domcontentloaded' });
    await stabilizeFilledState(page);

    await expect(page.getByRole('heading', { name: 'Matching Preferences' })).toBeVisible();

    await expect(page.getByRole('main', { name: 'Main content' })).toHaveScreenshot(
      'individual-matching-preferences-filled.png',
      {
        animations: 'disabled',
        caret: 'hide',
        fullPage: false,
        maxDiffPixelRatio: 0.03,
      }
    );
  });

  test('organization home shows active assignment corridor with visual fixtures', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Filled-state visual baselines are Chromium-only');
    test.skip(!isOrgMode, 'Run organization filled-state contract with MOCK_ORG_MODE=true');

    await prepareFilledViewport(page);
    await page.goto('/app/o/test-org/home', { waitUntil: 'domcontentloaded' });
    await stabilizeFilledState(page);

    await expect(page.getByRole('heading', { name: 'Nordic Field Systems' })).toBeVisible();
    await expect(page.getByText('Reviewing submissions')).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'Field operations launch lead for municipal infrastructure handoffs',
      })
    ).toBeVisible();

    await expect(page.getByRole('main', { name: 'Main content' })).toHaveScreenshot(
      'organization-home-active-assignment-filled.png',
      {
        animations: 'disabled',
        caret: 'hide',
        fullPage: false,
        maxDiffPixelRatio: 0.03,
      }
    );
  });

  test('organization assignments corridor shows fixture review queue', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Filled-state visual baselines are Chromium-only');
    test.skip(!isOrgMode, 'Run organization filled-state contract with MOCK_ORG_MODE=true');

    await prepareFilledViewport(page);
    await page.goto('/app/o/test-org/assignments', { waitUntil: 'domcontentloaded' });
    await page.waitForResponse(
      (response) => response.url().includes('/api/assignments') && response.status() === 200
    );
    await stabilizeFilledState(page);

    await expect(
      page.getByRole('heading', {
        name: /Field operations launch lead for municipal infrastructure handoffs/,
      })
    ).toBeVisible();
    await expect(page.getByText(/Review queue \(\d+\)/)).toBeVisible();

    await expect(page.getByRole('main', { name: 'Main content' })).toHaveScreenshot(
      'organization-assignments-filled.png',
      {
        animations: 'disabled',
        caret: 'hide',
        fullPage: false,
        maxDiffPixelRatio: 0.03,
      }
    );
  });

  test('organization assignment review shows internal publish checklist', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Filled-state visual baselines are Chromium-only');
    test.skip(!isOrgMode, 'Run organization filled-state contract with MOCK_ORG_MODE=true');

    await prepareFilledViewport(page);
    await page.goto(`/app/o/test-org/assignments/${VISUAL_ASSIGNMENT_ID}/review`, {
      waitUntil: 'domcontentloaded',
    });
    await stabilizeFilledState(page);

    await expect(page.getByText('Internal review before publish')).toBeVisible();

    await expect(page.getByRole('main', { name: 'Main content' })).toHaveScreenshot(
      'organization-assignment-review-filled.png',
      {
        animations: 'disabled',
        caret: 'hide',
        fullPage: false,
        maxDiffPixelRatio: 0.03,
      }
    );
  });
});
