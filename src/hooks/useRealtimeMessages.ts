import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
  read_at: string | null;
  edited_at: string | null;
}

interface UseRealtimeMessagesOptions {
  conversationId: string;
  userId: string;
  onNewMessage?: (message: Message) => void;
  onMessageRead?: (messageId: string) => void;
  onTypingStart?: (userId: string) => void;
  onTypingStop?: (userId: string) => void;
}

/**
 * Hook for real-time messaging using Supabase Realtime
 *
 * Features:
 * - Subscribe to new messages in a conversation
 * - Subscribe to read receipts
 * - Subscribe to typing indicators
 * - Automatic reconnection on connection loss
 */
export function useRealtimeMessages({
  conversationId,
  userId,
  onNewMessage,
  onMessageRead,
  onTypingStart,
  onTypingStop,
}: UseRealtimeMessagesOptions) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const supabase = createClient();

  // Initialize realtime subscription
  useEffect(() => {
    if (!conversationId || !userId) return;

    const channelName = `conversation:${conversationId}`;

    // Create channel
    const realtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;

          // Don't show notification for own messages
          if (newMessage.sender_id !== userId) {
            onNewMessage?.(newMessage);

            // Show toast notification
            toast.info('New message received');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;

          // Handle read receipt
          if (updatedMessage.read_at && !payload.old.read_at) {
            onMessageRead?.(updatedMessage.id);
          }
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = realtimeChannel.presenceState();
        const presentUsers = Object.keys(state);

        // Check if other user is typing
        const otherUsers = presentUsers.filter((id) => id !== userId);
        const someoneTyping = otherUsers.some((id) => {
          const userState = state[id];
          return userState && userState[0]?.typing === true;
        });

        if (someoneTyping && !isTyping) {
          onTypingStart?.(otherUsers[0]);
        } else if (!someoneTyping && isTyping) {
          onTypingStop?.(otherUsers[0]);
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);

          // Track presence
          await realtimeChannel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
            typing: false,
          });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          toast.error('Connection lost. Reconnecting...');
        }
      });

    setChannel(realtimeChannel);

    // Cleanup on unmount
    return () => {
      realtimeChannel.unsubscribe();
      setChannel(null);
      setIsConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, userId]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(
    async (typing: boolean) => {
      if (!channel) return;

      try {
        await channel.track({
          user_id: userId,
          online_at: new Date().toISOString(),
          typing,
        });
      } catch (error) {
        console.error('Failed to send typing indicator:', error);
      }
    },
    [channel, userId]
  );

  // Start typing (with auto-stop after 3 seconds)
  const startTyping = useCallback(() => {
    if (isTyping) return;

    setIsTyping(true);
    sendTypingIndicator(true);

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Auto-stop typing after 3 seconds
    const timeout = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(false);
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
    }, 3000);

    setTypingTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTyping, typingTimeout]);

  // Stop typing
  const stopTyping = useCallback(() => {
    if (!isTyping) return;

    setIsTyping(false);
    sendTypingIndicator(false);

    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
  }, [isTyping, typingTimeout, sendTypingIndicator]);

  // Mark message as read
  const markAsRead = useCallback(
    async (messageId: string) => {
      try {
        const { error } = await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('id', messageId)
          .eq('conversation_id', conversationId)
          .is('read_at', null);

        if (error) {
          console.error('Failed to mark message as read:', error);
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    },
    [conversationId, supabase]
  );

  // Mark all messages as read
  const markAllAsRead = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .is('read_at', null);

      if (error) {
        console.error('Failed to mark all messages as read:', error);
      }
    } catch (error) {
      console.error('Error marking all messages as read:', error);
    }
  }, [conversationId, userId, supabase]);

  return {
    isConnected,
    startTyping,
    stopTyping,
    markAsRead,
    markAllAsRead,
  };
}
