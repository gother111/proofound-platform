'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { FeedbackSummary } from './FeedbackSummary';
import { AuthorRole, FeedbackEntry, InterviewFeedbackForm } from './InterviewFeedbackForm';

interface FeedbackState {
  mine: FeedbackEntry | null;
  theirs: FeedbackEntry | null;
  decisionRecorded: boolean;
}

const emptyState: FeedbackState = {
  mine: null,
  theirs: null,
  decisionRecorded: false,
};

interface InterviewFeedbackSectionProps {
  interviewId: string;
  viewerRole: AuthorRole;
}

export function InterviewFeedbackSection({
  interviewId,
  viewerRole,
}: InterviewFeedbackSectionProps) {
  const [feedbackState, setFeedbackState] = useState<FeedbackState>(emptyState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeedback = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/interviews/${interviewId}/feedback`);
      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || 'Unable to load feedback');
      }
      const data = await response.json();
      setFeedbackState({
        mine: data.feedback?.mine ?? null,
        theirs: data.feedback?.theirs ?? null,
        decisionRecorded: !!data.feedback?.decisionRecorded,
      });
    } catch (err: any) {
      setError(err?.message || 'Unable to load feedback');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId]);

  const handleSubmitted = (entry: FeedbackEntry) => {
    setFeedbackState((prev) => ({
      ...(prev || emptyState),
      mine: entry,
    }));
    // Refresh to pick up decision visibility changes and keep data fresh
    loadFeedback();
  };

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-[#F8F7F2] p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E6F4EF]">
          <MessageSquare className="h-4 w-4 text-[#1C4D3A]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#2D3330]">Two-way feedback</p>
          <p className="text-xs text-[#6B6760]">
            Share how the interview went. The other side’s notes appear after a decision is
            recorded.
          </p>
        </div>
        {isLoading && <Loader2 className="ml-auto h-4 w-4 animate-spin text-[#6B6760]" />}
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <FeedbackSummary
          viewerRole={viewerRole}
          mine={feedbackState.mine}
          theirs={feedbackState.theirs}
          decisionRecorded={feedbackState.decisionRecorded}
        />

        {!feedbackState.mine ? (
          <InterviewFeedbackForm
            interviewId={interviewId}
            existingFeedback={null}
            onSubmitted={handleSubmitted}
          />
        ) : (
          <div className="rounded-md bg-white p-3 text-sm text-[#2D3330]">
            Thanks for sharing your perspective. We’ll show the other side’s feedback once a final
            decision is recorded.
          </div>
        )}
      </div>
    </div>
  );
}
