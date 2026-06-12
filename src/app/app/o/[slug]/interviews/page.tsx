/**
 * Interviews Page - Organization
 *
 * View and manage the interview workflow for your organization.
 * Shows reveal approval, interview scheduling, decision, and engagement verification.
 */

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
  AlertTriangle,
  RefreshCcw,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import {
  buildGoogleCalendarUrl,
  downloadInterviewIcs,
  type InterviewCalendarPayload,
} from '@/lib/interviews/calendar';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
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

type WorkflowActionFeedback = {
  kind: 'engagement_confirmation';
  itemId: string;
  verificationId: string;
  title: string;
  message: string;
};

type InterviewDialogFeedback = {
  kind: 'edit' | 'cancel' | 'complete' | 'no_show';
  interviewId: string;
  title: string;
  message: string;
};

const INTERVIEW_UPDATE_FAILED_MESSAGE =
  'Interview update could not be saved. The interview workflow is unchanged; review the time and retry before closing.';
const INTERVIEW_CANCEL_FAILED_MESSAGE =
  'Interview cancellation could not be recorded. The interview remains scheduled; review the reason and retry.';
const INTERVIEW_COMPLETE_FAILED_MESSAGE =
  'Interview completion could not be recorded. The corridor is unchanged; retry before recording a decision.';
const INTERVIEW_NO_SHOW_FAILED_MESSAGE =
  'No-show could not be recorded. The interview workflow is unchanged; review the note and retry.';
const ENGAGEMENT_CONFIRMATION_FAILED_MESSAGE =
  'Engagement confirmation could not be recorded. The engagement state is unchanged; retry before moving on.';

export default function OrganizationInterviewsPage() {
  const params = useParams<{ slug?: string | string[] }>();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [workflowActionFeedback, setWorkflowActionFeedback] =
    useState<WorkflowActionFeedback | null>(null);
  const [interviewDialogFeedback, setInterviewDialogFeedback] =
    useState<InterviewDialogFeedback | null>(null);
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [cancelInterview, setCancelInterview] = useState<Interview | null>(null);
  const [completeInterview, setCompleteInterview] = useState<Interview | null>(null);
  const [noShowInterview, setNoShowInterview] = useState<Interview | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [noShowReason, setNoShowReason] = useState('');
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
  const rawOrgSlug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const assignmentsHref = rawOrgSlug
    ? `/app/o/${encodeURIComponent(rawOrgSlug)}/assignments`
    : null;

  useEffect(() => {
    void loadInterviews();
  }, []);

  const loadInterviews = async () => {
    setIsLoading(true);
    setLoadError(null);
    setWorkflowActionFeedback(null);

    try {
      const data = await getInterviewCorridorItems({ perspective: 'organization' });
      setInterviews((data.items as Interview[]) || []);
    } catch (error) {
      dispatchClientErrorDiagnostic('interviews.organization.load_failed', error);
      setInterviews([]);
      setLoadError(
        'Scheduled interviews, decisions, and engagement records are still safe. Retry this section to refresh the organization workflow.'
      );
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
    if (platform === 'zoom') return 'Manual link';
    return internalValueLabel(platform);
  };

  const meetingDisplayLabel = (interview: Interview['interview']) =>
    meetingPlatformLabel(interview?.manualMeetingProvider ?? interview?.platform);

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
    setInterviewDialogFeedback(null);
  };

  const closeEditDialog = () => {
    setEditingInterview(null);
    setEditDate('');
    setEditTime('');
    setEditReason('');
    setIsSavingEdit(false);
    setInterviewDialogFeedback(null);
  };

  const openCancelDialog = (interview: Interview) => {
    setCancelInterview(interview);
    setCancelReason('');
    setInterviewDialogFeedback(null);
  };

  const closeCancelDialog = () => {
    if (isCancellingInterviewId) return;
    setCancelInterview(null);
    setCancelReason('');
    setInterviewDialogFeedback(null);
  };

  const openCompleteDialog = (interview: Interview) => {
    setCompleteInterview(interview);
    setInterviewDialogFeedback(null);
  };

  const closeCompleteDialog = () => {
    if (isCompletingInterviewId) return;
    setCompleteInterview(null);
    setInterviewDialogFeedback(null);
  };

  const openNoShowDialog = (interview: Interview) => {
    setNoShowInterview(interview);
    setNoShowReason('');
    setInterviewDialogFeedback(null);
  };

  const closeNoShowDialog = () => {
    if (isMarkingNoShowInterviewId) return;
    setNoShowInterview(null);
    setNoShowReason('');
    setInterviewDialogFeedback(null);
  };

  const handleSaveInterviewEdit = async () => {
    if (!editingInterview?.interview) return;
    if (!editDate || !editTime) {
      const message = 'Select both date and time before saving.';
      setInterviewDialogFeedback({
        kind: 'edit',
        interviewId: editingInterview.interview.id,
        title: 'Choose a date and time',
        message,
      });
      toast.error(message);
      return;
    }

    const editedAt = new Date(`${editDate}T${editTime}:00`);
    if (Number.isNaN(editedAt.getTime())) {
      const message = 'Choose a valid interview date and time before saving.';
      setInterviewDialogFeedback({
        kind: 'edit',
        interviewId: editingInterview.interview.id,
        title: 'Interview time is invalid',
        message,
      });
      toast.error(message);
      return;
    }

    setIsSavingEdit(true);
    setInterviewDialogFeedback(null);
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
      dispatchClientErrorDiagnostic('interviews.organization.edit_failed', error);
      const message = INTERVIEW_UPDATE_FAILED_MESSAGE;
      setInterviewDialogFeedback({
        kind: 'edit',
        interviewId: editingInterview.interview.id,
        title: 'Interview update could not be saved',
        message,
      });
      toast.error(message);
      setIsSavingEdit(false);
    }
  };

  const handleConfirmCancelInterview = async () => {
    if (!cancelInterview?.interview) {
      return;
    }

    const reason = cancelReason.trim();

    setIsCancellingInterviewId(cancelInterview.interview.id);
    setInterviewDialogFeedback(null);
    try {
      const response = await apiFetch('/api/interviews/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: cancelInterview.interview.id,
          ...(reason ? { reason } : {}),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to cancel interview');
      }

      toast.success('Interview cancelled');
      setCancelInterview(null);
      setCancelReason('');
      await loadInterviews();
    } catch (error) {
      dispatchClientErrorDiagnostic('interviews.organization.cancel_failed', error);
      const message = INTERVIEW_CANCEL_FAILED_MESSAGE;
      setInterviewDialogFeedback({
        kind: 'cancel',
        interviewId: cancelInterview.interview.id,
        title: 'Interview cancellation could not be recorded',
        message,
      });
      toast.error(message);
    } finally {
      setIsCancellingInterviewId(null);
    }
  };

  const handleConfirmCompleteInterview = async () => {
    if (!completeInterview?.interview) {
      return;
    }

    setIsCompletingInterviewId(completeInterview.interview.id);
    setInterviewDialogFeedback(null);
    try {
      const response = await apiFetch('/api/interviews/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: completeInterview.interview.id,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to mark interview complete');
      }

      toast.success('Interview marked complete');
      setCompleteInterview(null);
      await loadInterviews();
    } catch (error) {
      dispatchClientErrorDiagnostic('interviews.organization.complete_failed', error);
      const message = INTERVIEW_COMPLETE_FAILED_MESSAGE;
      setInterviewDialogFeedback({
        kind: 'complete',
        interviewId: completeInterview.interview.id,
        title: 'Interview completion could not be recorded',
        message,
      });
      toast.error(message);
    } finally {
      setIsCompletingInterviewId(null);
    }
  };

  const handleConfirmMarkNoShow = async () => {
    if (!noShowInterview?.interview) {
      return;
    }

    const reason = noShowReason.trim();

    setIsMarkingNoShowInterviewId(noShowInterview.interview.id);
    setInterviewDialogFeedback(null);
    try {
      const response = await apiFetch('/api/interviews/no-show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: noShowInterview.interview.id,
          ...(reason ? { reason } : {}),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to mark no-show');
      }

      toast.success('Interview marked no-show');
      setNoShowInterview(null);
      setNoShowReason('');
      await loadInterviews();
    } catch (error) {
      dispatchClientErrorDiagnostic('interviews.organization.no_show_failed', error);
      const message = INTERVIEW_NO_SHOW_FAILED_MESSAGE;
      setInterviewDialogFeedback({
        kind: 'no_show',
        interviewId: noShowInterview.interview.id,
        title: 'No-show could not be recorded',
        message,
      });
      toast.error(message);
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
      setWorkflowActionFeedback({
        kind: 'engagement_confirmation',
        itemId: interview.id,
        verificationId: verification.id,
        title: 'Choose an engagement type',
        message:
          'Select how the work will be structured before recording the engagement confirmation.',
      });
      toast.error('Select an engagement type before confirming');
      return;
    }

    setIsConfirmingEngagementId(verification.id);
    setWorkflowActionFeedback(null);
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
      dispatchClientErrorDiagnostic('interviews.organization.engagement_confirm_failed', error);
      const message = ENGAGEMENT_CONFIRMATION_FAILED_MESSAGE;
      setWorkflowActionFeedback({
        kind: 'engagement_confirmation',
        itemId: interview.id,
        verificationId: verification.id,
        title: 'Engagement confirmation could not be recorded',
        message,
      });
      toast.error(message);
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

  const getInterviewDialogFeedback = (
    kind: InterviewDialogFeedback['kind'],
    interview: Interview | null
  ) => {
    if (!interview?.interview?.id) {
      return null;
    }

    if (
      interviewDialogFeedback?.kind === kind &&
      interviewDialogFeedback.interviewId === interview.interview.id
    ) {
      return interviewDialogFeedback;
    }

    return null;
  };

  const renderInterviewDialogFeedback = ({
    feedback,
    retryLabel,
    isRetrying,
    onRetry,
  }: {
    feedback: InterviewDialogFeedback | null;
    retryLabel: string;
    isRetrying: boolean;
    onRetry: () => void;
  }) => {
    if (!feedback) {
      return null;
    }

    return (
      <div
        role="alert"
        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-900"
      >
        <p className="font-semibold">{feedback.title}</p>
        <p className="mt-1">{feedback.message}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={isRetrying}
          className="mt-3 h-8 rounded-full border-amber-300 bg-white px-3 text-xs font-semibold text-amber-950 hover:bg-amber-100"
        >
          {isRetrying ? 'Retrying...' : retryLabel}
        </Button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <AppSurface>
        <div className="mx-auto max-w-4xl space-y-6">
          <section className="rounded-2xl border border-proofound-stone bg-white/85 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Interviews
            </p>
            <h1 className="mt-2 font-display text-xl font-semibold text-foreground">
              Interview workflow is loading
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              We are preparing scheduling, decision, feedback, and engagement verification steps for
              this organization workspace.
            </p>
            <p className="mt-3 text-sm text-muted-foreground" role="status">
              Loading interview workflow...
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
              Interview workflow
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
                  Track the staged workflow from shortlist through decision and engagement
                  verification.
                </p>
              </div>
            </div>
          </div>
        </header>

        {loadError ? (
          <div
            role="alert"
            className="rounded-lg border border-proofound-stone/70 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[#fff1d6] text-[#8a5b00]">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Interview workflow</p>
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
                className="flex min-h-10 shrink-0 items-center justify-center gap-2"
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
          <div className="flex flex-col items-center justify-center rounded-lg border border-proofound-stone/70 bg-white px-4 py-16 text-center shadow-sm">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#eef3e8] text-proofound-forest">
              <Calendar className="h-8 w-8" />
            </div>
            <h2 className="mb-2 text-xl font-medium text-proofound-charcoal">
              No active interview workflow yet
            </h2>
            <p className="mb-6 max-w-md text-sm text-muted-foreground">
              Once an introduction is approved, this page will show each workflow stage, the privacy
              status, and the next action.
            </p>
            {assignmentsHref ? (
              <Button asChild variant="outline" size="sm" className="min-h-10">
                <Link href={assignmentsHref}>Review assignment queue</Link>
              </Button>
            ) : null}
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
                                  {meetingDisplayLabel(interview.interview)}
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
                            ) : (
                              <div
                                role="status"
                                className="flex min-w-0 items-start gap-2 rounded-md border border-[#E4CF9D] bg-[#FFF8E8] px-3 py-2 text-sm leading-5 text-[#6f4a00]"
                              >
                                <Video className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>
                                  <span className="font-semibold">Meeting link pending.</span> Join
                                  and calendar controls appear once a usable meeting link is
                                  attached.
                                </span>
                              </div>
                            )}
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
                            onClick={() => openCancelDialog(interview)}
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
                            onClick={() => openCompleteDialog(interview)}
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
                            onClick={() => openNoShowDialog(interview)}
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
                            onChange={(event) => {
                              if (
                                workflowActionFeedback?.kind === 'engagement_confirmation' &&
                                workflowActionFeedback.verificationId === verification.id
                              ) {
                                setWorkflowActionFeedback(null);
                              }
                              setEngagementTypeSelections((current) => ({
                                ...current,
                                [verification.id]: event.target.value,
                              }));
                            }}
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
                          {workflowActionFeedback?.kind === 'engagement_confirmation' &&
                          workflowActionFeedback.itemId === interview.id &&
                          workflowActionFeedback.verificationId === verification.id ? (
                            <div
                              role="alert"
                              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900"
                            >
                              <p className="font-semibold">{workflowActionFeedback.title}</p>
                              <p>{workflowActionFeedback.message}</p>
                              {resolveEngagementTypeValue(interview) ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    void handleConfirmEngagement(interview);
                                  }}
                                  disabled={isConfirmingEngagementId === verification.id}
                                  className="mt-2 h-8 rounded-full border-amber-300 bg-white px-3 text-xs font-semibold text-amber-950 hover:bg-amber-100"
                                >
                                  Retry confirmation
                                </Button>
                              ) : null}
                            </div>
                          ) : null}
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
                Update the interview time. Changes will be sent through workflow messaging.
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
                  onChange={(event) => {
                    setEditDate(event.target.value);
                    if (getInterviewDialogFeedback('edit', editingInterview)) {
                      setInterviewDialogFeedback(null);
                    }
                  }}
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
                  onChange={(event) => {
                    setEditTime(event.target.value);
                    if (getInterviewDialogFeedback('edit', editingInterview)) {
                      setInterviewDialogFeedback(null);
                    }
                  }}
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
                  onChange={(event) => {
                    setEditReason(event.target.value);
                    if (getInterviewDialogFeedback('edit', editingInterview)) {
                      setInterviewDialogFeedback(null);
                    }
                  }}
                  rows={3}
                  className="w-full rounded-md border border-proofound-stone/70 px-3 py-2 text-sm"
                  placeholder="Add context for the update..."
                />
              </div>

              {renderInterviewDialogFeedback({
                feedback: getInterviewDialogFeedback('edit', editingInterview),
                retryLabel: 'Retry update',
                isRetrying: isSavingEdit,
                onRetry: () => {
                  void handleSaveInterviewEdit();
                },
              })}
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
            assignmentTitle={selectedInterview.assignmentTitle || 'Assignment'}
            onDecisionMade={handleDecisionMade}
          />
        ) : null}

        <Dialog
          open={Boolean(completeInterview)}
          onOpenChange={(open) => !open && closeCompleteDialog()}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-proofound-forest">
                <FileCheck className="h-5 w-5" />
                Mark interview complete
              </DialogTitle>
              <DialogDescription>
                Confirm this only after the interview has finished. The decision step becomes
                available next.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-[#d8e6d2] bg-[#f5faf1] p-3 text-sm text-proofound-forest">
              <p className="font-medium">Completion moves the corridor forward.</p>
              <p className="mt-1">
                The interview will be recorded as complete and the organization can record the
                workflow decision for this proof-review participant.
              </p>
            </div>

            {renderInterviewDialogFeedback({
              feedback: getInterviewDialogFeedback('complete', completeInterview),
              retryLabel: 'Retry completion',
              isRetrying: Boolean(isCompletingInterviewId),
              onRetry: () => {
                void handleConfirmCompleteInterview();
              },
            })}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={closeCompleteDialog}
                disabled={Boolean(isCompletingInterviewId)}
              >
                Keep scheduled
              </Button>
              <Button
                onClick={() => {
                  void handleConfirmCompleteInterview();
                }}
                disabled={Boolean(isCompletingInterviewId)}
                className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
              >
                {isCompletingInterviewId ? 'Marking complete...' : 'Mark interview complete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(noShowInterview)}
          onOpenChange={(open) => !open && closeNoShowDialog()}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#A03A2A]">
                <AlertTriangle className="h-5 w-5" />
                Record no-show
              </DialogTitle>
              <DialogDescription>
                Use this when the scheduled call did not happen. Add context so the replacement
                interview path is clear.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border border-[#E0C9C1] bg-[#fff8f3] p-3 text-sm text-[#6f2f22]">
                <p className="font-medium">No-show pauses the decision path.</p>
                <p className="mt-1">
                  The corridor will require a replacement interview before a decision can be
                  recorded.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="no-show-interview-reason">Reason (optional)</Label>
                <Textarea
                  id="no-show-interview-reason"
                  value={noShowReason}
                  onChange={(event) => {
                    setNoShowReason(event.target.value);
                    if (getInterviewDialogFeedback('no_show', noShowInterview)) {
                      setInterviewDialogFeedback(null);
                    }
                  }}
                  rows={3}
                  disabled={Boolean(isMarkingNoShowInterviewId)}
                  aria-describedby="no-show-interview-reason-help"
                  placeholder="Add what happened and what should happen next..."
                />
                <p id="no-show-interview-reason-help" className="text-xs text-muted-foreground">
                  Keep this factual and suitable for conversation history.
                </p>
              </div>

              {renderInterviewDialogFeedback({
                feedback: getInterviewDialogFeedback('no_show', noShowInterview),
                retryLabel: 'Retry no-show',
                isRetrying: Boolean(isMarkingNoShowInterviewId),
                onRetry: () => {
                  void handleConfirmMarkNoShow();
                },
              })}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={closeNoShowDialog}
                disabled={Boolean(isMarkingNoShowInterviewId)}
              >
                Keep scheduled
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  void handleConfirmMarkNoShow();
                }}
                disabled={Boolean(isMarkingNoShowInterviewId)}
              >
                {isMarkingNoShowInterviewId ? 'Recording no-show...' : 'Record no-show'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(cancelInterview)}
          onOpenChange={(open) => !open && closeCancelDialog()}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#A03A2A]">
                <AlertTriangle className="h-5 w-5" />
                Cancel interview
              </DialogTitle>
              <DialogDescription>
                Add a brief reason before cancelling so the candidate and workflow record stay
                clear.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border border-[#E0C9C1] bg-[#fff8f3] p-3 text-sm text-[#6f2f22]">
                <p className="font-medium">Cancellation changes the active interview workflow.</p>
                <p className="mt-1">
                  The interview will be marked cancelled. A replacement interview can be scheduled
                  only when the corridor next action allows it.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancel-interview-reason">Reason (optional)</Label>
                <Textarea
                  id="cancel-interview-reason"
                  value={cancelReason}
                  onChange={(event) => {
                    setCancelReason(event.target.value);
                    if (getInterviewDialogFeedback('cancel', cancelInterview)) {
                      setInterviewDialogFeedback(null);
                    }
                  }}
                  rows={3}
                  disabled={Boolean(isCancellingInterviewId)}
                  aria-describedby="cancel-interview-reason-help"
                  placeholder="Add context for the candidate and workflow record..."
                />
                <p id="cancel-interview-reason-help" className="text-xs text-muted-foreground">
                  Keep this concise and suitable for conversation history.
                </p>
              </div>

              {renderInterviewDialogFeedback({
                feedback: getInterviewDialogFeedback('cancel', cancelInterview),
                retryLabel: 'Retry cancellation',
                isRetrying: Boolean(isCancellingInterviewId),
                onRetry: () => {
                  void handleConfirmCancelInterview();
                },
              })}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={closeCancelDialog}
                disabled={Boolean(isCancellingInterviewId)}
              >
                Keep interview
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  void handleConfirmCancelInterview();
                }}
                disabled={Boolean(isCancellingInterviewId)}
              >
                {isCancellingInterviewId ? 'Cancelling interview...' : 'Cancel interview'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppSurface>
  );
}
