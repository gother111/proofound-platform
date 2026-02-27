import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('@/components/profile/PublicSnippetView', () => ({
  PublicSnippetView: ({ viewModel }: any) => (
    <div data-testid="public-snippet-view">{`snippet:${viewModel.title}`}</div>
  ),
}));

vi.mock('@/lib/profile/public-snippet', () => ({
  getSnippetByToken: vi.fn(),
  buildPublicSnippetViewModel: vi.fn(),
  recordSnippetView: vi.fn().mockResolvedValue(undefined),
  extractSnippetViewMeta: vi.fn().mockReturnValue({ ip: null, userAgent: null, referrer: null }),
}));

import PublicProfileSnippetPage, { generateMetadata } from '@/app/p/[token]/page';
import {
  getSnippetByToken,
  buildPublicSnippetViewModel,
  recordSnippetView,
} from '@/lib/profile/public-snippet';

const baseSnippet = {
  id: 'snippet-1',
  userId: 'user-1',
  shareToken: 'abc123',
  fields: {},
  theme: 'light',
  format: 'card',
  expiresAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  profileType: 'individual',
  orgId: null,
} as const;

const baseViewModel = {
  profileType: 'individual',
  format: 'card',
  theme: 'light',
  title: 'Jane Doe',
  subtitle: 'Impact builder',
  avatarImage: null,
  heroImage: null,
  location: null,
  website: null,
  foundedYear: null,
  typeLabel: null,
  about: 'Bio',
  skills: [],
  experiences: [],
  education: [],
  values: [],
  causes: [],
  workCultureHighlights: [],
  impactEntries: [],
  redacted: false,
  hasVisibleFields: true,
} as const;

describe('Public snippet page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders unavailable state for invalid token', async () => {
    vi.mocked(getSnippetByToken).mockResolvedValue(null as any);

    const element = await PublicProfileSnippetPage({
      params: Promise.resolve({ token: 'missing' }),
    });
    render(element);

    expect(screen.getByText(/shared profile is unavailable/i)).toBeInTheDocument();
  });

  it('renders snippet view and records a view for valid token', async () => {
    vi.mocked(getSnippetByToken).mockResolvedValue(baseSnippet as any);
    vi.mocked(buildPublicSnippetViewModel).mockResolvedValue(baseViewModel as any);

    const element = await PublicProfileSnippetPage({
      params: Promise.resolve({ token: 'abc123' }),
    });
    render(element);

    expect(screen.getByTestId('public-snippet-view')).toHaveTextContent('snippet:Jane Doe');
    expect(recordSnippetView).toHaveBeenCalledTimes(1);
  });

  it('returns unavailable metadata when token is invalid', async () => {
    vi.mocked(getSnippetByToken).mockResolvedValue(null as any);

    const metadata = await generateMetadata({ params: Promise.resolve({ token: 'missing' }) });

    expect(metadata.title).toBe('Public Profile Unavailable | Proofound');
    expect(metadata.alternates?.canonical).toContain('/p/missing');
  });

  it('returns redacted metadata when snippet is hidden', async () => {
    vi.mocked(getSnippetByToken).mockResolvedValue(baseSnippet as any);
    vi.mocked(buildPublicSnippetViewModel).mockResolvedValue({
      ...baseViewModel,
      redacted: true,
      hasVisibleFields: false,
      title: 'Profile is temporarily hidden',
    } as any);

    const metadata = await generateMetadata({ params: Promise.resolve({ token: 'abc123' }) });

    expect(metadata.title).toBe('Profile is currently hidden | Proofound');
    expect(String(metadata.description)).toContain('hidden');
  });
});
