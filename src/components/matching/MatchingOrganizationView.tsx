'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MatchResultCard } from './MatchResultCard';
import { toast } from 'sonner';
import { ArrowRight, ListChecks, Plus, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api/fetch';
import { getOrganizationRecoveryActions } from '@/lib/ui/recovery-actions';
import { CardGridSkeleton } from '@/components/skeletons/CoreLoadingPrimitives';

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
  onOpenWeights?: () => void;
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

function formatCount(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Filled matching view for organizations showing matches per assignment.
 */
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

  const [selectedAssignment, setSelectedAssignment] = useState<string>(queryAssignmentId);
  const [viewedAtByAssignment, setViewedAtByAssignment] = useState<Record<string, string>>({});
  const [matches, setMatches] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const currentAssignment = assignments.find((a) => a.id === selectedAssignment);
  const totalCandidateCount = assignments.reduce(
    (total, assignment) => total + (assignment.matchingSummary?.candidateCount ?? 0),
    0
  );
  const activeAssignmentCount = assignments.filter((assignment) =>
    ['active', 'assignment_ready', 'pending_review', 'review_ready'].includes(assignment.status)
  ).length;
  const recoveryActions = getOrganizationRecoveryActions(
    'assignment-no-matches',
    slug || null,
    selectedAssignment || undefined
  );

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
          // The badge is intentionally lightweight; storage failures should not block review.
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

  useEffect(() => {
    if (!selectedAssignment) {
      setMatches([]);
      return;
    }

    const assignmentStillExists = assignments.some(
      (assignment) => assignment.id === selectedAssignment
    );

    if (!assignmentStillExists) {
      setSelectedAssignment('');
      setMatches([]);
    }
  }, [assignments, selectedAssignment]);

  const handleOpenMatching = (assignmentId: string) => {
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
      : 'New candidates';
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

  const handleReviewAction = async (
    matchId: string | null | undefined,
    action: 'shortlist' | 'pass' | 'request_intro'
  ) => {
    if (!matchId || !currentAssignment?.orgId) {
      toast.error('Match context not found');
      return;
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
      if (action === 'pass') {
        setMatches((current) => current.filter((match: any) => match.id !== matchId));
        toast.success('Candidate passed for now.');
        return;
      }

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
        action === 'request_intro' ? 'Intro request recorded.' : 'Candidate added to shortlist.'
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update review state');
    }
  };

  if (assignments.length === 0) {
    return null; // Should not reach here, but safety check
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Assignment matching</h1>
            <p className="text-sm" style={{ color: '#6B6760' }}>
              Choose one assignment, then review only the candidate signals for that corridor.
            </p>
          </div>
          <div className="flex items-center gap-2 lg:justify-end">
            <Button
              onClick={onCreateNew}
              className="w-full lg:w-auto"
              style={{ backgroundColor: '#1C4D3A' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New assignment
            </Button>
          </div>
        </div>
      </div>

      <Card className="mb-4 border-proofound-stone/80 bg-white/80 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
              <ListChecks className="h-4 w-4 text-proofound-forest" />
              Review focus
            </div>
            <h2 className="text-lg font-semibold text-proofound-charcoal">
              {currentAssignment
                ? `Reviewing ${currentAssignment.role}`
                : 'Choose an assignment to review matches.'}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {currentAssignment
                ? 'The cards below stay scoped to this assignment, so shortlist and intro decisions do not drift across roles.'
                : 'Start with the assignment that is ready for review. Matching opens below the cards and keeps identity reveal staged.'}
            </p>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-3 lg:min-w-[28rem]">
            <div className="rounded-lg border border-proofound-stone/70 bg-proofound-parchment/45 p-3">
              <p className="text-xs text-muted-foreground">Assignments</p>
              <p className="font-semibold text-proofound-charcoal">
                {formatCount(assignments.length, 'assignment')}
              </p>
            </div>
            <div className="rounded-lg border border-proofound-stone/70 bg-proofound-parchment/45 p-3">
              <p className="text-xs text-muted-foreground">Ready to review</p>
              <p className="font-semibold text-proofound-charcoal">
                {formatCount(activeAssignmentCount, 'assignment')}
              </p>
            </div>
            <div className="rounded-lg border border-proofound-stone/70 bg-proofound-parchment/45 p-3">
              <p className="text-xs text-muted-foreground">Candidate signals</p>
              <p className="font-semibold text-proofound-charcoal">
                {formatCount(totalCandidateCount, 'candidate')}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Assignment list with quick actions */}
      <div className="grid gap-3 lg:grid-cols-2">
        {assignments.map((assignment) => {
          const updateBadgeLabel = getAssignmentBadgeLabel(assignment);
          const candidateCount = assignment.matchingSummary?.candidateCount ?? 0;

          return (
            <Card
              key={assignment.id}
              className={`p-4 transition ${
                selectedAssignment === assignment.id
                  ? 'border-proofound-forest bg-proofound-parchment/50'
                  : 'hover:border-primary/60'
              }`}
            >
              <div className="flex h-full flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="min-w-0 break-words text-base font-semibold">
                        {assignment.role}
                      </h3>
                      {updateBadgeLabel ? (
                        <Badge className="border-proofound-forest/20 bg-[#eef4eb] text-proofound-forest">
                          {updateBadgeLabel}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(assignment.createdAt).toLocaleDateString()}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{assignmentStatusLabel(assignment.status)}</Badge>
                      {candidateCount > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          {candidateCount} candidate{candidateCount !== 1 ? 's' : ''}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="mt-auto grid gap-2 xl:flex xl:items-center">
                  <Button
                    type="button"
                    size="sm"
                    data-testid={`assignment-matching-${assignment.id}`}
                    className="bg-proofound-forest hover:bg-proofound-forest/90"
                    aria-pressed={selectedAssignment === assignment.id}
                    aria-label={`Matching for ${assignment.role}`}
                    onClick={() => handleOpenMatching(assignment.id)}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Matching
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={slug ? `/app/o/${slug}/assignments/${assignment.id}/review` : '#'}>
                      View / Edit
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Matches for the currently selected assignment */}
      {!selectedAssignment ? (
        <Card className="mt-6 border-dashed border-proofound-stone/90 bg-proofound-parchment/35 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-proofound-charcoal">
                Select an assignment to open its matching queue.
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Use the Matching button on the assignment you want to review first.
              </p>
            </div>
            <ArrowRight className="hidden h-5 w-5 text-proofound-forest sm:block" />
          </div>
        </Card>
      ) : (
        <div className="mt-8 space-y-4" data-testid="assignment-matching-grid">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Matching</h2>
              {currentAssignment && (
                <p className="text-sm text-muted-foreground">
                  {currentAssignment.role} — {assignmentStatusLabel(currentAssignment.status)}
                </p>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Preparing proof-backed matches for this assignment...
              </p>
              <CardGridSkeleton
                count={4}
                columnsClassName="grid grid-cols-1 md:grid-cols-2 gap-4"
                tileClassName="min-h-[220px]"
              />
            </div>
          ) : matches.length === 0 ? (
            <div className="rounded-2xl border border-proofound-stone bg-white/80 p-5 text-left shadow-sm sm:p-6">
              <div className="mx-auto max-w-2xl space-y-4 text-center">
                <div>
                  <p className="text-lg font-semibold text-proofound-charcoal">
                    No matches for {currentAssignment?.role ?? 'this assignment'} yet
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Keep this assignment ready for review. The best next step is to refresh the
                    assignment before widening discovery.
                  </p>
                </div>
                {recoveryActions[0] ? (
                  <Button
                    type="button"
                    onClick={() => router.push(recoveryActions[0].actionUrl)}
                    className="w-full bg-proofound-forest hover:bg-proofound-forest/90 sm:w-auto"
                  >
                    {recoveryActions[0].title}
                  </Button>
                ) : null}
              </div>
              {recoveryActions.length > 1 ? (
                <div className="mt-5 grid gap-2 border-t border-proofound-stone/70 pt-4 sm:grid-cols-2">
                  {recoveryActions.slice(1).map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => router.push(action.actionUrl)}
                      className="rounded-lg border border-proofound-stone bg-proofound-parchment/45 px-3 py-2 text-left transition-colors hover:border-proofound-forest hover:bg-japandi-bg"
                    >
                      <p className="text-sm font-medium text-foreground">{action.title}</p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {action.description}
                      </p>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div>
              <p className="text-sm mb-4" style={{ color: '#6B6760' }}>
                {matches.length} candidate{matches.length !== 1 ? 's' : ''} match this assignment
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map((match: any, index: number) => (
                  <MatchResultCard
                    key={match.profileId || index}
                    result={match}
                    variant="blind"
                    skills={
                      match.profile?.skills
                        ? Object.entries(match.profile.skills).map(([id, data]: [string, any]) => ({
                            id,
                            label: id,
                            level: data.level,
                          }))
                        : []
                    }
                    onInterested={() =>
                      handleReviewAction(
                        match.id,
                        match.reviewStage === 'shortlisted' ? 'request_intro' : 'shortlist'
                      )
                    }
                    onHide={() => handleReviewAction(match.id, 'pass')}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
