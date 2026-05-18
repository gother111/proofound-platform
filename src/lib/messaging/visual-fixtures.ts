import { isMockSupabaseEnabled } from '@/lib/env';

export const VISUAL_CONVERSATION_IDS = {
  masked: 'visual-masked-conversation',
  revealed: 'visual-revealed-conversation',
} as const;

export function visualMessagingFixturesEnabled() {
  return (
    isMockSupabaseEnabled() &&
    process.env.PROOFOUND_VISUAL_FIXTURES === 'true' &&
    process.env.VERCEL_ENV !== 'production'
  );
}

export function buildVisualConversations(currentUserId: string) {
  const now = new Date();
  const recentMessageAt = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  const yesterdayMessageAt = new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString();
  const otherMaskedUserId = 'visual-org-reviewer';
  const otherRevealedUserId = 'visual-candidate-reviewer';

  return [
    {
      id: VISUAL_CONVERSATION_IDS.masked,
      matchId: 'visual-match-masked',
      assignmentId: 'visual-assignment-privacy',
      assignmentRole:
        'Privacy-safe proof review for a launch corridor with intentionally long assignment title',
      participantOneId: currentUserId,
      participantTwoId: otherMaskedUserId,
      stage: 'masked',
      lastMessageAt: recentMessageAt,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      otherParty: {
        id: otherMaskedUserId,
        displayName: 'Organization',
        displayAvatar: null,
        persona: 'organization',
      },
      lastMessage: {
        id: 'visual-message-3',
        content:
          'Thanks. I can review the proof pack and keep identity details bounded until reveal.',
        sentAt: recentMessageAt,
      },
      unreadCount: 2,
    },
    {
      id: VISUAL_CONVERSATION_IDS.revealed,
      matchId: 'visual-match-revealed',
      assignmentId: 'visual-assignment-readiness',
      assignmentRole: 'Evidence operations lead',
      participantOneId: currentUserId,
      participantTwoId: otherRevealedUserId,
      stage: 'revealed',
      lastMessageAt: yesterdayMessageAt,
      createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      otherParty: {
        id: otherRevealedUserId,
        displayName: 'Elena Proof Reviewer',
        displayAvatar: null,
        persona: 'individual',
      },
      lastMessage: {
        id: 'visual-message-6',
        content:
          'The public proof summary is clear. I would keep the next step focused on one review action.',
        sentAt: yesterdayMessageAt,
      },
      unreadCount: 0,
    },
  ];
}

export function buildVisualConversationDetails(conversationId: string, currentUserId: string) {
  const conversation = buildVisualConversations(currentUserId).find(
    (item) => item.id === conversationId
  );

  if (!conversation) {
    return null;
  }

  return {
    conversation: {
      id: conversation.id,
      matchId: conversation.matchId,
      stage: conversation.stage,
      revealedAt:
        conversation.stage === 'revealed'
          ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          : null,
      lastMessageAt: conversation.lastMessageAt,
      createdAt: conversation.createdAt,
      currentUserWantsReveal: conversation.stage === 'masked',
      otherUserWantsReveal: false,
      canReveal: conversation.stage === 'masked',
    },
    otherParticipant:
      conversation.stage === 'revealed'
        ? {
            id: conversation.participantTwoId,
            handle: 'elena-proof',
            displayName: conversation.otherParty.displayName,
            avatarUrl: null,
            persona: 'individual',
          }
        : {
            id: conversation.participantTwoId,
            handle: null,
            displayName: 'Organization',
            avatarUrl: null,
            persona: 'unknown' as const,
            masked: true,
          },
  };
}

export function buildVisualMessages(conversationId: string, currentUserId: string) {
  const now = new Date();
  const recentMessageAt = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  const recentReadAt = new Date(now.getTime() - 12 * 60 * 1000).toISOString();
  const earlierMessageAt = new Date(now.getTime() - 33 * 60 * 1000).toISOString();
  const earliestMessageAt = new Date(now.getTime() - 46 * 60 * 1000).toISOString();
  const yesterdayMessageAt = new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString();
  const yesterdayEarlierAt = new Date(
    now.getTime() - 18 * 60 * 60 * 1000 - 15 * 60 * 1000
  ).toISOString();
  const yesterdayEarliestAt = new Date(
    now.getTime() - 18 * 60 * 60 * 1000 - 25 * 60 * 1000
  ).toISOString();
  const otherUserId =
    conversationId === VISUAL_CONVERSATION_IDS.revealed
      ? 'visual-candidate-reviewer'
      : 'visual-org-reviewer';

  if (conversationId === VISUAL_CONVERSATION_IDS.revealed) {
    return [
      {
        id: 'visual-message-4',
        conversationId,
        senderId: otherUserId,
        content:
          'I read the proof pack. The outcome is easy to inspect, but the first action should stay narrow.',
        sentAt: yesterdayEarliestAt,
        readAt: yesterdayEarlierAt,
        isOwnMessage: false,
      },
      {
        id: 'visual-message-5',
        conversationId,
        senderId: currentUserId,
        content:
          'Agreed. I will keep the next step to one review action and leave the supporting details below it.',
        sentAt: yesterdayEarlierAt,
        readAt: yesterdayEarlierAt,
        isOwnMessage: true,
      },
      {
        id: 'visual-message-6',
        conversationId,
        senderId: otherUserId,
        content:
          'The public proof summary is clear. I would keep the next step focused on one review action.',
        sentAt: yesterdayMessageAt,
        readAt: null,
        isOwnMessage: false,
      },
    ];
  }

  return [
    {
      id: 'visual-message-1',
      conversationId,
      senderId: currentUserId,
      content:
        'I can share the relevant proof context, but I want to keep personal contact details private until both sides approve reveal.',
      sentAt: earliestMessageAt,
      readAt: earlierMessageAt,
      isOwnMessage: true,
    },
    {
      id: 'visual-message-2',
      conversationId,
      senderId: otherUserId,
      content: 'That works. Please point me to the strongest artifact and the outcome it supports.',
      sentAt: earlierMessageAt,
      readAt: recentReadAt,
      isOwnMessage: false,
    },
    {
      id: 'visual-message-3',
      conversationId,
      senderId: otherUserId,
      content:
        'Thanks. I can review the proof pack and keep identity details bounded until reveal.',
      sentAt: recentMessageAt,
      readAt: null,
      isOwnMessage: false,
    },
  ];
}
