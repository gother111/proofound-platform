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
import { Check, CheckCheck, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

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
}: MessageThreadProps) {
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle paste blocking
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    toast({
      title: 'Paste disabled',
      description: 'For security, pasting is not allowed in messages.',
      variant: 'destructive',
    });
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
      .map(n => n[0])
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
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {stage === 'revealed' && otherPartyAvatar ? (
              <AvatarImage src={otherPartyAvatar} alt={displayName} />
            ) : null}
            <AvatarFallback className="bg-[#4A5943] text-white">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold text-[#2D3330]">{displayName}</div>
            {stage === 'masked' && (
              <Badge 
                variant="outline" 
                className="text-xs border-[#7A9278] text-[#4A5943]"
              >
                Identity revealed after introduction
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F7F6F1]">
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <p className="text-sm text-[#6B6760]">
              No messages yet
            </p>
            <p className="text-xs text-[#6B6760]">
              Start the conversation below
            </p>
          </div>
        )}

        {messages.map((message) => {
          const isOwnMessage = message.senderId === currentUserId;
          return (
            <div
              key={message.id}
              className={cn(
                'flex gap-2',
                isOwnMessage ? 'justify-end' : 'justify-start'
              )}
            >
              {!isOwnMessage && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  {stage === 'revealed' && otherPartyAvatar ? (
                    <AvatarImage src={otherPartyAvatar} alt={displayName} />
                  ) : null}
                  <AvatarFallback className="bg-[#4A5943] text-white text-xs">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={cn(
                  'max-w-[70%] space-y-1',
                  isOwnMessage && 'flex flex-col items-end'
                )}
              >
                <div
                  className={cn(
                    'rounded-2xl px-4 py-2 break-words',
                    isOwnMessage
                      ? 'bg-[#4A5943] text-white rounded-br-sm'
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
                    <>
                      {message.readAt ? (
                        <CheckCheck className="h-3 w-3 text-blue-600" />
                      ) : (
                        <Check className="h-3 w-3 text-[#6B6760]" />
                      )}
                    </>
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
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-2 items-center">
            <Avatar className="h-8 w-8">
              {stage === 'revealed' && otherPartyAvatar ? (
                <AvatarImage src={otherPartyAvatar} alt={displayName} />
              ) : null}
              <AvatarFallback className="bg-[#4A5943] text-white text-xs">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="bg-white border border-[#D8D2C8] rounded-2xl rounded-bl-sm px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-[#6B6760] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-[#6B6760] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-[#6B6760] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Compose */}
      <div className="p-4 border-t bg-white">
        <div className="space-y-2">
          <div className="flex gap-2">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (paste is disabled)"
              className="flex-1 min-h-[80px] resize-none"
              maxLength={MAX_MESSAGE_LENGTH + 50} // Allow typing slightly over to show warning
              disabled={isSending}
            />
            <Button
              onClick={handleSend}
              disabled={!messageText.trim() || isSending || messageText.length > MAX_MESSAGE_LENGTH}
              className="bg-[#4A5943] hover:bg-[#3A4733] h-auto px-4"
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
              Text-only • No files or links • Press Enter to send
            </span>
            <span className={characterCountColor()}>
              {messageText.length}/{MAX_MESSAGE_LENGTH}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

