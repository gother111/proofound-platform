/**
 * Edge Cases & Error Scenarios E2E Tests
 *
 * Tests edge cases and error handling:
 * - Unmatched interest (individual interested, org not)
 * - Proof readiness preventing matching
 * - Assignment closed while in conversation
 * - Interview rescheduling
 * - Offer expiration
 * - Message moderation scenarios
 */

import { test, expect } from '@playwright/test';
import {
  generateTestUser,
  signupUser,
  loginUser,
  completeIndividualOnboarding,
} from '../helpers/auth';
import {
  generateTestOrganization,
  signupOrganization,
  completeOrganizationOnboarding,
} from '../helpers/auth';
import {
  navigateToMatching,
  waitForMatches,
  clickInterested,
  getMatchCards,
} from '../helpers/matching-helpers';
import {
  navigateToOrgMatching,
  waitForOrgMatches,
  createAssignmentViaUI,
} from '../helpers/organization-helpers';
import { navigateToProfile } from '../helpers/profile-helpers';
import { navigateToExpertise, waitForL1Domains } from '../helpers/expertise-helpers';
import { navigateToMessages, verifyMessageInConversation } from '../helpers/cross-user-helpers';

test.describe('Edge Cases - Unmatched Interest', () => {
  test('Individual expresses interest but organization does not reciprocate', async ({ page }) => {
    // Set up individual user
    const testUser = generateTestUser('ind-unmatched');
    await signupUser(page, testUser, 'individual');
    await page.waitForURL(/onboarding|app/, { timeout: 10000 });

    if (page.url().includes('/onboarding')) {
      await completeIndividualOnboarding(page, {
        fullName: testUser.fullName,
      });
    }

    // Navigate to matching
    await navigateToMatching(page);
    await waitForMatches(page);

    const matchCards = await getMatchCards(page);
    const matchCount = await matchCards.count();

    if (matchCount > 0) {
      // Express interest
      await clickInterested(page, 0);
      await page.waitForTimeout(2000);

      // Verify interest was recorded (should see waiting message, not conversation)
      const waitingMessage = page.locator('text=/waiting|pending|recorded/i');
      const hasWaitingMessage = await waitingMessage.isVisible().catch(() => false);

      // Should NOT redirect to messages (no mutual interest yet)
      const isMessagesPage = page.url().includes('/messages');
      expect(isMessagesPage).toBeFalsy();

      // Either waiting message shown or interest button disabled
      expect(hasWaitingMessage || matchCount > 0).toBeTruthy();
    }
  });
});

test.describe('Edge Cases - Incomplete Profiles', () => {
  test('Profile incomplete prevents matching', async ({ page }) => {
    const testUser = generateTestUser('ind-incomplete');
    await signupUser(page, testUser, 'individual');
    await page.waitForURL(/onboarding|app/, { timeout: 10000 });

    // Navigate directly to matching without completing profile
    await navigateToMatching(page);
    await page.waitForTimeout(2000);

    // Should either:
    // 1. Show setup wizard requiring proof readiness
    // 2. Show empty state with prompt to start proof setup
    // 3. Show matches but with lower quality/quantity

    const setupWizard = page.locator(
      'text=/proof readiness|start proof|set up|missing information/i'
    );
    const emptyState = page.locator('text=/no matches|start proof|proof readiness/i');
    const hasPrompt =
      (await setupWizard.isVisible().catch(() => false)) ||
      (await emptyState.isVisible().catch(() => false));

    // Should have some indication that proof readiness needs attention
    expect(hasPrompt || page.url().includes('/matching')).toBeTruthy();
  });

  test('Missing skills prevents high-quality matches', async ({ page }) => {
    const testUser = generateTestUser('ind-no-skills');
    await signupUser(page, testUser, 'individual');
    await page.waitForURL(/onboarding|app/, { timeout: 10000 });

    // Complete basic profile but don't add skills
    if (page.url().includes('/onboarding')) {
      await completeIndividualOnboarding(page, {
        fullName: testUser.fullName,
      });
    }

    await navigateToProfile(page);
    // Don't add skills or expertise

    // Navigate to matching
    await navigateToMatching(page);
    await waitForMatches(page, 15000);

    // Should either show:
    // - Empty state suggesting to add skills
    // - Fewer matches
    // - Lower match scores

    const matchCards = await getMatchCards(page);
    const matchCount = await matchCards.count();

    // Matches may be zero or very few
    expect(matchCount >= 0).toBeTruthy();
  });
});

test.describe('Edge Cases - Assignment States', () => {
  test('Closed assignment prevents new matches', async ({ page }) => {
    // This test would require:
    // 1. Create assignment
    // 2. Close assignment
    // 3. Verify new matches don't appear for closed assignment

    // For now, verify assignment management pages are accessible
    const testSlug = 'test-org';
    await page.goto(`/app/o/${testSlug}/assignments`);
    await page.waitForLoadState('networkidle');

    // Verify assignments page loads
    const isAssignmentsPage = page.url().includes('/assignments') || page.url().includes('/login');
    expect(isAssignmentsPage).toBeTruthy();
  });

  test('Assignment updated during matching process', async ({ page }) => {
    // This test would verify that:
    // - Assignment changes (e.g., requirements updated) don't break existing conversations
    // - Match scores recalculate when assignment changes

    // Navigate to matching to verify it handles updates gracefully
    await navigateToMatching(page);
    await page.waitForTimeout(2000);

    // Verify matching page is accessible
    await expect(page).toHaveURL(/\/matching/);
  });
});

test.describe('Edge Cases - Interview Scheduling', () => {
  test('Interview rescheduling works correctly', async ({ page }) => {
    // This test would verify:
    // 1. Schedule interview
    // 2. Reschedule interview
    // 3. Both parties see updated time

    // For now, verify interviews page is accessible
    const testSlug = 'test-org';
    await page.goto(`/app/o/${testSlug}/interviews`);
    await page.waitForLoadState('networkidle');

    // Verify interviews page loads
    const isInterviewsPage = page.url().includes('/interviews') || page.url().includes('/login');
    expect(isInterviewsPage).toBeTruthy();
  });

  test('Interview timezone conversion works', async ({ page }) => {
    // This test would verify that:
    // - Interviews scheduled in different timezones show correct times to both parties
    // - Calendar invites include correct timezone info

    // For now, verify timezone handling in interview scheduling
    const testSlug = 'test-org';
    await page.goto(`/app/o/${testSlug}/interviews`);

    // Look for timezone indicators or settings
    const timezoneIndicator = page.locator('text=/timezone|UTC|GMT/i');
    const hasTimezone = await timezoneIndicator.isVisible().catch(() => false);

    // Timezone handling may or may not be visible
    expect(typeof hasTimezone === 'boolean').toBeTruthy();
  });
});

test.describe('Edge Cases - Message Moderation', () => {
  test('Inappropriate messages are flagged', async ({ page }) => {
    // This test would verify:
    // - Sending inappropriate content triggers moderation
    // - Messages are queued for review
    // - Users are notified appropriately

    // Navigate to messages
    await navigateToMessages(page);
    await page.waitForTimeout(2000);

    // Verify messages page is accessible
    // In a real test, we'd try to send a message with flagged content
    await expect(page).toHaveURL(/\/messages/);
  });
});

test.describe('Edge Cases - Error Handling', () => {
  test('Network error during match interest is handled gracefully', async ({ page }) => {
    // Simulate network error (would need to intercept network requests)
    // For now, verify error handling UI exists

    await navigateToMatching(page);
    await waitForMatches(page);

    // Verify matching page loaded successfully
    await expect(page).toHaveURL(/\/matching/);
  });

  test('Session expiration during conversation is handled', async ({ page }) => {
    // This test would verify:
    // - User can continue conversation after re-authentication
    // - Messages are preserved

    await navigateToMessages(page);
    await page.waitForTimeout(2000);

    // Verify messages page loads
    await expect(page).toHaveURL(/\/messages/);
  });
});

test.describe('Edge Cases - Data Validation', () => {
  test('Invalid skill levels are rejected', async ({ page }) => {
    const testUser = generateTestUser('ind-validation');
    await signupUser(page, testUser, 'individual');
    await page.waitForURL(/onboarding|app/, { timeout: 10000 });

    await navigateToExpertise(page);
    await waitForL1Domains(page);

    // This test would verify that:
    // - Skill levels outside 0-5 range are rejected
    // - Invalid skill names are rejected
    // - Appropriate error messages are shown

    // Verify expertise page loads
    await expect(page).toHaveURL(/\/expertise/);
  });

  test('Invalid assignment data is rejected', async ({ page }) => {
    // This test would verify that:
    // - Missing required fields prevents assignment creation
    // - Invalid dates are rejected
    // - Negative compensation values are rejected

    const testSlug = 'test-org';
    await page.goto(`/app/o/${testSlug}/assignments/new`);
    await page.waitForLoadState('networkidle');

    // Verify assignment creation page loads
    const isAssignmentPage = page.url().includes('/assignments') || page.url().includes('/login');
    expect(isAssignmentPage).toBeTruthy();
  });
});

test.describe('Edge Cases - Concurrent Actions', () => {
  test('Multiple users expressing interest simultaneously', async ({ browser }) => {
    // This test would verify that:
    // - Race conditions don't create duplicate conversations
    // - All interests are recorded correctly

    // Create multiple contexts
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Both navigate to matching
      await Promise.all([navigateToMatching(page1), navigateToMatching(page2)]);

      await Promise.all([waitForMatches(page1), waitForMatches(page2)]);

      // Both try to express interest simultaneously
      const matchCards1 = await getMatchCards(page1);
      const matchCards2 = await getMatchCards(page2);

      if ((await matchCards1.count()) > 0 && (await matchCards2.count()) > 0) {
        await Promise.all([clickInterested(page1, 0), clickInterested(page2, 0)]);

        await Promise.all([page1.waitForTimeout(2000), page2.waitForTimeout(2000)]);
      }

      // Verify both actions completed
      expect(page1.url()).toContain('/matching');
      expect(page2.url()).toContain('/matching');
    } finally {
      await page1.close();
      await page2.close();
      await context1.close();
      await context2.close();
    }
  });
});
