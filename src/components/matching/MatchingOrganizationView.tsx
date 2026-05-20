'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowRight,
  ListChecks,
  Plus,
  Users,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Briefcase,
  ChevronRight,
  Lock,
  DollarSign,
  MapPin,
  Clock,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { apiFetch } from '@/lib/api/fetch';
import { getOrganizationRecoveryActions } from '@/lib/ui/recovery-actions';
import { CardGridSkeleton } from '@/components/skeletons/CoreLoadingPrimitives';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Assignment {
  id: string;
  orgId: string;
  role: string;
  status: string;
  createdAt: string;
  matchingSummary?: {
    candidateCount: number;
    reviewChangeCount: number;
    lastCandidateAt: string | null;
    lastReviewChangeAt: string | null;
    lastActivityAt: string | null;
  };
}

interface MatchingOrganizationViewProps {
  assignments: Assignment[];
  onCreateNew: () => void;
}

const ASSIGNMENT_STATUS_LABELS: Record<string, string> = {
  active: 'Open',
  assignment_ready: 'Assignment ready',
  closed: 'Closed',
  draft: 'Draft',
  hold: 'On hold',
  pending_review: 'Ready for review',
  review_ready: 'Ready for review',
};

function assignmentStatusLabel(status: string) {
  return ASSIGNMENT_STATUS_LABELS[status] ?? status;
}

function proofEvidenceLabel(value: number | undefined) {
  if (value === undefined) return 'Not available';
  if (value >= 0.85) return 'Strong';
  if (value >= 0.65) return 'Clear';
  if (value >= 0.4) return 'Partial';
  return 'Needs more proof';
}

function proofEvidenceSignalLabel(explanation: any, key: string) {
  return explanation.proofSignals?.[key] ?? proofEvidenceLabel(explanation.subscores?.[key]);
}

export function MatchingOrganizationView({
  assignments,
  onCreateNew,
}: MatchingOrganizationViewProps) {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawSlug = (params as { slug?: string | string[] })?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const queryAssignmentId = searchParams.get('matching') || searchParams.get('assignment') || '';

  const [selectedAssignment, setSelectedAssignment] = useState<string>(
    queryAssignmentId || (assignments[0]?.id ?? '')
  );
  const [viewedAtByAssignment, setViewedAtByAssignment] = useState<Record<string, string>>({});
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSegment, setActiveSegment] = useState<'queue' | 'shortlist'>('queue');
  const [activeMatchId, setActiveMatchId] = useState<string>('');
  const [explanations, setExplanations] = useState<Record<string, any>>({});
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);

  const currentAssignment = assignments.find((a) => a.id === selectedAssignment);

  const lastViewedStorageKey = slug
    ? `proofound:org:${slug}:assignment-matching:last-viewed`
    : null;

  useEffect(() => {
    if (!lastViewedStorageKey || typeof window === 'undefined') {
      return;
    }

    try {
      const stored = window.localStorage.getItem(lastViewedStorageKey);
      const parsed = stored ? JSON.parse(stored) : {};
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        setViewedAtByAssignment(parsed as Record<string, string>);
      }
    } catch {
      setViewedAtByAssignment({});
    }
  }, [lastViewedStorageKey]);

  const markAssignmentViewed = useCallback(
    (assignmentId: string) => {
      if (!assignmentId || !lastViewedStorageKey || typeof window === 'undefined') {
        return;
      }

      const viewedAt = new Date().toISOString();
      setViewedAtByAssignment((current) => {
        const next = { ...current, [assignmentId]: viewedAt };
        try {
          window.localStorage.setItem(lastViewedStorageKey, JSON.stringify(next));
        } catch {
          // lightweight badge, safe to fail
        }
        return next;
      });
    },
    [lastViewedStorageKey]
  );

  useEffect(() => {
    if (!queryAssignmentId) {
      return;
    }

    const assignmentExists = assignments.some((assignment) => assignment.id === queryAssignmentId);
    if (assignmentExists) {
      setSelectedAssignment(queryAssignmentId);
      markAssignmentViewed(queryAssignmentId);
    }
  }, [assignments, markAssignmentViewed, queryAssignmentId]);

  const handleSelectAssignment = (assignmentId: string) => {
    setSelectedAssignment(assignmentId);
    markAssignmentViewed(assignmentId);
    if (slug) {
      router.push(`/app/o/${slug}/assignments?matching=${encodeURIComponent(assignmentId)}`);
    }
  };

  const getAssignmentBadgeLabel = (assignment: Assignment) => {
    const summary = assignment.matchingSummary;
    if (!summary?.lastActivityAt) return null;

    const lastActivityAt = new Date(summary.lastActivityAt).getTime();
    const parsedLastViewedAt = viewedAtByAssignment[assignment.id]
      ? new Date(viewedAtByAssignment[assignment.id]).getTime()
      : 0;
    const lastViewedAt = Number.isFinite(parsedLastViewedAt) ? parsedLastViewedAt : 0;
    const lastReviewChangeAt = summary.lastReviewChangeAt
      ? new Date(summary.lastReviewChangeAt).getTime()
      : 0;

    if (!Number.isFinite(lastActivityAt) || lastActivityAt <= lastViewedAt) {
      return null;
    }

    return Number.isFinite(lastReviewChangeAt) && lastReviewChangeAt > lastViewedAt
      ? 'Review updates'
      : 'New submissions';
  };

  // Fetch matches when the selected assignment changes
  useEffect(() => {
    if (!selectedAssignment) return;

    const fetchMatches = async () => {
      setIsLoading(true);
      try {
        const response = await apiFetch('/api/match/assignment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignmentId: selectedAssignment,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch matches');
        }

        const data = await response.json();
        setMatches(data.items || []);
      } catch {
        toast.error('Failed to load matches');
        setMatches([]);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchMatches();
  }, [selectedAssignment]);

  // Filter matches based on the active tab segment
  const filteredMatches = matches.filter((match: any) => {
    if (activeSegment === 'queue') {
      return match.reviewStage === 'blind_review';
    } else {
      return (
        match.reviewStage === 'shortlisted' ||
        ['request_intro', 'intro_approved', 'request_reveal', 'interview_scheduled'].includes(
          match.corridorState
        )
      );
    }
  });

  // Keep selected candidate in sync with tab change or list changes
  useEffect(() => {
    if (filteredMatches.length > 0) {
      const matchExists = filteredMatches.some((m: any) => m.id === activeMatchId);
      if (!matchExists) {
        setActiveMatchId(filteredMatches[0].id);
      }
    } else {
      setActiveMatchId('');
    }
  }, [activeSegment, filteredMatches, activeMatchId]);

  // Fetch candidate explanation when selected candidate changes
  useEffect(() => {
    if (!activeMatchId || explanations[activeMatchId]) return;

    const fetchExplanation = async () => {
      setIsLoadingExplanation(true);
      try {
        const response = await fetch(`/api/match/explain/${activeMatchId}`);
        if (response.ok) {
          const data = await response.json();
          setExplanations((prev) => ({ ...prev, [activeMatchId]: data }));
        }
      } catch (error) {
        console.error('Failed to fetch match explanation:', error);
      } finally {
        setIsLoadingExplanation(false);
      }
    };

    void fetchExplanation();
  }, [activeMatchId, explanations]);

  const handleReviewAction = async (
    matchId: string,
    action: 'shortlist' | 'pass' | 'request_intro'
  ) => {
    if (!matchId || !currentAssignment?.orgId) {
      toast.error('Match context not found');
      return;
    }

    // Determine the next match to select for auto-advance UX
    const currentIndex = filteredMatches.findIndex((m: any) => m.id === matchId);
    let nextMatchId = '';
    if (currentIndex !== -1 && filteredMatches.length > 1) {
      if (currentIndex < filteredMatches.length - 1) {
        nextMatchId = filteredMatches[currentIndex + 1].id;
      } else {
        nextMatchId = filteredMatches[currentIndex - 1].id;
      }
    }

    try {
      const response = await apiFetch(
        `/api/org/${currentAssignment.orgId}/matches/${matchId}/review`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
          }),
        }
      );

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(
          typeof errorPayload?.error === 'string'
            ? errorPayload.error
            : 'Failed to update review state'
        );
      }

      const data = await response.json();

      // Auto-navigate to message thread if introduction opened immediately
      if (action === 'request_intro' && data.conversationId && data.introApproved) {
        toast.success('Mutual interest approved. Opening communications corridor...');
        setTimeout(() => {
          router.push(
            `/app/o/${slug}/communications?section=messages&conversation=${data.conversationId}`
          );
        }, 800);
        return;
      }

      if (action === 'pass') {
        setMatches((current) => current.filter((match: any) => match.id !== matchId));
        toast.success('Submission passed for now.');
      } else {
        // Update local state for review-stage and request_intro updates
        setMatches((current) =>
          current.map((match: any) =>
            match.id === matchId
              ? {
                  ...match,
                  reviewStage: data.reviewStage,
                  revealScope: data.revealScope,
                  progressiveRevealStage: data.progressiveRevealStage,
                  corridorState: data.corridorState,
                  visibleIdentityFields: data.visibleIdentityFields,
                  fairness: data.fairness ?? match.fairness,
                  why: data.why ?? match.why,
                  reviewCard: data.reviewCard ?? match.reviewCard,
                }
              : match
          )
        );
        toast.success(
          action === 'request_intro' ? 'Intro request recorded.' : 'Proof review stage updated.'
        );
      }

      // Apply auto-advance select
      if (nextMatchId) {
        setActiveMatchId(nextMatchId);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update review state');
    }
  };

  const recoveryActions = getOrganizationRecoveryActions(
    'assignment-no-matches',
    slug || null,
    selectedAssignment || undefined
  );

  const activeMatch = filteredMatches.find((m: any) => m.id === activeMatchId);
  const explanation = activeMatchId ? explanations[activeMatchId] : null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 md:px-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-proofound-stone/50 pb-5">
        <div>
          <h2 className="font-display text-2xl font-semibold text-proofound-charcoal dark:text-foreground md:text-3xl">
            Assignment review queue
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review proof-backed submissions, keep workflow stages clear, and request intros when
            ready.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onCreateNew}
            className="bg-proofound-forest hover:bg-proofound-forest/90 text-white rounded-full px-5"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Assignment
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:h-[calc(100vh-14rem)] lg:min-h-[600px] lg:flex-row lg:overflow-hidden">
        {/* LEFT COLUMN: Assignment List (sidebar) */}
        <div className="flex w-full shrink-0 flex-col gap-3 border-b border-proofound-stone/60 pb-4 lg:w-[280px] lg:overflow-y-auto lg:border-b-0 lg:border-r lg:pb-0 lg:pr-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-1">
            Active Assignments
          </div>
          <div className="space-y-2">
            {assignments.map((assignment) => {
              const isSelected = selectedAssignment === assignment.id;
              const updateBadge = getAssignmentBadgeLabel(assignment);
              const count = assignment.matchingSummary?.candidateCount ?? 0;

              return (
                <button
                  key={assignment.id}
                  onClick={() => handleSelectAssignment(assignment.id)}
                  className={`w-full p-4 rounded-xl text-left border transition-all ${
                    isSelected
                      ? 'border-proofound-forest bg-proofound-parchment/40 ring-1 ring-proofound-forest/50 font-medium'
                      : 'border-proofound-stone/60 bg-white/70 hover:border-proofound-forest/50 hover:bg-white'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-1.5 justify-between">
                    <span className="font-semibold text-sm text-proofound-charcoal truncate block max-w-[180px]">
                      {assignment.role}
                    </span>
                    {updateBadge && (
                      <Badge className="border-proofound-forest/20 bg-[#eef4eb] text-proofound-forest text-[9px] px-1 py-0">
                        {updateBadge}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{assignmentStatusLabel(assignment.status)}</span>
                    <span>
                      {count} match{count !== 1 ? 'es' : ''}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT AREA: Selected Assignment Workspace */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Workspace Subheader / Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white/75 backdrop-blur-sm border border-proofound-stone/60 rounded-xl p-4 mb-4 shrink-0">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-proofound-forest">
                Focused Review
              </span>
              <h2 className="text-lg font-bold text-proofound-charcoal truncate mt-0.5">
                {currentAssignment ? currentAssignment.role : 'No assignment selected'}
              </h2>
            </div>

            {currentAssignment && (
              <div className="flex items-center gap-3 mt-3 sm:mt-0">
                <div className="text-xs text-muted-foreground mr-1 hidden md:block">
                  Launched {new Date(currentAssignment.createdAt).toLocaleDateString()}
                </div>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-proofound-stone/85 text-proofound-charcoal bg-white rounded-full"
                >
                  <Link href={`/app/o/${slug}/assignments/${currentAssignment.id}/review`}>
                    Edit assignment context
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex-1 flex flex-col justify-center items-center py-12">
              <p className="text-sm text-muted-foreground mb-4">
                Loading proof-aligned submissions...
              </p>
              <CardGridSkeleton
                count={3}
                columnsClassName="grid grid-cols-1 md:grid-cols-2 gap-4 w-full"
                tileClassName="min-h-[180px]"
              />
            </div>
          ) : !currentAssignment ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-8 bg-white/50 border border-dashed border-proofound-stone/60 rounded-xl">
              <Users className="h-10 w-10 text-muted-foreground/60 mb-3" />
              <h3 className="text-base font-semibold text-proofound-charcoal">
                Select an assignment corridor
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Choose one assignment in the left sidebar to start reviewing matched submissions.
              </p>
            </div>
          ) : matches.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-8 bg-white/70 border border-proofound-stone/60 rounded-xl">
              <Sparkles className="h-8 w-8 text-proofound-forest mb-3" />
              <h3 className="text-base font-semibold text-proofound-charcoal">
                No proof submissions yet
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                We are actively processing submissions against your assignment's proof requirements.
                Keep this corridor open.
              </p>
              {recoveryActions[0] && (
                <Button
                  onClick={() => router.push(recoveryActions[0].actionUrl)}
                  className="mt-4 bg-proofound-forest hover:bg-proofound-forest/90 text-white rounded-full"
                >
                  {recoveryActions[0].title}
                </Button>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex border-b border-proofound-stone/50 mb-4 shrink-0">
                <button
                  onClick={() => setActiveSegment('queue')}
                  className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
                    activeSegment === 'queue'
                      ? 'border-proofound-forest text-proofound-forest'
                      : 'border-transparent text-muted-foreground hover:text-proofound-charcoal'
                  }`}
                >
                  Review queue ({matches.filter((m) => m.reviewStage === 'blind_review').length})
                </button>
                <button
                  onClick={() => setActiveSegment('shortlist')}
                  className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
                    activeSegment === 'shortlist'
                      ? 'border-proofound-forest text-proofound-forest'
                      : 'border-transparent text-muted-foreground hover:text-proofound-charcoal'
                  }`}
                >
                  Shortlist and intros (
                  {
                    matches.filter(
                      (m) =>
                        m.reviewStage === 'shortlisted' ||
                        [
                          'request_intro',
                          'intro_approved',
                          'request_reveal',
                          'interview_scheduled',
                        ].includes(m.corridorState)
                    ).length
                  }
                  )
                </button>
              </div>

              {/* Two-Column Candidate Review Console */}
              {filteredMatches.length === 0 ? (
                <div className="flex-1 flex flex-col justify-center items-center text-center p-8 bg-white/40 border border-dashed border-proofound-stone/60 rounded-xl">
                  <ListChecks className="h-8 w-8 text-muted-foreground/60 mb-2" />
                  <h4 className="text-sm font-semibold text-proofound-charcoal">
                    {activeSegment === 'queue'
                      ? 'Review queue is empty'
                      : 'No submissions shortlisted yet'}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    {activeSegment === 'queue'
                      ? 'All matching submissions for this assignment have been reviewed.'
                      : 'Shortlist qualified submissions to request introductions and reveal identities.'}
                  </p>
                </div>
              ) : (
                <div className="grid flex-1 grid-cols-1 gap-6 lg:min-h-0 lg:grid-cols-5 lg:overflow-hidden">
                  <div className="flex flex-col gap-3 lg:col-span-2 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
                    {filteredMatches.map((match: any, index: number) => {
                      const isSelected = match.id === activeMatchId;
                      const skillsList = match.profile?.skills
                        ? Object.keys(match.profile.skills).slice(0, 3)
                        : [];

                      return (
                        <button
                          key={match.id}
                          type="button"
                          onClick={() => setActiveMatchId(match.id)}
                          className={`w-full p-4 rounded-xl border text-left transition-all space-y-2 block ${
                            isSelected
                              ? 'border-proofound-forest bg-proofound-parchment/35 ring-1 ring-proofound-forest/50'
                              : 'border-proofound-stone/60 bg-white/70 hover:border-proofound-forest/50 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-proofound-charcoal">
                              {match.reviewCard?.candidateLabel || `Candidate #${index + 1}`}
                            </span>

                            {match.corridorState === 'intro_approved' ? (
                              <Badge className="bg-[#eef4eb] text-proofound-forest text-[9px] border-proofound-forest/20">
                                Intro open
                              </Badge>
                            ) : match.corridorState === 'request_intro' ? (
                              <Badge className="bg-amber-50 text-amber-600 border-amber-200 text-[9px]">
                                Requested
                              </Badge>
                            ) : null}
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {match.reviewCard?.fitSummary?.headline ||
                              'Clear proof-backed alignment.'}
                          </p>

                          {skillsList.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {skillsList.map((skill: string) => (
                                <Badge
                                  key={skill}
                                  variant="secondary"
                                  className="text-[9px] bg-proofound-stone/30 text-proofound-charcoal px-1.5 py-0 font-medium"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-col space-y-6 rounded-xl border border-proofound-stone/60 bg-white/80 p-5 lg:col-span-3 lg:min-h-0 lg:overflow-y-auto">
                    {!activeMatch ? (
                      <div className="flex-1 flex flex-col justify-center items-center text-center py-12">
                        <p className="text-sm text-muted-foreground">
                          Select a submission to review details.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-proofound-stone/40 pb-4">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                              Proof review
                            </span>
                            <h3 className="text-xl font-bold text-proofound-charcoal mt-0.5">
                              {activeMatch.reviewCard?.candidateLabel || 'Anonymous submission'}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-[10px] uppercase font-mono">
                                {activeMatch.revealScope === 'full_identity'
                                  ? 'Full identity revealed'
                                  : 'Blind by default'}
                              </Badge>
                              {activeMatch.reviewCard?.fitBand && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] font-semibold bg-[#eef4eb] text-proofound-forest"
                                >
                                  {activeMatch.reviewCard.fitBand}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 w-full sm:w-auto">
                            {activeSegment === 'queue' ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => handleReviewAction(activeMatch.id, 'shortlist')}
                                  className="bg-proofound-forest hover:bg-proofound-forest/90 text-white rounded-full text-xs font-semibold px-4 py-2 flex-1 sm:flex-initial"
                                >
                                  Shortlist
                                </Button>
                                <Button
                                  onClick={() => handleReviewAction(activeMatch.id, 'pass')}
                                  variant="outline"
                                  className="border-proofound-stone text-proofound-charcoal bg-white rounded-full text-xs font-semibold px-4 py-2 flex-1 sm:flex-initial"
                                >
                                  Decline
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {activeMatch.corridorState === 'intro_approved' &&
                                activeMatch.conversationId ? (
                                  <Button
                                    asChild
                                    className="bg-proofound-forest hover:bg-proofound-forest/90 text-white rounded-full text-xs font-semibold px-4 py-2 w-full"
                                  >
                                    <Link
                                      href={`/app/o/${slug}/communications?section=messages&conversation=${activeMatch.conversationId}`}
                                    >
                                      <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                                      Send message
                                    </Link>
                                  </Button>
                                ) : activeMatch.corridorState === 'request_intro' ? (
                                  <div className="text-center">
                                    <Badge className="bg-amber-50 text-amber-600 border-amber-200 w-full justify-center py-1">
                                      Intro requested
                                    </Badge>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                      Waiting for reviewer response.
                                    </p>
                                  </div>
                                ) : (
                                  <Button
                                    onClick={() =>
                                      handleReviewAction(activeMatch.id, 'request_intro')
                                    }
                                    className="bg-proofound-forest hover:bg-proofound-forest/90 text-white rounded-full text-xs font-semibold px-4 py-2 w-full"
                                  >
                                    <Lock className="w-3.5 h-3.5 mr-1.5" />
                                    Request intro
                                  </Button>
                                )}
                                <Button
                                  onClick={() => handleReviewAction(activeMatch.id, 'pass')}
                                  variant="ghost"
                                  className="text-xs font-medium text-muted-foreground hover:bg-proofound-stone/20 rounded-full w-full py-1.5"
                                >
                                  Remove from shortlist
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Suitability summary */}
                        {activeMatch.reviewCard?.fitSummary && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Fit Suitability
                            </h4>
                            <p className="text-sm font-semibold text-proofound-charcoal">
                              {activeMatch.reviewCard.fitSummary.headline}
                            </p>
                            {activeMatch.reviewCard.fitSummary.bullets.length > 0 && (
                              <ul className="space-y-1.5 text-xs text-proofound-charcoal pl-4 list-disc">
                                {activeMatch.reviewCard.fitSummary.bullets.map(
                                  (bullet: string, idx: number) => (
                                    <li key={idx} className="leading-relaxed">
                                      {bullet}
                                    </li>
                                  )
                                )}
                              </ul>
                            )}
                            {activeMatch.reviewCard.fitSummary.reasonCodes?.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {activeMatch.reviewCard.fitSummary.reasonCodes.map(
                                  (code: string) => (
                                    <Badge
                                      key={code}
                                      variant="secondary"
                                      className="font-mono text-[9px] bg-proofound-stone/20 text-muted-foreground px-1.5 py-0 font-medium"
                                    >
                                      {code}
                                    </Badge>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Strongest Relevant Proof */}
                        {activeMatch.reviewCard?.strongestProof && (
                          <div className="bg-proofound-parchment/20 border border-proofound-stone/50 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Strongest Proof Package
                              </h4>
                              {activeMatch.reviewCard.strongestProof.freshnessLabel && (
                                <span className="text-[10px] text-muted-foreground">
                                  {activeMatch.reviewCard.strongestProof.freshnessLabel}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-proofound-charcoal">
                              {activeMatch.reviewCard.strongestProof.summary ||
                                'Proof-backed evidence available.'}
                            </p>
                            {activeMatch.reviewCard.strongestProof.outcome && (
                              <p className="text-xs text-muted-foreground">
                                <strong className="font-semibold text-proofound-charcoal">
                                  Outcome:
                                </strong>{' '}
                                {activeMatch.reviewCard.strongestProof.outcome}
                              </p>
                            )}
                            {activeMatch.reviewCard.strongestProof.ownership && (
                              <p className="text-xs text-muted-foreground">
                                <strong className="font-semibold text-proofound-charcoal">
                                  Role Contribution:
                                </strong>{' '}
                                {activeMatch.reviewCard.strongestProof.ownership}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Privacy & Bounded Trust Warning */}
                        <div className="flex items-start gap-2 bg-[#fdfcfa] border border-proofound-stone/45 rounded-xl p-3 text-[11px] text-muted-foreground leading-relaxed">
                          <ShieldCheck className="h-4 w-4 text-proofound-forest shrink-0 mt-0.5" />
                          <span>
                            Identity is protected. Complete proof details, work samples, and
                            verification outcomes are verified by Proofound. Full details remain
                            locked until mutually accepted.
                          </span>
                        </div>

                        {/* Inline Inspectability Tabs (Deep Details) */}
                        <div className="border-t border-proofound-stone/40 pt-4 space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Proof Alignment Details
                          </h4>

                          {isLoadingExplanation ? (
                            <div className="space-y-2 py-4">
                              <div className="h-3 w-1/3 bg-gray-200 rounded animate-pulse" />
                              <div className="h-10 bg-gray-150 rounded animate-pulse" />
                              <div className="h-10 bg-gray-150 rounded animate-pulse" />
                            </div>
                          ) : !explanation ? (
                            <div className="text-center py-4 text-xs text-muted-foreground">
                              Clicking tabs will fetch the full evidence trace.
                            </div>
                          ) : (
                            <Tabs defaultValue="skills" className="w-full">
                              <TabsList className="grid w-full grid-cols-3 bg-proofound-stone/20 p-0.5 rounded-lg">
                                <TabsTrigger value="skills" className="text-xs py-1.5">
                                  Skills
                                </TabsTrigger>
                                <TabsTrigger value="constraints" className="text-xs py-1.5">
                                  Constraints
                                </TabsTrigger>
                                <TabsTrigger value="evidence" className="text-xs py-1.5">
                                  Evidence
                                </TabsTrigger>
                              </TabsList>

                              <TabsContent value="skills" className="space-y-3 pt-3">
                                {explanation.skillsMatch ? (
                                  <div className="space-y-3">
                                    {explanation.skillsMatch.required?.length > 0 && (
                                      <div>
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5">
                                          Required Skills
                                        </p>
                                        <div className="space-y-1.5">
                                          {explanation.skillsMatch.required.map(
                                            (skill: any, idx: number) => (
                                              <div
                                                key={idx}
                                                className="flex items-center justify-between p-2 rounded-lg bg-white border border-proofound-stone/50 text-xs"
                                              >
                                                <div>
                                                  <p className="font-semibold text-proofound-charcoal">
                                                    {skill.skillName}
                                                  </p>
                                                  <p className="text-[10px] text-muted-foreground">
                                                    Required: Lvl {skill.requiredLevel} • Candidate
                                                    has: Lvl {skill.yourLevel}
                                                  </p>
                                                </div>
                                                {skill.met ? (
                                                  <CheckCircle2 className="w-4 h-4 text-proofound-forest flex-shrink-0" />
                                                ) : (
                                                  <AlertCircle className="w-4 h-4 text-proofound-terracotta flex-shrink-0" />
                                                )}
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {explanation.skillsMatch.nice?.length > 0 && (
                                      <div>
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5">
                                          Desired Skills
                                        </p>
                                        <div className="space-y-1.5">
                                          {explanation.skillsMatch.nice.map(
                                            (skill: any, idx: number) => (
                                              <div
                                                key={idx}
                                                className="flex items-center justify-between p-2 rounded-lg bg-white border border-proofound-stone/50 text-xs"
                                              >
                                                <span className="font-semibold text-proofound-charcoal">
                                                  {skill.skillName}
                                                </span>
                                                <Badge
                                                  variant="secondary"
                                                  className="text-[10px] font-normal"
                                                >
                                                  Candidate Lvl {skill.yourLevel}
                                                </Badge>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground text-center py-2">
                                    No skills data available
                                  </p>
                                )}
                              </TabsContent>

                              <TabsContent value="constraints" className="space-y-2 pt-3">
                                {explanation.constraints ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {Object.entries(explanation.constraints).map(
                                      ([key, value]: [string, any]) => (
                                        <div
                                          key={key}
                                          className="flex items-start justify-between p-2.5 rounded-lg bg-white border border-proofound-stone/50 text-xs"
                                        >
                                          <div className="min-w-0 pr-2">
                                            <p className="font-semibold text-proofound-charcoal capitalize">
                                              {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </p>
                                            {value.details && (
                                              <p className="text-[10px] text-muted-foreground truncate">
                                                {value.details}
                                              </p>
                                            )}
                                          </div>
                                          {value.match ? (
                                            <CheckCircle2 className="w-4 h-4 text-proofound-forest flex-shrink-0" />
                                          ) : (
                                            <AlertCircle className="w-4 h-4 text-proofound-terracotta flex-shrink-0" />
                                          )}
                                        </div>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground text-center py-2">
                                    No constraints data available
                                  </p>
                                )}
                              </TabsContent>

                              <TabsContent value="evidence" className="space-y-2.5 pt-3">
                                <div className="p-3 bg-[#fdfcfa] border border-proofound-stone/50 rounded-xl space-y-2 text-xs">
                                  <p className="font-semibold text-proofound-charcoal">
                                    Evidence Review
                                  </p>

                                  <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-[11px]">
                                      <span className="text-muted-foreground">
                                        Skills evidence:
                                      </span>
                                      <span className="font-semibold text-proofound-charcoal">
                                        {proofEvidenceSignalLabel(explanation, 'skills')}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px]">
                                      <span className="text-muted-foreground">Constraint fit:</span>
                                      <span className="font-semibold text-proofound-charcoal">
                                        {proofEvidenceSignalLabel(explanation, 'constraints')}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px]">
                                      <span className="text-muted-foreground">
                                        Proof freshness:
                                      </span>
                                      <span className="font-semibold text-proofound-charcoal">
                                        {proofEvidenceSignalLabel(explanation, 'recency')}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px]">
                                      <span className="text-muted-foreground">
                                        Verification support:
                                      </span>
                                      <span className="font-semibold text-proofound-charcoal">
                                        {proofEvidenceSignalLabel(explanation, 'evidence')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </TabsContent>
                            </Tabs>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
