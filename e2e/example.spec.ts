import { test, expect } from '@playwright/test';

test('landing page loads correctly', async ({ page }) => {
  await page.goto('/');

  // Check for main heading
  await expect(page.getByRole('heading', { name: 'Proofound' })).toBeVisible();

  // Check for CTA buttons
  await expect(page.getByRole('link', { name: 'Join Proofound' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
});

test('navigation to login page', async ({ page }) => {
  await page.goto('/');

  // Click login button
  await page.getByRole('link', { name: 'Log in' }).click();

  // Verify we're on login page
  await expect(page).toHaveURL('/login');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});

test('navigation to signup page', async ({ page }) => {
  await page.goto('/');

  // Click signup button
  await page.getByRole('link', { name: 'Join Proofound' }).click();

  // Verify we're on signup page
  await expect(page).toHaveURL('/signup');
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
});
