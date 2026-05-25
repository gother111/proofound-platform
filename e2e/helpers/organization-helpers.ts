import { Page, expect } from '@playwright/test';

/**
 * E2E Test Helpers for Organization Flows
 *
 * Utilities for testing organization assignment creation, match viewing, and proof-submission review
 */

/**
 * Navigate to organization matching page
 */
export async function navigateToOrgMatching(page: Page, orgSlug: string) {
  await page.goto(`/app/o/${orgSlug}/matching`);
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to organization assignments page
 */
export async function navigateToOrgAssignments(page: Page, orgSlug: string) {
  await page.goto(`/app/o/${orgSlug}/assignments`);
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to organization home/dashboard
 */
export async function navigateToOrgHome(page: Page, orgSlug: string) {
  await page.goto(`/app/o/${orgSlug}/home`);
  await page.waitForLoadState('networkidle');
}

/**
 * Create assignment via UI (using AssignmentBuilder or AssignmentWizard)
 */
export async function createAssignmentViaUI(
  page: Page,
  orgSlug: string,
  assignment: {
    title: string;
    description: string;
    requiredSkills?: string[];
    niceToHaveSkills?: string[];
    location?: string;
    workMode?: 'remote' | 'hybrid' | 'onsite';
    compensationMin?: number;
    compensationMax?: number;
    startDate?: string;
    deadline?: string;
    causes?: string[];
    values?: string[];
  }
) {
  // Navigate to matching or assignments page
  await navigateToOrgMatching(page, orgSlug);

  // Click "New Assignment" button
  const newAssignmentButton = page
    .getByRole('button', { name: /new assignment|create assignment|add assignment/i })
    .first();

  if (await newAssignmentButton.isVisible()) {
    await newAssignmentButton.click();
    await page.waitForTimeout(1000);
  } else {
    // Try navigating directly to new assignment page
    await page.goto(`/app/o/${orgSlug}/assignments/new`);
    await page.waitForLoadState('networkidle');
  }

  // Wait for assignment builder/wizard to appear
  await page.waitForSelector('text=/assignment|create|title/i', { timeout: 5000 });

  // Fill title
  const titleInput = page
    .getByLabel(/title|role title|job title/i)
    .or(page.locator('input[name="title"], input[name="roleTitle"]'))
    .first();

  if (await titleInput.isVisible()) {
    await titleInput.fill(assignment.title);
  }

  // Fill description
  const descriptionInput = page
    .getByLabel(/description/i)
    .or(page.locator('textarea[name="description"]'))
    .first();

  if (await descriptionInput.isVisible()) {
    await descriptionInput.fill(assignment.description);
  }

  // Fill required skills if provided
  if (assignment.requiredSkills && assignment.requiredSkills.length > 0) {
    const skillsSection = page.locator('text=/required skills|must have skills/i').first();
    if (await skillsSection.isVisible()) {
      for (const skill of assignment.requiredSkills) {
        const skillInput = page
          .locator('input[placeholder*="skill"], input[type="text"]')
          .near(skillsSection)
          .first();

        if (await skillInput.isVisible()) {
          await skillInput.fill(skill);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(500);
        }
      }
    }
  }

  // Fill location if provided
  if (assignment.location) {
    const locationInput = page
      .getByLabel(/location/i)
      .or(page.locator('input[name="location"]'))
      .first();

    if (await locationInput.isVisible()) {
      await locationInput.fill(assignment.location);
    }
  }

  // Select work mode if provided
  if (assignment.workMode) {
    const workModeSelect = page
      .getByLabel(/work mode|location mode|remote|hybrid|onsite/i)
      .or(page.locator('select[name="workMode"], select[name="locationMode"]'))
      .first();

    if (await workModeSelect.isVisible()) {
      await workModeSelect.selectOption(assignment.workMode);
    }
  }

  // Fill compensation if provided
  if (assignment.compensationMin !== undefined || assignment.compensationMax !== undefined) {
    const compSection = page.locator('text=/compensation|salary|budget/i').first();
    if (await compSection.isVisible()) {
      if (assignment.compensationMin !== undefined) {
        const minInput = page
          .getByLabel(/min|minimum/i)
          .near(compSection)
          .or(page.locator('input[name*="min"], input[placeholder*="min"]'))
          .first();

        if (await minInput.isVisible()) {
          await minInput.fill(assignment.compensationMin.toString());
        }
      }

      if (assignment.compensationMax !== undefined) {
        const maxInput = page
          .getByLabel(/max|maximum/i)
          .near(compSection)
          .or(page.locator('input[name*="max"], input[placeholder*="max"]'))
          .first();

        if (await maxInput.isVisible()) {
          await maxInput.fill(assignment.compensationMax.toString());
        }
      }
    }
  }

  // Click next/save buttons to complete wizard
  let attempts = 0;
  while (attempts < 10) {
    const nextButton = page
      .getByRole('button', { name: /next|continue|save|publish|create assignment/i })
      .first();

    if (await nextButton.isVisible()) {
      const buttonText = await nextButton.textContent();

      if (
        buttonText?.toLowerCase().includes('publish') ||
        buttonText?.toLowerCase().includes('create') ||
        buttonText?.toLowerCase().includes('save')
      ) {
        await nextButton.click();
        await page.waitForTimeout(2000);
        break;
      } else {
        await nextButton.click();
        await page.waitForTimeout(1000);
      }
    } else {
      break;
    }

    attempts++;
  }

  // Wait for assignment to be created (redirect or success message)
  await page.waitForTimeout(2000);
}

/**
 * View matches for a specific assignment
 */
export async function viewMatchesForAssignment(page: Page, orgSlug: string, assignmentId: string) {
  // Navigate to matching page
  await navigateToOrgMatching(page, orgSlug);

  // Wait for assignments to load
  await page.waitForSelector('[data-testid="assignment"], .assignment, [class*="Assignment"]', {
    timeout: 5000,
  });

  // Select the assignment (either by tab or dropdown)
  const assignmentTab = page
    .locator(`[data-testid="assignment-${assignmentId}"], button:has-text("${assignmentId}")`)
    .first();

  if (await assignmentTab.isVisible()) {
    await assignmentTab.click();
  } else {
    // Try selecting from dropdown
    const assignmentSelect = page.locator('select, [role="combobox"]').first();
    if (await assignmentSelect.isVisible()) {
      await assignmentSelect.selectOption(assignmentId);
    }
  }

  // Wait for matches to load
  await page.waitForTimeout(2000);
}

/**
 * Get all match cards for current assignment
 */
export async function getOrgMatchCards(page: Page) {
  return page.locator(
    '[data-testid="match-card"], .match-card, [class*="MatchCard"], [class*="match-result"]'
  );
}

/**
 * Get match card by index
 */
export function getOrgMatchCard(page: Page, index: number) {
  return getOrgMatchCards(page).nth(index);
}

/**
 * Express organization interest in a proof-submission review
 */
export async function expressOrgInterest(page: Page, matchIndex = 0) {
  const matchCard = getOrgMatchCard(page, matchIndex);

  const interestedButton = matchCard
    .locator(
      'button:has-text("Interested"), button:has-text("Shortlist"), button:has-text("Contact")'
    )
    .first();

  if (await interestedButton.isVisible()) {
    await interestedButton.click();
    // Wait for success message or dialog
    await page.waitForTimeout(1500);
  } else {
    throw new Error('Could not find "Interested" button for organization match');
  }
}

/**
 * View proof-submission detail.
 */
export async function viewProofSubmissionDetail(page: Page, matchIndex = 0) {
  const matchCard = getOrgMatchCard(page, matchIndex);

  // Look for proof-submission detail actions or click on card.
  const viewButton = matchCard
    .locator(
      'button:has-text("View"), button:has-text("Detail"), button:has-text("Review"), a[href*="matching"]'
    )
    .first();

  if (await viewButton.isVisible()) {
    await viewButton.click();
    await page.waitForLoadState('networkidle');
  } else {
    // Try clicking the card itself
    await matchCard.click();
    await page.waitForTimeout(1000);
  }
}

/**
 * Shortlist proof-submission review (move to shortlist stage)
 */
export async function shortlistProofSubmission(page: Page, matchIndex = 0) {
  const matchCard = getOrgMatchCard(page, matchIndex);

  const shortlistButton = matchCard
    .locator('button:has-text("Shortlist"), button:has-text("Move to Shortlist")')
    .first();

  if (await shortlistButton.isVisible()) {
    await shortlistButton.click();
    await page.waitForTimeout(1000);
  } else {
    // Try dropdown menu
    const menuButton = matchCard
      .locator('button[aria-label*="menu"], button[aria-label*="more"]')
      .first();
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(500);

      const shortlistOption = page.locator('text=/shortlist/i').first();
      if (await shortlistOption.isVisible()) {
        await shortlistOption.click();
        await page.waitForTimeout(1000);
      }
    }
  }
}

/**
 * Open match explainer modal for organization view
 */
export async function openOrgMatchExplainer(page: Page, matchIndex = 0) {
  const matchCard = getOrgMatchCard(page, matchIndex);

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
 * Set proof-vs-skills weighting when the launch matching surface exposes it.
 */
export async function setMatchingWeights(page: Page, proofBias = 50) {
  const proofBiasSlider = page
    .locator('input[type="range"], input[aria-label*="Proof vs skills"]')
    .first();

  if (await proofBiasSlider.isVisible()) {
    await proofBiasSlider.fill(String(proofBias));
    await page.waitForTimeout(1000);
  }
}

/**
 * Schedule interview via UI
 */
export async function scheduleInterviewViaUI(
  page: Page,
  orgSlug: string,
  candidateId: string,
  options: {
    date?: string;
    time?: string;
    duration?: number;
    type?: 'video' | 'phone' | 'onsite';
    timezone?: string;
  }
) {
  // Navigate to interviews page or proof-submission detail
  await page.goto(`/app/o/${orgSlug}/interviews`);
  await page.waitForLoadState('networkidle');

  // Look for "Schedule Interview" button
  const scheduleButton = page
    .getByRole('button', { name: /schedule interview|new interview/i })
    .first();

  if (await scheduleButton.isVisible()) {
    await scheduleButton.click();
    await page.waitForTimeout(1000);
  }

  // Fill interview details if dialog/form appears
  if (options.date) {
    const dateInput = page.getByLabel(/date/i).or(page.locator('input[type="date"]')).first();
    if (await dateInput.isVisible()) {
      await dateInput.fill(options.date);
    }
  }

  if (options.time) {
    const timeInput = page.getByLabel(/time/i).or(page.locator('input[type="time"]')).first();
    if (await timeInput.isVisible()) {
      await timeInput.fill(options.time);
    }
  }

  if (options.type) {
    const typeSelect = page
      .getByLabel(/type|format/i)
      .or(page.locator('select[name="type"]'))
      .first();
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption(options.type);
    }
  }

  // Submit
  const submitButton = page
    .getByRole('button', { name: /schedule|send invitation|confirm/i })
    .first();
  if (await submitButton.isVisible()) {
    await submitButton.click();
    await page.waitForTimeout(2000);
  }
}

/**
 * Wait for matches to load for organization
 */
export async function waitForOrgMatches(page: Page, timeout = 10000) {
  await Promise.race([
    page.waitForSelector('[data-testid="match-card"], .match-card, [class*="MatchCard"]', {
      timeout,
    }),
    page.waitForSelector('text=/no matches|no proof submissions|check back soon/i', { timeout }),
  ]);
}

/**
 * Verify organization profile is set up
 */
export async function verifyOrgProfileSetup(page: Page, orgSlug: string): Promise<boolean> {
  await navigateToOrgHome(page, orgSlug);

  // Check for profile completion indicators
  const incompleteWarning = page.locator(
    'text=/complete profile|set up profile|missing information/i'
  );
  const hasWarning = await incompleteWarning.isVisible().catch(() => false);

  return !hasWarning;
}
