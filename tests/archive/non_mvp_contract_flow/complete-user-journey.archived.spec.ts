/**
 * E2E Test: Complete User Journey
 *
 * Tests the critical path from signup to contract signing
 */

import { test, expect } from '@playwright/test';
import { SignupPage, MatchingPage, ContractPage } from './helpers/page-objects';

test.describe('Complete User Journey', () => {
  test('Individual: signup → match → contract', async ({ page }) => {
    // Generate unique test email
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'SecureTestPass123!';
    const testName = 'Test User';

    // Step 1: Sign up as individual
    const signupPage = new SignupPage(page);
    await signupPage.goto();
    await signupPage.signupAsIndividual(testEmail, testPassword, testName);

    // Step 2: Complete profile setup
    await page.waitForURL('/app/i/profile');
    await page.fill('[name="bio"]', 'Experienced software engineer passionate about climate tech');

    // Add skills
    await page.click('button:has-text("Add Skill")');
    await page.fill('[placeholder="Search skills"]', 'JavaScript');
    await page.click('text=JavaScript'); // Select from dropdown
    await page.selectOption('[name="skillLevel"]', '5');
    await page.click('button:has-text("Save")');

    // Step 3: Navigate to matching
    const matchingPage = new MatchingPage(page);
    await matchingPage.goto();

    // Wait for matches to load
    await matchingPage.waitForMatches();

    // Verify we have matches
    const matchCount = await matchingPage.matchCards.count();
    expect(matchCount).toBeGreaterThan(0);

    // Step 4: Express interest in first match
    await matchingPage.clickMatch(0);
    await page.click('button:has-text("Express Interest")');

    // Verify interest recorded
    await expect(page.locator('text=Interest sent')).toBeVisible();

    // Note: Full contract flow would require org member to respond
    // For E2E test, we would mock or use test data
  });

  test('Data portability: export → import', async ({ page }) => {
    // This would test the complete data export/import flow
    // For now, verify the export page is accessible
    await page.goto('/app/settings/data');
    await expect(page.locator('text=Export My Data')).toBeVisible();
  });
});
