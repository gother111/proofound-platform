import { expect, test } from '@playwright/test';

import {
  SEEDED_PUBLIC_ORG_TRUST_FIXTURE,
  SEEDED_PUBLIC_ORG_TRUST_PATH,
} from '../src/lib/launch/public-org-trust-fixture';

test.describe('Seeded public org trust smoke', () => {
  test('seeded org trust page returns 200 and stays MVP-safe', async ({ page }) => {
    const response = await page.goto(SEEDED_PUBLIC_ORG_TRUST_PATH, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { name: SEEDED_PUBLIC_ORG_TRUST_FIXTURE.organization.displayName })
    ).toBeVisible();
    await expect(page.getByText(/public organization trust card/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Trust basics' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Purpose' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Why the work matters' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Working context' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Hiring process clarity' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Durable trust signals' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Active assignment' })).toBeVisible();
    await expect(page.getByText('Platform reviewed').first()).toBeVisible();
    await expect(page.getByText(SEEDED_PUBLIC_ORG_TRUST_FIXTURE.assignment.role)).toBeVisible();

    await expect(page.getByRole('heading', { name: /values/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /causes/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /work culture/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /projects/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /partnerships/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /goals/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /impact/i })).toHaveCount(0);
    await expect(page.getByText(/team members/i)).toHaveCount(0);
    await expect(page.getByText(/owner@|reviewer@|member@/i)).toHaveCount(0);
  });
});
