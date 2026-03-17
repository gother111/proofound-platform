import { describe, expect, it } from 'vitest';

import IndividualExpertisePage from '@/app/app/i/expertise/page';
import IndividualSkillGapsPage from '@/app/app/i/skill-gaps/page';
import IndividualZenPage from '@/app/app/i/zen/page';
import IndividualFairnessSettingsPage from '@/app/app/i/settings/fairness/page';
import OrgFairnessAnalyticsPage from '@/app/app/o/[slug]/analytics/fairness/page';
import VerifySkillPage from '@/app/verify-skill/page';

async function expectNotFound(renderRoute: () => unknown | Promise<unknown>) {
  await expect(Promise.resolve().then(renderRoute)).rejects.toMatchObject({
    digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
  });
}

describe('archived non-MVP routes', () => {
  it('archives the individual zen route', async () => {
    await expectNotFound(() => IndividualZenPage());
  });

  it('archives the individual fairness settings route', async () => {
    await expectNotFound(() => IndividualFairnessSettingsPage());
  });

  it('archives the individual expertise route', async () => {
    await expectNotFound(() => IndividualExpertisePage());
  });

  it('archives the legacy skill gaps alias', async () => {
    await expectNotFound(() => IndividualSkillGapsPage());
  });

  it('archives the org fairness analytics route', async () => {
    await expectNotFound(() => OrgFairnessAnalyticsPage());
  });

  it('archives the legacy verify-skill page', async () => {
    await expectNotFound(() => VerifySkillPage());
  });
});
