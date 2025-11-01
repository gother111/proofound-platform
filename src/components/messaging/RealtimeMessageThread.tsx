'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MessageThread, type Message as ThreadMessage } from './MessageThread';
import { useRealtimeMessages, type Message as RealtimeMessage } from '@/hooks/useRealtimeMessages';
import { toast } from 'sonner';
import { Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RealtimeMessageThreadProps {
  conversationId: string;
  initialMessages: ThreadMessage[];
  currentUserId: string;
  otherPartyName: string;
  otherPartyAvatar?: string;
  stage: 'masked' | 'revealed';
  onSendMessage: (content: string) => Promise<void>;
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
}: RealtimeMessageThreadProps) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);

  // Real-time messaging hook
  const { isConnected, startTyping, stopTyping, markAsRead, markAllAsRead } = useRealtimeMessages({
    conversationId,
    userId: currentUserId,
    onNewMessage: useCallback(
      (message: RealtimeMessage) => {
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

        // Auto-mark as read if conversation is visible
        if (document.visibilityState === 'visible') {
          setTimeout(() => {
            markAsRead(message.id);
          }, 1000);
        }
      },
      [markAsRead]
    ),
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
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* Connection status indicator */}
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

      {/* Message thread */}
      <MessageThread
        conversationId={conversationId}
        messages={messages}
        currentUserId={currentUserId}
        otherPartyName={otherPartyName}
        otherPartyAvatar={otherPartyAvatar}
        stage={stage}
        isTyping={isOtherUserTyping}
        onSendMessage={handleSend}
      />
    </div>
  );
}
