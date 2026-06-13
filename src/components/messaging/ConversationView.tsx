'use client';

/**
 * ConversationView Component
 *
 * Displays a conversation with messages, handling both masked and revealed stages.
 * Shows identity reveal controls when appropriate.
 *
 * Reference: DATA_SECURITY_PRIVACY_ARCHITECTURE.md Section 10
 */

import { useCallback, useState, useEffect, useRef } from 'react';
import { MessageInput } from './MessageInput';
import { MessageThreadLoadFailure } from './MessageThreadLoadFailure';
import { RevealIdentityCard } from './RevealIdentityCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { CheckCheck, Check, Mail, Phone, Link2, Lock } from 'lucide-react';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { createRevealIdentityRetryError } from '@/lib/messaging/reveal-errors';
import { createMessageSendRetryError } from '@/lib/messaging/send-errors';

interface Message {
  id: string;
  conversationId: string;
  content: string;
  sentAt: string;
  readAt: string | null;
  status: 'sent' | 'delivered' | 'read' | 'deleted';
  containsEmail: boolean;
  containsPhone: boolean;
  containsUrl: boolean;
  sender: {
    id: string;
    handle: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
  isOwnMessage: boolean;
}

interface Conversation {
  id: string;
  matchId: string | null;
  stage: 'masked' | 'revealed';
  revealedAt: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  currentUserWantsReveal: boolean;
  otherUserWantsReveal: boolean;
  canReveal: boolean;
}

interface OtherParticipant {
  id: string;
  handle: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  persona: 'individual' | 'org_member' | 'unknown';
  masked?: boolean;
}

interface ConversationViewProps {
  conversationId: string;
}

type ConversationLoadFailure = {
  title: string;
  description: string;
};

const CONVERSATION_THREAD_LOAD_FAILURE: ConversationLoadFailure = {
  title: 'Conversation thread could not load',
  description:
    'This conversation did not finish loading. Messages, reveal requests, and review context are still safe; retry before replying.',
};

export function ConversationView({ conversationId }: ConversationViewProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [otherParticipant, setOtherParticipant] = useState<OtherParticipant | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ConversationLoadFailure | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const loadConversationThread = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [conversationRes, messagesRes] = await Promise.all([
        apiFetch(`/api/conversations/${conversationId}`),
        apiFetch(`/api/conversations/${conversationId}/messages?limit=100`),
      ]);

      if (!conversationRes.ok) {
        throw new Error('conversation_load_failed');
      }

      if (!messagesRes.ok) {
        throw new Error('conversation_messages_load_failed');
      }

      const [conversationData, messagesData] = await Promise.all([
        conversationRes.json(),
        messagesRes.json(),
      ]);

      setConversation(conversationData.conversation);
      setOtherParticipant(conversationData.otherParticipant);
      setMessages(messagesData.messages);
    } catch (err) {
      dispatchClientErrorDiagnostic('messages.conversation_view.load_failed', err);
      setError(CONVERSATION_THREAD_LOAD_FAILURE);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    void loadConversationThread();
  }, [loadConversationThread]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string, piiWarningShown: boolean = false) => {
    try {
      setSendingMessage(true);

      const res = await apiFetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, piiWarningShown }),
      });

      const data = await res.json();

      if (res.status === 400 && data.error === 'PII_DETECTED') {
        // Return PII detection result to MessageInput
        throw new Error(
          JSON.stringify({
            type: 'PII_DETECTED',
            message: data.message,
            detection: data.detection,
          })
        );
      }

      if (!res.ok) {
        throw createMessageSendRetryError();
      }

      // Add message to list
      setMessages((prev) => [...prev, data.message]);
    } catch (err) {
      // Re-throw to let MessageInput handle PII detection
      throw err;
    } finally {
      setSendingMessage(false);
    }
  };

  const handleRevealIdentities = async () => {
    const isApproval =
      Boolean(conversation?.otherUserWantsReveal) && !Boolean(conversation?.currentUserWantsReveal);

    try {
      const res = await apiFetch(`/api/conversations/${conversationId}/reveal`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Reveal identity request failed');
      }

      // Refresh thread state after a reveal request or approval.
      await loadConversationThread();

      return data;
    } catch (err) {
      dispatchClientErrorDiagnostic('messages.conversation_view.reveal_failed', err);
      throw createRevealIdentityRetryError({ isApproval });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading conversation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <MessageThreadLoadFailure
        title={error.title}
        description={error.description}
        isRetrying={loading}
        onRetry={loadConversationThread}
      />
    );
  }

  if (!conversation || !otherParticipant) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Conversation not found</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={otherParticipant.avatarUrl || undefined} />
            <AvatarFallback>
              {otherParticipant.displayName?.substring(0, 2).toUpperCase() || '??'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="font-semibold">{otherParticipant.displayName || 'Unknown User'}</h2>
            {otherParticipant.masked && (
              <Badge variant="secondary" className="mt-1 gap-1">
                <Lock className="h-3 w-3" />
                Identity protected
              </Badge>
            )}
            {conversation.stage === 'revealed' && conversation.revealedAt && (
              <p className="text-xs text-muted-foreground">
                Identities revealed {format(new Date(conversation.revealedAt), 'MMM d, yyyy')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Reveal Identity Card (Stage 1 only) */}
      {conversation.canReveal && (
        <div className="p-4">
          <RevealIdentityCard
            currentUserWantsReveal={conversation.currentUserWantsReveal}
            otherUserWantsReveal={conversation.otherUserWantsReveal}
            onReveal={handleRevealIdentities}
          />
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="mx-auto max-w-sm rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
              <p className="text-sm font-medium text-foreground">No messages yet</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Keep the first note tied to the assignment, proof, or reveal step so this thread
                stays review-safe.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isRevealed={conversation.stage === 'revealed'}
            />
          ))}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t p-4">
        <MessageInput
          onSend={handleSendMessage}
          disabled={sendingMessage}
          conversationStage={conversation.stage}
        />
      </div>
    </div>
  );
}

/**
 * MessageBubble Component
 */
interface MessageBubbleProps {
  message: Message;
  isRevealed: boolean;
}

function MessageBubble({ message, isRevealed }: MessageBubbleProps) {
  const hasPII = message.containsEmail || message.containsPhone || message.containsUrl;

  return (
    <div className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-lg p-3 ${
          message.isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}
      >
        {/* Sender name (if not own message and revealed) */}
        {!message.isOwnMessage && message.sender.displayName && (
          <p className="mb-1 text-xs font-semibold opacity-70">{message.sender.displayName}</p>
        )}

        {/* Message content */}
        <p className="whitespace-pre-wrap break-words">{message.content}</p>

        {/* PII warning badge */}
        {hasPII && !isRevealed && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.containsEmail && (
              <Badge variant="outline" className="text-xs">
                <Mail className="mr-1 h-3 w-3" />
                Email
              </Badge>
            )}
            {message.containsPhone && (
              <Badge variant="outline" className="text-xs">
                <Phone className="mr-1 h-3 w-3" />
                Phone
              </Badge>
            )}
            {message.containsUrl && (
              <Badge variant="outline" className="text-xs">
                <Link2 className="mr-1 h-3 w-3" />
                Link
              </Badge>
            )}
          </div>
        )}

        {/* Timestamp and read status */}
        <div className="mt-1 flex items-center gap-1 text-xs opacity-60">
          <span>{format(new Date(message.sentAt), 'h:mm a')}</span>
          {message.isOwnMessage && (
            <>
              {message.readAt ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
