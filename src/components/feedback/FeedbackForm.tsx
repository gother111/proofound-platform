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
  const [message, setMessage] = useState<string | null>(null);

  const orderedQuestions = useMemo(
    () => [...template.questions].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [template.questions]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const missingRequired = orderedQuestions.some((q) => {
      const current = answers[q.id];
      if (!q.required) return false;
      if (q.question_type === 'scale') {
        return current?.score === undefined || current?.score === null;
      }
      return !current?.textAnswer?.trim();
    });

    if (missingRequired) {
      setMessage('Please complete the required questions.');
      setSubmitting(false);
      return;
    }

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
      setMessage('Feedback submitted. Thank you!');
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
      setMessage(error.error || 'Something went wrong. Please try again.');
      setSubmitting(false);
      return;
    }

    setMessage('Feedback submitted. Thank you!');
    setSubmitting(false);
    onSubmitted?.();
    router.refresh();
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
          Your name will not be shown to the other side. Required items are marked with *.
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
              return (
                <div key={question.id} className="space-y-2">
                  <Label className="font-medium" htmlFor={inputId}>
                    {question.prompt}
                    {question.required ? ' *' : ''}
                  </Label>
                  {question.helper_text ? (
                    <p className="text-xs text-muted-foreground">{question.helper_text}</p>
                  ) : null}
                  {question.question_type === 'scale' ? (
                    <Input
                      id={inputId}
                      type="number"
                      min={question.scale_min ?? 1}
                      max={question.scale_max ?? 5}
                      step={1}
                      required={question.required}
                      value={answers[question.id]?.score ?? ''}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [question.id]: {
                            ...prev[question.id],
                            score: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  ) : (
                    <Textarea
                      id={inputId}
                      placeholder="Add details (optional)"
                      required={question.required}
                      value={answers[question.id]?.textAnswer ?? ''}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [question.id]: {
                            ...prev[question.id],
                            textAnswer: e.target.value,
                          },
                        }))
                      }
                    />
                  )}
                </div>
              );
            })}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? 'Submitting...' : 'Submit feedback'}
              </Button>
              {message ? (
                <span
                  role={message.includes('Thank') ? 'status' : 'alert'}
                  className={cn(
                    'rounded-xl px-3 py-2 text-sm leading-6',
                    message.includes('Thank') ? 'text-emerald-700' : 'text-destructive'
                  )}
                >
                  {message}
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
