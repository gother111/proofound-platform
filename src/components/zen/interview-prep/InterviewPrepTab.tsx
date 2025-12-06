'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { InterviewPrepCard, PrepSessionView } from './InterviewPrepCard';
import { PrepTipsList } from './PrepTipsList';
import { PracticeQuestionsPanel, PracticeQuestionRow } from './PracticeQuestionsPanel';
import { InterviewReflectionDialog } from './InterviewReflectionDialog';
import { ShieldCheck, Sparkles } from 'lucide-react';

type SessionResponse = {
  sessions: PrepSessionView[];
};

export function InterviewPrepTab() {
  const [sessions, setSessions] = useState<PrepSessionView[]>([]);
  const [activeSession, setActiveSession] = useState<PrepSessionView | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [tips, setTips] = useState<string[]>([]);
  const [isLoadingTips, setIsLoadingTips] = useState(false);
  const [questions, setQuestions] = useState<PracticeQuestionRow[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [showReflection, setShowReflection] = useState(false);

  const activeSessionId = activeSession?.session?.id ?? null;

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const res = await fetch('/api/interview-prep/sessions');
      if (!res.ok) throw new Error('Failed to load sessions');
      const data: SessionResponse = await res.json();
      setSessions(data.sessions || []);
      const withPrep = (data.sessions || []).find((s) => !!s.session);
      setActiveSession(withPrep || data.sessions?.[0] || null);
    } catch (error) {
      console.error(error);
      toast.error('Could not load interview prep');
      setSessions([]);
      setActiveSession(null);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const loadTips = async (assignmentId: string) => {
    setIsLoadingTips(true);
    try {
      const res = await fetch(`/api/interview-prep/tips?assignmentId=${assignmentId}`);
      if (!res.ok) throw new Error('Failed to load tips');
      const data = await res.json();
      setTips(data.tips || []);
      if (activeSessionId) {
        await fetch(`/api/interview-prep/sessions/${activeSessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipsViewed: true, status: 'in_progress' }),
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('Could not load tips');
    } finally {
      setIsLoadingTips(false);
    }
  };

  const loadQuestions = async (sessionId: string, assignmentId: string) => {
    setIsLoadingQuestions(true);
    try {
      const res = await fetch('/api/interview-prep/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, assignmentId }),
      });
      if (!res.ok) throw new Error('Failed to generate questions');
      const data = await res.json();
      setQuestions(
        (data.questions || []).map((q: any) => ({
          id: q.id,
          questionType: q.questionType,
          questionText: q.questionText,
          contextHint: q.contextHint,
          displayOrder: q.displayOrder,
        }))
      );
    } catch (error) {
      console.error(error);
      toast.error('Could not generate questions');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleStart = async (interviewId: string) => {
    try {
      const res = await fetch('/api/interview-prep/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId }),
      });
      if (!res.ok) throw new Error('Unable to start prep');
      toast.success('Prep session created');
      await loadSessions();
    } catch (error) {
      console.error(error);
      toast.error('Could not start prep');
    }
  };

  const handleSelect = (sessionId: string | null, record: PrepSessionView) => {
    setActiveSession(record);
    if (sessionId) {
      loadTips(record.assignment.id);
      loadQuestions(sessionId, record.assignment.id);
    } else {
      setTips([]);
      setQuestions([]);
    }
  };

  const handlePracticeProgress = async (count: number) => {
    if (!activeSessionId) return;
    try {
      await fetch(`/api/interview-prep/sessions/${activeSessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionsPracticed: count, status: 'in_progress' }),
      });
      await loadSessions();
    } catch (error) {
      console.error(error);
    }
  };

  const selectedLabel = useMemo(() => {
    if (!activeSession) return 'Select an interview to start prep';
    return `${activeSession.assignment.role} • ${new Date(activeSession.interview.scheduledAt).toLocaleDateString()}`;
  }, [activeSession]);

  const isEmpty = !isLoadingSessions && (sessions?.length ?? 0) === 0;

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-[#EEF1EA] dark:bg-[#1f1c19] border border-[#E8E6DD] dark:border-[#3C332C] flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 text-sm text-[#2D3330] dark:text-[#E8E6DD]">
          <ShieldCheck className="h-5 w-5 text-[#1C4D3A]" />
          <div>
            <div className="font-semibold">Privacy-first prep</div>
            <p className="text-xs text-[#6B6760]">
              Local curated questions only. Nothing is shared or used in matching scores.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#6B6760]">
          <Sparkles className="h-4 w-4 text-[#1C4D3A]" />
          <span>Generation: local curated templates (offline-capable)</span>
        </div>
      </Card>

      {isLoadingSessions ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : isEmpty ? (
        <Card className="p-8 text-center border-dashed border-[#E8E6DD] bg-white/70 dark:bg-[#1f1c19]">
          <div className="text-lg font-semibold text-[#2D3330] dark:text-[#E8E6DD] mb-2">
            No upcoming interviews
          </div>
          <p className="text-sm text-[#6B6760] max-w-xl mx-auto">
            When you schedule an interview, it will appear here so you can start prep with tips,
            practice questions, and a reflection space.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 space-y-3">
            {sessions.map((session) => (
              <InterviewPrepCard
                key={`${session.interview.id}-${session.session?.id || 'new'}`}
                data={session}
                onStart={handleStart}
                onSelect={handleSelect}
              />
            ))}
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#6B6760]">Active prep</p>
                <h3 className="text-lg font-semibold text-[#2D3330] dark:text-[#E8E6DD]">
                  {selectedLabel}
                </h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!activeSessionId}
                onClick={() => setShowReflection(true)}
              >
                Log reflection
              </Button>
            </div>

            <PrepTipsList tips={tips} isLoading={isLoadingTips} />

            <Separator />

            <PracticeQuestionsPanel
              questions={questions}
              isLoading={isLoadingQuestions}
              onMarkPracticed={handlePracticeProgress}
            />
          </div>
        </div>
      )}

      <InterviewReflectionDialog
        open={showReflection}
        sessionId={activeSessionId}
        onOpenChange={setShowReflection}
        onSaved={loadSessions}
      />
    </div>
  );
}
