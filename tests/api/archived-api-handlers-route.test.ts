import { describe, expect, it } from 'vitest';

import { POST as postAnalyticsEvents } from '@/app/api/analytics/events/route';
import { POST as postAnalyticsTourEvent } from '@/app/api/analytics/tour-event/route';
import { POST as postAnalyticsTrack } from '@/app/api/analytics/track/route';
import {
  GET as getAnalyticsWebVitals,
  POST as postAnalyticsWebVitals,
} from '@/app/api/analytics/web-vitals/route';
import { POST as postCvImportWizardApply } from '@/app/api/expertise/cv-import/wizard-apply/route';
import { POST as postCvImportWizardExtract } from '@/app/api/expertise/cv-import/wizard-extract/route';
import { GET as getCvImportWizardExtractStatus } from '@/app/api/expertise/cv-import/wizard-extract/status/route';
import { POST as postCvImportWizardSuggest } from '@/app/api/expertise/cv-import/wizard-suggest/route';
import { POST as postPerformanceTrack } from '@/app/api/performance/track/route';
import { GET as getProfileCompleteness } from '@/app/api/profile/completeness/route';

const archivedHandlers = [
  {
    route: 'POST /api/analytics/events',
    handler: postAnalyticsEvents,
    surface: 'Analytics API',
  },
  {
    route: 'POST /api/analytics/tour-event',
    handler: postAnalyticsTourEvent,
    surface: 'Analytics API',
  },
  {
    route: 'POST /api/analytics/track',
    handler: postAnalyticsTrack,
    surface: 'Analytics API',
  },
  {
    route: 'GET /api/analytics/web-vitals',
    handler: getAnalyticsWebVitals,
    surface: 'Analytics API',
  },
  {
    route: 'POST /api/analytics/web-vitals',
    handler: postAnalyticsWebVitals,
    surface: 'Analytics API',
  },
  {
    route: 'POST /api/expertise/cv-import/wizard-apply',
    handler: postCvImportWizardApply,
    surface: 'Legacy Expertise API',
  },
  {
    route: 'POST /api/expertise/cv-import/wizard-extract',
    handler: postCvImportWizardExtract,
    surface: 'Legacy Expertise API',
  },
  {
    route: 'GET /api/expertise/cv-import/wizard-extract/status',
    handler: getCvImportWizardExtractStatus,
    surface: 'Legacy Expertise API',
  },
  {
    route: 'POST /api/expertise/cv-import/wizard-suggest',
    handler: postCvImportWizardSuggest,
    surface: 'Legacy Expertise API',
  },
  {
    route: 'POST /api/performance/track',
    handler: postPerformanceTrack,
    surface: 'Performance API',
  },
  {
    route: 'GET /api/profile/completeness',
    handler: getProfileCompleteness,
    surface: 'Legacy Profile API',
  },
] as const;

describe('archived MVP API handlers', () => {
  it.each(archivedHandlers)('returns 410 directly for $route', async ({ handler, surface }) => {
    const response = await handler();
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body).toMatchObject({
      surface,
      launchState: 'non_launch',
    });
  });
});
