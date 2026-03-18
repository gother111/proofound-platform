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

  const toCalendarPayload = (interview: Interview): InterviewCalendarPayload => ({
    interviewId: interview.interview?.id ?? interview.id,
    scheduledAt: interview.interview?.scheduledAt ?? new Date().toISOString(),
    durationMinutes: interview.interview?.duration ?? 30,
    meetingUrl: interview.interview?.meetingUrl ?? 'pending',
    platform: interview.interview?.platform ?? 'manual',
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
      const response = await fetch('/api/interviews/edit', {
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
      const response = await fetch('/api/interviews/cancel', {
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
        className="rounded-full px-2 py-1 text-xs font-medium"
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
    const verification =
      interview.engagementVerification ?? interview.corridor.engagementVerification;
    if (!verification) {
      return null;
    }

    const isVerified = verification.status === 'verified';

    return (
      <span
        className="rounded-full px-2 py-1 text-xs font-medium"
        style={{
          backgroundColor: isVerified ? '#E8F5E9' : '#FEF3C7',
          color: isVerified ? '#2E7D32' : '#92400E',
        }}
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
          <PageIntroSkeleton showAction={false} />
          <CardListSkeleton count={3} />
        </div>
      </AppSurface>
    );
  }

  return (
    <AppSurface>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-semibold" style={{ color: '#2D3330' }}>
            Interviews
          </h1>
          <p className="text-sm" style={{ color: '#6B6760' }}>
            Track the full hiring corridor, from shortlist through decision and engagement
            verification
          </p>
        </div>

        {interviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-4 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-japandi-bg">
              <Calendar className="h-8 w-8" style={{ color: '#1C4D3A' }} />
            </div>
            <h2 className="mb-2 text-xl font-medium" style={{ color: '#2D3330' }}>
              No Active Hiring Corridor Yet
            </h2>
            <p className="mb-6 max-w-md text-sm text-muted-foreground">
              Once you shortlist a candidate, this page will show each corridor stage, the privacy
              status, and the next legal action.
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
                  className="rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:border-gray-300"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {interview.candidateDisplayName ? (
                            <>
                              <User className="h-4 w-4" style={{ color: '#1C4D3A' }} />
                              <p className="text-base font-semibold" style={{ color: '#2D3330' }}>
                                {interview.candidateDisplayName}
                              </p>
                            </>
                          ) : (
                            <p className="text-base font-semibold" style={{ color: '#2D3330' }}>
                              {interview.corridor.subjectLabel}
                            </p>
                          )}
                        </div>
                        {interview.assignmentTitle ? (
                          <p className="text-sm" style={{ color: '#6B6760' }}>
                            {interview.assignmentTitle}
                          </p>
                        ) : null}
                      </div>

                      <HiringCorridorTimeline corridor={interview.corridor} />

                      {interview.interview?.scheduledAt ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" style={{ color: '#1C4D3A' }} />
                              <span className="font-medium" style={{ color: '#2D3330' }}>
                                {formatDate(interview.interview.scheduledAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" style={{ color: '#6B6760' }} />
                              <span className="text-sm" style={{ color: '#6B6760' }}>
                                {formatTime(interview.interview.scheduledAt)} (
                                {interview.interview.duration} min)
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4">
                            {interview.interview.platform ? (
                              <div className="flex items-center gap-2">
                                <Video className="h-4 w-4" style={{ color: '#6B6760' }} />
                                <span className="text-sm capitalize" style={{ color: '#6B6760' }}>
                                  {interview.interview.platform}
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
                                  className="flex items-center gap-1 text-sm hover:underline"
                                  style={{ color: '#1C4D3A' }}
                                >
                                  Join Meeting
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                                <a
                                  href={buildGoogleCalendarUrl(toCalendarPayload(interview))}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-sm hover:underline"
                                  style={{ color: '#1C4D3A' }}
                                >
                                  Add to Google Calendar
                                  <CalendarPlus className="h-3 w-3" />
                                </a>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
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
                            className="rounded-full px-2 py-1 text-xs font-medium"
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
                            {interview.interview.status}
                          </span>
                        ) : null}
                        {getDecisionBadge(interview.decisionState)}
                        {getEngagementBadge(interview)}
                        {(interview.interview?.rescheduleCount ?? 0) > 0 ? (
                          <span
                            className="rounded-full px-2 py-1 text-xs font-medium"
                            style={{
                              backgroundColor: '#FEF3C7',
                              color: '#92400E',
                            }}
                          >
                            Rescheduled {interview.interview?.rescheduleCount} time
                            {(interview.interview?.rescheduleCount ?? 0) === 1 ? '' : 's'}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex min-w-[210px] flex-col gap-2">
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
                            className="flex items-center gap-2"
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
                            className="flex items-center gap-2 border-[#E0C9C1] text-[#A03A2A]"
                          >
                            <XCircle className="h-4 w-4" />
                            {isCancellingInterviewId === interview.interview?.id
                              ? 'Cancelling...'
                              : 'Cancel Interview'}
                          </Button>
                        </>
                      ) : null}

                      {canRecordDecision(interview) && interview.interview?.id ? (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleOpenDecisionDialog(interview)}
                          className="flex items-center gap-2"
                          style={{ backgroundColor: '#1C4D3A' }}
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
                            disabled={isConfirmingEngagementId === verification.id}
                            className="flex items-center gap-2"
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
                  className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
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
                  className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
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
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
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
