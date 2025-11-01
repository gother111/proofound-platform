/**
 * Conversation List Component
 *
 * Displays list of message conversations with search and filtering
 */

'use client';

import React, { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Search, User } from 'lucide-react';
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
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  isLoading = false,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations by search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter(
      (conv) =>
        conv.otherPartyName.toLowerCase().includes(query) ||
        conv.assignmentTitle?.toLowerCase().includes(query) ||
        conv.lastMessage.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

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
    if (conv.stage === 'masked') {
      return 'Candidate'; // Masked identity
    }
    return conv.otherPartyName;
  };

  // Get avatar initials
  const getInitials = (name: string) => {
    if (name === 'Candidate') return 'C';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <div className="border-r h-full overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-[#2D3330]">Messages</h2>
        </div>
        <div className="divide-y">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border-r h-full overflow-y-auto bg-white">
      {/* Header with search */}
      <div className="p-4 border-b bg-white sticky top-0 z-10">
        <h2 className="font-semibold text-[#2D3330] mb-3">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B6760]" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="divide-y">
        {filteredConversations.length === 0 && !searchQuery && (
          <div className="p-8 text-center space-y-2">
            <User className="h-12 w-12 mx-auto text-[#6B6760] opacity-50" />
            <p className="text-sm text-[#6B6760]">No conversations yet</p>
            <p className="text-xs text-[#6B6760]">Start matching to begin conversations</p>
          </div>
        )}

        {filteredConversations.length === 0 && searchQuery && (
          <div className="p-8 text-center">
            <p className="text-sm text-[#6B6760]">
              No conversations match &apos;{searchQuery}&apos;
            </p>
          </div>
        )}

        {filteredConversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => onSelect(conversation.id)}
            className={cn(
              'w-full p-4 text-left hover:bg-[#F7F6F1] transition-colors',
              selectedId === conversation.id && 'bg-[#EEF1EA] hover:bg-[#EEF1EA]'
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
                <AvatarFallback className="bg-[#4A5943] text-white">
                  {getInitials(getDisplayName(conversation))}
                </AvatarFallback>
              </Avatar>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[#2D3330] truncate">
                      {getDisplayName(conversation)}
                    </h3>
                    {conversation.assignmentTitle && (
                      <p className="text-xs text-[#6B6760] truncate">
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

                <p className="text-sm text-[#6B6760] line-clamp-2 mb-1">
                  {truncateMessage(conversation.lastMessage)}
                </p>

                <p className="text-xs text-[#6B6760]">
                  {formatTimestamp(conversation.lastMessageAt)}
                </p>

                {conversation.stage === 'masked' && (
                  <Badge variant="outline" className="mt-2 text-xs border-[#7A9278] text-[#4A5943]">
                    Identity revealed after introduction
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
