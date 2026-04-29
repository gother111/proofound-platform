/**
 * Interview Card Component
 * Displays scheduled interview with action buttons
 *
 * Features:
 * - Platform badge
 * - One-click join button
 * - Reschedule option (once per PRD)
 * - Cancel option
 * - Add to calendar
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Video, Calendar as CalendarIcon, Clock, Users, ExternalLink, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { apiFetch } from '@/lib/api/fetch';

interface InterviewCardProps {
  interview: {
    id: string;
    scheduledAt: Date | string;
    durationMinutes: number;
    platform: 'zoom' | 'google_meet' | 'manual';
    manualMeetingProvider?: 'teams' | 'zoom' | 'google_meet' | 'other' | null;
    meetingLink: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
    rescheduled: boolean;
    host: {
      id: string;
      display_name: string;
      avatar_url?: string;
    };
    participants: Array<{
      id: string;
      display_name: string;
      avatar_url?: string;
    }>;
    isHost: boolean;
  };
  onCancel?: () => void;
  onReschedule?: () => void;
}

export function InterviewCard({ interview, onCancel, onReschedule }: InterviewCardProps) {
  const [isCancelling, setIsCancelling] = useState(false);

  const scheduledDate = new Date(interview.scheduledAt);
  const now = new Date();
  const isPast = scheduledDate < now;
  const isUpcoming = !isPast && interview.status === 'scheduled';

  const handleJoin = () => {
    window.open(interview.meetingLink, '_blank');
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this interview?')) return;

    setIsCancelling(true);
    try {
      const response = await apiFetch('/api/interviews/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId: interview.id }),
      });

      if (!response.ok) throw new Error('Failed to cancel interview');

      toast.success('Interview cancelled');
      onCancel?.();
    } catch (error) {
      toast.error('Failed to cancel interview');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleAddToCalendar = () => {
    const meetingProviderLabel =
      interview.platform === 'manual'
        ? interview.manualMeetingProvider === 'teams'
          ? 'Microsoft Teams'
          : interview.manualMeetingProvider === 'zoom'
            ? 'Zoom'
            : interview.manualMeetingProvider === 'google_meet'
              ? 'Google Meet'
              : interview.manualMeetingProvider === 'other'
                ? 'Other'
                : 'Manual'
        : interview.platform === 'zoom'
          ? 'Zoom'
          : 'Google Meet';

    // Generate ICS file for calendar
    const endDate = new Date(scheduledDate);
    endDate.setMinutes(endDate.getMinutes() + interview.durationMinutes);

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${scheduledDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:Interview on Proofound
DESCRIPTION:Join: ${interview.meetingLink}
LOCATION:${meetingProviderLabel}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'interview.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = () => {
    switch (interview.status) {
      case 'scheduled':
        return <Badge variant="default">Scheduled</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'no_show':
        return <Badge variant="outline">No Show</Badge>;
    }
  };

  const getPlatformIcon = () => {
    if (interview.platform === 'google_meet') {
      return 'Google Meet';
    }

    if (interview.platform === 'manual') {
      if (interview.manualMeetingProvider === 'teams') return 'Manual (Teams)';
      if (interview.manualMeetingProvider === 'zoom') return 'Manual (Zoom)';
      if (interview.manualMeetingProvider === 'google_meet') return 'Manual (Google Meet)';
      if (interview.manualMeetingProvider === 'other') return 'Manual (Other)';
      return 'Manual';
    }

    return 'Zoom';
  };

  return (
    <Card variant="bento">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              Interview {interview.isHost ? 'with' : 'hosted by'}{' '}
              {interview.isHost
                ? interview.participants[0]?.display_name
                : interview.host.display_name}
            </CardTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <Badge variant="outline" className="flex items-center gap-1">
                <Video className="w-3 h-3" />
                {getPlatformIcon()}
              </Badge>
              {interview.rescheduled && <Badge variant="outline">Rescheduled</Badge>}
            </div>
          </div>

          {/* Avatar */}
          <Avatar>
            <AvatarImage
              src={
                interview.isHost ? interview.participants[0]?.avatar_url : interview.host.avatar_url
              }
            />
            <AvatarFallback>
              {interview.isHost
                ? interview.participants[0]?.display_name[0]
                : interview.host.display_name[0]}
            </AvatarFallback>
          </Avatar>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date & Time */}
        <div className="flex items-center gap-2 text-sm">
          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
          <span>
            {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString()}
          </span>
          {isUpcoming && (
            <span className="text-muted-foreground">
              ({formatDistanceToNow(scheduledDate, { addSuffix: true })})
            </span>
          )}
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>{interview.durationMinutes} minutes</span>
        </div>

        {/* Participants */}
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span>{interview.participants.length} participants</span>
        </div>

        {/* Actions */}
        {isUpcoming && (
          <div className="flex gap-2 pt-2">
            <Button onClick={handleJoin} className="flex-1">
              <ExternalLink className="w-4 h-4 mr-2" />
              Join Interview
            </Button>
            <Button variant="outline" size="sm" onClick={handleAddToCalendar}>
              <CalendarIcon className="w-4 h-4" />
            </Button>
            {!interview.rescheduled && onReschedule && (
              <Button variant="outline" size="sm" onClick={onReschedule}>
                Reschedule
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={isCancelling}>
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
        )}

        {interview.status === 'cancelled' && (
          <div className="text-sm text-muted-foreground italic">This interview was cancelled</div>
        )}
      </CardContent>
    </Card>
  );
}
