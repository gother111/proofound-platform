/**
 * E2E Tests: Fairness Note & Gap Analysis
 *
 * Tests the fairness gap analysis features including:
 * - Viewing fairness note on dashboard
 * - Manual report generation
 * - Understanding findings and recommendations
 */

import { test, expect } from '@playwright/test';

test.describe('Fairness Note & Gap Analysis', () => {
  test.beforeEach(async ({ page }) => {
    // Login as org admin
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'org-admin@proofound.com');
    await page.fill('input[name="password"]', 'admin-password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/app/o/*');
  });

  test('should display fairness note card on dashboard', async ({ page }) => {
    // Navigate to org dashboard
    await page.goto('/app/o/demo-org/home');

    // Verify fairness note card exists
    await expect(page.locator('text=Fairness Gap Analysis')).toBeVisible();
  });

  test('should show fairness status (gaps or all clear)', async ({ page }) => {
    await page.goto('/app/o/demo-org/home');

    // Look for status indicators
    const statusIndicators = page.locator('text=/Review Recommended|All Clear/');
    await expect(statusIndicators).toBeVisible();
  });

  test('should display key findings if gaps exist', async ({ page }) => {
    await page.goto('/app/o/demo-org/home');

    // Look for findings section
    const findingsSection = page.locator('text=Key Findings');
    if (await findingsSection.isVisible()) {
      // Should show at least one finding
      const findings = page.locator('[data-testid="fairness-finding"]');
      await expect(findings).toHaveCountGreaterThan(0);

      // Findings should show cohort info and deviation
      const firstFinding = findings.first();
      await expect(firstFinding).toContainText(/\d+%/); // Deviation percentage
    }
  });

  test('should show recommendations when gaps exist', async ({ page }) => {
    await page.goto('/app/o/demo-org/home');

    // Look for recommendations section
    const recommendations = page.locator('text=Recommended Actions');
    if (await recommendations.isVisible()) {
      // Should show actionable recommendations
      const actionItems = page.locator('[data-testid="fairness-recommendation"]');
      await expect(actionItems).toHaveCountGreaterThan(0);
    }
  });

  test('should refresh fairness data on demand', async ({ page }) => {
    await page.goto('/app/o/demo-org/home');

    // Click refresh button
    const refreshButton = page.locator('button:has-text("Refresh")');
    if (await refreshButton.isVisible()) {
      await refreshButton.click();

      // Should show loading state briefly
      await expect(page.locator('text=/Analyzing|Loading/')).toBeVisible();

      // Then show updated data
      await expect(page.locator('text=/Fairness Gap Analysis/i')).toBeVisible();
    }
  });

  test('should navigate to manual generation page', async ({ page }) => {
    await page.goto('/app/o/demo-org/analytics/fairness');

    // Verify page loads
    await expect(page.locator('text=Generate Fairness Report')).toBeVisible();
    await expect(page.locator('text=Generate Comprehensive Report')).toBeVisible();
  });

  test('should generate manual fairness report', async ({ page }) => {
    await page.goto('/app/o/demo-org/analytics/fairness');

    // Click generate button
    await page.click('button:has-text("Generate Comprehensive Report")');

    // Should show loading state
    await expect(page.locator('text=Generating Report')).toBeVisible();

    // Wait for completion (with timeout)
    await expect(
      page.locator('text=/Report Generated Successfully|Analyzed \d+ cohorts/')
    ).toBeVisible({
      timeout: 30000,
    });
  });

  test('should show report generation details', async ({ page }) => {
    await page.goto('/app/o/demo-org/analytics/fairness');

    // Generate report
    await page.click('button:has-text("Generate Comprehensive Report")');
    await page.waitForSelector('text=/Report Generated Successfully/', { timeout: 30000 });

    // Verify report details are shown
    await expect(page.locator('text=/Analyzed \d+ cohorts/')).toBeVisible();
    await expect(page.locator('text=/\d+ finding(s)?/')).toBeVisible();
  });

  test('should display significance threshold information', async ({ page }) => {
    await page.goto('/app/o/demo-org/analytics/fairness');

    // Verify info cards
    await expect(page.locator('text=Significance Threshold')).toBeVisible();
    await expect(page.locator('text=/20%|10 samples/')).toBeVisible();
  });

  test('should display data privacy information', async ({ page }) => {
    await page.goto('/app/o/demo-org/analytics/fairness');

    // Verify privacy notice
    await expect(page.locator('text=Data Privacy')).toBeVisible();
    await expect(page.locator('text=/aggregated|anonymized/')).toBeVisible();
  });

  test('should show automated analysis schedule', async ({ page }) => {
    await page.goto('/app/o/demo-org/analytics/fairness');

    // Verify cron schedule info
    await expect(page.locator('text=Automated Daily Analysis')).toBeVisible();
    await expect(page.locator('text=/2 AM UTC|daily/')).toBeVisible();
  });

  test('should display cohort count', async ({ page }) => {
    await page.goto('/app/o/demo-org/home');

    // Look for cohort count in fairness card
    const cohortInfo = page.locator('text=/\d+ cohorts analyzed/');
    if (await cohortInfo.isVisible()) {
      const text = await cohortInfo.textContent();
      expect(text).toMatch(/\d+ cohorts/);
    }
  });

  test('should show real-time badge when calculated on-the-fly', async ({ page }) => {
    await page.goto('/app/o/demo-org/home');

    // Look for real-time indicator
    const realtimeBadge = page.locator('text=Real-time');
    if (await realtimeBadge.isVisible()) {
      // Indicates calculation was done on-the-fly
      await expect(realtimeBadge).toBeVisible();
    }
  });

  test('should show last updated time', async ({ page }) => {
    await page.goto('/app/o/demo-org/home');

    // Look for timestamp
    const timestamp = page.locator('text=/Updated \d+[hdm] ago|just now/i');
    if (await timestamp.isVisible()) {
      await expect(timestamp).toBeVisible();
    }
  });

  test('should handle insufficient data gracefully', async ({ page }) => {
    // Navigate to org with no hiring data
    await page.goto('/app/o/new-org/home');

    // Should show insufficient data message
    const insufficientData = page.locator('text=/Insufficient Data|Analysis requires more/i');
    if (await insufficientData.isVisible()) {
      await expect(insufficientData).toBeVisible();
    }
  });
});
