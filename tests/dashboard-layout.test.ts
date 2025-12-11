import { describe, it, expect } from 'vitest';

import { AVAILABLE_WIDGETS, DEFAULT_LAYOUT, validateLayout } from '@/lib/dashboard/layout';

describe('dashboard layout', () => {
  it('keeps default layout valid and sequential', () => {
    const result = validateLayout(DEFAULT_LAYOUT);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(DEFAULT_LAYOUT.map((w) => w.position)).toEqual([...Array(DEFAULT_LAYOUT.length).keys()]);
  });

  it('includes new individual tiles required by PRD', () => {
    const requiredIds = [
      'profile-activation',
      'matching-readiness',
      'interviews-feedback',
      'momentum-metrics',
      'zen-snapshot',
      'notifications',
      'next-best-actions',
    ];

    requiredIds.forEach((id) => {
      expect(AVAILABLE_WIDGETS[id]).toBeDefined();
    });
  });
});
