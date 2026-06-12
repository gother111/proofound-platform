import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MessageInput } from '@/components/messaging/MessageInput';

describe('MessageInput', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows send failures inline instead of using a native alert', async () => {
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);
    const onSend = vi.fn().mockRejectedValue(new Error('The message service is unavailable.'));

    const { container } = render(<MessageInput conversationStage="revealed" onSend={onSend} />);

    expect(screen.getByText('Revealed thread: identities visible')).toBeInTheDocument();
    expect(container).not.toHaveTextContent('✅');

    fireEvent.change(screen.getByPlaceholderText('Type your message...'), {
      target: { value: 'Can we keep the next step tied to the proof review?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Message not sent');
    expect(alert).toHaveTextContent(
      'Message could not be sent. Your draft is still here; please try again.'
    );
    expect(alert).not.toHaveTextContent('The message service is unavailable.');
    expect(screen.getByPlaceholderText('Type your message...')).toHaveValue(
      'Can we keep the next step tied to the proof review?'
    );
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('keeps the PII warning flow and shows forced-send failures inline', async () => {
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);
    const onSend = vi
      .fn()
      .mockRejectedValueOnce(
        new Error(
          JSON.stringify({
            type: 'PII_DETECTED',
            message: 'This conversation is still masked. Review before sharing contact details.',
          })
        )
      )
      .mockRejectedValueOnce(new Error('Identity reveal approval is still required.'));

    const { container } = render(<MessageInput conversationStage="masked" onSend={onSend} />);

    expect(screen.getByText('Masked thread: identity protected')).toBeInTheDocument();
    expect(container).not.toHaveTextContent('🔒 Anonymous conversation');

    fireEvent.change(
      screen.getByPlaceholderText(
        'Type your message... (Avoid sharing contact info until identities are revealed)'
      ),
      {
        target: { value: 'Reach me at person@example.com after review.' },
      }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByRole('alertdialog')).toHaveTextContent(
      'This conversation is still masked'
    );
    expect(
      screen.getByText(
        'Consider waiting until identities are revealed before sharing contact information.'
      )
    ).toBeInTheDocument();
    expect(container).not.toHaveTextContent('💡');

    fireEvent.click(screen.getByRole('button', { name: 'Send anyway' }));

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    const alerts = screen.getAllByRole('alert');
    expect(alerts.some((alert) => alert.textContent?.includes('Message not sent'))).toBe(true);
    expect(
      alerts.some((alert) =>
        alert.textContent?.includes(
          'Message could not be sent. Your draft is still here; please try again.'
        )
      )
    ).toBe(true);
    expect(
      screen.queryByText('Identity reveal approval is still required.')
    ).not.toBeInTheDocument();
    expect(onSend).toHaveBeenNthCalledWith(
      1,
      'Reach me at person@example.com after review.',
      false
    );
    expect(onSend).toHaveBeenNthCalledWith(2, 'Reach me at person@example.com after review.', true);
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
