/**
 * Schedule Interview Modal
 *
 * Modal for scheduling 30-minute video interviews.
 * Enforces PRD constraints:
 * - 30-minute duration (fixed)
 * - Must be within 7 days of match acceptance
 * - Only 1 reschedule allowed
 *
 * Integrates with Google Meet and manual meeting links.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { useResponsiveModalMode } from '@/hooks/use-responsive-modal-mode';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { scheduleInterview } from '@/app/actions/interviews';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  matchAgreedAt: Date;
  existingInterviewsCount?: number;
  onScheduled?: (interview: { id: string; scheduledAt: string; meetingUrl: string }) => void;
}

type ManualMeetingProvider = 'teams' | 'google_meet' | 'other';

export function ScheduleInterviewModal({
  isOpen,
  onClose,
  matchId,
  matchAgreedAt,
  existingInterviewsCount = 0,
  onScheduled,
}: ScheduleInterviewModalProps) {
  const isDesktop = useResponsiveModalMode(isOpen);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [platform, setPlatform] = useState<'manual'>('manual');
  const [manualMeetingLink, setManualMeetingLink] = useState('');
  const [manualMeetingProvider, setManualMeetingProvider] = useState<ManualMeetingProvider | ''>(
    ''
  );
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReschedule = existingInterviewsCount > 0;
  const canReschedule = existingInterviewsCount < 1;
  const errorMessageId = 'interview-schedule-error';
  const providerHelpId = 'manual-meeting-provider-help';
  const linkHelpId = 'manual-meeting-link-help';
  const rescheduleLimitId = 'interview-reschedule-limit';
  const providerHasError = error === 'Please select the meeting provider when using manual mode';
  const linkHasError =
    error === 'Please add a meeting link when using manual mode' ||
    error === 'Please provide a valid meeting link URL';

  const maxDate = useMemo(() => {
    const max = new Date(matchAgreedAt);
    max.setDate(max.getDate() + 7);
    return max;
  }, [matchAgreedAt]);

  const availableDates = useMemo(() => {
    const today = new Date();
    const startDate = today > matchAgreedAt ? today : matchAgreedAt;
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      if (date <= maxDate) {
        dates.push(date);
      }
    }
    return dates;
  }, [matchAgreedAt, maxDate]);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = 9; hour <= 16; hour++) {
      for (const minute of [0, 30]) {
        if (hour === 16 && minute === 30) break;
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeStr);
      }
    }
    return slots;
  }, []);

  useEffect(() => {
    if (!selectedDate && availableDates.length > 0) {
      setSelectedDate(availableDates[0].toISOString().split('T')[0]);
    }
    if (!selectedTime && timeSlots.length > 0) {
      setSelectedTime(timeSlots[0]);
    }
  }, [availableDates, selectedDate, selectedTime, timeSlots]);

  const handleSubmit = async () => {
    setError(null);

    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time');
      return;
    }

    if (isReschedule && !canReschedule) {
      setError('Reschedule limit exceeded (maximum 1 reschedule allowed)');
      return;
    }

    if (platform === 'manual') {
      if (!manualMeetingLink.trim()) {
        setError('Please add a meeting link when using manual mode');
        return;
      }

      if (!manualMeetingProvider) {
        setError('Please select the meeting provider when using manual mode');
        return;
      }

      try {
        new URL(manualMeetingLink.trim());
      } catch {
        setError('Please provide a valid meeting link URL');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const startTime = new Date(`${selectedDate}T${selectedTime}:00`);
      const manualPayload =
        platform === 'manual'
          ? {
              manualMeetingLink: manualMeetingLink.trim(),
              manualMeetingProvider: manualMeetingProvider as ManualMeetingProvider,
            }
          : {};

      const data = await scheduleInterview({
        matchId,
        scheduledAt: startTime.toISOString(),
        platform,
        timezone,
        ...manualPayload,
      });

      if (onScheduled) {
        const meetingUrl =
          data?.interview?.meetingUrl ??
          data?.interview?.meeting_link ??
          data?.interview?.meeting_url ??
          (platform === 'manual' ? manualMeetingLink.trim() : '');
        onScheduled({
          id: data.interview.id,
          scheduledAt: data.interview.scheduledAt ?? data.interview.scheduled_at,
          meetingUrl,
        });
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormBody = () => (
    <div className="space-y-4 py-4 px-4 md:px-0">
      <div className="space-y-2">
        <Label htmlFor="interview-date">
          <Calendar className="w-4 h-4 inline mr-2" />
          Date
        </Label>
        <Select value={selectedDate} onValueChange={setSelectedDate}>
          <SelectTrigger id="interview-date">
            <SelectValue placeholder="Select a date" />
          </SelectTrigger>
          <SelectContent>
            {availableDates.map((date) => (
              <SelectItem key={date.toISOString()} value={date.toISOString().split('T')[0]}>
                {date.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="interview-time">
          <Clock className="w-4 h-4 inline mr-2" />
          Time ({timezone})
        </Label>
        <Select value={selectedTime} onValueChange={setSelectedTime}>
          <SelectTrigger id="interview-time">
            <SelectValue placeholder="Select a time" />
          </SelectTrigger>
          <SelectContent>
            {timeSlots.map((time) => (
              <SelectItem key={time} value={time}>
                {time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Duration</Label>
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-foreground">
          30 minutes (fixed)
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="platform">
          <Video className="w-4 h-4 inline mr-2" />
          Video Platform
        </Label>
        <Select value={platform} onValueChange={() => setPlatform('manual')}>
          <SelectTrigger id="platform">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual link (launch default)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-[#6B6760]">
          Manual mode works with any valid meeting link. Select which provider the link belongs to,
          then paste the URL you want participants to use.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="manualMeetingProvider">Manual Link Provider</Label>
        <Select
          value={manualMeetingProvider || undefined}
          onValueChange={(value) => setManualMeetingProvider(value as ManualMeetingProvider)}
        >
          <SelectTrigger
            id="manualMeetingProvider"
            aria-invalid={providerHasError || undefined}
            aria-describedby={
              providerHasError ? `${providerHelpId} ${errorMessageId}` : providerHelpId
            }
          >
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="teams">Microsoft Teams</SelectItem>
            <SelectItem value="google_meet">Google Meet</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <p id={providerHelpId} className="text-xs text-[#6B6760]">
          This labels the meeting link for both participants; it does not connect an external
          calendar provider.
        </p>
        <Label htmlFor="manualMeetingLink">Meeting Link</Label>
        <input
          id="manualMeetingLink"
          type="url"
          value={manualMeetingLink}
          onChange={(event) => setManualMeetingLink(event.target.value)}
          placeholder="https://meet.google.com/... or another secure meeting URL"
          aria-invalid={linkHasError || undefined}
          aria-describedby={linkHasError ? `${linkHelpId} ${errorMessageId}` : linkHelpId}
          className="flex h-11 w-full rounded-lg border border-proofound-stone dark:border-border bg-white dark:bg-background px-4 py-2 text-base text-proofound-charcoal dark:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest"
        />
        <p id={linkHelpId} className="text-xs text-[#6B6760]">
          Use the meeting URL participants should open for this interview.
        </p>
      </div>

      {error && (
        <div
          id={errorMessageId}
          role="alert"
          aria-live="assertive"
          className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {isReschedule && !canReschedule && (
        <div
          id={rescheduleLimitId}
          role="status"
          aria-live="polite"
          className="rounded-md border border-warning/40 bg-warning/15 p-3 text-sm text-proofound-charcoal"
        >
          <p className="font-medium">Reschedule limit reached</p>
          <p className="mt-1">
            You have already rescheduled this interview once. No further reschedules are allowed.
          </p>
        </div>
      )}
    </div>
  );

  const renderFormActions = () => (
    <div className="flex items-center justify-end gap-2 px-4 pb-4 pt-2 md:px-0 md:pb-0 md:pt-0">
      <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button onClick={handleSubmit} disabled={isSubmitting || (isReschedule && !canReschedule)}>
        {isSubmitting ? 'Scheduling...' : isReschedule ? 'Reschedule' : 'Schedule Interview'}
      </Button>
    </div>
  );

  const title = isReschedule ? 'Reschedule Interview' : 'Schedule Interview';
  const description = isReschedule
    ? `You can reschedule this interview ${canReschedule ? 'once' : '(limit reached)'}.`
    : 'Schedule a 30-minute video interview. Must be within 7 days of match acceptance.';

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {renderFormBody()}
          {renderFormActions()}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="max-h-[60vh] overflow-y-auto">{renderFormBody()}</div>
        {renderFormActions()}
      </DrawerContent>
    </Drawer>
  );
}
