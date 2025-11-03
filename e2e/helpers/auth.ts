import { Page } from '@playwright/test';

/**
 * E2E Test Helpers for Authentication
 *
 * Utilities for managing authentication state in E2E tests
 */

export interface TestUser {
  email: string;
  password: string;
  fullName: string;
  handle: string;
}

/**
 * Generate a unique test user with timestamp to avoid collisions
 */
export function generateTestUser(prefix = 'testuser'): TestUser {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return {
    email: `${prefix}+${timestamp}${random}@test.proofound.com`,
    password: 'TestPassword123!',
    fullName: `Test User ${timestamp}`,
    handle: `${prefix}${timestamp}${random}`,
  };
}

/**
 * Sign up a new user through the UI
 */
export async function signupUser(
  page: Page,
  user: TestUser,
  persona: 'individual' | 'organization'
) {
  await page.goto('/signup');

  // Fill signup form
  await page.getByLabel(/email/i).fill(user.email);
  await page
    .getByLabel(/password/i)
    .first()
    .fill(user.password);

  // Select persona if there's a choice
  const personaButton = page.getByRole('button', { name: new RegExp(persona, 'i') });
  if (await personaButton.isVisible()) {
    await personaButton.click();
  }

  // Submit form
  await page.getByRole('button', { name: /sign up|create account/i }).click();

  // Wait for redirect or success message
  await page.waitForURL(/verify-email|onboarding|app/, { timeout: 10000 });
}

/**
 * Login an existing user through the UI
 */
export async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/login');

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);

  await page.getByRole('button', { name: /sign in|log in/i }).click();

  // Wait for redirect to app
  await page.waitForURL(/app/, { timeout: 10000 });
}

/**
 * Logout the current user
 */
export async function logoutUser(page: Page) {
  // Look for profile menu or logout button
  const profileButton = page.getByRole('button', { name: /profile|account|user/i });

  if (await profileButton.isVisible()) {
    await profileButton.click();
  }

  const logoutButton = page.getByRole('button', { name: /log out|sign out/i });
  await logoutButton.click();

  // Wait for redirect to login or home
  await page.waitForURL(/login|^\/$/, { timeout: 5000 });
}

/**
 * Check if user is logged in by looking for app navigation
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  return page.url().includes('/app/');
}

/**
 * Wait for email verification (in real tests, you'd use a test email service)
 * For now, this is a placeholder
 */
export async function waitForEmailVerification(email: string): Promise<string> {
  // In a real implementation, this would:
  // 1. Query a test email service (like Mailosaur, Ethereal, etc.)
  // 2. Extract the verification link
  // 3. Return the verification token

  // For now, return a placeholder
  console.warn('Email verification not implemented in tests - using mock token');
  return 'mock-verification-token';
}

/**
 * Verify email by visiting the verification link
 */
export async function verifyEmail(page: Page, token: string) {
  await page.goto(`/verify-email?token=${token}`);

  // Wait for success message or redirect
  await page.waitForSelector('text=/verified|success/i', { timeout: 5000 });
}

/**
 * Request password reset
 */
export async function requestPasswordReset(page: Page, email: string) {
  await page.goto('/reset-password');

  await page.getByLabel(/email/i).fill(email);
  await page.getByRole('button', { name: /reset|send/i }).click();

  // Wait for success message
  await page.waitForSelector('text=/check your email|sent/i', { timeout: 5000 });
}

/**
 * Complete password reset with token
 */
export async function resetPassword(page: Page, token: string, newPassword: string) {
  await page.goto(`/reset-password/confirm?token=${token}`);

  await page.getByLabel(/new password/i).fill(newPassword);
  await page.getByLabel(/confirm password/i).fill(newPassword);
  await page.getByRole('button', { name: /reset|update/i }).click();

  // Wait for success
  await page.waitForSelector('text=/success|updated/i', { timeout: 5000 });
}

/**
 * Skip or complete onboarding wizard
 */
export async function skipOnboarding(page: Page) {
  // Look for skip button
  const skipButton = page.getByRole('button', { name: /skip|later/i });

  while (await skipButton.isVisible()) {
    await skipButton.click();
    await page.waitForTimeout(500); // Wait for transition
  }
}

/**
 * Complete basic onboarding for individual
 */
export async function completeIndividualOnboarding(
  page: Page,
  userData: {
    fullName: string;
    headline?: string;
    location?: string;
  }
) {
  // Wait for onboarding page
  await page.waitForURL(/onboarding/, { timeout: 5000 });

  // Fill profile basics
  if (await page.getByLabel(/full name|name/i).isVisible()) {
    await page.getByLabel(/full name|name/i).fill(userData.fullName);
  }

  if (userData.headline && (await page.getByLabel(/headline/i).isVisible())) {
    await page.getByLabel(/headline/i).fill(userData.headline);
  }

  if (userData.location && (await page.getByLabel(/location/i).isVisible())) {
    await page.getByLabel(/location/i).fill(userData.location);
  }

  // Click next/complete buttons until done
  let attempts = 0;
  while (attempts < 5) {
    const nextButton = page.getByRole('button', { name: /next|continue|complete|finish/i });

    if (!(await nextButton.isVisible())) {
      break;
    }

    await nextButton.click();
    await page.waitForTimeout(1000);
    attempts++;
  }

  // Should end up in the app
  await page.waitForURL(/app/, { timeout: 10000 });
}

/**
 * Complete basic onboarding for organization
 */
export async function completeOrganizationOnboarding(
  page: Page,
  orgData: {
    organizationName: string;
    website?: string;
    industry?: string;
  }
) {
  await page.waitForURL(/onboarding/, { timeout: 5000 });

  if (await page.getByLabel(/organization name|company name/i).isVisible()) {
    await page.getByLabel(/organization name|company name/i).fill(orgData.organizationName);
  }

  if (orgData.website && (await page.getByLabel(/website/i).isVisible())) {
    await page.getByLabel(/website/i).fill(orgData.website);
  }

  if (orgData.industry && (await page.getByLabel(/industry/i).isVisible())) {
    await page.getByLabel(/industry/i).fill(orgData.industry);
  }

  // Complete wizard
  let attempts = 0;
  while (attempts < 5) {
    const nextButton = page.getByRole('button', { name: /next|continue|complete|finish/i });

    if (!(await nextButton.isVisible())) {
      break;
    }

    await nextButton.click();
    await page.waitForTimeout(1000);
    attempts++;
  }

  await page.waitForURL(/app/, { timeout: 10000 });
}
