"use client";

// Messaging interface component
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils";

interface MessagingInterfaceProps {
  matches: any[];
  messages: any[];
  currentUserId: string;
}

export function MessagingInterface({ matches, messages, currentUserId }: MessagingInterfaceProps) {
  const [selectedMatch, setSelectedMatch] = useState<any>(matches?.[0] || null);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter messages for selected conversation
  useEffect(() => {
    if (selectedMatch) {
      const filtered = messages?.filter(
        (msg: any) =>
          msg.match_id === selectedMatch.id
      ) || [];
      setConversationMessages(filtered);
    }
  }, [selectedMatch, messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationMessages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedMatch || isSending) return;

    setIsSending(true);
    try {
      const supabase = getSupabaseBrowserClient();
      
      // Get the other party's ID
      const receiverId = selectedMatch.assignment.created_by;
      
      const { data, error } = await supabase
        .from("messages")
        .insert({
          match_id: selectedMatch.id,
          sender_id: currentUserId,
          receiver_id: receiverId,
          content: messageText,
          sent_at_stage: selectedMatch.communication_stage || "post_accept",
        })
        .select()
        .single();

      if (error) throw error;

      // Add message to local state
      setConversationMessages((prev) => [...prev, data]);
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  if (!matches || matches.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            No conversations yet
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Accept a match to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4">
      {/* Conversations list */}
      <div className="w-80 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Conversations
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {matches.map((match: any) => {
            const org = match.assignment?.organization;
            const unreadCount = messages?.filter(
              (msg: any) =>
                msg.match_id === match.id &&
                msg.receiver_id === currentUserId &&
                !msg.is_read
            ).length || 0;

            return (
              <button
                key={match.id}
                onClick={() => setSelectedMatch(match)}
                className={`w-full text-left border-b border-gray-200 dark:border-gray-700 p-4 transition-colors ${
                  selectedMatch?.id === match.id
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {org?.name || "Organization"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {match.assignment?.title}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <span className="ml-2 flex-shrink-0 inline-flex items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {formatRelativeTime(match.responded_at || match.generated_at)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation view */}
      <div className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden flex flex-col">
        {selectedMatch ? (
          <>
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedMatch.assignment?.organization?.name || "Organization"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedMatch.assignment?.title}
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {conversationMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              ) : (
                <>
                  {conversationMessages.map((message: any) => {
                    const isOwnMessage = message.sender_id === currentUserId;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isOwnMessage
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`mt-1 text-xs ${
                              isOwnMessage
                                ? "text-blue-100"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {formatRelativeTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message input */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={isSending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || isSending}
                >
                  {isSending ? "Sending..." : "Send"}
                </Button>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                🔒 All messages are private and moderated for safety
              </p>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-600 dark:text-gray-400">
              Select a conversation to start messaging
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

