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
  const editButton = page.locator(
    'button:has-text("Edit"), button:has-text("Edit Profile"), [data-testid="edit-profile"]'
  ).first();

  if (await editButton.isVisible()) {
    await editButton.click();
    await page.waitForTimeout(1000);
  }

  if (options.headline) {
    const headlineInput = page.locator('input[name*="headline"], input[placeholder*="headline"]').first();
    if (await headlineInput.isVisible()) {
      await headlineInput.fill(options.headline);
    }
  }

  if (options.location) {
    const locationInput = page.locator('input[name*="location"], input[placeholder*="location"]').first();
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
  const avatarButton = page.locator(
    '[data-testid="avatar-upload"], button:has-text("Upload"), [class*="avatar"]'
  ).first();

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
 * Upload cover image
 */
export async function uploadCoverImage(page: Page, imagePath: string) {
  const coverButton = page.locator(
    '[data-testid="cover-upload"], button:has-text("Cover"), [class*="cover"]'
  ).first();

  if (await coverButton.isVisible()) {
    await coverButton.click();
    await page.waitForTimeout(500);

    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles(imagePath);
      await page.waitForTimeout(1000);
    }
  }
}

/**
 * Edit mission
 */
export async function editMission(page: Page, mission: string) {
  const missionSection = page.locator('text=/mission/i').first();

  if (await missionSection.isVisible()) {
    const editButton = missionSection.locator('..').locator('button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(500);
    }
  } else {
    // Try direct edit button
    const editButton = page.locator('[data-testid="edit-mission"], button:has-text("Add Mission")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(500);
    }
  }

  const missionInput = page.locator('textarea[name*="mission"], textarea[placeholder*="mission"]').first();
  if (await missionInput.isVisible()) {
    await missionInput.fill(mission);

    const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await page.waitForTimeout(1000);
    }
  }
}

/**
 * Edit vision
 */
export async function editVision(page: Page, vision: string) {
  const visionSection = page.locator('text=/vision/i').first();

  if (await visionSection.isVisible()) {
    const editButton = visionSection.locator('..').locator('button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(500);
    }
  }

  const visionInput = page.locator('textarea[name*="vision"], textarea[placeholder*="vision"]').first();
  if (await visionInput.isVisible()) {
    await visionInput.fill(vision);

    const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await page.waitForTimeout(1000);
    }
  }
}

/**
 * Add values
 */
export async function addValues(page: Page, values: string[]) {
  const valuesSection = page.locator('text=/values/i').first();

  if (await valuesSection.isVisible()) {
    const editButton = valuesSection.locator('..').locator('button:has-text("Edit"), button:has-text("Add")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(500);
    }
  }

  // Add each value
  for (const value of values) {
    const valueInput = page.locator('input[type="text"], input[placeholder*="value"]').first();
    if (await valueInput.isVisible()) {
      await valueInput.fill(value);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
  }

  // Save
  const saveButton = page.locator('button:has-text("Save"), button:has-text("Done")').first();
  if (await saveButton.isVisible()) {
    await saveButton.click();
    await page.waitForTimeout(1000);
  }
}

/**
 * Add causes
 */
export async function addCauses(page: Page, causes: string[]) {
  const causesSection = page.locator('text=/causes/i').first();

  if (await causesSection.isVisible()) {
    const editButton = causesSection.locator('..').locator('button:has-text("Edit"), button:has-text("Add")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(500);
    }
  }

  // Add each cause
  for (const cause of causes) {
    const causeInput = page.locator('input[type="text"], input[placeholder*="cause"]').first();
    if (await causeInput.isVisible()) {
      await causeInput.fill(cause);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
  }

  // Save
  const saveButton = page.locator('button:has-text("Save"), button:has-text("Done")').first();
  if (await saveButton.isVisible()) {
    await saveButton.click();
    await page.waitForTimeout(1000);
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
  const addButton = page.locator(
    'button:has-text("Add Work"), button:has-text("Add Experience"), [data-testid="add-work"]'
  ).first();

  if (await addButton.isVisible()) {
    await addButton.click();
    await page.waitForTimeout(1000);
  }

  // Fill form
  const orgInput = page.locator('input[name*="organization"], input[placeholder*="organization"]').first();
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
    const impactInput = page.locator('textarea[name*="impact"], textarea[placeholder*="impact"]').first();
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
  const addButton = page.locator(
    'button:has-text("Add Learning"), button:has-text("Add Education"), [data-testid="add-education"]'
  ).first();

  if (await addButton.isVisible()) {
    await addButton.click();
    await page.waitForTimeout(1000);
  }

  const providerInput = page.locator('input[name*="provider"], input[placeholder*="provider"]').first();
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
  const addButton = page.locator(
    'button:has-text("Add Volunteering"), button:has-text("Add Volunteer"), [data-testid="add-volunteer"]'
  ).first();

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
  const redactToggle = page.locator(
    'input[type="checkbox"][name*="redact"], [data-testid="redact-toggle"], button:has-text("Redact")'
  ).first();

  if (await redactToggle.isVisible()) {
    const isCheckbox = await redactToggle.evaluate(
      (el) => el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'checkbox'
    );

    if (isCheckbox) {
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
  const visibilityButton = page.locator(
    `button:has-text("${field}"), [data-testid="visibility-${field}"]`
  ).first();

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
 * Verify profile completion percentage
 */
export async function verifyProfileCompletion(page: Page): Promise<number | null> {
  const completionText = page.locator('text=/% complete|completion/i').first();

  if (await completionText.isVisible()) {
    const text = await completionText.textContent();
    const match = text?.match(/(\d+)%/);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return null;
}

