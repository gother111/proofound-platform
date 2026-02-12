/**
 * Accessibility Tests for Critical User Flows
 *
 * PRD: Part 8 (lines 1831-1834), Part 12.2
 * WCAG 2.1 AA compliance verification
 *
 * Tests critical paths for keyboard navigation and screen reader compatibility
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function waitForUiToSettle(page: import('@playwright/test').Page) {
  await page.waitForLoadState('domcontentloaded');

  await page.waitForFunction(
    () => {
      if (!('fonts' in document) || !document.fonts) return true;
      return document.fonts.status === 'loaded';
    },
    { timeout: 15000 }
  );

  const path = page.url();
  if (path.includes('/login')) {
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible({
      timeout: 15000,
    });
  }

  if (path.includes('/signup')) {
    await expect(page.getByRole('heading', { name: /join proofound/i })).toBeVisible({
      timeout: 15000,
    });
  }
}

test.describe('Accessibility - Critical Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Set up any authentication if needed
    // For now, we'll test public pages
  });

  test('Homepage should be accessible', async ({ page }) => {
    await page.goto('/');
    await waitForUiToSettle(page);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Login page should be accessible', async ({ page }) => {
    await page.goto('/login');
    await waitForUiToSettle(page);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Signup page should be accessible', async ({ page }) => {
    await page.goto('/signup');
    await waitForUiToSettle(page);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Profile page should be accessible (authenticated)', async ({ page }) => {
    // TODO: Add authentication setup
    // await page.goto('/app/i/profile');
    // const accessibilityScanResults = await new AxeBuilder({ page })
    //   .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    //   .analyze();
    // expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Expertise hub should be accessible (authenticated)', async ({ page }) => {
    // TODO: Add authentication setup
    // await page.goto('/app/i/expertise');
    // const accessibilityScanResults = await new AxeBuilder({ page })
    //   .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    //   .analyze();
    // expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Dashboard should be accessible (authenticated)', async ({ page }) => {
    // TODO: Add authentication setup
    // await page.goto('/app/i/dashboard');
    // const accessibilityScanResults = await new AxeBuilder({ page })
    //   .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    //   .analyze();
    // expect(accessibilityScanResults.violations).toEqual([]);
  });
});
