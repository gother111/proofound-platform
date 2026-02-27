/**
 * Messages Page - Organization
 *
 * Two-column layout: conversation list + message thread
 * Same as individual version but for organizations
 *
 * Supports URL param: ?conversation=<id> to auto-select a conversation
 */

'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ConversationList, type Conversation } from '@/components/messaging/ConversationList';
import { RealtimeMessageThread } from '@/components/messaging/RealtimeMessageThread';
import { type Message } from '@/components/messaging/MessageThread';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const dynamic = 'force-dynamic';

function OrganizationMessagesPageContent() {
  const searchParams = useSearchParams();
  const conversationParam = searchParams?.get('conversation');
  const pathname = usePathname();
  const router = useRouter();

  const { userId: currentUserId, isLoading: isAuthLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  // Load conversations on mount (after auth is ready)
  useEffect(() => {
    if (!isAuthLoading && currentUserId) {
      loadConversations();
    }
  }, [isAuthLoading, currentUserId]);

  // Auto-select conversation from URL param after conversations are loaded
  useEffect(() => {
    if (conversationParam && conversations.length > 0 && !hasAutoSelected) {
      // Check if the conversation exists in the list
      const exists = conversations.some((c) => c.id === conversationParam);
      if (exists) {
        setSelectedConversationId(conversationParam);
        setHasAutoSelected(true);
      }
    }
  }, [conversationParam, conversations, hasAutoSelected]);

  const loadConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        // Transform API response to match ConversationList component interface
        const transformedConversations = (data.conversations || []).map((conv: any) => ({
          id: conv.id,
          otherPartyName: conv.otherParty?.displayName || 'Unknown',
          otherPartyAvatar: conv.otherParty?.displayAvatar,
          lastMessage: conv.lastMessage?.content || '',
          lastMessageAt: conv.lastMessageAt || conv.createdAt,
          unreadCount: conv.unreadCount || 0,
          matchId: conv.matchId,
          assignmentTitle: conv.assignmentRole,
          stage: conv.stage === 'revealed' ? 'revealed' : 'masked',
        }));
        setConversations(transformedConversations);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMessages = useCallback(
    async (conversationId: string) => {
      setIsLoadingMessages(true);
      try {
        const response = await fetch(`/api/conversations/${conversationId}/messages`);
        if (response.ok) {
          const data = await response.json();
          // Transform messages to have Date objects for RealtimeMessageThread
          const transformedMessages = (data.messages || []).map((msg: any) => ({
            id: msg.id,
            senderId:
              msg.senderId ||
              msg.sender_id ||
              msg.sender?.id ||
              (msg.isOwnMessage ? currentUserId : 'unknown'),
            content: msg.content,
            sentAt: new Date(msg.sentAt || msg.sent_at),
            readAt: msg.readAt || msg.read_at ? new Date(msg.readAt || msg.read_at) : undefined,
          }));
          setMessages(transformedMessages);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [currentUserId]
  );

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
    }
  }, [selectedConversationId, loadMessages]);

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId) return;

    try {
      const response = await fetch(`/api/conversations/${selectedConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.message) {
          const normalizedMessage = {
            id: data.message.id,
            senderId: currentUserId || 'unknown',
            content: data.message.content,
            sentAt: new Date(
              data.message.sentAt || data.message.sent_at || new Date().toISOString()
            ),
            readAt:
              data.message.readAt || data.message.read_at
                ? new Date(data.message.readAt || data.message.read_at)
                : undefined,
          };
          setMessages((prev) => [...prev, normalizedMessage]);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  const handleBackToConversationList = () => {
    setSelectedConversationId(undefined);
    router.replace(pathname ?? '/app');
  };

  // Show loading state if auth is not ready
  if (isAuthLoading || !currentUserId) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-[#6B6760]">Loading...</p>
      </div>
    );
  }

  const isV2 = process.env.NEXT_PUBLIC_UI_REFACTOR_V2 === 'true';
  const rightPaneBgClass = isV2 ? 'bg-transparent' : 'bg-[#F7F6F1]';

  return (
    <div className="h-full min-h-[calc(100vh-3.5rem)] flex flex-col md:flex-row">
      {/* Left: Conversation List */}
      <div
        className={`w-full min-h-0 md:w-80 flex-shrink-0 ${
          selectedConversationId ? 'hidden md:block' : 'block'
        }`}
      >
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversationId}
          onSelect={setSelectedConversationId}
          isLoading={isLoadingConversations}
        />
      </div>

      {/* Right: Message Thread or Empty State */}
      <div
        className={`h-full min-h-0 min-w-0 flex-1 ${rightPaneBgClass} ${
          !selectedConversationId ? 'hidden md:flex md:items-center md:justify-center' : 'flex'
        }`}
      >
        {selectedConversation ? (
          <RealtimeMessageThread
            conversationId={selectedConversation.id}
            initialMessages={messages}
            currentUserId={currentUserId}
            otherPartyName={selectedConversation.otherPartyName}
            otherPartyAvatar={selectedConversation.otherPartyAvatar}
            stage={selectedConversation.stage}
            onSendMessage={handleSendMessage}
            onBack={handleBackToConversationList}
          />
        ) : (
          <div className="text-center space-y-4">
            <MessageSquare className="h-16 w-16 mx-auto text-[#6B6760] opacity-50" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-[#2D3330]">Select a conversation</p>
              <p className="text-sm text-[#6B6760]">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function OrganizationMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <p className="text-[#6B6760]">Loading...</p>
        </div>
      }
    >
      <OrganizationMessagesPageContent />
    </Suspense>
  );
}
