import { expect, test } from '@playwright/test';
import { generateTestUser } from './helpers/auth';

/**
 * Authentication E2E Tests (Mock Contract)
 *
 * These tests validate the visible user flows for:
 * - Signup (individual and organization)
 * - Login
 * - Password reset
 * - Email verification
 *
 * Intended to run with NEXT_PUBLIC_USE_MOCK_SUPABASE=true.
 * This suite is fast feedback for local development.
 * The strict launch gate runs through e2e/auth.real.spec.ts.
 */

test.describe('Authentication', () => {
  async function openSignupForm(
    page: import('@playwright/test').Page,
    type: 'individual' | 'organization'
  ) {
    await page.goto('/signup');
    await expect(page.getByTestId('signup-choice-screen')).toBeVisible();

    if (type === 'individual') {
      await page.getByTestId('signup-choice-individual').click();
    } else {
      await page.getByTestId('signup-choice-organization').click();
    }

    await expect(page.getByTestId('signup-form')).toBeVisible();
  }

  test.beforeEach(async ({ page }) => {
    // Prevent the cookie banner from overlaying CTA buttons/inputs during tests.
    await page.addInitScript(() => {
      localStorage.setItem('proofound-cookie-consent', 'v1.0.2025-11-06-declined');
    });
  });

  test.describe('Signup Flow', () => {
    test('should allow individual user to sign up', async ({ page }) => {
      const user = generateTestUser('individual');

      await openSignupForm(page, 'individual');
      await expect(page).toHaveTitle(/sign up|create account/i);

      await page.getByTestId('signup-email').fill(user.email);
      await page.getByTestId('signup-password').fill(user.password);
      await page.getByTestId('signup-confirm-password').fill(user.password);
      await page.getByTestId('gdpr-consent').check();

      await page.getByTestId('signup-submit').click();

      await expect(page.getByTestId('signup-success')).toBeVisible();
      await expect(page.getByText(user.email)).toBeVisible();
    });

    test('should allow organization user to sign up', async ({ page }) => {
      const user = generateTestUser('organization');

      await openSignupForm(page, 'organization');

      await page.getByTestId('signup-email').fill(user.email);
      await page.getByTestId('signup-password').fill(user.password);
      await page.getByTestId('signup-confirm-password').fill(user.password);
      await page.getByTestId('gdpr-consent').check();

      await page.getByTestId('signup-submit').click();

      await expect(page.getByTestId('signup-success')).toBeVisible();
      await expect(page.getByText(user.email)).toBeVisible();
    });

    test('should show error for invalid email', async ({ page }) => {
      await openSignupForm(page, 'individual');

      await page.getByTestId('signup-email').fill('invalid-email');
      await page.getByTestId('signup-password').fill('ValidPassword123!');
      await page.getByTestId('signup-confirm-password').fill('ValidPassword123!');
      await page.getByTestId('gdpr-consent').check();

      await page.getByTestId('signup-submit').click();

      await expect(page.getByTestId('signup-error')).toContainText(/valid email/i);
    });

    test('should show error for weak password', async ({ page }) => {
      await openSignupForm(page, 'individual');

      await page.getByTestId('signup-email').fill('test@example.com');
      await page.getByTestId('signup-password').fill('weak');
      await page.getByTestId('signup-confirm-password').fill('weak');
      await page.getByTestId('gdpr-consent').check();

      await page.getByTestId('signup-submit').click();

      await expect(page.getByTestId('signup-error')).toContainText(/at least 8 characters/i);
    });

    test('should show error for duplicate email', async ({ page }) => {
      await openSignupForm(page, 'individual');

      await page.getByTestId('signup-email').fill('existing@test.com');
      await page.getByTestId('signup-password').fill('ValidPassword123!');
      await page.getByTestId('signup-confirm-password').fill('ValidPassword123!');
      await page.getByTestId('gdpr-consent').check();

      await page.getByTestId('signup-submit').click();

      await expect(page.getByTestId('signup-error')).toContainText(
        /already exists|already registered/i
      );
    });
  });

  test.describe('Login Flow', () => {
    test('should allow user to login with valid credentials', async ({ page }) => {
      await page.goto('/login');
      await expect(page).toHaveTitle(/sign in|log in/i);

      await page.getByTestId('login-email').fill('test@example.com');
      await page.getByTestId('login-password').fill('TestPassword123!');
      await page.getByTestId('login-submit').click();

      await page.waitForURL(/\/app\//, { timeout: 15000 });
      await expect(page).toHaveURL(/\/app\//);
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.getByTestId('login-email').fill('nonexistent@example.com');
      await page.getByTestId('login-password').fill('WrongPassword123!');
      await page.getByTestId('login-submit').click();

      await expect(page.getByTestId('login-error')).toContainText(
        /email or password is incorrect/i
      );
    });

    test('should show error for missing email', async ({ page }) => {
      await page.goto('/login');

      await page.getByTestId('login-password').fill('SomePassword123!');
      await page.getByTestId('login-submit').click();

      await expect(page.getByTestId('login-error')).toContainText(/enter your email address/i);
    });

    test('should show error for missing password', async ({ page }) => {
      await page.goto('/login');

      await page.getByTestId('login-email').fill('test@example.com');
      await page.getByTestId('login-submit').click();

      await expect(page.getByTestId('login-error')).toContainText(/enter your password/i);
    });

    test('should have link to signup page', async ({ page }) => {
      await page.goto('/login');

      const signupLink = page.getByRole('link', { name: /create account|sign up|register/i });
      await expect(signupLink).toBeVisible();

      await signupLink.click();
      // In dev mode Next may need to compile the target route on first navigation.
      await page.waitForURL(/signup/, { timeout: 15000 });
      await expect(page).toHaveURL(/signup/);
    });

    test('should have link to password reset', async ({ page }) => {
      await page.goto('/login');

      const resetLink = page.getByRole('link', { name: /forgot|reset password/i });
      await expect(resetLink).toBeVisible();

      await resetLink.click();
      await page.waitForURL(/reset-password/, { timeout: 15000 });
      await expect(page).toHaveURL(/reset-password/);
    });
  });

  test.describe('Password Reset Flow', () => {
    test('should show password reset form', async ({ page }) => {
      await page.goto('/reset-password');

      await expect(page.getByTestId('reset-password-form')).toBeVisible();
      await expect(page.getByTestId('reset-password-email')).toBeVisible();
      await expect(page.getByTestId('reset-password-submit')).toBeVisible();
    });

    test('should accept email and show success message', async ({ page }) => {
      await page.goto('/reset-password');

      await page.getByTestId('reset-password-email').fill('test@example.com');
      await page.getByTestId('reset-password-submit').click();

      await expect(page.getByTestId('reset-password-success')).toBeVisible({ timeout: 10000 });
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/reset-password');

      await page.getByTestId('reset-password-email').fill('invalid-email');
      await page.getByTestId('reset-password-submit').click();

      await expect(page.getByTestId('reset-password-error')).toContainText(/valid email/i);
    });

    test('should have link back to login', async ({ page }) => {
      await page.goto('/reset-password');

      const loginLink = page.getByRole('link', { name: /back to login|sign in/i });
      await expect(loginLink).toBeVisible();

      await loginLink.click();
      await page.waitForURL(/login/, { timeout: 15000 });
      await expect(page).toHaveURL(/login/);
    });
  });

  test.describe('Email Verification', () => {
    test('should show email verification page', async ({ page }) => {
      await page.goto('/verify-email?token=test-token');
      await expect(page.getByTestId('verify-email-success')).toBeVisible({ timeout: 15000 });
    });

    test('should show error for invalid token', async ({ page }) => {
      await page.goto('/verify-email?token=invalid-token-12345');
      await expect(page.getByTestId('verify-email-error')).toContainText(
        /invalid or expired verification link/i,
        {
          timeout: 15000,
        }
      );
    });

    test('should handle missing token', async ({ page }) => {
      await page.goto('/verify-email');
      await expect(page.getByTestId('verify-email-error')).toContainText(
        /no verification token provided/i
      );
    });
  });
});
