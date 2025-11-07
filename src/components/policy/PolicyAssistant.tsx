/**
 * Policy Assistant Component
 *
 * AI-powered chatbot for explaining policies and privacy concepts
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Sparkles, Shield, Info, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  keyPoints?: string[];
  examples?: string[];
  relatedSections?: string[];
  timestamp: Date;
}

interface CommonQuestion {
  question: string;
  category: string;
}

export function PolicyAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [commonQuestions, setCommonQuestions] = useState<CommonQuestion[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load common questions on mount
  useEffect(() => {
    if (isOpen && commonQuestions.length === 0) {
      loadCommonQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const loadCommonQuestions = async () => {
    try {
      const response = await fetch('/api/policy/explain');
      if (response.ok) {
        const data = await response.json();
        setCommonQuestions(data.commonQuestions || []);
      }
    } catch (error) {
      console.error('policy.assistant.load_questions.failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleAskQuestion = async (question: string) => {
    if (!question.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/policy/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error('Failed to get explanation');
      }

      const data = await response.json();
      const explanation = data.explanation;

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: explanation.answer,
        keyPoints: explanation.keyPoints,
        examples: explanation.examples,
        relatedSections: explanation.relatedSections,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('policy.assistant.ask.failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content:
          "I'm sorry, I couldn't process your question. Please try again or contact support.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);

      toast({
        title: 'Failed to get explanation',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAskQuestion(input);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 z-50 w-96 shadow-2xl">
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle className="text-lg">Policy Assistant</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20"
          >
            ×
          </Button>
        </div>
        <p className="text-xs text-white/90 mt-1">
          Ask me anything about our privacy policy and terms
        </p>
      </CardHeader>

      <CardContent className="p-0">
        {/* Messages */}
        <ScrollArea className="h-96 p-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10">
                <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Welcome!</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    I can help explain our privacy policy, terms of service, and data practices in
                    plain language. Try asking a question below or choose from common questions.
                  </p>
                </div>
              </div>

              {/* Common Questions */}
              {commonQuestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Common Questions:
                  </p>
                  {commonQuestions.slice(0, 5).map((q, index) => (
                    <button
                      key={index}
                      onClick={() => handleAskQuestion(q.question)}
                      className="w-full text-left p-2 text-xs rounded border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      disabled={isLoading}
                    >
                      {q.question}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {message.type === 'assistant' && (
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}

                  <div className={`flex-1 space-y-2 ${message.type === 'user' ? 'items-end' : ''}`}>
                    <div
                      className={`rounded-lg p-3 text-sm ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white ml-8'
                          : 'bg-gray-100 dark:bg-gray-800 mr-8'
                      }`}
                    >
                      {message.content}
                    </div>

                    {/* Key Points */}
                    {message.keyPoints && message.keyPoints.length > 0 && (
                      <div className="mr-8 space-y-1">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          Key Points:
                        </p>
                        <ul className="space-y-1">
                          {message.keyPoints.map((point, index) => (
                            <li
                              key={index}
                              className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2"
                            >
                              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Related Sections */}
                    {message.relatedSections && message.relatedSections.length > 0 && (
                      <div className="mr-8 flex gap-1 flex-wrap">
                        {message.relatedSections.map((section, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {section}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {message.type === 'user' && (
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-sm font-medium">You</span>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                  </div>
                  <div className="flex-1">
                    <div className="rounded-lg p-3 bg-gray-100 dark:bg-gray-800 mr-8">
                      <p className="text-sm text-gray-500">Thinking...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <Info className="h-3 w-3" />
            Powered by AI. May not be 100% accurate.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
