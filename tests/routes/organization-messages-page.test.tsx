import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const replaceMock = vi.fn();
let searchParamsValue = '';
let authState = { userId: 'user-1' as string | null, isLoading: false };

vi.mock('next/navigation', () => ({
  usePathname: () => '/app/o/acme/messages',
  useRouter: () => ({
    replace: replaceMock,
  }),
  useSearchParams: () => new URLSearchParams(searchParamsValue),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => authState,
}));

vi.mock('@/components/messaging/ConversationList', () => ({
  ConversationList: ({
    conversations,
    selectedId,
  }: {
    conversations: any[];
    selectedId?: string;
  }) => (
    <div>
      <p data-testid="selected-conversation">{selectedId ?? 'none'}</p>
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

import OrganizationMessagesPage from '@/app/app/o/[slug]/messages/page';

describe('organization messages page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsValue = '';
    authState = { userId: 'user-1', isLoading: false };
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
                  otherParty: { displayName: 'Candidate A', displayAvatar: null },
                  createdAt: '2026-01-01T00:00:00.000Z',
                  matchId: 'match-a',
                  stage: 'masked',
                },
                {
                  id: 'conversation-b',
                  otherParty: { displayName: 'Candidate B', displayAvatar: null },
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

  it('does not show the loading placeholder after auth resolves without a user', () => {
    authState = { userId: null, isLoading: false };

    render(<OrganizationMessagesPage />);

    expect(screen.getByText(/sign in to view organization conversations/i)).toBeInTheDocument();
    expect(screen.queryByText(/^loading\.\.\.$/i)).not.toBeInTheDocument();
  });

  it('tracks conversation query parameter changes after initial selection', async () => {
    searchParamsValue = 'conversation=conversation-a';
    const { rerender } = render(<OrganizationMessagesPage />);

    await waitFor(() => {
      expect(screen.getByTestId('selected-conversation')).toHaveTextContent('conversation-a');
    });

    searchParamsValue = 'conversation=conversation-b';
    rerender(<OrganizationMessagesPage />);

    await waitFor(() => {
      expect(screen.getByTestId('selected-conversation')).toHaveTextContent('conversation-b');
    });
  });
});
