import { expect, test, type Page } from '@playwright/test';

const INDIVIDUAL_EMAIL = process.env.E2E_INDIVIDUAL_EMAIL ?? 'demo@proofound.com';
const INDIVIDUAL_PASSWORD = process.env.E2E_INDIVIDUAL_PASSWORD ?? 'demo-password';
const ORG_EMAIL = process.env.E2E_ORG_ADMIN_EMAIL;
const ORG_PASSWORD = process.env.E2E_ORG_ADMIN_PASSWORD;
const ORG_SLUG = process.env.E2E_ORG_SLUG ?? process.env.E2E_EMPTY_ORG_SLUG ?? 'test-org';

async function disableCookieBanner(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('proofound-cookie-consent', 'v1.0.2025-11-06-declined');
  });
}

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  try {
    await page.waitForURL(/\/app\//, { timeout: 15000 });
    return true;
  } catch {
    return false;
  }
}

test.describe('Profile navigation regression: no blank screen', () => {
  test('individual sidebar navigation renders profile without white screen', async ({ page }) => {
    await disableCookieBanner(page);

    const loggedIn = await login(page, INDIVIDUAL_EMAIL, INDIVIDUAL_PASSWORD);
    test.skip(
      !loggedIn,
      'Set E2E_INDIVIDUAL_EMAIL and E2E_INDIVIDUAL_PASSWORD, or provision demo credentials.'
    );

    await page.goto('/app/i/home');
    await expect(page).toHaveURL(/\/app\/i\/home/);

    await page.getByRole('link', { name: /^Profile$/i }).click();

    await expect(page).toHaveURL(/\/app\/i\/profile/);

    await expect(
      page.locator(
        '[data-testid="profile-skeleton"], [data-testid="individual-profile-root"], [data-testid="individual-empty-profile-view"], [data-testid="profile-load-error"]'
      )
    ).toBeVisible({ timeout: 8000 });

    await expect(
      page.locator(
        '[data-testid="individual-profile-root"], [data-testid="individual-empty-profile-view"], [data-testid="profile-load-error"]'
      )
    ).toBeVisible({ timeout: 20000 });
  });

  test('organization sidebar navigation renders profile without white screen', async ({ page }) => {
    test.skip(
      !ORG_EMAIL || !ORG_PASSWORD,
      'Set E2E_ORG_ADMIN_EMAIL and E2E_ORG_ADMIN_PASSWORD to run org profile navigation regression.'
    );

    await disableCookieBanner(page);

    const loggedIn = await login(page, ORG_EMAIL!, ORG_PASSWORD!);
    test.skip(!loggedIn, 'Organization login failed with provided credentials.');

    const orgMatch = page.url().match(/\/app\/o\/([^/]+)/);
    const orgBasePath = orgMatch ? `/app/o/${orgMatch[1]}` : `/app/o/${ORG_SLUG}`;

    await page.goto(`${orgBasePath}/home`);
    await expect(page).toHaveURL(new RegExp(`${orgBasePath}/home`));

    await page.getByRole('link', { name: /org profile/i }).click();

    await expect(page).toHaveURL(new RegExp(`${orgBasePath}/profile`));
    await expect(page.getByTestId('org-profile-root')).toBeVisible({ timeout: 20000 });
  });
});
