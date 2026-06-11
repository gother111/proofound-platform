/**
 * Interviews Page - Individual
 *
 * View and manage scheduled interviews.
 * Shows upcoming interviews with video links and reschedule options.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Calendar,
  Clock,
  Video,
  ExternalLink,
  CalendarPlus,
  Download,
  RefreshCcw,
} from 'lucide-react';
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
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import type { HiringCorridorSnapshot } from '@/lib/hiring-corridor/snapshot';
import { toast } from 'sonner';

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

export default function IndividualInterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isConfirmingEngagementId, setIsConfirmingEngagementId] = useState<string | null>(null);
  const [engagementTypeSelections, setEngagementTypeSelections] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await getInterviewCorridorItems({ perspective: 'individual' });
      setInterviews((data.items as Interview[]) || []);
    } catch (error) {
      dispatchClientErrorDiagnostic('interviews.individual.load_failed', error);
      setInterviews([]); // Set empty array on error
      setLoadError(
        'Your scheduled interviews and decisions are still safe. Retry this section to refresh the interview workflow.'
      );
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

  const meetingPlatformLabel = (platform: string | null | undefined) => {
    if (platform === 'zoom') return 'Manual link';
    return internalValueLabel(platform);
  };

  const toCalendarPayload = (interview: Interview): InterviewCalendarPayload => ({
    interviewId: interview.interview?.id ?? interview.id,
    scheduledAt: interview.interview?.scheduledAt ?? new Date().toISOString(),
    durationMinutes: interview.interview?.duration ?? 30,
    meetingUrl: interview.interview?.meetingUrl ?? 'pending',
    platform:
      interview.interview?.platform === 'zoom'
        ? 'manual'
        : (interview.interview?.platform ?? 'manual'),
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
      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
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
        className={`rounded-full px-2 py-1 text-xs font-medium ${
          isVerified ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'
        }`}
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
            Loading interview workflow...
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
          <h1 className="mb-2 font-display text-3xl font-semibold tracking-tight text-proofound-charcoal">
            Interviews
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Track the staged workflow from shortlist through interview, decision, and engagement
            verification.
          </p>
        </div>

        {/* Interviews List */}
        {loadError ? (
          <div
            role="alert"
            className="rounded-2xl border border-proofound-stone/80 bg-white/75 p-5 shadow-sm sm:p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#fff1d6] text-[#8a5b00]">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Interviews</p>
                <h2 className="mt-2 font-display text-xl font-semibold text-proofound-charcoal">
                  Interview workflow could not load
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {loadError}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="min-h-10 shrink-0 gap-2"
                onClick={() => {
                  void loadInterviews();
                }}
              >
                <RefreshCcw className="h-4 w-4" />
                Retry interviews
              </Button>
            </div>
          </div>
        ) : interviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-proofound-stone/80 bg-white/60 px-4 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-japandi-bg">
              <Calendar className="h-8 w-8 text-proofound-forest" />
            </div>
            <h2 className="mb-2 font-display text-xl font-semibold text-proofound-charcoal">
              No active interview workflow yet
            </h2>
            <p className="mb-6 max-w-md text-sm leading-6 text-muted-foreground">
              Nothing needs scheduling right now. When an organization shortlists you, this page
              will show the next step and the full proof-safe timeline.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/app/i/matching">Review matching</Link>
            </Button>
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
                      <p className="text-base font-semibold text-proofound-charcoal">
                        {interview.organizationName || interview.corridor.subjectLabel}
                      </p>
                      {interview.assignmentTitle ? (
                        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
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
                          <Calendar className="h-4 w-4 text-proofound-forest" />
                          <span className="font-medium text-proofound-charcoal">
                            {formatDate(interview.interview.scheduledAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
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
                          <Video className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {meetingPlatformLabel(interview.interview.platform)}
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
                              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-proofound-stone/80 bg-white px-3 text-sm font-medium text-proofound-forest hover:bg-proofound-parchment/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
                            >
                              Join Meeting
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <a
                              href={buildGoogleCalendarUrl(toCalendarPayload(interview))}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-proofound-stone/80 bg-white px-3 text-sm font-medium text-proofound-forest hover:bg-proofound-parchment/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
                            >
                              Add to calendar
                              <CalendarPlus className="w-3 h-3" />
                            </a>
                            <Button
                              variant="outline"
                              size="sm"
                              className="min-h-10 px-3 text-xs"
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
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            interview.interview.status === 'scheduled'
                              ? 'bg-emerald-50 text-emerald-800'
                              : interview.interview.status === 'completed'
                                ? 'bg-sky-50 text-sky-800'
                                : 'bg-orange-50 text-orange-800'
                          }`}
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
                            className="min-h-10 w-full lg:w-auto"
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
