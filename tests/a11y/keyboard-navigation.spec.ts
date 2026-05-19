/**
 * Keyboard Navigation Tests
 *
 * PRD: Part 8 (lines 1831-1834), Part 12.2
 * Ensures all interactive elements are keyboard accessible
 */

import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation', () => {
  test('Skip to main content link should work', async ({ page }) => {
    await page.goto('/');

    // Tab to focus the skip link (it's hidden until focused)
    await page.keyboard.press('Tab');

    // Check if skip link is visible when focused
    const skipLink = page.getByText('Skip to main content');
    await expect(skipLink).toBeVisible();

    // Press Enter to activate
    await page.keyboard.press('Enter');

    await page.waitForFunction(
      () => {
        const hasMainContent = document.querySelector('#main-content');
        const focusedId = document.activeElement?.id;
        return Boolean(hasMainContent && focusedId === 'main-content');
      },
      { timeout: 5000 }
    );

    const focusedId = await page.evaluate(() => document.activeElement?.id);
    expect(focusedId).toBe('main-content');
  });

  test('Navigation menu should be keyboard accessible', async ({ page }) => {
    await page.goto('/');

    // Tab through navigation items
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // First nav item

    // Should be able to navigate through menu items with Tab
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON']).toContain(focused);
  });

  test('Form inputs should be keyboard accessible', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.getByTestId('login-email');
    const passwordInput = page.getByTestId('login-password');
    const submitButton = page.getByTestId('login-submit');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Tab forward until the email field receives focus.
    // Some browsers or hydration states focus a container or skip links first.
    for (let i = 0; i < 20; i++) {
      if (await emailInput.evaluate((el) => el === document.activeElement)) {
        break;
      }
      await page.keyboard.press('Tab');
    }
    await expect(emailInput).toBeFocused();

    // Type in email
    await page.keyboard.type('test@example.com');

    // Tab forward until the password field receives focus.
    for (let i = 0; i < 25; i++) {
      if (await passwordInput.evaluate((el) => el === document.activeElement)) break;
      await page.keyboard.press('Tab');
    }
    await expect(passwordInput).toBeFocused();
    await page.keyboard.type('password123');

    // Tab forward until the submit button receives focus (there may be intermediate controls
    // like "show password" buttons).
    for (let i = 0; i < 25; i++) {
      if (await submitButton.evaluate((el) => el === document.activeElement)) break;
      await page.keyboard.press('Tab');
    }
    await expect(submitButton).toBeFocused();

    // Press Enter to submit (will fail auth, but that's ok)
    await page.keyboard.press('Enter');
  });

  test.skip('Dialog/Modal should trap focus', async () => {
    // Pending until a stable active MVP dialog fixture is wired into the a11y suite.
  });

  test.skip('Dropdown menus should be keyboard accessible', async () => {
    // Pending until a stable active MVP dropdown fixture is wired into the a11y suite.
  });

  test.skip('Tables should be keyboard navigable', async () => {
    // Pending until an active MVP table/grid fixture is wired into the a11y suite.
  });
});

test.describe('Focus Management', () => {
  test('Focus should be visible', async ({ page }) => {
    await page.goto('/');

    // Tab to first interactive element
    await page.keyboard.press('Tab');

    // Check that focus indicator is visible
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;

      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineColor: styles.outlineColor,
        outlineWidth: styles.outlineWidth,
      };
    });

    // Should have some kind of outline
    expect(focused).toBeTruthy();
    expect(focused?.outlineWidth).not.toBe('0px');
  });

  test('Focus should not be trapped on page load', async ({ page }) => {
    await page.goto('/');

    // Should be able to tab through all interactive elements
    let tabCount = 0;
    const maxTabs = 50; // Reasonable limit

    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      tabCount++;

      // If we've tabbed back to body, we've cycled through all elements
      const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
      if (focusedTag === 'BODY' && tabCount > 1) {
        break;
      }
    }

    expect(tabCount).toBeLessThan(maxTabs);
  });

  test.skip('Focus should return to trigger after closing modal', async () => {
    // Pending until a stable active MVP dialog fixture is wired into the a11y suite.
  });
});

test.describe('ARIA Labels and Roles', () => {
  test('Buttons should have accessible names', async ({ page }) => {
    await page.goto('/');

    // All buttons should have accessible names
    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      const accessibleName =
        (await button.getAttribute('aria-label')) ||
        (await button.textContent()) ||
        (await button.getAttribute('title'));

      expect(accessibleName).toBeTruthy();
    }
  });

  test('Images should have alt text', async ({ page }) => {
    await page.goto('/');

    // All images should have alt text (or role="presentation" if decorative)
    const images = await page.locator('img').all();

    for (const img of images) {
      const hasAlt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');

      // Either has alt text, or is marked as decorative
      expect(hasAlt !== null || role === 'presentation').toBeTruthy();
    }
  });

  test('Form inputs should have labels', async ({ page }) => {
    await page.goto('/login');

    // All form inputs should have associated labels
    const inputs = await page
      .locator('input[type="email"], input[type="password"], input[type="text"]')
      .all();

    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      // Should have either:
      // - An ID that matches a label's "for" attribute
      // - An aria-label
      // - An aria-labelledby
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        expect(label > 0 || ariaLabel || ariaLabelledBy).toBeTruthy();
      } else {
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });
});
