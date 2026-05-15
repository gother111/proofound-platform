import { Page, expect } from '@playwright/test';

/**
 * E2E Test Helpers for Personal Profile
 *
 * Utilities for testing profile basics, purpose block, journey, visibility controls
 */

/**
 * Navigate to profile page
 */
export async function navigateToProfile(page: Page) {
  await page.goto('/app/i/profile');
  await page.waitForLoadState('networkidle');
}

/**
 * Edit profile basics
 */
export async function editProfileBasics(
  page: Page,
  options: {
    headline?: string;
    location?: string;
    timezone?: string;
    languages?: string[];
  }
) {
  const editButton = page
    .locator(
      'button:has-text("Edit"), button:has-text("Edit Profile"), [data-testid="edit-profile"]'
    )
    .first();

  if (await editButton.isVisible()) {
    await editButton.click();
    await page.waitForTimeout(1000);
  }

  if (options.headline) {
    const headlineInput = page
      .locator('input[name*="headline"], input[placeholder*="headline"]')
      .first();
    if (await headlineInput.isVisible()) {
      await headlineInput.fill(options.headline);
    }
  }

  if (options.location) {
    const locationInput = page
      .locator('input[name*="location"], input[placeholder*="location"]')
      .first();
    if (await locationInput.isVisible()) {
      await locationInput.fill(options.location);
    }
  }

  if (options.timezone) {
    const timezoneSelect = page.locator('select[name*="timezone"]').first();
    if (await timezoneSelect.isVisible()) {
      await timezoneSelect.selectOption(options.timezone);
    }
  }

  // Save
  const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').first();
  if (await saveButton.isVisible()) {
    await saveButton.click();
    await page.waitForTimeout(1000);
  }
}

/**
 * Upload avatar
 */
export async function uploadAvatar(page: Page, imagePath: string) {
  const avatarButton = page
    .locator('[data-testid="avatar-upload"], button:has-text("Upload"), [class*="avatar"]')
    .first();

  if (await avatarButton.isVisible()) {
    await avatarButton.click();
    await page.waitForTimeout(500);

    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles(imagePath);
      await page.waitForTimeout(1000);
    }
  }
}

/**
 * Add work experience
 */
export async function addWorkExperience(
  page: Page,
  experience: {
    organization: string;
    role: string;
    startDate: string;
    endDate?: string;
    whatIDid?: string;
    impact?: string;
  }
) {
  const addButton = page
    .locator(
      'button:has-text("Add Work"), button:has-text("Add Experience"), [data-testid="add-work"]'
    )
    .first();

  if (await addButton.isVisible()) {
    await addButton.click();
    await page.waitForTimeout(1000);
  }

  // Fill form
  const orgInput = page
    .locator('input[name*="organization"], input[placeholder*="organization"]')
    .first();
  if (await orgInput.isVisible()) {
    await orgInput.fill(experience.organization);
  }

  const roleInput = page.locator('input[name*="role"], input[placeholder*="role"]').first();
  if (await roleInput.isVisible()) {
    await roleInput.fill(experience.role);
  }

  const startDateInput = page.locator('input[name*="start"], input[type="date"]').first();
  if (await startDateInput.isVisible()) {
    await startDateInput.fill(experience.startDate);
  }

  if (experience.endDate) {
    const endDateInput = page.locator('input[name*="end"], input[type="date"]').nth(1);
    if (await endDateInput.isVisible()) {
      await endDateInput.fill(experience.endDate);
    }
  }

  if (experience.whatIDid) {
    const whatInput = page.locator('textarea[name*="what"], textarea[placeholder*="what"]').first();
    if (await whatInput.isVisible()) {
      await whatInput.fill(experience.whatIDid);
    }
  }

  if (experience.impact) {
    const impactInput = page
      .locator('textarea[name*="impact"], textarea[placeholder*="impact"]')
      .first();
    if (await impactInput.isVisible()) {
      await impactInput.fill(experience.impact);
    }
  }

  // Save
  const saveButton = page.locator('button:has-text("Save"), button:has-text("Add")').first();
  if (await saveButton.isVisible()) {
    await saveButton.click();
    await page.waitForTimeout(1000);
  }
}

/**
 * Add learning experience
 */
export async function addLearningExperience(
  page: Page,
  learning: {
    provider: string;
    credential?: string;
    startDate: string;
    endDate?: string;
    whyChose?: string;
  }
) {
  const addButton = page
    .locator(
      'button:has-text("Add Learning"), button:has-text("Add Education"), [data-testid="add-education"]'
    )
    .first();

  if (await addButton.isVisible()) {
    await addButton.click();
    await page.waitForTimeout(1000);
  }

  const providerInput = page
    .locator('input[name*="provider"], input[placeholder*="provider"]')
    .first();
  if (await providerInput.isVisible()) {
    await providerInput.fill(learning.provider);
  }

  if (learning.credential) {
    const credentialInput = page.locator('input[name*="credential"]').first();
    if (await credentialInput.isVisible()) {
      await credentialInput.fill(learning.credential);
    }
  }

  const startDateInput = page.locator('input[name*="start"], input[type="date"]').first();
  if (await startDateInput.isVisible()) {
    await startDateInput.fill(learning.startDate);
  }

  if (learning.endDate) {
    const endDateInput = page.locator('input[name*="end"], input[type="date"]').nth(1);
    if (await endDateInput.isVisible()) {
      await endDateInput.fill(learning.endDate);
    }
  }

  if (learning.whyChose) {
    const whyInput = page.locator('textarea[name*="why"]').first();
    if (await whyInput.isVisible()) {
      await whyInput.fill(learning.whyChose);
    }
  }

  const saveButton = page.locator('button:has-text("Save"), button:has-text("Add")').first();
  if (await saveButton.isVisible()) {
    await saveButton.click();
    await page.waitForTimeout(1000);
  }
}

/**
 * Add volunteering experience
 */
export async function addVolunteeringExperience(
  page: Page,
  volunteering: {
    organization: string;
    project?: string;
    role: string;
    startDate: string;
    endDate?: string;
  }
) {
  const addButton = page
    .locator(
      'button:has-text("Add Volunteering"), button:has-text("Add Volunteer"), [data-testid="add-volunteer"]'
    )
    .first();

  if (await addButton.isVisible()) {
    await addButton.click();
    await page.waitForTimeout(1000);
  }

  const orgInput = page.locator('input[name*="organization"]').first();
  if (await orgInput.isVisible()) {
    await orgInput.fill(volunteering.organization);
  }

  if (volunteering.project) {
    const projectInput = page.locator('input[name*="project"]').first();
    if (await projectInput.isVisible()) {
      await projectInput.fill(volunteering.project);
    }
  }

  const roleInput = page.locator('input[name*="role"]').first();
  if (await roleInput.isVisible()) {
    await roleInput.fill(volunteering.role);
  }

  const startDateInput = page.locator('input[name*="start"], input[type="date"]').first();
  if (await startDateInput.isVisible()) {
    await startDateInput.fill(volunteering.startDate);
  }

  if (volunteering.endDate) {
    const endDateInput = page.locator('input[name*="end"], input[type="date"]').nth(1);
    if (await endDateInput.isVisible()) {
      await endDateInput.fill(volunteering.endDate);
    }
  }

  const saveButton = page.locator('button:has-text("Save"), button:has-text("Add")').first();
  if (await saveButton.isVisible()) {
    await saveButton.click();
    await page.waitForTimeout(1000);
  }
}

/**
 * Toggle redact mode
 */
export async function toggleRedactMode(page: Page) {
  const redactToggle = page
    .locator(
      'input[type="checkbox"][name*="redact"], [data-testid="redact-toggle"], button:has-text("Redact")'
    )
    .first();

  if (await redactToggle.isVisible()) {
    if (
      redactToggle.evaluate(
        (el) => el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'checkbox'
      )
    ) {
      await redactToggle.check();
    } else {
      await redactToggle.click();
    }
    await page.waitForTimeout(1000);
  }
}

/**
 * Set field visibility
 */
export async function setFieldVisibility(
  page: Page,
  field: string,
  visibility: 'public' | 'link-only' | 'match-only' | 'private'
) {
  // Open visibility settings
  const visibilityButton = page
    .locator(`button:has-text("${field}"), [data-testid="visibility-${field}"]`)
    .first();

  if (await visibilityButton.isVisible()) {
    await visibilityButton.click();
    await page.waitForTimeout(500);
  }

  // Select visibility level
  const visibilityOption = page.locator(`text=/${visibility}/i`).first();
  if (await visibilityOption.isVisible()) {
    await visibilityOption.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Verify the proof-readiness checklist surface is available when rendered.
 */
export async function verifyProofReadinessChecklist(page: Page): Promise<boolean> {
  const readinessText = page
    .locator('text=/Proof Readiness|Readiness Checklist|Public Page readiness/i')
    .first();

  return readinessText.isVisible().catch(() => false);
}
