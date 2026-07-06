import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MessageThread } from '@/components/messaging/MessageThread';
import { Toaster } from '@/components/ui/toaster';

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

  it('frames empty masked threads as proof-safe review conversations', () => {
    render(
      <MessageThread
        conversationId="conversation-1"
        messages={[]}
        currentUserId="user-1"
        otherPartyName="Organization"
        stage="masked"
        onSendMessage={vi.fn()}
      />
    );

    expect(screen.getByText('No messages yet')).toBeInTheDocument();
    expect(
      screen.getByText(/keep the first note tied to the assignment, proof, or reveal step/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/text-only; paste\/drop disabled for proof-review privacy/i)
    ).toBeInTheDocument();
    const composer = screen.getByRole('textbox', { name: 'Proof-review message' });
    expect(composer).toHaveAccessibleDescription(
      /text-only; paste\/drop disabled for proof-review privacy/i
    );
    expect(composer).toHaveAccessibleDescription(/0\/500/i);
    expect(screen.queryByText(/say hello/i)).not.toBeInTheDocument();
  });

  it('shows missing masked participant details as an intentional privacy state', () => {
    const { container } = render(
      <MessageThread
        conversationId="conversation-1"
        messages={[]}
        currentUserId="user-1"
        otherPartyName="Unknown"
        stage="masked"
        onSendMessage={vi.fn()}
      />
    );

    expect(screen.getByText('Masked participant')).toBeInTheDocument();
    expect(screen.getByText('MP')).toBeInTheDocument();
    expect(screen.getByText('Identity protected until reveal approval')).toBeInTheDocument();
    expect(container).not.toHaveTextContent('Unknown');
  });

  it('keeps the mobile back control at a comfortable touch size', () => {
    render(
      <MessageThread
        conversationId="conversation-1"
        messages={[]}
        currentUserId="user-1"
        otherPartyName="Organization"
        stage="masked"
        onBack={vi.fn()}
        onSendMessage={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Back to conversations' })).toHaveClass(
      'h-11',
      'w-11',
      'shrink-0'
    );
  });

  it('explains blocked paste and drop actions without internal policy codes', () => {
    const { container } = render(
      <>
        <MessageThread
          conversationId="conversation-1"
          messages={[]}
          currentUserId="user-1"
          otherPartyName="Organization"
          stage="masked"
          onSendMessage={vi.fn()}
        />
        <Toaster />
      </>
    );

    const composer = screen.getByPlaceholderText(
      'Type your message... (paste and drag-drop disabled)'
    );

    fireEvent.paste(composer, {
      clipboardData: {
        getData: () => 'private proof note',
      },
    });

    expect(screen.getByText('Paste disabled')).toBeInTheDocument();
    expect(
      screen.getByText('Type the message directly so this proof-review thread stays text-only.')
    ).toBeInTheDocument();

    fireEvent.drop(composer, {
      dataTransfer: {
        getData: () => 'dropped note',
      },
    });

    expect(screen.getByText('Drop disabled')).toBeInTheDocument();
    expect(
      screen.getByText('Files and dropped content are blocked in proof-review messages.')
    ).toBeInTheDocument();
    expect(container).not.toHaveTextContent(/PRD I-20/i);
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
    expect(alert).toHaveTextContent(
      'Message could not be sent. Your draft is still here; please try again.'
    );
    expect(alert).not.toHaveTextContent('The message service is unavailable.');
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
      'Message could not be sent. Your draft is still here; please try again.'
    );
    expect(screen.queryByText('Reveal approval is still required.')).not.toBeInTheDocument();

    fireEvent.change(composer, {
      target: { value: 'Here is a cleaner follow-up.' },
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
