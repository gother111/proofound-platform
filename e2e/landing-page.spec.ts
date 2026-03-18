import { test, expect } from '@playwright/test';

/**
 * Landing Page Smoke Tests
 * Verifies all major sections render after theme refresh
 */

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders hero section with main heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /Proofound/i, level: 1 });
    await expect(heading).toBeVisible();
    const hero = page.getByTestId('landing-hero-section');
    await expect(hero).toBeVisible();

    await expect(
      page.getByRole('heading', {
        name: /Stronger signal than CVs, built from proof/i,
        level: 2,
      })
    ).toBeVisible();

    await expect(hero.getByText(/Add proof into a Proof Pack/i)).toBeVisible();
    await expect(hero.getByText('Blind by default', { exact: true })).toBeVisible();
    await expect(
      hero.getByText('Identity-bearing reveal only with candidate consent', { exact: true })
    ).toBeVisible();

    await expect(hero.getByRole('button', { name: /Join as an Individual/i })).toBeVisible();
    await expect(hero.getByRole('button', { name: /Join as an Organization/i })).toBeVisible();
  });

  test('header menu opens and closes via the X button', async ({ page }) => {
    const openButton = page.getByTestId('landing-menu-trigger');
    await expect(openButton).toBeVisible();
    await openButton.click();

    const nav = page.getByTestId('landing-menu-nav');
    await expect(nav).toBeVisible();

    // Guard against the "empty overlay" regression where the menu is technically visible,
    // but rendered off-screen due to conflicting positioning classes.
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    const navBox = await nav.boundingBox();
    expect(navBox).not.toBeNull();
    expect(navBox!.y).toBeGreaterThanOrEqual(0);
    expect(navBox!.y).toBeLessThan(viewport!.height);
    expect(navBox!.y + navBox!.height).toBeLessThanOrEqual(viewport!.height);

    await expect(nav.getByText('How it Works', { exact: true })).toBeVisible();
    await expect(nav.getByText('For Organizations', { exact: true })).toBeVisible();
    await expect(nav.getByText('Trust & Privacy', { exact: true })).toBeVisible();
    await expect(nav.getByText('Log in', { exact: true })).toBeVisible();
    await expect(nav.getByText('Mission', { exact: true })).toHaveCount(0);
    await expect(nav.getByText('Pricing', { exact: true })).toHaveCount(0);

    const closeButton = page.getByTestId('landing-menu-close');
    await expect(closeButton).toBeVisible();
    const closeBox = await closeButton.boundingBox();
    expect(closeBox).not.toBeNull();
    expect(closeBox!.y).toBeGreaterThanOrEqual(0);
    expect(closeBox!.y).toBeLessThan(viewport!.height);
    await closeButton.click();

    await expect(nav).toBeHidden();
    await expect(openButton).toBeVisible();
  });

  test('renders personas split panels on desktop', async ({ page }) => {
    const personas = page.getByTestId('landing-personas-section');
    await expect(personas).toBeVisible();

    await expect(
      personas.getByRole('heading', { name: /One corridor, clear value on both sides/i })
    ).toBeVisible();

    const cardHeadings = personas.locator('h3');
    await expect(cardHeadings.nth(0)).toHaveText(/For Organizations/i);
    await expect(cardHeadings.nth(1)).toHaveText(/For Individuals/i);

    await expect(personas.getByText(/Publish a clear organization trust page/i)).toBeVisible();
    await expect(personas.getByText(/Review proof-backed summaries/i)).toBeVisible();
    await expect(personas.getByText(/Start with add proof/i)).toBeVisible();
    await expect(personas.getByText(/portfolio-ready is easy while intro-eligible/i)).toBeVisible();
  });

  test('renders trust and privacy section', async ({ page }) => {
    const proof = page.locator('#proof');
    await expect(proof).toBeVisible();

    await expect(
      proof.getByRole('heading', { name: /Trust and privacy stay inside the corridor/i })
    ).toBeVisible();

    await expect(
      proof.getByRole('heading', { name: /Proof Pack is the canonical proof object/i })
    ).toBeVisible();
    await expect(
      proof.getByRole('heading', { name: /Identity-bearing reveal requires consent/i })
    ).toBeVisible();
    await expect(proof.getByRole('button', { name: /Explore our protocol/i })).toHaveCount(0);
  });

  test('renders CTA section', async ({ page }) => {
    const ctaHeading = page.getByRole('heading', { name: /Start with proof/i });
    await expect(ctaHeading).toBeVisible();
    const ctaSection = page.getByTestId('landing-final-cta-section');

    const ctaButton = ctaSection.getByRole('button', { name: /Get Started/i });
    await expect(ctaButton).toBeVisible();
  });

  test('renders footer', async ({ page }) => {
    const footer = page.getByTestId('landing-footer-section');
    await expect(footer).toBeVisible();

    await expect(footer.getByText(/Proof-backed review for a hiring corridor/i)).toBeVisible();

    await expect(footer.getByRole('link', { name: /Privacy Policy/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /Email/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /Manifesto/i })).toHaveCount(0);

    const footerHashes = await footer
      .locator('a')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    expect(footerHashes).not.toContain('#');

    await expect(footer.getByText(/© \d{4} Proofound/i)).toBeVisible();
  });

  test('has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });

  test('renders network background', async ({ page }) => {
    await expect(page.getByTestId('landing-network-background')).toBeVisible();
  });

  test('maintains responsive layout on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const heading = page.getByRole('heading', { name: /Proofound/i, level: 1 });
    await expect(heading).toBeVisible();
    const hero = page.getByTestId('landing-hero-section');
    await expect(hero).toBeVisible();

    await expect(hero.getByRole('button', { name: /Join as an Individual/i })).toBeVisible();
    await expect(hero.getByRole('button', { name: /Join as an Organization/i })).toBeVisible();

    const personas = page.getByTestId('landing-personas-section');
    await personas.scrollIntoViewIfNeeded();
    await expect(
      personas.getByRole('heading', { name: /One corridor, clear value on both sides/i })
    ).toBeVisible();
  });

  test('cookie banner does not block landing CTAs outside the consent card', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('proofound-cookie-consent');
    });

    await page.goto('/');

    const cookieBanner = page.getByRole('heading', { name: /We Value Your Privacy/i });
    await expect(cookieBanner).toBeVisible();

    const finalCtaSection = page.getByTestId('landing-final-cta-section');
    await finalCtaSection.scrollIntoViewIfNeeded();

    const finalCta = finalCtaSection.getByRole('button', { name: /^Get Started$/i });
    await expect(finalCta).toBeVisible();
    await finalCta.click();

    await page.waitForURL((url) => url.pathname === '/signup');
    expect(new URL(page.url()).pathname).toBe('/signup');
  });

  test('all sections are in correct order', async ({ page }) => {
    const sections = page.locator('main').locator('section');
    const count = await sections.count();

    expect(count).toBe(5);

    const sectionIds = await sections.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('id') ?? node.getAttribute('data-testid') ?? '')
    );

    expect(sectionIds).toEqual([
      'landing-hero-section',
      'how-it-works',
      'personas',
      'proof',
      'landing-final-cta-section',
    ]);
  });

  test('color tokens are applied', async ({ page }) => {
    // Check that brand colors are applied
    const heroHeading = page.getByRole('heading', { name: /Proofound/i, level: 1 });

    const styles = await heroHeading.evaluate((el) => {
      const headingColor = window.getComputedStyle(el).color;
      const bodyColor = window.getComputedStyle(document.body).color;
      const bgColor = window.getComputedStyle(document.body).backgroundColor;
      return { headingColor, bodyColor, bgColor };
    });

    expect(styles.headingColor).toMatch(/^rgb/);
    expect(styles.bgColor).toMatch(/^rgb/);
    expect(styles.headingColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(styles.headingColor).not.toBe(styles.bgColor);
  });
});

test.describe('Accessibility', () => {
  test('has proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Check h1 exists and is unique
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);

    // Check h2 exists
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
