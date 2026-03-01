/**
 * Interviews Page - Individual
 *
 * View and manage scheduled interviews.
 * Shows upcoming interviews with video links and reschedule options.
 */

'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Video, ExternalLink, CalendarPlus, Download } from 'lucide-react';
import { ScheduleInterviewButton } from '@/components/interviews/ScheduleInterviewButton';
import { SkeletonCard } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { getInterviews as getInterviewsAction } from '@/app/actions/interviews';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import {
  buildGoogleCalendarUrl,
  downloadInterviewIcs,
  type InterviewCalendarPayload,
} from '@/lib/interviews/calendar';

export const dynamic = 'force-dynamic';

interface Interview {
  id: string;
  matchId: string;
  scheduledAt: string;
  duration: number;
  platform: string;
  meetingUrl: string;
  status: string;
  matchAgreedAt?: string;
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    setIsLoading(true);

    try {
      const data = await getInterviewsAction();
      setInterviews(data.interviews || []);
    } catch (error) {
      console.error('Failed to load interviews:', error);
      setInterviews([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const toCalendarPayload = (interview: Interview): InterviewCalendarPayload => ({
    interviewId: interview.id,
    scheduledAt: interview.scheduledAt,
    durationMinutes: interview.duration,
    meetingUrl: interview.meetingUrl,
    platform: interview.platform,
    title: 'Proofound interview',
  });

  if (isLoading) {
    return (
      <AppSurface>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="h-8 w-48 bg-[#E8E6DD] dark:bg-[#2C3244] rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-[#E8E6DD] dark:bg-[#2C3244] rounded animate-pulse" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </AppSurface>
    );
  }

  return (
    <AppSurface>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-2" style={{ color: '#2D3330' }}>
            Interviews
          </h1>
          <p className="text-sm" style={{ color: '#6B6760' }}>
            Manage your scheduled video interviews
          </p>
        </div>

        {/* Interviews List */}
        {interviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl border border-dashed border-gray-300 text-center">
            <div className="w-16 h-16 bg-[#F7F6F1] rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8" style={{ color: '#1C4D3A' }} />
            </div>
            <h2 className="text-xl font-medium mb-2" style={{ color: '#2D3330' }}>
              No Interviews Scheduled
            </h2>
            <p className="text-sm text-[#6B6760] max-w-md mb-6">
              Once you match with an organization and they shortlist you, you can schedule an
              interview. Interviews are 30 minutes and must be scheduled within 7 days of
              acceptance.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {interviews.map((interview) => (
              <div
                key={interview.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Date & Time */}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" style={{ color: '#1C4D3A' }} />
                        <span className="font-medium" style={{ color: '#2D3330' }}>
                          {formatDate(interview.scheduledAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" style={{ color: '#6B6760' }} />
                        <span className="text-sm" style={{ color: '#6B6760' }}>
                          {formatTime(interview.scheduledAt)} ({interview.duration} min)
                        </span>
                      </div>
                    </div>

                    {/* Platform & Meeting Link */}
                    <div className="flex items-center gap-4 mb-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4" style={{ color: '#6B6760' }} />
                        <span className="text-sm capitalize" style={{ color: '#6B6760' }}>
                          {interview.platform}
                        </span>
                      </div>
                      {interview.meetingUrl !== 'pending' && (
                        <>
                          <a
                            href={interview.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm flex items-center gap-1 hover:underline"
                            style={{ color: '#1C4D3A' }}
                          >
                            Join Meeting
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <a
                            href={buildGoogleCalendarUrl(toCalendarPayload(interview))}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm flex items-center gap-1 hover:underline"
                            style={{ color: '#1C4D3A' }}
                          >
                            Add to Google Calendar
                            <CalendarPlus className="w-3 h-3" />
                          </a>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => downloadInterviewIcs(toCalendarPayload(interview))}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            .ics
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="inline-block">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor:
                            interview.status === 'scheduled'
                              ? '#E8F5E9'
                              : interview.status === 'completed'
                                ? '#E3F2FD'
                                : '#FFF3E0',
                          color:
                            interview.status === 'scheduled'
                              ? '#2E7D32'
                              : interview.status === 'completed'
                                ? '#1565C0'
                                : '#E65100',
                        }}
                      >
                        {interview.status}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {interview.status === 'scheduled' &&
                      interview.matchAgreedAt &&
                      new Date(interview.scheduledAt) > new Date() && (
                        <ScheduleInterviewButton
                          matchId={interview.matchId}
                          matchAgreedAt={new Date(interview.matchAgreedAt)}
                          existingInterviewsCount={1}
                          variant="outline"
                          size="sm"
                          onScheduled={loadInterviews}
                        />
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppSurface>
  );
}
