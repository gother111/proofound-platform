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
  proofsCount?: number;
  verificationCount?: number;
  attestationCount?: number;
  skills?: any[];
  skillProofRows?: Array<{ skill_id: string | null }>;
  matchingProfile?: any;
  impactStories?: any[];
  fallbackSkillProofs?: any[];
  verificationActivity?: any[];
};

function mockSupabaseClient(fixtures: Fixtures) {
  const {
    authUser,
    profile,
    proofsCount = 0,
    verificationCount = 0,
    attestationCount = 0,
    skills = [],
    skillProofRows = [],
    matchingProfile = null,
    impactStories = [],
    fallbackSkillProofs = [],
    verificationActivity = [],
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
          if (options?.head) {
            return {
              eq: vi.fn().mockResolvedValue({ count: proofsCount }),
            };
          }

          if (query.trim() === 'skill_id') {
            return {
              eq: vi.fn().mockResolvedValue({ data: skillProofRows }),
            };
          }

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

      if (table === 'skill_verification_requests') {
        const select = vi.fn((query: string, options?: { head?: boolean; count?: string }) => {
          if (options?.head) {
            return {
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ count: verificationCount }),
                }),
              }),
            };
          }

          if (query.includes('skill:skill_id')) {
            return {
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue({ data: verificationActivity }),
                    }),
                  }),
                }),
              }),
            };
          }

          throw new Error(`Unexpected skill_verification_requests query: ${query}`);
        });

        return { select };
      }

      if (table === 'attestations') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: attestationCount }),
            }),
          })),
        };
      }

      if (table === 'skills') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: skills }),
              }),
            }),
          })),
        };
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
  it('renders proof-first public view with intentional empty states and no return link', async () => {
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
    expect(screen.getByText(/credibility at a glance/i)).toBeInTheDocument();
    expect(screen.getByText(/featured proofs/i)).toBeInTheDocument();
    expect(screen.getByText(/no proofs published yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy recruiter summary/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /return to menu/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /return home/i })).not.toBeInTheDocument();
  });

  it('renders owner preview mode controls and allows return link when provided', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabaseClient({
        authUser: { id: 'user-1' },
        proofsCount: 2,
        verificationCount: 1,
        attestationCount: 1,
        skills: [
          {
            id: 'skill-1',
            level: 4,
            last_used_at: '2026-02-01T00:00:00.000Z',
            skill_code: 'product-strategy',
            taxonomy: { name_i18n: { en: 'Product Strategy' } },
          },
        ],
        skillProofRows: [{ skill_id: 'skill-1' }],
        matchingProfile: {
          desired_roles: ['Product Lead'],
          work_mode: 'remote',
        },
        impactStories: [
          {
            id: 'impact-1',
            title: 'Launch readiness program',
            role_title: 'Program lead',
            timeline: 'Q4 2025',
            outcomes: 'Shipped faster;Raised confidence',
            measured_outcomes: [],
            supporting_artifacts: [],
            verified: true,
            updated_at: '2026-01-15T00:00:00.000Z',
          },
        ],
        verificationActivity: [
          {
            id: 'ver-1',
            responded_at: '2026-02-10T00:00:00.000Z',
            created_at: '2026-02-09T00:00:00.000Z',
            verifier_source: 'peer',
            verifier_email: 'reviewer@example.com',
            skill: {
              skill_code: 'product-strategy',
              taxonomy: { name_i18n: { en: 'Product Strategy' } },
            },
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
    expect(screen.getAllByRole('link', { name: /edit profile/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /add proof/i }).length).toBeGreaterThan(0);
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
