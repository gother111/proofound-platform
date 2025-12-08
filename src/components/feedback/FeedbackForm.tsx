'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
      : 'Share feedback with the candidate';

  return (
    <Card className="space-y-4">
      <CardHeader>
        <CardTitle className="text-lg">{directionCopy}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Your name will not be shown to the other side. Required items are marked with *.
        </p>
      </CardHeader>
      <CardContent>
        {alreadySubmitted ? (
          <p className="text-sm text-emerald-700">You already submitted feedback for this side.</p>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
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

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit feedback'}
              </Button>
              {message ? (
                <span
                  className={cn(
                    'text-sm',
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
    </Card>
  );
}

export default FeedbackForm;
