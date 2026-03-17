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
  '/api/performance/track',
  '/api/feature-flags',
  '/api/monitoring/launch-status',
  '/api/monitoring/perf-status',
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
  it('does not compile any routes whose launch policy classifies them as archived', async () => {
    const routes = await collectRoutePaths(API_ROOT);
    const forbiddenRoutes = routes.filter((route) => classifyLaunchApiPath(route) === 'archived');

    expect(forbiddenRoutes).toEqual([]);
  });

  it('keeps the retained launch-safe endpoints outside the archived policy', async () => {
    const routes = await collectRoutePaths(API_ROOT);

    for (const route of REQUIRED_ACTIVE_ROUTES) {
      expect(routes).toContain(route);
      expect(classifyLaunchApiPath(route)).toBe('active_launch_path');
    }
  });
});
