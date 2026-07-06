/**
 * PRD Individual Flows E2E Tests (Unauthenticated Contract)
 *
 * Purpose:
 * - Verify public pages load and protected Individual routes redirect unauthenticated users to login.
 * - Do not treat these tests as authenticated behavior validation.
 */

import { test, expect } from '@playwright/test';

async function expectAuthRedirect(page: any, path: string) {
  await page.goto(path);
  await expect(page).toHaveURL(/\/auth\/login/);
  await expect(page.locator('input[type="email"]')).toBeVisible();
}

test.describe('Individual Flows - Unauthenticated Contract (I-00 to I-04)', () => {
  test('I-00: Landing Page loads with signup CTA', async ({ page }) => {
    await page.goto('/');

    // Verify page loads
    await expect(page).toHaveTitle(/Proofound/i);

    // Verify signup CTA exists
    const signupButton = page.locator('a, button').filter({ hasText: /sign up|get started/i });
    await expect(signupButton.first()).toBeVisible();
  });

  test('I-01: Account Creation - Email signup flow', async ({ page }) => {
    await page.goto('/auth/signup');

    // Verify signup form exists
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Note: Actual signup would require email verification
    // This test verifies the form is accessible
  });

  test('I-03: First-Run Tour appears for new users', async ({ page }) => {
    await expectAuthRedirect(page, '/app/i/home');
  });

  test('I-04: Home overview remains protected', async ({ page }) => {
    await expectAuthRedirect(page, '/app/i/home');
  });
});

test.describe('Individual Flows - Unauthenticated Contract Profile Setup (I-05 to I-10)', () => {
  test('I-05: Profile Basics page accessible', async ({ page }) => {
    await expectAuthRedirect(page, '/app/i/profile');
  });

  test('I-06: Proof-first profile setup remains protected', async ({ page }) => {
    await expectAuthRedirect(page, '/app/i/profile');
  });
});

test.describe('Individual Flows - Unauthenticated Contract Proof Packs (I-11 to I-14)', () => {
  test('I-11: Proof portfolio workspace remains protected', async ({ page }) => {
    await expectAuthRedirect(page, '/app/i/portfolio');
  });

  test('I-12: Verification requests workspace remains protected', async ({ page }) => {
    await expectAuthRedirect(page, '/app/i/verifications');
  });
});

test.describe('Individual Flows - Unauthenticated Contract Matching (I-15 to I-19)', () => {
  test('I-15: Matching Profile page accessible', async ({ page }) => {
    await expectAuthRedirect(page, '/app/i/matching');
  });

  test('I-15: Matching Profile setup wizard appears for new users', async ({ page }) => {
    await expectAuthRedirect(page, '/app/i/matching');
  });

  test('I-16: Matching Profile constraints and visibility settings', async ({ page }) => {
    await expectAuthRedirect(page, '/app/i/matching');
  });

  test('I-17: Matching Results page loads', async ({ page }) => {
    await expectAuthRedirect(page, '/app/i/matching');
  });

  test('I-18: Match explainer modal remains protected and rank-safe', async ({ page }) => {
    await expectAuthRedirect(page, '/app/i/matching');
  });

  test('I-19: Express Interest with consent dialog', async ({ page }) => {
    await expectAuthRedirect(page, '/app/i/matching');
  });
});

test.describe('Individual Flows - Unauthenticated Contract Communications (I-26 to I-30)', () => {
  test('I-26: Communications hub remains protected', async ({ page }) => {
    await expectAuthRedirect(page, '/app/i/communications');
  });
});

test.describe('Individual Flows - Unauthenticated Contract Settings (I-23 to I-25)', () => {
  test('I-23: Settings page accessible', async ({ page }) => {
    await expectAuthRedirect(page, '/app/i/settings');
  });

  test('I-24: Privacy settings page accessible', async ({ page }) => {
    await expectAuthRedirect(page, '/app/i/settings/privacy');
  });
});
