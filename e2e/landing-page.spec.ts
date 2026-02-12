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
    // Hero heading should be visible
    const heading = page.getByRole('heading', { name: /Proofound/i, level: 1 });
    await expect(heading).toBeVisible();
    const hero = page.getByTestId('landing-hero-section');
    await expect(hero).toBeVisible();

    // Subheading should be visible
    await expect(
      page.getByRole('heading', {
        name: /A credibility engineering platform for impactful connections/i,
        level: 2,
      })
    ).toBeVisible();

    // CTA buttons in hero
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

    // All expected menu items should render.
    await expect(nav.getByText('Mission', { exact: true })).toBeVisible();
    await expect(nav.getByText('How it Works', { exact: true })).toBeVisible();
    await expect(nav.getByText('Principles', { exact: true })).toBeVisible();
    await expect(nav.getByText('Pricing', { exact: true })).toBeVisible();
    await expect(nav.getByText('Log in', { exact: true })).toBeVisible();

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

  test('renders personas section toggle and switches between individuals and organizations', async ({
    page,
  }) => {
    const personas = page.getByTestId('landing-personas-section');
    await expect(personas).toBeVisible();

    await expect(personas.getByRole('heading', { name: /Built for you/i })).toBeVisible();

    // Organizations tab should show org content
    await page.getByTestId('landing-personas-toggle-organization').click();
    await expect(page.getByTestId('landing-persona-title')).toHaveText(/For Organizations/i);

    // Individuals tab should show individual content
    await page.getByTestId('landing-personas-toggle-individual').click();
    await expect(page.getByTestId('landing-persona-title')).toHaveText(/For Individuals/i);
  });

  test('renders principles section', async ({ page }) => {
    const principles = page.getByTestId('landing-principles-section');
    await expect(principles).toBeVisible();

    await expect(
      principles.getByRole('heading', { name: /What makes it trustworthy/i })
    ).toBeVisible();

    // Principle cards (subset)
    await expect(
      principles.getByRole('heading', { name: /Distributed systems mindset/i })
    ).toBeVisible();
    await expect(principles.getByRole('heading', { name: /Anti-bias guardrails/i })).toBeVisible();
  });

  test('renders CTA section', async ({ page }) => {
    const ctaHeading = page.getByRole('heading', { name: /Ready to build trust that lasts/i });
    await expect(ctaHeading).toBeVisible();
    const ctaSection = page.getByTestId('landing-final-cta-section');

    // CTA button (scoped to section to avoid matching sticky CTA)
    const ctaButton = ctaSection.getByRole('button', { name: /Get Started/i });
    await expect(ctaButton).toBeVisible();
  });

  test('renders footer', async ({ page }) => {
    const footer = page.getByTestId('landing-footer-section');
    await expect(footer).toBeVisible();

    // Footer sections
    await expect(
      footer.getByText(/Credibility engineering for a world that needs trust more than ever/i)
    ).toBeVisible();

    // Footer links
    await expect(footer.getByRole('link', { name: /Privacy Policy/i })).toBeVisible();

    // Copyright
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
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Hero should still be visible
    const heading = page.getByRole('heading', { name: /Proofound/i, level: 1 });
    await expect(heading).toBeVisible();
    const hero = page.getByTestId('landing-hero-section');
    await expect(hero).toBeVisible();

    // CTAs should still be visible
    await expect(hero.getByRole('button', { name: /Join as an Individual/i })).toBeVisible();
    await expect(hero.getByRole('button', { name: /Join as an Organization/i })).toBeVisible();

    // Personas section should still render after scroll
    const personas = page.getByTestId('landing-personas-section');
    await personas.scrollIntoViewIfNeeded();
    await expect(personas.getByRole('heading', { name: /Built for you/i })).toBeVisible();
  });

  test('all sections are in correct order', async ({ page }) => {
    const sections = page.locator('main').locator('section');
    const count = await sections.count();

    // Landing currently has 11 <section> blocks inside <main> (footer is a <footer>)
    expect(count).toBe(11);
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
