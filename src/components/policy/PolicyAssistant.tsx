/**
 * Policy Assistant Component
 *
 * Local policy helper for plain-language privacy guidance.
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
import { dispatchClientDiagnostic } from '@/lib/client-diagnostics';

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

const COMMON_QUESTIONS: CommonQuestion[] = [
  {
    question: 'What is visible on my Public Page?',
    category: 'Public Page',
  },
  {
    question: 'When can an organization see more proof detail?',
    category: 'Reveal consent',
  },
  {
    question: 'How do I delete or export my data?',
    category: 'Data rights',
  },
];

const explainPolicyQuestion = (question: string): Message => {
  const normalizedQuestion = question.toLowerCase();

  if (normalizedQuestion.includes('public') || normalizedQuestion.includes('visible')) {
    return {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content:
        'Your Public Page should show only launch-safe proof context that you have chosen to publish. Private notes, hidden proof, reveal-only fields, and organization review data stay private unless a specific consent flow says otherwise.',
      keyPoints: [
        'Public Page visibility is controlled separately from private profile context.',
        'Reveal details require an active request and proof-review participant consent.',
        'Private proof and admin review notes must not appear on public pages.',
      ],
      relatedSections: ['Privacy', 'Public Page', 'Reveal consent'],
      timestamp: new Date(),
    };
  }

  if (normalizedQuestion.includes('delete') || normalizedQuestion.includes('export')) {
    return {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content:
        'Export and delete controls live in account privacy settings. Exports should include your own data, while deletion is handled as an account-level action with privacy-safe status handling.',
      keyPoints: [
        'Exports are owner-only.',
        'Deletion status should not leak private account details.',
        'Admin or organization audit views stay internal and permissioned.',
      ],
      relatedSections: ['Export', 'Delete', 'Account privacy'],
      timestamp: new Date(),
    };
  }

  return {
    id: (Date.now() + 1).toString(),
    type: 'assistant',
    content:
      'Proofound launch privacy is centered on proof ownership, explicit publishing, and consent before deeper review. Use privacy settings for public visibility, verification requests for proof checks, and reveal flows for organization-specific access.',
    keyPoints: [
      'Proof stays private unless published or shared through a consented flow.',
      'Organizations should see only the fields needed for the current assignment stage.',
      'Launch support tools must avoid exposing private notes or raw diagnostic data.',
    ],
    relatedSections: ['Proof privacy', 'Verification', 'Organization review'],
    timestamp: new Date(),
  };
};

export function PolicyAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

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
      const assistantMessage = explainPolicyQuestion(question);

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      dispatchClientDiagnostic('policy.assistant.ask_failed', {
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
          className="rounded-full h-14 w-14 shadow-lg dark:shadow-none"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 z-50 w-96 shadow-2xl dark:shadow-none">
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
                  <p className="text-xs text-muted-foreground mt-1">
                    I can help explain our privacy policy, terms of service, and data practices in
                    plain language. Try asking a question below or choose from common questions.
                  </p>
                </div>
              </div>

              {/* Common Questions */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Common Questions:</p>
                {COMMON_QUESTIONS.slice(0, 5).map((q, index) => (
                  <button
                    key={index}
                    onClick={() => handleAskQuestion(q.question)}
                    className="w-full text-left p-2 text-xs rounded border hover:bg-muted/50 transition-colors"
                    disabled={isLoading}
                  >
                    {q.question}
                  </button>
                ))}
              </div>
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
                        message.type === 'user' ? 'bg-blue-600 text-white ml-8' : 'bg-muted mr-8'
                      }`}
                    >
                      {message.content}
                    </div>

                    {/* Key Points */}
                    {message.keyPoints && message.keyPoints.length > 0 && (
                      <div className="mr-8 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Key Points:</p>
                        <ul className="space-y-1">
                          {message.keyPoints.map((point, index) => (
                            <li
                              key={index}
                              className="text-xs text-muted-foreground flex items-start gap-2"
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
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
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
                    <div className="rounded-lg p-3 bg-muted mr-8">
                      <p className="text-sm text-muted-foreground">Thinking...</p>
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
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Info className="h-3 w-3" />
            Local launch guidance. Check the policy pages for the full text.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
