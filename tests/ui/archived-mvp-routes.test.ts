import { beforeEach, describe, expect, it, vi } from 'vitest';

const { notFoundMock, redirectMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    const error = new Error('NEXT_NOT_FOUND');
    (error as Error & { digest?: string }).digest = 'NEXT_HTTP_ERROR_FALLBACK;404';
    throw error;
  }),
  redirectMock: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
  redirect: redirectMock,
}));

import IndividualExpertisePage from '@/app/app/i/expertise/page';
import IndividualProjectsPage from '@/app/app/i/projects/page';
import IndividualProjectPage from '@/app/app/i/projects/[id]/page';
import IndividualSkillGapsPage from '@/app/app/i/skill-gaps/page';
import IndividualZenPage from '@/app/app/i/zen/page';
import IndividualFairnessSettingsPage from '@/app/app/i/settings/fairness/page';
import OrgFairnessAnalyticsPage from '@/app/app/o/[slug]/analytics/fairness/page';
import OrgProjectsPage from '@/app/app/o/[slug]/projects/page';
import OrgSettingsGoalsPage from '@/app/app/o/[slug]/settings/goals/page';
import VerifySkillPage from '@/app/verify-skill/page';

async function expectNotFound(renderRoute: () => unknown | Promise<unknown>) {
  await expect(Promise.resolve().then(renderRoute)).rejects.toMatchObject({
    digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
  });
}

async function expectRedirect(renderRoute: () => unknown | Promise<unknown>, expectedHref: string) {
  await expect(Promise.resolve().then(renderRoute)).rejects.toThrow('NEXT_REDIRECT');
  expect(redirectMock).toHaveBeenLastCalledWith(expectedHref);
}

describe('archived non-MVP routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('archives the individual zen route', async () => {
    await expectNotFound(() => IndividualZenPage());
  });

  it('archives the individual fairness settings route', async () => {
    await expectNotFound(() => IndividualFairnessSettingsPage());
  });

  it('archives the individual expertise route', async () => {
    await expectNotFound(() => IndividualExpertisePage());
  });

  it('archives the individual projects hub', async () => {
    await expectNotFound(() => IndividualProjectsPage());
  });

  it('archives the individual project detail route', async () => {
    await expectNotFound(() => IndividualProjectPage());
  });

  it('archives the legacy skill gaps alias', async () => {
    await expectNotFound(() => IndividualSkillGapsPage());
  });

  it('archives the org fairness analytics route', async () => {
    await expectNotFound(() => OrgFairnessAnalyticsPage());
  });

  it('redirects archived org projects back into the MVP corridor', async () => {
    await expectRedirect(
      () => OrgProjectsPage({ params: Promise.resolve({ slug: 'acme' }) }),
      '/app/o/acme/home'
    );
  });

  it('redirects archived org goals settings back into the MVP corridor', async () => {
    await expectRedirect(
      () => OrgSettingsGoalsPage({ params: Promise.resolve({ slug: 'acme' }) }),
      '/app/o/acme/home'
    );
  });

  it('archives the legacy verify-skill page', async () => {
    await expectNotFound(() => VerifySkillPage());
  });
});
