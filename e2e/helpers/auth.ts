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

export interface TestOrganization {
  email: string;
  password: string;
  organizationName: string;
  slug: string;
  type?: string;
  website?: string;
}

/**
 * Generate a unique test user with timestamp to avoid collisions
 */
export function generateTestUser(prefix: string = 'testuser'): TestUser {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const normalizedPrefix =
    prefix === 'individual' || prefix === 'organization' ? `test-${prefix}` : prefix;
  return {
    email: `${normalizedPrefix}+${timestamp}${random}@test.proofound.com`,
    password: 'TestPassword123!',
    fullName: `Test User ${timestamp}`,
    handle: `${normalizedPrefix}${timestamp}${random}`,
  };
}

/**
 * Generate a unique test organization with timestamp to avoid collisions
 */
export function generateTestOrganization(prefix = 'testorg'): TestOrganization {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const slug = `${prefix}-${timestamp}${random}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return {
    email: `${prefix}+${timestamp}${random}@test.proofound.com`,
    password: 'TestPassword123!',
    organizationName: `Test Organization ${timestamp}`,
    slug,
    type: 'company',
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

  // Select persona if there's a choice (must be done before form if it's a multi-step or toggle)
  const personaButton = page.getByRole('button', { name: new RegExp(persona, 'i') });
  // We check if the button is visible and if we are not already on the form (email input not visible)
  // Or if the button is part of the form (toggle).
  // Based on the failure, the email input is NOT visible initially.

  // Try to find the persona card/button first
  // The page content suggests "Individual" and "Organization" are headings or buttons.
  // We'll try to click them.
  if (await page.getByRole('heading', { name: new RegExp(persona, 'i') }).isVisible()) {
    // It might be a card with a heading. Let's try to click the container or a button inside.
    // Or maybe the heading itself is clickable or there is a button nearby.
    // Let's look for a button with that name.
    if (await personaButton.isVisible()) {
      await personaButton.click();
    } else {
      // Maybe it's a card that acts as a button
      await page.getByText(new RegExp(persona, 'i')).first().click();
    }
  }

  // Wait for email input to appear
  await page.waitForSelector('input[type="email"], label:has-text("Email")', { timeout: 5000 });

  // Fill signup form
  await page.getByLabel(/email/i).fill(user.email);
  await page
    .getByLabel(/password/i)
    .first()
    .fill(user.password);

  // Submit form
  await page.getByRole('button', { name: /sign up|create account/i }).click();

  // Wait for redirect or success message
  await page.waitForURL(/verify-email|onboarding|app/, { timeout: 10000 });
}

/**
 * Sign up as organization through the UI
 */
export async function signupOrganization(page: Page, org: TestOrganization) {
  await page.goto('/signup');

  // Select organization persona
  // Try to find the button or card
  const orgButton = page.getByRole('button', { name: /organization/i });
  const orgText = page.getByText(/organization/i).first();

  if (await orgButton.isVisible()) {
    await orgButton.click();
  } else if (await orgText.isVisible()) {
    await orgText.click();
  }

  // Wait for email input
  await page.waitForSelector('input[type="email"], label:has-text("Email")', { timeout: 5000 });

  // Fill signup form
  await page.getByLabel(/email/i).fill(org.email);
  await page
    .getByLabel(/password/i)
    .first()
    .fill(org.password);
  const confirmPasswordInput = page.locator('input[name="confirmPassword"]');
  if (await confirmPasswordInput.isVisible()) {
    await confirmPasswordInput.fill(org.password);
  }

  const gdprConsent = page.getByTestId('gdpr-consent');
  if (await gdprConsent.isVisible()) {
    await gdprConsent.check();
  }

  // Submit signup form
  await page
    .getByRole('button', { name: /create organization account|create account|sign up/i })
    .click();

  // Wait for redirect to onboarding
  await page.waitForURL(/onboarding|app/, { timeout: 10000 });

  // If redirected to onboarding, complete organization setup
  if (page.url().includes('/onboarding')) {
    await completeOrganizationOnboarding(page, {
      organizationName: org.organizationName,
      website: org.website,
      industry: org.type,
    });
  }
}

/**
 * Login as organization user
 */
export async function loginOrganization(page: Page, email: string, password: string) {
  await loginUser(page, email, password);

  // After login, should be redirected to org dashboard
  // If not, navigate to org context
  if (!page.url().includes('/app/o/')) {
    // Try to find org in navigation or wait for redirect
    await page.waitForTimeout(2000);
    if (!page.url().includes('/app/o/')) {
      // Navigate to onboarding if org not set up
      await page.goto('/onboarding');
    }
  }
}

/**
 * Login an existing user through the UI
 */
export async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/login');

  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);

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
 * Wait for email verification through the configured test email inbox.
 */
export async function waitForEmailVerification(email: string): Promise<string> {
  throw new Error(
    `No connected test email inbox is configured for ${email}. Use the strict auth E2E harness or inject a real verification token before calling this helper.`
  );
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
    slug?: string;
    website?: string;
    industry?: string;
    type?: string;
    legalName?: string;
    mission?: string;
  }
) {
  await page.waitForURL(/onboarding/, { timeout: 5000 });

  // Fill organization name
  const orgNameInput = page
    .getByLabel(/organization name|company name|display name/i)
    .or(page.locator('input[name="displayName"]'))
    .first();

  if (await orgNameInput.isVisible()) {
    await orgNameInput.fill(orgData.organizationName);
  }

  // Fill slug if provided
  if (orgData.slug) {
    const slugInput = page
      .getByLabel(/slug|url slug/i)
      .or(page.locator('input[name="slug"]'))
      .first();

    if (await slugInput.isVisible()) {
      await slugInput.fill(orgData.slug);
    }
  }

  // Select organization type
  const typeSelect = page
    .locator('select[name="type"]')
    .or(page.getByLabel(/organization type|type/i))
    .first();

  if (await typeSelect.isVisible()) {
    const typeValue = orgData.type || orgData.industry || 'company';
    await typeSelect.selectOption(typeValue);
  }

  // Fill legal name if provided
  if (orgData.legalName) {
    const legalNameInput = page
      .getByLabel(/legal name/i)
      .or(page.locator('input[name="legalName"]'))
      .first();

    if (await legalNameInput.isVisible()) {
      await legalNameInput.fill(orgData.legalName);
    }
  }

  // Fill mission if provided
  if (orgData.mission) {
    const missionInput = page
      .locator('textarea[name="mission"]')
      .or(page.getByLabel(/mission/i))
      .first();

    if (await missionInput.isVisible()) {
      await missionInput.fill(orgData.mission);
    }
  }

  // Fill website if provided
  if (orgData.website) {
    const websiteInput = page
      .getByLabel(/website/i)
      .or(page.locator('input[name="website"]'))
      .first();

    if (await websiteInput.isVisible()) {
      await websiteInput.fill(orgData.website);
    }
  }

  // Submit form
  const submitButton = page
    .getByRole('button', { name: /create organization|submit|save/i })
    .first();

  if (await submitButton.isVisible()) {
    await submitButton.click();
    await page.waitForTimeout(2000);
  }

  // Wait for redirect to org dashboard
  await page.waitForURL(/\/app\/o\//, { timeout: 15000 });
}
