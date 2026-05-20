export type LaunchSurfaceClassification =
  | 'active_launch_path'
  | 'internal_only_launch_ops'
  | 'gated_non_mvp'
  | 'archived';

type SurfacePolicy = {
  classification: Extract<
    LaunchSurfaceClassification,
    'active_launch_path' | 'internal_only_launch_ops' | 'gated_non_mvp' | 'archived'
  >;
  surfaceLabel: string;
  detail: string;
  matches: (pathname: string) => boolean;
};

export const INTERNAL_OPS_APP_PATHS = ['/admin', '/admin/verification', '/admin/audit'] as const;

export const INTERNAL_OPS_HREF = '/admin';
export const INTERNAL_OPS_VERIFICATION_HREF = '/admin/verification';
export const INTERNAL_OPS_AUDIT_HREF = '/admin/audit';

const ACTIVE_LAUNCH_EXACT_API_PATHS = [
  '/api/csrf-token',
  '/api/feature-flags',
  '/api/health',
  '/api/individual/readiness',
  '/api/location/autocomplete',
  '/api/org/readiness',
  '/api/verification/status',
  '/api/verification/work-email/send',
  '/api/verification/work-email/verify',
] as const;

const ACTIVE_LAUNCH_EXACT_API_PATH_SET = new Set<string>(ACTIVE_LAUNCH_EXACT_API_PATHS);

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

const normalizePathname = (pathname: string): string => {
  if (!pathname) return '/';
  if (pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
};

const ACTIVE_API_POLICIES = [
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Launch Support API',
    detail:
      'This telemetry, health, or launch support endpoint remains in the locked MVP corridor.',
    matches: (pathname: string) => ACTIVE_LAUNCH_EXACT_API_PATH_SET.has(pathname),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Assistive AI API',
    detail:
      'Button-click assistive AI routes remain active only for proof clarity, assignment clarity, verification composition, privacy preflight, and suggestion audit events.',
    matches: (pathname: string) =>
      pathname === '/api/ai/proof-pack/suggest' ||
      pathname === '/api/ai/suggestions/events' ||
      pathname === '/api/ai/assignments/clarify' ||
      pathname === '/api/ai/verifications/compose' ||
      pathname === '/api/ai/privacy-preflight/check',
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Start from CV Beta API',
    detail:
      'Start from CV routes remain hard-gated to approved guest first-proof private scaffolding, never profile-first import, employer CV parsing, or candidate evaluation.',
    matches: (pathname: string) => matchExactOrPrefix('/api/ai/start-from-cv')(pathname),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Proof Artifact OCR Beta API',
    detail:
      'Invite-only Proof Artifact OCR routes remain active only for draft text extraction on user-owned proof artifacts.',
    matches: (pathname: string) => matchExactOrPrefix('/api/proof-artifacts')(pathname),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Assignments API',
    detail: 'Assignment drafting, publishing, and review remain inside the locked launch corridor.',
    matches: (pathname: string) =>
      matchExactOrPrefix('/api/assignments')(pathname) &&
      !matchExactOrPrefix('/api/assignments/invite')(pathname),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Candidate Invite API',
    detail: 'Candidate invite and claim flows remain active in the launch corridor.',
    matches: matchExactOrPrefix('/api/candidate-invites'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Conversations API',
    detail: 'Conversation, reveal, and messaging flows remain active in the launch corridor.',
    matches: matchExactOrPrefix('/api/conversations'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Decisions API',
    detail: 'Decision and interview outcome routes remain active in the launch corridor.',
    matches: matchExactOrPrefix('/api/decisions'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Engagement Verification API',
    detail: 'Post-decision engagement verification remains active in the launch corridor.',
    matches: matchExactOrPrefix('/api/engagement-verifications'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Feedback API',
    detail: 'Only launch-critical interview feedback routes remain active.',
    matches: (pathname: string) =>
      pathname === '/api/feedback/submit' ||
      (pathname !== '/api/feedback/why-not-shortlisted' &&
        pathname !== '/api/feedback/sus' &&
        /^\/api\/feedback\/[^/]+$/.test(pathname)) ||
      /^\/api\/feedback\/token\/[^/]+$/.test(pathname),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Interviews API',
    detail: 'Interview scheduling and lifecycle routes remain active in the launch corridor.',
    matches: matchExactOrPrefix('/api/interviews'),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Matching API',
    detail: 'The narrow matching corridor remains active for proof-first review.',
    matches: (pathname: string) =>
      pathname === '/api/matching-profile' ||
      pathname === '/api/match/assignment' ||
      pathname === '/api/match/gates' ||
      pathname === '/api/match/hide' ||
      pathname === '/api/match/interest' ||
      pathname === '/api/match/profile' ||
      pathname === '/api/match/snoozed' ||
      /^\/api\/match\/explain\/[^/]+$/.test(pathname) ||
      /^\/api\/match\/visible-fields\/[^/]+$/.test(pathname) ||
      /^\/api\/matches\/[^/]+\/snooze$/.test(pathname),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Organization Review API',
    detail: 'The narrow organization shortlist and review corridor remains active for launch.',
    matches: (pathname: string) =>
      /^\/api\/org\/[^/]+\/shortlist(?:\/.*)?$/.test(pathname) ||
      /^\/api\/org\/[^/]+\/matches\/[^/]+\/review$/.test(pathname),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Organization API',
    detail:
      'Organization trust page, assignment, visibility, and team membership routes remain active for launch.',
    matches: (pathname: string) =>
      pathname === '/api/organizations' ||
      /^\/api\/organizations\/[^/]+$/.test(pathname) ||
      /^\/api\/organizations\/[^/]+\/assignments(?:\/.*)?$/.test(pathname) ||
      /^\/api\/organizations\/[^/]+\/candidate-invites(?:\/.*)?$/.test(pathname) ||
      /^\/api\/organizations\/[^/]+\/team(?:\/.*)?$/.test(pathname) ||
      /^\/api\/organizations\/[^/]+\/visibility$/.test(pathname),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Portfolio API',
    detail: 'Portfolio and public trust routes remain active for launch.',
    matches: (pathname: string) =>
      matchExactOrPrefix('/api/portfolio')(pathname) && pathname !== '/api/portfolio/view',
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Profile API',
    detail: 'Profile readiness and privacy routes remain active for launch.',
    matches: (pathname: string) =>
      pathname === '/api/profile' ||
      pathname === '/api/profile/privacy-settings' ||
      pathname === '/api/profile/visibility',
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
    detail: 'Account, privacy, export, and deletion basics remain active for launch.',
    matches: (pathname: string) =>
      pathname === '/api/user/account' ||
      pathname === '/api/user/audit-log' ||
      pathname === '/api/user/consent' ||
      pathname === '/api/user/consent/check' ||
      pathname === '/api/user/data-inventory' ||
      pathname === '/api/user/email' ||
      pathname === '/api/user/export' ||
      pathname === '/api/user/me' ||
      pathname === '/api/user/password' ||
      pathname === '/api/user/privacy-settings',
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Verification API',
    detail: 'Canonical verification and trust routes remain active for launch.',
    matches: (pathname: string) =>
      matchExactOrPrefix('/api/verification/requests')(pathname) ||
      matchExactOrPrefix('/api/verify')(pathname),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Assignment Expertise API',
    detail:
      'Assignment drafting, taxonomy lookup, and proof-linked skill tagging remain active inside the launch corridor.',
    matches: (pathname: string) =>
      pathname === '/api/expertise/jd-to-l4' ||
      pathname === '/api/expertise/taxonomy' ||
      matchExactOrPrefix('/api/expertise/user-skills')(pathname),
  },
] as const satisfies readonly SurfacePolicy[];

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
    matches: matchExactOrPrefix('/api/admin/internal-ops/queues'),
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
    matches: (pathname: string) =>
      pathname === '/api/cron/decision-reminders' ||
      pathname === '/api/cron/health-check' ||
      pathname === '/api/cron/launch-synthetic-checks' ||
      pathname === '/api/cron/performance-check' ||
      pathname === '/api/cron/refresh-matches' ||
      pathname === '/api/cron/refresh-matches-worker' ||
      pathname === '/api/cron/sla-enforcement',
  },
  {
    classification: 'internal_only_launch_ops',
    surfaceLabel: 'Launch Diagnostics API',
    detail: 'Launch readiness and performance diagnostics require internal launch-ops auth.',
    matches: (pathname: string) =>
      pathname === '/api/monitoring/health-diagnostics' ||
      pathname === '/api/monitoring/launch-status' ||
      pathname === '/api/monitoring/perf-status',
  },
  {
    classification: 'internal_only_launch_ops',
    surfaceLabel: 'Organization Audit API',
    detail:
      'This export route remains available only for authorized audit and launch evidence workflows.',
    matches: (pathname: string) => /^\/api\/organizations\/[^/]+\/audit\/export$/.test(pathname),
  },
] as const satisfies readonly SurfacePolicy[];

const matchesInternalOnlyApiPath = (pathname: string): boolean =>
  INTERNAL_ONLY_API_POLICIES.some((policy) => policy.matches(pathname));

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
    matches: matchExactOrPrefix('/api/analytics'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Performance API',
    detail: 'Client performance telemetry is archived outside the locked launch MVP corridor.',
    matches: matchExactOrPrefix('/api/performance'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Workflow Cron API',
    detail:
      'The standalone workflow queue cron is archived because launch processing now flows through retained internal cron routes.',
    matches: (pathname: string) =>
      pathname === '/api/cron/account-deletion-workflow' ||
      pathname === '/api/cron/process-deletions' ||
      pathname === '/api/cron/send-deletion-reminders' ||
      pathname === '/api/cron/workflow-jobs',
  },
  {
    classification: 'archived',
    surfaceLabel: 'Python Worker API',
    detail:
      'The orphaned Python worker and temp-cleanup cron surfaces are archived outside the locked launch MVP corridor.',
    matches: (pathname: string) =>
      pathname === '/api/cron/python-internal-worker' ||
      pathname === '/api/cron/cv-import-temp-cleanup' ||
      pathname === '/api/internal/python-jobs',
  },
  {
    classification: 'archived',
    surfaceLabel: 'Portfolio API',
    detail:
      'Owner-facing portfolio view counters are archived outside the locked launch MVP corridor.',
    matches: (pathname: string) => pathname === '/api/portfolio/view',
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
    surfaceLabel: 'Assignments API',
    detail: 'Stakeholder assignment invite flows are archived outside the locked launch MVP.',
    matches: matchExactOrPrefix('/api/assignments/invite'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Auth API',
    detail: 'Legacy OAuth compatibility routes are archived outside the locked launch MVP.',
    matches: (pathname: string) =>
      pathname === '/api/auth/google/callback' ||
      pathname === '/api/auth/linkedin' ||
      pathname === '/api/auth/linkedin/callback',
  },
  {
    classification: 'archived',
    surfaceLabel: 'Interview Integration API',
    detail: 'Interview-provider integrations are archived outside the locked launch MVP.',
    matches: (pathname: string) =>
      pathname === '/api/auth/zoom/callback' ||
      pathname.startsWith('/api/integrations/google/') ||
      pathname.startsWith('/api/integrations/video') ||
      pathname.startsWith('/api/integrations/zoom'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Integrations API',
    detail: 'Broad integration surfaces are archived outside the locked launch MVP.',
    matches: (pathname: string) =>
      pathname === '/api/integrations' ||
      /^\/api\/integrations\/[^/]+\/(?:connect|disconnect)$/.test(pathname),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Legacy Expertise API',
    detail: 'Broad expertise and import surfaces are archived outside the locked launch MVP.',
    matches: (pathname: string) =>
      pathname.startsWith('/api/expertise') &&
      !pathname.startsWith('/api/expertise/jd-to-l4') &&
      !pathname.startsWith('/api/expertise/taxonomy') &&
      !pathname.startsWith('/api/expertise/user-skills'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Legacy Verification API',
    detail: 'This legacy verification transport is archived outside the locked launch MVP.',
    matches: (pathname: string) =>
      /^\/api\/expertise\/user-skills\/[^/]+\/verification-request$/.test(pathname) ||
      pathname.startsWith('/api/expertise/verification/') ||
      pathname.startsWith('/api/expertise/verifications/') ||
      pathname === '/api/verification/linkedin/initiate' ||
      pathname === '/api/verification/skill/request' ||
      pathname === '/api/verification/skill/respond' ||
      pathname.startsWith('/api/verification/veriff/'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Core Matching API',
    detail: 'Broad matching internals outside the user-facing corridor are archived for launch.',
    matches: (pathname: string) =>
      pathname.startsWith('/api/core/') ||
      pathname === '/api/match/decision' ||
      pathname === '/api/match/snooze' ||
      pathname === '/api/match/test',
  },
  {
    classification: 'archived',
    surfaceLabel: 'Matching API',
    detail:
      'Legacy matching profile compatibility routes are archived in favor of /api/matching-profile.',
    matches: (pathname: string) =>
      pathname === '/api/matching/profile' || /^\/api\/matching\/profile\/[^/]+$/.test(pathname),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Messages API',
    detail:
      'Legacy message compatibility routes are archived in favor of canonical conversations routes.',
    matches: matchExactOrPrefix('/api/messages'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Notifications API',
    detail: 'Notification surfaces are archived outside the locked launch MVP corridor.',
    matches: matchExactOrPrefix('/api/notifications'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Moderation API',
    detail: 'Moderation surfaces are archived outside the locked launch MVP corridor.',
    matches: matchExactOrPrefix('/api/moderation'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Surveys API',
    detail:
      'Survey and SUS collection surfaces are archived outside the locked launch MVP corridor.',
    matches: (pathname: string) =>
      pathname.startsWith('/api/surveys') || pathname.startsWith('/api/feedback/sus'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Feedback API',
    detail:
      'Broad shortlist and survey feedback routes are archived outside the locked launch MVP corridor.',
    matches: (pathname: string) => pathname === '/api/feedback/why-not-shortlisted',
  },
  {
    classification: 'archived',
    surfaceLabel: 'Policy API',
    detail: 'Broad policy explainer surfaces are archived outside the locked launch MVP corridor.',
    matches: matchExactOrPrefix('/api/policy'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Profiles API',
    detail:
      'Legacy profile lookup and snippet surfaces are archived outside the locked launch MVP corridor.',
    matches: (pathname: string) =>
      pathname === '/api/profile/completeness' ||
      pathname === '/api/profile/snippet' ||
      pathname.startsWith('/api/profiles'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Archived Cron API',
    detail:
      'Fairness automation and digest cron surfaces are archived outside the locked launch MVP corridor.',
    matches: (pathname: string) =>
      pathname === '/api/cron/fairness-note' ||
      pathname === '/api/cron/fairness-report' ||
      pathname === '/api/cron/generate-fairness-note' ||
      pathname === '/api/cron/weekly-digest',
  },
  {
    classification: 'archived',
    surfaceLabel: 'Data Import API',
    detail: 'Import surfaces are archived outside the locked launch MVP corridor.',
    matches: matchExactOrPrefix('/api/data-import'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'User API',
    detail: 'Broad user tooling outside privacy/export/delete basics is archived for launch.',
    matches: (pathname: string) =>
      pathname === '/api/user/audit-log/purpose' ||
      pathname === '/api/user/account/cancel-deletion' ||
      pathname === '/api/user/import' ||
      pathname === '/api/user/tour-status',
  },
  {
    classification: 'archived',
    surfaceLabel: 'Updates API',
    detail: 'Update feed surfaces are archived outside the locked launch MVP corridor.',
    matches: matchExactOrPrefix('/api/updates'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Taxonomy API',
    detail: 'Broad taxonomy browsing surfaces are archived outside the locked launch MVP corridor.',
    matches: matchExactOrPrefix('/api/taxonomy'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Lifecycle API',
    detail: 'Lifecycle recovery surfaces are archived outside the locked launch MVP corridor.',
    matches: matchExactOrPrefix('/api/lifecycle'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Internal API',
    detail: 'Internal worker surfaces are archived outside the locked launch MVP corridor.',
    matches: (pathname: string) =>
      pathname.startsWith('/api/internal/') || pathname === '/api/internal/python-jobs',
  },
  {
    classification: 'archived',
    surfaceLabel: 'Dashboard API',
    detail:
      'Dashboard, momentum, and metrics surfaces are archived outside the locked launch MVP corridor.',
    matches: (pathname: string) =>
      pathname.startsWith('/api/dashboard') ||
      pathname.startsWith('/api/momentum') ||
      pathname.startsWith('/api/impact') ||
      pathname.startsWith('/api/metrics'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Organization Suite API',
    detail:
      'Broad organization-suite surfaces are archived outside the locked launch MVP corridor.',
    matches: (pathname: string) =>
      /^\/api\/org\/[^/]+\/(?:dashboard|coverage)(?:\/.*)?$/.test(pathname) ||
      /^\/api\/organizations\/[^/]+\/(?:causes|goals(?:\/.*)?|ownership(?:\/.*)?|partnerships(?:\/.*)?|projects(?:\/.*)?|structure(?:\/.*)?|culture(?:\/.*)?|impact(?:\/.*)?|test-matches(?:\/.*)?)$/.test(
        pathname
      ),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Admin API',
    detail: 'This admin surface is archived outside the locked launch MVP.',
    matches: (pathname: string) =>
      (pathname === '/api/admin' || pathname.startsWith('/api/admin/')) &&
      !matchesInternalOnlyApiPath(pathname),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Launch Ops API',
    detail: 'This cron route is archived outside the locked launch MVP.',
    matches: (pathname: string) =>
      matchExactOrPrefix('/api/cron')(pathname) && !matchesInternalOnlyApiPath(pathname),
  },
] as const satisfies readonly SurfacePolicy[];

export const LAUNCH_API_SURFACE_POLICIES = [
  ...INTERNAL_ONLY_API_POLICIES,
  ...ACTIVE_API_POLICIES,
  ...ARCHIVED_API_POLICIES,
] as const;

const ACTIVE_PAGE_POLICIES = [
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Launch Public Pages',
    detail: 'This public page remains inside the locked MVP corridor.',
    matches: (pathname: string) =>
      pathname === '/' ||
      pathname === '/403' ||
      pathname === '/privacy' ||
      pathname === '/terms' ||
      pathname === '/cookies' ||
      pathname === '/cookies/settings' ||
      pathname === '/accept-invite' ||
      pathname === '/verify-work-email' ||
      pathname === '/login' ||
      pathname === '/auth/login' ||
      pathname === '/auth/callback' ||
      pathname === '/auth/logout' ||
      pathname === '/llms' ||
      pathname === '/llms.txt' ||
      pathname === '/llms-full.txt' ||
      pathname === '/robots.txt' ||
      pathname === '/security.txt' ||
      pathname === '/.well-known/security.txt' ||
      matchExactOrPrefix('/signup')(pathname) ||
      matchExactOrPrefix('/reset-password')(pathname) ||
      matchExactOrPrefix('/verify-email')(pathname) ||
      matchExactOrPrefix('/onboarding')(pathname) ||
      /^\/candidate-invite\/[^/]+$/.test(pathname) ||
      /^\/feedback\/[^/]+$/.test(pathname) ||
      matchExactOrPrefix('/verify')(pathname) ||
      /^\/portfolio\/[^/]+$/.test(pathname) ||
      /^\/portfolio\/org\/[^/]+$/.test(pathname),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Individual App Pages',
    detail: 'This individual launch surface remains inside the locked MVP corridor.',
    matches: (pathname: string) =>
      pathname === '/app/i/home' ||
      pathname === '/app/i/profile' ||
      pathname === '/app/i/portfolio' ||
      pathname === '/app/i/matching' ||
      pathname === '/app/i/matching/preferences' ||
      pathname === '/app/i/communications' ||
      pathname === '/app/i/messages' ||
      pathname === '/app/i/interviews' ||
      pathname === '/app/i/verifications' ||
      pathname === '/app/i/settings' ||
      pathname === '/app/i/settings/privacy' ||
      pathname === '/app/i/settings/audit-log' ||
      /^\/app\/interviews\/[^/]+\/feedback$/.test(pathname),
  },
  {
    classification: 'active_launch_path',
    surfaceLabel: 'Organization App Pages',
    detail: 'This organization launch surface remains inside the locked MVP corridor.',
    matches: (pathname: string) =>
      /^\/app\/o\/[^/]+\/home$/.test(pathname) ||
      /^\/app\/o\/[^/]+\/matching$/.test(pathname) ||
      /^\/app\/o\/[^/]+\/assignments$/.test(pathname) ||
      /^\/app\/o\/[^/]+\/assignments\/new$/.test(pathname) ||
      /^\/app\/o\/[^/]+\/assignments\/[^/]+\/review$/.test(pathname) ||
      /^\/app\/o\/[^/]+\/shortlist$/.test(pathname) ||
      /^\/app\/o\/[^/]+\/communications$/.test(pathname) ||
      /^\/app\/o\/[^/]+\/messages$/.test(pathname) ||
      /^\/app\/o\/[^/]+\/interviews$/.test(pathname) ||
      /^\/app\/o\/[^/]+\/profile$/.test(pathname) ||
      /^\/app\/o\/[^/]+\/portfolio$/.test(pathname) ||
      /^\/app\/o\/[^/]+\/invitations\/[^/]+$/.test(pathname),
  },
] as const satisfies readonly SurfacePolicy[];

const GATED_NON_MVP_PAGE_POLICIES = [
  {
    classification: 'gated_non_mvp',
    surfaceLabel: 'Individual Pages',
    detail:
      'Opportunity browsing is named in the MVP, but it stays hard-gated until the launch-safe matching corridor is ready.',
    matches: (pathname: string) => pathname.startsWith('/app/i/opportunities'),
  },
  {
    classification: 'gated_non_mvp',
    surfaceLabel: 'Organization Pages',
    detail:
      'Team membership and role management stay named in the MVP, but the dedicated team surface remains hard-gated for launch.',
    matches: (pathname: string) => /^\/app\/o\/[^/]+\/team$/.test(pathname),
  },
  {
    classification: 'gated_non_mvp',
    surfaceLabel: 'Organization Pages',
    detail:
      'The org settings hub stays hard-gated for launch so the active corridor remains centered on trust, assignments, and review.',
    matches: (pathname: string) =>
      /^\/app\/o\/[^/]+\/settings$/.test(pathname) ||
      /^\/app\/o\/[^/]+\/settings\/team$/.test(pathname),
  },
] as const satisfies readonly SurfacePolicy[];

const INTERNAL_ONLY_PAGE_POLICIES = [
  {
    classification: 'internal_only_launch_ops',
    surfaceLabel: 'Internal Ops Pages',
    detail: 'This internal ops page remains available only for launch-critical manual operations.',
    matches: (pathname: string) =>
      INTERNAL_OPS_APP_PATHS.includes(pathname as (typeof INTERNAL_OPS_APP_PATHS)[number]),
  },
] as const satisfies readonly SurfacePolicy[];

const ARCHIVED_PAGE_POLICIES = [
  {
    classification: 'archived',
    surfaceLabel: 'Development Route Handler',
    detail:
      'Development-only route helpers are archived outside the locked launch MVP and must not be reachable in production.',
    matches: (pathname: string) => pathname === '/dev/resolve-home',
  },
  {
    classification: 'archived',
    surfaceLabel: 'Internal Ops Pages',
    detail: 'Non-critical admin pages are archived outside the locked launch MVP corridor.',
    matches: (pathname: string) =>
      (pathname === '/admin' || pathname.startsWith('/admin/')) &&
      !INTERNAL_OPS_APP_PATHS.includes(pathname as (typeof INTERNAL_OPS_APP_PATHS)[number]),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Individual Pages',
    detail: 'This individual page is archived outside the locked launch MVP corridor.',
    matches: (pathname: string) =>
      pathname.startsWith('/app/i/expertise') ||
      pathname.startsWith('/app/i/projects') ||
      pathname.startsWith('/app/i/skill-gaps') ||
      pathname.startsWith('/app/i/zen') ||
      pathname.startsWith('/app/i/notifications') ||
      pathname.startsWith('/app/i/matching/snoozed') ||
      pathname.startsWith('/app/i/settings/fairness') ||
      pathname.startsWith('/app/i/settings/notifications') ||
      pathname.startsWith('/app/i/settings/integrations'),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Organization Pages',
    detail: 'This organization page is archived outside the locked launch MVP corridor.',
    matches: (pathname: string) =>
      /^\/app\/o\/[^/]+\/analytics(?:\/.*)?$/.test(pathname) ||
      /^\/app\/o\/[^/]+\/(?:candidates|culture|goals|impact|members|opportunities|partnerships|projects|structure)$/.test(
        pathname
      ) ||
      /^\/app\/o\/[^/]+\/settings\/(?:goals|integrations|profile)(?:\/.*)?$/.test(pathname) ||
      /^\/app\/o\/[^/]+\/team\/coverage$/.test(pathname),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Compatibility Pages',
    detail:
      'Legacy org assignment shortcut pages are archived outside the locked launch MVP corridor.',
    matches: (pathname: string) => /^\/o\/[^/]+\/assignments\/new$/.test(pathname),
  },
  {
    classification: 'archived',
    surfaceLabel: 'Public Pages',
    detail: 'This public page is archived outside the locked launch MVP corridor.',
    matches: (pathname: string) =>
      pathname === '/fairness' ||
      pathname === '/accessibility' ||
      pathname === '/about' ||
      pathname === '/careers' ||
      pathname === '/contact' ||
      pathname === '/manifesto' ||
      pathname === '/support' ||
      pathname === '/verify-skill' ||
      pathname.startsWith('/docs/') ||
      pathname.startsWith('/p/') ||
      pathname.startsWith('/assign/'),
  },
] as const satisfies readonly SurfacePolicy[];

export const LAUNCH_PAGE_SURFACE_POLICIES = [
  ...INTERNAL_ONLY_PAGE_POLICIES,
  ...ACTIVE_PAGE_POLICIES,
  ...GATED_NON_MVP_PAGE_POLICIES,
  ...ARCHIVED_PAGE_POLICIES,
] as const;

function getPolicyByClassification(
  pathname: string,
  classification: LaunchSurfaceClassification,
  policies: readonly SurfacePolicy[]
): SurfacePolicy | null {
  const normalized = normalizePathname(pathname);
  return (
    policies.find(
      (policy) => policy.classification === classification && policy.matches(normalized)
    ) ?? null
  );
}

function getFallbackArchivedPolicy(pathname: string, kind: 'api' | 'page'): SurfacePolicy {
  const normalized = normalizePathname(pathname);
  const family = normalized.split('/').filter(Boolean)[kind === 'api' ? 1 : 0] || kind;

  return {
    classification: 'archived',
    surfaceLabel: kind === 'api' ? 'Archived API' : 'Archived Page',
    detail:
      kind === 'api'
        ? `/${family} is outside the locked launch MVP corridor and is served only as an archived compatibility surface.`
        : `/${family} is outside the locked launch MVP corridor and is not reachable in the launch surface.`,
    matches: () => true,
  };
}

export function getArchivedApiPolicy(pathname: string): {
  surfaceLabel: string;
  detail: string;
} | null {
  if (
    getPolicyByClassification(pathname, 'internal_only_launch_ops', LAUNCH_API_SURFACE_POLICIES)
  ) {
    return null;
  }

  if (getPolicyByClassification(pathname, 'active_launch_path', LAUNCH_API_SURFACE_POLICIES)) {
    return null;
  }

  const policy =
    getPolicyByClassification(pathname, 'archived', LAUNCH_API_SURFACE_POLICIES) ??
    getFallbackArchivedPolicy(pathname, 'api');

  return {
    surfaceLabel: policy.surfaceLabel,
    detail: policy.detail,
  };
}

export function getArchivedPagePolicy(pathname: string): {
  surfaceLabel: string;
  detail: string;
} | null {
  if (
    getPolicyByClassification(pathname, 'internal_only_launch_ops', LAUNCH_PAGE_SURFACE_POLICIES)
  ) {
    return null;
  }

  if (getPolicyByClassification(pathname, 'active_launch_path', LAUNCH_PAGE_SURFACE_POLICIES)) {
    return null;
  }

  const policy =
    getPolicyByClassification(pathname, 'gated_non_mvp', LAUNCH_PAGE_SURFACE_POLICIES) ??
    getPolicyByClassification(pathname, 'archived', LAUNCH_PAGE_SURFACE_POLICIES) ??
    getFallbackArchivedPolicy(pathname, 'page');

  return {
    surfaceLabel: policy.surfaceLabel,
    detail: policy.detail,
  };
}

export function classifyLaunchApiPath(pathname: string): LaunchSurfaceClassification {
  if (
    getPolicyByClassification(pathname, 'internal_only_launch_ops', LAUNCH_API_SURFACE_POLICIES)
  ) {
    return 'internal_only_launch_ops';
  }

  if (getPolicyByClassification(pathname, 'active_launch_path', LAUNCH_API_SURFACE_POLICIES)) {
    return 'active_launch_path';
  }

  return 'archived';
}

export function classifyLaunchPagePath(pathname: string): LaunchSurfaceClassification {
  if (
    getPolicyByClassification(pathname, 'internal_only_launch_ops', LAUNCH_PAGE_SURFACE_POLICIES)
  ) {
    return 'internal_only_launch_ops';
  }

  if (getPolicyByClassification(pathname, 'active_launch_path', LAUNCH_PAGE_SURFACE_POLICIES)) {
    return 'active_launch_path';
  }

  if (getPolicyByClassification(pathname, 'gated_non_mvp', LAUNCH_PAGE_SURFACE_POLICIES)) {
    return 'gated_non_mvp';
  }

  return 'archived';
}
