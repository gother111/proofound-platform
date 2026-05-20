import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = process.cwd();

const ACTIVE_PROFILE_COPY_FILES = [
  'src/components/profile/EditableProfileView.tsx',
  'src/components/profile/DeferredEditableProfileView.tsx',
  'src/components/profile/GuidedProfileSetupView.tsx',
  'src/components/profile/editable-profile/ProfileReadinessBanner.tsx',
  'src/components/tour/FirstRunTour.tsx',
  'src/components/tour/tourSteps.tsx',
  'src/lib/tour/tour-steps.ts',
];

describe('active profile copy guardrails', () => {
  it('keeps proof-first profile entry copy away from profile-polish language', () => {
    const activeCopy = ACTIVE_PROFILE_COPY_FILES.map((relativePath) =>
      readFileSync(path.join(REPO_ROOT, relativePath), 'utf8')
    ).join('\n');

    expect(activeCopy).not.toMatch(/profile polish|profile polishing/i);
    expect(activeCopy).not.toMatch(/broad profile/i);
    expect(activeCopy).not.toMatch(/return to your dashboard|back to dashboard/i);
    expect(activeCopy).not.toMatch(/profile page did not load/i);
    expect(activeCopy).toMatch(/Start with proof, then choose what to share/);
  });
});
