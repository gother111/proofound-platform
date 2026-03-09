import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import PortfolioPage from '@/app/portfolio/[handle]/page';

type Fixtures = {
  authUser: { id: string } | null;
  profile: any;
  profileFieldVisibility?: any;
  historicalHandle?: any;
  fallbackSkillProofs?: any[];
};

function mockSupabaseClient(fixtures: Fixtures) {
  const {
    authUser,
    profile,
    profileFieldVisibility = null,
    historicalHandle = null,
    fallbackSkillProofs = [],
  } = fixtures;

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: authUser } }),
    },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        const maybeSingle = vi.fn().mockResolvedValue({ data: profile });
        const eq = vi.fn().mockReturnValue({ maybeSingle });
        const select = vi.fn().mockReturnValue({ eq });
        return { select };
      }

      if (table === 'skill_proofs') {
        const select = vi.fn((query: string, options?: { head?: boolean; count?: string }) => {
          return {
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: fallbackSkillProofs }),
              }),
            }),
          };
        });

        return { select };
      }

      if (table === 'profile_field_visibility') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: profileFieldVisibility }),
            }),
          })),
        };
      }

      if (table === 'profile_handle_history') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: historicalHandle }),
            }),
          })),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    }),
  };
}

describe('Public individual portfolio page', () => {
  it('falls back to the public handle when display name is not public', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabaseClient({
        authUser: null,
        profileFieldVisibility: {
          display_name: 'network_only',
          headline: 'public',
          skills: 'public',
        },
        profile: {
          id: 'user-1',
          handle: 'jane-hidden',
          display_name: 'Jane Hidden',
          public_portfolio_state: 'public_link_only',
          search_indexing_enabled_at: null,
          avatar_url: null,
          individual_profiles: [
            {
              headline: 'Proof-first builder',
              bio: null,
              tagline: null,
              verification_status: null,
              verification_method: null,
              verified_at: null,
              work_email: null,
              work_email_verified: false,
              linkedin_verification_status: null,
              linkedin_verified_at: null,
              linkedin_verification_data: null,
              verified: false,
            },
          ],
          field_visibility: [{ field_visibility: {} }],
        },
      }) as any
    );

    const element = await PortfolioPage({
      params: Promise.resolve({ handle: 'jane-hidden' }),
      searchParams: Promise.resolve({}),
    });

    render(element);

    expect(screen.getByRole('heading', { name: 'jane-hidden' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Jane Hidden' })).not.toBeInTheDocument();
  });

  it('renders public read-only view with updated sections and no owner-only details', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabaseClient({
        authUser: null,
        profileFieldVisibility: {
          headline: 'public',
          skills: 'owner_only',
        },
        profile: {
          id: 'user-1',
          handle: 'jane',
          display_name: 'Jane Doe',
          public_portfolio_state: 'public_link_only',
          search_indexing_enabled_at: null,
          avatar_url: null,
          individual_profiles: [
            {
              headline: 'Proof-first builder',
              bio: null,
              tagline: null,
              verification_status: null,
              verification_method: null,
              verified_at: null,
              work_email: null,
              work_email_verified: false,
              linkedin_verification_status: null,
              linkedin_verified_at: null,
              linkedin_verification_data: null,
              verified: false,
            },
          ],
          field_visibility: [{ field_visibility: {} }],
        },
      }) as any
    );

    const element = await PortfolioPage({
      params: Promise.resolve({ handle: 'jane' }),
      searchParams: Promise.resolve({ returnTo: '/app/i/home' }),
    });

    render(element);

    expect(screen.getByRole('heading', { name: 'Jane Doe' })).toBeInTheDocument();
    expect(screen.getByText('Shareable by direct link')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /proof-based summary/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /featured proofs/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /skills snapshot/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /contact & share/i })).toBeInTheDocument();
    expect(screen.getByText(/no public summary is published yet/i)).toBeInTheDocument();
    expect(screen.getByText(/no public proof is available yet/i)).toBeInTheDocument();
    expect(
      screen.getByText(/skills are not shared publicly in this portfolio/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /request introduction/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy recruiter summary/i })).toBeInTheDocument();
    expect(screen.queryByText(/my next challenge/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/mission & vision/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/stockholm, sweden/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /return to menu/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /return home/i })).not.toBeInTheDocument();
  });

  it('renders owner-safe public preview and allows return link when provided', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabaseClient({
        authUser: { id: 'user-1' },
        profileFieldVisibility: {
          headline: 'public',
          skills: 'public',
        },
        fallbackSkillProofs: [
          {
            id: 'proof-verified',
            title: 'Verified proof item',
            proof_type: 'project',
            description: 'Delivered measurable outcomes',
            url: 'https://example.com/verified',
            verified: true,
            created_at: '2026-01-15T00:00:00.000Z',
          },
          {
            id: 'proof-pending',
            title: 'Pending proof item',
            proof_type: 'project',
            description: 'Pending outcome',
            url: 'https://example.com/pending',
            verified: false,
            created_at: '2026-01-16T00:00:00.000Z',
          },
        ],
        profile: {
          id: 'user-1',
          handle: 'jane',
          display_name: 'Jane Doe',
          public_portfolio_state: 'public_link_only',
          search_indexing_enabled_at: null,
          avatar_url: null,
          individual_profiles: [
            {
              headline: 'Impact builder',
              bio: 'I build measurable change.',
              tagline: null,
              skills: ['Strategy', 'Research ops'],
              verification_status: 'verified',
              verification_method: 'veriff',
              verified_at: null,
              work_email: 'jane@example.com',
              work_email_verified: true,
              linkedin_verification_status: 'verified',
              linkedin_verified_at: null,
              linkedin_verification_data: { hasIdentityVerification: true },
              verified: true,
            },
          ],
          field_visibility: [
            { field_visibility: { contact: true, workEmail: true, bio: true, skills: true } },
          ],
        },
      }) as any
    );

    const element = await PortfolioPage({
      params: Promise.resolve({ handle: 'jane' }),
      searchParams: Promise.resolve({ returnTo: '/app/i/home' }),
    });

    render(element);

    expect(screen.getByRole('link', { name: /return to menu/i })).toHaveAttribute(
      'href',
      '/app/i/home'
    );
    expect(screen.getAllByText('I build measurable change.').length).toBeGreaterThan(0);
    expect(screen.getByText('Verified proof item')).toBeInTheDocument();
    expect(screen.getByText('Strategy')).toBeInTheDocument();
    expect(screen.getByText('Research ops')).toBeInTheDocument();
    expect(screen.queryByText('Pending proof item')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /work email/i })).toHaveAttribute(
      'href',
      'mailto:jane@example.com'
    );
    expect(screen.queryByText(/stockholm, sweden/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/mission & vision/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /edit profile/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /add proof/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /request verification/i })).not.toBeInTheDocument();
  });

  it('calls notFound when handle does not resolve to a profile', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabaseClient({
        authUser: null,
        profile: null,
        historicalHandle: null,
      }) as any
    );

    await expect(PortfolioPage({ params: Promise.resolve({ handle: 'missing' }) })).rejects.toThrow(
      'NOT_FOUND'
    );
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
