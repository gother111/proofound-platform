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
import {
  cleanupFixtureData,
  createFixtureState,
  createRuntimeUser,
  loginWithUi,
  type StrictFixtureState,
  type StrictRuntimeUser,
} from '../../e2e/helpers/strict-fixtures';

const hasStrictFixtureEnv =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
const requiresAuthenticatedFixtures =
  hasStrictFixtureEnv && process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE !== 'true';

async function waitForUiToSettle(page: import('@playwright/test').Page) {
  // Many screens use Framer Motion fade-ins. Axe can misreport contrast if run mid-animation.
  await page.waitForFunction(
    () => {
      const hasStableOpacity = (node: HTMLElement | null) => {
        let el: HTMLElement | null = node;
        while (el && el !== document.body) {
          // Framer Motion sets opacity inline during animation.
          if (el.style && el.style.opacity) {
            const currentOpacity = Number.parseFloat(getComputedStyle(el).opacity || '1');
            if (!Number.isNaN(currentOpacity) && currentOpacity < 0.99) {
              return false;
            }
          }
          if (el.style && el.style.transform && getComputedStyle(el).transform.includes('matrix')) {
            // Let transform animations settle enough for stable scanning.
            // We do not need perfect identity matrix to run axe reliably.
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
    { timeout: 15000 }
  );
}

test.describe('Accessibility - Critical Flows', () => {
  let fixture: StrictFixtureState | null = null;
  let authenticatedUser: StrictRuntimeUser | null = null;

  test.beforeAll(async () => {
    if (!requiresAuthenticatedFixtures) {
      return;
    }

    fixture = createFixtureState();
    authenticatedUser = await createRuntimeUser(fixture, {
      persona: 'individual',
      prefix: 'strict-a11y',
      displayName: 'Strict A11y User',
    });
  });

  test.afterAll(async () => {
    if (!fixture) {
      return;
    }

    await cleanupFixtureData(fixture);
  });

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

  async function loginAsAuthenticatedUser(page: import('@playwright/test').Page) {
    if (!authenticatedUser) {
      throw new Error('Authenticated fixture user is not initialized');
    }

    await loginWithUi(page, authenticatedUser);
  }

  test('Profile page should be accessible (authenticated)', async ({ page }) => {
    if (!requiresAuthenticatedFixtures) {
      return;
    }
    await loginAsAuthenticatedUser(page);
    await page.goto('/app/i/profile');
    await waitForUiToSettle(page);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Expertise hub should be accessible (authenticated)', async ({ page }) => {
    if (!requiresAuthenticatedFixtures) {
      return;
    }
    await loginAsAuthenticatedUser(page);
    await page.goto('/app/i/expertise');
    await waitForUiToSettle(page);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Dashboard should be accessible (authenticated)', async ({ page }) => {
    if (!requiresAuthenticatedFixtures) {
      return;
    }
    await loginAsAuthenticatedUser(page);
    await page.goto('/app/i/home');
    await waitForUiToSettle(page);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
