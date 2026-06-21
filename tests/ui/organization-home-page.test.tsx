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
} = {}) {
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
        tagline: 'This work matters because proof-first review needs clear context.',
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

  it('keeps trust readiness progress aligned to the five launch essentials', async () => {
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
    createClientMock.mockResolvedValue(createSupabaseMock());

    render(
      await OrganizationHomePage({
        params: Promise.resolve({ slug: 'acme' }),
      })
    );

    expect(screen.getByRole('heading', { name: 'Complete the trust page' })).toBeInTheDocument();
    expect(
      screen.getByText(
        /Name, mission, why the work matters, operating context, and verified domain path keep review grounded\./
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Progress: 4/5 launch essentials ready')).toBeInTheDocument();
  });

  it('keeps broad verification and legacy summaries out of launch readiness', async () => {
    getActiveOrgMock.mockResolvedValue({
      org: {
        id: 'org-1',
        slug: 'acme',
        displayName: 'Acme Proof Review',
        mission: 'Review work through proof.',
        workingContext: null,
        hiringProcessSummary: 'Legacy hiring notes should not complete launch readiness.',
        tagline: 'Proof-first review needs clear context.',
        website: null,
        websiteVerifiedAt: null,
        trustStatus: 'platform_reviewed',
        verified: true,
      },
      membership: {
        role: 'org_owner',
      },
    });
    createClientMock.mockResolvedValue(createSupabaseMock());

    render(
      await OrganizationHomePage({
        params: Promise.resolve({ slug: 'acme' }),
      })
    );

    expect(screen.getByRole('heading', { name: 'Complete the trust page' })).toBeInTheDocument();
    expect(screen.getByText('Progress: 3/5 launch essentials ready')).toBeInTheDocument();
  });
});
