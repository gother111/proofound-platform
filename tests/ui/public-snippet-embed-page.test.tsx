import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('@/components/profile/PublicSnippetView', () => ({
  PublicSnippetView: ({ viewModel, compact }: any) => (
    <div data-testid="public-snippet-view">{`${viewModel.format}:${compact ? 'compact' : 'full'}`}</div>
  ),
}));

vi.mock('@/lib/profile/public-snippet', () => ({
  getSnippetByToken: vi.fn(),
  buildPublicSnippetViewModel: vi.fn(),
  recordSnippetView: vi.fn().mockResolvedValue(undefined),
  recordUnavailableSnippetView: vi.fn().mockResolvedValue(undefined),
  extractSnippetViewMeta: vi.fn().mockReturnValue({ ip: null, userAgent: null, referrer: null }),
}));

import PublicProfileSnippetEmbedPage from '@/app/p/[token]/embed/page';
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

describe('Public snippet embed page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders invalid state when token is missing', async () => {
    vi.mocked(getSnippetByToken).mockResolvedValue(null as any);

    const element = await PublicProfileSnippetEmbedPage({
      params: Promise.resolve({ token: 'missing' }),
      searchParams: Promise.resolve({ format: 'card' }),
    });
    render(element);

    expect(screen.getByText(/snippet is unavailable/i)).toBeInTheDocument();
  });

  it('uses snippet format fallback for unknown query formats', async () => {
    vi.mocked(getSnippetByToken).mockResolvedValue(baseSnippet as any);
    vi.mocked(buildPublicSnippetViewModel).mockResolvedValue(baseViewModel as any);

    const element = await PublicProfileSnippetEmbedPage({
      params: Promise.resolve({ token: 'abc123' }),
      searchParams: Promise.resolve({ format: 'unknown' }),
    });
    render(element);

    expect(screen.getByTestId('public-snippet-view')).toHaveTextContent('card:compact');
    expect(recordSnippetView).toHaveBeenCalledTimes(1);
  });

  it('accepts valid format override', async () => {
    vi.mocked(getSnippetByToken).mockResolvedValue(baseSnippet as any);
    vi.mocked(buildPublicSnippetViewModel).mockResolvedValue(baseViewModel as any);

    const element = await PublicProfileSnippetEmbedPage({
      params: Promise.resolve({ token: 'abc123' }),
      searchParams: Promise.resolve({ format: 'mini' }),
    });
    render(element);

    expect(screen.getByTestId('public-snippet-view')).toHaveTextContent('mini:compact');
  });
});
