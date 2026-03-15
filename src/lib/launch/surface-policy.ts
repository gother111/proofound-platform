export type LaunchSurfaceClassification =
  | 'active_launch_path'
  | 'internal_only_launch_ops'
  | 'gated_non_mvp'
  | 'archived';

type ApiSurfacePolicy = {
  classification: Extract<LaunchSurfaceClassification, 'internal_only_launch_ops' | 'archived'>;
  surfaceLabel: string;
  detail: string;
  matches: (pathname: string) => boolean;
};

export const INTERNAL_OPS_APP_PATHS = ['/admin', '/admin/verification', '/admin/audit'] as const;

export const INTERNAL_OPS_HREF = '/admin';
export const INTERNAL_OPS_VERIFICATION_HREF = '/admin/verification';
export const INTERNAL_OPS_AUDIT_HREF = '/admin/audit';

const matchExact =
  (path: string) =>
  (pathname: string): boolean =>
    pathname === path;

const matchPrefix =
  (prefix: string) =>
  (pathname: string): boolean =>
    pathname.startsWith(prefix);

const matchPattern =
  (pattern: RegExp) =>
  (pathname: string): boolean =>
    pattern.test(pathname);

const INTERNAL_ONLY_API_POLICIES = [
  {
    classification: 'internal_only_launch_ops',
    surfaceLabel: 'Admin API',
    detail: 'This admin route stays available only for launch-critical internal ops.',
    matches: matchExact('/api/admin/audit'),
  },
  {
    classification: 'internal_only_launch_ops',
    surfaceLabel: 'Admin API',
    detail: 'This admin route stays available only for launch-critical internal ops.',
    matches: matchExact('/api/admin/moderation/action'),
  },
  {
    classification: 'internal_only_launch_ops',
    surfaceLabel: 'Admin API',
    detail: 'This admin route stays available only for launch-critical internal ops.',
    matches: matchExact('/api/admin/moderation/queue'),
  },
  {
    classification: 'internal_only_launch_ops',
    surfaceLabel: 'Admin API',
    detail: 'This admin route stays available only for launch-critical internal ops.',
    matches: matchExact('/api/admin/verification/linkedin/queue'),
  },
  {
    classification: 'internal_only_launch_ops',
    surfaceLabel: 'Admin API',
    detail: 'This admin route stays available only for launch-critical internal ops.',
    matches: matchPattern(/^\/api\/admin\/verification\/linkedin\/[^/]+\/review$/),
  },
  {
    classification: 'internal_only_launch_ops',
    surfaceLabel: 'Admin API',
    detail: 'This admin route stays available only for launch-critical internal ops.',
    matches: matchPattern(/^\/api\/admin\/organizations\/[^/]+\/audit$/),
  },
  {
    classification: 'internal_only_launch_ops',
    surfaceLabel: 'Admin API',
    detail: 'This admin route stays available only for launch-critical internal ops.',
    matches: matchPattern(/^\/api\/admin\/organizations\/[^/]+\/verify$/),
  },
] as const satisfies readonly ApiSurfacePolicy[];

const ARCHIVED_API_POLICIES = [
  {
    classification: 'archived',
    surfaceLabel: 'Mobile API',
    detail: 'This API family is retired for the locked launch MVP.',
    matches: matchPrefix('/api/mobile/'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Wellbeing API',
    detail: 'This API family is retired for the locked launch MVP.',
    matches: matchPrefix('/api/wellbeing/'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Admin API',
    detail: 'This admin surface is archived outside the locked launch MVP.',
    matches: matchPrefix('/api/admin/'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Admin API',
    detail: 'This admin surface is archived outside the locked launch MVP.',
    matches: matchExact('/api/admin'),
  },
] as const satisfies readonly ApiSurfacePolicy[];

export const LAUNCH_API_SURFACE_POLICIES = [
  ...INTERNAL_ONLY_API_POLICIES,
  ...ARCHIVED_API_POLICIES,
] as const;

function getLaunchApiPolicy(pathname: string): ApiSurfacePolicy | null {
  return LAUNCH_API_SURFACE_POLICIES.find((policy) => policy.matches(pathname)) ?? null;
}

export function getArchivedApiPolicy(pathname: string): {
  surfaceLabel: string;
  detail: string;
} | null {
  const policy = getLaunchApiPolicy(pathname);
  if (!policy || policy.classification !== 'archived') {
    return null;
  }

  return {
    surfaceLabel: policy.surfaceLabel,
    detail: policy.detail,
  };
}

export function classifyLaunchApiPath(pathname: string): LaunchSurfaceClassification {
  return getLaunchApiPolicy(pathname)?.classification ?? 'active_launch_path';
}
