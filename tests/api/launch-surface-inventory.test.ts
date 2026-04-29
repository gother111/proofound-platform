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
  '/api/assignments/[id]',
  '/api/assignments/[id]/expertise-matrix',
  '/api/assignments/[id]/outcomes',
  '/api/assignments/[id]/pipeline',
  '/api/assignments/[id]/publish',
  '/api/candidate-invites/[token]',
  '/api/candidate-invites/[token]/claim',
  '/api/candidate-invites/[token]/proof-card',
  '/api/conversations',
  '/api/conversations/[conversationId]',
  '/api/conversations/[conversationId]/messages',
  '/api/conversations/[conversationId]/reveal',
  '/api/csrf-token',
  '/api/decisions',
  '/api/decisions/window/[interviewId]',
  '/api/engagement-verifications/[id]',
  '/api/expertise/jd-to-l4',
  '/api/expertise/taxonomy',
  '/api/expertise/cv-import/wizard-apply',
  '/api/expertise/cv-import/wizard-extract',
  '/api/expertise/cv-import/wizard-extract/status',
  '/api/expertise/cv-import/wizard-suggest',
  '/api/expertise/user-skills',
  '/api/expertise/user-skills/[id]',
  '/api/expertise/user-skills/[id]/proofs',
  '/api/expertise/user-skills/[id]/proofs/[proofId]',
  '/api/feature-flags',
  '/api/feedback/[interviewId]',
  '/api/feedback/submit',
  '/api/feedback/token/[token]',
  '/api/health',
  '/api/individual/readiness',
  '/api/interviews',
  '/api/interviews/cancel',
  '/api/interviews/complete',
  '/api/interviews/edit',
  '/api/interviews/no-show',
  '/api/interviews/schedule',
  '/api/location/autocomplete',
  '/api/match/assignment',
  '/api/match/explain/[matchId]',
  '/api/match/gates',
  '/api/match/hide',
  '/api/match/interest',
  '/api/match/profile',
  '/api/match/snoozed',
  '/api/match/test',
  '/api/match/visible-fields/[matchId]',
  '/api/matches/[id]/snooze',
  '/api/matching-profile',
  '/api/org/[id]/matches/[matchId]/review',
  '/api/org/[id]/shortlist',
  '/api/org/readiness',
  '/api/organizations',
  '/api/organizations/[orgId]',
  '/api/organizations/[orgId]/assignments',
  '/api/organizations/[orgId]/candidate-invites',
  '/api/organizations/[orgId]/candidate-invites/[inviteId]',
  '/api/organizations/[orgId]/team',
  '/api/organizations/[orgId]/visibility',
  '/api/performance/track',
  '/api/portfolio/export',
  '/api/portfolio/org/[slug]/export',
  '/api/portfolio/public/[handle]/export',
  '/api/portfolio/public/[handle]/summary',
  '/api/portfolio/text-pack',
  '/api/portfolio/visibility',
  '/api/profile',
  '/api/profile/completeness',
  '/api/profile/privacy-settings',
  '/api/profile/visibility',
  '/api/upload/avatar',
  '/api/upload/cover',
  '/api/upload/document',
  '/api/upload/status/[fileId]',
  '/api/data-export',
  '/api/user/account',
  '/api/user/account/cancel-deletion',
  '/api/user/audit-log',
  '/api/user/audit-log/purpose',
  '/api/user/consent',
  '/api/user/consent/check',
  '/api/user/email',
  '/api/user/export',
  '/api/user/me',
  '/api/user/password',
  '/api/user/privacy-settings',
  '/api/verification/requests',
  '/api/verification/requests/bundles/[requestId]',
  '/api/verification/requests/custom',
  '/api/verification/requests/custom/artifacts',
  '/api/verification/requests/email-hint',
  '/api/verification/requests/impact-story/[requestId]',
  '/api/verification/requests/skill',
  '/api/verification/requests/skill/[requestId]',
  '/api/verification/requests/skill/[requestId]/respond',
  '/api/verification/status',
  '/api/verification/work-email/send',
  '/api/verification/work-email/verify',
  '/api/verify/[token]',
  '/api/verify/custom/[token]',
] as const;

const REQUIRED_INTERNAL_ONLY_ROUTES = [
  '/api/admin/audit',
  '/api/admin/internal-ops/queues',
  '/api/admin/internal-ops/queues/[id]',
  '/api/admin/organizations/[orgId]/audit',
  '/api/admin/organizations/[orgId]/verify',
  '/api/cron/decision-reminders',
  '/api/cron/health-check',
  '/api/cron/launch-synthetic-checks',
  '/api/cron/performance-check',
  '/api/cron/refresh-matches',
  '/api/cron/refresh-matches-worker',
  '/api/cron/sla-enforcement',
  '/api/monitoring/launch-status',
  '/api/monitoring/perf-status',
  '/api/organizations/[orgId]/audit/export',
] as const;

const REQUIRED_ARCHIVED_COMPAT_PATHS = [
  '/api/auth/google/callback',
  '/api/auth/linkedin',
  '/api/auth/linkedin/callback',
  '/api/auth/zoom/callback',
  '/api/contracts',
  '/api/contracts/[id]',
  '/api/projects',
  '/api/projects/[id]',
  '/api/skill-gaps',
  '/api/skill-gaps/overview',
  '/api/integrations',
  '/api/integrations/google/connect',
  '/api/integrations/google/callback',
  '/api/integrations/video',
  '/api/integrations/video/[provider]',
  '/api/integrations/video/[provider]/auth',
  '/api/integrations/video/generate-link',
  '/api/integrations/video/status',
  '/api/integrations/zoom/connect',
  '/api/messages',
  '/api/messages/[conversationId]',
  '/api/notifications',
  '/api/moderation/report',
  '/api/data-import',
  '/api/matching/profile',
  '/api/matching/profile/[id]',
  '/api/profile/snippet',
  '/api/expertise/profile',
  '/api/expertise/auto-suggest',
  '/api/expertise/gap-analysis',
  '/api/expertise/stats',
  '/api/expertise/linkedin-import',
  '/api/expertise/linkedin-status',
  '/api/expertise/linkedin-disconnect',
  '/api/verification/linkedin/initiate',
  '/api/verification/skill/request',
  '/api/verification/veriff/session',
  '/api/cron/python-internal-worker',
  '/api/cron/cv-import-temp-cleanup',
  '/api/cron/account-deletion-workflow',
  '/api/cron/process-deletions',
  '/api/cron/send-deletion-reminders',
  '/api/internal/python-jobs',
  '/api/cron/workflow-jobs',
  '/api/feedback/why-not-shortlisted',
  '/api/portfolio/view',
  '/api/feedback/sus',
  '/api/surveys/sus',
  '/api/organizations/[orgId]/causes',
  '/api/organizations/[orgId]/goals',
  '/api/organizations/[orgId]/goals/[id]',
  '/api/organizations/[orgId]/ownership',
  '/api/organizations/[orgId]/ownership/[ownershipId]',
  '/api/organizations/[orgId]/partnerships',
  '/api/organizations/[orgId]/partnerships/[id]',
  '/api/organizations/[orgId]/projects',
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

  it('keeps internal launch ops routes explicit and narrow', async () => {
    const routes = await collectRoutePaths(API_ROOT);

    for (const route of REQUIRED_INTERNAL_ONLY_ROUTES) {
      expect(routes).toContain(route);
      expect(classifyLaunchApiPath(route)).toBe('internal_only_launch_ops');
    }
  });

  it('keeps representative non-MVP paths archived at the surface-policy boundary', async () => {
    for (const route of REQUIRED_ARCHIVED_COMPAT_PATHS) {
      expect(classifyLaunchApiPath(route)).toBe('archived');
    }
  });

  it('keeps every compiled API route inside the explicit launch, internal-only, or archived compatibility corridor', async () => {
    const routes = await collectRoutePaths(API_ROOT);
    const disallowedRoutes = routes.filter((route) => {
      const classification = classifyLaunchApiPath(route);
      return (
        classification !== 'active_launch_path' &&
        classification !== 'internal_only_launch_ops' &&
        classification !== 'archived'
      );
    });

    expect(disallowedRoutes).toEqual([]);
  });
});
