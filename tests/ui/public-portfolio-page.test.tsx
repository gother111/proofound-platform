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

vi.mock('@/app/portfolio/[handle]/ViewCounterClient', () => ({
  ViewCounterClient: () => null,
}));

import { createClient } from '@/lib/supabase/server';
import PortfolioPage from '@/app/portfolio/[handle]/page';

type Fixtures = {
  authUser: { id: string } | null;
  profile: any;
  matchingProfile?: any;
  impactStories?: any[];
  fallbackSkillProofs?: any[];
};

function mockSupabaseClient(fixtures: Fixtures) {
  const {
    authUser,
    profile,
    matchingProfile = null,
    impactStories = [],
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

      if (table === 'matching_profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: matchingProfile }),
            }),
          })),
        };
      }

      if (table === 'impact_stories') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: impactStories }),
              }),
            }),
          })),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    }),
  };
}

describe('Public individual portfolio page', () => {
  it('renders public read-only view with updated sections and no owner-only details', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabaseClient({
        authUser: null,
        profile: {
          id: 'user-1',
          handle: 'jane',
          display_name: 'Jane Doe',
          avatar_url: null,
          individual_profiles: [
            {
              headline: null,
              bio: null,
              location: 'Stockholm, Sweden',
              mission: 'Build equitable systems.',
              vision: 'A fairer labor market.',
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
    expect(screen.getByRole('heading', { name: /proof-based summary/i })).toBeInTheDocument();
    expect(screen.getByText(/featured proofs/i)).toBeInTheDocument();
    expect(screen.getByText(/expertise snapshot/i)).toBeInTheDocument();
    expect(screen.getByText(/my next challenge/i)).toBeInTheDocument();
    expect(screen.getByText(/mission & vision/i)).toBeInTheDocument();
    expect(screen.getByText(/location hidden/i)).toBeInTheDocument();
    expect(screen.getByText(/mission is private in this view/i)).toBeInTheDocument();
    expect(screen.getByText(/no proofs published yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy recruiter summary/i })).toBeInTheDocument();
    expect(screen.queryByText(/credibility at a glance/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/verification activity/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /return to menu/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /return home/i })).not.toBeInTheDocument();
  });

  it('renders owner preview mode controls and allows return link when provided', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabaseClient({
        authUser: { id: 'user-1' },
        matchingProfile: {
          desired_roles: ['Product Lead'],
          work_mode: 'remote',
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
        impactStories: [
          {
            id: 'impact-1',
            title: 'Impact story should not appear',
            role_title: 'Program lead',
            timeline: 'Q4 2025',
            outcomes: 'Story outcome',
            verified: true,
            updated_at: '2026-01-15T00:00:00.000Z',
          },
        ],
        profile: {
          id: 'user-1',
          handle: 'jane',
          display_name: 'Jane Doe',
          avatar_url: null,
          individual_profiles: [
            {
              headline: 'Impact builder',
              bio: 'I build measurable change.',
              location: 'Stockholm, Sweden',
              mission: 'Build equitable systems.',
              vision: 'A fairer labor market.',
              tagline: null,
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
          field_visibility: [{ field_visibility: { contact: true, workEmail: true } }],
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
    expect(screen.getByText('Stockholm, Sweden')).toBeInTheDocument();
    expect(screen.getByText('Build equitable systems.')).toBeInTheDocument();
    expect(screen.getByText('Verified proof item')).toBeInTheDocument();
    expect(screen.queryByText('Pending proof item')).not.toBeInTheDocument();
    expect(screen.queryByText('Impact story should not appear')).not.toBeInTheDocument();
    expect(screen.queryByText(/pending verification/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /edit profile/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /add proof/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /request verification/i })).not.toBeInTheDocument();
  });

  it('calls notFound when handle does not resolve to a profile', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabaseClient({
        authUser: null,
        profile: null,
      }) as any
    );

    await expect(PortfolioPage({ params: Promise.resolve({ handle: 'missing' }) })).rejects.toThrow(
      'NOT_FOUND'
    );
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
