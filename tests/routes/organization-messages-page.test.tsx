import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const replaceMock = vi.fn();
let pathnameValue = '/app/o/acme/messages';
let searchParamsValue = '';

vi.mock('next/navigation', () => ({
  usePathname: () => pathnameValue,
  useRouter: () => ({
    replace: replaceMock,
  }),
  useSearchParams: () => new URLSearchParams(searchParamsValue),
}));

vi.mock('@/components/messaging/ConversationList', () => ({
  ConversationList: ({
    conversations,
    loadError,
    onRetry,
    onSelect,
    selectedId,
  }: {
    conversations: any[];
    loadError?: string | null;
    onRetry?: () => void;
    onSelect: (id: string) => void;
    selectedId?: string;
  }) => (
    <div>
      <p data-testid="selected-conversation">{selectedId ?? 'none'}</p>
      {loadError ? (
        <div role="alert">
          <p>Conversations could not load</p>
          <p>{loadError}</p>
          <button type="button" onClick={onRetry}>
            Retry conversations
          </button>
        </div>
      ) : null}
      {conversations.map((conversation) => (
        <button key={conversation.id} type="button" onClick={() => onSelect(conversation.id)}>
          {conversation.otherPartyName}
        </button>
      ))}
    </div>
  ),
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

vi.mock('@/lib/auth', () => ({
  requirePersona: vi.fn(),
}));

import OrganizationMessagesPage from '@/app/app/o/[slug]/messages/page';
import { OrgMessagesClient } from '@/app/app/o/[slug]/messages/OrgMessagesClient';
import { LoadingOrganizationMessages } from '@/app/app/o/[slug]/messages/DeferredOrgMessagesClient';
import { requirePersona } from '@/lib/auth';

describe('organization messages page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pathnameValue = '/app/o/acme/messages';
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
                  otherParty: { displayName: 'Submission A', displayAvatar: null },
                  createdAt: '2026-01-01T00:00:00.000Z',
                  matchId: 'match-a',
                  stage: 'masked',
                },
                {
                  id: 'conversation-b',
                  otherParty: { displayName: 'Submission B', displayAvatar: null },
                  createdAt: '2026-01-02T00:00:00.000Z',
                  matchId: 'match-b',
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

  it('loads conversations with the server-provided current user', async () => {
    render(<OrgMessagesClient currentUserId="user-1" />);

    expect(
      screen.getByText(/Identity remains protected until a consented reveal/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Identity remains protected before reveal')).toBeInTheDocument();
    expect(screen.queryByText(/Candidate identity remains protected/i)).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Submission A')).toBeInTheDocument();
    });

    expect(screen.queryByText(/^loading\.\.\.$/i)).not.toBeInTheDocument();
  });

  it('maps legacy missing organization-side participant labels to a masked privacy state', async () => {
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
                  createdAt: '2026-01-01T00:00:00.000Z',
                  matchId: 'match-masked',
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

    const { container } = render(<OrgMessagesClient currentUserId="user-1" />);

    expect(await screen.findByText('Masked participant')).toBeInTheDocument();
    expect(container).not.toHaveTextContent('Unknown');
  });

  it('shows a recoverable organization conversation load failure instead of an empty list', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValueOnce(new Error('network down'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            conversations: [
              {
                id: 'conversation-retry',
                otherParty: { displayName: 'Submission Retry', displayAvatar: null },
                createdAt: '2026-01-03T00:00:00.000Z',
                matchId: 'match-retry',
                stage: 'masked',
              },
            ],
          }),
        }) as any
    );

    render(<OrgMessagesClient currentUserId="user-1" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Conversations could not load');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Assignment conversations are still safe. Retry this section to load messages, reveal requests, and proof-corridor updates.'
    );
    expect(screen.queryByText('Submission Retry')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry conversations' }));

    await waitFor(() => {
      expect(screen.getByText('Submission Retry')).toBeInTheDocument();
    });
  });

  it('shows a recoverable selected organization thread load failure', async () => {
    searchParamsValue = 'conversation=conversation-a';
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
                  otherParty: { displayName: 'Submission A', displayAvatar: null },
                  createdAt: '2026-01-01T00:00:00.000Z',
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
                  content: 'Recovered org proof note',
                  sentAt: '2026-01-01T00:05:00.000Z',
                },
              ],
            }),
          };
        }

        throw new Error(`Unexpected fetch URL: ${url}`);
      }) as any
    );

    render(<OrgMessagesClient currentUserId="user-1" />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Thread messages could not load');
    expect(alert).toHaveTextContent(
      'This assignment thread did not finish loading. Messages, reveal requests, and review context are still safe; retry before replying.'
    );
    expect(screen.queryByTestId('message-thread')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry thread messages' }));

    await waitFor(() => {
      expect(screen.getByTestId('message-thread')).toHaveTextContent('conversation-a');
    });
    expect(screen.getByTestId('message-thread')).toHaveTextContent('Recovered org proof note');
    expect(messageRequests).toBe(2);
  });

  it('uses the server org-member persona as the current user source', async () => {
    vi.mocked(requirePersona).mockResolvedValue({ id: 'org-user-1' } as any);

    const element = (await OrganizationMessagesPage()) as React.ReactElement<{
      currentUserId: string;
    }>;

    expect(requirePersona).toHaveBeenCalledWith('org_member');
    expect(element.props.currentUserId).toBe('org-user-1');
  });

  it('uses a contextual loading state for organization messages', () => {
    render(<LoadingOrganizationMessages />);

    expect(screen.getByRole('status')).toHaveTextContent('Preparing organization messages');
    expect(screen.queryByText(/^loading\.\.\.$/i)).not.toBeInTheDocument();
  });

  it('tracks conversation query parameter changes after initial selection', async () => {
    searchParamsValue = 'conversation=conversation-a';
    const { rerender } = render(<OrgMessagesClient currentUserId="user-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('selected-conversation')).toHaveTextContent('conversation-a');
    });

    searchParamsValue = 'conversation=conversation-b';
    rerender(<OrgMessagesClient currentUserId="user-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('selected-conversation')).toHaveTextContent('conversation-b');
    });
  });

  it('writes selected conversations into the organization communications URL without dropping section context', async () => {
    pathnameValue = '/app/o/acme/communications';
    searchParamsValue = 'section=messages';

    render(<OrgMessagesClient currentUserId="user-1" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Submission B' }));

    await waitFor(() => {
      expect(screen.getByTestId('selected-conversation')).toHaveTextContent('conversation-b');
    });
    expect(replaceMock).toHaveBeenCalledWith(
      '/app/o/acme/communications?section=messages&conversation=conversation-b',
      { scroll: false }
    );
  });

  it('keeps a manual organization selection after starting from a conversation deep link', async () => {
    pathnameValue = '/app/o/acme/communications';
    searchParamsValue = 'section=messages&conversation=conversation-a';

    render(<OrgMessagesClient currentUserId="user-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('selected-conversation')).toHaveTextContent('conversation-a');
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Submission B' }));

    await waitFor(() => {
      expect(screen.getByTestId('selected-conversation')).toHaveTextContent('conversation-b');
    });
    expect(replaceMock).toHaveBeenCalledWith(
      '/app/o/acme/communications?section=messages&conversation=conversation-b',
      { scroll: false }
    );
  });

  it('explains stale organization conversation links without hiding reveal state safety', async () => {
    pathnameValue = '/app/o/acme/communications';
    searchParamsValue = 'section=messages&conversation=missing-conversation';

    render(<OrgMessagesClient currentUserId="user-1" />);

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('Assignment thread link unavailable');
    expect(status).toHaveTextContent('no longer available to this workspace');
    expect(status).toHaveTextContent('Review details and reveal state remain protected');
    expect(screen.queryByTestId('message-thread')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show available conversations' }));

    expect(replaceMock).toHaveBeenCalledWith('/app/o/acme/communications?section=messages', {
      scroll: false,
    });
  });
});
