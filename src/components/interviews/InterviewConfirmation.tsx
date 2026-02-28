/**
 * Interview Confirmation Component
 *
 * Displays confirmation after successfully scheduling an interview
 * Shows meeting link, calendar invite, and next steps
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Calendar,
  Clock,
  Video,
  Mail,
  Copy,
  ExternalLink,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

interface InterviewConfirmationProps {
  interview: {
    id: string;
    scheduled_at: string;
    duration_minutes: number;
    platform: 'zoom' | 'google_meet';
    meeting_link: string;
    meeting_id: string;
  };
  candidateName: string;
  onClose?: () => void;
}

export function InterviewConfirmation({
  interview,
  candidateName,
  onClose,
}: InterviewConfirmationProps) {
  const scheduledDate = new Date(interview.scheduled_at);

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(interview.meeting_link);
    toast.success('Meeting link copied to clipboard');
  };

  const downloadCalendarInvite = () => {
    // Generate ICS file
    const ics = generateICS(interview, candidateName);
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-${interview.id}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Calendar invite downloaded');
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-[#2D3330] mb-2">Interview Scheduled!</h2>
        <p className="text-[#6B6760]">
          Your interview with {candidateName} has been successfully scheduled.
        </p>
      </div>

      <Card variant="bento">
        <CardHeader>
          <CardTitle className="text-lg">Interview Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date & Time */}
          <div className="flex items-start gap-3 p-3 bg-[#F7F6F1] rounded-lg">
            <Calendar className="w-5 h-5 text-[#1C4D3A] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#2D3330]">Date & Time</p>
              <p className="text-sm text-[#6B6760]">
                {scheduledDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-sm text-[#6B6760]">
                {scheduledDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZoneName: 'short',
                })}
              </p>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-start gap-3 p-3 bg-[#F7F6F1] rounded-lg">
            <Clock className="w-5 h-5 text-[#1C4D3A] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#2D3330]">Duration</p>
              <p className="text-sm text-[#6B6760]">{interview.duration_minutes} minutes</p>
            </div>
          </div>

          {/* Platform */}
          <div className="flex items-start gap-3 p-3 bg-[#F7F6F1] rounded-lg">
            <Video className="w-5 h-5 text-[#1C4D3A] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#2D3330]">Platform</p>
              <p className="text-sm text-[#6B6760] capitalize">
                {interview.platform === 'google_meet' ? 'Google Meet' : 'Zoom'}
              </p>
            </div>
          </div>

          {/* Meeting Link */}
          <div className="p-4 border-2 border-[#1C4D3A] rounded-lg bg-[#E8F5E1]">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-sm font-semibold text-[#1C4D3A] mb-1">Meeting Link</p>
                <p className="text-xs text-[#6B6760] break-all">{interview.meeting_link}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copyMeetingLink} className="flex-1">
                <Copy className="w-3 h-3 mr-1.5" />
                Copy Link
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(interview.meeting_link, '_blank')}
                className="flex-1"
              >
                <ExternalLink className="w-3 h-3 mr-1.5" />
                Open
              </Button>
            </div>
          </div>

          {/* Meeting ID */}
          <div className="text-sm text-[#6B6760]">
            <p>
              Meeting ID: <span className="font-mono">{interview.meeting_id}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card variant="bento" className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1C4D3A] text-white flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-[#2D3330]">
                  Calendar invites have been sent
                </p>
                <p className="text-xs text-[#6B6760]">
                  Check your email for the calendar invite with meeting details
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1C4D3A] text-white flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <p className="text-sm font-medium text-[#2D3330]">Prepare for the interview</p>
                <p className="text-xs text-[#6B6760]">
                  Review the candidate's profile and prepare your questions
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1C4D3A] text-white flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <p className="text-sm font-medium text-[#2D3330]">Join at the scheduled time</p>
                <p className="text-xs text-[#6B6760]">
                  Use the meeting link above or click the link in your calendar
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Reminder:</strong> You can reschedule this interview once if needed. After the
              interview, you'll have 48 hours to make a decision.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 mt-6">
        <Button variant="outline" onClick={downloadCalendarInvite}>
          <Download className="w-4 h-4 mr-2" />
          Download .ics
        </Button>
        {onClose && (
          <Button onClick={onClose} className="bg-[#1C4D3A] text-white">
            Done
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Generate ICS calendar file
 */
function generateICS(
  interview: InterviewConfirmationProps['interview'],
  candidateName: string
): string {
  const start = new Date(interview.scheduled_at);
  const end = new Date(start.getTime() + interview.duration_minutes * 60000);

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Proofound//Interview//EN',
    'BEGIN:VEVENT',
    `UID:${interview.id}@proofound.com`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(start)}`,
    `DTEND:${formatDate(end)}`,
    `SUMMARY:Interview with ${candidateName}`,
    `DESCRIPTION:30-minute interview via ${interview.platform === 'google_meet' ? 'Google Meet' : 'Zoom'}\\n\\nMeeting Link: ${interview.meeting_link}\\n\\nMeeting ID: ${interview.meeting_id}`,
    `LOCATION:${interview.meeting_link}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'DESCRIPTION:Interview reminder',
    'ACTION:DISPLAY',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
