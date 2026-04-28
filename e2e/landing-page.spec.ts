import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the scrollytelling homepage shell', async ({ page }) => {
    const header = page.getByTestId('landing-header');
    await expect(header).toBeVisible();
    await expect(header.getByText(/How it works/i)).toBeVisible();
    await expect(header.getByRole('button', { name: /Request a pilot/i })).toBeVisible();

    const heading = page.getByRole('heading', { name: /Proof behind the claim/i, level: 1 });
    await expect(heading).toBeVisible();

    const story = page.getByTestId('landing-story-section');
    await expect(story).toBeVisible();

    await expect(page.getByRole('button', { name: /Request a pilot/i }).first()).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Create your proof portfolio/i }).first()
    ).toBeVisible();
  });

  test('advances the desktop story as the page scrolls', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1024 });

    const desktopTrack = page.getByTestId('landing-story-desktop-track');
    await expect(desktopTrack).toBeVisible();

    await expect(
      page.getByRole('heading', { name: /Proof behind the claim/i, level: 1 })
    ).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.22));
    await expect(
      page.getByRole('heading', { name: /Real outcomes, not bullet points/i })
    ).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.68));
    await expect(page.getByRole('heading', { name: /Precise solutions/i })).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.82));
    await expect(page.getByRole('heading', { name: /To modern challenges/i })).toBeVisible();
  });

  test('renders the dual-audience final CTA and quiet footer', async ({ page }) => {
    const ctaSection = page.getByTestId('landing-final-cta-section');
    await ctaSection.scrollIntoViewIfNeeded();
    await expect(
      ctaSection.getByRole('heading', { name: /Build hiring on stronger proof/i })
    ).toBeVisible();
    await expect(
      ctaSection.getByRole('button', { name: /Create your proof portfolio/i }).last()
    ).toBeVisible();
    await expect(
      ctaSection.getByRole('button', { name: /Explore evidence-based hiring/i })
    ).toBeVisible();

    const footer = page.getByTestId('landing-footer-section');
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
    await expect(
      footer.getByText(/Evidence-based hiring for a world with too much polished signal/i)
    ).toBeVisible();
    await expect(footer.getByRole('link', { name: /Cookies/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /Cookie settings/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /Privacy/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /Terms/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /Sign in/i })).toBeVisible();
    await expect(
      footer.getByText(new RegExp(`© ${new Date().getFullYear()} Proofound`, 'i'))
    ).toBeVisible();
  });

  test('routes header sign-in and signup CTAs', async ({ page }) => {
    await page
      .getByTestId('landing-header')
      .getByRole('link', { name: /Sign in/i })
      .click();
    await expect(page.getByTestId('login-form-shell')).toBeVisible();

    await page.goto('/');
    await page
      .getByRole('button', { name: /Request a pilot/i })
      .first()
      .click();
    await expect(page.getByTestId('signup-form-shell')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Create your organization account/i })
    ).toBeVisible();

    await page.goto('/');
    await page
      .getByRole('button', { name: /Create your proof portfolio/i })
      .first()
      .click();
    await expect(page.getByTestId('signup-form-shell')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Create your individual account/i })
    ).toBeVisible();
  });

  test('has no console errors', async ({ page }) => {
    const errors: string[] = [];
    const failedAssetResponses: string[] = [];
    const failedRequests: string[] = [];

    page.on('response', (response) => {
      const url = response.url();
      const isImageAsset =
        url.includes('/_next/image') || /\.(avif|gif|jpe?g|m4v|mp4|png|svg|webp)(\?|$)/i.test(url);

      if (isImageAsset && response.status() >= 400) {
        failedAssetResponses.push(`${response.status()} ${url}`);
      }
    });

    page.on('requestfailed', (request) => {
      const url = request.url();
      if (/\.(avif|gif|jpe?g|png|svg|webp)(\?|$)/i.test(url)) {
        failedRequests.push(`${request.failure()?.errorText ?? 'failed'} ${url}`);
      }
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    for (const scrollRatio of [0.15, 0.35, 0.55, 0.75, 0.95]) {
      await page.evaluate((ratio) => {
        window.scrollTo(0, document.documentElement.scrollHeight * ratio);
      }, scrollRatio);
      await page.waitForLoadState('networkidle');
    }

    expect(failedAssetResponses).toEqual([]);
    expect(failedRequests).toEqual([]);
    expect(errors).toHaveLength(0);
  });

  test('renders network background', async ({ page }) => {
    await expect(page.getByTestId('landing-network-background')).toBeVisible();
  });

  test('uses the simplified mobile story on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const mobileStory = page.getByTestId('landing-mobile-story');
    await expect(mobileStory).toBeVisible();
    await expect(
      mobileStory.getByRole('heading', { name: /Proof behind the claim/i, level: 1 })
    ).toBeVisible();
    await expect(
      mobileStory.getByRole('heading', { name: /Real outcomes, not bullet points/i })
    ).toBeVisible();
    await expect(
      mobileStory.getByRole('heading', { name: /Universal compatibility/i }).first()
    ).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('has proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    const h1Count = await page.locator('h1:visible').count();
    expect(h1Count).toBe(1);

    const h2Count = await page.locator('h2').count();
    expect(h2Count).toBeGreaterThan(0);
  });

  test('all images have alt text or are decorative', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaHidden = await img.getAttribute('aria-hidden');

      // Image should have alt text OR be marked as decorative
      expect(alt !== null || ariaHidden === 'true').toBeTruthy();
    }
  });

  test('links have accessible names', async ({ page }) => {
    await page.goto('/');

    const links = page.locator('a');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');

      // Link should have text content OR aria-label
      expect((text && text.trim().length > 0) || ariaLabel).toBeTruthy();
    }
  });
});
