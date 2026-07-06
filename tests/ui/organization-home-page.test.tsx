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

  it('keeps assignment details out of the lean home surface', async () => {
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

    expect(screen.getByText('Current review workspace')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Review queue' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Evidence operations lead' })
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Launch date pending')).not.toBeInTheDocument();
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

    expect(screen.getByRole('heading', { name: 'Launch Summary' })).toBeInTheDocument();
    expect(
      screen.getByText(/Trust essentials are ready\. The next useful move is assignment drafting\./)
    ).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('trust essentials ready')).toBeInTheDocument();
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

    expect(screen.getByRole('heading', { name: 'Launch Summary' })).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('trust essentials ready')).toBeInTheDocument();
    expect(screen.getByText(/Next: add verified domain path/i)).toBeInTheDocument();
  });
});
