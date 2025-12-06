'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

export type AuthorRole = 'candidate' | 'org';

export interface FeedbackEntry {
  id: string;
  interviewId: string;
  authorUserId: string;
  authorRole: AuthorRole;
  fairnessRating: number;
  clarityRating: number;
  experienceRating: number;
  comments: string;
  createdAt: string | Date;
  updatedAt?: string | Date | null;
}

interface InterviewFeedbackFormProps {
  interviewId: string;
  existingFeedback?: FeedbackEntry | null;
  onSubmitted: (feedback: FeedbackEntry) => void;
}

const ratingOptions = [1, 2, 3, 4, 5];

export function InterviewFeedbackForm({
  interviewId,
  existingFeedback,
  onSubmitted,
}: InterviewFeedbackFormProps) {
  const { toast } = useToast();

  const [fairnessRating, setFairnessRating] = useState<number>(
    existingFeedback?.fairnessRating || 4
  );
  const [clarityRating, setClarityRating] = useState<number>(existingFeedback?.clarityRating || 4);
  const [experienceRating, setExperienceRating] = useState<number>(
    existingFeedback?.experienceRating || 4
  );
  const [comments, setComments] = useState<string>(existingFeedback?.comments || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasSubmitted = !!existingFeedback;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (hasSubmitted) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/interviews/${interviewId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fairnessRating,
          clarityRating,
          experienceRating,
          comments: comments.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit feedback');
      }

      const data = await response.json();
      onSubmitted(data.feedback as FeedbackEntry);

      toast({
        title: 'Feedback submitted',
        description: 'Thanks for sharing how the interview went.',
      });
    } catch (error: any) {
      toast({
        title: 'Could not submit feedback',
        description: error?.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasSubmitted && existingFeedback) {
    return (
      <div className="rounded-md border border-green-100 bg-green-50 p-3 text-sm text-[#1C4D3A]">
        You already shared feedback for this interview. Thank you!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-sm text-[#2D3330]">Fairness (1 = low, 5 = high)</Label>
          <Select
            value={String(fairnessRating)}
            onValueChange={(value) => setFairnessRating(Number(value))}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Rate fairness" />
            </SelectTrigger>
            <SelectContent>
              {ratingOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-[#2D3330]">Clarity of questions</Label>
          <Select
            value={String(clarityRating)}
            onValueChange={(value) => setClarityRating(Number(value))}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Rate clarity" />
            </SelectTrigger>
            <SelectContent>
              {ratingOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-[#2D3330]">Overall experience</Label>
          <Select
            value={String(experienceRating)}
            onValueChange={(value) => setExperienceRating(Number(value))}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Rate experience" />
            </SelectTrigger>
            <SelectContent>
              {ratingOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-[#2D3330]">
          What went well? What should improve? (required)
        </Label>
        <Textarea
          value={comments}
          onChange={(event) => setComments(event.target.value)}
          placeholder="Share specific, constructive feedback to help both sides improve."
          className="min-h-[120px] bg-white"
          required
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-[#6B6760]">
          Your feedback is shared with the other side after a final decision is recorded.
        </p>
        <Button type="submit" disabled={isSubmitting || !comments.trim()} className="bg-[#1C4D3A]">
          {isSubmitting ? 'Submitting...' : 'Submit feedback'}
        </Button>
      </div>
    </form>
  );
}
