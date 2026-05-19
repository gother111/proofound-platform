import { describe, expect, it } from 'vitest';

import { POST as postCvImportWizardApply } from '@/app/api/expertise/cv-import/wizard-apply/route';
import { POST as postCvImportWizardExtract } from '@/app/api/expertise/cv-import/wizard-extract/route';
import { GET as getCvImportWizardExtractStatus } from '@/app/api/expertise/cv-import/wizard-extract/status/route';
import { POST as postCvImportWizardSuggest } from '@/app/api/expertise/cv-import/wizard-suggest/route';

const legacyCvWizardRoutes = [
  {
    route: 'POST /api/expertise/cv-import/wizard-extract',
    handler: postCvImportWizardExtract,
  },
  {
    route: 'GET /api/expertise/cv-import/wizard-extract/status',
    handler: getCvImportWizardExtractStatus,
  },
  {
    route: 'POST /api/expertise/cv-import/wizard-suggest',
    handler: postCvImportWizardSuggest,
  },
  {
    route: 'POST /api/expertise/cv-import/wizard-apply',
    handler: postCvImportWizardApply,
  },
] as const;

describe('legacy CV import wizard API routes', () => {
  it.each(legacyCvWizardRoutes)(
    'returns a launch-safe archive response for $route',
    async ({ handler }) => {
      const response = await handler();
      const body = await response.json();

      expect(response.status).toBe(410);
      expect(body).toMatchObject({
        surface: 'Legacy Expertise API',
        launchState: 'non_launch',
      });
      expect(JSON.stringify(body)).not.toMatch(/score|rank|shortlist|verifiedAt|publishedAt/i);
    }
  );
});
