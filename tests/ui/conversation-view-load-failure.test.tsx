import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConversationView } from '@/components/messaging/ConversationView';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: vi.fn(),
}));

function conversationResponse() {
  return {
    ok: true,
    json: async () => ({
      conversation: {
        id: 'conversation-1',
        matchId: 'match-1',
        stage: 'masked',
        revealedAt: null,
        lastMessageAt: null,
        createdAt: '2026-03-20T10:00:00.000Z',
        currentUserWantsReveal: false,
        otherUserWantsReveal: false,
        canReveal: false,
      },
      otherParticipant: {
        id: 'org-1',
        handle: null,
        displayName: 'Nordic Future Labs',
        avatarUrl: null,
        persona: 'org_member',
        masked: true,
      },
    }),
  };
}

function messagesResponse() {
  return {
    ok: true,
    json: async () => ({
      messages: [],
    }),
  };
}

describe('ConversationView load failure recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps conversation load failures safe, diagnostic, and retryable', async () => {
    vi.mocked(apiFetch)
      .mockRejectedValueOnce(new Error('raw database conversation outage'))
      .mockResolvedValueOnce(messagesResponse() as any)
      .mockResolvedValueOnce(conversationResponse() as any)
      .mockResolvedValueOnce(messagesResponse() as any);

    const { container } = render(<ConversationView conversationId="conversation-1" />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Conversation thread could not load');
    expect(alert).toHaveTextContent('Messages, reveal requests, and review context are still safe');
    expect(alert).toHaveTextContent('Privacy and reveal state were not changed.');
    expect(container).not.toHaveTextContent('raw database conversation outage');
    expect(dispatchClientErrorDiagnostic).toHaveBeenCalledWith(
      'messages.conversation_view.load_failed',
      expect.any(Error)
    );

    fireEvent.click(screen.getByRole('button', { name: 'Retry thread messages' }));

    await waitFor(() => {
      expect(screen.getByText('Nordic Future Labs')).toBeInTheDocument();
    });
    expect(screen.getByText('Identity protected')).toBeInTheDocument();
    expect(screen.getByText('No messages yet')).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledTimes(4);
  });

  it('keeps message load failures from exposing raw service text', async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce(conversationResponse() as any)
      .mockRejectedValueOnce(new Error('raw message table timeout'));

    const { container } = render(<ConversationView conversationId="conversation-1" />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Conversation thread could not load');
    expect(alert).toHaveTextContent('retry before replying');
    expect(container).not.toHaveTextContent('raw message table timeout');
    expect(dispatchClientErrorDiagnostic).toHaveBeenCalledWith(
      'messages.conversation_view.load_failed',
      expect.any(Error)
    );
  });
});
