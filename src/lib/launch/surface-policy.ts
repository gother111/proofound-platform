export type LaunchSurfaceClassification =
  | 'active_launch_path'
  | 'internal_only_launch_ops'
  | 'gated_non_mvp'
  | 'archived';

export const INTERNAL_OPS_APP_PATHS = ['/admin', '/admin/verification', '/admin/audit'] as const;

export const INTERNAL_OPS_HREF = '/admin';
export const INTERNAL_OPS_VERIFICATION_HREF = '/admin/verification';
export const INTERNAL_OPS_AUDIT_HREF = '/admin/audit';

const ARCHIVED_API_PREFIXES = [
  {
    prefix: '/api/wellbeing/',
    surfaceLabel: 'Wellbeing API',
    detail: 'This API family is retired for the locked launch MVP.',
  },
  {
    prefix: '/api/mobile/',
    surfaceLabel: 'Mobile API',
    detail: 'This API family is retired for the locked launch MVP.',
  },
] as const;

const INTERNAL_ADMIN_API_EXACT_PATHS = new Set([
  '/api/admin/audit',
  '/api/admin/feature-flags',
  '/api/admin/metrics/rollout',
  '/api/admin/moderation/action',
  '/api/admin/moderation/queue',
  '/api/admin/verification/linkedin/queue',
]);

const INTERNAL_ADMIN_API_PREFIXES = [
  '/api/admin/feature-flags/',
  '/api/admin/verification/linkedin/',
] as const;

const INTERNAL_ADMIN_API_PATTERNS = [
  /^\/api\/admin\/organizations\/[^/]+\/audit$/,
  /^\/api\/admin\/organizations\/[^/]+\/verify$/,
] as const;

export function getArchivedApiPolicy(pathname: string): {
  surfaceLabel: string;
  detail: string;
} | null {
  for (const policy of ARCHIVED_API_PREFIXES) {
    if (pathname.startsWith(policy.prefix)) {
      return {
        surfaceLabel: policy.surfaceLabel,
        detail: policy.detail,
      };
    }
  }

  if (pathname === '/api/admin' || pathname.startsWith('/api/admin/')) {
    if (INTERNAL_ADMIN_API_EXACT_PATHS.has(pathname)) {
      return null;
    }

    if (INTERNAL_ADMIN_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      return null;
    }

    if (INTERNAL_ADMIN_API_PATTERNS.some((pattern) => pattern.test(pathname))) {
      return null;
    }

    return {
      surfaceLabel: 'Admin API',
      detail: 'This admin surface is archived outside the locked launch MVP.',
    };
  }

  return null;
}

export function classifyLaunchApiPath(pathname: string): LaunchSurfaceClassification {
  const archived = getArchivedApiPolicy(pathname);
  if (archived) {
    return 'archived';
  }

  if (
    pathname === '/api/admin' ||
    pathname.startsWith('/api/admin/') ||
    pathname.startsWith('/api/mobile/') ||
    pathname.startsWith('/api/wellbeing/')
  ) {
    return 'internal_only_launch_ops';
  }

  return 'active_launch_path';
}
