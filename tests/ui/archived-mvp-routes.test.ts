import { access } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { classifyLaunchPagePath, getArchivedPagePolicy } from '@/lib/launch/surface-policy';

const HARD_GATED_PAGE_CASES = [
  {
    pathname: '/app/i/opportunities',
    file: 'src/app/app/i/opportunities/page.tsx',
    surfaceLabel: 'Individual Pages',
  },
  {
    pathname: '/app/o/[slug]/settings',
    file: 'src/app/app/o/[slug]/settings/page.tsx',
    surfaceLabel: 'Organization Pages',
  },
  {
    pathname: '/app/o/[slug]/settings/team',
    file: 'src/app/app/o/[slug]/settings/team/page.tsx',
    surfaceLabel: 'Organization Pages',
  },
  {
    pathname: '/app/o/[slug]/team',
    file: 'src/app/app/o/[slug]/team/page.tsx',
    surfaceLabel: 'Organization Pages',
  },
] as const;

const ARCHIVED_PAGE_CASES = [
  {
    pathname: '/app/i/expertise',
    file: 'src/app/app/i/expertise/page.tsx',
    surfaceLabel: 'Individual Pages',
  },
  {
    pathname: '/app/i/projects',
    file: 'src/app/app/i/projects/page.tsx',
    surfaceLabel: 'Individual Pages',
  },
  {
    pathname: '/app/i/projects/[id]',
    file: 'src/app/app/i/projects/[id]/page.tsx',
    surfaceLabel: 'Individual Pages',
  },
  {
    pathname: '/app/i/skill-gaps',
    file: 'src/app/app/i/skill-gaps/page.tsx',
    surfaceLabel: 'Individual Pages',
  },
  {
    pathname: '/app/i/zen',
    file: 'src/app/app/i/zen/page.tsx',
    surfaceLabel: 'Individual Pages',
  },
  {
    pathname: '/app/i/settings/fairness',
    file: 'src/app/app/i/settings/fairness/page.tsx',
    surfaceLabel: 'Individual Pages',
  },
  {
    pathname: '/app/o/[slug]/analytics/fairness',
    file: 'src/app/app/o/[slug]/analytics/fairness/page.tsx',
    surfaceLabel: 'Organization Pages',
  },
  {
    pathname: '/app/o/[slug]/projects',
    file: 'src/app/app/o/[slug]/projects/page.tsx',
    surfaceLabel: 'Organization Pages',
  },
  {
    pathname: '/app/o/[slug]/culture',
    file: 'src/app/app/o/[slug]/culture/page.tsx',
    surfaceLabel: 'Organization Pages',
  },
  {
    pathname: '/app/o/[slug]/goals',
    file: 'src/app/app/o/[slug]/goals/page.tsx',
    surfaceLabel: 'Organization Pages',
  },
  {
    pathname: '/app/o/[slug]/impact',
    file: 'src/app/app/o/[slug]/impact/page.tsx',
    surfaceLabel: 'Organization Pages',
  },
  {
    pathname: '/app/o/[slug]/partnerships',
    file: 'src/app/app/o/[slug]/partnerships/page.tsx',
    surfaceLabel: 'Organization Pages',
  },
  {
    pathname: '/app/o/[slug]/structure',
    file: 'src/app/app/o/[slug]/structure/page.tsx',
    surfaceLabel: 'Organization Pages',
  },
  {
    pathname: '/app/o/[slug]/settings/goals',
    file: 'src/app/app/o/[slug]/settings/goals/page.tsx',
    surfaceLabel: 'Organization Pages',
  },
  {
    pathname: '/about',
    file: 'src/app/(marketing)/about/page.tsx',
    surfaceLabel: 'Public Pages',
  },
  {
    pathname: '/careers',
    file: 'src/app/(marketing)/careers/page.tsx',
    surfaceLabel: 'Public Pages',
  },
  {
    pathname: '/contact',
    file: 'src/app/(marketing)/contact/page.tsx',
    surfaceLabel: 'Public Pages',
  },
  {
    pathname: '/manifesto',
    file: 'src/app/(marketing)/manifesto/page.tsx',
    surfaceLabel: 'Public Pages',
  },
  {
    pathname: '/support',
    file: 'src/app/(marketing)/support/page.tsx',
    surfaceLabel: 'Public Pages',
  },
  {
    pathname: '/accessibility',
    file: 'src/app/accessibility/page.tsx',
    surfaceLabel: 'Public Pages',
  },
  {
    pathname: '/fairness',
    file: 'src/app/fairness/page.tsx',
    surfaceLabel: 'Public Pages',
  },
  {
    pathname: '/p/[token]',
    file: 'src/app/p/[token]/page.tsx',
    surfaceLabel: 'Public Pages',
  },
  {
    pathname: '/p/[token]/embed',
    file: 'src/app/p/[token]/embed/page.tsx',
    surfaceLabel: 'Public Pages',
  },
  {
    pathname: '/verify-skill',
    file: 'src/app/verify-skill/page.tsx',
    surfaceLabel: 'Public Pages',
  },
  {
    pathname: '/o/[slug]/assignments/new',
    file: 'src/app/o/[slug]/assignments/new/page.tsx',
    surfaceLabel: 'Compatibility Pages',
  },
] as const;

const REMOVED_ARCHIVED_PAGE_IMPLEMENTATIONS = [
  'src/app/verify-skill/VerifySkillContent.tsx',
  'src/components/notifications/NotificationBell.tsx',
  'src/components/notifications/NotificationDropdown.tsx',
  'src/components/settings/DataImportButton.tsx',
  'src/components/settings/EnhancedDataImportDialog.tsx',
  'src/components/settings/ConflictResolutionDialog.tsx',
  'src/components/surveys/SUSDialog.tsx',
  'src/components/surveys/SUSPromptHost.tsx',
  'src/components/surveys/SUSQuestionnaire.tsx',
  'src/hooks/useSUSurvey.ts',
  'src/lib/surveys/sus-triggers.ts',
  'src/lib/surveys/sus-calculator.ts',
] as const;

describe('archived non-MVP routes', () => {
  it('classifies hard-gated routes explicitly and removes their page handlers from src/app', async () => {
    for (const route of HARD_GATED_PAGE_CASES) {
      expect(classifyLaunchPagePath(route.pathname)).toBe('gated_non_mvp');
      expect(getArchivedPagePolicy(route.pathname)).toMatchObject({
        surfaceLabel: route.surfaceLabel,
      });

      await expect(access(path.join(process.cwd(), route.file))).rejects.toMatchObject({
        code: 'ENOENT',
      });
    }
  });

  it('classifies archived routes explicitly and removes their page handlers from src/app', async () => {
    for (const route of ARCHIVED_PAGE_CASES) {
      expect(classifyLaunchPagePath(route.pathname)).toBe('archived');
      expect(getArchivedPagePolicy(route.pathname)).toMatchObject({
        surfaceLabel: route.surfaceLabel,
      });

      await expect(access(path.join(process.cwd(), route.file))).rejects.toMatchObject({
        code: 'ENOENT',
      });
    }
  });

  it('keeps archived page implementation islands out of active src/app', async () => {
    for (const file of REMOVED_ARCHIVED_PAGE_IMPLEMENTATIONS) {
      await expect(access(path.join(process.cwd(), file))).rejects.toMatchObject({
        code: 'ENOENT',
      });
    }
  });
});
