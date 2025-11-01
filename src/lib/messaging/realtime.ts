/**
 * Supabase Realtime Subscriptions for Messaging
 * 
 * Real-time message delivery using Supabase Realtime
 */

import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface MessagePayload {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  sentAt: string;
  readAt: string | null;
}

/**
 * Subscribe to new messages in a conversation
 * 
 * @param conversationId - The conversation to listen to
 * @param onMessage - Callback when a new message is received
 * @returns Unsubscribe function
 */
export function subscribeToConversation(
  conversationId: string,
  onMessage: (message: MessagePayload) => void
): () => void {
  const supabase = createClient();

  // Create channel for this conversation
  const channel: RealtimeChannel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const newMessage = payload.new as MessagePayload;
        onMessage(newMessage);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to conversation updates (stage changes, etc.)
 * 
 * @param conversationId - The conversation to listen to
 * @param onUpdate - Callback when conversation is updated
 * @returns Unsubscribe function
 */
export function subscribeToConversationUpdates(
  conversationId: string,
  onUpdate: (conversation: any) => void
): () => void {
  const supabase = createClient();

  const channel: RealtimeChannel = supabase
    .channel(`conversation-updates:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `id=eq.${conversationId}`,
      },
      (payload) => {
        onUpdate(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Mark message as read
 * 
 * @param messageId - The message ID to mark as read
 */
export async function markMessageAsRead(messageId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', messageId);

  if (error) {
    console.error('Error marking message as read:', error);
  }
}

