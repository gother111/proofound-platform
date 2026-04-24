'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MatchResultCard } from './MatchResultCard';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
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
}

interface MatchingOrganizationViewProps {
  assignments: Assignment[];
  onCreateNew: () => void;
  onOpenWeights?: () => void;
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
  const rawSlug = (params as { slug?: string | string[] })?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  const [selectedAssignment, setSelectedAssignment] = useState<string>(assignments[0]?.id || '');
  const [matches, setMatches] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const currentAssignment = assignments.find((a) => a.id === selectedAssignment);
  const recoveryActions = getOrganizationRecoveryActions(
    'assignment-no-matches',
    slug || null,
    selectedAssignment || undefined
  );

  useEffect(() => {
    if (assignments.length === 0) {
      return;
    }

    const assignmentStillExists = assignments.some(
      (assignment) => assignment.id === selectedAssignment
    );
    if (!selectedAssignment || !assignmentStillExists) {
      setSelectedAssignment(assignments[0].id);
    }
  }, [assignments, selectedAssignment]);

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
            mode: 'balanced',
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
    if (!matchId || !slug) {
      toast.error('Match context not found');
      return;
    }

    try {
      const response = await apiFetch(`/api/org/${slug}/matches/${matchId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
        }),
      });

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
              <h1 className="text-2xl font-semibold mb-1">Matching</h1>
              <p className="text-sm" style={{ color: '#6B6760' }}>
                Find proof-backed candidates aligned with your assignment needs
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
          {assignments.map((assignment) => (
            <Link
              key={assignment.id}
              href={slug ? `/app/o/${slug}/assignments/${assignment.id}/review` : '#'}
              onClick={() => setSelectedAssignment(assignment.id)}
            >
              <Card className="p-4 hover:border-primary/60 transition">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-base">{assignment.role}</h3>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(assignment.createdAt).toLocaleDateString()}
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      {assignment.status}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm">
                    View / Edit
                  </Button>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Matches for the currently selected assignment */}
        {selectedAssignment && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Matches</h2>
                {currentAssignment && (
                  <p className="text-sm text-muted-foreground">
                    {currentAssignment.role} — {currentAssignment.status}
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
