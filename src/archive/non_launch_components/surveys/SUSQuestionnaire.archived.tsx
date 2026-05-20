'use client';

/**
 * System Usability Scale (SUS) Questionnaire Component
 *
 * PRD: Part 2 (lines 83-84), Part 12
 * Target: SUS ≥75
 *
 * 10 standard questions with 5-point Likert scale
 * Used at key collection points:
 * - After profile activation (I-05 complete)
 * - After first assignment creation (O-07 complete)
 * - After 10 matches viewed (I-17)
 * - Quarterly check-in for active users
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import {
  SUS_QUESTIONS,
  LIKERT_SCALE,
  calculateSUSScore,
  type SUSResponse,
} from '@/lib/surveys/sus-calculator';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/fetch';

interface SUSQuestionnaireProps {
  trigger: 'profile_activation' | 'first_assignment' | '10_matches' | 'quarterly_checkin';
  userId: string;
  onComplete?: (score: number) => void;
  onSkip?: () => void;
}

export function SUSQuestionnaire({ trigger, userId, onComplete, onSkip }: SUSQuestionnaireProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Partial<SUSResponse>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);

  const progress = ((currentQuestion + 1) / SUS_QUESTIONS.length) * 100;
  const currentQ = SUS_QUESTIONS[currentQuestion];

  const handleResponse = (value: string) => {
    const questionKey = `q${currentQuestion + 1}` as keyof SUSResponse;
    setResponses((prev) => ({
      ...prev,
      [questionKey]: parseInt(value),
    }));
  };

  const handleNext = () => {
    const questionKey = `q${currentQuestion + 1}` as keyof SUSResponse;
    if (!responses[questionKey]) {
      toast.error('Please select an option before continuing');
      return;
    }

    if (currentQuestion < SUS_QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Calculate SUS score
      const susResult = calculateSUSScore(responses as SUSResponse);

      // Submit to API
      const response = await apiFetch('/api/surveys/sus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          trigger,
          responses,
          score: susResult.rawScore,
          grade: susResult.grade,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit survey');
      }

      setResult(susResult);
      setShowResult(true);

      toast.success('Thank you for your feedback!');

      if (onComplete) {
        onComplete(susResult.rawScore);
      }
    } catch (error) {
      console.error('Failed to submit SUS survey:', error);
      toast.error('Failed to submit survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  if (showResult && result) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            {result.meetsTarget ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-600" />
            )}
            <CardTitle>Thank You for Your Feedback!</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <div className="text-6xl font-bold text-proofound-forest">
              {result.rawScore.toFixed(0)}
            </div>
            <div className="text-xl font-semibold text-proofound-sage">{result.adjective}</div>
            <div className="text-sm text-gray-600">
              Grade: {result.grade} (Top {result.percentile}%)
            </div>
          </div>

          <div className="bg-proofound-linen p-4 rounded-lg">
            <p className="text-sm text-gray-700">{result.interpretation}</p>
          </div>

          <div className="flex justify-center">
            <Button onClick={() => setShowResult(false)} variant="outline">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Help Us Improve Proofound</CardTitle>
        <CardDescription>
          Quick 10-question survey to understand your experience (2 minutes)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>
              Question {currentQuestion + 1} of {SUS_QUESTIONS.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current question */}
        <div className="space-y-4">
          <Label className="text-lg font-medium">{currentQ.text}</Label>

          <RadioGroup
            value={responses[`q${currentQuestion + 1}` as keyof SUSResponse]?.toString()}
            onValueChange={handleResponse}
          >
            {LIKERT_SCALE.map((option) => (
              <div
                key={option.value}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RadioGroupItem value={option.value.toString()} id={`option-${option.value}`} />
                <Label
                  htmlFor={`option-${option.value}`}
                  className="flex-1 cursor-pointer font-normal"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
              Previous
            </Button>
            <Button variant="ghost" onClick={handleSkip}>
              Skip Survey
            </Button>
          </div>

          <Button
            onClick={handleNext}
            disabled={!responses[`q${currentQuestion + 1}` as keyof SUSResponse]}
            loading={isSubmitting}
          >
            {currentQuestion === SUS_QUESTIONS.length - 1 ? 'Submit' : 'Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Modal wrapper for SUS questionnaire
 */
interface SUSModalProps extends SUSQuestionnaireProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SUSModal({ open, onOpenChange, ...props }: SUSModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <SUSQuestionnaire
          {...props}
          onComplete={(score) => {
            props.onComplete?.(score);
            // Keep modal open to show results
          }}
          onSkip={() => {
            props.onSkip?.();
            onOpenChange(false);
          }}
        />
      </div>
    </div>
  );
}
