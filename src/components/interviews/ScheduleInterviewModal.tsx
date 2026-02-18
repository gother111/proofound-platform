/**
 * Schedule Interview Modal
 *
 * Modal for scheduling 30-minute video interviews.
 * Enforces PRD constraints:
 * - 30-minute duration (fixed)
 * - Must be within 7 days of match acceptance
 * - Only 1 reschedule allowed
 *
 * Integrates with Zoom and Google Meet.
 */

'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  matchAgreedAt: Date;
  existingInterviewsCount?: number;
  onScheduled?: (interview: { id: string; scheduledAt: string; meetingUrl: string }) => void;
}

export function ScheduleInterviewModal({
  isOpen,
  onClose,
  matchId,
  matchAgreedAt,
  existingInterviewsCount = 0,
  onScheduled,
}: ScheduleInterviewModalProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [platform, setPlatform] = useState<'zoom' | 'google_meet' | 'manual'>('manual');
  const [manualMeetingLink, setManualMeetingLink] = useState('');
  const [providerConnections, setProviderConnections] = useState({ zoom: false, google: false });
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReschedule = existingInterviewsCount > 0;
  const canReschedule = existingInterviewsCount < 1; // Only 1 reschedule allowed

  useEffect(() => {
    let active = true;

    async function loadProviderStatus() {
      try {
        const response = await fetch('/api/integrations/video/status');
        if (!response.ok) return;

        const data = await response.json();
        if (!active) return;

        const zoomConnected = data.zoom?.connected === true;
        const googleConnected = data.google?.connected === true;

        setProviderConnections({ zoom: zoomConnected, google: googleConnected });

        // Keep manual as low-friction default when no provider is connected.
        if (!zoomConnected && !googleConnected) {
          setPlatform('manual');
          return;
        }

        setPlatform((current) => {
          if (current !== 'manual') return current;
          return zoomConnected ? 'zoom' : 'google_meet';
        });
      } catch (statusError) {
        console.error('Failed to load provider status:', statusError);
      }
    }

    loadProviderStatus();
    return () => {
      active = false;
    };
  }, []);

  // Calculate date constraints (7 days from match agreement)
  const minDate = new Date();
  const maxDate = new Date(matchAgreedAt);
  maxDate.setDate(maxDate.getDate() + 7);

  // Generate available dates (next 7 days from match agreement, but not in the past)
  const today = new Date();
  const startDate = today > matchAgreedAt ? today : matchAgreedAt;
  const availableDates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    if (date <= maxDate) {
      availableDates.push(date);
    }
  }

  // Generate time slots (9am - 5pm in 30-minute increments)
  const timeSlots: string[] = [];
  for (let hour = 9; hour <= 16; hour++) {
    for (let minute of [0, 30]) {
      if (hour === 16 && minute === 30) break; // Stop at 5:00 PM
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(timeStr);
    }
  }

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

      try {
        new URL(manualMeetingLink.trim());
      } catch {
        setError('Please provide a valid meeting link URL');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Combine date and time
      const startTime = new Date(`${selectedDate}T${selectedTime}:00`);

      const response = await fetch('/api/interviews/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          scheduledAt: startTime.toISOString(),
          platform,
          timezone,
          ...(platform === 'manual' ? { manualMeetingLink: manualMeetingLink.trim() } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details?.join(', ') || 'Failed to schedule interview');
      }

      // Success!
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isReschedule ? 'Reschedule Interview' : 'Schedule Interview'}</DialogTitle>
          <DialogDescription>
            {isReschedule
              ? `You can reschedule this interview ${canReschedule ? 'once' : '(limit reached)'}.`
              : 'Schedule a 30-minute video interview. Must be within 7 days of match acceptance.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Picker */}
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

          {/* Time Picker */}
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

          {/* Duration (Fixed at 30 min) */}
          <div className="space-y-2">
            <Label>Duration</Label>
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-foreground">
              30 minutes (fixed)
            </div>
          </div>

          {/* Platform Selector */}
          <div className="space-y-2">
            <Label htmlFor="platform">
              <Video className="w-4 h-4 inline mr-2" />
              Video Platform
            </Label>
            <Select
              value={platform}
              onValueChange={(val) => setPlatform(val as 'zoom' | 'google_meet' | 'manual')}
            >
              <SelectTrigger id="platform">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual link (no integration required)</SelectItem>
                <SelectItem value="zoom" disabled={!providerConnections.zoom}>
                  Zoom {providerConnections.zoom ? '(connected)' : '(connect in Settings first)'}
                </SelectItem>
                <SelectItem value="google_meet" disabled={!providerConnections.google}>
                  Google Meet{' '}
                  {providerConnections.google ? '(connected)' : '(connect in Settings first)'}
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-[#6B6760]">
              {platform === 'manual'
                ? 'Manual mode works with any valid meeting link (Zoom, Google Meet, Teams, and others).'
                : 'Connected mode creates the meeting from your linked provider account automatically.'}
            </p>
          </div>

          {platform === 'manual' && (
            <div className="space-y-2">
              <Label htmlFor="manualMeetingLink">Meeting Link</Label>
              <input
                id="manualMeetingLink"
                type="url"
                value={manualMeetingLink}
                onChange={(event) => setManualMeetingLink(event.target.value)}
                placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                className="flex h-11 w-full rounded-lg border border-proofound-stone dark:border-border bg-white dark:bg-background px-4 py-2 text-base text-proofound-charcoal dark:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Reschedule Warning */}
          {isReschedule && !canReschedule && (
            <div className="rounded-md border border-warning/40 bg-warning/15 p-3 text-sm text-proofound-charcoal">
              ⚠️ You have already rescheduled this interview once. No further reschedules allowed.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (isReschedule && !canReschedule)}
          >
            {isSubmitting ? 'Scheduling...' : isReschedule ? 'Reschedule' : 'Schedule Interview'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
