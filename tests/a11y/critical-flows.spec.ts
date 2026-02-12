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
  // Many screens use Framer Motion fade-ins. Axe can misreport contrast if run mid-animation.
  await page.waitForFunction(
    () => {
      const hasStableOpacity = (node: HTMLElement | null) => {
        let el: HTMLElement | null = node;
        while (el && el !== document.body) {
          // Framer Motion sets opacity inline during animation.
          if (el.style && el.style.opacity && getComputedStyle(el).opacity !== '1') {
            return false;
          }
          el = el.parentElement;
        }
        return true;
      };

      const isVisible = (node: HTMLElement | null) => {
        if (!node) return false;
        const style = getComputedStyle(node);
        return style.display !== 'none' && style.visibility !== 'hidden';
      };

      if (window.location.pathname === '/signup') {
        const nodes = Array.from(document.querySelectorAll<HTMLElement>('h3, span, button, a, p'));
        const individualHeading =
          nodes.find((node) => node.textContent?.trim() === 'Individual') ?? null;
        const individualCta =
          nodes.find((node) => node.textContent?.includes('Continue as Individual')) ?? null;

        return (
          isVisible(individualHeading) &&
          isVisible(individualCta) &&
          hasStableOpacity(individualHeading) &&
          hasStableOpacity(individualCta)
        );
      }

      const form = document.querySelector('form[aria-label]') as HTMLElement | null;
      if (!form) return true;
      return hasStableOpacity(form);
    },
    { timeout: 7000 }
  );
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
