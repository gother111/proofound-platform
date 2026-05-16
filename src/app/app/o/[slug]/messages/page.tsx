/**
 * Messages Page - Organization
 *
 * Two-column layout: conversation list + message thread
 * Same as individual version but for organizations
 *
 * Supports URL param: ?conversation=<id> to auto-select a conversation
 */

'use client';

import { useState, useEffect, Suspense, useCallback, type ComponentType } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ConversationList, type Conversation } from '@/components/messaging/ConversationList';
import type { RealtimeMessageThreadProps } from '@/components/messaging/RealtimeMessageThread';
import { type Message } from '@/components/messaging/MessageThread';
import { Lock, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api/fetch';

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
  const [RealtimeThread, setRealtimeThread] =
    useState<ComponentType<RealtimeMessageThreadProps> | null>(null);

  // Load conversations on mount (after auth is ready)
  useEffect(() => {
    if (!isAuthLoading && currentUserId) {
      loadConversations();
    }
  }, [isAuthLoading, currentUserId]);

  // Auto-select conversation from URL param after conversations are loaded
  useEffect(() => {
    if (conversationParam && conversations.length > 0) {
      // Check if the conversation exists in the list
      const exists = conversations.some((c) => c.id === conversationParam);
      if (exists && selectedConversationId !== conversationParam) {
        setSelectedConversationId(conversationParam);
      }
    }
  }, [conversationParam, conversations, selectedConversationId]);

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

  useEffect(() => {
    if (!selectedConversationId || RealtimeThread) {
      return;
    }

    let cancelled = false;

    void import('@/components/messaging/RealtimeMessageThread').then((module) => {
      if (!cancelled) {
        setRealtimeThread(() => module.RealtimeMessageThread);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [RealtimeThread, selectedConversationId]);

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId) return;

    try {
      const response = await apiFetch(`/api/conversations/${selectedConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Failed to send message');
      }

      const data = await response.json();
      if (data.message) {
        const normalizedMessage = {
          id: data.message.id,
          senderId: currentUserId || 'unknown',
          content: data.message.content,
          sentAt: new Date(data.message.sentAt || data.message.sent_at || new Date().toISOString()),
          readAt:
            data.message.readAt || data.message.read_at
              ? new Date(data.message.readAt || data.message.read_at)
              : undefined,
        };
        setMessages((prev) => [...prev, normalizedMessage]);
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
  if (isAuthLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Sign in to view organization conversations.</p>
      </div>
    );
  }

  const isV2 = process.env.NEXT_PUBLIC_UI_REFACTOR_V2 === 'true';
  const rightPaneBgClass = isV2 ? 'bg-transparent' : 'bg-japandi-bg';

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
          mode="organization"
        />
      </div>

      {/* Right: Message Thread or Empty State */}
      <div
        className={`h-full min-h-0 min-w-0 flex-1 ${rightPaneBgClass} ${
          !selectedConversationId ? 'hidden md:flex md:items-center md:justify-center' : 'flex'
        }`}
      >
        {selectedConversation && RealtimeThread ? (
          <RealtimeThread
            conversationId={selectedConversation.id}
            initialMessages={messages}
            currentUserId={currentUserId}
            otherPartyName={selectedConversation.otherPartyName}
            otherPartyAvatar={selectedConversation.otherPartyAvatar}
            stage={selectedConversation.stage}
            onSendMessage={handleSendMessage}
            onBack={handleBackToConversationList}
          />
        ) : selectedConversation ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        ) : (
          <div className="mx-6 max-w-md rounded-2xl border border-proofound-stone/70 bg-white/60 p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-proofound-parchment text-proofound-forest">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <p className="font-display text-xl font-semibold text-proofound-charcoal">
                Select a conversation
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                Conversations appear after an assignment and introduction are ready. Choose a thread
                when one opens in the list.
              </p>
              <p className="inline-flex items-center gap-2 pt-2 text-xs font-medium text-proofound-charcoal/70">
                <Lock className="h-3.5 w-3.5" />
                Candidate identity remains protected before reveal
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
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <OrganizationMessagesPageContent />
    </Suspense>
  );
}
