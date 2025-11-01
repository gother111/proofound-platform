/**
 * Messages Page - Individual
 * 
 * Two-column layout: conversation list + message thread
 * Connects to /api/conversations and /api/messages
 */

'use client';

import { useState, useEffect } from 'react';
import { ConversationList, type Conversation } from '@/components/messaging/ConversationList';
import { MessageThread, type Message } from '@/components/messaging/MessageThread';
import { MessageSquare } from 'lucide-react';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [currentUserId] = useState('current-user-id'); // TODO: Get from auth context

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
    }
  }, [selectedConversationId]);

  const loadConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`/api/messages?conversationId=${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversationId,
          content,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

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
      <div className="flex-1 flex items-center justify-center bg-[#F7F6F1]">
        {selectedConversation ? (
          <MessageThread
            conversationId={selectedConversation.id}
            messages={messages}
            currentUserId={currentUserId}
            otherPartyName={selectedConversation.otherPartyName}
            otherPartyAvatar={selectedConversation.otherPartyAvatar}
            stage={selectedConversation.stage}
            onSendMessage={handleSendMessage}
          />
        ) : (
          <div className="text-center space-y-4">
            <MessageSquare className="h-16 w-16 mx-auto text-[#6B6760] opacity-50" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-[#2D3330]">
                Select a conversation
              </p>
              <p className="text-sm text-[#6B6760]">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

