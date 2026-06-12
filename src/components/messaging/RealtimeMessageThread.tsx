'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MessageThread, type Message as ThreadMessage } from './MessageThread';
import { useRealtimeMessages, type Message as RealtimeMessage } from '@/hooks/useRealtimeMessages';
import { RevealIdentityCard } from './RevealIdentityCard';
import { Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { getConversationParticipantLabel } from '@/lib/messaging/participant-label';
import { createMessageSendRetryError } from '@/lib/messaging/send-errors';

export interface RealtimeMessageThreadProps {
  conversationId: string;
  initialMessages: ThreadMessage[];
  currentUserId: string;
  otherPartyName: string;
  otherPartyAvatar?: string;
  stage: 'masked' | 'revealed';
  onSendMessage: (content: string) => Promise<void>;
  onBack?: () => void;
}

/**
 * Real-time enabled message thread component
 *
 * Wraps MessageThread with real-time capabilities:
 * - Live message updates
 * - Read receipts
 * - Typing indicators
 * - Connection status
 */
export function RealtimeMessageThread({
  conversationId,
  initialMessages,
  currentUserId,
  otherPartyName,
  otherPartyAvatar,
  stage,
  onSendMessage,
  onBack,
}: RealtimeMessageThreadProps) {
  const isVisualFixture = conversationId.startsWith('visual-');
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [conversationState, setConversationState] = useState<{
    stage: 'masked' | 'revealed';
    currentUserWantsReveal: boolean;
    otherUserWantsReveal: boolean;
    canReveal: boolean;
    otherPartyName: string;
    otherPartyAvatar?: string;
  }>({
    stage,
    currentUserWantsReveal: false,
    otherUserWantsReveal: false,
    canReveal: stage === 'masked',
    otherPartyName,
    otherPartyAvatar,
  });

  const refreshConversationState = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/conversations/${conversationId}`);
      if (!response.ok) return;

      const data = await response.json();
      const nextStage = data.conversation?.stage === 'revealed' ? 'revealed' : 'masked';
      setConversationState({
        stage: nextStage,
        currentUserWantsReveal: Boolean(data.conversation?.currentUserWantsReveal),
        otherUserWantsReveal: Boolean(data.conversation?.otherUserWantsReveal),
        canReveal: Boolean(data.conversation?.canReveal),
        otherPartyName: getConversationParticipantLabel({
          stage: nextStage,
          displayName: data.otherParticipant?.displayName,
          handle: data.otherParticipant?.handle,
          fallbackName: otherPartyName,
        }),
        otherPartyAvatar: data.otherParticipant?.avatarUrl || otherPartyAvatar,
      });
    } catch (error) {
      dispatchClientErrorDiagnostic('messages.thread.conversation_refresh_failed', error);
    }
  }, [conversationId, otherPartyAvatar, otherPartyName]);

  const handleRevealIdentities = useCallback(async () => {
    const response = await apiFetch(`/api/conversations/${conversationId}/reveal`, {
      method: 'POST',
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to request reveal');
    }

    await refreshConversationState();
    return data;
  }, [conversationId, refreshConversationState]);

  // Real-time messaging hook
  const { isConnected, startTyping, stopTyping, markAsRead, markAllAsRead } = useRealtimeMessages({
    conversationId,
    userId: currentUserId,
    disabled: isVisualFixture,
    onNewMessage: useCallback((message: RealtimeMessage) => {
      // Convert to ThreadMessage format
      const threadMessage: ThreadMessage = {
        id: message.id,
        senderId: message.sender_id,
        content: message.content,
        sentAt: new Date(message.sent_at),
        readAt: message.read_at ? new Date(message.read_at) : undefined,
      };

      setMessages((prev) => {
        // Check if message already exists (avoid duplicates)
        if (prev.some((m) => m.id === threadMessage.id)) {
          return prev;
        }
        return [...prev, threadMessage];
      });

      // Note: markAsRead will be called after this callback is set up
      // We'll handle auto-marking as read in a separate effect
    }, []),
    onMessageRead: useCallback((messageId: string) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, readAt: new Date() } : m))
      );
    }, []),
    onTypingStart: useCallback((userId: string) => {
      setIsOtherUserTyping(true);
      setTypingUserId(userId);
    }, []),
    onTypingStop: useCallback((userId: string) => {
      setIsOtherUserTyping(false);
      setTypingUserId(null);
    }, []),
  });

  // Update messages when initialMessages change
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    setConversationState((prev) => ({
      ...prev,
      stage,
      canReveal: stage === 'masked',
      otherPartyName: getConversationParticipantLabel({
        stage,
        displayName: otherPartyName,
      }),
      otherPartyAvatar,
    }));
  }, [otherPartyAvatar, otherPartyName, stage]);

  useEffect(() => {
    refreshConversationState();
  }, [refreshConversationState]);

  // Auto-mark new messages as read when visible
  useEffect(() => {
    if (document.visibilityState === 'visible' && messages.length > 0) {
      const unreadMessages = messages.filter((m) => !m.readAt && m.senderId !== currentUserId);
      if (unreadMessages.length > 0) {
        const latestUnread = unreadMessages[unreadMessages.length - 1];
        setTimeout(() => {
          markAsRead(latestUnread.id);
        }, 1000);
      }
    }
  }, [messages, currentUserId, markAsRead]);

  // Mark all messages as read when component mounts and is visible
  useEffect(() => {
    if (document.visibilityState === 'visible') {
      markAllAsRead();
    }
  }, [markAllAsRead]);

  // Handle visibility change (mark as read when tab becomes visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        markAllAsRead();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [markAllAsRead]);

  // Handle send message
  const handleSend = async (content: string) => {
    try {
      // Stop typing indicator
      stopTyping();

      // Call parent's send handler
      await onSendMessage(content);

      // Optimistically add message to UI
      const optimisticMessage: ThreadMessage = {
        id: `temp-${Date.now()}`,
        senderId: currentUserId,
        content,
        sentAt: new Date(),
      };

      setMessages((prev) => [...prev, optimisticMessage]);
    } catch (error) {
      dispatchClientErrorDiagnostic('messages.thread.send_failed', error);
      throw createMessageSendRetryError();
    }
  };

  return (
    <div className="relative h-full min-h-0 w-full min-w-0 flex flex-col">
      {/* Connection status indicator */}
      {!isVisualFixture && (
        <div className="absolute top-2 right-2 z-10">
          <Badge
            variant={isConnected ? 'default' : 'destructive'}
            className="flex items-center gap-1 text-xs"
          >
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3" />
                <span>Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                <span>Connecting...</span>
              </>
            )}
          </Badge>
        </div>
      )}

      {conversationState.canReveal && (
        <div className="border-b bg-background p-4">
          <RevealIdentityCard
            currentUserWantsReveal={conversationState.currentUserWantsReveal}
            otherUserWantsReveal={conversationState.otherUserWantsReveal}
            onReveal={handleRevealIdentities}
          />
        </div>
      )}

      {/* Message thread */}
      <MessageThread
        conversationId={conversationId}
        messages={messages}
        currentUserId={currentUserId}
        otherPartyName={conversationState.otherPartyName}
        otherPartyAvatar={conversationState.otherPartyAvatar}
        stage={conversationState.stage}
        isTyping={isOtherUserTyping}
        onSendMessage={handleSend}
        onBack={onBack}
      />
    </div>
  );
}
