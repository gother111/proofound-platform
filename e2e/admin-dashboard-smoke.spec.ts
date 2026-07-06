import { expect, test } from '@playwright/test';

const adminMockEnabled =
  process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true' &&
  (process.env.MOCK_ADMIN_MODE === 'true' ||
    process.env.MOCK_PLATFORM_ROLE === 'platform_admin' ||
    process.env.MOCK_PLATFORM_ROLE === 'super_admin');

test.describe('Admin launch ops smoke', () => {
  test.skip(
    !adminMockEnabled,
    'Set NEXT_PUBLIC_USE_MOCK_SUPABASE=true and MOCK_ADMIN_MODE=true (or MOCK_PLATFORM_ROLE) to run.'
  );

  test('loads the active admin launch-ops corridor without retired dashboard links', async ({
    page,
  }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /launch operations/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /open operations queues/i })).toHaveAttribute(
      'href',
      '/admin/verification'
    );
    await expect(page.getByRole('link', { name: /open audit log/i })).toHaveAttribute(
      'href',
      '/admin/audit'
    );
    await expect(page.getByRole('link', { name: /users/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /organizations/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /fairness/i })).toHaveCount(0);

    await page.goto('/admin/verification');
    await expect(page.getByRole('heading', { name: /operations queues/i })).toBeVisible();

    await page.goto('/admin/audit');
    await expect(page.getByRole('heading', { name: /audit logs/i })).toBeVisible();
  });
});
