import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the new proof-first homepage with persona CTAs above the fold', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1024 });
    await page.goto('/');

    const header = page.getByTestId('landing-header');
    await expect(header).toBeVisible();
    await expect(header.getByText(/How it works/i)).toBeVisible();
    await expect(header.getByRole('button', { name: /Start screening on proof/i })).toBeVisible();
    await expect(header.getByText(/Request a pilot/i)).toHaveCount(0);

    await expect(
      page.getByRole('heading', {
        name: /Hire and get hired through verified proof, not CV noise/i,
        level: 1,
      })
    ).toBeVisible();

    const individualCta = page.getByTestId('landing-hero-individual-cta');
    const organizationCta = page.getByTestId('landing-hero-organization-cta');
    await expect(individualCta).toBeVisible();
    await expect(organizationCta).toBeVisible();
    await expect(individualCta).toHaveText(/Create your proof profile — free/i);
    await expect(organizationCta).toHaveText(/Start screening on proof/i);

    const viewport = page.viewportSize();
    const individualBox = await individualCta.boundingBox();
    const organizationBox = await organizationCta.boundingBox();
    expect(viewport).not.toBeNull();
    expect(individualBox).not.toBeNull();
    expect(organizationBox).not.toBeNull();
    expect(individualBox!.y + individualBox!.height).toBeLessThanOrEqual(viewport!.height);
    expect(organizationBox!.y + organizationBox!.height).toBeLessThanOrEqual(viewport!.height);

    await expect(page.getByRole('link', { name: /Talk to us/i }).first()).toHaveAttribute(
      'href',
      /mailto:hello@proofound\.io/
    );
  });

  test('renders the requested homepage sections in order and omits insider jargon', async ({
    page,
  }) => {
    const sectionTestIds = [
      'landing-hero-section',
      'landing-how-it-works-section',
      'landing-comparison-section',
      'landing-trust-section',
      'landing-final-cta-section',
      'landing-footer-section',
    ];

    for (const testId of sectionTestIds) {
      await expect(page.getByTestId(testId)).toBeVisible();
    }

    const sectionTops = await Promise.all(
      sectionTestIds.map((testId) =>
        page.getByTestId(testId).evaluate((element) => element.getBoundingClientRect().top)
      )
    );
    expect(sectionTops).toEqual([...sectionTops].sort((a, b) => a - b));

    await expect(
      page.getByRole('heading', { name: /Turn real work into hiring signal/i })
    ).toBeVisible();
    await expect(
      page.getByTestId('landing-comparison-section').getByRole('heading', { name: 'Proofound' })
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: /Trust built on reality/i })).toBeVisible();

    const visibleCopy = (await page.locator('body').innerText()).toLowerCase();
    expect(visibleCopy).not.toContain('corridor');
    expect(visibleCopy).not.toContain('attestation');
    expect(visibleCopy).not.toContain('request a pilot');
    expect(visibleCopy).not.toContain('explain the product in three steps only');
  });

  test('routes primary persona CTAs to the dedicated signup pages', async ({ page }) => {
    await Promise.all([
      page.waitForURL(/\/signup\/individual$/),
      page.getByTestId('landing-hero-individual-cta').click(),
    ]);
    await expect(page.getByTestId('signup-form-shell')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Create your individual account/i })
    ).toBeVisible();

    await page.goto('/');
    await Promise.all([
      page.waitForURL(/\/signup\/organization$/),
      page.getByTestId('landing-hero-organization-cta').click(),
    ]);
    await expect(page.getByTestId('signup-form-shell')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Create your organization account/i })
    ).toBeVisible();
  });

  test('keeps sign-in routing and final dual CTA actions working', async ({ page }) => {
    await Promise.all([
      page.waitForURL(/\/login$/),
      page
        .getByTestId('landing-header')
        .getByRole('link', { name: /Sign in/i })
        .click(),
    ]);
    await expect(page.getByTestId('login-form-shell')).toBeVisible({ timeout: 30_000 });

    await page.goto('/');
    const ctaSection = page.getByTestId('landing-final-cta-section');
    await ctaSection.scrollIntoViewIfNeeded();
    await expect(
      ctaSection.getByRole('heading', { name: /Build hiring on stronger proof/i })
    ).toBeVisible();

    await Promise.all([
      page.waitForURL(/\/signup\/organization$/),
      ctaSection.getByTestId('landing-final-organization-cta').click(),
    ]);
    await expect(page.getByTestId('signup-form-shell')).toBeVisible();
  });

  test('keeps the scrollytelling page reachable at /story without linking it from /', async ({
    page,
  }) => {
    await expect(page.getByRole('link', { name: /story/i })).toHaveCount(0);
    await expect(page.locator('a[href="/story"]')).toHaveCount(0);

    await page.goto('/story');
    await expect(page.getByTestId('landing-story-section')).toBeVisible();
    // Scrollytelling hero is animation-gated; assert it renders, not animated visibility.
    await expect(
      page
        .locator('h1')
        .filter({ hasText: /Proof behind/i })
        .first()
    ).toBeAttached();
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

      expect((text && text.trim().length > 0) || ariaLabel).toBeTruthy();
    }
  });
});
