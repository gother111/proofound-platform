import { expect, test } from '@playwright/test';

test.describe('Public launch smoke', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Proofound/i);
  });

  test('login entry renders', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
  });

  test('health endpoint returns the live contract', async ({ page }) => {
    const response = await page.request.get('/api/health');

    expect(response.status()).toBe(200);
    await expect(response).toBeOK();

    const payload = await response.json();
    expect(payload).toHaveProperty('status');
    expect(['healthy', 'degraded']).toContain(payload.status);
    expect(payload).toHaveProperty('timestamp');
  });
});
