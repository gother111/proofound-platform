'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  clientFeedbackVisualFixturesEnabled,
  VISUAL_FEEDBACK_TOKENS,
} from '@/lib/feedback/visual-fixtures';
import { cn } from '@/lib/utils';

type Direction = 'candidate_to_org' | 'org_to_candidate';

type Question = {
  id: string;
  prompt: string;
  question_type: 'scale' | 'text';
  scale_min?: number | null;
  scale_max?: number | null;
  required: boolean;
  sort_order?: number;
  helper_text?: string | null;
};

type Template = {
  id: string;
  name: string;
  direction: Direction;
  description?: string | null;
  questions: Question[];
};

type FeedbackFormProps = {
  template: Template;
  interviewId?: string;
  token?: string;
  onSubmitted?: () => void;
  alreadySubmitted?: boolean;
  surface?: 'card' | 'embedded';
};

type AnswerState = Record<
  string,
  {
    score?: number;
    textAnswer?: string;
  }
>;

type FormMessage = {
  tone: 'success' | 'error';
  text: string;
};

export function FeedbackForm({
  template,
  interviewId,
  token,
  onSubmitted,
  alreadySubmitted = false,
  surface = 'card',
}: FeedbackFormProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<AnswerState>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [missingQuestionIds, setMissingQuestionIds] = useState<Set<string>>(() => new Set());

  const orderedQuestions = useMemo(
    () => [...template.questions].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [template.questions]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const missingRequiredIds = orderedQuestions.flatMap((q) => {
      const current = answers[q.id];
      if (!q.required) return [];
      if (q.question_type === 'scale') {
        return current?.score === undefined || current?.score === null ? [q.id] : [];
      }
      return !current?.textAnswer?.trim() ? [q.id] : [];
    });

    if (missingRequiredIds.length > 0) {
      setMissingQuestionIds(new Set(missingRequiredIds));
      setMessage({ tone: 'error', text: 'Please complete the required questions marked below.' });
      setSubmitting(false);
      return;
    }

    setMissingQuestionIds(new Set());

    const payload = {
      interviewId,
      direction: template.direction,
      templateId: template.id,
      token,
      answers: orderedQuestions.map((q) => ({
        questionId: q.id,
        score: q.question_type === 'scale' ? (answers[q.id]?.score ?? null) : null,
        textAnswer: q.question_type === 'text' ? (answers[q.id]?.textAnswer ?? '') : undefined,
      })),
    };

    if (
      clientFeedbackVisualFixturesEnabled() &&
      token === VISUAL_FEEDBACK_TOKENS.pendingCandidateToOrg
    ) {
      setMessage({ tone: 'success', text: 'Feedback submitted. Thank you!' });
      setSubmitting(false);
      onSubmitted?.();
      return;
    }

    const response = await fetch('/api/feedback/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      setMessage({ tone: 'error', text: error.error || 'Something went wrong. Please try again.' });
      setSubmitting(false);
      return;
    }

    setMessage({ tone: 'success', text: 'Feedback submitted. Thank you!' });
    setSubmitting(false);
    onSubmitted?.();
    router.refresh();
  };

  const clearMissingQuestion = (questionId: string) => {
    setMissingQuestionIds((current) => {
      if (!current.has(questionId)) return current;
      const next = new Set(current);
      next.delete(questionId);
      return next;
    });
  };

  const directionCopy =
    template.direction === 'candidate_to_org'
      ? 'Share feedback with the organization'
      : 'Share workflow feedback';

  const frameClassName =
    surface === 'card'
      ? 'space-y-4 rounded-xl border bg-card text-card-foreground shadow-sm'
      : 'space-y-4';
  const headerClassName = surface === 'card' ? undefined : 'px-0 pt-0';
  const contentClassName = surface === 'card' ? undefined : 'px-0 pb-0';

  return (
    <section className={frameClassName}>
      <CardHeader className={headerClassName}>
        <CardTitle className="text-lg">{directionCopy}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Your name will not be shown to the other side. Required questions are labeled Required.
        </p>
      </CardHeader>
      <CardContent className={contentClassName}>
        {alreadySubmitted ? (
          <p className="text-sm text-emerald-700">You already submitted feedback for this side.</p>
        ) : (
          // Use custom validation messaging instead of native HTML5 validation popups.
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {orderedQuestions.map((question) => {
              const inputId = `feedback-${question.id}`;
              const helperId = `${inputId}-helper`;
              const errorId = `${inputId}-error`;
              const hasQuestionError = missingQuestionIds.has(question.id);
              const describedBy = [
                question.helper_text ? helperId : null,
                hasQuestionError ? errorId : null,
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <div key={question.id} className="space-y-2">
                  <Label
                    className="flex flex-wrap items-center gap-2 font-medium"
                    htmlFor={inputId}
                  >
                    <span>{question.prompt}</span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                        question.required
                          ? 'bg-[#F5E8DE] text-[#8A3F21]'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {question.required ? 'Required' : 'Optional'}
                    </span>
                  </Label>
                  {question.helper_text ? (
                    <p id={helperId} className="text-xs text-muted-foreground">
                      {question.helper_text}
                    </p>
                  ) : null}
                  {question.question_type === 'scale' ? (
                    <Input
                      id={inputId}
                      type="number"
                      min={question.scale_min ?? 1}
                      max={question.scale_max ?? 5}
                      step={1}
                      required={question.required}
                      aria-invalid={hasQuestionError || undefined}
                      aria-describedby={describedBy || undefined}
                      value={answers[question.id]?.score ?? ''}
                      onChange={(e) => {
                        clearMissingQuestion(question.id);
                        setAnswers((prev) => ({
                          ...prev,
                          [question.id]: {
                            ...prev[question.id],
                            score: Number(e.target.value),
                          },
                        }));
                      }}
                    />
                  ) : (
                    <Textarea
                      id={inputId}
                      placeholder={
                        question.required ? 'Add the required context' : 'Add details (optional)'
                      }
                      required={question.required}
                      aria-invalid={hasQuestionError || undefined}
                      aria-describedby={describedBy || undefined}
                      value={answers[question.id]?.textAnswer ?? ''}
                      onChange={(e) => {
                        clearMissingQuestion(question.id);
                        setAnswers((prev) => ({
                          ...prev,
                          [question.id]: {
                            ...prev[question.id],
                            textAnswer: e.target.value,
                          },
                        }));
                      }}
                    />
                  )}
                  {hasQuestionError ? (
                    <p id={errorId} className="text-xs font-medium text-destructive">
                      {question.question_type === 'scale'
                        ? 'Choose a rating to complete this required question.'
                        : 'Add a short answer to complete this required question.'}
                    </p>
                  ) : null}
                </div>
              );
            })}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? 'Submitting...' : 'Submit feedback'}
              </Button>
              {message ? (
                <span
                  role={message.tone === 'success' ? 'status' : 'alert'}
                  aria-live={message.tone === 'success' ? 'polite' : 'assertive'}
                  className={cn(
                    'rounded-xl px-3 py-2 text-sm leading-6',
                    message.tone === 'success' ? 'text-emerald-700' : 'text-destructive'
                  )}
                >
                  {message.text}
                </span>
              ) : null}
            </div>
          </form>
        )}
      </CardContent>
    </section>
  );
}

export default FeedbackForm;
