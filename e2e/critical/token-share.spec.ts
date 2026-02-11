import { expect, test } from '@playwright/test';
import { getCriticalE2ECredentials } from './credentials';

test.describe('Critical: token share flows', () => {
  test('creates a snippet and opens /p/{token} and /p/{token}/embed', async ({ page }) => {
    const { email, password } = getCriticalE2ECredentials();

    await page.goto('/login');
    await page.locator('input[name="email"]').fill(email!);
    await page.locator('input[name="password"]').fill(password!);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/app\//, { timeout: 20000 });

    const createResponse = await page.request.post('/api/profile/snippet', {
      data: {
        fields: {
          name: true,
          headline: true,
          bio: true,
          skills: true,
          topSkills: 5,
          experience: false,
          education: false,
          location: true,
          profileImage: true,
          values: true,
          causes: true,
        },
        theme: 'auto',
        format: 'card',
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const payload = await createResponse.json();
    const token = payload?.snippet?.shareToken as string;

    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(8);

    await page.goto(`/p/${token}`);
    await expect(page.locator('article')).toBeVisible();

    await page.goto(`/p/${token}/embed?format=card`);
    await expect(page.locator('article')).toBeVisible();
  });
});
