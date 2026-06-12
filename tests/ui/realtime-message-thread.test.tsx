import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  diagnostic: vi.fn(),
  markAllAsRead: vi.fn(),
  markAsRead: vi.fn(),
  startTyping: vi.fn(),
  stopTyping: vi.fn(),
}));

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: mocks.apiFetch,
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: mocks.diagnostic,
}));

vi.mock('@/hooks/useRealtimeMessages', () => ({
  useRealtimeMessages: () => ({
    isConnected: true,
    startTyping: mocks.startTyping,
    stopTyping: mocks.stopTyping,
    markAsRead: mocks.markAsRead,
    markAllAsRead: mocks.markAllAsRead,
  }),
}));

vi.mock('@/components/messaging/RevealIdentityCard', () => ({
  RevealIdentityCard: () => <div data-testid="reveal-card" />,
}));

vi.mock('@/components/messaging/MessageThread', () => ({
  MessageThread: ({
    otherPartyName,
    onSendMessage,
  }: {
    otherPartyName: string;
    onSendMessage: (content: string) => void | Promise<void>;
  }) => (
    <div>
      <p data-testid="other-party-name">{otherPartyName}</p>
      <button
        type="button"
        onClick={async () => {
          try {
            await onSendMessage('Proof review follow-up');
          } catch (error) {
            window.dispatchEvent(
              new CustomEvent('realtime-send-rejected', {
                detail: error instanceof Error ? error.message : String(error),
              })
            );
          }
        }}
      >
        Send through thread
      </button>
    </div>
  ),
}));

import { RealtimeMessageThread } from '@/components/messaging/RealtimeMessageThread';

describe('RealtimeMessageThread', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.apiFetch.mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });
  });

  it('rethrows send failures after recording diagnostics so the composer can keep the draft', async () => {
    const rejectedMessages: string[] = [];
    const listener = (event: Event) => {
      rejectedMessages.push((event as CustomEvent<string>).detail);
    };
    window.addEventListener('realtime-send-rejected', listener);

    render(
      <RealtimeMessageThread
        conversationId="conversation-1"
        initialMessages={[]}
        currentUserId="user-1"
        otherPartyName="Organization"
        stage="masked"
        onSendMessage={vi.fn().mockRejectedValue(new Error('Conversation not found'))}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Send through thread' }));

    await waitFor(() => {
      expect(rejectedMessages).toEqual([
        'Message could not be sent. Your draft is still here; please try again.',
      ]);
    });
    expect(mocks.stopTyping).toHaveBeenCalled();
    expect(mocks.diagnostic).toHaveBeenCalledWith('messages.thread.send_failed', expect.any(Error));

    window.removeEventListener('realtime-send-rejected', listener);
  });

  it('normalizes placeholder participant names after conversation refresh', async () => {
    mocks.apiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        conversation: {
          stage: 'masked',
          currentUserWantsReveal: false,
          otherUserWantsReveal: false,
          canReveal: true,
        },
        otherParticipant: {
          displayName: 'Unknown',
          handle: null,
          avatarUrl: null,
        },
      }),
    });

    render(
      <RealtimeMessageThread
        conversationId="conversation-1"
        initialMessages={[]}
        currentUserId="user-1"
        otherPartyName="Unknown"
        stage="masked"
        onSendMessage={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('other-party-name')).toHaveTextContent('Masked participant');
    });
    expect(screen.queryByText('Unknown')).not.toBeInTheDocument();
  });
});
