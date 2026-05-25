import { expect, test, type Page } from '@playwright/test';

import {
  SEEDED_PUBLIC_ORG_TRUST_FIXTURE,
  SEEDED_PUBLIC_ORG_TRUST_PATH,
} from '../src/lib/launch/public-org-trust-fixture';

test.describe('Seeded public org trust smoke', () => {
  async function gotoSeededTrustPageWithRetry(page: Page) {
    const maxAttempts = Number.parseInt(process.env.PUBLIC_ORG_TRUST_SMOKE_RETRIES || '4', 10);
    const retryDelayMs = Number.parseInt(
      process.env.PUBLIC_ORG_TRUST_SMOKE_RETRY_DELAY_MS || '2000',
      10
    );
    let lastStatus: number | null = null;
    let lastUnavailable = false;

    for (let attempt = 1; attempt <= Math.max(maxAttempts, 1); attempt += 1) {
      const response = await page.goto(SEEDED_PUBLIC_ORG_TRUST_PATH, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });

      lastStatus = response?.status() ?? null;
      lastUnavailable = await page
        .getByText(/organization portfolio unavailable/i)
        .isVisible()
        .catch(() => false);

      if (lastStatus === 200 && !lastUnavailable) {
        return lastStatus;
      }

      if (attempt < maxAttempts) {
        await page.waitForTimeout(Math.max(retryDelayMs, 250));
      }
    }

    throw new Error(
      `Seeded public org trust page did not stabilize (status=${lastStatus ?? 'null'}, unavailable=${lastUnavailable})`
    );
  }

  test('seeded org trust page returns 200 and stays MVP-safe', async ({ page }) => {
    const status = await gotoSeededTrustPageWithRetry(page);
    expect(status).toBe(200);
    await expect(
      page.getByRole('heading', { name: SEEDED_PUBLIC_ORG_TRUST_FIXTURE.organization.displayName })
    ).toBeVisible();
    await expect(page.getByText(/public organization trust page/i)).toBeVisible();
    await expect(page.getByText(/shareable by direct link/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mission / purpose' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'What work is offered' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Assignment clarity' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Seriousness of review' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Organization basics' })).toBeVisible();
    await expect(
      page.getByText(/organization trust has been reviewed by proofound/i)
    ).toBeVisible();
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
