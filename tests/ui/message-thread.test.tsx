import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MessageThread } from '@/components/messaging/MessageThread';

describe('MessageThread', () => {
  beforeEach(() => {
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('shows send failures inline and keeps the draft in the active thread composer', async () => {
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);
    const onSendMessage = vi
      .fn()
      .mockRejectedValue(new Error('The message service is unavailable.'));

    render(
      <MessageThread
        conversationId="conversation-1"
        messages={[]}
        currentUserId="user-1"
        otherPartyName="Organization"
        stage="masked"
        onSendMessage={onSendMessage}
      />
    );

    fireEvent.change(
      screen.getByPlaceholderText('Type your message... (paste and drag-drop disabled)'),
      {
        target: { value: 'Can we keep the next step tied to the proof review?' },
      }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Message not sent');
    expect(alert).toHaveTextContent('The message service is unavailable.');
    expect(
      screen.getByPlaceholderText('Type your message... (paste and drag-drop disabled)')
    ).toHaveValue('Can we keep the next step tied to the proof review?');
    expect(onSendMessage).toHaveBeenCalledWith(
      'Can we keep the next step tied to the proof review?'
    );
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('clears the inline send failure when the draft changes', async () => {
    const onSendMessage = vi
      .fn()
      .mockRejectedValue(new Error('Reveal approval is still required.'));

    render(
      <MessageThread
        conversationId="conversation-1"
        messages={[]}
        currentUserId="user-1"
        otherPartyName="Organization"
        stage="masked"
        onSendMessage={onSendMessage}
      />
    );

    const composer = screen.getByPlaceholderText(
      'Type your message... (paste and drag-drop disabled)'
    );

    fireEvent.change(composer, {
      target: { value: 'Here is a short follow-up.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Reveal approval is still required.'
    );

    fireEvent.change(composer, {
      target: { value: 'Here is a cleaner follow-up.' },
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
