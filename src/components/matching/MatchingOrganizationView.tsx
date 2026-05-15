'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MatchResultCard } from './MatchResultCard';
import { toast } from 'sonner';
import { Plus, Users } from 'lucide-react';
import { AppSurface } from '@/components/ui/v2/AppSurface';
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
    <AppSurface>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold mb-1">Assignments</h1>
              <p className="text-sm" style={{ color: '#6B6760' }}>
                Keep candidate review attached to the assignment corridor it belongs to
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={onCreateNew} style={{ backgroundColor: '#1C4D3A' }}>
                <Plus className="w-4 h-4 mr-2" />
                New Assignment
              </Button>
            </div>
          </div>
        </div>

        {/* Assignment list with quick actions */}
        <div className="grid gap-3 sm:grid-cols-2">
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
                        <h3 className="text-base font-semibold">{assignment.role}</h3>
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
                        <Badge variant="secondary">
                          {assignmentStatusLabel(assignment.status)}
                        </Badge>
                        {candidateCount > 0 ? (
                          <span className="text-xs text-muted-foreground">
                            {candidateCount} candidate{candidateCount !== 1 ? 's' : ''}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center gap-2">
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
                      <Link
                        href={slug ? `/app/o/${slug}/assignments/${assignment.id}/review` : '#'}
                      >
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
        {selectedAssignment && (
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
              <div className="text-center py-12">
                <p className="text-lg mb-2" style={{ color: '#2D3330' }}>
                  No matches yet
                </p>
                <p className="text-sm" style={{ color: '#6B6760' }}>
                  Check back soon or adjust your filters
                </p>
                <div className="mt-4 grid grid-cols-1 gap-2 text-left md:grid-cols-3">
                  {recoveryActions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => router.push(action.actionUrl)}
                      className="rounded-lg border border-proofound-stone bg-white px-3 py-2 hover:border-proofound-forest hover:bg-japandi-bg"
                    >
                      <p className="text-sm font-medium text-foreground">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </button>
                  ))}
                </div>
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
                          ? Object.entries(match.profile.skills).map(
                              ([id, data]: [string, any]) => ({
                                id,
                                label: id,
                                level: data.level,
                              })
                            )
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
    </AppSurface>
  );
}
