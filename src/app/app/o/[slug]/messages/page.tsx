/**
 * Messages Page - Organization
 *
 * Two-column layout: conversation list + message thread
 * Same as individual version but for organizations
 *
 * Supports URL param: ?conversation=<id> to auto-select a conversation
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConversationList, type Conversation } from '@/components/messaging/ConversationList';
import { ConversationView } from '@/components/messaging/ConversationView';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const dynamic = 'force-dynamic';

function OrganizationMessagesPageContent() {
  const searchParams = useSearchParams();
  const conversationParam = searchParams.get('conversation');

  const { userId: currentUserId, isLoading: isAuthLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
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

  // Show loading state if auth is not ready
  if (isAuthLoading || !currentUserId) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-[#6B6760]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Left: Conversation List */}
      <div className="w-80 flex-shrink-0">
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversationId}
          onSelect={setSelectedConversationId}
          isLoading={isLoadingConversations}
        />
      </div>

      {/* Right: Message Thread or Empty State */}
      <div className="flex-1 bg-[#F7F6F1]">
        {selectedConversationId ? (
          <ConversationView conversationId={selectedConversationId} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <MessageSquare className="h-16 w-16 mx-auto text-[#6B6760] opacity-50" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-[#2D3330]">Select a conversation</p>
                <p className="text-sm text-[#6B6760]">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
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
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
          <p className="text-[#6B6760]">Loading...</p>
        </div>
      }
    >
      <OrganizationMessagesPageContent />
    </Suspense>
  );
}
