/**
 * Messages Page - Organization
 *
 * Two-column layout: conversation list + message thread
 * Same as individual version but for organizations
 *
 * Supports URL param: ?conversation=<id> to auto-select a conversation
 */

'use client';

import { useState, useEffect, Suspense, useCallback, useRef, type ComponentType } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ConversationList, type Conversation } from '@/components/messaging/ConversationList';
import { MessageThreadLoadFailure } from '@/components/messaging/MessageThreadLoadFailure';
import type { RealtimeMessageThreadProps } from '@/components/messaging/RealtimeMessageThread';
import { type Message } from '@/components/messaging/MessageThread';
import { Lock, MessageSquare } from 'lucide-react';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { LoadingOrganizationMessages } from './DeferredOrgMessagesClient';
import { getConversationParticipantLabel } from '@/lib/messaging/participant-label';
import { createMessageSendRetryError } from '@/lib/messaging/send-errors';

type OrgMessagesClientProps = {
  currentUserId: string;
  hideHeader?: boolean;
};

function OrganizationMessagesPageContent({ currentUserId, hideHeader }: OrgMessagesClientProps) {
  const searchParams = useSearchParams();
  const conversationParam = searchParams?.get('conversation');
  const pathname = usePathname();
  const router = useRouter();
  const appliedConversationParamRef = useRef<string | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [conversationLoadError, setConversationLoadError] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageLoadError, setMessageLoadError] = useState<string | null>(null);
  const [RealtimeThread, setRealtimeThread] =
    useState<ComponentType<RealtimeMessageThreadProps> | null>(null);

  const loadConversations = useCallback(async () => {
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
      dispatchClientErrorDiagnostic('messages.organization.conversations_load_failed', error);
      setConversations([]);
      setConversationLoadError(
        'Assignment conversations are still safe. Retry this section to load messages, reveal requests, and proof-corridor updates.'
      );
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  // Auto-select conversation from URL param after conversations are loaded
  useEffect(() => {
    if (!conversationParam) {
      appliedConversationParamRef.current = null;
      return;
    }

    if (conversations.length === 0 || conversationParam === appliedConversationParamRef.current) {
      return;
    }

    // Check if the conversation exists in the list
    const exists = conversations.some((c) => c.id === conversationParam);
    if (exists) {
      appliedConversationParamRef.current = conversationParam;
      if (selectedConversationId !== conversationParam) {
        setSelectedConversationId(conversationParam);
      }
    }
  }, [conversationParam, conversations, selectedConversationId]);

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
        dispatchClientErrorDiagnostic('messages.organization.thread_load_failed', error);
        setMessages([]);
        setMessageLoadError(
          'This assignment thread did not finish loading. Messages, reveal requests, and review context are still safe; retry before replying.'
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
      dispatchClientErrorDiagnostic('messages.organization.send_failed', error);
      throw createMessageSendRetryError();
    }
  };

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  const conversationRoute = useCallback(
    (conversationId?: string) => {
      const params = new URLSearchParams(searchParams?.toString());
      if (conversationId) {
        params.set('conversation', conversationId);
      } else {
        params.delete('conversation');
      }

      const query = params.toString();
      return `${pathname ?? '/app'}${query ? `?${query}` : ''}`;
    },
    [pathname, searchParams]
  );

  const handleSelectConversation = (conversationId: string) => {
    if (conversationId !== selectedConversationId) {
      setMessages([]);
      setMessageLoadError(null);
    }
    setSelectedConversationId(conversationId);
    router.replace(conversationRoute(conversationId), { scroll: false });
  };

  const handleBackToConversationList = () => {
    setSelectedConversationId(undefined);
    setMessages([]);
    setMessageLoadError(null);
    router.replace(conversationRoute(), { scroll: false });
  };

  const isV2 = process.env.NEXT_PUBLIC_UI_REFACTOR_V2 === 'true';
  const rightPaneBgClass = isV2 ? 'bg-transparent' : 'bg-japandi-bg';

  return (
    <div className="flex h-full min-h-[calc(100vh-3.5rem)] flex-col">
      {!hideHeader && (
        <header className="border-b border-proofound-stone/70 bg-white/80 px-4 py-4 md:px-6">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-semibold text-proofound-charcoal">
              Messages
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Assignment conversations stay private and stage-aware. Identity remains protected
              until a consented reveal opens the next step.
            </p>
          </div>
        </header>
      )}

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
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
            mode="organization"
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
            <LoadingOrganizationMessages />
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
                  Conversations appear after an assignment and introduction are ready. Choose a
                  thread when one opens in the list.
                </p>
                <p className="inline-flex items-center gap-2 pt-2 text-xs font-medium text-proofound-charcoal/70">
                  <Lock className="h-3.5 w-3.5" />
                  Identity remains protected before reveal
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export function OrgMessagesClient({ currentUserId, hideHeader }: OrgMessagesClientProps) {
  return (
    <Suspense fallback={<LoadingOrganizationMessages />}>
      <OrganizationMessagesPageContent currentUserId={currentUserId} hideHeader={hideHeader} />
    </Suspense>
  );
}
