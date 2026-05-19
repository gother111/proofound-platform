import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';

import baseConfig from './vitest.config';

const archivePath = (path: string) =>
  fileURLToPath(new URL(`./src/archive/${path}`, import.meta.url));

export default defineConfig({
  ...baseConfig,
  resolve: {
    ...baseConfig.resolve,
    alias: [
      {
        find: '@/app/api/messages/route',
        replacement: archivePath('non_launch_api/messages/route.ts'),
      },
      {
        find: '@/app/api/messages/[conversationId]/route',
        replacement: archivePath('non_launch_api/messages/[conversationId]/route.ts'),
      },
      {
        find: '@/app/api/moderation/appeals/route',
        replacement: archivePath('non_launch_api/moderation/appeals/route.ts'),
      },
      {
        find: '@/app/api/moderation/statements-of-reasons/route',
        replacement: archivePath('non_launch_api/moderation/statements-of-reasons/route.ts'),
      },
      {
        find: '@/app/api/moderation/transparency-report/route',
        replacement: archivePath('non_launch_api/moderation/transparency-report/route.ts'),
      },
      {
        find: '@/app/api/organizations/[orgId]/test-matches/route',
        replacement: archivePath('non_launch_api/organizations/[orgId]/test-matches/route.ts'),
      },
      {
        find: '@/app/api/updates/route',
        replacement: archivePath('non_launch_api/updates/route.ts'),
      },
      {
        find: '@/app/admin/ai-spend/page',
        replacement: archivePath('non_launch_pages/admin/ai-spend/page.tsx'),
      },
      {
        find: '@/app/admin/fairness/notes/page',
        replacement: archivePath('non_launch_pages/admin/fairness/notes/page.tsx'),
      },
      {
        find: '@/app/app/o/[slug]/settings/page',
        replacement: archivePath('non_launch_pages/app/o/[slug]/settings/page.tsx'),
      },
      {
        find: '@/app/app/o/[slug]/settings/integrations/page',
        replacement: archivePath('non_launch_pages/app/o/[slug]/settings/integrations/page.tsx'),
      },
      ...(Array.isArray(baseConfig.resolve?.alias)
        ? baseConfig.resolve.alias
        : Object.entries(baseConfig.resolve?.alias ?? {}).map(([find, replacement]) => ({
            find,
            replacement,
          }))),
    ],
  },
  test: {
    ...baseConfig.test,
    include: [
      'src/archive/**/*.test.ts',
      'src/archive/**/*.test.tsx',
      'tests/archive/non_mvp_legacy_api/**/*.test.ts',
      'tests/archive/non_mvp_moderation_api/**/*.test.ts',
      'tests/archive/non_mvp_org_integrations_ui/**/*.test.ts',
      'tests/archive/non_mvp_org_integrations_ui/**/*.test.tsx',
      'tests/archive/non_mvp_admin_suite/**/*.test.tsx',
      'tests/archive/non_mvp_cv_import_wizard/**/*.test.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/.artifacts/**',
      'src/archive/non_launch_integrations/preserved/tests/**',
    ],
  },
});
