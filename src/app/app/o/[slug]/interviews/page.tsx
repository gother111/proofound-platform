/**
 * Interviews Page - Organization
 *
 * View and manage scheduled interviews for your organization.
 * Shows upcoming interviews with candidates.
 */

'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Video, ExternalLink, User, FileCheck } from 'lucide-react';
import { ScheduleInterviewButton } from '@/components/interviews/ScheduleInterviewButton';
import { DecisionDialog } from '@/components/decisions/DecisionDialog';
import { Button } from '@/components/ui/button';
import { InterviewFeedbackSection } from '@/components/interviews/InterviewFeedbackSection';

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

    // Add timeout to prevent infinite loading
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch('/api/interviews/schedule', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setInterviews(data.interviews || []);
      } else {
        console.error('Failed to load interviews:', response.status);
        setInterviews([]); // Set empty array on error
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Interviews request timed out');
      } else {
        console.error('Failed to load interviews:', error);
      }
      setInterviews([]); // Set empty array on error
    } finally {
      clearTimeout(timeoutId);
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

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold mb-6" style={{ color: '#2D3330' }}>
            Interviews
          </h1>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
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
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4" style={{ color: '#6B6760' }} />
                        <span className="text-sm capitalize" style={{ color: '#6B6760' }}>
                          {interview.platform}
                        </span>
                      </div>
                      {interview.meetingUrl !== 'pending' && (
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

                {interview.status === 'completed' && (
                  <InterviewFeedbackSection interviewId={interview.id} viewerRole="org" />
                )}
              </div>
            ))}
          </div>
        )}

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
    </div>
  );
}
