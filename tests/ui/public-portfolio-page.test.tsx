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

function mockSupabaseClient({ profile }: { profile: any }) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        const maybeSingle = vi.fn().mockResolvedValue({ data: profile });
        const eq = vi.fn().mockReturnValue({ maybeSingle });
        const select = vi.fn().mockReturnValue({ eq });
        return { select };
      }

      throw new Error(`Unexpected table ${table}`);
    }),
  };
}

describe('Public individual portfolio page', () => {
  it('renders public profile and safe return-to-menu link when returnTo is an app path', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabaseClient({
        profile: {
          id: 'user-1',
          handle: 'jane',
          display_name: 'Jane Doe',
          avatar_url: null,
          individual_profiles: [
            {
              headline: 'Impact builder',
              bio: 'Proof-backed profile.',
              tagline: null,
              verification_status: 'verified',
              verification_method: 'veriff',
              verified_at: null,
              work_email: null,
              work_email_verified: false,
              linkedin_verification_status: null,
              linkedin_verified_at: null,
              linkedin_verification_data: null,
              verified: true,
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
    expect(screen.getByText(/trust summary/i)).toBeInTheDocument();
    expect(screen.getByText(/profile narrative/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /return to menu/i })).toHaveAttribute(
      'href',
      '/app/i/home'
    );
  });

  it('falls back to return-home when returnTo is unsafe', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabaseClient({
        profile: {
          id: 'user-1',
          handle: 'jane',
          display_name: 'Jane Doe',
          avatar_url: null,
          individual_profiles: [],
          field_visibility: [{ field_visibility: {} }],
        },
      }) as any
    );

    const element = await PortfolioPage({
      params: Promise.resolve({ handle: 'jane' }),
      searchParams: Promise.resolve({ returnTo: '/portfolio/jane' }),
    });
    render(element);

    expect(screen.getByRole('link', { name: /return home/i })).toHaveAttribute('href', '/');
  });

  it('calls notFound when handle does not resolve to a profile', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabaseClient({
        profile: null,
      }) as any
    );

    await expect(PortfolioPage({ params: Promise.resolve({ handle: 'missing' }) })).rejects.toThrow(
      'NOT_FOUND'
    );
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
