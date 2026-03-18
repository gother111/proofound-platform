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
import { Button } from '@/components/ui/button';
import { getInterviews as getInterviewsAction } from '@/app/actions/interviews';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { CardListSkeleton, PageIntroSkeleton } from '@/components/skeletons/CoreLoadingPrimitives';
import {
  buildGoogleCalendarUrl,
  downloadInterviewIcs,
  type InterviewCalendarPayload,
} from '@/lib/interviews/calendar';
import { toast } from 'sonner';

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
  decisionState?: string | null;
  engagementVerification?: {
    id: string;
    status: string;
    statusLabel: string;
    engagementType: string | null;
    candidateConfirmedAt: string | null;
    organizationConfirmedAt: string | null;
    uploadedEvidencePresent: boolean;
    proofHookStatus: string;
    verifiedAt: string | null;
  } | null;
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmingEngagementId, setIsConfirmingEngagementId] = useState<string | null>(null);
  const [engagementTypeSelections, setEngagementTypeSelections] = useState<Record<string, string>>(
    {}
  );

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

  const resolveEngagementTypeValue = (interview: Interview) => {
    const verification = interview.engagementVerification;
    if (!verification) {
      return '';
    }

    return engagementTypeSelections[verification.id] ?? verification.engagementType ?? '';
  };

  const handleConfirmEngagement = async (interview: Interview) => {
    const verification = interview.engagementVerification;
    if (!verification) {
      return;
    }

    const engagementType = resolveEngagementTypeValue(interview);
    if (!engagementType) {
      toast.error('Select an engagement type before confirming');
      return;
    }

    setIsConfirmingEngagementId(verification.id);
    try {
      const response = await fetch(`/api/engagement-verifications/${verification.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirm: true,
          engagementType,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to confirm engagement');
      }

      toast.success('Engagement confirmation recorded');
      await loadInterviews();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to confirm engagement');
    } finally {
      setIsConfirmingEngagementId(null);
    }
  };

  const getDecisionBadge = (decisionState: string | null | undefined) => {
    if (!decisionState) {
      return null;
    }

    return (
      <span
        className="px-2 py-1 rounded-full text-xs font-medium"
        style={{
          backgroundColor: decisionState === 'hire' ? '#E8F5E9' : '#F1F5F9',
          color: decisionState === 'hire' ? '#2E7D32' : '#334155',
        }}
      >
        Decision: {decisionState.replace(/_/g, ' ')}
      </span>
    );
  };

  const getEngagementBadge = (interview: Interview) => {
    if (!interview.engagementVerification) {
      return null;
    }

    const verification = interview.engagementVerification;
    const isVerified = verification.status === 'verified';

    return (
      <span
        className="px-2 py-1 rounded-full text-xs font-medium"
        style={{
          backgroundColor: isVerified ? '#E8F5E9' : '#FEF3C7',
          color: isVerified ? '#2E7D32' : '#92400E',
        }}
      >
        Engagement: {verification.statusLabel}
      </span>
    );
  };

  if (isLoading) {
    return (
      <AppSurface>
        <div className="max-w-4xl mx-auto space-y-6">
          <PageIntroSkeleton showAction={false} />
          <CardListSkeleton count={3} />
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
            <div className="w-16 h-16 bg-japandi-bg rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8" style={{ color: '#1C4D3A' }} />
            </div>
            <h2 className="text-xl font-medium mb-2" style={{ color: '#2D3330' }}>
              No Interviews Scheduled
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
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
                    <div className="flex flex-wrap gap-2">
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
                      {getDecisionBadge(interview.decisionState)}
                      {getEngagementBadge(interview)}
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
                    {interview.decisionState === 'hire' &&
                      interview.engagementVerification &&
                      !interview.engagementVerification.candidateConfirmedAt && (
                        <>
                          <select
                            aria-label="Engagement type"
                            value={resolveEngagementTypeValue(interview)}
                            onChange={(event) =>
                              setEngagementTypeSelections((current) => ({
                                ...current,
                                [interview.engagementVerification!.id]: event.target.value,
                              }))
                            }
                            className="h-9 rounded-md border border-gray-300 px-3 text-sm"
                          >
                            <option value="">Select engagement type</option>
                            <option value="full_time">Full-time</option>
                            <option value="part_time">Part-time</option>
                            <option value="contract_consulting">Contract / consulting</option>
                            <option value="fractional_project">Fractional / project</option>
                          </select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConfirmEngagement(interview)}
                            disabled={
                              isConfirmingEngagementId === interview.engagementVerification.id
                            }
                          >
                            {isConfirmingEngagementId === interview.engagementVerification.id
                              ? 'Confirming...'
                              : 'Confirm Engagement'}
                          </Button>
                        </>
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
