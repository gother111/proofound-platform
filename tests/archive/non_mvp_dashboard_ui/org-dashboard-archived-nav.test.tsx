import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { OrgGoalsCard } from '@/components/dashboard/OrgGoalsCard';
import { TeamRolesCard } from '@/components/dashboard/TeamRolesCard';

describe('organization dashboard launch-safe navigation', () => {
  it('routes goal card actions to the active organization profile instead of archived settings', () => {
    const { container } = render(
      <OrgGoalsCard
        orgSlug="acme"
        orgId="org-1"
        canManageSettings
        initialData={[
          {
            id: 'goal-1',
            goal_type: 'impact',
            title: 'Improve assignment clarity',
            description: 'Clarify the proof review loop.',
            status: 'in_progress',
            created_at: '2026-03-01T00:00:00.000Z',
            updated_at: '2026-03-01T00:00:00.000Z',
          },
        ]}
      />
    );

    expect(screen.getAllByRole('link', { name: 'View profile' })).toHaveLength(2);
    for (const link of screen.getAllByRole('link', { name: 'View profile' })) {
      expect(link).toHaveAttribute('href', '/app/o/acme/profile');
    }
    expect(container.innerHTML).not.toContain('/settings/goals');
  });

  it('routes team card actions to the active organization profile instead of archived team routes', () => {
    const { container } = render(
      <TeamRolesCard
        orgSlug="acme"
        orgId="org-1"
        canManageSettings
        initialData={{
          members: [
            {
              userId: 'user-1',
              role: 'org_owner',
              status: 'active',
              displayName: 'Alex Owner',
              handle: 'alex',
              avatarUrl: null,
              createdAt: '2026-03-01T00:00:00.000Z',
            },
          ],
          stats: {
            total: 1,
            byRole: {
              org_owner: 1,
              org_manager: 0,
              org_reviewer: 0,
            },
          },
        }}
      />
    );

    expect(screen.getAllByRole('link', { name: 'View profile' })).toHaveLength(2);
    for (const link of screen.getAllByRole('link', { name: 'View profile' })) {
      expect(link).toHaveAttribute('href', '/app/o/acme/profile');
    }
    expect(container.innerHTML).not.toContain('/settings/team');
    expect(container.innerHTML).not.toContain('/app/o/acme/team');
  });
});
