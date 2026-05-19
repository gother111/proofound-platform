import { readdir } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { classifyLaunchPagePath } from '@/lib/launch/surface-policy';

const PAGE_ROOT = path.join(process.cwd(), 'src/app');

const REQUIRED_ACTIVE_PAGES = [
  '/',
  '/403',
  '/accept-invite',
  '/auth/login',
  '/candidate-invite/[token]',
  '/cookies',
  '/cookies/settings',
  '/feedback/[token]',
  '/login',
  '/onboarding',
  '/portfolio/[handle]',
  '/portfolio/org/[slug]',
  '/privacy',
  '/reset-password',
  '/reset-password/confirm',
  '/signup',
  '/signup/individual',
  '/signup/organization',
  '/terms',
  '/verify-email',
  '/verify-work-email',
  '/verify/[token]',
  '/verify/custom/[token]',
  '/app/i/home',
  '/app/i/communications',
  '/app/i/interviews',
  '/app/i/matching',
  '/app/i/matching/preferences',
  '/app/i/messages',
  '/app/i/portfolio',
  '/app/i/profile',
  '/app/i/settings',
  '/app/i/settings/audit-log',
  '/app/i/settings/privacy',
  '/app/i/verifications',
  '/app/interviews/[id]/feedback',
  '/app/o/[slug]/assignments',
  '/app/o/[slug]/assignments/[id]/review',
  '/app/o/[slug]/assignments/new',
  '/app/o/[slug]/communications',
  '/app/o/[slug]/home',
  '/app/o/[slug]/interviews',
  '/app/o/[slug]/invitations/[token]',
  '/app/o/[slug]/matching',
  '/app/o/[slug]/messages',
  '/app/o/[slug]/portfolio',
  '/app/o/[slug]/profile',
  '/app/o/[slug]/shortlist',
] as const;

const REQUIRED_ACTIVE_ROUTE_HANDLERS = [
  '/auth/callback',
  '/auth/logout',
  '/llms',
  '/llms.txt',
  '/llms-full.txt',
  '/robots.txt',
  '/security.txt',
  '/.well-known/security.txt',
] as const;

const REQUIRED_INTERNAL_ONLY_PAGES = ['/admin', '/admin/audit', '/admin/verification'] as const;

const ALLOWED_ARCHIVED_ROUTE_HANDLERS = ['/dev/resolve-home'] as const;

const REQUIRED_HARD_GATED_PAGES = [
  '/app/i/opportunities',
  '/app/o/[slug]/settings',
  '/app/o/[slug]/settings/team',
  '/app/o/[slug]/team',
] as const;

const REMOVED_ARCHIVED_PAGE_FILES = [
  '/about',
  '/careers',
  '/contact',
  '/manifesto',
  '/support',
  '/accessibility',
  '/fairness',
  '/docs/expertise-atlas',
  '/p/[token]',
  '/p/[token]/embed',
  '/verify-skill',
  '/app/i/expertise',
  '/app/i/projects',
  '/app/i/projects/[id]',
  '/app/i/skill-gaps',
  '/app/i/zen',
  '/app/i/notifications',
  '/app/i/matching/snoozed',
  '/app/i/settings/fairness',
  '/app/i/settings/notifications',
  '/app/i/settings/integrations',
  '/app/o/[slug]/analytics/fairness',
  '/app/o/[slug]/candidates',
  '/app/o/[slug]/culture',
  '/app/o/[slug]/goals',
  '/app/o/[slug]/impact',
  '/app/o/[slug]/members',
  '/app/o/[slug]/opportunities',
  '/app/o/[slug]/partnerships',
  '/app/o/[slug]/projects',
  '/app/o/[slug]/structure',
  '/app/o/[slug]/settings/goals',
  '/app/o/[slug]/settings/integrations',
  '/app/o/[slug]/settings/profile',
  '/app/o/[slug]/team/coverage',
  '/o/[slug]/assignments/new',
] as const;

async function collectPagePaths(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const routes: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      routes.push(...(await collectPagePaths(absolutePath)));
      continue;
    }

    if (!entry.isFile() || entry.name !== 'page.tsx') {
      continue;
    }

    const relativePath = path.relative(PAGE_ROOT, absolutePath).replace(/\\/g, '/');
    const withoutFilename = relativePath.replace(/\/?page\.tsx$/, '');
    const routeSegments = withoutFilename
      .split('/')
      .filter(Boolean)
      .filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')));
    const routePath = `/${routeSegments.join('/')}`.replace(/\/index$/, '');
    routes.push(routePath === '/page.tsx' ? '/' : routePath);
  }

  return routes.sort();
}

async function collectRouteHandlerPaths(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const routes: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      routes.push(...(await collectRouteHandlerPaths(absolutePath)));
      continue;
    }

    if (!entry.isFile() || entry.name !== 'route.ts' || absolutePath.includes('/src/app/api/')) {
      continue;
    }

    const relativePath = path.relative(PAGE_ROOT, absolutePath).replace(/\\/g, '/');
    const withoutFilename = relativePath.replace(/\/route\.ts$/, '');
    const routeSegments = withoutFilename
      .split('/')
      .filter(Boolean)
      .filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')));
    routes.push(`/${routeSegments.join('/')}`);
  }

  return routes.sort();
}

describe('launch page inventory', () => {
  it('keeps the retained MVP page corridor explicitly active', async () => {
    const pages = await collectPagePaths(PAGE_ROOT);

    for (const page of REQUIRED_ACTIVE_PAGES) {
      expect(pages).toContain(page);
      expect(classifyLaunchPagePath(page)).toBe('active_launch_path');
    }
  });

  it('keeps internal ops pages inside the narrow launch-only admin corridor', async () => {
    const pages = await collectPagePaths(PAGE_ROOT);

    for (const page of REQUIRED_INTERNAL_ONLY_PAGES) {
      expect(pages).toContain(page);
      expect(classifyLaunchPagePath(page)).toBe('internal_only_launch_ops');
    }
  });

  it('keeps non-API route handlers inside explicit launch-surface policy', async () => {
    const routeHandlers = await collectRouteHandlerPaths(PAGE_ROOT);
    const explicitRouteHandlers = new Set<string>([
      ...REQUIRED_ACTIVE_ROUTE_HANDLERS,
      ...ALLOWED_ARCHIVED_ROUTE_HANDLERS,
    ]);

    for (const route of REQUIRED_ACTIVE_ROUTE_HANDLERS) {
      expect(routeHandlers).toContain(route);
      expect(classifyLaunchPagePath(route)).toBe('active_launch_path');
    }

    for (const route of ALLOWED_ARCHIVED_ROUTE_HANDLERS) {
      expect(routeHandlers).toContain(route);
      expect(classifyLaunchPagePath(route)).toBe('archived');
    }

    expect(routeHandlers.filter((route) => !explicitRouteHandlers.has(route))).toEqual([]);
  });

  it('keeps underbuilt-but-named surfaces hard-gated and out of the compiled launch surface', async () => {
    const pages = await collectPagePaths(PAGE_ROOT);

    for (const page of REQUIRED_HARD_GATED_PAGES) {
      expect(pages).not.toContain(page);
      expect(classifyLaunchPagePath(page)).toBe('gated_non_mvp');
    }
  });

  it('removes archived page handlers from the compiled launch surface', async () => {
    const pages = await collectPagePaths(PAGE_ROOT);

    for (const page of REMOVED_ARCHIVED_PAGE_FILES) {
      expect(pages).not.toContain(page);
    }
  });

  it('keeps every compiled page inside the explicit launch or internal-only corridor', async () => {
    const pages = await collectPagePaths(PAGE_ROOT);

    for (const page of pages) {
      expect(['active_launch_path', 'internal_only_launch_ops']).toContain(
        classifyLaunchPagePath(page)
      );
    }
  });
});
