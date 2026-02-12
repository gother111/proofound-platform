import { expect, test } from '@playwright/test';

const adminMockEnabled =
  process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true' &&
  (process.env.MOCK_ADMIN_MODE === 'true' ||
    process.env.MOCK_PLATFORM_ROLE === 'platform_admin' ||
    process.env.MOCK_PLATFORM_ROLE === 'super_admin');

test.describe('Admin dashboard smoke', () => {
  test.skip(
    !adminMockEnabled,
    'Set NEXT_PUBLIC_USE_MOCK_SUPABASE=true and MOCK_ADMIN_MODE=true (or MOCK_PLATFORM_ROLE) to run.'
  );

  test('loads core admin pages without blocking route-level errors', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /admin dashboard/i })).toBeVisible();

    await page.goto('/admin/users');
    await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible();

    await page.goto('/admin/organizations');
    await expect(page.getByRole('heading', { name: /organization management/i })).toBeVisible();

    await page.goto('/admin/fairness/notes');
    await expect(page.getByRole('heading', { name: /fairness notes/i })).toBeVisible();

    await page.goto('/admin/verification');
    await expect(page.getByRole('heading', { name: /linkedin verification queue/i })).toBeVisible();
  });
});
