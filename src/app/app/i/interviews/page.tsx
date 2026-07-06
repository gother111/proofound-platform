/**
 * Interviews Page - Individual
 *
 * View and manage scheduled interviews.
 * Shows upcoming interviews with video links and reschedule options.
 */

'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Video, ExternalLink, CalendarPlus, Download } from 'lucide-react';
import { HiringCorridorTimeline } from '@/components/interviews/HiringCorridorTimeline';
import { Button } from '@/components/ui/button';
import { getInterviewCorridorItems } from '@/app/actions/interviews';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { CardListSkeleton, PageIntroSkeleton } from '@/components/skeletons/CoreLoadingPrimitives';
import {
  buildGoogleCalendarUrl,
  downloadInterviewIcs,
  type InterviewCalendarPayload,
} from '@/lib/interviews/calendar';
import { apiFetch } from '@/lib/api/fetch';
import { internalValueLabel } from '@/lib/copy/labels';
import type { HiringCorridorSnapshot } from '@/lib/hiring-corridor/snapshot';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';

interface Interview {
  id: string;
  matchId: string;
  assignmentTitle: string | null;
  organizationName: string | null;
  introAcceptedAt: string | null;
  interview: {
    id: string;
    scheduledAt: string | null;
    duration: number;
    platform: string | null;
    meetingUrl: string | null;
    manualMeetingProvider: string | null;
    rescheduleCount: number;
    status: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    noShowAt: string | null;
  } | null;
  corridor: HiringCorridorSnapshot;
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
      const data = await getInterviewCorridorItems({ perspective: 'individual' });
      setInterviews((data.items as Interview[]) || []);
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
    interviewId: interview.interview?.id ?? interview.id,
    scheduledAt: interview.interview?.scheduledAt ?? new Date().toISOString(),
    durationMinutes: interview.interview?.duration ?? 30,
    meetingUrl: interview.interview?.meetingUrl ?? 'pending',
    platform: interview.interview?.platform ?? 'manual',
    title: 'Proofound interview',
  });

  const resolveEngagementTypeValue = (interview: Interview) => {
    const verification =
      interview.engagementVerification ?? interview.corridor.engagementVerification;
    if (!verification) {
      return '';
    }

    return engagementTypeSelections[verification.id] ?? verification.engagementType ?? '';
  };

  const handleConfirmEngagement = async (interview: Interview) => {
    const verification =
      interview.engagementVerification ?? interview.corridor.engagementVerification;
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
      const response = await apiFetch(`/api/engagement-verifications/${verification.id}`, {
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
        Decision: {internalValueLabel(decisionState)}
      </span>
    );
  };

  const getEngagementBadge = (interview: Interview) => {
    const verification =
      interview.engagementVerification ?? interview.corridor.engagementVerification;
    if (!verification) {
      return null;
    }
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
          <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
            Loading interview flow...
          </p>
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
          <h1
            className="mb-2 font-display text-3xl font-semibold tracking-tight"
            style={{ color: '#2D3330' }}
          >
            Interviews
          </h1>
          <p className="max-w-2xl text-sm leading-6" style={{ color: '#6B6760' }}>
            Track the hiring flow from shortlist through interview, decision, and engagement
            verification.
          </p>
        </div>

        {/* Interviews List */}
        {interviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-proofound-stone/80 bg-white/60 px-4 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-japandi-bg">
              <Calendar className="w-8 h-8" style={{ color: '#1C4D3A' }} />
            </div>
            <h2 className="mb-2 font-display text-xl font-semibold" style={{ color: '#2D3330' }}>
              No active hiring flow yet
            </h2>
            <p className="mb-6 max-w-md text-sm leading-6 text-muted-foreground">
              Nothing needs scheduling right now. When an organization shortlists you, this page
              will show the next step and the full proof-safe timeline.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {interviews.map((interview) => (
              <div
                key={interview.id}
                className="rounded-2xl border border-proofound-stone/80 bg-white/70 p-4 transition-colors hover:border-proofound-stone sm:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="mb-3">
                      <p className="text-base font-semibold" style={{ color: '#2D3330' }}>
                        {interview.organizationName || interview.corridor.subjectLabel}
                      </p>
                      {interview.assignmentTitle ? (
                        <p className="text-sm" style={{ color: '#6B6760' }}>
                          {interview.assignmentTitle}
                        </p>
                      ) : null}
                    </div>

                    {/* Date & Time */}
                    <div className="mb-4">
                      <HiringCorridorTimeline corridor={interview.corridor} />
                    </div>

                    {interview.interview?.scheduledAt && (
                      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" style={{ color: '#1C4D3A' }} />
                          <span className="font-medium" style={{ color: '#2D3330' }}>
                            {formatDate(interview.interview.scheduledAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" style={{ color: '#6B6760' }} />
                          <span className="text-sm" style={{ color: '#6B6760' }}>
                            {formatTime(interview.interview.scheduledAt)} (
                            {interview.interview.duration} min)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Platform & Meeting Link */}
                    <div className="flex items-center gap-4 mb-4 flex-wrap">
                      {interview.interview?.platform && (
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4" style={{ color: '#6B6760' }} />
                          <span className="text-sm capitalize" style={{ color: '#6B6760' }}>
                            {interview.interview.platform}
                          </span>
                        </div>
                      )}
                      {interview.interview?.meetingUrl &&
                        interview.interview.meetingUrl !== 'pending' && (
                          <>
                            <a
                              href={interview.interview.meetingUrl}
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
                      {interview.interview?.status && (
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor:
                              interview.interview.status === 'scheduled'
                                ? '#E8F5E9'
                                : interview.interview.status === 'completed'
                                  ? '#E3F2FD'
                                  : '#FFF3E0',
                            color:
                              interview.interview.status === 'scheduled'
                                ? '#2E7D32'
                                : interview.interview.status === 'completed'
                                  ? '#1565C0'
                                  : '#E65100',
                          }}
                        >
                          {internalValueLabel(interview.interview.status)}
                        </span>
                      )}
                      {getDecisionBadge(interview.decisionState)}
                      {getEngagementBadge(interview)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex w-full flex-col gap-2 lg:w-auto lg:min-w-64">
                    {interview.corridor.nextAction.id === 'confirm_engagement' &&
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
                            className="h-10 rounded-md border border-proofound-stone bg-white px-3 text-sm"
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
                            className="w-full lg:w-auto"
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
