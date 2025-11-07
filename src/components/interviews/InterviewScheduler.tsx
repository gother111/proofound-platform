/**
 * Interview Scheduler Component
 *
 * Comprehensive interview scheduling UI with:
 * - Step-by-step wizard flow
 * - Video provider selection (Zoom/Google Meet)
 * - Date/time picker with 7-day constraint
 * - Duration selector (enforced 30 min max)
 * - Timezone confirmation
 * - Review & send invite
 *
 * PRD Requirements:
 * - Max 30 min duration
 * - Must be within 7 days of match acceptance
 * - Only 1 reschedule allowed
 * - Auto-generates meeting link
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  Video,
  Globe,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { VideoProviderSelector } from './VideoProviderSelector';
import { TimeSlotPicker } from './TimeSlotPicker';
import { InterviewConfirmation } from './InterviewConfirmation';

interface InterviewSchedulerProps {
  matchId: string;
  assignmentId: string;
  candidateId: string;
  candidateName?: string;
  matchAcceptedAt: Date;
  onScheduled?: (interview: any) => void;
  onCancel?: () => void;
}

type Step = 'provider' | 'datetime' | 'duration' | 'timezone' | 'review';

export function InterviewScheduler({
  matchId,
  assignmentId,
  candidateId,
  candidateName = 'Candidate',
  matchAcceptedAt,
  onScheduled,
  onCancel,
}: InterviewSchedulerProps) {
  const [currentStep, setCurrentStep] = useState<Step>('provider');
  const [provider, setProvider] = useState<'zoom' | 'google_meet' | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duration, setDuration] = useState(30); // Fixed at 30 min per PRD
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduledInterview, setScheduledInterview] = useState<any>(null);

  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: 'provider', label: 'Video Platform', icon: <Video className="w-4 h-4" /> },
    { id: 'datetime', label: 'Date & Time', icon: <Calendar className="w-4 h-4" /> },
    { id: 'duration', label: 'Duration', icon: <Clock className="w-4 h-4" /> },
    { id: 'timezone', label: 'Timezone', icon: <Globe className="w-4 h-4" /> },
    { id: 'review', label: 'Review', icon: <CheckCircle className="w-4 h-4" /> },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Calculate 7-day window
  const minDate = new Date();
  const maxDate = new Date(matchAcceptedAt);
  maxDate.setDate(maxDate.getDate() + 7);

  const canProceed = () => {
    switch (currentStep) {
      case 'provider':
        return provider !== null;
      case 'datetime':
        return selectedDate !== null && selectedTime !== null;
      case 'duration':
        return duration === 30; // Always true since it's fixed
      case 'timezone':
        return timezone !== '';
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 'review') {
      handleSchedule();
    } else {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < steps.length) {
        setCurrentStep(steps[nextIndex].id);
      }
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleSchedule = async () => {
    if (!provider || !selectedDate || !selectedTime) {
      toast.error('Missing required information');
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine date and time
      const [hours, minutes] = selectedTime.split(':');
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const response = await fetch('/api/interviews/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          scheduledAt: scheduledDateTime.toISOString(),
          platform: provider,
          participantUserIds: [candidateId],
          timezone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to schedule interview');
      }

      setScheduledInterview(data.interview);
      toast.success('Interview scheduled successfully!');

      if (onScheduled) {
        onScheduled(data.interview);
      }
    } catch (error) {
      console.error('Failed to schedule interview:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to schedule interview');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (scheduledInterview) {
    return (
      <InterviewConfirmation
        interview={scheduledInterview}
        candidateName={candidateName}
        onClose={onCancel}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-[#2D3330]">Schedule Interview</h2>
          <Badge variant="outline" className="text-xs">
            Step {currentStepIndex + 1} of {steps.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />

        {/* Step Indicators */}
        <div className="flex items-center justify-between mt-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex flex-col items-center ${
                index <= currentStepIndex ? 'text-[#1C4D3A]' : 'text-[#6B6760]'
              }`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 mb-1 ${
                  index < currentStepIndex
                    ? 'bg-[#1C4D3A] border-[#1C4D3A] text-white'
                    : index === currentStepIndex
                      ? 'border-[#1C4D3A] bg-[#E8F5E1]'
                      : 'border-[#E8E6DD] bg-white'
                }`}
              >
                {index < currentStepIndex ? <CheckCircle className="w-4 h-4" /> : step.icon}
              </div>
              <span className="text-xs hidden sm:block">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{steps[currentStepIndex].label}</CardTitle>
          <CardDescription>
            {currentStep === 'provider' && 'Choose your preferred video conferencing platform'}
            {currentStep === 'datetime' &&
              `Select date and time (must be within 7 days, by ${maxDate.toLocaleDateString()})`}
            {currentStep === 'duration' && 'Interview duration is fixed at 30 minutes'}
            {currentStep === 'timezone' && 'Confirm your timezone for the interview'}
            {currentStep === 'review' && 'Review and confirm your interview details'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Video Provider */}
          {currentStep === 'provider' && (
            <VideoProviderSelector selectedProvider={provider} onSelectProvider={setProvider} />
          )}

          {/* Step 2: Date & Time */}
          {currentStep === 'datetime' && (
            <TimeSlotPicker
              minDate={minDate}
              maxDate={maxDate}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onSelectDate={setSelectedDate}
              onSelectTime={setSelectedTime}
            />
          )}

          {/* Step 3: Duration */}
          {currentStep === 'duration' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#E8F5E1] rounded-lg border border-[#1C4D3A]/20">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[#1C4D3A]" />
                  <div>
                    <p className="font-semibold text-[#2D3330]">30 Minutes</p>
                    <p className="text-sm text-[#6B6760]">
                      Interview duration is fixed at 30 minutes as per platform policy
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#F7F6F1] rounded-lg border border-[#E8E6DD]">
                <p className="text-xs text-[#6B6760]">
                  <strong>Note:</strong> This ensures fair and consistent interview experiences for
                  all candidates.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Timezone */}
          {currentStep === 'timezone' && (
            <div className="space-y-4">
              <div className="p-4 border border-[#E8E6DD] rounded-lg">
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-[#1C4D3A] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-[#2D3330] mb-1">Detected Timezone</p>
                    <p className="text-sm text-[#6B6760] mb-3">{timezone}</p>
                    <p className="text-xs text-[#6B6760]">
                      All participants will receive calendar invites adjusted to their local
                      timezone.
                    </p>
                  </div>
                </div>
              </div>

              {selectedDate && selectedTime && (
                <div className="p-3 bg-[#E8F5E1] rounded-lg">
                  <p className="text-sm text-[#2D3330]">
                    <strong>Your interview time:</strong>
                  </p>
                  <p className="text-lg font-semibold text-[#1C4D3A] mt-1">
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}{' '}
                    at {selectedTime} {timezone}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 'review' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {/* Candidate */}
                <div className="p-3 border border-[#E8E6DD] rounded-lg">
                  <p className="text-xs text-[#6B6760] mb-1">Candidate</p>
                  <p className="font-medium text-[#2D3330]">{candidateName}</p>
                </div>

                {/* Platform */}
                <div className="p-3 border border-[#E8E6DD] rounded-lg">
                  <p className="text-xs text-[#6B6760] mb-1">Platform</p>
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#1C4D3A]" />
                    <p className="font-medium text-[#2D3330] capitalize">
                      {provider === 'google_meet' ? 'Google Meet' : 'Zoom'}
                    </p>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="p-3 border border-[#E8E6DD] rounded-lg">
                  <p className="text-xs text-[#6B6760] mb-1">Date & Time</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#1C4D3A]" />
                    <p className="font-medium text-[#2D3330]">
                      {selectedDate?.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      at {selectedTime}
                    </p>
                  </div>
                </div>

                {/* Duration */}
                <div className="p-3 border border-[#E8E6DD] rounded-lg">
                  <p className="text-xs text-[#6B6760] mb-1">Duration</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#1C4D3A]" />
                    <p className="font-medium text-[#2D3330]">30 minutes</p>
                  </div>
                </div>

                {/* Timezone */}
                <div className="p-3 border border-[#E8E6DD] rounded-lg">
                  <p className="text-xs text-[#6B6760] mb-1">Timezone</p>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#1C4D3A]" />
                    <p className="font-medium text-[#2D3330]">{timezone}</p>
                  </div>
                </div>
              </div>

              {/* Important Notice */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Before you confirm:</p>
                    <ul className="text-xs space-y-1 ml-4 list-disc">
                      <li>Calendar invites will be sent to all participants</li>
                      <li>Meeting link will be generated automatically</li>
                      <li>You can reschedule once within the 7-day window</li>
                      <li>Candidate will be notified immediately</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          onClick={currentStepIndex === 0 ? onCancel : handleBack}
          disabled={isSubmitting}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {currentStepIndex === 0 ? 'Cancel' : 'Back'}
        </Button>

        <Button
          onClick={handleNext}
          disabled={!canProceed() || isSubmitting}
          className="bg-[#1C4D3A] text-white"
        >
          {isSubmitting ? (
            'Scheduling...'
          ) : currentStep === 'review' ? (
            'Confirm & Schedule'
          ) : (
            <>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
