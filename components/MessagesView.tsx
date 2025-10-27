"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  MessageCircle, 
  Send, 
  Search, 
  Paperclip,
  ArrowLeft,
  MoreVertical,
  CheckCircle2
} from 'lucide-react';

interface MessagesViewProps {
  profile: any;
  conversations: any[];
  initialMessages: any[];
}

export function MessagesView({ profile, conversations, initialMessages }: MessagesViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]?.id || null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState(initialMessages);
  const [isSending, setIsSending] = useState(false);

  // Get active conversation details
  const activeConversation = conversations.find(c => c.id === selectedConversation);
  
  // Filter messages for selected conversation
  const conversationMessages = messages.filter(m => m.match_id === selectedConversation);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  // Subscribe to new messages
  useEffect(() => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`messages:${selectedConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${selectedConversation}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, supabase]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConversation || isSending) return;

    setIsSending(true);
    try {
      // Determine receiver ID (the other person in the match)
      const receiverId = activeConversation.profile_id === profile.id 
        ? activeConversation.assignment?.created_by 
        : activeConversation.profile_id;

      const { data, error } = await (supabase
        .from('messages') as any)
        .insert({
          match_id: selectedConversation,
          sender_id: profile.id,
          receiver_id: receiverId,
          content: messageText,
          sent_at_stage: 'post_accept'
        })
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, data]);
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const otherPerson = conv.profile?.full_name || conv.assignment?.organization?.name || '';
    return otherPerson.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#F7F6F1' }}>
      {/* Header */}
      <div 
        className="border-b px-6 py-4 flex-shrink-0"
        style={{ backgroundColor: '#FDFCFA', borderColor: '#E8E6DD' }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6" style={{ color: '#1C4D3A' }} />
            <h1 className="text-2xl font-display font-semibold" style={{ color: '#2D3330' }}>
              Messages
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div 
          className="w-80 border-r flex flex-col flex-shrink-0"
          style={{ backgroundColor: '#FDFCFA', borderColor: '#E8E6DD' }}
        >
          {/* Search */}
          <div className="p-4 border-b" style={{ borderColor: '#E8E6DD' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6B6760' }} />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                style={{ backgroundColor: '#EFEBE3' }}
              />
            </div>
          </div>

          {/* Conversations */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredConversations.map((conversation) => {
                // Determine who we're talking to
                const otherProfile = conversation.profile_id === profile.id 
                  ? { full_name: conversation.assignment?.organization?.name || 'Organization' }
                  : conversation.profile;
                
                const lastMessage = messages
                  .filter(m => m.match_id === conversation.id)
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

                const unreadCount = messages.filter(
                  m => m.match_id === conversation.id && 
                       m.receiver_id === profile.id && 
                       !m.read_at
                ).length;

                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`w-full p-3 rounded-lg mb-1 text-left transition-colors ${
                      selectedConversation === conversation.id
                        ? 'bg-[#1C4D3A]/10'
                        : 'hover:bg-[#E8E6DD]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-[#7A9278] text-white text-sm">
                          {otherProfile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-sm truncate" style={{ color: '#2D3330' }}>
                            {otherProfile?.full_name || 'User'}
                          </h4>
                          {lastMessage && (
                            <span className="text-xs flex-shrink-0" style={{ color: '#6B6760' }}>
                              {new Date(lastMessage.created_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className={`text-xs truncate flex-1 ${
                            unreadCount > 0 ? 'font-medium' : ''
                          }`} style={{ color: unreadCount > 0 ? '#2D3330' : '#6B6760' }}>
                            {lastMessage?.content || 'Start a conversation'}
                          </p>
                          {unreadCount > 0 && (
                            <span 
                              className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold"
                              style={{ backgroundColor: '#C76B4A', color: 'white' }}
                            >
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {filteredConversations.length === 0 && (
                <div className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3" style={{ color: '#E8E6DD' }} />
                  <p className="text-sm" style={{ color: '#6B6760' }}>
                    {searchQuery ? 'No conversations found' : 'No messages yet'}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Conversation View */}
        {activeConversation ? (
          <div className="flex-1 flex flex-col">
            {/* Conversation Header */}
            <div 
              className="border-b px-6 py-4 flex items-center justify-between"
              style={{ backgroundColor: '#FDFCFA', borderColor: '#E8E6DD' }}
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-[#C76B4A] text-white">
                    {(activeConversation.profile?.full_name || activeConversation.assignment?.organization?.name || 'U')
                      .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold" style={{ color: '#2D3330' }}>
                    {activeConversation.profile?.full_name || activeConversation.assignment?.organization?.name || 'User'}
                  </h2>
                  <p className="text-xs" style={{ color: '#6B6760' }}>
                    {activeConversation.assignment?.title || 'Match'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4 max-w-3xl mx-auto">
                {conversationMessages.map((message) => {
                  const isMe = message.sender_id === profile.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {!isMe && (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="bg-[#7A9278] text-white text-xs">
                            {(activeConversation.profile?.full_name || 'U').charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-md`}>
                        <div
                          className="px-4 py-3 rounded-2xl"
                          style={{
                            backgroundColor: isMe ? '#1C4D3A' : '#FDFCFA',
                            color: isMe ? 'white' : '#2D3330'
                          }}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 mt-1 px-2">
                          <span className="text-xs" style={{ color: '#6B6760' }}>
                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && message.read_at && (
                            <CheckCircle2 className="w-3 h-3" style={{ color: '#7A9278' }} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />

                {conversationMessages.length === 0 && (
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#E8E6DD' }} />
                    <h3 className="text-lg font-semibold mb-2" style={{ color: '#2D3330' }}>
                      Start the conversation
                    </h3>
                    <p className="text-sm" style={{ color: '#6B6760' }}>
                      Send your first message to get started
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div 
              className="border-t p-4"
              style={{ backgroundColor: '#FDFCFA', borderColor: '#E8E6DD' }}
            >
              <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto">
                <div className="flex gap-3">
                  <Textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0"
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Button
                      type="submit"
                      disabled={!messageText.trim() || isSending}
                      className="flex-shrink-0"
                      style={{ backgroundColor: '#1C4D3A', color: 'white' }}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs mt-2" style={{ color: '#6B6760' }}>
                  Press Enter to send, Shift+Enter for new line
                </p>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#E8E6DD' }} />
              <h3 className="text-xl font-display font-semibold mb-2" style={{ color: '#2D3330' }}>
                No conversation selected
              </h3>
              <p className="text-sm" style={{ color: '#6B6760' }}>
                Select a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

