import { describe, expect, it } from 'vitest';

import { classifyLaunchApiPath, getArchivedApiPolicy } from '@/lib/launch/surface-policy';
import {
  GET as getAssignmentPipeline,
  POST as postAssignmentPipeline,
} from '@/app/api/assignments/[id]/pipeline/route';

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

  it('keeps the generic assignment pipeline API archived at policy and handler boundaries', async () => {
    const route = '/api/assignments/assignment-1/pipeline';

    expect(classifyLaunchApiPath(route)).toBe('archived');
    expect(getArchivedApiPolicy(route)).toMatchObject({
      surfaceLabel: 'Assignment Pipeline API',
    });

    const getResponse = await getAssignmentPipeline();
    expect(getResponse.status).toBe(410);
    await expect(getResponse.json()).resolves.toMatchObject({
      error: 'Assignment pipeline API is not part of the launch MVP flow.',
      launchState: 'non_launch',
      surface: 'Assignment pipeline API',
    });

    const postResponse = await postAssignmentPipeline();
    expect(postResponse.status).toBe(410);
  });
});
