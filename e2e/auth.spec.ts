import { expect, test } from '@playwright/test';
import { generateTestUser } from './helpers/auth';

/**
 * Authentication E2E Tests (Auth-only)
 *
 * These tests validate the visible user flows for:
 * - Signup (individual and organization)
 * - Login
 * - Password reset
 * - Email verification
 *
 * Intended to run with:
 * NEXT_PUBLIC_USE_MOCK_SUPABASE=true
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Prevent the cookie banner from overlaying CTA buttons/inputs during tests.
    await page.addInitScript(() => {
      localStorage.setItem('proofound-cookie-consent', 'v1.0.2025-11-06-declined');
    });
  });

  test.describe('Signup Flow', () => {
    test('should allow individual user to sign up', async ({ page }) => {
      const user = generateTestUser('individual');

      await page.goto('/signup');
      await expect(page).toHaveTitle(/sign up|create account/i);

      await page.getByRole('button', { name: /continue as individual/i }).click();

      await page.locator('input[name="email"]').fill(user.email);
      await page.locator('input[name="password"]').fill(user.password);
      await page.locator('input[name="confirmPassword"]').fill(user.password);
      await page.getByTestId('gdpr-consent').check();

      await page.getByRole('button', { name: /create account/i }).click();

      await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible();
      await expect(page.getByText(user.email)).toBeVisible();
    });

    test('should allow organization user to sign up', async ({ page }) => {
      const user = generateTestUser('organization');

      await page.goto('/signup');
      await page.getByRole('button', { name: /continue as organization/i }).click();

      await page.locator('input[name="email"]').fill(user.email);
      await page.locator('input[name="password"]').fill(user.password);
      await page.locator('input[name="confirmPassword"]').fill(user.password);
      await page.getByTestId('gdpr-consent').check();

      await page
        .getByRole('button', { name: /create organization account|create account/i })
        .click();

      await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible();
      await expect(page.getByText(user.email)).toBeVisible();
    });

    test('should show error for invalid email', async ({ page }) => {
      await page.goto('/signup');
      await page.getByRole('button', { name: /continue as individual/i }).click();

      await page.locator('input[name="email"]').fill('invalid-email');
      await page.locator('input[name="password"]').fill('ValidPassword123!');
      await page.locator('input[name="confirmPassword"]').fill('ValidPassword123!');
      await page.getByTestId('gdpr-consent').check();

      await page.getByRole('button', { name: /create account/i }).click();

      await expect(page.getByText(/valid email/i)).toBeVisible();
    });

    test('should show error for weak password', async ({ page }) => {
      await page.goto('/signup');
      await page.getByRole('button', { name: /continue as individual/i }).click();

      await page.locator('input[name="email"]').fill('test@example.com');
      await page.locator('input[name="password"]').fill('weak');
      await page.locator('input[name="confirmPassword"]').fill('weak');
      await page.getByTestId('gdpr-consent').check();

      await page.getByRole('button', { name: /create account/i }).click();

      await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
    });

    test('should show error for duplicate email', async ({ page }) => {
      await page.goto('/signup');
      await page.getByRole('button', { name: /continue as individual/i }).click();

      await page.locator('input[name="email"]').fill('existing@test.com');
      await page.locator('input[name="password"]').fill('ValidPassword123!');
      await page.locator('input[name="confirmPassword"]').fill('ValidPassword123!');
      await page.getByTestId('gdpr-consent').check();

      await page.getByRole('button', { name: /create account/i }).click();

      await expect(page.getByText(/already exists|already registered/i)).toBeVisible();
    });
  });

  test.describe('Login Flow', () => {
    test('should allow user to login with valid credentials', async ({ page }) => {
      await page.goto('/login');
      await expect(page).toHaveTitle(/sign in|log in/i);

      await page.locator('input[name="email"]').fill('test@example.com');
      await page.locator('input[name="password"]').fill('TestPassword123!');
      await page.getByRole('button', { name: /^sign in$/i }).click();

      await page.waitForURL(/\/app\/i\/home/, { timeout: 15000 });
      await expect(page).toHaveURL(/\/app\/i\/home/);
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.locator('input[name="email"]').fill('nonexistent@example.com');
      await page.locator('input[name="password"]').fill('WrongPassword123!');
      await page.getByRole('button', { name: /^sign in$/i }).click();

      await expect(page.getByText(/email or password is incorrect/i)).toBeVisible();
    });

    test('should show error for missing email', async ({ page }) => {
      await page.goto('/login');

      await page.locator('input[name="password"]').fill('SomePassword123!');
      await page.getByRole('button', { name: /^sign in$/i }).click();

      await expect(page.getByText(/enter your email address/i)).toBeVisible();
    });

    test('should show error for missing password', async ({ page }) => {
      await page.goto('/login');

      await page.locator('input[name="email"]').fill('test@example.com');
      await page.getByRole('button', { name: /^sign in$/i }).click();

      await expect(page.getByText(/enter your password/i)).toBeVisible();
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

      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.getByRole('button', { name: /send|reset/i })).toBeVisible();
    });

    test('should accept email and show success message', async ({ page }) => {
      await page.goto('/reset-password');

      await page.locator('input[name="email"]').fill('test@example.com');
      await page.getByRole('button', { name: /send reset link|send/i }).click();

      await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 5000 });
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/reset-password');

      await page.locator('input[name="email"]').fill('invalid-email');
      await page.getByRole('button', { name: /send reset link|send/i }).click();

      await expect(page.getByText(/valid email/i)).toBeVisible({ timeout: 5000 });
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
      await expect(page).toHaveTitle(/verify|confirmation/i);
    });

    test('should show error for invalid token', async ({ page }) => {
      await page.goto('/verify-email?token=invalid-token-12345');
      await expect(page.getByText(/invalid or expired verification link/i)).toBeVisible({
        timeout: 15000,
      });
    });

    test('should handle missing token', async ({ page }) => {
      await page.goto('/verify-email');
      await expect(page.getByText(/no verification token provided/i)).toBeVisible({
        timeout: 5000,
      });
    });
  });
});
