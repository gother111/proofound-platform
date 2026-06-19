import { describe, expect, it } from 'vitest';

import {
  individualTourSteps as guidedIndividualTourSteps,
  organizationTourSteps as guidedOrganizationTourSteps,
} from '@/components/tour/tourSteps';
import {
  individualTourSteps as staticIndividualTourSteps,
  organizationTourSteps as staticOrganizationTourSteps,
  tourStyles as staticTourStyles,
} from '@/lib/tour/tour-steps';

const activeTourTargets = new Set([
  'body',
  '[data-tour="left-nav"]',
  '[data-tour="home-link"]',
  '[data-tour="profile-link"]',
  '[data-tour="matching-link"]',
  '[data-tour="settings-link"]',
  '[data-tour="assignments-link"]',
  '[data-tour="communications-link"]',
  '[data-tour="org-profile"]',
  '[data-tour="portfolio-link"]',
]);

function targetValues(steps: Array<{ target?: unknown }>) {
  return steps
    .map((step) => step.target)
    .filter((target): target is string => typeof target === 'string');
}

describe('tour navigation contract', () => {
  it('keeps guided tour targets aligned to active MVP navigation selectors', () => {
    const targets = targetValues([...guidedIndividualTourSteps, ...guidedOrganizationTourSteps]);

    expect(targets).toContain('[data-tour="home-link"]');
    expect(targets).toContain('[data-tour="assignments-link"]');
    expect(targets).toContain('[data-tour="communications-link"]');
    expect(targets).not.toContain('[data-tour="dashboard"]');
    expect(targets).not.toContain('[data-tour="assignments"]');
    expect(targets).not.toContain('[data-tour="candidates"]');
    expect(targets.every((target) => activeTourTargets.has(target))).toBe(true);
  });

  it('keeps static tour helpers away from archived or nonexistent navigation targets', () => {
    const targets = targetValues([...staticIndividualTourSteps, ...staticOrganizationTourSteps]);

    expect(targets).not.toContain('[data-tour="expertise-section"]');
    expect(targets).not.toContain('[data-tour="import-cv-tab"]');
    expect(targets).not.toContain('[data-tour="gap-analysis-tab"]');
    expect(targets).not.toContain('[data-tour="opportunities-section"]');
    expect(targets).not.toContain('[data-tour="projects-section"]');
    expect(targets).not.toContain('[data-tour="team-section"]');
    expect(targets.every((target) => activeTourTargets.has(target))).toBe(true);
  });

  it('keeps static tour helper chrome aligned to Proofound brand tokens', () => {
    expect(staticTourStyles.options.primaryColor).toBe('#1C4D3A');
    expect(staticTourStyles.options.textColor).toBe('#2D3330');
    expect(staticTourStyles.options.backgroundColor).toBe('#FCFBF8');
    expect(staticTourStyles.options.overlayColor).toBe('rgba(45, 51, 48, 0.4)');
    expect(staticTourStyles.buttonNext.backgroundColor).toBe('#1C4D3A');
    expect(JSON.stringify(staticTourStyles)).not.toContain('#2563eb');
  });
});
