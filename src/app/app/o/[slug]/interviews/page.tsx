/**
 * Interviews Page - Organization
 *
 * View and manage scheduled interviews for your organization.
 * Shows upcoming interviews with candidates.
 */

'use client';

import { useState, useEffect } from 'react';
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
import { DecisionDialog } from '@/components/decisions/DecisionDialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  buildGoogleCalendarUrl,
  downloadInterviewIcs,
  type InterviewCalendarPayload,
} from '@/lib/interviews/calendar';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { getInterviews as getInterviewsAction } from '@/app/actions/interviews';
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
  candidateName?: string;
  assignmentTitle?: string;
  matchAgreedAt?: string;
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

  useEffect(() => {
    loadInterviews();
  }, []);

  const handleOpenDecisionDialog = (interview: Interview) => {
    setSelectedInterview(interview);
    setDecisionDialogOpen(true);
  };

  const handleCloseDecisionDialog = () => {
    setDecisionDialogOpen(false);
    setSelectedInterview(null);
  };

  const handleDecisionMade = () => {
    loadInterviews(); // Refresh interviews after decision
  };

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
    title: interview.candidateName
      ? `Interview with ${interview.candidateName}`
      : 'Proofound interview',
  });

  const openEditDialog = (interview: Interview) => {
    const scheduled = new Date(interview.scheduledAt);
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
    if (!editingInterview) return;
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
          interviewId: editingInterview.id,
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
    if (!confirm('Are you sure you want to cancel this interview?')) {
      return;
    }

    const reasonInput = window.prompt('Optional reason for cancellation (shown in conversation):');
    const reason = typeof reasonInput === 'string' ? reasonInput.trim() : '';

    setIsCancellingInterviewId(interview.id);
    try {
      const response = await fetch('/api/interviews/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: interview.id,
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

  if (isLoading) {
    return (
      <AppSurface>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold mb-6" style={{ color: '#2D3330' }}>
            Interviews
          </h1>
          <p className="text-gray-600">Loading...</p>
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
            Manage interviews with shortlisted candidates
          </p>
        </div>

        {/* Interviews List */}
        {interviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-lg font-medium mb-2" style={{ color: '#2D3330' }}>
              No Interviews Scheduled
            </h2>
            <p className="text-sm mb-4" style={{ color: '#6B6760' }}>
              Once you shortlist candidates from your matches, you can schedule interviews.
            </p>
            <p className="text-xs" style={{ color: '#6B6760' }}>
              Interviews are 30 minutes and must be scheduled within 7 days of match acceptance.
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
                    {/* Candidate Info */}
                    {interview.candidateName && (
                      <div className="flex items-center gap-2 mb-3">
                        <User className="w-4 h-4" style={{ color: '#1C4D3A' }} />
                        <span className="font-medium" style={{ color: '#2D3330' }}>
                          {interview.candidateName}
                        </span>
                        {interview.assignmentTitle && (
                          <span className="text-sm" style={{ color: '#6B6760' }}>
                            • {interview.assignmentTitle}
                          </span>
                        )}
                      </div>
                    )}

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
                      new Date(interview.scheduledAt) > new Date() && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(interview)}
                            className="flex items-center gap-2"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit Interview
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelInterview(interview)}
                            disabled={isCancellingInterviewId === interview.id}
                            className="flex items-center gap-2 text-[#A03A2A] border-[#E0C9C1]"
                          >
                            <XCircle className="w-4 h-4" />
                            {isCancellingInterviewId === interview.id
                              ? 'Cancelling...'
                              : 'Cancel Interview'}
                          </Button>
                        </>
                      )}
                    {/* Decision button for completed interviews or past scheduled interviews */}
                    {(interview.status === 'completed' ||
                      (interview.status === 'scheduled' &&
                        new Date(interview.scheduledAt) < new Date())) && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleOpenDecisionDialog(interview)}
                        className="flex items-center gap-2"
                        style={{ backgroundColor: '#1C4D3A' }}
                      >
                        <FileCheck className="w-4 h-4" />
                        Record Decision
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
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

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#2D3330]" htmlFor="edit-interview-date">
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
                <label className="text-sm font-medium text-[#2D3330]" htmlFor="edit-interview-time">
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
                  className="text-sm font-medium text-[#2D3330]"
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

        {/* Decision Dialog */}
        {selectedInterview && (
          <DecisionDialog
            isOpen={decisionDialogOpen}
            onClose={handleCloseDecisionDialog}
            interviewId={selectedInterview.id}
            candidateName={selectedInterview.candidateName || 'Candidate'}
            role={selectedInterview.assignmentTitle || 'Assignment'}
            onDecisionMade={handleDecisionMade}
          />
        )}
      </div>
    </AppSurface>
  );
}
