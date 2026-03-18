export type LaunchSurfaceClassification =
  | 'active_launch_path'
  | 'internal_only_launch_ops'
  | 'gated_non_mvp'
  | 'archived';

type ApiSurfacePolicy = {
  classification: Extract<
    LaunchSurfaceClassification,
    'active_launch_path' | 'internal_only_launch_ops' | 'archived'
  >;
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

export const ACTIVE_LAUNCH_EXACT_API_PATHS = [
  ...ACTIVE_LAUNCH_ANALYTICS_API_PATHS,
  '/api/csrf-token',
  '/api/data-export',
  '/api/feature-flags',
  '/api/health',
  '/api/individual/readiness',
  '/api/integrations/google/connect',
  '/api/integrations/google/callback',
  '/api/monitoring/launch-status',
  '/api/monitoring/perf-status',
  '/api/org/readiness',
  '/api/performance/track',
  '/api/verification/linkedin/initiate',
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

const ACTIVE_LAUNCH_EXACT_API_PATH_SET = new Set<string>(ACTIVE_LAUNCH_EXACT_API_PATHS);
const ARCHIVED_ORG_REVIEW_SUBROUTES = /^\/api\/org\/[^/]+\/(?:dashboard|coverage)(?:\/.*)?$/;
const RESERVED_ORGANIZATION_DETAIL_PATHS = new Set(['evidence-pack']);

const ACTIVE_API_POLICIES = [
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Launch Analytics API',
    detail: 'This telemetry endpoint remains in the locked launch MVP corridor.',
    matches: (pathname: string) => ACTIVE_LAUNCH_EXACT_API_PATH_SET.has(pathname),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Assignments API',
    detail: 'Assignment drafting, publishing, invites, and review remain launch-binding.',
    matches: matchExactOrPrefix('/api/assignments'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Auth API',
    detail: 'Authentication and compatibility callbacks remain launch-safe support surfaces.',
    matches: matchExactOrPrefix('/api/auth'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Candidate Invites API',
    detail: 'Candidate invite flows remain part of the launch hiring corridor.',
    matches: matchExactOrPrefix('/api/candidate-invites'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Conversations API',
    detail: 'Conversation, reveal, and messaging flows remain part of the launch hiring corridor.',
    matches: matchExactOrPrefix('/api/conversations'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Core Matching API',
    detail: 'Core matching computation remains active for the launch corridor.',
    matches: matchExactOrPrefix('/api/core'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Decisions API',
    detail: 'Interview and decision lifecycle routes remain active for the launch corridor.',
    matches: matchExactOrPrefix('/api/decisions'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Engagement Verification API',
    detail: 'Post-decision engagement verification remains active for the launch corridor.',
    matches: matchExactOrPrefix('/api/engagement-verifications'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Feedback API',
    detail: 'Interview feedback and workflow feedback remain active for launch.',
    matches: matchExactOrPrefix('/api/feedback'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Interview Integration API',
    detail: 'Interview video integrations remain active for the launch interview corridor.',
    matches: matchExactOrPrefix('/api/integrations/video'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Interview Integration API',
    detail: 'Interview video integrations remain active for the launch interview corridor.',
    matches: matchExactOrPrefix('/api/integrations/google'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Interviews API',
    detail: 'Interview scheduling and lifecycle routes remain active for launch.',
    matches: matchExactOrPrefix('/api/interviews'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Location API',
    detail: 'Location autocomplete remains active for launch profile and assignment forms.',
    matches: matchExactOrPrefix('/api/location'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Match API',
    detail: 'Match browsing, explainability, and profile flows remain active for launch.',
    matches: matchExactOrPrefix('/api/match'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Matches API',
    detail: 'Match state routes remain active for launch.',
    matches: matchExactOrPrefix('/api/matches'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Matching Profile API',
    detail: 'Matching profile routes remain active for launch.',
    matches: matchExactOrPrefix('/api/matching-profile'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Messages API',
    detail: 'Direct message routes remain active for the launch corridor.',
    matches: matchExactOrPrefix('/api/messages'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Notifications API',
    detail: 'Workflow notifications remain active for launch.',
    matches: matchExactOrPrefix('/api/notifications'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Organization Review API',
    detail: 'Shortlist and review routes remain active for the launch hiring corridor.',
    matches: (pathname: string) =>
      matchExactOrPrefix('/api/org')(pathname) && !ARCHIVED_ORG_REVIEW_SUBROUTES.test(pathname),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Organization API',
    detail: 'Organization trust profile and launch assignment management remain active.',
    matches: matchExact('/api/organizations'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Organization API',
    detail: 'Organization trust profile and launch assignment management remain active.',
    matches: (pathname: string) => {
      const match = pathname.match(/^\/api\/organizations\/([^/]+)$/);
      return Boolean(match && !RESERVED_ORGANIZATION_DETAIL_PATHS.has(match[1]!));
    },
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Organization API',
    detail: 'Organization launch assignment management remains active.',
    matches: matchPattern(/^\/api\/organizations\/[^/]+\/assignments(?:\/.*)?$/),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Organization API',
    detail: 'Candidate invite management remains active for the launch hiring corridor.',
    matches: matchPattern(/^\/api\/organizations\/[^/]+\/candidate-invites(?:\/.*)?$/),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Organization API',
    detail: 'Team membership management remains active for the launch hiring corridor.',
    matches: matchPattern(/^\/api\/organizations\/[^/]+\/team(?:\/.*)?$/),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Organization Visibility API',
    detail: 'Public trust-page visibility controls remain active for launch.',
    matches: matchPattern(/^\/api\/organizations\/[^/]+\/visibility$/),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Portfolio API',
    detail: 'Portfolio and public trust routes remain active for launch.',
    matches: matchExactOrPrefix('/api/portfolio'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Policy API',
    detail: 'Policy routes remain active for launch.',
    matches: matchExactOrPrefix('/api/policy'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Profile API',
    detail: 'Profile and privacy routes remain active for launch.',
    matches: matchExactOrPrefix('/api/profile'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Profiles API',
    detail: 'Profile lookup routes remain active for launch.',
    matches: matchExactOrPrefix('/api/profiles'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Surveys API',
    detail: 'Operational surveys remain active for launch.',
    matches: matchExactOrPrefix('/api/surveys'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Upload API',
    detail: 'Upload and document privacy routes remain active for launch.',
    matches: matchExactOrPrefix('/api/upload'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'User API',
    detail: 'Account, settings, privacy, export, and delete routes remain active for launch.',
    matches: matchExactOrPrefix('/api/user'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Verification API',
    detail: 'Canonical verification and trust routes remain active for launch.',
    matches: (pathname: string) =>
      matchExactOrPrefix('/api/verification')(pathname) &&
      !matchExactOrPrefix('/api/verification/skill')(pathname),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Verification API',
    detail: 'Canonical verification and trust routes remain active for launch.',
    matches: matchExactOrPrefix('/api/verify'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Assignment Expertise API',
    detail: 'Assignment drafting expertise support remains active for launch.',
    matches: matchExact('/api/expertise/taxonomy'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Assignment Expertise API',
    detail: 'Assignment drafting expertise support remains active for launch.',
    matches: matchExact('/api/expertise/jd-to-l4'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Portfolio Skill Tagging API',
    detail: 'Portfolio proof-to-skill tagging remains active inside the launch proof corridor.',
    matches: (pathname: string) =>
      matchExactOrPrefix('/api/expertise/user-skills')(pathname) &&
      !matchPattern(/^\/api\/expertise\/user-skills\/[^/]+\/verification-request$/)(pathname),
  },
] as const satisfies readonly ApiSurfacePolicy[];

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
  {
    classification: 'internal_only_launch_ops',
    surfaceLabel: 'Launch Ops API',
    detail: 'This cron route stays available only for launch monitoring and operational safety.',
    matches: matchExact('/api/cron/account-deletion-workflow'),
  },
  {
    classification: 'internal_only_launch_ops',
    surfaceLabel: 'Launch Ops API',
    detail: 'This cron route stays available only for launch monitoring and operational safety.',
    matches: matchExact('/api/cron/decision-reminders'),
  },
  {
    classification: 'internal_only_launch_ops',
    surfaceLabel: 'Launch Ops API',
    detail: 'This cron route stays available only for launch monitoring and operational safety.',
    matches: matchExact('/api/cron/health-check'),
  },
  {
    classification: 'internal_only_launch_ops',
    surfaceLabel: 'Launch Ops API',
    detail: 'This cron route stays available only for launch monitoring and operational safety.',
    matches: matchExact('/api/cron/launch-synthetic-checks'),
  },
  {
    classification: 'internal_only_launch_ops',
    surfaceLabel: 'Launch Ops API',
    detail: 'This cron route stays available only for launch monitoring and operational safety.',
    matches: matchExact('/api/cron/performance-check'),
  },
  {
    classification: 'internal_only_launch_ops',
    surfaceLabel: 'Launch Ops API',
    detail: 'This cron route stays available only for launch monitoring and operational safety.',
    matches: matchExact('/api/cron/process-deletions'),
  },
  {
    classification: 'internal_only_launch_ops',
    surfaceLabel: 'Launch Ops API',
    detail: 'This cron route stays available only for launch monitoring and operational safety.',
    matches: matchExact('/api/cron/refresh-matches'),
  },
  {
    classification: 'internal_only_launch_ops',
    surfaceLabel: 'Launch Ops API',
    detail: 'This cron route stays available only for launch monitoring and operational safety.',
    matches: matchExact('/api/cron/refresh-matches-worker'),
  },
  {
    classification: 'internal_only_launch_ops',
    surfaceLabel: 'Launch Ops API',
    detail: 'This cron route stays available only for launch monitoring and operational safety.',
    matches: matchExact('/api/cron/send-deletion-reminders'),
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
    surfaceLabel: 'Analytics API',
    detail: 'Broad analytics surfaces are archived outside the locked launch MVP.',
    matches: (pathname: string) =>
      pathname.startsWith('/api/analytics/') && !ACTIVE_LAUNCH_EXACT_API_PATH_SET.has(pathname),
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
    surfaceLabel: 'Contracts API',
    detail:
      'Contract-signing and contract record surfaces are archived outside the locked launch MVP.',
    matches: matchExactOrPrefix('/api/contracts'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Projects API',
    detail: 'Project library surfaces are archived outside the locked launch MVP.',
    matches: matchExactOrPrefix('/api/projects'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Skill Gap API',
    detail: 'Skill-gap dashboards are archived outside the locked launch MVP.',
    matches: matchExactOrPrefix('/api/skill-gaps'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Interview Integration API',
    detail: 'Zoom provider routes are archived outside the locked launch MVP.',
    matches: matchExactOrPrefix('/api/integrations/zoom'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Integrations API',
    detail: 'Broad integration surfaces are archived outside the locked launch MVP.',
    matches: matchExact('/api/integrations'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Integrations API',
    detail: 'Broad integration surfaces are archived outside the locked launch MVP.',
    matches: matchPattern(/^\/api\/integrations\/[^/]+\/(?:connect|disconnect)$/),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Legacy Expertise API',
    detail: 'Individual expertise and import surfaces are archived outside the locked launch MVP.',
    matches: matchExact('/api/expertise/profile'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Legacy Expertise API',
    detail: 'Individual expertise and import surfaces are archived outside the locked launch MVP.',
    matches: matchExact('/api/expertise/auto-suggest'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Legacy Expertise API',
    detail: 'Individual expertise and import surfaces are archived outside the locked launch MVP.',
    matches: matchExact('/api/expertise/gap-analysis'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Legacy Expertise API',
    detail: 'Individual expertise and import surfaces are archived outside the locked launch MVP.',
    matches: matchExact('/api/expertise/stats'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Legacy Expertise API',
    detail: 'Individual expertise and import surfaces are archived outside the locked launch MVP.',
    matches: matchPrefix('/api/expertise/cv-import/'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Legacy Expertise API',
    detail: 'Individual expertise and import surfaces are archived outside the locked launch MVP.',
    matches: matchExact('/api/expertise/linkedin-import'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Legacy Expertise API',
    detail: 'Individual expertise and import surfaces are archived outside the locked launch MVP.',
    matches: matchExact('/api/expertise/linkedin-status'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Legacy Expertise API',
    detail: 'Individual expertise and import surfaces are archived outside the locked launch MVP.',
    matches: matchExact('/api/expertise/linkedin-disconnect'),
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
    detail: 'Organization project-library surfaces are archived outside the locked launch MVP.',
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
    surfaceLabel: 'Organization Suite API',
    detail: 'Organization causes editing is archived outside the locked launch MVP.',
    matches: matchPattern(/^\/api\/organizations\/[^/]+\/causes$/),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Organization Suite API',
    detail: 'Organization goals are archived outside the locked launch MVP.',
    matches: matchPattern(/^\/api\/organizations\/[^/]+\/goals(?:\/.*)?$/),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Organization Suite API',
    detail: 'Organization ownership surfaces are archived outside the locked launch MVP.',
    matches: matchPattern(/^\/api\/organizations\/[^/]+\/ownership(?:\/.*)?$/),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Organization Suite API',
    detail: 'Organization partnerships are archived outside the locked launch MVP.',
    matches: matchPattern(/^\/api\/organizations\/[^/]+\/partnerships(?:\/.*)?$/),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Organization Suite API',
    detail: 'Organization test-match tooling is archived outside the locked launch MVP.',
    matches: matchPattern(/^\/api\/organizations\/[^/]+\/test-matches(?:\/.*)?$/),
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
    surfaceLabel: 'Launch Ops API',
    detail: 'This cron route is archived outside the locked launch MVP.',
    matches: matchExactOrPrefix('/api/cron'),
  },
] as const satisfies readonly ApiSurfacePolicy[];

export const LAUNCH_API_SURFACE_POLICIES = [
  ...INTERNAL_ONLY_API_POLICIES,
  ...ACTIVE_API_POLICIES,
  ...ARCHIVED_API_POLICIES,
] as const;

function getPolicyByClassification(
  pathname: string,
  classification: Extract<
    LaunchSurfaceClassification,
    'active_launch_path' | 'internal_only_launch_ops' | 'archived'
  >
): ApiSurfacePolicy | null {
  return (
    LAUNCH_API_SURFACE_POLICIES.find(
      (policy) => policy.classification === classification && policy.matches(pathname)
    ) ?? null
  );
}

function getFallbackArchivedApiPolicy(pathname: string): ApiSurfacePolicy {
  const family = pathname.split('/')[2] || 'api';
  return {
    classification: 'archived',
    surfaceLabel: 'Archived API',
    detail: `/${family} is outside the locked launch MVP corridor and is served only as an archived compatibility surface.`,
    matches: () => true,
  };
}

export function getArchivedApiPolicy(pathname: string): {
  surfaceLabel: string;
  detail: string;
} | null {
  if (getPolicyByClassification(pathname, 'internal_only_launch_ops')) {
    return null;
  }

  if (getPolicyByClassification(pathname, 'active_launch_path')) {
    return null;
  }

  const policy =
    getPolicyByClassification(pathname, 'archived') ?? getFallbackArchivedApiPolicy(pathname);

  return {
    surfaceLabel: policy.surfaceLabel,
    detail: policy.detail,
  };
}

export function classifyLaunchApiPath(pathname: string): LaunchSurfaceClassification {
  if (getPolicyByClassification(pathname, 'internal_only_launch_ops')) {
    return 'internal_only_launch_ops';
  }

  if (getPolicyByClassification(pathname, 'active_launch_path')) {
    return 'active_launch_path';
  }

  return 'archived';
}
