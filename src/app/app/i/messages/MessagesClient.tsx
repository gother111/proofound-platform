/**
 * Messages Page - Individual
 *
 * Two-column layout: conversation list + message thread
 * Connects to /api/conversations and /api/conversations/[conversationId]/messages
 *
 * Supports URL param: ?conversation=<id> to auto-select a conversation
 */

'use client';

import { useState, useEffect, Suspense, useCallback, type ComponentType } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ConversationList, type Conversation } from '@/components/messaging/ConversationList';
import { MessageThreadLoadFailure } from '@/components/messaging/MessageThreadLoadFailure';
import type { RealtimeMessageThreadProps } from '@/components/messaging/RealtimeMessageThread';
import { type Message } from '@/components/messaging/MessageThread';
import { Lock, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import LoadingIndividualMessages from './loading';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { getConversationParticipantLabel } from '@/lib/messaging/participant-label';
import { createMessageSendRetryError } from '@/lib/messaging/send-errors';

function MessagesPageContent() {
  const searchParams = useSearchParams();
  const conversationParam = searchParams?.get('conversation');
  const pathname = usePathname();
  const router = useRouter();

  const { userId: currentUserId, isLoading: isAuthLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [conversationLoadError, setConversationLoadError] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageLoadError, setMessageLoadError] = useState<string | null>(null);
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
    setConversationLoadError(null);
    try {
      const response = await fetch('/api/conversations');
      if (!response.ok) {
        throw new Error('Conversation list request failed');
      }

      const data = await response.json();
      // Transform API response to match ConversationList component interface
      const transformedConversations = (data.conversations || []).map((conv: any) => {
        const stage = conv.stage === 'revealed' ? 'revealed' : 'masked';

        return {
          id: conv.id,
          otherPartyName: getConversationParticipantLabel({
            stage,
            displayName: conv.otherParty?.displayName,
          }),
          otherPartyAvatar: conv.otherParty?.displayAvatar,
          lastMessage: conv.lastMessage?.content || '',
          lastMessageAt: conv.lastMessageAt || conv.createdAt,
          unreadCount: conv.unreadCount || 0,
          matchId: conv.matchId,
          assignmentTitle: conv.assignmentRole,
          stage,
        };
      });
      setConversations(transformedConversations);
    } catch (error) {
      dispatchClientErrorDiagnostic('messages.individual.conversations_load_failed', error);
      setConversations([]);
      setConversationLoadError(
        'Your conversation threads are still safe. Retry this section to load messages, reveal requests, and proof-corridor updates.'
      );
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMessages = useCallback(
    async (conversationId: string) => {
      setIsLoadingMessages(true);
      setMessageLoadError(null);
      setMessages([]);
      try {
        const response = await fetch(`/api/conversations/${conversationId}/messages`);
        if (!response.ok) {
          throw new Error('Thread message request failed');
        }

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
      } catch (error) {
        dispatchClientErrorDiagnostic('messages.individual.thread_load_failed', error);
        setMessages([]);
        setMessageLoadError(
          'This thread did not finish loading. Your messages, reveal requests, and privacy state are still safe; retry before replying.'
        );
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
        throw new Error(
          typeof data?.message === 'string'
            ? data.message
            : data?.error || 'Message send request failed'
        );
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
      dispatchClientErrorDiagnostic('messages.individual.send_failed', error);
      throw createMessageSendRetryError();
    }
  };

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  const handleSelectConversation = (conversationId: string) => {
    if (conversationId !== selectedConversationId) {
      setMessages([]);
      setMessageLoadError(null);
    }
    setSelectedConversationId(conversationId);
  };

  const handleBackToConversationList = () => {
    setSelectedConversationId(undefined);
    setMessages([]);
    setMessageLoadError(null);
    router.replace(pathname ?? '/app/i/messages');
  };

  // Show loading state if auth is not ready
  if (isAuthLoading || !currentUserId) {
    return <LoadingIndividualMessages />;
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
          onSelect={handleSelectConversation}
          isLoading={isLoadingConversations}
          mode="individual"
          loadError={conversationLoadError}
          onRetry={() => {
            void loadConversations();
          }}
        />
      </div>

      {/* Right: Message Thread or Empty State */}
      <div
        className={`h-full min-h-0 min-w-0 flex-1 ${rightPaneBgClass} ${
          !selectedConversationId ? 'hidden md:flex md:items-center md:justify-center' : 'flex'
        }`}
      >
        {selectedConversation && messageLoadError ? (
          <MessageThreadLoadFailure
            description={messageLoadError}
            isRetrying={isLoadingMessages}
            onBack={handleBackToConversationList}
            onRetry={() => {
              void loadMessages(selectedConversation.id);
            }}
          />
        ) : selectedConversation && (isLoadingMessages || !RealtimeThread) ? (
          <LoadingIndividualMessages />
        ) : selectedConversation && RealtimeThread ? (
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
                Messages stay quiet until a proof-safe introduction is open. Choose a thread when
                one appears in the list.
              </p>
              <p className="inline-flex items-center gap-2 pt-2 text-xs font-medium text-proofound-charcoal/70">
                <Lock className="h-3.5 w-3.5" />
                Private by default before reveal
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export function MessagesClient() {
  return (
    <Suspense fallback={<LoadingIndividualMessages />}>
      <MessagesPageContent />
    </Suspense>
  );
}
