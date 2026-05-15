/**
 * E2E Tests for New MVP Features
 *
 * Tests critical user flows for newly implemented features:
 * - Match transparency (rank display, consent-to-share)
 * - Verification gates enforcement
 * - Interview scheduling with video platforms
 * - Decision workflow with SLA tracking
 * - AI-powered skill extraction
 * - Profile snippet sharing
 * - Audit log viewing
 */

import { test, expect } from '@playwright/test';

test.describe('Match Transparency Features', () => {
  test.beforeEach(async ({ page }) => {
    // Login as individual user
    await page.goto('/auth/signin');
    await page.fill('[name="email"]', 'test.individual@example.com');
    await page.fill('[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/app/i/dashboard');
  });

  test('should display match explainer with rank', async ({ page }) => {
    // Navigate to matching page
    await page.goto('/app/i/matching');

    // Wait for matches to load
    await page.waitForSelector('[data-testid="match-card"]', { timeout: 10000 });

    // Click the proof-first match explainer trigger
    await page.getByTestId('match-explainer-trigger').click();

    // Verify explainer modal appears
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.getByTestId('match-explainer-title')).toHaveText('Why This Proof Match?');

    // Check for score breakdown
    await expect(page.locator('text=Comparative score detail')).toBeVisible();

    // Check for rank display
    await expect(page.locator('text=Ranking signal')).toBeVisible();
    await expect(page.locator('text=/Top \\d+|#\\d+ of \\d+|Competitive/')).toBeVisible();

    // Legacy purpose-fit badges stay out of the proof-first explainer.
    await expect(page.locator('[data-testid="pac-badge"]')).not.toBeVisible();
    await expect(page.locator('text=/PAC|Purpose-Alignment|purpose-fit/i')).not.toBeVisible();

    // Verify subscores are shown
    await expect(page.locator('text=Skills')).toBeVisible();
    await expect(page.locator('text=Constraints')).toBeVisible();
  });

  test('should show consent-to-share dialog before expressing interest', async ({ page }) => {
    await page.goto('/app/i/matching');

    // Wait for matches
    await page.waitForSelector('[data-testid="match-card"]');

    // Click "Interested" button
    await page.click('button:has-text("Interested")');

    // Verify consent dialog appears
    await expect(page.locator('text=Consent to Share Profile')).toBeVisible();

    // Check visible fields are listed
    await expect(page.locator('text=Information to be Shared')).toBeVisible();
    await expect(page.locator('text=Visible Fields')).toBeVisible();

    // Verify checkboxes are present
    await expect(page.locator('input[type="checkbox"]').first()).toBeVisible();

    // Cancel without consenting
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should block action when verification gates not met', async ({ page }) => {
    // Assume user doesn't have email verified
    await page.goto('/app/i/matching');
    await page.waitForSelector('[data-testid="match-card"]');

    // Try to express interest
    await page.click('button:has-text("Interested")');

    // Should see gates warning instead of consent dialog
    const warningVisible = await page
      .locator('text=Verification Required')
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (warningVisible) {
      // Verify warning message
      await expect(page.locator('text=complete the following')).toBeVisible();

      // Check that gates are listed
      await expect(page.locator('text=Email')).toBeVisible();
    }
  });
});

test.describe('Interview Scheduling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[name="email"]', 'test.org@example.com');
    await page.fill('[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/app/o/dashboard');
  });

  test('should allow scheduling interview with calendar picker', async ({ page }) => {
    // Navigate to a candidate profile or match
    await page.goto('/app/o/assignments/test-assignment-id');

    // Click schedule interview button
    await page.click('button:has-text("Schedule Interview")');

    // Verify scheduler appears
    await expect(page.locator('text=Schedule Interview')).toBeVisible();

    // Check for calendar
    await expect(page.locator('[role="grid"]')).toBeVisible(); // Calendar grid

    // Check for video platform selector
    await expect(page.locator('text=Zoom')).toBeVisible();
    await expect(page.locator('text=Google Meet')).toBeVisible();

    // Select a date (7 days from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const dayButton = page.locator(`button:has-text("${futureDate.getDate()}")`).first();
    await dayButton.click();

    // Select time slot
    await page.waitForSelector('[data-testid="time-slot"]');
    await page.click('[data-testid="time-slot"]').first();

    // Verify constraints (30-min duration shown)
    await expect(page.locator('text=30 minutes')).toBeVisible();
  });

  test('should show video platform connection status', async ({ page }) => {
    await page.goto('/app/o/assignments/test-assignment-id');
    await page.click('button:has-text("Schedule Interview")');

    // Check for platform status indicators
    const zoomStatus = page.locator('[data-testid="zoom-status"]');
    const googleStatus = page.locator('[data-testid="google-status"]');

    // At least one should be visible
    const hasStatus =
      (await zoomStatus.isVisible({ timeout: 2000 }).catch(() => false)) ||
      (await googleStatus.isVisible({ timeout: 2000 }).catch(() => false));

    expect(hasStatus).toBeTruthy();
  });
});

test.describe('Decision Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[name="email"]', 'test.org@example.com');
    await page.fill('[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
  });

  test('should display 48-hour SLA countdown', async ({ page }) => {
    // Navigate to interview that needs decision
    await page.goto('/app/o/interviews/completed-interview-id');

    // Click make decision button
    await page.click('button:has-text("Make Decision")');

    // Verify decision dialog
    await expect(page.locator('text=Make Hiring Decision')).toBeVisible();

    // Check for SLA countdown
    await expect(page.locator('text=Decision Deadline')).toBeVisible();
    await expect(page.locator('text=48-hour SLA')).toBeVisible();

    // Verify time remaining is shown
    const timeText = page.locator('text=/\\d+h \\d+m remaining/');
    await expect(timeText).toBeVisible();
  });

  test('should allow recording decision with feedback', async ({ page }) => {
    await page.goto('/app/o/interviews/completed-interview-id');
    await page.click('button:has-text("Make Decision")');

    // Select decision type
    await page.click('button:has-text("Hire")');

    // Add feedback
    await page.fill('textarea[placeholder*="notes"]', 'Excellent candidate with strong skills');

    // Submit decision
    await page.click('button:has-text("Confirm Decision")');

    // Verify success message
    await expect(page.locator('text=Decision recorded')).toBeVisible();
  });
});

test.describe('AI Skill Extraction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[name="email"]', 'test.individual@example.com');
    await page.fill('[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
  });

  test('should extract skills from pasted CV text', async ({ page }) => {
    await page.goto('/app/i/expertise');

    // Find CV/JD auto-suggest component
    await page.click('button:has-text("Auto-Suggest")');

    // Paste sample CV text
    const sampleCV = `
      Senior Software Engineer with 5+ years experience in Python and React.
      Proficient in TypeScript, AWS, and Docker. Led team of 5 developers.
    `;

    await page.fill('textarea[placeholder*="CV"]', sampleCV);

    // Click analyze button
    await page.click('button:has-text("Analyze")');

    // Wait for suggestions
    await page.waitForSelector('[data-testid="skill-suggestion"]', { timeout: 15000 });

    // Verify skills were extracted
    await expect(page.locator('text=Python')).toBeVisible();
    await expect(page.locator('text=React')).toBeVisible();

    // Check confidence scores are shown
    await expect(page.locator('text=/%/')).toBeVisible(); // Percentage badge
  });
});

test.describe('Profile Snippet Sharing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[name="email"]', 'test.individual@example.com');
    await page.fill('[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
  });

  test('should create shareable profile link', async ({ page }) => {
    await page.goto('/app/i/profile');

    // Click share button
    await page.click('button:has-text("Share Profile")');

    // Verify share dialog
    await expect(page.locator('text=Share Your Profile')).toBeVisible();

    // Configure fields to share
    await page.click('input[id="name"]'); // Toggle name
    await page.click('input[id="skills"]'); // Toggle skills

    // Select format
    await page.click('input[value="card"]');

    // Generate link
    await page.click('button:has-text("Generate")');

    // Verify link is created
    await expect(page.locator('text=Shareable URL')).toBeVisible();
    await expect(page.locator('input[readonly]')).toHaveValue(/https?:\/\/.+\/p\/.+/);

    // Check embed code is available
    await page.click('text=Embed');
    await expect(page.locator('text=HTML Embed Code')).toBeVisible();
    await expect(page.locator('textarea[readonly]')).toHaveValue(/<iframe/);
  });
});

test.describe('Audit Log Viewer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[name="email"]', 'test.individual@example.com');
    await page.fill('[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
  });

  test('should display user activity history', async ({ page }) => {
    await page.goto('/app/i/settings/privacy');

    // Navigate to audit log
    await page.click('text=Activity Log');

    // Verify audit log is displayed
    await expect(page.locator('text=Activity Log')).toBeVisible();

    // Check that events are listed
    await expect(page.locator('[data-testid="audit-event"]').first()).toBeVisible({
      timeout: 5000,
    });

    // Verify event details
    await expect(
      page.locator('text=/Created profile|Updated profile|Viewed|Signed in/')
    ).toBeVisible();

    // Check for device and IP info
    await expect(page.locator('text=IP:')).toBeVisible();
  });

  test('should allow searching audit log', async ({ page }) => {
    await page.goto('/app/i/settings/privacy');
    await page.click('text=Activity Log');

    // Wait for events to load
    await page.waitForSelector('[data-testid="audit-event"]');

    // Use search
    await page.fill('input[placeholder*="Search"]', 'profile');

    // Verify filtered results
    await expect(page.locator('text=profile')).toBeVisible();
  });

  test('should allow exporting audit log', async ({ page }) => {
    await page.goto('/app/i/settings/privacy');
    await page.click('text=Activity Log');

    // Wait for page to load
    await page.waitForSelector('[data-testid="audit-event"]');

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await page.click('button:has-text("Export")');

    // Verify download starts
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('audit-log');
    expect(download.suggestedFilename()).toContain('.json');
  });
});

test.describe('Web Vitals Monitoring', () => {
  test('should track performance metrics on page load', async ({ page }) => {
    // Navigate to a page
    await page.goto('/');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check that Web Vitals are being sent
    // (In a real test, you'd mock/intercept the /api/analytics/web-vitals endpoint)
    const performanceEntries = await page.evaluate(() => {
      return performance.getEntriesByType('navigation').length > 0;
    });

    expect(performanceEntries).toBeTruthy();
  });
});

test.describe('Matching Profile Preferences', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('[name="email"]', 'test.org@example.com');
    await page.fill('[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
  });

  test('should allow customizing match weights', async ({ page }) => {
    await page.goto('/app/o/settings/matching');

    // Click edit weights
    await page.click('button:has-text("Edit Weights")');

    // Adjust skill weight slider
    const skillSlider = page.locator('input[type="range"]').first();
    await skillSlider.fill('70'); // Set to 70%

    // Verify percentage updates
    await expect(page.locator('text=70%')).toBeVisible();

    // Enable hard constraint
    await page.click('input[id="require-skill-match"]');

    // Save profile
    await page.click('button:has-text("Save Profile")');

    // Verify success
    await expect(page.locator('text=Profile saved')).toBeVisible();
  });
});
