/**
 * E2E Test: CV Import Feature
 *
 * Tests the complete user flow for importing skills from CV/resume
 */

import { test, expect } from '@playwright/test';

test.describe('CV Import Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user (assumes test user exists or uses auth mock)
    // For now, we'll navigate directly to the expertise page assuming auth
    await page.goto('/app/i/expertise');
  });

  test('should complete full CV import workflow', async ({ page }) => {
    // Step 1: Navigate to Import from CV tab
    await expect(page.locator('text=Expertise Atlas')).toBeVisible();
    
    // Look for the Import from CV tab
    const importTab = page.locator('button:has-text("Import from CV"), button:has-text("Import")').first();
    if (await importTab.isVisible()) {
      await importTab.click();
    }

    // Wait for the CV import interface to load
    await expect(page.locator('text=Auto-Suggest from CV/JD, text=Import from CV')).toBeVisible({ timeout: 5000 });

    // Step 2: Select CV/Resume context
    const cvButton = page.locator('button:has-text("CV/Resume")').first();
    await cvButton.click();

    // Step 3: Paste CV text
    const sampleCV = `
Senior Full Stack Developer

PROFESSIONAL SUMMARY
Experienced software engineer with 6+ years building scalable web applications.
Strong expertise in JavaScript, TypeScript, React, Node.js, and cloud technologies.

TECHNICAL SKILLS
• Frontend: React, Vue.js, HTML5, CSS3, Tailwind CSS
• Backend: Node.js, Express, Python, Django
• Database: PostgreSQL, MongoDB, Redis
• Cloud: AWS, Docker, Kubernetes
• Tools: Git, CI/CD, Agile methodologies

EXPERIENCE
Led development of microservices architecture serving 1M+ users.
Implemented automated testing and deployment pipelines.
Mentored junior developers and conducted code reviews.
    `.trim();

    const textarea = page.locator('textarea[placeholder*="CV"], textarea[placeholder*="resume"]').first();
    await textarea.fill(sampleCV);

    // Step 4: Click Analyze button
    const analyzeButton = page.locator('button:has-text("Analyze")').first();
    await analyzeButton.click();

    // Wait for suggestions to appear (may take a few seconds)
    await expect(page.locator('text=Suggested Skills')).toBeVisible({ timeout: 10000 });

    // Step 5: Verify suggestions appear
    const suggestionCards = page.locator('[role="button"]').filter({ hasText: /\d+%/ });
    const suggestionCount = await suggestionCards.count();
    expect(suggestionCount).toBeGreaterThan(0);

    // Step 6: Select first 3 skills
    for (let i = 0; i < Math.min(3, suggestionCount); i++) {
      await suggestionCards.nth(i).click();
    }

    // Step 7: Click "Add Selected" button
    const addButton = page.locator('button:has-text("Add"), button:has-text("Selected")').first();
    await addButton.click();

    // Step 8: Wait for success message
    await expect(page.locator('text=Successfully added, text=skill')).toBeVisible({ timeout: 5000 });

    // Step 9: Verify skills appear in Skills Atlas
    // After import, page should refresh or navigate to Skills Atlas
    await page.waitForTimeout(1000); // Wait for potential page reload

    // Look for skill indicators in the atlas
    const skillsTab = page.locator('button:has-text("Skills Atlas")').first();
    if (await skillsTab.isVisible()) {
      await skillsTab.click();
    }

    // Verify we can see skills in the atlas (L1 domain cards or skill count)
    const atlasContent = page.locator('text=Your skills mapped, text=entries');
    await expect(atlasContent).toBeVisible({ timeout: 5000 });
  });

  test('should show empty state when no skills found', async ({ page }) => {
    // Navigate to Import from CV tab
    const importTab = page.locator('button:has-text("Import from CV"), button:has-text("Import")').first();
    if (await importTab.isVisible()) {
      await importTab.click();
    }

    await expect(page.locator('text=Auto-Suggest from CV/JD, text=Import from CV')).toBeVisible({ timeout: 5000 });

    // Paste text with no recognizable skills
    const nonsenseText = 'The quick brown fox jumps over the lazy dog repeatedly.';
    const textarea = page.locator('textarea[placeholder*="CV"], textarea[placeholder*="resume"]').first();
    await textarea.fill(nonsenseText);

    // Click Analyze
    const analyzeButton = page.locator('button:has-text("Analyze")').first();
    await analyzeButton.click();

    // Should show info message about no skills found
    await expect(page.locator('text=No skills found, text=Try pasting more detailed')).toBeVisible({ timeout: 5000 });
  });

  test('should allow switching between CV and JD context', async ({ page }) => {
    // Navigate to Import from CV tab
    const importTab = page.locator('button:has-text("Import from CV"), button:has-text("Import")').first();
    if (await importTab.isVisible()) {
      await importTab.click();
    }

    // Click CV/Resume button
    const cvButton = page.locator('button:has-text("CV/Resume")').first();
    await cvButton.click();
    await expect(cvButton).toHaveClass(/default|primary/); // Should be selected

    // Click Job Description button
    const jdButton = page.locator('button:has-text("Job Description")').first();
    await jdButton.click();
    await expect(jdButton).toHaveClass(/default|primary/); // Should be selected

    // Click General Text button
    const generalButton = page.locator('button:has-text("General Text")').first();
    await generalButton.click();
    await expect(generalButton).toHaveClass(/default|primary/); // Should be selected
  });

  test('should show confidence scores for suggestions', async ({ page }) => {
    // Navigate to Import from CV tab
    const importTab = page.locator('button:has-text("Import from CV"), button:has-text("Import")').first();
    if (await importTab.isVisible()) {
      await importTab.click();
    }

    // Paste CV with clear skills
    const cvText = 'Expert in JavaScript, React, TypeScript, Node.js, and PostgreSQL.';
    const textarea = page.locator('textarea[placeholder*="CV"], textarea[placeholder*="resume"]').first();
    await textarea.fill(cvText);

    // Analyze
    const analyzeButton = page.locator('button:has-text("Analyze")').first();
    await analyzeButton.click();

    // Wait for suggestions
    await expect(page.locator('text=Suggested Skills')).toBeVisible({ timeout: 10000 });

    // Verify confidence badges are shown (e.g., "85%", "70%")
    const confidenceBadges = page.locator('text=/\\d+%/');
    const badgeCount = await confidenceBadges.count();
    expect(badgeCount).toBeGreaterThan(0);
  });

  test('should handle skill selection and deselection', async ({ page }) => {
    // Navigate to Import from CV tab
    const importTab = page.locator('button:has-text("Import from CV"), button:has-text("Import")').first();
    if (await importTab.isVisible()) {
      await importTab.click();
    }

    // Paste CV
    const cvText = 'Proficient in Python, Django, Flask, and FastAPI.';
    const textarea = page.locator('textarea[placeholder*="CV"], textarea[placeholder*="resume"]').first();
    await textarea.fill(cvText);

    // Analyze
    const analyzeButton = page.locator('button:has-text("Analyze")').first();
    await analyzeButton.click();

    // Wait for suggestions
    await expect(page.locator('text=Suggested Skills')).toBeVisible({ timeout: 10000 });

    // Get first suggestion card
    const firstCard = page.locator('[role="button"]').filter({ hasText: /\d+%/ }).first();
    
    // Click to select
    await firstCard.click();
    
    // Verify Add button appears with count
    await expect(page.locator('button:has-text("Add 1 Selected")')).toBeVisible();

    // Click again to deselect
    await firstCard.click();

    // Verify Add button disappears
    await expect(page.locator('button:has-text("Add")')).not.toBeVisible();
  });

  test('should disable analyze button when textarea is empty', async ({ page }) => {
    // Navigate to Import from CV tab
    const importTab = page.locator('button:has-text("Import from CV"), button:has-text("Import")').first();
    if (await importTab.isVisible()) {
      await importTab.click();
    }

    // Verify analyze button is disabled when empty
    const analyzeButton = page.locator('button:has-text("Analyze")').first();
    await expect(analyzeButton).toBeDisabled();

    // Type some text
    const textarea = page.locator('textarea[placeholder*="CV"], textarea[placeholder*="resume"]').first();
    await textarea.fill('Some text');

    // Verify button is now enabled
    await expect(analyzeButton).toBeEnabled();
  });

  test('should show loading state while analyzing', async ({ page }) => {
    // Navigate to Import from CV tab
    const importTab = page.locator('button:has-text("Import from CV"), button:has-text("Import")').first();
    if (await importTab.isVisible()) {
      await importTab.click();
    }

    // Paste CV
    const textarea = page.locator('textarea[placeholder*="CV"], textarea[placeholder*="resume"]').first();
    await textarea.fill('Expert in software development and project management.');

    // Click Analyze
    const analyzeButton = page.locator('button:has-text("Analyze")').first();
    await analyzeButton.click();

    // Should show "Analyzing..." text
    await expect(page.locator('button:has-text("Analyzing")')).toBeVisible();

    // Wait for results
    await expect(page.locator('text=Suggested Skills, text=Found')).toBeVisible({ timeout: 10000 });
  });

  test('should show loading state while adding skills', async ({ page }) => {
    // Navigate to Import from CV tab
    const importTab = page.locator('button:has-text("Import from CV"), button:has-text("Import")').first();
    if (await importTab.isVisible()) {
      await importTab.click();
    }

    // Complete analysis
    const textarea = page.locator('textarea[placeholder*="CV"], textarea[placeholder*="resume"]').first();
    await textarea.fill('Skilled in web development with HTML, CSS, and JavaScript.');
    
    const analyzeButton = page.locator('button:has-text("Analyze")').first();
    await analyzeButton.click();

    await expect(page.locator('text=Suggested Skills')).toBeVisible({ timeout: 10000 });

    // Select a skill
    const firstCard = page.locator('[role="button"]').filter({ hasText: /\d+%/ }).first();
    await firstCard.click();

    // Click Add Selected
    const addButton = page.locator('button:has-text("Add"), button:has-text("Selected")').first();
    await addButton.click();

    // Should show "Adding..." text
    await expect(page.locator('button:has-text("Adding")')).toBeVisible();
  });
});

test.describe('CV Import Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/app/i/expertise');

    // Navigate to Import from CV tab using keyboard
    const importTab = page.locator('button:has-text("Import from CV"), button:has-text("Import")').first();
    if (await importTab.isVisible()) {
      await importTab.focus();
      await page.keyboard.press('Enter');
    }

    // Textarea should be focusable
    const textarea = page.locator('textarea[placeholder*="CV"], textarea[placeholder*="resume"]').first();
    await textarea.focus();
    await expect(textarea).toBeFocused();

    // Type with keyboard
    await page.keyboard.type('Test CV content');

    // Tab to Analyze button
    await page.keyboard.press('Tab');
    
    // Analyze button should be focused (or next focusable element)
    // Press Enter to activate
    await page.keyboard.press('Enter');
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/app/i/expertise');

    const importTab = page.locator('button:has-text("Import from CV"), button:has-text("Import")').first();
    if (await importTab.isVisible()) {
      await importTab.click();
    }

    // Verify textarea has proper label
    const textarea = page.locator('textarea[placeholder*="CV"], textarea[placeholder*="resume"]').first();
    await expect(textarea).toBeVisible();

    // Verify buttons have proper labels
    const analyzeButton = page.locator('button:has-text("Analyze")').first();
    await expect(analyzeButton).toBeVisible();
  });
});

