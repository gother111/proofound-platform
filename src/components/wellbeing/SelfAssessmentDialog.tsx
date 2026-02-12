/**
 * Well-being Check-in Dialog
 *
 * Uses short 2-question reflections to help users self-track mood and worry.
 * This is non-diagnostic and private-by-default.
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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle2, Info, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface SelfAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'phq2' | 'gad2';
  onComplete?: (score: number, severity: string) => void;
}

const PHQ2_QUESTIONS = [
  {
    id: 'phq2_1',
    text: 'Over the last 2 weeks, how often have you been bothered by little interest or pleasure in doing things?',
  },
  {
    id: 'phq2_2',
    text: 'Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?',
  },
];

const GAD2_QUESTIONS = [
  {
    id: 'gad2_1',
    text: 'Over the last 2 weeks, how often have you been bothered by feeling nervous, anxious, or on edge?',
  },
  {
    id: 'gad2_2',
    text: 'Over the last 2 weeks, how often have you been bothered by not being able to stop or control worrying?',
  },
];

const RESPONSE_OPTIONS = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
];

export function SelfAssessmentDialog({
  open,
  onOpenChange,
  type,
  onComplete,
}: SelfAssessmentDialogProps) {
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = type === 'phq2' ? PHQ2_QUESTIONS : GAD2_QUESTIONS;
  const title = type === 'phq2' ? 'Mood Check-in (2 Questions)' : 'Worry Check-in (2 Questions)';
  const description =
    type === 'phq2'
      ? 'A short self-reflection on your recent mood.'
      : 'A short self-reflection on recent worry and tension.';

  const handleResponse = (questionId: string, value: number) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const calculateScore = () => {
    return Object.values(responses).reduce((sum, val) => sum + val, 0);
  };

  const getSeverity = (score: number): { level: string; color: string; icon: any } => {
    if (score <= 2) {
      return {
        level: 'Low Strain',
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle2,
      };
    }
    if (score <= 4) {
      return {
        level: 'Elevated Strain',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: Info,
      };
    }
    return {
      level: 'High Strain',
      color: 'bg-red-100 text-red-800 border-red-300',
      icon: AlertTriangle,
    };
  };

  const handleSubmit = async () => {
    const score = calculateScore();
    const severity = getSeverity(score);

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/wellbeing/self-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentType: type,
          score,
          severity: severity.level,
          responses,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save assessment');
      }

      setShowResults(true);
      if (onComplete) {
        onComplete(score, severity.level);
      }
    } catch (error) {
      console.error('Failed to save self-assessment:', error);
      toast.error('Failed to save assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setResponses({});
    setShowResults(false);
    onOpenChange(false);
  };

  const allQuestionsAnswered = questions.every((q) => responses[q.id] !== undefined);
  const score = calculateScore();
  const severity = getSeverity(score);
  const SeverityIcon = severity.icon;

  if (showResults) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-['Crimson_Pro']">Your Results</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Score Display */}
            <Card className={`border-2 ${severity.color}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium mb-1">Total Score</p>
                    <p className="text-4xl font-bold">{score} / 6</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={`mb-2 ${severity.color}`}>
                      {severity.level}
                    </Badge>
                    <div className="flex items-center gap-2 justify-end">
                      <SeverityIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">Personal Check-in Signal</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interpretation */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">What does this mean?</h3>

              {severity.level === 'Low Strain' && (
                <Alert className="border-green-300 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <strong>Low strain:</strong> Your recent responses look stable. Keep your
                    routine and continue quick check-ins.
                  </AlertDescription>
                </Alert>
              )}

              {severity.level === 'Elevated Strain' && (
                <Alert className="border-yellow-300 bg-yellow-50">
                  <Info className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>
                    <strong>Elevated strain:</strong> You may be carrying extra pressure recently.
                    Consider using Zen Hub practices and checking in again within a few days.
                  </AlertDescription>
                </Alert>
              )}

              {severity.level === 'High Strain' && (
                <Alert className="border-red-300 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    <strong>High strain detected:</strong> You may benefit from additional support
                    right now. If this persists or worsens, consider contacting a qualified
                    professional.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Safety Disclaimer */}
            <Alert className="border-blue-300 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm">
                <strong>Important:</strong> This check-in is non-diagnostic and not medical advice.
                If you are in immediate danger or crisis, contact local emergency services or a
                crisis line immediately (988 in the US).
              </AlertDescription>
            </Alert>

            {/* Next Steps */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Recommended Next Steps</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#1C4D3A] text-white flex items-center justify-center text-sm flex-shrink-0">
                    1
                  </div>
                  <p className="text-sm">
                    Continue regular check-ins to monitor your trend over time
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#1C4D3A] text-white flex items-center justify-center text-sm flex-shrink-0">
                    2
                  </div>
                  <p className="text-sm">
                    Practice grounding techniques and mindfulness exercises from the Zen Hub toolkit
                  </p>
                </div>
                {severity.level !== 'Low Strain' && (
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#1C4D3A] text-white flex items-center justify-center text-sm flex-shrink-0">
                      3
                    </div>
                    <p className="text-sm">
                      Reach out to a trusted person or qualified professional if support would help
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleClose} className="bg-[#1C4D3A] text-white">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-['Crimson_Pro']">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Context */}
          <Alert className="border-blue-300 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm">
              <strong>About this check-in:</strong> This takes about one minute and helps you track
              your own well-being trend over time. Responses are private and never used in matching
              rankings.
            </AlertDescription>
          </Alert>

          {/* Questions */}
          <div className="space-y-6">
            {questions.map((question, index) => (
              <Card key={question.id} className="border-[#E8E6DD] dark:border-border">
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <Badge variant="outline" className="mb-2">
                      Question {index + 1} of {questions.length}
                    </Badge>
                    <p className="text-[#2D3330] dark:text-foreground font-medium">
                      {question.text}
                    </p>
                  </div>

                  <RadioGroup
                    value={responses[question.id]?.toString()}
                    onValueChange={(value) => handleResponse(question.id, parseInt(value))}
                  >
                    <div className="space-y-2">
                      {RESPONSE_OPTIONS.map((option) => (
                        <div
                          key={option.value}
                          className="flex items-center space-x-2 p-3 rounded-lg border border-[#E8E6DD] dark:border-border hover:bg-[#F7F6F1] dark:hover:bg-background/50 cursor-pointer"
                        >
                          <RadioGroupItem
                            value={option.value.toString()}
                            id={`${question.id}_${option.value}`}
                          />
                          <Label
                            htmlFor={`${question.id}_${option.value}`}
                            className="flex-1 cursor-pointer"
                          >
                            {option.label}
                          </Label>
                          <span className="text-sm text-[#6B6760] dark:text-muted-foreground">
                            {option.value} {option.value === 1 ? 'point' : 'points'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 text-sm text-[#6B6760] dark:text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span>
              {Object.keys(responses).length} of {questions.length} questions answered
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!allQuestionsAnswered || isSubmitting}
            className="bg-[#1C4D3A] text-white"
          >
            {isSubmitting ? 'Submitting...' : 'Save Check-in'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
