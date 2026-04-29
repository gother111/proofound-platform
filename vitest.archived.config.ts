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
      'tests/api/messages-legacy-route.test.ts',
      'tests/api/moderation-appeals-route.test.ts',
      'tests/api/moderation-statements-of-reasons-route.test.ts',
      'tests/api/moderation-transparency-report-route.test.ts',
      'tests/api/organization-test-matches-route.test.ts',
      'tests/api/updates-cache-flag-route.test.ts',
      'tests/ui/admin-ai-spend-page.test.tsx',
      'tests/ui/admin-fairness-notes-page.test.tsx',
      'tests/ui/organization-settings-integrations.test.tsx',
    ],
    exclude: [
      '**/node_modules/**',
      '**/.artifacts/**',
      'src/archive/non_launch_integrations/preserved/tests/**',
    ],
  },
});
