import { Page } from '@playwright/test';

/**
 * E2E Test Data Setup Helpers
 *
 * Utilities for creating test data (users, assignments, skills, etc.)
 * Note: These are UI-based setup helpers. For direct DB setup, use API calls or direct DB access.
 */

/**
 * Create a complete test user profile via UI
 */
export async function createCompleteTestProfile(
  page: Page,
  options: {
    mission?: string;
    vision?: string;
    values?: string[];
    causes?: string[];
    skills?: Array<{ name: string; level: number }>;
    workExperience?: Array<{
      organization: string;
      role: string;
      startDate: string;
      endDate?: string;
    }>;
  }
) {
  // Navigate to profile
  await page.goto('/app/i/profile');
  await page.waitForLoadState('networkidle');

  // Add mission if provided
  if (options.mission) {
    const { editMission } = await import('./profile-helpers');
    await editMission(page, options.mission);
  }

  // Add vision if provided
  if (options.vision) {
    const { editVision } = await import('./profile-helpers');
    await editVision(page, options.vision);
  }

  // Add values if provided
  if (options.values) {
    const { addValues } = await import('./profile-helpers');
    await addValues(page, options.values);
  }

  // Add causes if provided
  if (options.causes) {
    const { addCauses } = await import('./profile-helpers');
    await addCauses(page, options.causes);
  }

  // Add skills if provided
  if (options.skills) {
    await page.goto('/app/i/expertise');
    await page.waitForLoadState('networkidle');

    const { openAddSkillDrawer, selectSkillViaTaxonomy, setSkillLevel, saveSkill } = await import(
      './expertise-helpers'
    );

    for (const skill of options.skills) {
      await openAddSkillDrawer(page);
      // Simplified: just search and select
      await page.locator('input[type="search"]').fill(skill.name);
      await page.waitForTimeout(1000);

      const skillOption = page.locator(`text=/${skill.name}/i`).first();
      if (await skillOption.isVisible()) {
        await skillOption.click();
        await setSkillLevel(page, skill.level);
        await saveSkill(page);
      }
    }
  }

  // Add work experience if provided
  if (options.workExperience) {
    await page.goto('/app/i/profile');
    await page.waitForLoadState('networkidle');

    const { addWorkExperience } = await import('./profile-helpers');

    for (const exp of options.workExperience) {
      await addWorkExperience(page, exp);
    }
  }
}

/**
 * Create matching profile via UI
 */
export async function createMatchingProfile(
  page: Page,
  options: {
    focusAreas?: string[];
    location?: string;
    workMode?: 'remote' | 'hybrid' | 'onsite';
    salaryMin?: number;
    salaryMax?: number;
    causes?: string[];
  }
) {
  await page.goto('/app/i/matching');
  await page.waitForLoadState('networkidle');

  const { completeMatchingProfileSetup } = await import('./matching-helpers');
  await completeMatchingProfileSetup(page, {
    focusAreas: options.focusAreas,
    constraints: {
      location: options.location,
      workMode: options.workMode,
      salaryMin: options.salaryMin,
      salaryMax: options.salaryMax,
    },
  });
}

/**
 * Wait for API response and return data
 */
export async function waitForAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout = 10000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`API response timeout for ${urlPattern}`));
    }, timeout);

    page.on('response', (response) => {
      const url = response.url();
      const matches =
        typeof urlPattern === 'string' ? url.includes(urlPattern) : urlPattern.test(url);

      if (matches && response.ok()) {
        clearTimeout(timeoutId);
        response.json().then(resolve).catch(reject);
      }
    });
  });
}

/**
 * Create test assignment via API (if API available)
 * Otherwise, this is a placeholder for UI-based creation
 */
export async function createTestAssignment(
  page: Page,
  assignment: {
    title: string;
    description: string;
    requiredSkills?: string[];
    location?: string;
    workMode?: 'remote' | 'hybrid' | 'onsite';
    orgId?: string;
    orgSlug?: string;
  }
) {
  // Try to create via API first
  try {
    const response = await page.request.post('/api/assignments', {
      data: {
        orgId: assignment.orgId,
        orgSlug: assignment.orgSlug,
        role: assignment.title,
        description: assignment.description,
        locationMode: assignment.workMode,
      },
    });

    if (response.ok()) {
      return await response.json();
    }
  } catch (error) {
    // Fall back to UI creation if API not available
    console.warn('API creation failed, would use UI flow');
  }

  // UI-based creation would go here
  // For now, return placeholder
  return { id: 'test-assignment-id', ...assignment };
}

/**
 * Clean up test data (placeholder)
 * In real implementation, this would call cleanup API or direct DB access
 */
export async function cleanupTestData(
  page: Page,
  dataIds: {
    userIds?: string[];
    assignmentIds?: string[];
    skillIds?: string[];
  }
) {
  // Placeholder for cleanup
  // In real implementation, would:
  // 1. Call cleanup API endpoints
  // 2. Or use direct DB access in test environment
  console.log('Cleaning up test data:', dataIds);
}
