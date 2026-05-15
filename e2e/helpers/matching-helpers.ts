import { Page, expect } from '@playwright/test';

/**
 * E2E Test Helpers for Matching Engine
 *
 * Utilities for testing proof-first matching flows, rank transparency, etc.
 */

/**
 * Login and navigate to matching page
 */
export async function navigateToMatching(page: Page) {
  await page.goto('/app/i/matching');
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for matches to load
 */
export async function waitForMatches(page: Page, timeout = 10000) {
  // Wait for either matches to appear or empty state
  await Promise.race([
    page.waitForSelector('[data-testid="match-card"], .match-card, [class*="MatchCard"]', {
      timeout,
    }),
    page.waitForSelector('text=/no matches|check back soon/i', { timeout }),
  ]);
}

/**
 * Get all match cards on the page
 */
export async function getMatchCards(page: Page) {
  return page.locator(
    '[data-testid="match-card"], .match-card, [class*="MatchCard"], [class*="match-result"]'
  );
}

/**
 * Get match card by index
 */
export function getMatchCard(page: Page, index: number) {
  return getMatchCards(page).nth(index);
}

/**
 * Open match explainer modal
 */
export async function openMatchExplainer(page: Page, matchIndex = 0) {
  const matchCard = getMatchCard(page, matchIndex);

  // Try different button selectors
  const whyButton = matchCard
    .locator(
      '[data-testid="match-explainer-trigger"], button:has-text("Why This Proof Match?"), [data-testid="why-match"]'
    )
    .first();

  if (await whyButton.isVisible()) {
    await whyButton.click();
    await page.getByTestId('match-explainer-title').waitFor({ state: 'visible', timeout: 5000 });
  } else {
    throw new Error('Could not find match explainer trigger');
  }
}

/**
 * Verify match score is displayed
 */
export async function verifyMatchScore(page: Page, matchIndex = 0) {
  const matchCard = getMatchCard(page, matchIndex);

  // Look for score indicators (percentage, number, etc.)
  const scorePattern = /\d+%|\d+\/\d+|score|match/i;
  const scoreElement = matchCard.locator(`text=/${scorePattern}/`).first();

  await expect(scoreElement).toBeVisible();
}

/**
 * Verify retired purpose-fit indicators are absent from an active match card.
 */
export async function verifyNoLegacyPurposeFitSignals(page: Page, matchIndex = 0) {
  const matchCard = getMatchCard(page, matchIndex);
  const legacyPurposeIndicator = matchCard
    .locator('text=/PAC|Purpose-Alignment|Values Alignment|mission-first|purpose-fit/i')
    .first();

  await expect(legacyPurposeIndicator).not.toBeVisible();
}

/**
 * Click "Interested" or "Introduce" button
 */
export async function clickInterested(page: Page, matchIndex = 0) {
  const matchCard = getMatchCard(page, matchIndex);

  const interestedButton = matchCard
    .locator(
      'button:has-text("Interested"), button:has-text("Introduce"), button:has-text("Express Interest")'
    )
    .first();

  if (await interestedButton.isVisible()) {
    await interestedButton.click();
    // Wait for consent dialog or success
    await page.waitForTimeout(1000);
  } else {
    throw new Error('Could not find "Interested" button');
  }
}

/**
 * Click "Pass" or "Hide" button
 */
export async function clickPass(page: Page, matchIndex = 0) {
  const matchCard = getMatchCard(page, matchIndex);

  const passButton = matchCard
    .locator('button:has-text("Pass"), button:has-text("Hide"), button:has-text("Dismiss")')
    .first();

  if (await passButton.isVisible()) {
    await passButton.click();
    await page.waitForTimeout(500);
  } else {
    throw new Error('Could not find "Pass" button');
  }
}

/**
 * Click "Snooze" button
 */
export async function clickSnooze(page: Page, matchIndex = 0) {
  const matchCard = getMatchCard(page, matchIndex);

  const snoozeButton = matchCard.locator('button:has-text("Snooze")').first();

  if (await snoozeButton.isVisible()) {
    await snoozeButton.click();
    // Wait for snooze dialog
    await page.waitForSelector('text=/snooze|until|duration/i', { timeout: 3000 });
  } else {
    throw new Error('Could not find "Snooze" button');
  }
}

/**
 * Apply filter by location mode
 */
export async function filterByLocationMode(page: Page, mode: 'remote' | 'hybrid' | 'onsite') {
  const filterButton = page
    .locator('button:has-text("Filter"), [data-testid="filter-button"]')
    .first();

  if (await filterButton.isVisible()) {
    await filterButton.click();
    await page.waitForTimeout(500);
  }

  const modeOption = page.locator(`text=/${mode}/i`).first();
  if (await modeOption.isVisible()) {
    await modeOption.click();
  }

  await page.waitForTimeout(1000);
}

/**
 * Verify match explainer tabs
 */
export async function verifyMatchExplainerTabs(page: Page) {
  const tabs = ['Overview', 'Skills', 'Constraints'];

  for (const tab of tabs) {
    const tabButton = page.locator(`button[role="tab"]:has-text("${tab}")`);
    if (await tabButton.isVisible()) {
      await tabButton.click();
      await page.waitForTimeout(500);
    }
  }
}

/**
 * Verify rank display
 */
export async function verifyRankDisplay(page: Page) {
  // Look for rank indicators
  const rankPattern = /Top \d+|#\d+ of \d+|rank|position/i;
  const rankElement = page.locator(`text=/${rankPattern}/`).first();

  return await rankElement.isVisible();
}

/**
 * Check if matching profile setup wizard appears
 */
export async function checkMatchingProfileSetup(page: Page): Promise<boolean> {
  const setupWizard = page.locator(
    'text=/Set up your matching profile|Create matching profile|Matching Profile Setup/i'
  );

  return await setupWizard.isVisible();
}

/**
 * Complete matching profile setup
 */
export async function completeMatchingProfileSetup(
  page: Page,
  options: {
    focusAreas?: string[];
    weights?: { proofBias?: number; expertise?: number };
    constraints?: {
      location?: string;
      workMode?: 'remote' | 'hybrid' | 'onsite';
      salaryMin?: number;
      salaryMax?: number;
    };
  }
) {
  // Wait for setup wizard
  await page.waitForSelector('text=/matching profile|focus areas/i', { timeout: 5000 });

  // Select focus areas if provided
  if (options.focusAreas) {
    for (const area of options.focusAreas) {
      const areaOption = page.locator(`text=${area}`).first();
      if (await areaOption.isVisible()) {
        await areaOption.click();
      }
    }
  }

  // Set proof-vs-skills weighting if provided
  if (options.weights) {
    if (options.weights.proofBias !== undefined) {
      const proofBiasSlider = page
        .locator('input[type="range"], input[aria-label*="Proof vs skills"]')
        .first();
      if (await proofBiasSlider.isVisible()) {
        await proofBiasSlider.fill(options.weights.proofBias.toString());
      }
    }
  }

  // Set constraints if provided
  if (options.constraints) {
    if (options.constraints.location) {
      const locationInput = page
        .locator('input[name*="location"], input[placeholder*="location"]')
        .first();
      if (await locationInput.isVisible()) {
        await locationInput.fill(options.constraints.location);
      }
    }

    if (options.constraints.workMode) {
      const workModeSelect = page.locator(`text=/${options.constraints.workMode}/i`).first();
      if (await workModeSelect.isVisible()) {
        await workModeSelect.click();
      }
    }
  }

  // Click save/complete
  const saveButton = page
    .locator('button:has-text("Save"), button:has-text("Complete"), button:has-text("Finish")')
    .first();
  if (await saveButton.isVisible()) {
    await saveButton.click();
    await page.waitForTimeout(2000);
  }
}

/**
 * Verify verification gates displayed
 */
export async function verifyVerificationGates(page: Page, matchIndex = 0): Promise<boolean> {
  const matchCard = getMatchCard(page, matchIndex);

  const gatesText = matchCard.locator('text=/verification|gate|required/i');
  return await gatesText.isVisible();
}

/**
 * Check if near-matches are shown
 */
export async function checkNearMatches(page: Page): Promise<boolean> {
  const nearMatchText = page.locator('text=/near match|partial match|good fit/i');
  return await nearMatchText.isVisible();
}
