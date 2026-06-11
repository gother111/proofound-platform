/**
 * Conversation List Component
 *
 * Displays list of message conversations with search and filtering
 */

'use client';

import React, { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export interface Conversation {
  id: string;
  otherPartyName: string; // Staged: masked initially, revealed after intro
  otherPartyAvatar?: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  matchId?: string;
  assignmentTitle?: string;
  stage: 'masked' | 'revealed'; // Stage 1: masked, Stage 2: revealed
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  isLoading?: boolean;
  mode?: 'individual' | 'organization';
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  isLoading = false,
  mode = 'individual',
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const hasConversations = conversations.length > 0;
  const trimmedSearchQuery = searchQuery.trim();
  const hasSearchQuery = trimmedSearchQuery.length > 0;
  const emptyCopy =
    mode === 'organization'
      ? {
          title: 'No conversations yet',
          detail: 'Create an assignment and approve an introduction before messages open here.',
          helper: 'Identity stays protected until the corridor is ready.',
        }
      : {
          title: 'No conversations yet',
          detail: 'Send interest or accept an introduction before messages open here.',
          helper: 'Your identity remains private until the reveal step.',
        };

  // Filter conversations by search query
  const filteredConversations = useMemo(() => {
    if (!trimmedSearchQuery) return conversations;

    const query = trimmedSearchQuery.toLowerCase();
    return conversations.filter(
      (conv) =>
        conv.otherPartyName.toLowerCase().includes(query) ||
        conv.assignmentTitle?.toLowerCase().includes(query) ||
        conv.lastMessage.toLowerCase().includes(query)
    );
  }, [conversations, trimmedSearchQuery]);

  // Truncate message preview
  const truncateMessage = (message: string, maxLength: number = 60) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Get display name based on stage
  const getDisplayName = (conv: Conversation) => {
    return conv.otherPartyName;
  };

  // Get avatar initials
  const getInitials = (name: string) => {
    if (name === 'Submission') return 'S';
    if (name === 'Organization') return 'O';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto border-r border-proofound-stone/70 bg-white/45">
        <div className="border-b border-proofound-stone/70 p-4">
          <h2 className="font-semibold text-foreground">Messages</h2>
        </div>
        <div className="divide-y">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto border-r border-proofound-stone/70 bg-white/45">
      {/* Header with search */}
      <div className="sticky top-0 z-10 border-b border-proofound-stone/70 bg-neutral-light-50/95 p-4 backdrop-blur">
        <h2 className="mb-1 font-display text-lg font-semibold text-proofound-charcoal">
          Messages
        </h2>
        <p className="mb-3 text-xs leading-5 text-muted-foreground">
          {hasConversations
            ? 'Review open introductions and keep each thread tied to its proof corridor.'
            : 'Conversations appear after a proof-safe introduction.'}
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            aria-label="Search conversations"
            placeholder="Search conversations"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 rounded-xl border-proofound-stone/80 bg-white pl-10"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="divide-y divide-proofound-stone/60">
        {filteredConversations.length === 0 && !hasSearchQuery && (
          <div className="mx-4 mt-4 rounded-2xl border border-dashed border-proofound-stone/80 bg-proofound-parchment/45 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-proofound-forest">
              <MessageSquare className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-proofound-charcoal">{emptyCopy.title}</p>
            <p className="mx-auto mt-2 max-w-64 text-xs leading-5 text-muted-foreground">
              {emptyCopy.detail}
            </p>
            <p className="mx-auto mt-3 max-w-64 text-xs leading-5 text-proofound-charcoal/60">
              {emptyCopy.helper}
            </p>
          </div>
        )}

        {filteredConversations.length === 0 && hasSearchQuery && (
          <div
            className="mx-4 mt-4 rounded-2xl border border-dashed border-proofound-stone/80 bg-white/70 p-6 text-center"
            role="status"
            aria-live="polite"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-proofound-parchment text-proofound-forest">
              <Search className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-proofound-charcoal">
              No conversations match &ldquo;{trimmedSearchQuery}&rdquo;
            </p>
            <p className="mx-auto mt-2 max-w-64 text-xs leading-5 text-muted-foreground">
              Search checks participant labels, assignment titles, and recent proof-corridor
              messages.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-4 rounded-full border border-proofound-stone bg-white px-3 py-1.5 text-xs font-medium text-proofound-forest transition-colors hover:border-proofound-forest hover:bg-proofound-parchment/30"
            >
              Clear search
            </button>
          </div>
        )}

        {filteredConversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => onSelect(conversation.id)}
            className={cn(
              'w-full p-4 text-left transition-colors hover:bg-japandi-bg',
              selectedId === conversation.id && 'bg-proofound-forest/5 hover:bg-proofound-forest/5'
            )}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <Avatar className="h-10 w-10 flex-shrink-0">
                {conversation.stage === 'revealed' && conversation.otherPartyAvatar ? (
                  <AvatarImage
                    src={conversation.otherPartyAvatar}
                    alt={conversation.otherPartyName}
                  />
                ) : null}
                <AvatarFallback className="bg-proofound-forest text-white">
                  {getInitials(getDisplayName(conversation))}
                </AvatarFallback>
              </Avatar>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {getDisplayName(conversation)}
                    </h3>
                    {conversation.assignmentTitle && (
                      <p className="text-xs leading-5 text-muted-foreground line-clamp-2">
                        Re: {conversation.assignmentTitle}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {conversation.unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="h-5 min-w-[20px] flex items-center justify-center px-1.5"
                      >
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                  {truncateMessage(conversation.lastMessage)}
                </p>

                <p className="text-xs text-muted-foreground">
                  {formatTimestamp(conversation.lastMessageAt)}
                </p>

                {conversation.stage === 'masked' && (
                  <Badge
                    variant="outline"
                    className="mt-2 border-[#7A9278] text-xs text-proofound-forest"
                  >
                    Identity protected until reveal approval
                  </Badge>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
