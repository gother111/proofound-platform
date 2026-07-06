import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ConversationList, type Conversation } from '@/components/messaging/ConversationList';

vi.mock('date-fns', () => ({
  formatDistanceToNow: () => '15 minutes ago',
}));

const baseConversation: Conversation = {
  id: 'conversation-1',
  otherPartyName: 'Organization',
  lastMessage: 'Thanks. I can review the proof pack and keep identity details bounded.',
  lastMessageAt: new Date('2026-05-18T10:00:00.000Z'),
  unreadCount: 2,
  matchId: 'match-1',
  assignmentTitle: 'Privacy-safe proof review for a launch corridor',
  stage: 'masked',
};

describe('ConversationList', () => {
  it('uses empty-state helper copy when no conversations exist', () => {
    const { container } = render(
      <ConversationList conversations={[]} onSelect={vi.fn()} mode="individual" />
    );

    expect(
      screen.getByText('Conversations appear after a proof-safe introduction.')
    ).toBeInTheDocument();
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
    expect(container.querySelectorAll('svg:not([aria-hidden="true"])')).toHaveLength(0);
  });

  it('uses active-list helper copy when conversations exist', () => {
    render(
      <ConversationList conversations={[baseConversation]} onSelect={vi.fn()} mode="individual" />
    );

    expect(
      screen.getByText('Review open introductions and keep each thread tied to its proof corridor.')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Conversations appear after a proof-safe introduction.')
    ).not.toBeInTheDocument();
  });

  it('normalizes missing masked participant labels in the list row', () => {
    const { container } = render(
      <ConversationList
        conversations={[
          {
            ...baseConversation,
            otherPartyName: 'Unknown',
          },
        ]}
        onSelect={vi.fn()}
        mode="individual"
      />
    );

    expect(screen.getByText('Masked participant')).toBeInTheDocument();
    expect(screen.getByText('MP')).toBeInTheDocument();
    expect(container).not.toHaveTextContent('Unknown');
  });

  it('shows a recoverable search empty state for conversation filters', () => {
    const { container } = render(
      <ConversationList conversations={[baseConversation]} onSelect={vi.fn()} mode="individual" />
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Search conversations' }), {
      target: { value: 'billing' },
    });

    expect(screen.getByText('No conversations match “billing”')).toBeInTheDocument();
    expect(container.querySelectorAll('svg:not([aria-hidden="true"])')).toHaveLength(0);
    expect(
      screen.getByText(
        'Search checks participant labels, assignment titles, and recent proof-corridor messages.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(baseConversation.otherPartyName)).not.toBeInTheDocument();

    const clearSearchButton = screen.getByRole('button', { name: 'Clear search' });

    expect(clearSearchButton).toHaveClass('min-h-11');
    expect(clearSearchButton).toHaveClass('focus-visible:ring-2');

    fireEvent.click(clearSearchButton);

    expect(screen.getByText(baseConversation.otherPartyName)).toBeInTheDocument();
    expect(screen.queryByText('No conversations match “billing”')).not.toBeInTheDocument();
  });

  it('keeps load failures separate from the empty conversations state', () => {
    const retry = vi.fn();

    const { container } = render(
      <ConversationList
        conversations={[]}
        onSelect={vi.fn()}
        mode="individual"
        loadError="Your conversation threads are still safe. Retry this section to load messages."
        onRetry={retry}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Conversations could not load');
    expect(container.querySelectorAll('svg:not([aria-hidden="true"])')).toHaveLength(0);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Your conversation threads are still safe. Retry this section to load messages.'
    );
    expect(screen.queryByText('No conversations yet')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry conversations' }));

    expect(retry).toHaveBeenCalledTimes(1);
  });
});
