import { describe, expect, it } from 'vitest';

import {
  canAudienceAccessVisibility,
  computeEffectiveVisibility,
  normalizeEffectiveVisibility,
} from '@/lib/privacy/effective-visibility';

describe('effective visibility', () => {
  it('maps legacy link and matched visibility to canonical levels', () => {
    expect(normalizeEffectiveVisibility('public')).toBe('public');
    expect(normalizeEffectiveVisibility('network_only')).toBe('link_only');
    expect(normalizeEffectiveVisibility('match_only')).toBe('matched_org');
    expect(normalizeEffectiveVisibility('hidden')).toBe('owner_only');
  });

  it('applies narrowest-wins across parent, child, workflow, and policy ceilings', () => {
    expect(
      computeEffectiveVisibility({
        parentMaxVisibility: 'public',
        childVisibility: 'link_only',
        workflowRevealCeiling: 'matched_org',
        policyCeiling: 'public',
      })
    ).toBe('matched_org');

    expect(
      computeEffectiveVisibility({
        parentMaxVisibility: 'public',
        childVisibility: 'owner_only',
        workflowRevealCeiling: 'public',
        policyCeiling: 'public',
      })
    ).toBe('owner_only');

    expect(
      computeEffectiveVisibility({
        parentMaxVisibility: 'public',
        childVisibility: 'public',
        workflowRevealCeiling: 'public',
        policyCeiling: 'public',
        moderationCeiling: 'matched_org',
      })
    ).toBe('matched_org');
  });

  it('does not let public publication override reveal-stage ceilings', () => {
    expect(
      computeEffectiveVisibility({
        parentMaxVisibility: 'public',
        childVisibility: 'public',
        workflowRevealCeiling: 'matched_org',
        policyCeiling: 'public',
      })
    ).toBe('matched_org');
  });

  it('keeps hidden child evidence inaccessible under a public parent', () => {
    const effective = computeEffectiveVisibility({
      parentMaxVisibility: 'public',
      childVisibility: 'owner_only',
      workflowRevealCeiling: 'public',
      policyCeiling: 'public',
    });

    expect(effective).toBe('owner_only');
    expect(canAudienceAccessVisibility(effective, 'public')).toBe(false);
  });

  it('prevents leakage on forbidden reads', () => {
    expect(canAudienceAccessVisibility('matched_org', 'public')).toBe(false);
    expect(canAudienceAccessVisibility('link_only', 'public')).toBe(false);
    expect(canAudienceAccessVisibility('link_only', 'matched_org')).toBe(true);
    expect(canAudienceAccessVisibility('matched_org', 'link_holder')).toBe(false);
  });
});
