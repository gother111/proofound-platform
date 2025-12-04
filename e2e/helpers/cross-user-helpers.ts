import { Page, BrowserContext, expect } from '@playwright/test';
import { generateTestUser, generateTestOrganization, loginUser, signupUser, signupOrganization, completeOrganizationOnboarding } from './auth';
import { navigateToMatching, clickInterested, waitForMatches } from './matching-helpers';
import { navigateToOrgMatching, expressOrgInterest, waitForOrgMatches } from './organization-helpers';

/**
 * E2E Test Helpers for Cross-User Interactions
 *
 * Utilities for testing interactions between individuals and organizations
 * including matching, messaging, conversations, and staged identity reveal
 */

export interface TwoUserContext {
  individualPage: Page;
  orgPage: Page;
  individualUser: ReturnType<typeof generateTestUser>;
  orgUser: ReturnType<typeof generateTestOrganization>;
  orgSlug: string;
}

/**
 * Create two browser contexts for parallel testing (individual + organization)
 */
export async function createTwoUserContexts(
  browserContext: BrowserContext
): Promise<TwoUserContext> {
  // Create two separate pages
  const individualPage = await browserContext.newPage();
  const orgPage = await browserContext.newPage();

  // Generate test users
  const individualUser = generateTestUser('ind');
  const orgUser = generateTestOrganization('org');
  const orgSlug = orgUser.slug;

  return {
    individualPage,
    orgPage,
    individualUser,
    orgUser,
    orgSlug,
  };
}

/**
 * Set up both users: sign up and login
 */
export async function setupTwoUsers(context: TwoUserContext) {
  // Sign up individual
  await signupUser(context.individualPage, context.individualUser, 'individual');
  
  // Wait for any onboarding or email verification
  await context.individualPage.waitForTimeout(2000);
  
  // Sign up organization
  await signupOrganization(context.orgPage, context.orgUser);
  
  // Wait for org setup to complete
  await context.orgPage.waitForTimeout(2000);
}

/**
 * Wait for mutual interest to create a conversation
 * Polls the API or checks for conversation creation
 */
export async function waitForMutualInterest(
  individualPage: Page,
  orgPage: Page,
  assignmentId: string,
  timeout = 30000
): Promise<string | null> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    // Check individual's side for conversation
    try {
      const individualResponse = await individualPage.request.get('/api/conversations');
      if (individualResponse.ok()) {
        const data = await individualResponse.json();
        const conversations = data.conversations || [];
        const matchingConv = conversations.find((c: any) => c.assignmentId === assignmentId);
        
        if (matchingConv) {
          return matchingConv.id;
        }
      }
    } catch (error) {
      // Continue polling
    }

    // Check organization's side for conversation
    try {
      const orgResponse = await orgPage.request.get('/api/conversations');
      if (orgResponse.ok()) {
        const data = await orgResponse.json();
        const conversations = data.conversations || [];
        const matchingConv = conversations.find((c: any) => c.assignmentId === assignmentId);
        
        if (matchingConv) {
          return matchingConv.id;
        }
      }
    } catch (error) {
      // Continue polling
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return null;
}

/**
 * Verify Stage 1 masking is active (masked identities shown)
 */
export async function verifyStage1Masking(page: Page, conversationId: string): Promise<boolean> {
  // Navigate to messages page
  await page.goto(`/app/i/messages?conversation=${conversationId}`);
  await page.waitForLoadState('networkidle');

  // Check for masked identifiers
  const maskedIndicator = page.locator(
    'text=/Candidate #[A-Z0-9]+|Organization #[A-Z0-9]+|masked|Stage 1/i'
  );

  const hasMasked = await maskedIndicator.isVisible().catch(() => false);

  // Verify full names are NOT shown
  const fullNamePattern = /[A-Z][a-z]+ [A-Z][a-z]+/; // Pattern for full names
  const fullNameElements = page.locator('text=/^[A-Z][a-z]+ [A-Z][a-z]+$/');
  const hasFullName = await fullNameElements.count() > 0;

  return hasMasked && !hasFullName;
}

/**
 * Move conversation to Stage 2 (full identity reveal)
 */
export async function moveToStage2(
  page: Page,
  conversationId: string,
  action: 'initiate' | 'accept'
): Promise<boolean> {
  // Navigate to messages page
  await page.goto(`/app/i/messages?conversation=${conversationId}`);
  await page.waitForLoadState('networkidle');

  if (action === 'initiate') {
    // Look for "Reveal Identity" or similar button
    const revealButton = page
      .getByRole('button', { name: /reveal|unmask|show identity|move to stage 2/i })
      .first();

    if (await revealButton.isVisible()) {
      await revealButton.click();
      await page.waitForTimeout(1000);
      
      // Confirm in dialog if it appears
      const confirmButton = page.getByRole('button', { name: /confirm|yes|reveal/i }).first();
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        await page.waitForTimeout(2000);
        return true;
      }
    }
  } else if (action === 'accept') {
    // Look for accept reveal button
    const acceptButton = page
      .getByRole('button', { name: /accept|confirm reveal|reveal back/i })
      .first();

    if (await acceptButton.isVisible()) {
      await acceptButton.click();
      await page.waitForTimeout(2000);
      return true;
    }
  }

  return false;
}

/**
 * Verify Stage 2 reveal is active (full identities shown)
 */
export async function verifyStage2Revealed(page: Page, conversationId: string): Promise<boolean> {
  // Navigate to messages page
  await page.goto(`/app/i/messages?conversation=${conversationId}`);
  await page.waitForLoadState('networkidle');

  // Check for revealed indicators
  const revealedIndicator = page.locator('text=/revealed|Stage 2|Full Identity/i');
  const hasRevealed = await revealedIndicator.isVisible().catch(() => false);

  // Verify full names are shown (not masked handles)
  const maskedHandlePattern = /Candidate #[A-Z0-9]+|Organization #[A-Z0-9]+/;
  const maskedElements = page.locator(`text=/${maskedHandlePattern}/`);
  const hasMasked = (await maskedElements.count()) > 0;

  return hasRevealed || !hasMasked; // Either has revealed indicator or no masked handles
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(
  page: Page,
  conversationId: string,
  messageText: string
): Promise<boolean> {
  // Navigate to messages page
  await page.goto(`/app/i/messages?conversation=${conversationId}`);
  await page.waitForLoadState('networkidle');

  // Find message input
  const messageInput = page
    .getByPlaceholder(/type a message|message/i)
    .or(page.locator('textarea[aria-label*="message"], textarea[name*="message"]'))
    .first();

  if (await messageInput.isVisible()) {
    await messageInput.fill(messageText);
    await page.waitForTimeout(500);

    // Find send button
    const sendButton = page
      .getByRole('button', { name: /send|submit/i })
      .or(page.locator('button[aria-label*="send"]'))
      .first();

    if (await sendButton.isVisible()) {
      await sendButton.click();
      await page.waitForTimeout(1000);
      return true;
    }
  }

  return false;
}

/**
 * Verify message appears in conversation
 */
export async function verifyMessageInConversation(
  page: Page,
  conversationId: string,
  messageText: string,
  timeout = 5000
): Promise<boolean> {
  // Navigate to messages page
  await page.goto(`/app/i/messages?conversation=${conversationId}`);
  await page.waitForLoadState('networkidle');

  // Wait for message to appear
  try {
    await page.waitForSelector(`text=/${messageText}/`, { timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Complete matching flow: Individual expresses interest, Org expresses interest back
 */
export async function completeMutualMatchingFlow(
  context: TwoUserContext,
  assignmentId: string
): Promise<string | null> {
  // Step 1: Individual views matches and expresses interest
  await navigateToMatching(context.individualPage);
  await waitForMatches(context.individualPage);

  // Find the match for this assignment (simplified - would need to match by assignment)
  const matchCards = context.individualPage.locator(
    '[data-testid="match-card"], .match-card, [class*="MatchCard"]'
  );
  const matchCount = await matchCards.count();

  if (matchCount > 0) {
    // Click interested on first match (assuming it's for our assignment)
    await clickInterested(context.individualPage, 0);
    await context.individualPage.waitForTimeout(2000);
  }

  // Step 2: Organization views matches and expresses interest back
  await navigateToOrgMatching(context.orgPage, context.orgSlug);
  await waitForOrgMatches(context.orgPage);

  const orgMatchCards = context.orgPage.locator(
    '[data-testid="match-card"], .match-card, [class*="MatchCard"]'
  );
  const orgMatchCount = await orgMatchCards.count();

  if (orgMatchCount > 0) {
    await expressOrgInterest(context.orgPage, 0);
    await context.orgPage.waitForTimeout(2000);
  }

  // Step 3: Wait for conversation to be created
  const conversationId = await waitForMutualInterest(
    context.individualPage,
    context.orgPage,
    assignmentId,
    15000
  );

  return conversationId;
}

/**
 * Navigate to messages page (works for both individual and org)
 */
export async function navigateToMessages(
  page: Page,
  orgSlug?: string,
  conversationId?: string
) {
  const messagesUrl = orgSlug
    ? `/app/o/${orgSlug}/messages${conversationId ? `?conversation=${conversationId}` : ''}`
    : `/app/i/messages${conversationId ? `?conversation=${conversationId}` : ''}`;

  await page.goto(messagesUrl);
  await page.waitForLoadState('networkidle');
}

/**
 * Get conversation ID from match interest response
 */
export async function getConversationIdFromInterest(
  page: Page
): Promise<string | null> {
  // Listen for API responses after clicking interested
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 5000);

    page.on('response', async (response) => {
      if (response.url().includes('/api/match/interest') && response.ok()) {
        try {
          const data = await response.json();
          if (data.conversationId) {
            clearTimeout(timeout);
            resolve(data.conversationId);
          }
        } catch {
          // Ignore parse errors
        }
      }
    });
  });
}

/**
 * Clean up test contexts (logout and close pages)
 */
export async function cleanupTwoUserContexts(context: TwoUserContext) {
  // Close both pages
  await context.individualPage.close();
  await context.orgPage.close();
}

