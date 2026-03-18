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
export const ACTIVE_LAUNCH_ANALYTICS_API_PATHS = [
  '/api/analytics/events',
  '/api/analytics/track',
  '/api/analytics/tour-event',
  '/api/analytics/web-vitals',
] as const;

const matchExact =
  (path: string) =>
  (pathname: string): boolean =>
    pathname === path;

const matchExactOrPrefix =
  (path: string) =>
  (pathname: string): boolean =>
    pathname === path || pathname.startsWith(`${path}/`);

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

const ACTIVE_LAUNCH_ANALYTICS_API_PATH_SET = new Set<string>(ACTIVE_LAUNCH_ANALYTICS_API_PATHS);

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
    surfaceLabel: 'Analytics API',
    detail: 'Broad analytics surfaces are archived outside the locked launch MVP.',
    matches: (pathname: string) =>
      pathname.startsWith('/api/analytics/') && !ACTIVE_LAUNCH_ANALYTICS_API_PATH_SET.has(pathname),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Dashboard API',
    detail:
      'Dashboard customization and aggregate dashboard surfaces are archived outside the locked launch MVP.',
    matches: matchExactOrPrefix('/api/dashboard'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Momentum API',
    detail: 'Momentum summary surfaces are archived outside the locked launch MVP.',
    matches: matchExactOrPrefix('/api/momentum'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Impact API',
    detail: 'Legacy impact snapshot surfaces are archived outside the locked launch MVP.',
    matches: matchExactOrPrefix('/api/impact'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Metrics API',
    detail: 'Broad metrics dashboards are archived outside the locked launch MVP.',
    matches: matchExactOrPrefix('/api/metrics'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Organization Dashboard API',
    detail: 'Legacy organization dashboard aggregates are archived outside the locked launch MVP.',
    matches: matchPattern(/^\/api\/org\/[^/]+\/dashboard(?:\/.*)?$/),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Organization Coverage API',
    detail: 'Team coverage analytics are archived outside the locked launch MVP.',
    matches: matchPattern(/^\/api\/org\/[^/]+\/coverage(?:\/.*)?$/),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Organization Suite API',
    detail: 'Organization culture surfaces are archived outside the locked launch MVP.',
    matches: matchPattern(/^\/api\/organizations\/[^/]+\/culture(?:\/.*)?$/),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Organization Suite API',
    detail: 'Organization impact surfaces are archived outside the locked launch MVP.',
    matches: matchPattern(/^\/api\/organizations\/[^/]+\/impact(?:\/.*)?$/),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Organization Suite API',
    detail: 'Organization projects surfaces are archived outside the locked launch MVP.',
    matches: matchPattern(/^\/api\/organizations\/[^/]+\/projects(?:\/.*)?$/),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Organization Suite API',
    detail: 'Organization structure surfaces are archived outside the locked launch MVP.',
    matches: matchPattern(/^\/api\/organizations\/[^/]+\/structure(?:\/.*)?$/),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Assignment Templates API',
    detail: 'Assignment template libraries are archived outside the locked launch MVP.',
    matches: matchExactOrPrefix('/api/assignment-templates'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Goals API',
    detail: 'Goal tracking is archived outside the locked launch MVP.',
    matches: matchExactOrPrefix('/api/goals'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Evidence Pack API',
    detail: 'Evidence-pack exports are archived outside the locked launch MVP.',
    matches: matchExactOrPrefix('/api/evidence-pack'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Evidence Pack API',
    detail: 'Organization evidence-pack exports are archived outside the locked launch MVP.',
    matches: matchExactOrPrefix('/api/organizations/evidence-pack'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Evidence Pack API',
    detail: 'Organization evidence-pack exports are archived outside the locked launch MVP.',
    matches: matchPattern(/^\/api\/organizations\/[^/]+\/evidence-pack(?:\/.*)?$/),
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
  {
    classification: 'archived',
    surfaceLabel: 'Legacy Verification API',
    detail: 'This legacy verification transport is archived outside the locked launch MVP.',
    matches: matchPattern(/^\/api\/expertise\/user-skills\/[^/]+\/verification-request$/),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Legacy Verification API',
    detail: 'This legacy verification transport is archived outside the locked launch MVP.',
    matches: matchPrefix('/api/expertise/verification/'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Legacy Verification API',
    detail: 'This legacy verification transport is archived outside the locked launch MVP.',
    matches: matchPrefix('/api/expertise/verifications/'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Legacy Verification API',
    detail: 'This legacy verification transport is archived outside the locked launch MVP.',
    matches: matchExact('/api/verification/skill/request'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Legacy Verification API',
    detail: 'This legacy verification transport is archived outside the locked launch MVP.',
    matches: matchExact('/api/verification/skill/respond'),
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
