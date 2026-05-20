import { describe, expect, it } from 'vitest';

import { classifyLaunchApiPath, getArchivedApiPolicy } from '@/lib/launch/surface-policy';

const archivedMiddlewareRoutes = [
  '/api/expertise/cv-import/wizard-apply',
  '/api/expertise/cv-import/wizard-extract',
  '/api/expertise/cv-import/wizard-extract/status',
  '/api/expertise/cv-import/wizard-suggest',
] as const;

describe('archived MVP API handlers', () => {
  it.each(archivedMiddlewareRoutes)('keeps $0 archived at the middleware boundary', (route) => {
    expect(classifyLaunchApiPath(route)).toBe('archived');
    expect(getArchivedApiPolicy(route)).toMatchObject({
      surfaceLabel: 'Legacy Expertise API',
    });
  });
});
