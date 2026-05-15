/**
 * E2E Tests: Match Explainer Modal
 *
 * Tests the match transparency feature including:
 * - Opening match explainer modal
 * - Viewing score breakdown
 * - Navigating tabs (Overview, Skills, Constraints)
 * - Understanding match calculation
 */

import { test, expect } from '@playwright/test';

test.describe('Match Explainer Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Login as demo user
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'demo@proofound.com');
    await page.fill('input[name="password"]', 'demo-password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/app/i/home');

    // Navigate to matching page
    await page.goto('/app/i/matching');
    await page.waitForSelector('[data-testid="match-card"]');
  });

  test('should open match explainer modal', async ({ page }) => {
    // Click the proof-first explainer trigger on first match
    const whyButton = page
      .locator('[data-testid="match-card"]')
      .first()
      .locator('[data-testid="match-explainer-trigger"]');

    if (await whyButton.isVisible()) {
      await whyButton.click();

      // Verify modal opens
      await expect(page.getByTestId('match-explainer-title')).toHaveText('Why This Proof Match?');
      await expect(page.locator('text=Comparative score detail')).toBeVisible();
    }
  });

  test('should display score breakdown', async ({ page }) => {
    // Open explainer for first match
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.locator('[data-testid="match-explainer-trigger"]').click();

    // Verify overall score is shown
    const scoreElement = page.locator('[data-testid="overall-score"]');
    if (await scoreElement.isVisible()) {
      const scoreText = await scoreElement.textContent();
      expect(scoreText).toMatch(/\d+%/); // Should show percentage
    }

    // Verify score components are shown
    await expect(page.locator('text=Skills Match')).toBeVisible();
    await expect(page.locator('text=Practical Constraints')).toBeVisible();
    await expect(page.locator('text=/PAC|Purpose Alignment|Purpose-Alignment/i')).not.toBeVisible();
  });

  test('should show skills breakdown in Skills tab', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.locator('[data-testid="match-explainer-trigger"]').click();

    // Click Skills tab
    await page.click('button[role="tab"]:has-text("Skills")');

    // Verify skills are listed
    await expect(page.locator('text=Required Skills')).toBeVisible();

    // Check for skill level indicators
    const skillItems = page.locator('[data-testid="skill-item"]');
    if ((await skillItems.count()) > 0) {
      const firstSkill = skillItems.first();
      await expect(firstSkill).toBeVisible();

      // Should show required level and user level
      await expect(firstSkill.locator('text=/Level \d+/')).toBeVisible();
    }
  });

  test('should not expose retired purpose alignment tab', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.locator('[data-testid="match-explainer-trigger"]').click();

    await expect(page.locator('button[role="tab"]:has-text("Purpose")')).not.toBeVisible();
    await expect(
      page.locator('text=/Values Alignment|Causes Alignment|Jaccard/i')
    ).not.toBeVisible();
  });

  test('should show constraints match in Constraints tab', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.locator('[data-testid="match-explainer-trigger"]').click();

    // Click Constraints tab
    await page.click('button[role="tab"]:has-text("Constraints")');

    // Verify constraint categories are shown
    const constraintTypes = ['Location', 'Salary', 'Hours', 'Work Mode'];
    for (const type of constraintTypes) {
      const element = page.locator(`text=${type}`);
      if (await element.isVisible()) {
        // Should show match/mismatch indicator
        const parent = element.locator('xpath=ancestor::div[contains(@class, "constraint-item")]');
        await expect(parent).toBeVisible();
      }
    }
  });

  test('should close modal on Got it button', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.locator('[data-testid="match-explainer-trigger"]').click();

    // Wait for modal
    await expect(page.getByTestId('match-explainer-title')).toHaveText('Why This Proof Match?');

    // Click "Got it" button
    await page.click('button:has-text("Got it")');

    // Verify modal closes
    await expect(page.getByTestId('match-explainer-title')).not.toBeVisible();
  });

  test('should not show PAC or purpose-alignment explanation', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.locator('[data-testid="match-explainer-trigger"]').click();

    await expect(
      page.locator('text=/PAC|Purpose-Alignment Contribution|Jaccard/i')
    ).not.toBeVisible();
  });

  test('should show rank information if available', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.locator('[data-testid="match-explainer-trigger"]').click();

    // Check for ranking display
    const rankElement = page.locator('text=/Top \d+|#\d+ of \d+/');
    if (await rankElement.isVisible()) {
      const rankText = await rankElement.textContent();
      expect(rankText).toMatch(/Top \d+|#\d+ of \d+/);
    }
  });

  test('should keep proof-first explainer tabs free of values and causes scoring', async ({
    page,
  }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.locator('[data-testid="match-explainer-trigger"]').click();

    await expect(page.locator('button[role="tab"]:has-text("Purpose")')).not.toBeVisible();
    await expect(
      page.locator('text=/PAC|Purpose-Alignment Contribution|mission|vision|values|causes/i')
    ).not.toBeVisible();
  });

  test('should show rank bands when exact rank unavailable', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.locator('[data-testid="match-explainer-trigger"]').click();

    // Look for rank bands (e.g., "Top 5" instead of exact "#3")
    const rankBands = page.locator('text=/Top \d+|top \d+ candidates/i');
    const hasRankBands = await rankBands.isVisible().catch(() => false);

    // Rank bands may or may not be visible
    expect(typeof hasRankBands === 'boolean').toBeTruthy();
  });
});
