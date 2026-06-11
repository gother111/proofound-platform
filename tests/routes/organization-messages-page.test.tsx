import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const replaceMock = vi.fn();
let searchParamsValue = '';

vi.mock('next/navigation', () => ({
  usePathname: () => '/app/o/acme/messages',
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
    selectedId,
  }: {
    conversations: any[];
    loadError?: string | null;
    onRetry?: () => void;
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
        <p key={conversation.id}>{conversation.otherPartyName}</p>
      ))}
    </div>
  ),
}));

vi.mock('@/components/messaging/RealtimeMessageThread', () => ({
  RealtimeMessageThread: ({ conversationId }: { conversationId: string }) => (
    <div data-testid="message-thread">{conversationId}</div>
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
});
