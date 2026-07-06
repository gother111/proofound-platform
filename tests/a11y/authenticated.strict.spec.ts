/**
 * Accessibility Tests for Authenticated Strict Flows
 *
 * Runs only in strict a11y config with real Supabase-backed fixtures.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  cleanupFixtureData,
  createFixtureState,
  createRuntimeUser,
  loginWithUi,
  type StrictFixtureState,
  type StrictRuntimeUser,
} from '../../e2e/helpers/strict-fixtures';

async function waitForUiToSettle(page: import('@playwright/test').Page) {
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

      const form = document.querySelector('form[aria-label]') as HTMLElement | null;
      if (!form) return true;
      return hasStableOpacity(form);
    },
    { timeout: 15000 }
  );
}

test.describe('Accessibility - Authenticated Strict Flows', () => {
  let fixture: StrictFixtureState;
  let authenticatedUser: StrictRuntimeUser;

  test.beforeAll(async () => {
    fixture = createFixtureState();
    authenticatedUser = await createRuntimeUser(fixture, {
      persona: 'individual',
      prefix: 'strict-a11y',
      displayName: 'Strict A11y User',
    });
  });

  test.afterAll(async () => {
    await cleanupFixtureData(fixture);
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('proofound-cookie-consent', 'v1.0.2025-11-06-accepted');
    });
  });

  test('Profile page should be accessible (authenticated)', async ({ page }) => {
    await loginWithUi(page, authenticatedUser);
    await page.goto('/app/i/profile');
    await waitForUiToSettle(page);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Proof portfolio workspace should be accessible (authenticated)', async ({ page }) => {
    await loginWithUi(page, authenticatedUser);
    await page.goto('/app/i/portfolio');
    await waitForUiToSettle(page);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Dashboard should be accessible (authenticated)', async ({ page }) => {
    await loginWithUi(page, authenticatedUser);
    await page.goto('/app/i/home');
    await waitForUiToSettle(page);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
