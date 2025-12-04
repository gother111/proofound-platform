/**
 * SUS (System Usability Scale) Survey Dialog
 *
 * Standard 10-question SUS survey
 * PRD Requirement: Track system usability with target ≥75
 *
 * SUS Questions (alternating positive/negative):
 * 1. I think that I would like to use this system frequently (positive)
 * 2. I found the system unnecessarily complex (negative)
 * 3. I thought the system was easy to use (positive)
 * 4. I think that I would need the support of a technical person (negative)
 * 5. I found the various functions in this system were well integrated (positive)
 * 6. I thought there was too much inconsistency in this system (negative)
 * 7. I would imagine that most people would learn to use this system quickly (positive)
 * 8. I found the system very cumbersome to use (negative)
 * 9. I felt very confident using the system (positive)
 * 10. I needed to learn a lot of things before I could get going (negative)
 *
 * Scoring: Score = ((sum of odd items - 5) + (25 - sum of even items)) * 2.5
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { emitSUSCompleted } from '@/lib/analytics/events';
import { apiFetch } from '@/lib/api/fetch';

interface SUSDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerPoint?: string; // Where/when the survey was triggered
  onCompleted?: () => void;
}

const SUS_QUESTIONS = [
  { id: 1, text: 'I think that I would like to use this system frequently', positive: true },
  { id: 2, text: 'I found the system unnecessarily complex', positive: false },
  { id: 3, text: 'I thought the system was easy to use', positive: true },
  {
    id: 4,
    text: 'I think that I would need the support of a technical person to be able to use this system',
    positive: false,
  },
  {
    id: 5,
    text: 'I found the various functions in this system were well integrated',
    positive: true,
  },
  { id: 6, text: 'I thought there was too much inconsistency in this system', positive: false },
  {
    id: 7,
    text: 'I would imagine that most people would learn to use this system very quickly',
    positive: true,
  },
  { id: 8, text: 'I found the system very cumbersome to use', positive: false },
  { id: 9, text: 'I felt very confident using the system', positive: true },
  {
    id: 10,
    text: 'I needed to learn a lot of things before I could get going with this system',
    positive: false,
  },
];

export function SUSDialog({
  open,
  onOpenChange,
  triggerPoint = 'manual',
  onCompleted,
}: SUSDialogProps) {
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = Object.keys(responses).length + 1;
  const progress = (Object.keys(responses).length / SUS_QUESTIONS.length) * 100;
  const isComplete = Object.keys(responses).length === SUS_QUESTIONS.length;

  const handleResponse = (questionId: number, score: number) => {
    setResponses((prev) => ({ ...prev, [questionId]: score }));
  };

  const calculateSUSScore = (): number => {
    // SUS scoring algorithm
    let sumOdd = 0;
    let sumEven = 0;

    for (const question of SUS_QUESTIONS) {
      const score = responses[question.id] || 0;
      if (question.id % 2 === 1) {
        // Odd items (positive)
        sumOdd += score - 1; // Convert 1-5 to 0-4
      } else {
        // Even items (negative)
        sumEven += 5 - score; // Invert and convert
      }
    }

    return (sumOdd + sumEven) * 2.5;
  };

  const handleSubmit = async () => {
    if (!isComplete) {
      toast.error('Please answer all questions');
      return;
    }

    setIsSubmitting(true);

    try {
      const totalScore = calculateSUSScore();
      const individualScores = SUS_QUESTIONS.map((q) => responses[q.id]);

      // Submit to API
      const response = await apiFetch('/api/surveys/sus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses,
          totalScore,
          triggerPoint,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit survey');
      }

      // Emit analytics event
      await emitSUSCompleted(response.headers.get('x-user-id') || 'unknown', {
        total_score: totalScore,
        individual_scores: individualScores,
        trigger_point: triggerPoint,
      });

      toast.success(`Survey completed! Your score: ${totalScore.toFixed(0)}/100`);

      if (onCompleted) {
        onCompleted();
      }

      onOpenChange(false);

      // Reset for next time
      setTimeout(() => setResponses({}), 500);
    } catch (error) {
      console.error('Failed to submit SUS survey:', error);
      toast.error('Failed to submit survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    setTimeout(() => setResponses({}), 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Help Us Improve</DialogTitle>
          <DialogDescription>
            Please take a moment to rate your experience with Proofound. This helps us make the
            platform better for everyone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#2D3330]">
                Question {currentQuestion} of {SUS_QUESTIONS.length}
              </span>
              <span className="text-sm text-[#6B6760]">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Questions */}
          {SUS_QUESTIONS.map((question, idx) => {
            const hasAnswered = responses[question.id] !== undefined;
            const isCurrentQuestion = idx + 1 === currentQuestion;

            // Only show current question and already answered ones
            if (idx + 1 > currentQuestion) return null;

            return (
              <div
                key={question.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isCurrentQuestion
                    ? 'border-[#1C4D3A] bg-[#E8F5E1]'
                    : hasAnswered
                      ? 'border-[#E8E6DD] bg-[#F7F6F1]'
                      : 'border-[#E8E6DD] bg-white'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      hasAnswered ? 'bg-[#1C4D3A] text-white' : 'bg-[#E8E6DD] text-[#6B6760]'
                    }`}
                  >
                    {question.id}
                  </div>
                  <p className="text-sm text-[#2D3330] flex-1">{question.text}</p>
                </div>

                <RadioGroup
                  value={responses[question.id]?.toString() || ''}
                  onValueChange={(value) => handleResponse(question.id, parseInt(value))}
                  disabled={hasAnswered && !isCurrentQuestion}
                >
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <div key={score} className="text-center">
                        <RadioGroupItem
                          value={score.toString()}
                          id={`q${question.id}-${score}`}
                          className="mx-auto mb-1"
                        />
                        <Label
                          htmlFor={`q${question.id}-${score}`}
                          className="text-xs cursor-pointer"
                        >
                          {score === 1 && 'Strongly\nDisagree'}
                          {score === 2 && 'Disagree'}
                          {score === 3 && 'Neutral'}
                          {score === 4 && 'Agree'}
                          {score === 5 && 'Strongly\nAgree'}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            );
          })}

          {/* Info Note */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Your responses are anonymous and will only be used to improve
              the platform. This survey takes less than 2 minutes.
            </p>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
            Skip for now
          </Button>
          <div className="flex gap-2">
            {currentQuestion > 1 && !isComplete && (
              <Button
                variant="outline"
                onClick={() => {
                  const newResponses = { ...responses };
                  delete newResponses[currentQuestion];
                  setResponses(newResponses);
                }}
                disabled={isSubmitting}
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={!isComplete || isSubmitting}
              className="bg-[#1C4D3A] text-white"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Survey'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
