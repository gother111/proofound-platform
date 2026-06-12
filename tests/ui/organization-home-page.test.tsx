import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createClientMock, getActiveOrgMock, requireAuthMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getActiveOrgMock: vi.fn(),
  requireAuthMock: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: requireAuthMock,
  getActiveOrg: getActiveOrgMock,
}));

vi.mock('@/actions/org', () => ({
  inviteMemberFormAction: vi.fn(),
}));

vi.mock('@/components/org/OrgCollaboratorInviteCard', () => ({
  OrgCollaboratorInviteCard: () => <div data-testid="org-invite-card" />,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}));

import OrganizationHomePage from '@/app/app/o/[slug]/home/page';

function createSupabaseMock({
  assignments = [],
  members = [],
}: {
  assignments?: Array<Record<string, unknown>>;
  members?: Array<Record<string, unknown>>;
}) {
  return {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => {
        if (table === 'organization_members') {
          return {
            eq: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ data: members }),
            })),
          };
        }

        if (table === 'assignments') {
          return {
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: assignments }),
            })),
          };
        }

        return {
          eq: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: [] }),
            order: vi.fn().mockResolvedValue({ data: [] }),
          })),
        };
      }),
    })),
  };
}

describe('OrganizationHomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthMock.mockResolvedValue({ id: 'user-1' });
    getActiveOrgMock.mockResolvedValue({
      org: {
        id: 'org-1',
        slug: 'acme',
        displayName: 'Acme Proof Review',
        mission: 'Review work through proof.',
        workingContext: 'Small review team with clear proof expectations.',
        hiringProcessSummary: null,
        tagline: null,
        website: 'https://acme.example',
        websiteVerifiedAt: '2026-03-01T00:00:00.000Z',
        trustStatus: 'domain_verified',
        verified: false,
      },
      membership: {
        role: 'org_owner',
      },
    });
  });

  it('shows missing assignment launch dates as a pending review state', async () => {
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        members: [
          {
            id: 'member-1',
            role: 'org_owner',
            user_id: 'user-1',
            profiles: {
              display_name: 'Owner Reviewer',
            },
          },
        ],
        assignments: [
          {
            id: 'assignment-1',
            role: 'Evidence operations lead',
            status: 'active',
            creation_status: 'published',
            created_at: null,
          },
        ],
      })
    );

    render(
      await OrganizationHomePage({
        params: Promise.resolve({ slug: 'acme' }),
      })
    );

    expect(screen.getByRole('heading', { name: 'Evidence operations lead' })).toBeInTheDocument();
    expect(screen.getByText('Launch date pending')).toBeInTheDocument();
    expect(screen.queryByText('N/A')).not.toBeInTheDocument();
  });
});
