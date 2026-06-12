/**
 * Message Thread Component
 *
 * Displays messages and compose area
 * - Text-only messaging (no attachments)
 * - Paste is blocked
 * - Staged identity reveal
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, ArrowLeft, Loader2, Lock, MessageSquare, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { DataErrorBoundary } from '@/components/ErrorBoundary';
import { TypingIndicator } from './TypingIndicator';
import { ReadReceipt } from './ReadReceipt';
import {
  getConversationParticipantInitials,
  getConversationParticipantLabel,
} from '@/lib/messaging/participant-label';
import { getMessageSendErrorCopy } from '@/lib/messaging/send-errors';

export interface Message {
  id: string;
  senderId: string;
  content: string;
  sentAt: Date;
  readAt?: Date;
}

interface MessageThreadProps {
  conversationId: string;
  messages: Message[];
  currentUserId: string;
  otherPartyName: string;
  otherPartyAvatar?: string;
  stage: 'masked' | 'revealed';
  isTyping?: boolean;
  onSendMessage: (content: string) => void | Promise<void>;
  onBack?: () => void;
}

const MAX_MESSAGE_LENGTH = 500;

export function MessageThread({
  conversationId,
  messages,
  currentUserId,
  otherPartyName,
  otherPartyAvatar,
  stage,
  isTyping = false,
  onSendMessage,
  onBack,
}: MessageThreadProps) {
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle paste blocking for proof-review privacy.
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    toast({
      title: 'Paste disabled',
      description: 'Type the message directly so this proof-review thread stays text-only.',
      variant: 'destructive',
    });
  };

  // Handle drag-drop blocking for proof-review privacy.
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    toast({
      title: 'Drop disabled',
      description: 'Files and dropped content are blocked in proof-review messages.',
      variant: 'destructive',
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleMessageTextChange = (value: string) => {
    setMessageText(value);
    setSendError(null);
  };

  // Handle send
  const handleSend = async () => {
    const trimmedText = messageText.trim();
    if (!trimmedText || isSending) return;

    if (trimmedText.length > MAX_MESSAGE_LENGTH) {
      toast({
        title: 'Message too long',
        description: `Please keep messages under ${MAX_MESSAGE_LENGTH} characters.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    setSendError(null);
    try {
      await onSendMessage(trimmedText);
      setMessageText('');
    } catch (error) {
      setSendError(getMessageSendErrorCopy(error));
    } finally {
      setIsSending(false);
    }
  };

  // Handle Enter key (Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Get display name
  const displayName = getConversationParticipantLabel({
    stage,
    displayName: otherPartyName,
  });
  const participantInitials = getConversationParticipantInitials(displayName, stage);

  // Character count color
  const characterCountColor = () => {
    const length = messageText.length;
    if (length > MAX_MESSAGE_LENGTH) return 'text-red-600';
    if (length > MAX_MESSAGE_LENGTH * 0.9) return 'text-amber-600';
    return 'text-muted-foreground';
  };

  return (
    <DataErrorBoundary onRetry={() => window.location.reload()}>
      <div className="flex flex-col h-full min-h-0 w-full min-w-0 bg-background">
        {/* Header */}
        <div className="p-4 border-b bg-background sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label="Back to conversations"
                className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg border border-border text-foreground hover:bg-japandi-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C4D3A] focus-visible:ring-offset-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <Avatar className="h-10 w-10">
              {stage === 'revealed' && otherPartyAvatar ? (
                <AvatarImage src={otherPartyAvatar} alt={displayName} />
              ) : null}
              <AvatarFallback className="bg-proofound-forest text-white">
                {participantInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-foreground">{displayName}</div>
              {stage === 'masked' && (
                <Badge variant="outline" className="text-xs border-[#7A9278] text-proofound-forest">
                  Identity protected until reveal approval
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <motion.div
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-japandi-bg"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05 },
            },
          }}
        >
          {messages.length === 0 && (
            <motion.div
              className="flex flex-col items-center justify-center text-center py-16 space-y-4"
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-proofound-stone/70 bg-white text-proofound-forest shadow-sm">
                <MessageSquare className="h-7 w-7" />
              </div>
              <div className="max-w-sm space-y-1">
                <p className="text-base font-medium text-foreground">No messages yet</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Keep the first note tied to the assignment, proof, or reveal step so the thread
                  stays review-safe.
                </p>
              </div>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((message) => {
              const isOwnMessage = message.senderId === currentUserId;
              return (
                <motion.div
                  key={message.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                  className={cn('flex gap-2', isOwnMessage ? 'justify-end' : 'justify-start')}
                >
                  {!isOwnMessage && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      {stage === 'revealed' && otherPartyAvatar ? (
                        <AvatarImage src={otherPartyAvatar} alt={displayName} />
                      ) : null}
                      <AvatarFallback className="bg-proofound-forest text-white text-xs">
                        {participantInitials}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={cn(
                      'max-w-[82%] sm:max-w-[75%] lg:max-w-[70%] space-y-1',
                      isOwnMessage && 'flex flex-col items-end'
                    )}
                  >
                    <div
                      className={cn(
                        'rounded-2xl px-4 py-2 break-words',
                        isOwnMessage
                          ? 'bg-proofound-forest text-white rounded-br-sm'
                          : 'bg-background border border-border text-foreground rounded-bl-sm'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>

                    {/* Timestamp and read receipt */}
                    <div className="flex items-center gap-1 px-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.sentAt), 'HH:mm')}
                      </span>
                      {isOwnMessage && (
                        <ReadReceipt
                          status={message.readAt ? 'read' : 'delivered'}
                          timestamp={message.readAt}
                        />
                      )}
                    </div>
                  </div>

                  {isOwnMessage && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-[#7A9278] text-white text-xs">
                        You
                      </AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Removed raw redundant typing indicator block here. Replaced exclusively by the core TypingIndicator below. */}

          {/* Typing Indicator */}
          {isTyping && <TypingIndicator isTyping={true} displayName={displayName} />}

          <div ref={messagesEndRef} />
        </motion.div>

        {/* Compose */}
        <div className="border-t bg-background p-4 pb-5 md:pb-4">
          <div className="space-y-2">
            {sendError ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Message not sent</AlertTitle>
                <AlertDescription>{sendError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex gap-2">
              <Textarea
                value={messageText}
                onChange={(e) => handleMessageTextChange(e.target.value)}
                onPaste={handlePaste}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (paste and drag-drop disabled)"
                className="flex-1 min-h-[80px] resize-none"
                maxLength={MAX_MESSAGE_LENGTH + 50} // Allow typing slightly over to show warning
                disabled={isSending}
              />
              <Button
                type="button"
                onClick={handleSend}
                disabled={
                  !messageText.trim() || isSending || messageText.length > MAX_MESSAGE_LENGTH
                }
                aria-label={isSending ? 'Sending message' : 'Send message'}
                className="bg-proofound-forest hover:bg-proofound-forest/90 h-auto px-4"
              >
                {isSending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>

            <div className="flex items-start justify-between gap-3 text-xs">
              <span className="inline-flex min-w-0 items-start gap-1.5 leading-5 text-muted-foreground">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Text-only; paste/drop disabled for proof-review privacy.</span>
                <span className="hidden sm:inline"> Press Enter to send.</span>
              </span>
              <span className={cn('flex-shrink-0 leading-5', characterCountColor())}>
                {messageText.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
          </div>
        </div>
      </div>
    </DataErrorBoundary>
  );
}
