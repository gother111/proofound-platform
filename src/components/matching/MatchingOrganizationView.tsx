'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowRight,
  AlertTriangle,
  ListChecks,
  Plus,
  RefreshCcw,
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
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { reasonCodeDisplayLabel } from '@/lib/matching/reason-codes';
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

function proofEvidenceSignalLabel(explanation: any, key: string) {
  return explanation.proofSignals?.[key] ?? 'Not available';
}

const DISCOVERY_STATUS_LABELS: Record<string, string> = {
  possible_discovery_match: 'Possible discovery',
  review_ready_match: 'Review ready',
  intro_ready_match: 'Intro ready',
};

const FIT_BAND_LABELS: Record<string, string> = {
  strong_evidence_overlap: 'Strong evidence overlap',
  relevant_partial: 'Relevant partial',
  adjacent_exploratory: 'Adjacent exploratory',
  needs_more_proof: 'Needs more proof',
  constraint_or_trust_hold: 'Constraint or trust hold',
};

const INTRO_GATE_LABELS: Record<string, string> = {
  intro_ready: 'Intro ready',
  intro_hold_missing_trust_anchor: 'Trust anchor needed',
  intro_hold_missing_fresh_relevant_proof: 'Fresh proof needed',
  intro_hold_constraint_mismatch: 'Constraint hold',
  intro_hold_privacy_or_policy_review: 'Privacy or policy hold',
  intro_hold_not_match_visible: 'Discovery only',
};

const SHORTLIST_CORRIDOR_STATES = [
  'request_intro',
  'intro_approved',
  'request_reveal',
  'interview_scheduled',
];

type ReviewAction = 'shortlist' | 'pass' | 'request_intro';

type ReviewActionState = {
  matchId: string;
  action: ReviewAction;
  label: string;
};

type ReviewActionError = ReviewActionState & {
  message: string;
};

const REVIEW_ACTION_FAILED_MESSAGE =
  'No shortlist, decline, or intro request was changed. Retry this action before moving to the next submission.';

const REVIEW_ACTION_LABELS: Record<ReviewAction, string> = {
  shortlist: 'Shortlist',
  pass: 'Decline',
  request_intro: 'Request intro',
};

const REVIEW_ACTION_SEGMENT_LABELS: Record<
  'queue' | 'shortlist',
  Partial<Record<ReviewAction, string>>
> = {
  queue: {
    pass: 'Decline',
  },
  shortlist: {
    pass: 'Remove from shortlist',
  },
};

function reviewActionLabel(action: ReviewAction, segment: 'queue' | 'shortlist') {
  return REVIEW_ACTION_SEGMENT_LABELS[segment][action] ?? REVIEW_ACTION_LABELS[action];
}

function readableMatchLabel(value?: string | null, labels: Record<string, string> = {}) {
  if (!value) return null;
  return labels[value] ?? value.replace(/_/g, ' ');
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<'queue' | 'shortlist'>('queue');
  const [activeMatchId, setActiveMatchId] = useState<string>('');
  const [explanations, setExplanations] = useState<Record<string, any>>({});
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [reviewActionPending, setReviewActionPending] = useState<ReviewActionState | null>(null);
  const [reviewActionError, setReviewActionError] = useState<ReviewActionError | null>(null);
  const reviewDetailRef = useRef<HTMLDivElement | null>(null);

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

  const scrollReviewDetailIntoViewOnMobile = useCallback(() => {
    if (typeof window === 'undefined' || !window.matchMedia('(max-width: 1023px)').matches) {
      return;
    }

    window.requestAnimationFrame(() => {
      const reviewDetail = reviewDetailRef.current;

      if (!reviewDetail) {
        return;
      }

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      reviewDetail.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
      reviewDetail.focus({ preventScroll: true });
    });
  }, []);

  const handleSelectMatch = useCallback(
    (matchId: string) => {
      setActiveMatchId(matchId);
      scrollReviewDetailIntoViewOnMobile();
    },
    [scrollReviewDetailIntoViewOnMobile]
  );

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

  const fetchMatches = useCallback(async () => {
    if (!selectedAssignment) return;

    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await apiFetch('/api/match/assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: selectedAssignment,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(
          typeof errorPayload?.error === 'string' ? errorPayload.error : 'Failed to fetch matches'
        );
      }

      const data = await response.json();
      setMatches(data.items || []);
    } catch (error) {
      dispatchClientErrorDiagnostic('matching.organization_view.matches_load_failed', error);
      setLoadError(
        'Your review queue is still safe, and no shortlist, decline, or intro request was changed.'
      );
      toast.error('Proof submissions could not load', {
        description: 'Retry the review queue without leaving this assignment.',
      });
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAssignment]);

  // Fetch matches when the selected assignment changes
  useEffect(() => {
    void fetchMatches();
  }, [fetchMatches]);

  // Filter matches based on the active tab segment
  const reviewQueueMatches = useMemo(
    () => matches.filter((match: any) => match.reviewStage === 'blind_review'),
    [matches]
  );
  const shortlistMatches = useMemo(
    () =>
      matches.filter(
        (match: any) =>
          match.reviewStage === 'shortlisted' ||
          SHORTLIST_CORRIDOR_STATES.includes(match.corridorState)
      ),
    [matches]
  );
  const filteredMatches = activeSegment === 'queue' ? reviewQueueMatches : shortlistMatches;
  const alternateSegment =
    activeSegment === 'queue'
      ? {
          label: 'View shortlist and intros',
          count: shortlistMatches.length,
          next: 'shortlist' as const,
        }
      : {
          label: 'Back to review queue',
          count: reviewQueueMatches.length,
          next: 'queue' as const,
        };

  // Keep the selected proof submission in sync with tab changes or list changes.
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

  // Fetch the proof-submission explanation when the selected submission changes.
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
        dispatchClientErrorDiagnostic('matching.organization_view.explanation_fetch_failed', error);
      } finally {
        setIsLoadingExplanation(false);
      }
    };

    void fetchExplanation();
  }, [activeMatchId, explanations]);

  const handleReviewAction = async (matchId: string, action: ReviewAction) => {
    const actionLabel = reviewActionLabel(action, activeSegment);

    if (!matchId || !currentAssignment?.orgId) {
      setReviewActionError({
        matchId,
        action,
        label: actionLabel,
        message:
          'Review context could not be found. No shortlist, decline, or intro request was changed.',
      });
      toast.error('Match context not found');
      return;
    }

    setReviewActionPending({ matchId, action, label: actionLabel });
    setReviewActionError(null);

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
        toast.success('Submission declined for now.');
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
                  anonymousCandidateLabel:
                    data.anonymousCandidateLabel ?? match.anonymousCandidateLabel,
                  discoveryStatus: data.discoveryStatus ?? match.discoveryStatus,
                  fitBand: data.fitBand ?? match.fitBand,
                  introGate: data.introGate ?? match.introGate,
                  canRequestIntro: data.canRequestIntro ?? match.canRequestIntro,
                  proofSummaries: data.proofSummaries ?? match.proofSummaries,
                  skillClusters: data.skillClusters ?? match.skillClusters,
                  reasonDetails: data.reasonDetails ?? match.reasonDetails,
                  missingGates: data.missingGates ?? match.missingGates,
                  supplyState: data.supplyState ?? match.supplyState,
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
      dispatchClientErrorDiagnostic('matching.organization_view.review_action_failed', error);
      setReviewActionError({
        matchId,
        action,
        label: actionLabel,
        message: REVIEW_ACTION_FAILED_MESSAGE,
      });
      toast.error('Review action did not save', {
        description: 'No shortlist, decline, or intro request was changed.',
      });
    } finally {
      setReviewActionPending(null);
    }
  };

  const recoveryActions = getOrganizationRecoveryActions(
    'assignment-no-matches',
    slug || null,
    selectedAssignment || undefined
  );

  const activeMatch = filteredMatches.find((m: any) => m.id === activeMatchId);
  const explanation = activeMatchId ? explanations[activeMatchId] : null;
  const activeReviewActionError =
    activeMatch && reviewActionError?.matchId === activeMatch.id ? reviewActionError : null;
  const activeReviewActionPending =
    activeMatch && reviewActionPending?.matchId === activeMatch.id ? reviewActionPending : null;
  const activeSegmentPanelId =
    activeSegment === 'queue' ? 'review-queue-panel' : 'review-shortlist-panel';
  const activeSegmentTabId =
    activeSegment === 'queue' ? 'review-queue-tab' : 'review-shortlist-tab';

  return (
    <div className="mx-auto w-full max-w-7xl px-4 md:px-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-proofound-stone/50 pb-5">
        <div>
          <h2 className="font-display text-2xl font-semibold text-proofound-charcoal dark:text-foreground md:text-3xl">
            Proof submission review
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Select an assignment, review proof-backed submissions, and request intros only when the
            evidence is ready.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onCreateNew}
            className="bg-proofound-forest hover:bg-proofound-forest/90 text-white rounded-full px-5"
          >
            <Plus className="w-4 h-4 mr-2" />
            New assignment
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:h-[calc(100vh-14rem)] lg:min-h-[600px] lg:flex-row lg:overflow-hidden">
        {/* LEFT COLUMN: Assignment List (sidebar) */}
        <div className="flex w-full shrink-0 flex-col gap-3 border-b border-proofound-stone/60 pb-4 lg:w-[280px] lg:overflow-y-auto lg:border-b-0 lg:border-r lg:pb-0 lg:pr-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-1">
            Assignment corridors
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
                  aria-current={isSelected ? 'true' : undefined}
                  aria-label={`${assignment.role}. ${assignmentStatusLabel(assignment.status)}. ${count} proof submission${count !== 1 ? 's' : ''}.${isSelected ? ' Current assignment corridor.' : ''}`}
                  className={`w-full p-4 rounded-xl text-left border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2 ${
                    isSelected
                      ? 'border-proofound-forest bg-proofound-parchment/40 ring-1 ring-proofound-forest/50 font-medium'
                      : 'border-proofound-stone/60 bg-white/70 hover:border-proofound-forest/50 hover:bg-white'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-1.5 justify-between">
                    <span className="block line-clamp-2 text-sm font-semibold leading-5 text-proofound-charcoal">
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
                      {count} submission{count !== 1 ? 's' : ''}
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
                Review proof-backed submissions
              </span>
              <h2 className="mt-0.5 line-clamp-2 text-lg font-bold leading-snug text-proofound-charcoal">
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
                  size="touch"
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
                Choose one assignment in the left sidebar to start reviewing proof submissions.
              </p>
            </div>
          ) : loadError ? (
            <div
              className="flex flex-1 flex-col justify-center rounded-xl border border-proofound-stone/80 bg-white/75 p-8 text-center shadow-sm"
              role="alert"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#fff1d6] text-[#8a5b00]">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-proofound-charcoal">
                Proof submissions could not load
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                {loadError}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => void fetchMatches()}
                className="mx-auto mt-4 min-h-10 rounded-full border-proofound-stone/85 bg-white px-4 text-proofound-forest hover:border-proofound-forest hover:bg-proofound-parchment/30"
              >
                <RefreshCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                Retry review queue
              </Button>
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
              <div
                className="flex border-b border-proofound-stone/50 mb-4 shrink-0"
                role="tablist"
                aria-label="Proof submission review sections"
              >
                <button
                  id="review-queue-tab"
                  type="button"
                  role="tab"
                  aria-selected={activeSegment === 'queue'}
                  aria-controls={activeSegment === 'queue' ? 'review-queue-panel' : undefined}
                  onClick={() => setActiveSegment('queue')}
                  className={`min-h-11 rounded-t-md px-4 py-2 text-sm font-semibold border-b-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2 ${
                    activeSegment === 'queue'
                      ? 'border-proofound-forest text-proofound-forest'
                      : 'border-transparent text-muted-foreground hover:text-proofound-charcoal'
                  }`}
                >
                  Review queue ({reviewQueueMatches.length})
                </button>
                <button
                  id="review-shortlist-tab"
                  type="button"
                  role="tab"
                  aria-selected={activeSegment === 'shortlist'}
                  aria-controls={
                    activeSegment === 'shortlist' ? 'review-shortlist-panel' : undefined
                  }
                  onClick={() => setActiveSegment('shortlist')}
                  className={`min-h-11 rounded-t-md px-4 py-2 text-sm font-semibold border-b-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2 ${
                    activeSegment === 'shortlist'
                      ? 'border-proofound-forest text-proofound-forest'
                      : 'border-transparent text-muted-foreground hover:text-proofound-charcoal'
                  }`}
                >
                  Shortlist and intros ({shortlistMatches.length})
                </button>
              </div>

              {/* Two-column proof-submission review console */}
              {filteredMatches.length === 0 ? (
                <div
                  id={activeSegmentPanelId}
                  role="tabpanel"
                  aria-labelledby={activeSegmentTabId}
                  className="flex-1 flex flex-col justify-center items-center text-center p-8 bg-white/40 border border-dashed border-proofound-stone/60 rounded-xl"
                >
                  <ListChecks className="h-8 w-8 text-muted-foreground/60 mb-2" />
                  <h4 className="text-sm font-semibold text-proofound-charcoal">
                    {activeSegment === 'queue'
                      ? 'Review queue is empty'
                      : 'No proof submissions shortlisted yet'}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    {activeSegment === 'queue'
                      ? 'All proof submissions for this assignment have been reviewed.'
                      : 'Shortlist qualified proof submissions to request introductions and reveal identities.'}
                  </p>
                  {alternateSegment.count > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveSegment(alternateSegment.next)}
                      className="mt-4 min-h-11 rounded-full border-proofound-stone/85 bg-white px-4 text-xs font-semibold text-proofound-forest hover:border-proofound-forest hover:bg-proofound-parchment/30"
                    >
                      {alternateSegment.label} ({alternateSegment.count})
                    </Button>
                  )}
                </div>
              ) : (
                <div
                  id={activeSegmentPanelId}
                  role="tabpanel"
                  aria-labelledby={activeSegmentTabId}
                  className="grid flex-1 grid-cols-1 gap-6 lg:min-h-0 lg:grid-cols-5 lg:overflow-hidden"
                >
                  <div className="flex flex-col gap-3 lg:col-span-2 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
                    {filteredMatches.map((match: any, index: number) => {
                      const isSelected = match.id === activeMatchId;
                      const submissionLabel =
                        match.reviewCard?.candidateLabel || `Submission #${index + 1}`;
                      const skillsList = match.profile?.skills
                        ? Object.keys(match.profile.skills).slice(0, 3)
                        : [];
                      const discoveryLabel = readableMatchLabel(
                        match.discoveryStatus,
                        DISCOVERY_STATUS_LABELS
                      );
                      const fitLabel = readableMatchLabel(match.fitBand, FIT_BAND_LABELS);

                      return (
                        <button
                          key={match.id}
                          type="button"
                          onClick={() => handleSelectMatch(match.id)}
                          aria-pressed={isSelected}
                          aria-label={`Select ${submissionLabel} for proof review${isSelected ? '. Selected.' : '.'}`}
                          className={`w-full p-4 rounded-xl border text-left transition-all space-y-2 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2 ${
                            isSelected
                              ? 'border-proofound-forest bg-proofound-parchment/35 ring-1 ring-proofound-forest/50'
                              : 'border-proofound-stone/60 bg-white/70 hover:border-proofound-forest/50 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-proofound-charcoal">
                              {submissionLabel}
                            </span>

                            {match.corridorState === 'intro_approved' ? (
                              <Badge className="bg-[#eef4eb] text-proofound-forest text-[9px] border-proofound-forest/20">
                                Intro open
                              </Badge>
                            ) : match.corridorState === 'request_intro' ? (
                              <Badge className="bg-amber-50 text-amber-600 border-amber-200 text-[9px]">
                                Requested
                              </Badge>
                            ) : discoveryLabel ? (
                              <Badge
                                variant="outline"
                                className="text-[9px] border-proofound-stone/70"
                              >
                                {discoveryLabel}
                              </Badge>
                            ) : null}
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {match.reviewCard?.fitSummary?.headline ||
                              'Clear proof-backed alignment.'}
                          </p>

                          {fitLabel && (
                            <p className="text-[10px] font-medium text-proofound-charcoal/70">
                              {fitLabel}
                            </p>
                          )}

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

                  <div
                    ref={reviewDetailRef}
                    tabIndex={-1}
                    aria-label="Selected proof submission review"
                    className="flex flex-col space-y-6 rounded-xl border border-proofound-stone/60 bg-white/80 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2 lg:col-span-3 lg:min-h-0 lg:overflow-y-auto"
                  >
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
                              {readableMatchLabel(
                                activeMatch.discoveryStatus,
                                DISCOVERY_STATUS_LABELS
                              ) && (
                                <Badge variant="outline" className="text-[10px] font-semibold">
                                  {readableMatchLabel(
                                    activeMatch.discoveryStatus,
                                    DISCOVERY_STATUS_LABELS
                                  )}
                                </Badge>
                              )}
                              {readableMatchLabel(activeMatch.fitBand, FIT_BAND_LABELS) && (
                                <Badge variant="outline" className="text-[10px] font-semibold">
                                  {readableMatchLabel(activeMatch.fitBand, FIT_BAND_LABELS)}
                                </Badge>
                              )}
                              {readableMatchLabel(activeMatch.introGate, INTRO_GATE_LABELS) &&
                                (activeSegment === 'shortlist' ||
                                  activeMatch.introGate !== 'intro_ready') && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] font-semibold bg-proofound-stone/30 text-proofound-charcoal"
                                  >
                                    {readableMatchLabel(activeMatch.introGate, INTRO_GATE_LABELS)}
                                  </Badge>
                                )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 w-full sm:w-auto">
                            {activeSegment === 'queue' ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => handleReviewAction(activeMatch.id, 'shortlist')}
                                  disabled={Boolean(activeReviewActionPending)}
                                  className="bg-proofound-forest hover:bg-proofound-forest/90 text-white rounded-full text-xs font-semibold px-4 py-2 flex-1 sm:flex-initial"
                                >
                                  {activeReviewActionPending?.action === 'shortlist'
                                    ? 'Saving...'
                                    : 'Shortlist'}
                                </Button>
                                <Button
                                  onClick={() => handleReviewAction(activeMatch.id, 'pass')}
                                  variant="outline"
                                  disabled={Boolean(activeReviewActionPending)}
                                  className="border-proofound-stone text-proofound-charcoal bg-white rounded-full text-xs font-semibold px-4 py-2 flex-1 sm:flex-initial"
                                >
                                  {activeReviewActionPending?.action === 'pass'
                                    ? 'Saving...'
                                    : 'Decline'}
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
                                      Waiting for participant response.
                                    </p>
                                  </div>
                                ) : (
                                  <Button
                                    onClick={() =>
                                      handleReviewAction(activeMatch.id, 'request_intro')
                                    }
                                    disabled={
                                      activeMatch.canRequestIntro === false ||
                                      Boolean(activeReviewActionPending)
                                    }
                                    className="min-h-11 w-full rounded-full bg-proofound-forest px-4 py-2 text-xs font-semibold text-white hover:bg-proofound-forest/90"
                                  >
                                    <Lock className="w-3.5 h-3.5 mr-1.5" />
                                    {activeReviewActionPending?.action === 'request_intro'
                                      ? 'Saving...'
                                      : 'Request intro'}
                                  </Button>
                                )}
                                {activeMatch.canRequestIntro === false &&
                                  activeMatch.introGate !== 'intro_ready' && (
                                    <p className="text-[10px] leading-relaxed text-muted-foreground">
                                      {readableMatchLabel(
                                        activeMatch.introGate,
                                        INTRO_GATE_LABELS
                                      ) || 'Intro hold'}
                                      {Array.isArray(activeMatch.missingGates) &&
                                      activeMatch.missingGates.length > 0
                                        ? `: ${activeMatch.missingGates
                                            .map((gate: string) => gate.replace(/_/g, ' '))
                                            .join(', ')}`
                                        : ''}
                                    </p>
                                  )}
                                <Button
                                  onClick={() => handleReviewAction(activeMatch.id, 'pass')}
                                  variant="ghost"
                                  disabled={Boolean(activeReviewActionPending)}
                                  className="min-h-11 w-full rounded-full py-2 text-xs font-medium text-muted-foreground hover:bg-proofound-stone/20"
                                >
                                  {activeReviewActionPending?.action === 'pass'
                                    ? 'Saving...'
                                    : 'Remove from shortlist'}
                                </Button>
                              </div>
                            )}
                            {activeReviewActionError ? (
                              <div
                                className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900"
                                role="alert"
                              >
                                <p className="flex items-center gap-1.5 font-semibold">
                                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                                  {activeReviewActionError.label} did not save
                                </p>
                                <p className="mt-1">{activeReviewActionError.message}</p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="touch"
                                  disabled={Boolean(activeReviewActionPending)}
                                  onClick={() =>
                                    handleReviewAction(
                                      activeReviewActionError.matchId,
                                      activeReviewActionError.action
                                    )
                                  }
                                  className="mt-2 rounded-full border-amber-300 bg-white px-3 text-xs text-amber-950 hover:bg-amber-100"
                                >
                                  <RefreshCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                                  Retry {activeReviewActionError.label.toLowerCase()}
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {activeMatch.supplyState === 'browse_only_low_candidate_supply' && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            Low proof-submission supply is showing broader review possibilities.
                            Intro gates are unchanged.
                          </div>
                        )}

                        {/* Proof alignment summary */}
                        {activeMatch.reviewCard?.fitSummary && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Proof alignment
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
                                      className="bg-proofound-stone/20 px-1.5 py-0 text-[9px] font-medium text-muted-foreground"
                                    >
                                      {reasonCodeDisplayLabel(code)}
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
                                Strongest Proof Pack
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
                            Identity stays protected in this review queue. The summary uses scoped
                            Proof Pack signals, reason codes, and verification status that are safe
                            for this assignment stage. Full identity and private context stay locked
                            until the intro and reveal corridor allows access.
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
                                <TabsTrigger value="skills" className="min-h-11 text-xs">
                                  Skills
                                </TabsTrigger>
                                <TabsTrigger value="constraints" className="min-h-11 text-xs">
                                  Constraints
                                </TabsTrigger>
                                <TabsTrigger value="evidence" className="min-h-11 text-xs">
                                  Evidence
                                </TabsTrigger>
                              </TabsList>

                              <TabsContent value="skills" className="space-y-3 pt-3">
                                {explanation.skillsMatch ? (
                                  <div className="space-y-3">
                                    {explanation.skillsMatch.required?.length > 0 && (
                                      <div>
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5">
                                          Required proof anchors
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
                                                    Required proof depth: level{' '}
                                                    {skill.requiredLevel} • Submission proof depth:
                                                    level {skill.yourLevel}
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
                                          Helpful proof anchors
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
                                                  Submission proof depth: level {skill.yourLevel}
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
                                    Reason-coded Evidence Review
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
