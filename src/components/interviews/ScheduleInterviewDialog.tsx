/**
 * Schedule Interview Dialog
 * Implements PRD Gap 1: UI for scheduling interviews with Zoom/Google Meet
 *
 * Features:
 * - Platform selection (Zoom/Google Meet)
 * - Date/time picker with timezone
 * - 30-minute fixed duration (PRD requirement)
 * - 7-day window validation (PRD requirement)
 * - Auto-generates meeting link
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Video, Clock, Users } from 'lucide-react';

interface ScheduleInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  participantIds: string[];
  participantNames: string[];
}

import { scheduleInterview } from '@/app/actions/interviews';

export function ScheduleInterviewDialog({
  open,
  onOpenChange,
  applicationId,
  participantIds,
  participantNames,
}: ScheduleInterviewDialogProps) {
  const router = useRouter();
  const [platform, setPlatform] = useState<'zoom' | 'google_meet' | 'manual'>('manual');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [timeHour, setTimeHour] = useState('14');
  const [timeMinute, setTimeMinute] = useState('00');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [notes, setNotes] = useState('');
  const [manualMeetingLink, setManualMeetingLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSchedule = async () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    // Combine date and time
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(parseInt(timeHour), parseInt(timeMinute), 0, 0);

    // Validate within 7 days (PRD requirement)
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (scheduledDateTime > sevenDaysFromNow) {
      toast.error('Interview must be scheduled within 7 days');
      return;
    }

    if (scheduledDateTime < now) {
      toast.error('Interview cannot be scheduled in the past');
      return;
    }

    setIsSubmitting(true);

    // Validate manual link if platform is manual
    if (platform === 'manual' && !manualMeetingLink) {
      toast.error('Please provide a meeting link');
      return;
    }

    try {
      await scheduleInterview({
        matchId: applicationId,
        scheduledAt: scheduledDateTime.toISOString(),
        platform,
        timezone,
        ...(platform === 'manual' && { manualMeetingLink }),
      });

      toast.success('Interview scheduled successfully!');
      onOpenChange(false);
      router.refresh();
    } catch (error: any) {
      console.error('Failed to schedule interview:', error);
      toast.error(error.message || 'Failed to schedule interview');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate max date (7 days from now per PRD)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 7);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Interview</DialogTitle>
          <DialogDescription>
            Schedule a 30-minute interview with the candidate. Meeting link will be generated
            automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Platform Selection */}
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select value={platform} onValueChange={(v: any) => setPlatform(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Manual (provide your own link)
                  </div>
                </SelectItem>
                <SelectItem value="zoom">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Zoom (auto-generate)
                  </div>
                </SelectItem>
                <SelectItem value="google_meet">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Google Meet (auto-generate)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {platform === 'manual' && 'Provide your own Zoom, Google Meet, or Teams link'}
              {platform === 'zoom' && 'Requires Zoom account connection'}
              {platform === 'google_meet' && 'Requires Google Calendar connection'}
            </p>
          </div>

          {/* Manual Meeting Link Input */}
          {platform === 'manual' && (
            <div className="space-y-2">
              <Label htmlFor="meetingLink">Meeting Link</Label>
              <Input
                id="meetingLink"
                type="url"
                value={manualMeetingLink}
                onChange={(e) => setManualMeetingLink(e.target.value)}
                placeholder="https://zoom.us/j/... or https://meet.google.com/..."
              />
              <p className="text-sm text-muted-foreground">
                Paste your Zoom, Google Meet, Microsoft Teams, or other video call link
              </p>
            </div>
          )}

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Date (within 7 days)</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date() || date > maxDate}
              className="rounded-md border"
            />
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label>Time</Label>
            <div className="flex gap-2 items-center">
              <Select value={timeHour} onValueChange={setTimeHour}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                      {i.toString().padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>:</span>
              <Select value={timeMinute} onValueChange={setTimeMinute}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['00', '15', '30', '45'].map((min) => (
                    <SelectItem key={min} value={min}>
                      {min}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground ml-2">{timezone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Duration: 30 minutes (fixed)</span>
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <Label>Participants</Label>
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4" />
              <span>{participantNames.join(', ')}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes or context for the interview..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={isSubmitting || !selectedDate}>
            {isSubmitting ? 'Scheduling...' : 'Schedule Interview'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
