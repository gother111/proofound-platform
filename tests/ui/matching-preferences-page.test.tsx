import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/components/matching/MatchingPreferencesClient', () => ({
  MatchingPreferencesClient: () => <div>individual matching setup</div>,
}));

import { createClient } from '@/lib/supabase/server';
import MatchingPreferencesPage from '@/app/app/i/matching/preferences/page';

describe('MatchingPreferencesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the individual matching setup client for authenticated users', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
        }),
      },
    } as any);

    const element = await MatchingPreferencesPage();
    render(element);

    expect(screen.getByRole('heading', { name: 'Matching Preferences' })).toBeInTheDocument();
    expect(screen.getByText('individual matching setup')).toBeInTheDocument();
    expect(screen.queryByText(/must-have requirements/i)).not.toBeInTheDocument();
  });

  it('redirects to /login when user is unauthenticated', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    } as any);

    await expect(MatchingPreferencesPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });
});
