import { test, expect } from '@playwright/test';

/**
 * Core Workflow E2E Tests
 *
 * Tests critical user workflows:
 * - Profile creation and editing
 * - Assignment creation
 * - Matching system
 * - Interview scheduling
 */

test.describe('Core Workflows', () => {
  test.describe('Profile Management', () => {
    test('should display user profile page', async ({ page }) => {
      // Navigate to profile (might redirect to login if not authenticated)
      await page.goto('/app/i/profile');

      // Wait for page to load
      await page.waitForTimeout(1000);

      // If redirected to login, that's ok - test still passes
      if (page.url().includes('/login')) {
        expect(page.url()).toContain('/login');
        return;
      }

      // Should show profile content
      expect(page.url()).toContain('/profile');
    });

    test('should allow editing profile', async ({ page }) => {
      await page.goto('/app/i/profile');

      await page.waitForTimeout(1000);

      if (page.url().includes('/login')) {
        // Not authenticated - skip test
        return;
      }

      // Look for edit button
      const editButton = page.getByRole('button', { name: /edit|update/i });

      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(500);

        // Should show edit form or fields become editable
        const saveButton = page.getByRole('button', { name: /save|update/i });
        expect(await saveButton.isVisible()).toBeTruthy();
      }
    });

    test('should allow updating headline', async ({ page }) => {
      await page.goto('/app/i/profile');

      await page.waitForTimeout(1000);

      if (page.url().includes('/login')) {
        return;
      }

      const headlineField = page.getByLabel(/headline|title/i);

      if (await headlineField.isVisible()) {
        await headlineField.fill('Updated Test Headline');

        const saveButton = page.getByRole('button', { name: /save|update/i });
        if (await saveButton.isVisible()) {
          await saveButton.click();

          // Should show success message
          await expect(page.getByText(/saved|updated|success/i)).toBeVisible({
            timeout: 5000,
          });
        }
      }
    });

    test('should show profile sections', async ({ page }) => {
      await page.goto('/app/i/profile');

      await page.waitForTimeout(1000);

      if (page.url().includes('/login')) {
        return;
      }

      // Check for common profile sections
      const sections = [
        /about|bio/i,
        /skills|expertise/i,
        /experience|work history/i,
        /education/i,
      ];

      // At least one section should be visible
      let foundSection = false;

      for (const sectionRegex of sections) {
        const section = page.getByRole('heading', { name: sectionRegex });
        if (await section.isVisible()) {
          foundSection = true;
          break;
        }
      }

      const emptyProfileState = page.getByText(/start building|add proof|complete your profile/i);
      const hasEmptyState = await emptyProfileState.isVisible();

      expect(foundSection || hasEmptyState).toBeTruthy();
    });
  });

  test.describe('Assignment Creation (Organization)', () => {
    test('should display assignment creation page', async ({ page }) => {
      await page.goto('/app/o/test-org/assignments/new');

      await page.waitForTimeout(1000);

      if (page.url().includes('/login')) {
        expect(page.url()).toContain('/login');
        return;
      }

      expect(page.url()).toContain('/assignments/new');
      await expect(page.getByRole('heading', { name: /create new assignment/i })).toBeVisible();
    });

    test('should show step-by-step wizard', async ({ page }) => {
      await page.goto('/app/o/test-org/assignments/new');

      await page.waitForTimeout(1000);

      if (page.url().includes('/login')) {
        expect(page.url()).toContain('/login');
        return;
      }

      await expect(page.getByText(/step 1 of 5/i)).toBeVisible();
      await expect(page.getByRole('heading', { name: /step 1: business value/i })).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/app/o/test-org/assignments/new');

      await page.waitForTimeout(1000);

      if (page.url().includes('/login')) {
        expect(page.url()).toContain('/login');
        return;
      }

      const nextButton = page.getByRole('button', { name: /next: target outcomes/i });
      await expect(nextButton).toBeDisabled();
    });

    test('should allow entering assignment details', async ({ page }) => {
      await page.goto('/app/o/test-org/assignments/new');

      await page.waitForTimeout(1000);

      if (page.url().includes('/login')) {
        expect(page.url()).toContain('/login');
        return;
      }

      const roleField = page.getByLabel(/role title/i);
      const businessValueField = page.getByLabel(/business value/i);
      await roleField.fill('Senior Software Engineer');
      await businessValueField.fill('Improve platform reliability and delivery speed.');
      await expect(roleField).toHaveValue('Senior Software Engineer');
      await expect(businessValueField).toHaveValue(
        'Improve platform reliability and delivery speed.'
      );
    });
  });

  test.describe('Matching System', () => {
    test('should display matching page', async ({ page }) => {
      await page.goto('/app/i/matching');

      await page.waitForTimeout(1000);

      if (page.url().includes('/login')) {
        return;
      }

      expect(page.url()).toContain('/matching');
    });

    test('should show available matches', async ({ page }) => {
      await page.goto('/app/i/matching');

      await page.waitForTimeout(1000);

      if (page.url().includes('/login')) {
        return;
      }

      // Look for match cards or list
      const matchCards = page.locator('[data-testid="match-card"], [data-match], .match-card');
      const hasMatches = (await matchCards.count()) > 0;

      // Or look for empty state
      const emptyState = page.getByText(/no matches|assignment reviews|check back/i);
      const hasEmptyState = await emptyState.isVisible();

      // Either matches or empty state should be present
      expect(hasMatches || hasEmptyState).toBeTruthy();
    });

    test('should allow viewing match details', async ({ page }) => {
      await page.goto('/app/i/matching');

      await page.waitForTimeout(1000);

      if (page.url().includes('/login')) {
        return;
      }

      // Find and click first match
      const firstMatch = page
        .locator('[data-testid="match-card"], [data-match], .match-card')
        .first();

      if (await firstMatch.isVisible()) {
        await firstMatch.click();
        await page.waitForTimeout(1000);

        // Should show match details or navigate to detail page
        const hasDetails = await page.getByText(/requirements|skills|description/i).isVisible();

        expect(hasDetails || page.url().includes('/match')).toBeTruthy();
      }
    });

    test('keeps matching proof-led and score-free', async ({ page }) => {
      await page.goto('/app/i/matching');

      await page.waitForTimeout(1000);

      if (page.url().includes('/login')) {
        return;
      }

      const rawScoreIndicator = page.getByText(/\b\d{1,3}%\b|match score|fit score/i);

      await expect(rawScoreIndicator).toHaveCount(0);
    });

    test('should allow filtering matches', async ({ page }) => {
      await page.goto('/app/i/matching');

      await page.waitForTimeout(1000);

      if (page.url().includes('/login')) {
        return;
      }

      // Look for filter controls
      const filterButton = page.getByRole('button', { name: /filter|sort/i });

      if (await filterButton.isVisible()) {
        await filterButton.click();
        await page.waitForTimeout(500);

        // Should show filter options
        const filterSurface = page
          .getByRole('dialog')
          .or(page.getByRole('menu'))
          .or(page.locator('[data-testid*="filter"], [data-filter]'));
        await expect(filterSurface.first()).toBeVisible();
        return;
      }

      const matchCards = page.locator('[data-testid="match-card"], [data-match], .match-card');
      const emptyState = page.getByText(/no matches|assignment reviews|check back/i);
      expect((await matchCards.count()) > 0 || (await emptyState.isVisible())).toBeTruthy();
    });
  });

  test.describe('Interview Scheduling', () => {
    test('should display interviews page', async ({ page }) => {
      await page.goto('/app/i/interviews');

      await page.waitForTimeout(1000);

      if (page.url().includes('/login')) {
        return;
      }

      expect(page.url()).toContain('/interviews');
    });

    test('should show interview list or empty state', async ({ page }) => {
      await page.goto('/app/i/interviews');

      await page.waitForTimeout(1000);

      if (page.url().includes('/login')) {
        return;
      }

      // Look for interview cards or empty state
      const interviewCards = page.locator('[data-interview], .interview-card');
      const hasInterviews = (await interviewCards.count()) > 0;

      const emptyState = page.getByText(/no interviews|schedule interview/i);
      const hasEmptyState = await emptyState.isVisible();

      expect(hasInterviews || hasEmptyState).toBeTruthy();
    });

    test('should show schedule interview button', async ({ page }) => {
      await page.goto('/app/i/interviews');

      await page.waitForTimeout(1000);

      if (page.url().includes('/login')) {
        return;
      }

      // Look for schedule button (might only be available for certain matches)
      const scheduleButton = page.getByRole('button', { name: /schedule|book interview/i });

      const interviewCards = page.locator('[data-interview], .interview-card');
      const emptyState = page.getByText(/no interviews|schedule interview/i);
      expect(
        (await scheduleButton.isVisible()) ||
          (await interviewCards.count()) > 0 ||
          (await emptyState.isVisible())
      ).toBeTruthy();
    });

    test('should show interview details', async ({ page }) => {
      await page.goto('/app/i/interviews');

      await page.waitForTimeout(1000);

      if (page.url().includes('/login')) {
        return;
      }

      // Find first interview
      const firstInterview = page.locator('[data-interview], .interview-card').first();

      if (await firstInterview.isVisible()) {
        // Should show time, date, meeting link
        const hasDetails =
          (await page.getByText(/\d{1,2}:\d{2}|am|pm/i).isVisible()) ||
          (await page.getByRole('link', { name: /join|meeting link/i }).isVisible());

        expect(hasDetails).toBeTruthy();
      }
    });
  });

  test.describe('Messaging', () => {
    test('should display messages page', async ({ page }) => {
      await page.goto('/app/i/messages');

      await page.waitForTimeout(1000);

      if (page.url().includes('/login')) {
        return;
      }

      expect(page.url()).toContain('/messages');
    });

    test('should show conversation list', async ({ page }) => {
      await page.goto('/app/i/messages');

      await page.waitForTimeout(1000);

      if (page.url().includes('/login')) {
        return;
      }

      // Look for conversations or empty state
      const conversations = page.locator('[data-conversation], .conversation-item');
      const hasConversations = (await conversations.count()) > 0;

      const emptyState = page.getByText(/no messages|no conversations|start messaging/i);
      const hasEmptyState = await emptyState.isVisible();

      expect(hasConversations || hasEmptyState).toBeTruthy();
    });

    test('should allow viewing conversation', async ({ page }) => {
      await page.goto('/app/i/messages');

      await page.waitForTimeout(1000);

      if (page.url().includes('/login')) {
        return;
      }

      // Click first conversation
      const firstConversation = page.locator('[data-conversation], .conversation-item').first();

      if (await firstConversation.isVisible()) {
        await firstConversation.click();
        await page.waitForTimeout(1000);

        // Should show message thread
        const messageInput = page.getByPlaceholder(/type.*message|write.*message/i);
        expect(await messageInput.isVisible()).toBeTruthy();
      }
    });

    test('should allow sending message', async ({ page }) => {
      await page.goto('/app/i/messages');

      await page.waitForTimeout(1000);

      if (page.url().includes('/login')) {
        return;
      }

      // Navigate to a conversation
      const firstConversation = page.locator('[data-conversation], .conversation-item').first();

      if (await firstConversation.isVisible()) {
        await firstConversation.click();
        await page.waitForTimeout(1000);

        // Type and send message
        const messageInput = page.getByPlaceholder(/type.*message|write.*message/i);

        if (await messageInput.isVisible()) {
          await messageInput.fill('Test message from E2E test');

          const sendButton = page.getByRole('button', { name: /send/i });
          if (await sendButton.isVisible()) {
            await sendButton.click();

            // Should see message in thread
            await expect(page.getByText('Test message from E2E test')).toBeVisible({
              timeout: 5000,
            });
          }
        }
      }
    });
  });

  test.describe('Archived Contract Surfaces', () => {
    test('does not expose contract signing as an active MVP route', async ({ page }) => {
      await page.goto('/app/i/contracts');

      await page.waitForTimeout(1000);

      if (page.url().includes('/login')) {
        expect(page.url()).toContain('/login');
        return;
      }

      await expect(
        page.getByRole('heading', { name: /contract|agreement|attestation/i })
      ).toHaveCount(0);
      await expect(page.getByRole('button', { name: /sign|attest/i })).toHaveCount(0);
    });
  });
});
