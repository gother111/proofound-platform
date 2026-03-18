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
  '/api/integrations/google/connect',
  '/api/integrations/video',
  '/api/integrations/zoom/connect',
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
  '/api/expertise/taxonomy',
  '/api/expertise/jd-to-l4',
] as const;

const REQUIRED_ARCHIVED_ROUTES = [
  '/api/contracts',
  '/api/contracts/[id]',
  '/api/projects',
  '/api/projects/[id]',
  '/api/skill-gaps',
  '/api/integrations',
  '/api/expertise/profile',
  '/api/expertise/auto-suggest',
  '/api/expertise/gap-analysis',
  '/api/expertise/stats',
  '/api/expertise/linkedin-import',
  '/api/expertise/linkedin-status',
  '/api/expertise/linkedin-disconnect',
  '/api/expertise/user-skills',
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

  it('keeps representative non-MVP families compiled only as archived compatibility surfaces', async () => {
    const routes = await collectRoutePaths(API_ROOT);

    for (const route of REQUIRED_ARCHIVED_ROUTES) {
      expect(routes).toContain(route);
      expect(classifyLaunchApiPath(route)).toBe('archived');
    }
  });
});
