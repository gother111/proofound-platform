import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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

import { OrgMessagesClient } from '@/app/app/o/[slug]/messages/OrgMessagesClient';
import { LoadingOrganizationMessages } from '@/app/app/o/[slug]/messages/DeferredOrgMessagesClient';

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

  it('loads conversations with the server-provided current user', async () => {
    render(<OrgMessagesClient currentUserId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText('Candidate A')).toBeInTheDocument();
    });

    expect(screen.queryByText(/^loading\.\.\.$/i)).not.toBeInTheDocument();
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
