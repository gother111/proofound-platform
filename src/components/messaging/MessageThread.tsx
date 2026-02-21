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
import { ArrowLeft, Check, CheckCheck, Loader2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { DataErrorBoundary } from '@/components/ErrorBoundary';
import { TypingIndicator } from './TypingIndicator';
import { ReadReceipt } from './ReadReceipt';

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
  onSendMessage: (content: string) => void;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle paste blocking (PRD I-20)
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    toast({
      title: 'Paste disabled',
      description: 'For security and privacy, pasting is not allowed in messages (PRD I-20).',
      variant: 'destructive',
    });
  };

  // Handle drag-drop blocking (PRD I-20)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    toast({
      title: 'Drop disabled',
      description: 'For security and privacy, drag-and-drop is not allowed (PRD I-20).',
      variant: 'destructive',
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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
    try {
      await onSendMessage(trimmedText);
      setMessageText('');
    } catch (error) {
      toast({
        title: 'Failed to send',
        description: 'Please try again.',
        variant: 'destructive',
      });
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
  const displayName = stage === 'masked' ? 'Candidate' : otherPartyName;
  const getInitials = (name: string) => {
    if (name === 'Candidate') return 'C';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Character count color
  const characterCountColor = () => {
    const length = messageText.length;
    if (length > MAX_MESSAGE_LENGTH) return 'text-red-600';
    if (length > MAX_MESSAGE_LENGTH * 0.9) return 'text-amber-600';
    return 'text-[#6B6760]';
  };

  return (
    <DataErrorBoundary onRetry={() => window.location.reload()}>
      <div className="flex flex-col h-full min-h-0 w-full min-w-0 bg-white">
        {/* Header */}
        <div className="p-4 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label="Back to conversations"
                className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg border border-[#D8D2C8] text-[#2D3330] hover:bg-[#F7F6F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C4D3A] focus-visible:ring-offset-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <Avatar className="h-10 w-10">
              {stage === 'revealed' && otherPartyAvatar ? (
                <AvatarImage src={otherPartyAvatar} alt={displayName} />
              ) : null}
              <AvatarFallback className="bg-[#1C4D3A] text-white">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-[#2D3330]">{displayName}</div>
              {stage === 'masked' && (
                <Badge variant="outline" className="text-xs border-[#7A9278] text-[#1C4D3A]">
                  Identity revealed after introduction
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <motion.div
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F7F6F1]"
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
              className="text-center py-12 space-y-2"
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <p className="text-sm text-[#6B6760]">No messages yet</p>
              <p className="text-xs text-[#6B6760]">Start the conversation below</p>
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
                      <AvatarFallback className="bg-[#1C4D3A] text-white text-xs">
                        {getInitials(displayName)}
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
                          ? 'bg-[#1C4D3A] text-white rounded-br-sm'
                          : 'bg-white border border-[#D8D2C8] text-[#2D3330] rounded-bl-sm'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>

                    {/* Timestamp and read receipt */}
                    <div className="flex items-center gap-1 px-2">
                      <span className="text-xs text-[#6B6760]">
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

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-2 items-center">
              <Avatar className="h-8 w-8">
                {stage === 'revealed' && otherPartyAvatar ? (
                  <AvatarImage src={otherPartyAvatar} alt={displayName} />
                ) : null}
                <AvatarFallback className="bg-[#1C4D3A] text-white text-xs">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="bg-white border border-[#D8D2C8] rounded-2xl rounded-bl-sm px-4 py-2">
                <div className="flex gap-1">
                  <span
                    className="w-2 h-2 bg-[#6B6760] rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-2 h-2 bg-[#6B6760] rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-2 h-2 bg-[#6B6760] rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Typing Indicator */}
          {isTyping && <TypingIndicator isTyping={true} displayName={displayName} />}

          <div ref={messagesEndRef} />
        </motion.div>

        {/* Compose */}
        <div className="p-4 border-t bg-white">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
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
                onClick={handleSend}
                disabled={
                  !messageText.trim() || isSending || messageText.length > MAX_MESSAGE_LENGTH
                }
                className="bg-[#1C4D3A] hover:bg-[#2D5F4A] h-auto px-4"
              >
                {isSending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#6B6760]">
                🔒 Text-only messaging for privacy and security • Paste/drop disabled • Press Enter
                to send
              </span>
              <span className={characterCountColor()}>
                {messageText.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
          </div>
        </div>
      </div>
    </DataErrorBoundary>
  );
}
