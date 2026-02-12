import { expect, test } from '@playwright/test';

const ORG_EMAIL = process.env.E2E_ORG_ADMIN_EMAIL;
const ORG_PASSWORD = process.env.E2E_ORG_ADMIN_PASSWORD;
const EMPTY_ORG_SLUG = process.env.E2E_EMPTY_ORG_SLUG ?? 'new-org';

test.describe('Organization profile basic info smoke', () => {
  test('can edit and persist basic info for a new organization profile', async ({ page }) => {
    test.skip(
      !ORG_EMAIL || !ORG_PASSWORD,
      'Set E2E_ORG_ADMIN_EMAIL and E2E_ORG_ADMIN_PASSWORD to run this smoke test.'
    );

    const now = Date.now();
    const orgSlug = EMPTY_ORG_SLUG;
    const updatedName = `New Org ${now}`;

    await page.addInitScript(() => {
      localStorage.setItem('proofound-cookie-consent', 'v1.0.2025-11-06-declined');
    });
    await page.goto('/login');
    await page.fill('input[name="email"]', ORG_EMAIL!);
    await page.fill('input[name="password"]', ORG_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/app\/o\/.+/);

    await page.goto(`/app/o/${orgSlug}/profile`);
    await expect(page).toHaveURL(new RegExp(`/app/o/${orgSlug}/profile`));
    await expect(page.getByTestId('org-profile-completion-banner')).toBeVisible();

    const editButton = page.getByTestId('org-edit-profile-button');
    await expect(editButton).toBeVisible({ timeout: 15000 });
    await editButton.click();

    const editor = page.getByTestId('org-basic-info-editor');
    await expect(editor).toBeVisible();

    await page.getByLabel(/organization name/i).fill(updatedName);
    await page.getByLabel(/website/i).fill('example.com');
    await page.getByLabel(/mission statement/i).fill('Deliver measurable social impact.');
    await page.getByLabel(/vision statement/i).fill('A trustworthy labor market.');
    await page.getByTestId('org-basic-info-save').click();

    await expect(editor).toBeHidden({ timeout: 20000 });
    await expect(page.getByRole('heading', { name: updatedName })).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByTestId('org-website-link')).toHaveAttribute(
      'href',
      'https://example.com/'
    );

    await page.reload();
    await expect(page.getByRole('heading', { name: updatedName })).toBeVisible();
    await expect(page.getByTestId('org-website-link')).toHaveAttribute(
      'href',
      'https://example.com/'
    );
  });
});
