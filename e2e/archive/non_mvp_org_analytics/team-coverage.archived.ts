/**
 * E2E Tests: Team Coverage Matrix
 *
 * Tests the team coverage analytics including:
 * - Viewing coverage matrix
 * - Filtering by gaps/single points
 * - Exporting to CSV
 * - Understanding coverage statistics
 */

import { test, expect } from '@playwright/test';

test.describe('Team Coverage Matrix', () => {
  test.beforeEach(async ({ page }) => {
    // Login as org admin
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'org-admin@proofound.com');
    await page.fill('input[name="password"]', 'admin-password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/app/o/*');
  });

  test('should display team coverage matrix', async ({ page }) => {
    // Navigate to team coverage page
    await page.goto('/app/o/demo-org/team/coverage');

    // Verify page loads
    await expect(page.locator('text=Team Coverage Matrix')).toBeVisible();

    // Verify matrix table exists
    await expect(page.locator('table')).toBeVisible();

    // Check for column headers (team members)
    const headers = page.locator('thead th');
    await expect(headers).toHaveCountGreaterThan(2); // At least skill columns + members
  });

  test('should show coverage statistics', async ({ page }) => {
    await page.goto('/app/o/demo-org/team/coverage');

    // Verify stats cards
    await expect(page.locator('text=Team Members')).toBeVisible();
    await expect(page.locator('text=No Coverage')).toBeVisible();
    await expect(page.locator('text=Single Point')).toBeVisible();
    await expect(page.locator('text=Good Coverage')).toBeVisible();

    // Stats should show numbers
    const statNumbers = page.locator('[data-testid="coverage-stat"]');
    if ((await statNumbers.count()) > 0) {
      const firstStat = await statNumbers.first().textContent();
      expect(firstStat).toMatch(/\d+/);
    }
  });

  test('should filter by coverage gaps', async ({ page }) => {
    await page.goto('/app/o/demo-org/team/coverage');

    // Click "Gaps Only" filter
    await page.click('button:has-text("Gaps Only")');

    // Verify only gap skills are shown (coverage = 0)
    const coverageCells = page.locator('[data-testid="coverage-cell"]');
    if ((await coverageCells.count()) > 0) {
      for (let i = 0; i < (await coverageCells.count()); i++) {
        const cell = coverageCells.nth(i);
        const hasZeroCoverage = await cell.locator('text=0').isVisible();
        expect(hasZeroCoverage).toBeTruthy();
      }
    }
  });

  test('should filter by single points of failure', async ({ page }) => {
    await page.goto('/app/o/demo-org/team/coverage');

    // Click "Single Points" filter
    await page.click('button:has-text("Single Points")');

    // Verify only single-coverage skills are shown (coverage = 1)
    const coverageCells = page.locator('[data-testid="coverage-cell"]');
    if ((await coverageCells.count()) > 0) {
      for (let i = 0; i < (await coverageCells.count()); i++) {
        const cell = coverageCells.nth(i);
        const hasSingleCoverage = await cell.locator('text=1').isVisible();
        expect(hasSingleCoverage).toBeTruthy();
      }
    }
  });

  test('should show all skills when "All Skills" filter is selected', async ({ page }) => {
    await page.goto('/app/o/demo-org/team/coverage');

    // First apply a filter
    await page.click('button:has-text("Gaps Only")');

    // Then click "All Skills"
    await page.click('button:has-text("All Skills")');

    // Verify all skills are shown (mix of coverages)
    const skillRows = page.locator('tbody tr');
    await expect(skillRows).toHaveCountGreaterThan(0);
  });

  test('should export coverage matrix to CSV', async ({ page }) => {
    await page.goto('/app/o/demo-org/team/coverage');

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await page.click('button:has-text("Export CSV")');

    // Wait for download
    const download = await downloadPromise;

    // Verify filename
    expect(download.suggestedFilename()).toContain('team-coverage');
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should show color-coded coverage indicators', async ({ page }) => {
    await page.goto('/app/o/demo-org/team/coverage');

    // Look for color-coded cells
    const redCells = page.locator('[class*="bg-[#FEE]"]'); // No coverage
    const yellowCells = page.locator('[class*="bg-[#FFF4E6]"]'); // Single point
    const greenCells = page.locator('[class*="bg-[#E8F5E1]"]'); // Good coverage

    // At least one color should be present
    const totalColoredCells =
      (await redCells.count()) + (await yellowCells.count()) + (await greenCells.count());
    expect(totalColoredCells).toBeGreaterThan(0);
  });

  test('should show skill categories', async ({ page }) => {
    await page.goto('/app/o/demo-org/team/coverage');

    // Verify L2 categories are shown
    const categoryBadges = page.locator('[data-testid="skill-category-badge"]');
    if ((await categoryBadges.count()) > 0) {
      await expect(categoryBadges.first()).toBeVisible();
    }
  });

  test('should show team member roles', async ({ page }) => {
    await page.goto('/app/o/demo-org/team/coverage');

    // Look for role labels under team member names
    const roleLabels = page.locator('thead [data-testid="member-role"]');
    if ((await roleLabels.count()) > 0) {
      await expect(roleLabels.first()).toBeVisible();
    }
  });

  test('should handle empty team gracefully', async ({ page }) => {
    // Navigate to org with no team members
    await page.goto('/app/o/empty-org/team/coverage');

    // Should show empty state
    const emptyMessage = page.locator('text=/No team members|Add team members/i');
    await expect(emptyMessage).toBeVisible();
  });

  test('should handle no skills gracefully', async ({ page }) => {
    // Navigate to org where team has no skills
    await page.goto('/app/o/new-org/team/coverage');

    // Should show empty state
    const emptyMessage = page.locator('text=/No skills tracked|Add skills/i');
    await expect(emptyMessage).toBeVisible();
  });
});
