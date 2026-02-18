/**
 * Accessibility Tests for Public Critical Flows
 *
 * PRD: Part 8 (lines 1831-1834), Part 12.2
 * WCAG 2.1 AA compliance verification
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
          if (el.style && el.style.opacity) {
            const currentOpacity = Number.parseFloat(getComputedStyle(el).opacity || '1');
            if (!Number.isNaN(currentOpacity) && currentOpacity < 0.99) {
              return false;
            }
          }
          if (
            el.style &&
            el.style.opacity &&
            Number.isNaN(Number.parseFloat(getComputedStyle(el).opacity))
          ) {
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
        const marker = document.querySelector(
          '[data-testid="signup-choice-screen"], [data-testid="signup-form"]'
        );
        if (!marker) return false;

        const indicator = Array.from(document.querySelectorAll<HTMLElement>('h3, h1, button, a, p'))
          .map((node) => node.textContent?.trim())
          .filter(Boolean)
          .some((text) => text?.includes('Continue as Individual'));

        const hasChoice = indicator || false;

        return (
          hasChoice && isVisible(marker as HTMLElement) && hasStableOpacity(marker as HTMLElement)
        );
      }

      const form = document.querySelector('form[aria-label]') as HTMLElement | null;
      if (!form) return true;
      return hasStableOpacity(form);
    },
    { timeout: 15000 }
  );
}

test.describe('Accessibility - Public Critical Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('proofound-cookie-consent', 'v1.0.2025-11-06-accepted');
    });
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
});
