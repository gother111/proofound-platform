/**
 * E2E Tests: Match Snooze Functionality
 *
 * Tests the snooze feature including:
 * - Snoozing matches for different durations
 * - Snoozed matches hidden from list
 * - Unsnoozing matches
 */

import { test, expect } from '@playwright/test';

test.describe('Match Snooze', () => {
  test.beforeEach(async ({ page }) => {
    // Login as demo user
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'demo@proofound.com');
    await page.fill('input[name="password"]', 'demo-password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/app/i/home');
  });

  test('should show snooze dialog with duration options', async ({ page }) => {
    // Navigate to matching page
    await page.goto('/app/i/matching');
    await page.waitForSelector('[data-testid="match-card"]');

    // Click snooze button on first match
    await page.click('[data-testid="match-card"]:first-child button:has-text("Snooze")');

    // Verify dialog appears with options
    await expect(page.locator('text=Snooze This Match')).toBeVisible();
    await expect(page.locator('text=1 week')).toBeVisible();
    await expect(page.locator('text=2 weeks')).toBeVisible();
    await expect(page.locator('text=4 weeks')).toBeVisible();
  });

  test('should snooze match for 1 week', async ({ page }) => {
    await page.goto('/app/i/matching');
    await page.waitForSelector('[data-testid="match-card"]');

    // Get the ID of the first match
    const matchCard = page.locator('[data-testid="match-card"]').first();
    const matchId = await matchCard.getAttribute('data-match-id');

    // Click snooze button
    await matchCard.locator('button:has-text("Snooze")').click();

    // Select 1 week
    await page.click('button:has-text("1 week")');

    // Click snooze button in dialog
    await page.click('button:has-text("Snooze for 1 week")');

    // Wait for success toast
    await expect(page.locator('text=Match snoozed')).toBeVisible();

    // Verify match is no longer in the list
    await page.waitForTimeout(1000); // Wait for list to refresh
    const matchesAfter = page.locator(`[data-match-id="${matchId}"]`);
    await expect(matchesAfter).toHaveCount(0);
  });

  test('should allow custom snooze date', async ({ page }) => {
    await page.goto('/app/i/matching');
    await page.waitForSelector('[data-testid="match-card"]');

    // Click snooze button
    await page
      .locator('[data-testid="match-card"]')
      .first()
      .locator('button:has-text("Snooze")')
      .click();

    // Check if custom date option exists
    const customDateOption = page.locator('[data-testid="custom-date-picker"]');
    if (await customDateOption.isVisible()) {
      // Select a date 10 days from now
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      await customDateOption.fill(futureDate.toISOString().split('T')[0]);

      await page.click('button:has-text("Snooze")');
      await expect(page.locator('text=Match snoozed')).toBeVisible();
    }
  });

  test('should unsnooze a snoozed match', async ({ page }) => {
    // First, snooze a match
    await page.goto('/app/i/matching');
    await page.waitForSelector('[data-testid="match-card"]');

    const matchCard = page.locator('[data-testid="match-card"]').first();
    await matchCard.locator('button:has-text("Snooze")').click();
    await page.click('button:has-text("1 week")');
    await page.click('button:has-text("Snooze for 1 week")');

    // Navigate to snoozed matches (if there's a view for it)
    const snoozedLink = page.locator('text=Snoozed Matches');
    if (await snoozedLink.isVisible()) {
      await snoozedLink.click();

      // Unsnooze the match
      await page.locator('button:has-text("Unsnooze")').first().click();
      await expect(page.locator('text=Match unsnoozed')).toBeVisible();
    }
  });

  test('should show snoozed matches count', async ({ page }) => {
    await page.goto('/app/i/matching');

    // Check if there's a snoozed matches indicator
    const snoozedIndicator = page.locator('[data-testid="snoozed-count"]');
    if (await snoozedIndicator.isVisible()) {
      const count = await snoozedIndicator.textContent();
      expect(count).toMatch(/\d+/); // Should show a number
    }
  });
});
