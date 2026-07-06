import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RevealIdentityCard } from '@/components/messaging/RevealIdentityCard';
import { Toaster } from '@/components/ui/toaster';

describe('RevealIdentityCard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('frames unopened reveal as a masked review thread', () => {
    const { container } = render(
      <RevealIdentityCard
        currentUserWantsReveal={false}
        otherUserWantsReveal={false}
        onReveal={vi.fn()}
      />
    );

    expect(screen.getByText('Masked review thread')).toBeInTheDocument();
    expect(screen.getByText('Request Identity Reveal')).toBeInTheDocument();
    expect(
      screen.getByText('Both people must agree before approved identity fields are shown')
    ).toBeInTheDocument();
    expect(container).not.toHaveTextContent('Anonymous Conversation');
    expect(container).not.toHaveTextContent('Reveal My Identity');
  });

  it('keeps the pending state stage-scoped and free of duplicated wording', () => {
    const { container } = render(
      <RevealIdentityCard
        currentUserWantsReveal={true}
        otherUserWantsReveal={false}
        onReveal={vi.fn()}
      />
    );

    expect(screen.getByText('Reveal request pending')).toBeInTheDocument();
    expect(
      screen.getByText(
        "You've requested the reveal step. The other person can approve the stage-scoped identity fields or keep the thread masked."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('Approved identity fields become visible only when the other person agrees')
    ).toBeInTheDocument();
    expect(container).not.toHaveTextContent('approve approved');
    expect(container).not.toHaveTextContent('Waiting for Response');
  });

  it('lets the user approve requested reveal without broadening the privacy promise', async () => {
    const onReveal = vi.fn().mockResolvedValue({ revealed: false });
    const { container } = render(
      <>
        <RevealIdentityCard
          currentUserWantsReveal={false}
          otherUserWantsReveal={true}
          onReveal={onReveal}
        />
        <Toaster />
      </>
    );

    expect(screen.getByText('Reveal approval requested')).toBeInTheDocument();
    expect(screen.getByText('You can keep the thread masked if you prefer')).toBeInTheDocument();
    expect(container).not.toHaveTextContent('continue the conversation anonymously');

    fireEvent.click(screen.getByRole('button', { name: 'Agree To Reveal Approved Fields' }));

    expect(await screen.findByText('Reveal Approved Identity Fields?')).toBeInTheDocument();
    expect(
      screen.getByText('Public Page publication does not widen this reveal by itself.')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reveal Approved Fields' }));

    await waitFor(() => {
      expect(onReveal).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText('Reveal request sent')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The other person will be notified. Approved identity fields stay hidden until they agree.'
      )
    ).toBeInTheDocument();
  });

  it('keeps reveal request failures retryable without exposing raw service text', async () => {
    const onReveal = vi.fn().mockRejectedValue(new Error('Conversation not found'));

    render(
      <>
        <RevealIdentityCard
          currentUserWantsReveal={false}
          otherUserWantsReveal={false}
          onReveal={onReveal}
        />
        <Toaster />
      </>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Request Identity Reveal' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm & Request' }));

    expect(await screen.findByText('Reveal request not sent')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Reveal request could not be sent. The thread remains masked; please try again.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText('Conversation not found')).not.toBeInTheDocument();
  });

  it('keeps reveal approval failures retryable without exposing raw service text', async () => {
    const onReveal = vi.fn().mockRejectedValue(new Error('Reveal state transition denied'));

    render(
      <>
        <RevealIdentityCard
          currentUserWantsReveal={false}
          otherUserWantsReveal={true}
          onReveal={onReveal}
        />
        <Toaster />
      </>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Agree To Reveal Approved Fields' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Reveal Approved Fields' }));

    expect(await screen.findByText('Reveal approval not recorded')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Reveal approval could not be recorded. The thread remains masked; please try again.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText('Reveal state transition denied')).not.toBeInTheDocument();
  });
});
