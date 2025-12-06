import { Page, expect } from '@playwright/test';

/**
 * E2E Test Helpers for Expertise Atlas
 *
 * Utilities for testing L1-L4 navigation, skill creation, CV import, etc.
 */

/**
 * Navigate to expertise page
 */
export async function navigateToExpertise(page: Page) {
  await page.goto('/app/i/expertise');
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for L1 domains to load
 */
export async function waitForL1Domains(page: Page, timeout = 10000) {
  await page.waitForSelector(
    '[data-testid*="l1"], [class*="L1"], [class*="domain"], [class*="Domain"]',
    { timeout }
  );
}

/**
 * Get L1 domain cards
 */
export async function getL1DomainCards(page: Page) {
  return page.locator(
    '[data-testid*="l1"], [class*="L1Card"], [class*="domain-card"]'
  );
}

/**
 * Click on L1 domain by name or index
 */
export async function clickL1Domain(page: Page, domainNameOrIndex: string | number) {
  if (typeof domainNameOrIndex === 'number') {
    const cards = await getL1DomainCards(page);
    await cards.nth(domainNameOrIndex).click();
  } else {
    const domainCard = page.locator(`text=/${domainNameOrIndex}/i`).first();
    await domainCard.click();
  }

  await page.waitForTimeout(1000);
}

/**
 * Verify L2 categories shown (only those with user-added L4s per PRD)
 */
export async function verifyL2CategoriesShown(page: Page) {
  const l2Categories = page.locator(
    '[data-testid*="l2"], [class*="L2"], [class*="category"]'
  );

  const count = await l2Categories.count();
  return count > 0;
}

/**
 * Click on L2 category
 */
export async function clickL2Category(page: Page, categoryNameOrIndex: string | number) {
  if (typeof categoryNameOrIndex === 'number') {
    const categories = page.locator('[data-testid*="l2"], [class*="L2"]');
    await categories.nth(categoryNameOrIndex).click();
  } else {
    const category = page.locator(`text=/${categoryNameOrIndex}/i`).first();
    await category.click();
  }

  await page.waitForTimeout(1000);
}

/**
 * Click on L3 subcategory
 */
export async function clickL3Subcategory(page: Page, subcategoryNameOrIndex: string | number) {
  if (typeof subcategoryNameOrIndex === 'number') {
    const subcategories = page.locator('[data-testid*="l3"], [class*="L3"]');
    await subcategories.nth(subcategoryNameOrIndex).click();
  } else {
    const subcategory = page.locator(`text=/${subcategoryNameOrIndex}/i`).first();
    await subcategory.click();
  }

  await page.waitForTimeout(1000);
}

/**
 * Open add skill drawer/modal
 */
export async function openAddSkillDrawer(page: Page) {
  const addButton = page.locator(
    'button:has-text("Add"), button:has-text("Add Skill"), [data-testid="add-skill"]'
  ).first();

  if (await addButton.isVisible()) {
    await addButton.click();
    await page.waitForSelector(
      'text=/Add Skill|Select Skill|Choose Skill/i',
      { timeout: 5000 }
    );
  } else {
    throw new Error('Could not find "Add Skill" button');
  }
}

/**
 * Select skill via L1 → L3 → L4 navigation
 */
export async function selectSkillViaTaxonomy(
  page: Page,
  l1Domain: string | number,
  l3Subcategory?: string | number,
  l4Skill?: string | number
) {
  // Select L1
  await clickL1Domain(page, l1Domain);

  // If L3 provided, select it
  if (l3Subcategory !== undefined) {
    await clickL3Subcategory(page, l3Subcategory);
  }

  // If L4 provided, select it
  if (l4Skill !== undefined) {
    const l4Skills = page.locator('[data-testid*="l4"], [class*="L4"]');
    if (typeof l4Skill === 'number') {
      await l4Skills.nth(l4Skill).click();
    } else {
      const skill = page.locator(`text=/${l4Skill}/i`).first();
      await skill.click();
    }
  }
}

/**
 * Set skill level (0-5)
 */
export async function setSkillLevel(page: Page, level: number) {
  const levelInput = page.locator(
    `input[type="range"][value="${level}"], input[name*="level"], select[name*="level"]`
  ).first();

  if (await levelInput.isVisible()) {
    const isSelect = await levelInput.evaluate((el) => el.tagName === 'SELECT');

    if (isSelect) {
      await levelInput.selectOption(level.toString());
    } else {
      await levelInput.fill(level.toString());
    }
  } else {
    // Try clicking on level option
    const levelOption = page.locator(`text=/Level ${level}|${level}/i`).first();
    if (await levelOption.isVisible()) {
      await levelOption.click();
    }
  }
}

/**
 * Attach proof to skill
 */
export async function attachProof(page: Page, type: 'file' | 'link', value: string) {
  if (type === 'file') {
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles(value);
    }
  } else {
    const linkInput = page.locator('input[type="url"], input[placeholder*="link"], input[placeholder*="URL"]').first();
    if (await linkInput.isVisible()) {
      await linkInput.fill(value);
    }
  }
}

/**
 * Set skill recency (last used date)
 */
export async function setSkillRecency(page: Page, date: Date) {
  const dateInput = page.locator('input[type="date"], input[name*="lastUsed"], input[name*="recency"]').first();

  if (await dateInput.isVisible()) {
    const dateString = date.toISOString().split('T')[0];
    await dateInput.fill(dateString);
  }
}

/**
 * Save skill
 */
export async function saveSkill(page: Page) {
  const saveButton = page.locator(
    'button:has-text("Save"), button:has-text("Add Skill"), button:has-text("Create")'
  ).first();

  if (await saveButton.isVisible()) {
    await saveButton.click();
    await page.waitForTimeout(2000);
  }
}

/**
 * Open CV/JD import modal
 */
export async function openCVImport(page: Page) {
  const importButton = page.locator(
    'button:has-text("Import"), button:has-text("Import CV"), button:has-text("Paste CV"), [data-testid="cv-import"]'
  ).first();

  if (await importButton.isVisible()) {
    await importButton.click();
    await page.waitForSelector(
      'text=/Import|Paste|CV|Job Description/i',
      { timeout: 5000 }
    );
  }
}

/**
 * Paste CV/JD text
 */
export async function pasteCVText(page: Page, text: string) {
  const textarea = page.locator('textarea, [contenteditable="true"]').first();

  if (await textarea.isVisible()) {
    await textarea.fill(text);
  } else {
    // Try paste via clipboard
    await page.evaluate((text) => {
      navigator.clipboard.writeText(text);
    }, text);
    await page.keyboard.press('Control+v');
  }
}

/**
 * Verify CV suggestions shown
 */
export async function verifyCVSuggestions(page: Page): Promise<boolean> {
  const suggestions = page.locator(
    'text=/suggested|mapped|why it mapped/i'
  );

  return await suggestions.isVisible();
}

/**
 * Accept CV suggestion
 */
export async function acceptCVSuggestion(page: Page, suggestionIndex = 0) {
  const suggestions = page.locator('[data-testid*="suggestion"], [class*="suggestion"]');
  const suggestion = suggestions.nth(suggestionIndex);

  const acceptButton = suggestion.locator('button:has-text("Accept"), button:has-text("Add")').first();
  if (await acceptButton.isVisible()) {
    await acceptButton.click();
  }
}

/**
 * Request skill verification
 */
export async function requestSkillVerification(
  page: Page,
  verifierEmail: string,
  verifierName?: string
) {
  const verifyButton = page.locator(
    'button:has-text("Request Verification"), button:has-text("Verify"), [data-testid="request-verification"]'
  ).first();

  if (await verifyButton.isVisible()) {
    await verifyButton.click();
    await page.waitForTimeout(1000);

    // Fill verifier email
    const emailInput = page.locator('input[type="email"], input[name*="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill(verifierEmail);
    }

    // Fill name if provided
    if (verifierName) {
      const nameInput = page.locator('input[name*="name"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill(verifierName);
      }
    }

    // Submit
    const submitButton = page.locator('button:has-text("Send"), button:has-text("Request")').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(1000);
    }
  }
}

/**
 * Verify expertise dashboard widgets
 */
export async function verifyDashboardWidgets(page: Page) {
  const widgets = [
    'Recency',
    'Credibility',
    'Coverage',
    'Relevance',
    'Skill Wheel',
    'Next Best Actions',
  ];

  const foundWidgets: string[] = [];

  for (const widget of widgets) {
    const widgetElement = page.locator(`text=/${widget}/i`).first();
    if (await widgetElement.isVisible()) {
      foundWidgets.push(widget);
    }
  }

  return foundWidgets;
}

/**
 * Check if empty state is shown
 */
export async function checkEmptyState(page: Page): Promise<boolean> {
  const emptyState = page.locator(
    'text=/no skills|get started|add your first skill/i'
  );

  return await emptyState.isVisible();
}

/**
 * Use taxonomy search
 */
export async function searchTaxonomy(page: Page, query: string) {
  const searchInput = page.locator(
    'input[type="search"], input[placeholder*="search"], input[name*="search"]'
  ).first();

  if (await searchInput.isVisible()) {
    await searchInput.fill(query);
    await page.waitForTimeout(1000); // Wait for search results
  }
}

/**
 * Toggle "show only added" filter
 */
export async function toggleShowOnlyAdded(page: Page) {
  const toggle = page.locator(
    'input[type="checkbox"][name*="added"], input[type="checkbox"][name*="only"], [data-testid="show-only-added"]'
  ).first();

  if (await toggle.isVisible()) {
    await toggle.check();
    await page.waitForTimeout(1000);
  }
}

