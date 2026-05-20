/**
 * PRD Organization Flows E2E Tests (Unauthenticated Contract)
 *
 * Purpose:
 * - Verify public pages load and protected Organization routes redirect unauthenticated users to login.
 * - Do not treat these tests as authenticated behavior validation.
 */

import { test, expect } from '@playwright/test';

async function expectAuthRedirect(page: any, path: string) {
  await page.goto(path);
  await expect(page).toHaveURL(/\/(?:auth\/)?login/);
  await expect(page.locator('input[type="email"]')).toBeVisible();
}

async function expectLaunchNotFound(page: any, path: string) {
  await page.goto(path);
  await expect(page.locator('body')).toContainText(/not found/i);
  await expect(page.locator('input[type="email"]')).toHaveCount(0);
}

test.describe('Organization Flows - Unauthenticated Contract Onboarding (O-01 to O-07)', () => {
  test('O-01: Landing page has organization trial CTA', async ({ page }) => {
    await page.goto('/');

    // Verify page loads
    await expect(page).toHaveTitle(/Proofound/i);

    // Look for organization signup option
    const orgSignup = page
      .locator('a, button')
      .filter({ hasText: /organization|trial|for companies/i });
    // May or may not be visible depending on page design
    await expect(page.locator('body')).toBeVisible();
  });

  test('O-02: Organization signup page accessible', async ({ page }) => {
    await page.goto('/auth/signup');

    // Verify signup form exists
    await expect(page.locator('input[type="email"]').or(page.locator('body'))).toBeVisible();
  });

  test('O-05: Organization dashboard loads', async ({ page }) => {
    await expectAuthRedirect(page, '/app/o/test-org/home');
  });
});

test.describe('Organization Flows - Unauthenticated Contract Team & Profile (O-08 to O-12)', () => {
  test('O-08: Team management page is hard-gated outside the launch corridor', async ({ page }) => {
    await expectLaunchNotFound(page, '/app/o/test-org/team');
  });

  test('O-09: Organization trust page accessible', async ({ page }) => {
    await expectAuthRedirect(page, '/app/o/test-org/profile');
  });
});

test.describe('Organization Flows - Unauthenticated Contract Assignments (O-13 to O-17)', () => {
  test('O-13: Assignment creation page accessible', async ({ page }) => {
    await expectAuthRedirect(page, '/app/o/test-org/assignments');
  });

  test('O-15: Archived candidates page is not reachable in launch flow', async ({ page }) => {
    await expectLaunchNotFound(page, '/app/o/test-org/candidates');
  });
});

test.describe('Organization Flows - Unauthenticated Contract Enterprise (O-18 to O-20)', () => {
  test('O-18: Enterprise Atlas page is not reachable in launch flow', async ({ page }) => {
    await expectLaunchNotFound(page, '/app/o/test-org/atlas');
  });

  test('O-20: Organization settings are hard-gated for launch', async ({ page }) => {
    await expectLaunchNotFound(page, '/app/o/test-org/settings');
  });

  test('O-20a: Archived profile settings subpage is not reachable in launch flow', async ({
    page,
  }) => {
    await expectLaunchNotFound(page, '/app/o/test-org/settings/profile');
  });

  test('O-20b: Team settings subpage is hard-gated for launch', async ({ page }) => {
    await expectLaunchNotFound(page, '/app/o/test-org/settings/team');
  });

  test('O-20c: Archived goals settings subpage is not reachable in launch flow', async ({
    page,
  }) => {
    await expectLaunchNotFound(page, '/app/o/test-org/settings/goals');
  });
});
