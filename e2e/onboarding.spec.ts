import { test, expect, type Page } from '@playwright/test';

async function expectLoginRedirect(page: Page) {
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  await expect(page.getByRole('form', { name: /sign in form/i })).toBeVisible();
}

test.describe('Onboarding access contract', () => {
  test('redirects unauthenticated visitors to sign in before first-proof onboarding', async ({
    page,
  }) => {
    await page.goto('/onboarding');

    await expectLoginRedirect(page);
    await expect(page.getByRole('link', { name: /create account/i })).toHaveAttribute(
      'href',
      '/signup'
    );
    await expect(page.getByRole('link', { name: /forgot password/i })).toHaveAttribute(
      'href',
      '/reset-password'
    );
  });

  test('does not expose candidate-invite onboarding context before authentication', async ({
    page,
  }) => {
    await page.goto('/onboarding?next=/candidate-invite/example-token');

    await expectLoginRedirect(page);
    await expect(page.getByText(/candidate-invite|example-token/i)).toHaveCount(0);
  });
});
