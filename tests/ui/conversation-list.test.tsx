import React from 'react';
import { render, screen } from '@testing-library/react';
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
    render(<ConversationList conversations={[]} onSelect={vi.fn()} mode="individual" />);

    expect(
      screen.getByText('Conversations appear after a proof-safe introduction.')
    ).toBeInTheDocument();
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
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
});
