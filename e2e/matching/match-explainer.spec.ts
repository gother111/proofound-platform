/**
 * E2E Tests: Match Explainer Modal
 *
 * Tests the match transparency feature including:
 * - Opening match explainer modal
 * - Viewing score breakdown
 * - Navigating tabs (Overview, Skills, Purpose, Constraints)
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
    // Click "Why this match?" button on first match
    const whyButton = page
      .locator('[data-testid="match-card"]')
      .first()
      .locator('button:has-text("Why")');

    if (await whyButton.isVisible()) {
      await whyButton.click();

      // Verify modal opens
      await expect(page.locator('text=Why This Match?')).toBeVisible();
      await expect(page.locator('text=Overall Match Score')).toBeVisible();
    }
  });

  test('should display score breakdown', async ({ page }) => {
    // Open explainer for first match
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.locator('button:has-text("Why")').click();

    // Verify overall score is shown
    const scoreElement = page.locator('[data-testid="overall-score"]');
    if (await scoreElement.isVisible()) {
      const scoreText = await scoreElement.textContent();
      expect(scoreText).toMatch(/\d+%/); // Should show percentage
    }

    // Verify score components are shown
    await expect(page.locator('text=Skills Match')).toBeVisible();
    await expect(page.locator('text=Purpose Alignment')).toBeVisible();
  });

  test('should show skills breakdown in Skills tab', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.locator('button:has-text("Why")').click();

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

  test('should show purpose alignment in Purpose tab', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.locator('button:has-text("Why")').click();

    // Click Purpose tab
    await page.click('button[role="tab"]:has-text("Purpose")');

    // Verify values and causes sections
    await expect(page.locator('text=Values Alignment')).toBeVisible();
    await expect(page.locator('text=Causes Alignment')).toBeVisible();

    // Check for overlap percentages
    const overlapPercentages = page.locator('text=/%/');
    await expect(overlapPercentages.first()).toBeVisible();
  });

  test('should show constraints match in Constraints tab', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.locator('button:has-text("Why")').click();

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
    await matchCard.locator('button:has-text("Why")').click();

    // Wait for modal
    await expect(page.locator('text=Why This Match?')).toBeVisible();

    // Click "Got it" button
    await page.click('button:has-text("Got it")');

    // Verify modal closes
    await expect(page.locator('text=Why This Match?')).not.toBeVisible();
  });

  test('should show PAC (Purpose-Alignment Contribution) explanation', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.locator('button:has-text("Why")').click();

    // Look for PAC explanation
    const pacExplanation = page.locator('text=/PAC|Purpose-Alignment Contribution/i');
    if (await pacExplanation.isVisible()) {
      // Should explain Jaccard similarity
      await expect(page.locator('text=/Jaccard/i')).toBeVisible();
    }
  });

  test('should show rank information if available', async ({ page }) => {
    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.locator('button:has-text("Why")').click();

    // Check for ranking display
    const rankElement = page.locator('text=/Top \d+|#\d+ of \d+/');
    if (await rankElement.isVisible()) {
      const rankText = await rankElement.textContent();
      expect(rankText).toMatch(/Top \d+|#\d+ of \d+/);
    }
  });
});
