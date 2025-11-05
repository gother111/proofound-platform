/**
 * System Usability Scale (SUS) Survey Component
 *
 * Displays the standard 10-question SUS survey in a modal/drawer format.
 * Users can dismiss the survey or complete it.
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { SUS_QUESTIONS, type SUSResponse } from '@/lib/feedback/sus-scoring';
import { X } from 'lucide-react';

interface SUSSurveyProps {
  open: boolean;
  onClose: () => void;
  task?: string; // What task prompted this survey
  onComplete: (responses: SUSResponse[]) => Promise<void>;
  onDismiss: () => void;
}

export function SUSSurvey({ open, onClose, task, onComplete, onDismiss }: SUSSurveyProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Map<number, number>>(new Map());
  const [submitting, setSubmitting] = useState(false);

  const handleResponse = (questionId: number, value: number) => {
    setResponses(new Map(responses.set(questionId, value)));
  };

  const handleNext = () => {
    if (currentQuestion < SUS_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    // Validate all questions answered
    if (responses.size !== SUS_QUESTIONS.length) {
      alert('Please answer all questions before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      const responseArray: SUSResponse[] = Array.from(responses.entries()).map(
        ([questionId, value]) => ({
          questionId,
          value,
        })
      );

      await onComplete(responseArray);
      onClose();
    } catch (error) {
      console.error('Error submitting SUS survey:', error);
      alert('Failed to submit survey. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = () => {
    if (responses.size > 0) {
      const confirmed = confirm('Are you sure you want to close? Your progress will be lost.');
      if (!confirmed) return;
    }

    onDismiss();
    onClose();
  };

  const currentQuestionData = SUS_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / SUS_QUESTIONS.length) * 100;
  const currentAnswer = responses.get(currentQuestionData.id);
  const canProceed = currentAnswer !== undefined;

  return (
    <Dialog open={open} onOpenChange={handleDismiss}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Quick Feedback</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-6 w-6 rounded-full"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <DialogDescription>
            Help us improve by sharing your experience. This takes about 2 minutes.
            {task && <span className="block mt-1 text-xs">Context: {task.replace(/_/g, ' ')}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Question {currentQuestion + 1} of {SUS_QUESTIONS.length}
              </span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question */}
          <div className="space-y-4">
            <p className="text-base font-medium leading-relaxed">{currentQuestionData.text}</p>

            {/* Response options */}
            <RadioGroup
              value={currentAnswer?.toString()}
              onValueChange={(value) => handleResponse(currentQuestionData.id, parseInt(value))}
            >
              <div className="space-y-3">
                {[
                  { value: 1, label: 'Strongly disagree' },
                  { value: 2, label: 'Disagree' },
                  { value: 3, label: 'Neutral' },
                  { value: 4, label: 'Agree' },
                  { value: 5, label: 'Strongly agree' },
                ].map((option) => (
                  <div key={option.value} className="flex items-center space-x-3">
                    <RadioGroupItem value={option.value.toString()} id={`option-${option.value}`} />
                    <Label
                      htmlFor={`option-${option.value}`}
                      className="font-normal cursor-pointer flex-1"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>

            {currentQuestion < SUS_QUESTIONS.length - 1 ? (
              <Button type="button" onClick={handleNext} disabled={!canProceed}>
                Next
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={!canProceed || submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            )}
          </div>

          {/* Helper text */}
          <p className="text-xs text-muted-foreground text-center">
            Your feedback helps us make Proofound better for everyone.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
