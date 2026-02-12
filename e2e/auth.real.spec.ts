import { expect, test, type Page } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { loadStrictEnv } from './helpers/load-strict-env';

loadStrictEnv();

type ManagedAuthUser = {
  id: string;
  email: string;
  password: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable for real auth E2E: ${name}`);
  }
  return value;
}

function adminClient(): SupabaseClient {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function uniqueEmail(prefix: string): string {
  return `${prefix}+${Date.now()}-${randomUUID().slice(0, 8)}@test.proofound.com`;
}

async function provisionVerifiedIndividualUser(): Promise<ManagedAuthUser> {
  const supabase = adminClient();
  const email = uniqueEmail('e2e-real-login');
  const password = 'TestPassword123!';

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { persona: 'individual' },
  });

  if (error || !data.user) {
    throw new Error(`Failed to provision verified auth user: ${error?.message ?? 'unknown error'}`);
  }

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: data.user.id,
      display_name: email,
      persona: 'individual',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    throw new Error(`Failed to provision profile for auth user: ${profileError.message}`);
  }

  return {
    id: data.user.id,
    email,
    password,
  };
}

async function cleanupUser(userId: string) {
  const supabase = adminClient();
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    console.warn(`Failed to delete E2E auth user ${userId}: ${error.message}`);
  }
}

async function openSignupForm(page: Page, type: 'individual' | 'organization') {
  await page.goto('/signup');
  await expect(page.getByTestId('signup-choice-screen')).toBeVisible();

  if (type === 'individual') {
    await page.getByTestId('signup-choice-individual').click();
  } else {
    await page.getByTestId('signup-choice-organization').click();
  }

  await expect(page.getByTestId('signup-form')).toBeVisible();
}

async function assertSocialOAuthRedirect(page: Page, provider: 'google' | 'linkedin_oidc') {
  await page.goto('/login');
  await expect(page.getByTestId('login-email')).toBeVisible();

  const submitTestId = provider === 'google' ? 'oauth-google-submit' : 'oauth-linkedin-submit';
  await expect(page.getByTestId(submitTestId)).toBeVisible();
  await page.getByTestId(submitTestId).click();

  await page.waitForURL((url) => {
    const href = url.toString().toLowerCase();
    if (provider === 'google') {
      return (
        href.includes('accounts.google.com') ||
        (href.includes('/auth/v1/authorize') && href.includes('provider=google'))
      );
    }
    return (
      (href.includes('linkedin.com') &&
        (href.includes('/oauth') || href.includes('/uas/login') || href.includes('oauth%2fv2'))) ||
      (href.includes('/auth/v1/authorize') && href.includes('provider=linkedin_oidc'))
    );
  });

  const currentUrl = page.url().toLowerCase();
  if (provider === 'google') {
    expect(
      currentUrl.includes('accounts.google.com') ||
        (currentUrl.includes('/auth/v1/authorize') && currentUrl.includes('provider=google'))
    ).toBeTruthy();
    return;
  }

  expect(
    (currentUrl.includes('linkedin.com') &&
      (currentUrl.includes('/oauth') ||
        currentUrl.includes('/uas/login') ||
        currentUrl.includes('oauth%2fv2'))) ||
      (currentUrl.includes('/auth/v1/authorize') && currentUrl.includes('provider=linkedin_oidc'))
  ).toBeTruthy();
}

test.describe('Authentication (Real Runtime Contract)', () => {
  test.describe.configure({ mode: 'serial' });

  let managedUser: ManagedAuthUser;

  test.beforeAll(async () => {
    managedUser = await provisionVerifiedIndividualUser();
  });

  test.afterAll(async () => {
    if (managedUser?.id) {
      await cleanupUser(managedUser.id);
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('proofound-cookie-consent', 'v1.0.2025-11-06-declined');
    });
  });

  test('signup positive path (individual) shows verification confirmation', async ({ page }) => {
    const email = uniqueEmail('e2e-real-signup-individual');
    const password = 'TestPassword123!';

    await openSignupForm(page, 'individual');

    await page.getByTestId('signup-email').fill(email);
    await page.getByTestId('signup-password').fill(password);
    await page.getByTestId('signup-confirm-password').fill(password);
    await page.getByTestId('gdpr-consent').check();
    await page.getByTestId('signup-submit').click();

    await expect(page.getByTestId('signup-success')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(email)).toBeVisible();
  });

  test('signup positive path (organization) shows verification confirmation', async ({ page }) => {
    const email = uniqueEmail('e2e-real-signup-organization');
    const password = 'TestPassword123!';

    await openSignupForm(page, 'organization');

    await page.getByTestId('signup-email').fill(email);
    await page.getByTestId('signup-password').fill(password);
    await page.getByTestId('signup-confirm-password').fill(password);
    await page.getByTestId('gdpr-consent').check();
    await page.getByTestId('signup-submit').click();

    await expect(page.getByTestId('signup-success')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(email)).toBeVisible();
  });

  test('signup negative path rejects already-registered email', async ({ page }) => {
    await openSignupForm(page, 'individual');

    await page.getByTestId('signup-email').fill(managedUser.email);
    await page.getByTestId('signup-password').fill('TestPassword123!');
    await page.getByTestId('signup-confirm-password').fill('TestPassword123!');
    await page.getByTestId('gdpr-consent').check();
    await page.getByTestId('signup-submit').click();

    await expect(page.getByTestId('signup-error')).toContainText(
      /already exists|already registered|fresh verification link/i
    );
  });

  test('login positive path redirects authenticated user into app shell', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-email')).toBeVisible();

    await page.getByTestId('login-email').fill(managedUser.email);
    await page.getByTestId('login-password').fill(managedUser.password);
    await page.getByTestId('login-submit').click();

    await page.waitForURL(/\/app\//, { timeout: 20000 });
    expect(page.url()).toMatch(/\/app\//);
  });

  test('login negative path shows credentials error for invalid password', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-email')).toBeVisible();

    await page.getByTestId('login-email').fill(managedUser.email);
    await page.getByTestId('login-password').fill('WrongPassword123!');
    await page.getByTestId('login-submit').click();

    await expect(page.getByTestId('login-error')).toContainText(/email or password is incorrect/i);
  });

  test('social auth initiation contract redirects to Google OAuth flow', async ({ page }) => {
    await assertSocialOAuthRedirect(page, 'google');
  });

  test('social auth initiation contract redirects to LinkedIn OAuth flow', async ({ page }) => {
    await assertSocialOAuthRedirect(page, 'linkedin_oidc');
  });

  test('reset password positive path accepts valid email and shows success state', async ({
    page,
  }) => {
    await page.goto('/reset-password');
    await expect(page.getByTestId('reset-password-form')).toBeVisible();

    await page.getByTestId('reset-password-email').fill(managedUser.email);
    await page.getByTestId('reset-password-submit').click();

    await expect(page.getByTestId('reset-password-success')).toBeVisible();
  });

  test('reset password negative path rejects malformed email', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.getByTestId('reset-password-form')).toBeVisible();

    await page.getByTestId('reset-password-email').fill('invalid-email');
    await page.getByTestId('reset-password-submit').click();

    await expect(page.getByTestId('reset-password-error')).toContainText(/valid email/i);
  });

  test('verify positive route contract redirects callback token to verify-email page', async ({
    page,
  }) => {
    await page.goto('/auth/callback?type=email&token_hash=deterministic-token');
    await page.waitForURL(/\/verify-email\?token=deterministic-token/);
    expect(page.url()).toMatch(/\/verify-email\?token=deterministic-token/);
  });

  test('verify negative path shows invalid/expired token message', async ({ page }) => {
    await page.goto('/verify-email?token=invalid-token-12345');
    await expect(page.getByTestId('verify-email-error')).toContainText(
      /invalid or expired verification link/i
    );
  });

  test('verify negative path shows missing token message', async ({ page }) => {
    await page.goto('/verify-email');
    await expect(page.getByTestId('verify-email-error')).toContainText(
      /no verification token provided/i
    );
  });
});
