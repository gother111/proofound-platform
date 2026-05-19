/**
 * Interviews Page - Organization
 *
 * View and manage the hiring corridor for your organization.
 * Shows reveal approval, interview scheduling, decision, and engagement verification.
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  Video,
  ExternalLink,
  User,
  FileCheck,
  CalendarPlus,
  Download,
  Pencil,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { getInterviewCorridorItems } from '@/app/actions/interviews';
import { DecisionDialog } from '@/components/decisions/DecisionDialog';
import { HiringCorridorTimeline } from '@/components/interviews/HiringCorridorTimeline';
import { ScheduleInterviewButton } from '@/components/interviews/ScheduleInterviewButton';
import { CardListSkeleton, PageIntroSkeleton } from '@/components/skeletons/CoreLoadingPrimitives';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import {
  buildGoogleCalendarUrl,
  downloadInterviewIcs,
  type InterviewCalendarPayload,
} from '@/lib/interviews/calendar';
import { apiFetch } from '@/lib/api/fetch';
import { internalValueLabel } from '@/lib/copy/labels';
import type { HiringCorridorSnapshot } from '@/lib/hiring-corridor/snapshot';

export const dynamic = 'force-dynamic';

interface Interview {
  id: string;
  matchId: string;
  assignmentTitle: string | null;
  organizationName: string | null;
  candidateDisplayName: string | null;
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

export default function OrganizationInterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editReason, setEditReason] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isCancellingInterviewId, setIsCancellingInterviewId] = useState<string | null>(null);
  const [isCompletingInterviewId, setIsCompletingInterviewId] = useState<string | null>(null);
  const [isMarkingNoShowInterviewId, setIsMarkingNoShowInterviewId] = useState<string | null>(null);
  const [isConfirmingEngagementId, setIsConfirmingEngagementId] = useState<string | null>(null);
  const [engagementTypeSelections, setEngagementTypeSelections] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    void loadInterviews();
  }, []);

  const loadInterviews = async () => {
    setIsLoading(true);

    try {
      const data = await getInterviewCorridorItems({ perspective: 'organization' });
      setInterviews((data.items as Interview[]) || []);
    } catch (error) {
      console.error('Failed to load interviews:', error);
      setInterviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDecisionDialog = (interview: Interview) => {
    setSelectedInterview(interview);
    setDecisionDialogOpen(true);
  };

  const handleCloseDecisionDialog = () => {
    setDecisionDialogOpen(false);
    setSelectedInterview(null);
  };

  const handleDecisionMade = () => {
    void loadInterviews();
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
    if (platform === 'zoom') return 'Manual (Zoom)';
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
    title:
      interview.candidateDisplayName || interview.corridor.subjectLabel
        ? `Interview with ${interview.candidateDisplayName || interview.corridor.subjectLabel}`
        : 'Proofound interview',
  });

  const openEditDialog = (interview: Interview) => {
    if (!interview.interview?.scheduledAt) {
      return;
    }

    const scheduled = new Date(interview.interview.scheduledAt);
    const localDate = `${scheduled.getFullYear()}-${String(scheduled.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(scheduled.getDate()).padStart(2, '0')}`;
    const localTime = `${String(scheduled.getHours()).padStart(2, '0')}:${String(
      scheduled.getMinutes()
    ).padStart(2, '0')}`;

    setEditingInterview(interview);
    setEditDate(localDate);
    setEditTime(localTime);
    setEditReason('');
  };

  const closeEditDialog = () => {
    setEditingInterview(null);
    setEditDate('');
    setEditTime('');
    setEditReason('');
    setIsSavingEdit(false);
  };

  const handleSaveInterviewEdit = async () => {
    if (!editingInterview?.interview) return;
    if (!editDate || !editTime) {
      toast.error('Select both date and time before saving');
      return;
    }

    const editedAt = new Date(`${editDate}T${editTime}:00`);
    if (Number.isNaN(editedAt.getTime())) {
      toast.error('Invalid date or time');
      return;
    }

    setIsSavingEdit(true);
    try {
      const response = await apiFetch('/api/interviews/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: editingInterview.interview.id,
          scheduledAt: editedAt.toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          ...(editReason.trim() ? { reason: editReason.trim() } : {}),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update interview');
      }

      toast.success('Interview updated');
      closeEditDialog();
      await loadInterviews();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update interview');
      setIsSavingEdit(false);
    }
  };

  const handleCancelInterview = async (interview: Interview) => {
    if (!interview.interview) {
      return;
    }

    if (!confirm('Are you sure you want to cancel this interview?')) {
      return;
    }

    const reasonInput = window.prompt('Optional reason for cancellation (shown in conversation):');
    const reason = typeof reasonInput === 'string' ? reasonInput.trim() : '';

    setIsCancellingInterviewId(interview.interview.id);
    try {
      const response = await apiFetch('/api/interviews/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: interview.interview.id,
          ...(reason ? { reason } : {}),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to cancel interview');
      }

      toast.success('Interview cancelled');
      await loadInterviews();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel interview');
    } finally {
      setIsCancellingInterviewId(null);
    }
  };

  const handleCompleteInterview = async (interview: Interview) => {
    if (!interview.interview) {
      return;
    }

    if (!confirm('Mark this interview as completed? This will unlock the decision step.')) {
      return;
    }

    setIsCompletingInterviewId(interview.interview.id);
    try {
      const response = await apiFetch('/api/interviews/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: interview.interview.id,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to mark interview complete');
      }

      toast.success('Interview marked complete');
      await loadInterviews();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark interview complete');
    } finally {
      setIsCompletingInterviewId(null);
    }
  };

  const handleMarkNoShow = async (interview: Interview) => {
    if (!interview.interview) {
      return;
    }

    if (
      !confirm(
        'Mark this interview as a no-show? The corridor will require a replacement interview.'
      )
    ) {
      return;
    }

    const reasonInput = window.prompt('Optional no-show reason:');
    const reason = typeof reasonInput === 'string' ? reasonInput.trim() : '';

    setIsMarkingNoShowInterviewId(interview.interview.id);
    try {
      const response = await apiFetch('/api/interviews/no-show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: interview.interview.id,
          ...(reason ? { reason } : {}),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to mark no-show');
      }

      toast.success('Interview marked no-show');
      await loadInterviews();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark no-show');
    } finally {
      setIsMarkingNoShowInterviewId(null);
    }
  };

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
        className={
          decisionState === 'hire'
            ? 'rounded-full bg-[#dff0d9] px-2 py-1 text-xs font-medium text-proofound-forest'
            : 'rounded-full bg-proofound-stone/35 px-2 py-1 text-xs font-medium text-muted-foreground'
        }
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
        className={
          isVerified
            ? 'rounded-full bg-[#dff0d9] px-2 py-1 text-xs font-medium text-proofound-forest'
            : 'rounded-full bg-[#fff1d6] px-2 py-1 text-xs font-medium text-[#8a5b00]'
        }
      >
        Engagement: {verification.statusLabel}
      </span>
    );
  };

  const canEditInterview = (interview: Interview) =>
    interview.interview?.status === 'scheduled' &&
    Boolean(interview.interview.scheduledAt) &&
    new Date(interview.interview.scheduledAt as string) > new Date() &&
    (interview.interview.rescheduleCount ?? 0) < 1;

  const canScheduleInterview = (interview: Interview) =>
    interview.corridor.nextAction.id === 'schedule_interview' ||
    interview.corridor.nextAction.id === 'advance_to_next_interview';

  const canRecordDecision = (interview: Interview) =>
    interview.corridor.nextAction.id === 'record_decision' && Boolean(interview.interview?.id);

  const canConfirmEngagement = (interview: Interview) =>
    interview.corridor.nextAction.id === 'confirm_engagement' &&
    Boolean(
      (interview.engagementVerification ?? interview.corridor.engagementVerification)
        ?.organizationConfirmedAt === null
    );

  const scheduleAnchorDateFor = (interview: Interview) =>
    interview.corridor.nextAction.id === 'advance_to_next_interview'
      ? new Date()
      : new Date(interview.introAcceptedAt ?? Date.now());

  if (isLoading) {
    return (
      <AppSurface>
        <div className="mx-auto max-w-4xl space-y-6">
          <section className="rounded-2xl border border-proofound-stone bg-white/85 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Interviews
            </p>
            <h1 className="mt-2 font-display text-xl font-semibold text-foreground">
              Interview corridor is loading
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              We are preparing scheduling, decision, feedback, and engagement verification steps for
              this organization workspace.
            </p>
            <p className="mt-3 text-sm text-muted-foreground" role="status">
              Loading interview corridor...
            </p>
          </section>
          <PageIntroSkeleton showAction={false} />
          <CardListSkeleton count={3} />
        </div>
      </AppSurface>
    );
  }

  return (
    <AppSurface>
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 overflow-hidden rounded-lg border border-proofound-stone/70 bg-white shadow-[0_18px_50px_rgba(45,51,48,0.06)]">
          <div className="flex items-center gap-2 border-b border-proofound-stone/60 bg-[#f3f6ef] px-5 py-3">
            <Badge
              variant="secondary"
              className="bg-white hover:bg-white text-proofound-forest border-proofound-stone"
            >
              Interview corridor
            </Badge>
          </div>
          <div className="flex flex-col gap-6 px-5 py-6 sm:flex-row sm:items-start sm:justify-between sm:px-6">
            <div className="flex min-w-0 flex-1 gap-4 sm:gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#dfead5] text-proofound-forest shadow-sm ring-1 ring-black/5 sm:h-14 sm:w-14">
                <Calendar className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <h1 className="mb-2 font-display text-2xl font-medium leading-tight text-proofound-charcoal md:text-3xl">
                  Interviews
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Track the full hiring corridor, from shortlist through decision and engagement
                  verification.
                </p>
              </div>
            </div>
          </div>
        </header>

        {interviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-proofound-stone/70 bg-white px-4 py-16 text-center shadow-sm">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#eef3e8] text-proofound-forest">
              <Calendar className="h-8 w-8" />
            </div>
            <h2 className="mb-2 text-xl font-medium text-proofound-charcoal">
              No active hiring corridor yet
            </h2>
            <p className="mb-6 max-w-md text-sm text-muted-foreground">
              Once you shortlist a candidate, this page will show each corridor stage, the privacy
              status, and the next action.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {interviews.map((interview) => {
              const verification =
                interview.engagementVerification ?? interview.corridor.engagementVerification;
              const hasFutureInterview =
                interview.interview?.status === 'scheduled' &&
                Boolean(interview.interview.scheduledAt) &&
                new Date(interview.interview.scheduledAt as string) > new Date();

              return (
                <div
                  key={interview.id}
                  className="rounded-lg border border-proofound-stone/70 bg-white p-4 transition-colors hover:border-proofound-stone sm:p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {interview.candidateDisplayName ? (
                            <>
                              <User className="h-4 w-4 text-proofound-forest" />
                              <p className="text-base font-semibold text-proofound-charcoal">
                                {interview.candidateDisplayName}
                              </p>
                            </>
                          ) : (
                            <p className="text-base font-semibold text-proofound-charcoal">
                              {interview.corridor.subjectLabel}
                            </p>
                          )}
                        </div>
                        {interview.assignmentTitle ? (
                          <p className="text-sm text-muted-foreground">
                            {interview.assignmentTitle}
                          </p>
                        ) : null}
                      </div>

                      <HiringCorridorTimeline corridor={interview.corridor} />

                      {interview.interview?.scheduledAt ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 text-proofound-forest">
                              <Calendar className="h-4 w-4" />
                              <span className="font-medium text-proofound-charcoal">
                                {formatDate(interview.interview.scheduledAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span className="text-sm">
                                {formatTime(interview.interview.scheduledAt)} (
                                {interview.interview.duration} min)
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                            {interview.interview.platform ? (
                              <div className="flex items-center gap-2">
                                <Video className="h-4 w-4" />
                                <span className="text-sm capitalize">
                                  {meetingPlatformLabel(interview.interview.platform)}
                                </span>
                              </div>
                            ) : null}

                            {interview.interview.meetingUrl &&
                            interview.interview.meetingUrl !== 'pending' ? (
                              <>
                                <a
                                  href={interview.interview.meetingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-proofound-stone/80 bg-white px-3 text-sm font-medium text-proofound-forest hover:bg-proofound-parchment/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
                                >
                                  Join Meeting
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                                <a
                                  href={buildGoogleCalendarUrl(toCalendarPayload(interview))}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-proofound-stone/80 bg-white px-3 text-sm font-medium text-proofound-forest hover:bg-proofound-parchment/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
                                >
                                  Add to calendar
                                  <CalendarPlus className="h-3 w-3" />
                                </a>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="min-h-10 px-3 text-xs"
                                  onClick={() => downloadInterviewIcs(toCalendarPayload(interview))}
                                >
                                  <Download className="mr-1 h-3 w-3" />
                                  .ics
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </div>
                      ) : null}

                      <div className="flex flex-wrap gap-2">
                        {interview.interview?.status ? (
                          <span
                            className={
                              interview.interview.status === 'scheduled'
                                ? 'rounded-full bg-[#dff0d9] px-2 py-1 text-xs font-medium text-proofound-forest'
                                : interview.interview.status === 'completed'
                                  ? 'rounded-full bg-[#dcecf8] px-2 py-1 text-xs font-medium text-[#28628a]'
                                  : 'rounded-full bg-[#fff1df] px-2 py-1 text-xs font-medium text-[#8a4d1f]'
                            }
                          >
                            {internalValueLabel(interview.interview.status)}
                          </span>
                        ) : null}
                        {getDecisionBadge(interview.decisionState)}
                        {getEngagementBadge(interview)}
                        {(interview.interview?.rescheduleCount ?? 0) > 0 ? (
                          <span className="rounded-full bg-[#fff1d6] px-2 py-1 text-xs font-medium text-[#8a5b00]">
                            Rescheduled {interview.interview?.rescheduleCount} time
                            {(interview.interview?.rescheduleCount ?? 0) === 1 ? '' : 's'}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 lg:w-[220px] lg:shrink-0">
                      {canScheduleInterview(interview) && interview.introAcceptedAt ? (
                        <ScheduleInterviewButton
                          matchId={interview.matchId}
                          matchAgreedAt={scheduleAnchorDateFor(interview)}
                          existingInterviewsCount={0}
                          variant="default"
                          size="sm"
                          onScheduled={() => {
                            void loadInterviews();
                          }}
                        />
                      ) : null}

                      {hasFutureInterview ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(interview)}
                            disabled={!canEditInterview(interview)}
                            className="flex min-h-10 w-full items-center justify-center gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            {(interview.interview?.rescheduleCount ?? 0) > 0
                              ? 'Reschedule limit reached'
                              : 'Edit Interview'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelInterview(interview)}
                            disabled={isCancellingInterviewId === interview.interview?.id}
                            className="flex min-h-10 w-full items-center justify-center gap-2 border-[#E0C9C1] text-[#A03A2A]"
                          >
                            <XCircle className="h-4 w-4" />
                            {isCancellingInterviewId === interview.interview?.id
                              ? 'Cancelling...'
                              : 'Cancel Interview'}
                          </Button>
                        </>
                      ) : null}

                      {interview.interview?.status === 'scheduled' ? (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleCompleteInterview(interview)}
                            disabled={isCompletingInterviewId === interview.interview?.id}
                            className="flex min-h-10 w-full items-center justify-center gap-2 bg-proofound-forest text-white hover:bg-proofound-forest/90"
                          >
                            <FileCheck className="h-4 w-4" />
                            {isCompletingInterviewId === interview.interview?.id
                              ? 'Marking complete...'
                              : 'Mark Complete'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkNoShow(interview)}
                            disabled={isMarkingNoShowInterviewId === interview.interview?.id}
                            className="flex min-h-10 w-full items-center justify-center gap-2"
                          >
                            <XCircle className="h-4 w-4" />
                            {isMarkingNoShowInterviewId === interview.interview?.id
                              ? 'Marking no-show...'
                              : 'Mark No-show'}
                          </Button>
                        </>
                      ) : null}

                      {canRecordDecision(interview) && interview.interview?.id ? (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleOpenDecisionDialog(interview)}
                          className="flex min-h-10 w-full items-center justify-center gap-2 bg-proofound-forest text-white hover:bg-proofound-forest/90"
                        >
                          <FileCheck className="h-4 w-4" />
                          Record Decision
                        </Button>
                      ) : null}

                      {canConfirmEngagement(interview) && verification ? (
                        <>
                          <select
                            aria-label="Engagement type"
                            value={resolveEngagementTypeValue(interview)}
                            onChange={(event) =>
                              setEngagementTypeSelections((current) => ({
                                ...current,
                                [verification.id]: event.target.value,
                              }))
                            }
                            className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
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
                            disabled={isConfirmingEngagementId === verification.id}
                            className="flex min-h-10 w-full items-center justify-center gap-2"
                          >
                            <FileCheck className="h-4 w-4" />
                            {isConfirmingEngagementId === verification.id
                              ? 'Confirming...'
                              : 'Confirm Engagement'}
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Dialog
          open={Boolean(editingInterview)}
          onOpenChange={(open) => !open && closeEditDialog()}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Interview</DialogTitle>
              <DialogDescription>
                Update the interview time. Changes will be sent to the candidate via messaging.
              </DialogDescription>
            </DialogHeader>

            {editingInterview ? (
              <p className="text-xs text-muted-foreground">
                {editingInterview.interview?.rescheduleCount &&
                editingInterview.interview.rescheduleCount > 0
                  ? 'This interview has already been rescheduled once. Further edits are blocked by the launch policy.'
                  : 'Launch policy allows one auditable reschedule on the same interview record.'}
              </p>
            ) : null}

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="edit-interview-date"
                >
                  Date
                </label>
                <input
                  id="edit-interview-date"
                  type="date"
                  value={editDate}
                  onChange={(event) => setEditDate(event.target.value)}
                  className="h-10 w-full rounded-md border border-proofound-stone/70 px-3 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="edit-interview-time"
                >
                  Time
                </label>
                <input
                  id="edit-interview-time"
                  type="time"
                  value={editTime}
                  onChange={(event) => setEditTime(event.target.value)}
                  className="h-10 w-full rounded-md border border-proofound-stone/70 px-3 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="edit-interview-reason"
                >
                  Reason (optional)
                </label>
                <textarea
                  id="edit-interview-reason"
                  value={editReason}
                  onChange={(event) => setEditReason(event.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-proofound-stone/70 px-3 py-2 text-sm"
                  placeholder="Add context for the update..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={closeEditDialog} disabled={isSavingEdit}>
                Close
              </Button>
              <Button onClick={handleSaveInterviewEdit} disabled={isSavingEdit}>
                {isSavingEdit ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {selectedInterview?.interview?.id ? (
          <DecisionDialog
            isOpen={decisionDialogOpen}
            onClose={handleCloseDecisionDialog}
            interviewId={selectedInterview.interview.id}
            candidateName={
              selectedInterview.candidateDisplayName || selectedInterview.corridor.subjectLabel
            }
            role={selectedInterview.assignmentTitle || 'Assignment'}
            onDecisionMade={handleDecisionMade}
          />
        ) : null}
      </div>
    </AppSurface>
  );
}
