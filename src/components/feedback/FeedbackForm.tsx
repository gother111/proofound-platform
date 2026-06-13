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
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
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

type QuestionErrors = Record<string, string>;

const FEEDBACK_SUBMIT_RETRY_MESSAGE =
  'Feedback could not be submitted. Your answers are still here; please try again.';
const FEEDBACK_VALIDATION_MESSAGE = 'Please fix the highlighted questions before submitting.';

const FEEDBACK_SUBMIT_ERROR_MESSAGES = new Map([
  [
    'Feedback is available after the interview is marked completed',
    'Feedback opens after the interview is marked completed. Your answers are still here.',
  ],
  [
    'No feedback template configured',
    'This feedback form is not ready yet. Ask the sender to resend the feedback request.',
  ],
  [
    'Structured feedback is required. Include a reason code, personalized note, and suggested next step.',
    'This feedback form needs a structured response before it can be submitted.',
  ],
  [
    'Feedback already submitted for this side',
    'Feedback has already been submitted for this side.',
  ],
  ['Could not save feedback', FEEDBACK_SUBMIT_RETRY_MESSAGE],
]);

function feedbackSubmitError(error?: string | null) {
  const normalized = error?.trim();

  if (!normalized || /^Something went wrong\.? Please try again\.?$/i.test(normalized)) {
    return FEEDBACK_SUBMIT_RETRY_MESSAGE;
  }

  const safeMessage = FEEDBACK_SUBMIT_ERROR_MESSAGES.get(normalized);
  if (safeMessage) {
    return safeMessage;
  }

  dispatchClientErrorDiagnostic('feedback.form.submit_returned_error', new Error(normalized));
  return FEEDBACK_SUBMIT_RETRY_MESSAGE;
}

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
  const [questionErrors, setQuestionErrors] = useState<QuestionErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const orderedQuestions = useMemo(
    () => [...template.questions].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [template.questions]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const nextQuestionErrors = orderedQuestions.reduce<QuestionErrors>((errors, question) => {
      const current = answers[question.id];

      if (question.question_type === 'scale') {
        const min = question.scale_min ?? 1;
        const max = question.scale_max ?? 5;
        const score = current?.score;

        if (question.required && (score === undefined || score === null)) {
          errors[question.id] = 'Choose a rating to complete this required question.';
          return errors;
        }

        if (
          score !== undefined &&
          score !== null &&
          (!Number.isFinite(score) || score < min || score > max)
        ) {
          errors[question.id] = `Choose a rating between ${min} and ${max}.`;
        }

        return errors;
      }

      if (question.required && !current?.textAnswer?.trim()) {
        errors[question.id] = 'Add a short answer to complete this required question.';
      }

      return errors;
    }, {});

    if (Object.keys(nextQuestionErrors).length > 0) {
      setQuestionErrors(nextQuestionErrors);
      setMessage({ tone: 'error', text: FEEDBACK_VALIDATION_MESSAGE });
      setSubmitting(false);
      return;
    }

    setQuestionErrors({});

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
      setSubmitted(true);
      setMessage({ tone: 'success', text: 'Feedback submitted. Thank you!' });
      setSubmitting(false);
      onSubmitted?.();
      return;
    }

    try {
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        setMessage({ tone: 'error', text: feedbackSubmitError(error?.error) });
        return;
      }

      setSubmitted(true);
      setMessage({ tone: 'success', text: 'Feedback submitted. Thank you!' });
      onSubmitted?.();
      router.refresh();
    } catch {
      setMessage({ tone: 'error', text: FEEDBACK_SUBMIT_RETRY_MESSAGE });
    } finally {
      setSubmitting(false);
    }
  };

  const clearQuestionError = (questionId: string) => {
    setQuestionErrors((current) => {
      if (!current[questionId]) return current;
      const next = { ...current };
      delete next[questionId];
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
          <p role="status" className="text-sm text-emerald-700">
            You already submitted feedback for this side.
          </p>
        ) : submitted ? (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl border border-[#D7E8DE] bg-[#F3FAF6] px-4 py-3 text-sm leading-6 text-proofound-forest"
          >
            <p className="font-semibold">Feedback submitted. Thank you!</p>
            <p className="mt-1">
              Your response is recorded for this interview side. You can close this page.
            </p>
          </div>
        ) : (
          // Use custom validation messaging instead of native HTML5 validation popups.
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {orderedQuestions.map((question) => {
              const inputId = `feedback-${question.id}`;
              const helperId = `${inputId}-helper`;
              const errorId = `${inputId}-error`;
              const questionError = questionErrors[question.id];
              const hasQuestionError = Boolean(questionError);
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
                        clearQuestionError(question.id);
                        const nextScore =
                          e.target.value === '' ? undefined : Number(e.target.value);
                        setAnswers((prev) => ({
                          ...prev,
                          [question.id]: {
                            ...prev[question.id],
                            score: nextScore,
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
                        clearQuestionError(question.id);
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
                      {questionError}
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
