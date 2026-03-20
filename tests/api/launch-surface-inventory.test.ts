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
  '/api/data-export',
  '/api/decisions',
  '/api/decisions/window/[interviewId]',
  '/api/engagement-verifications/[id]',
  '/api/expertise/jd-to-l4',
  '/api/expertise/taxonomy',
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
  '/api/integrations/google/connect',
  '/api/integrations/google/callback',
  '/api/integrations/video',
  '/api/integrations/video/[provider]',
  '/api/integrations/video/[provider]/auth',
  '/api/integrations/video/generate-link',
  '/api/integrations/video/status',
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
  '/api/matching/profile',
  '/api/matching/profile/[id]',
  '/api/monitoring/launch-status',
  '/api/monitoring/perf-status',
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
  '/api/portfolio/view',
  '/api/portfolio/visibility',
  '/api/profile/completeness',
  '/api/profile/privacy-settings',
  '/api/profile/visibility',
  '/api/upload/avatar',
  '/api/upload/cover',
  '/api/upload/document',
  '/api/upload/status/[fileId]',
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
  '/api/verification/linkedin/initiate',
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

const REMOVED_ROUTE_FILES = ['/api/assignments/invite', '/api/assignments/invite/[token]'] as const;

const REQUIRED_ARCHIVED_COMPAT_PATHS = [
  '/api/auth/zoom/callback',
  '/api/contracts',
  '/api/contracts/[id]',
  '/api/projects',
  '/api/projects/[id]',
  '/api/skill-gaps',
  '/api/skill-gaps/overview',
  '/api/integrations',
  '/api/integrations/zoom/connect',
  '/api/messages',
  '/api/messages/[conversationId]',
  '/api/notifications',
  '/api/moderation/report',
  '/api/data-import',
  '/api/profile/snippet',
  '/api/expertise/profile',
  '/api/expertise/auto-suggest',
  '/api/expertise/gap-analysis',
  '/api/expertise/stats',
  '/api/expertise/cv-import/wizard-suggest',
  '/api/expertise/linkedin-import',
  '/api/expertise/linkedin-status',
  '/api/expertise/linkedin-disconnect',
  '/api/verification/skill/request',
  '/api/verification/veriff/session',
  '/api/feedback/why-not-shortlisted',
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

  it('removes explicit non-MVP route handlers from the compiled launch surface', async () => {
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
