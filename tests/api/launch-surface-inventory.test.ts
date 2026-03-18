import { describe, expect, it } from 'vitest';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

import { classifyLaunchApiPath } from '@/lib/launch/surface-policy';

const API_ROOT = path.join(process.cwd(), 'src/app/api');

const REQUIRED_ACTIVE_ROUTES = [
  '/api/analytics/events',
  '/api/analytics/track',
  '/api/analytics/tour-event',
  '/api/analytics/web-vitals',
  '/api/assignments',
  '/api/feature-flags',
  '/api/expertise/jd-to-l4',
  '/api/expertise/taxonomy',
  '/api/expertise/user-skills',
  '/api/integrations/google/connect',
  '/api/integrations/google/callback',
  '/api/integrations/video',
  '/api/integrations/video/[provider]',
  '/api/integrations/video/[provider]/auth',
  '/api/integrations/video/generate-link',
  '/api/integrations/video/status',
  '/api/interviews',
  '/api/monitoring/launch-status',
  '/api/monitoring/perf-status',
  '/api/org/readiness',
  '/api/organizations/[orgId]/assignments',
  '/api/organizations/[orgId]/candidate-invites',
  '/api/organizations/[orgId]/visibility',
  '/api/performance/track',
  '/api/portfolio/visibility',
  '/api/upload/document',
  '/api/verification/requests',
  '/api/verification/linkedin/initiate',
  '/api/verify/[token]',
] as const;

const REMOVED_ROUTE_FILES = [
  '/api/contracts',
  '/api/contracts/[id]',
  '/api/projects',
  '/api/projects/[id]',
  '/api/skill-gaps',
  '/api/skill-gaps/goals',
  '/api/skill-gaps/overview',
  '/api/integrations',
  '/api/integrations/[provider]/connect',
  '/api/integrations/[provider]/disconnect',
  '/api/integrations/zoom/connect',
  '/api/integrations/zoom/callback',
  '/api/expertise/profile',
  '/api/expertise/auto-suggest',
  '/api/expertise/gap-analysis',
  '/api/expertise/stats',
  '/api/expertise/cv-import/suggest',
  '/api/expertise/cv-import/wizard-apply',
  '/api/expertise/cv-import/wizard-extract',
  '/api/expertise/cv-import/wizard-extract/status',
  '/api/expertise/cv-import/wizard-suggest',
  '/api/expertise/linkedin-import',
  '/api/expertise/linkedin-status',
  '/api/expertise/linkedin-disconnect',
] as const;

const REQUIRED_ARCHIVED_COMPAT_PATHS = [
  '/api/contracts',
  '/api/contracts/[id]',
  '/api/projects',
  '/api/projects/[id]',
  '/api/skill-gaps',
  '/api/skill-gaps/overview',
  '/api/integrations',
  '/api/integrations/zoom/connect',
  '/api/expertise/profile',
  '/api/expertise/auto-suggest',
  '/api/expertise/gap-analysis',
  '/api/expertise/stats',
  '/api/expertise/cv-import/wizard-suggest',
  '/api/expertise/linkedin-import',
  '/api/expertise/linkedin-status',
  '/api/expertise/linkedin-disconnect',
  '/api/organizations/[orgId]/causes',
  '/api/organizations/[orgId]/goals',
  '/api/organizations/[orgId]/goals/[id]',
  '/api/organizations/[orgId]/ownership',
  '/api/organizations/[orgId]/ownership/[ownershipId]',
  '/api/organizations/[orgId]/partnerships',
  '/api/organizations/[orgId]/partnerships/[id]',
  '/api/organizations/[orgId]/test-matches',
] as const;

async function collectRoutePaths(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const routes: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      routes.push(...(await collectRoutePaths(absolutePath)));
      continue;
    }

    if (!entry.isFile() || entry.name !== 'route.ts') {
      continue;
    }

    const relativePath = path.relative(API_ROOT, absolutePath).replace(/\\/g, '/');
    routes.push(`/api/${relativePath.replace(/\/route\.ts$/, '')}`);
  }

  return routes.sort();
}

describe('launch surface inventory', () => {
  it('keeps the retained MVP corridor explicitly active', async () => {
    const routes = await collectRoutePaths(API_ROOT);

    for (const route of REQUIRED_ACTIVE_ROUTES) {
      expect(routes).toContain(route);
      expect(classifyLaunchApiPath(route)).toBe('active_launch_path');
    }
  });

  it('removes non-MVP route handlers from the compiled launch surface', async () => {
    const routes = await collectRoutePaths(API_ROOT);

    for (const route of REMOVED_ROUTE_FILES) {
      expect(routes).not.toContain(route);
    }
  });

  it('keeps representative non-MVP paths archived at the surface-policy boundary', async () => {
    for (const route of REQUIRED_ARCHIVED_COMPAT_PATHS) {
      expect(classifyLaunchApiPath(route)).toBe('archived');
    }
  });
});
