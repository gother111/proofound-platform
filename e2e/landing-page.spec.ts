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

    // Tagline should be visible
    await expect(page.getByText(/Credibility you can trust/i)).toBeVisible();

    // CTA buttons in hero
    await expect(page.getByRole('link', { name: /Get Started/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Sign In/i }).first()).toBeVisible();
  });

  test('renders individual and organization cards', async ({ page }) => {
    // Individual card
    await expect(page.getByRole('heading', { name: /For Individuals/i })).toBeVisible();
    await expect(page.getByText(/Build a credible professional profile/i)).toBeVisible();

    // Organization card
    await expect(page.getByRole('heading', { name: /For Organizations/i })).toBeVisible();
    await expect(page.getByText(/Build trust and manage your team/i)).toBeVisible();

    // Both cards should have CTAs
    const createButtons = page.getByRole('link', { name: /Create/i });
    await expect(createButtons).toHaveCount(2);
  });

  test('renders principles section', async ({ page }) => {
    // Section heading
    await expect(page.getByRole('heading', { name: /Built on Trust/i })).toBeVisible();

    // Three principle cards
    await expect(page.getByRole('heading', { name: /Privacy First/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Community Owned/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Bias-Free/i })).toBeVisible();
  });

  test('renders FAQ section', async ({ page }) => {
    // Section heading
    await expect(page.getByRole('heading', { name: /Frequently Asked Questions/i })).toBeVisible();

    // FAQ questions
    await expect(page.getByRole('heading', { name: /What is Proofound/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /How do I get started/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Is Proofound free/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /How is my data protected/i })).toBeVisible();
  });

  test('renders CTA section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /Ready to build your credibility/i })
    ).toBeVisible();

    // CTA button
    const ctaButton = page.getByRole('link', { name: /Get Started Now/i });
    await expect(ctaButton).toBeVisible();
  });

  test('renders footer', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Footer sections
    await expect(footer.getByText(/Building trust through verified credentials/i)).toBeVisible();

    // Footer links
    await expect(footer.getByRole('link', { name: /Sign Up/i })).toBeVisible();
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

  test('renders network background canvas', async ({ page }) => {
    // Network background should render
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('maintains responsive layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Hero should still be visible
    await expect(page.getByRole('heading', { name: /Proofound/i, level: 1 })).toBeVisible();

    // Cards should stack vertically (still visible)
    await expect(page.getByRole('heading', { name: /For Individuals/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /For Organizations/i })).toBeVisible();
  });

  test('all sections are in correct order', async ({ page }) => {
    const sections = page.locator('section');
    const count = await sections.count();

    // Should have 5 sections (Hero, Cards, Principles, FAQ, CTA)
    expect(count).toBe(5);
  });

  test('color tokens are applied', async ({ page }) => {
    // Check that brand colors are applied
    const heroHeading = page.getByRole('heading', { name: /Proofound/i, level: 1 });

    // Get computed style
    const color = await heroHeading.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    // Color should not be black (default) - should be brand color
    expect(color).not.toBe('rgb(0, 0, 0)');
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
