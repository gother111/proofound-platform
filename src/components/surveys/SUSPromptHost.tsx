/**
 * SUS Prompt Host
 *
 * Fetches pending SUS survey prompts for the authenticated user and displays SUSDialog.
 * Aligns with /api/surveys/sus (expects userId, trigger, responses, score, grade).
 */

'use client';

import { useEffect, useState } from 'react';
import { SUSDialog } from '@/components/surveys/SUSDialog';
import { createClient } from '@/lib/supabase/client';
import { apiFetch } from '@/lib/api/fetch';
import { usePathname } from 'next/navigation';

type Prompt = {
  id: string;
  trigger: 'profile_activation' | 'first_assignment' | '10_matches' | 'quarterly_checkin';
};

export function SUSPromptHost() {
  const [userId, setUserId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isSnippetEmbedRoute = /^\/p\/[^/]+\/embed\/?$/.test(pathname ?? '');

  // Fetch authenticated user id
  useEffect(() => {
    if (isSnippetEmbedRoute) {
      setUserId(null);
      setPrompt(null);
      setOpen(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) {
          setUserId(data.user.id);
        }
      } catch (error) {
        console.error('SUSPromptHost: failed to fetch user', error);
      }
    };
    fetchUser();
  }, [isSnippetEmbedRoute]);

  // Fetch pending SUS prompt
  useEffect(() => {
    if (!userId || isSnippetEmbedRoute) return;
    const fetchPrompt = async () => {
      try {
        const res = await apiFetch('/api/surveys/sus/prompt');
        if (!res.ok) return;
        const data = await res.json();
        if (data.prompt) {
          setPrompt(data.prompt);
          setOpen(true);
        }
      } catch (error) {
        console.error('SUSPromptHost: failed to fetch prompt', error);
      }
    };
    fetchPrompt();
  }, [userId, isSnippetEmbedRoute]);

  const handleSkip = async () => {
    if (!prompt) {
      setOpen(false);
      return;
    }
    try {
      await apiFetch('/api/surveys/sus/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId: prompt.id, action: 'skip' }),
      });
    } catch (error) {
      console.error('SUSPromptHost: failed to mark skip', error);
    } finally {
      setOpen(false);
      setPrompt(null);
    }
  };

  const handleCompleted = () => {
    setOpen(false);
    setPrompt(null);
  };

  if (isSnippetEmbedRoute || !userId || !prompt) return null;

  return (
    <SUSDialog
      open={open}
      onOpenChange={setOpen}
      userId={userId}
      trigger={prompt.trigger}
      onCompleted={handleCompleted}
      onSkip={handleSkip}
    />
  );
}
