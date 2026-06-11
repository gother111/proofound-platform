import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/app/i/messages',
  useRouter: () => ({
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(''),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    userId: 'user-1',
    isLoading: false,
    error: null,
  }),
}));

vi.mock('date-fns', () => ({
  formatDistanceToNow: () => '15 minutes ago',
}));

import { MessagesClient } from '@/app/app/i/messages/MessagesClient';

describe('individual messages page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url === '/api/conversations') {
          return {
            ok: true,
            json: async () => ({
              conversations: [
                {
                  id: 'conversation-a',
                  otherParty: { displayName: 'Organization A', displayAvatar: null },
                  lastMessage: { content: 'Proof-corridor update' },
                  lastMessageAt: '2026-01-01T00:00:00.000Z',
                  matchId: 'match-a',
                  assignmentRole: 'Evidence systems consultant',
                  stage: 'masked',
                },
              ],
            }),
          };
        }

        if (url.startsWith('/api/conversations/') && url.endsWith('/messages')) {
          return {
            ok: true,
            json: async () => ({ messages: [] }),
          };
        }

        throw new Error(`Unexpected fetch URL: ${url}`);
      }) as any
    );
  });

  it('loads individual conversations into the proof-corridor list', async () => {
    render(<MessagesClient />);

    await waitFor(() => {
      expect(screen.getByText('Organization A')).toBeInTheDocument();
    });
    expect(screen.queryByText('No conversations yet')).not.toBeInTheDocument();
  });

  it('shows a recoverable individual conversation load failure instead of an empty list', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValueOnce(new Error('network down'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ conversations: [] }),
        }) as any
    );

    render(<MessagesClient />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Conversations could not load');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Your conversation threads are still safe. Retry this section to load messages, reveal requests, and proof-corridor updates.'
    );
    expect(screen.queryByText('No conversations yet')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry conversations' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText('No conversations yet')).toBeInTheDocument();
  });
});
