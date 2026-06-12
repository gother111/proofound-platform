import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let searchParamsValue = '';

vi.mock('next/navigation', () => ({
  usePathname: () => '/app/i/messages',
  useRouter: () => ({
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(searchParamsValue),
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

vi.mock('@/components/messaging/RealtimeMessageThread', () => ({
  RealtimeMessageThread: ({
    conversationId,
    initialMessages,
  }: {
    conversationId: string;
    initialMessages: Array<{ content: string }>;
  }) => (
    <div data-testid="message-thread">
      <p>{conversationId}</p>
      {initialMessages.map((message) => (
        <p key={message.content}>{message.content}</p>
      ))}
    </div>
  ),
}));

import { MessagesClient } from '@/app/app/i/messages/MessagesClient';

describe('individual messages page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsValue = '';
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

  it('maps legacy missing participant labels to a masked privacy state', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url === '/api/conversations') {
          return {
            ok: true,
            json: async () => ({
              conversations: [
                {
                  id: 'conversation-masked',
                  otherParty: { displayName: 'Unknown', displayAvatar: null },
                  lastMessage: { content: 'Proof-corridor update' },
                  lastMessageAt: '2026-01-01T00:00:00.000Z',
                  matchId: 'match-masked',
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

    const { container } = render(<MessagesClient />);

    expect(await screen.findByText('Masked participant')).toBeInTheDocument();
    expect(container).not.toHaveTextContent('Unknown');
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

  it('shows a recoverable selected-thread load failure instead of an empty message thread', async () => {
    let messageRequests = 0;

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

        if (url === '/api/conversations/conversation-a/messages') {
          messageRequests += 1;
          if (messageRequests === 1) {
            return {
              ok: false,
              json: async () => ({ error: 'temporarily unavailable' }),
            };
          }

          return {
            ok: true,
            json: async () => ({
              messages: [
                {
                  id: 'message-1',
                  senderId: 'user-1',
                  content: 'Recovered proof update',
                  sentAt: '2026-01-01T00:05:00.000Z',
                },
              ],
            }),
          };
        }

        throw new Error(`Unexpected fetch URL: ${url}`);
      }) as any
    );

    render(<MessagesClient />);

    fireEvent.click(await screen.findByRole('button', { name: /Organization A/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Thread messages could not load');
    expect(alert).toHaveTextContent(
      'This thread did not finish loading. Your messages, reveal requests, and privacy state are still safe; retry before replying.'
    );
    expect(screen.queryByTestId('message-thread')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry thread messages' }));

    await waitFor(() => {
      expect(screen.getByTestId('message-thread')).toHaveTextContent('conversation-a');
    });
    expect(screen.getByTestId('message-thread')).toHaveTextContent('Recovered proof update');
    expect(messageRequests).toBe(2);
  });

  it('tracks conversation query parameter changes after initial selection', async () => {
    searchParamsValue = 'conversation=conversation-a';

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
                  lastMessage: { content: 'First proof-corridor update' },
                  lastMessageAt: '2026-01-01T00:00:00.000Z',
                  matchId: 'match-a',
                  assignmentRole: 'Evidence systems consultant',
                  stage: 'masked',
                },
                {
                  id: 'conversation-b',
                  otherParty: { displayName: 'Organization B', displayAvatar: null },
                  lastMessage: { content: 'Second proof-corridor update' },
                  lastMessageAt: '2026-01-02T00:00:00.000Z',
                  matchId: 'match-b',
                  assignmentRole: 'Proof operations lead',
                  stage: 'masked',
                },
              ],
            }),
          };
        }

        if (url === '/api/conversations/conversation-a/messages') {
          return {
            ok: true,
            json: async () => ({
              messages: [
                {
                  id: 'message-a',
                  senderId: 'user-1',
                  content: 'First selected thread',
                  sentAt: '2026-01-01T00:05:00.000Z',
                },
              ],
            }),
          };
        }

        if (url === '/api/conversations/conversation-b/messages') {
          return {
            ok: true,
            json: async () => ({
              messages: [
                {
                  id: 'message-b',
                  senderId: 'user-1',
                  content: 'Second selected thread',
                  sentAt: '2026-01-02T00:05:00.000Z',
                },
              ],
            }),
          };
        }

        throw new Error(`Unexpected fetch URL: ${url}`);
      }) as any
    );

    const { rerender } = render(<MessagesClient />);

    await waitFor(() => {
      expect(screen.getByTestId('message-thread')).toHaveTextContent('conversation-a');
    });
    expect(screen.getByTestId('message-thread')).toHaveTextContent('First selected thread');

    searchParamsValue = 'conversation=conversation-b';
    rerender(<MessagesClient />);

    await waitFor(() => {
      expect(screen.getByTestId('message-thread')).toHaveTextContent('conversation-b');
    });
    expect(screen.getByTestId('message-thread')).toHaveTextContent('Second selected thread');
  });
});
