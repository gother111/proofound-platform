'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { IndividualMatchingEmpty } from '@/components/matching/IndividualMatchingEmpty';
import { MatchingProfileSetup } from '@/components/matching/MatchingProfileSetup';
import { MatchResultCard } from '@/components/matching/MatchResultCard';
import { EnhancedMatchFilters } from '@/components/matching/EnhancedMatchFilters';
import { SkeletonCard } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { SnoozedMatchesList } from '@/components/matching/SnoozedMatchesList';
import { HiddenMatchesList } from '@/components/matching/HiddenMatchesList';
import { CheckCircle2, Circle } from 'lucide-react';
import { getIndividualRecoveryActions } from '@/lib/ui/recovery-actions';

export const dynamic = 'force-dynamic';

type MatchabilityCriterion = {
  id: string;
  label: string;
  met: boolean;
  detail: string;
  current: number | boolean;
  required: number | string;
};

type MatchabilityState = {
  eligible: boolean;
  tier: 'none' | 'lite' | 'strong';
  message: string;
  criteria: Record<string, MatchabilityCriterion>;
};

type MatchingAction = {
  id: string;
  title: string;
  description: string;
  actionUrl: string;
};

type MatchingResponsePayload = {
  items?: Array<Record<string, any>>;
  eligibility?: MatchabilityState;
  topActions?: MatchingAction[];
  meta?: {
    eligibility?: MatchabilityState;
  };
};

type ReadinessPayload = {
  topActions?: MatchingAction[];
};

type MatchingProfilePayload = {
  profile?: unknown | null;
  message?: string;
  error?: string;
};

const EMPTY_FILTERS = {
  causes: [],
  skillDomains: [],
  values: [],
};

export default function MatchingPage() {
  const router = useRouter();
  const [matchingProfile, setMatchingProfile] = useState<unknown | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [matches, setMatches] = useState<unknown[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<{
    causes: string[];
    skillDomains: string[];
    values: string[];
    locationMode?: string;
    workMode?: string;
    minComp?: number;
    maxComp?: number;
  }>({ ...EMPTY_FILTERS });
  const [showManageHiddenSnoozed, setShowManageHiddenSnoozed] = useState(false);
  const [activationState, setActivationState] = useState<MatchabilityState | null>(null);
  const [readinessActions, setReadinessActions] = useState<MatchingAction[]>([]);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checklistOrder = ['skillsWithRecency', 'proofs', 'constraints', 'purpose'];
  const activationRecoveryActions = getIndividualRecoveryActions(
    'matching-blocked',
    readinessActions
  );
  const emptyRecoveryActions = getIndividualRecoveryActions('matching-empty', readinessActions);
  const hasFilteredOutMatches = matches.length > 0 && filteredMatches.length === 0;

  const fetchMatches = async () => {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      // Fetch matching profile
      const [profileRes, readinessRes] = await Promise.all([
        fetch('/api/matching-profile', {
          signal: controller.signal,
        }),
        fetch('/api/individual/readiness', {
          signal: controller.signal,
        }),
      ]);

      if (readinessRes.ok) {
        const readinessPayload = (await readinessRes.json()) as ReadinessPayload;
        setReadinessActions(readinessPayload.topActions || []);
      }

      if (!profileRes.ok) {
        const errorData = await profileRes.json().catch(() => ({}));
        console.error('Failed to load matching profile:', errorData);
        throw new Error(errorData.message || 'Failed to load matching profile');
      }

      const profileData = (await profileRes.json()) as MatchingProfilePayload;
      setMatchingProfile(profileData.profile);

      // If profile exists, fetch matches
      if (profileData.profile) {
        const matchesRes = await fetch('/api/match/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
          signal: controller.signal,
        });

        if (!matchesRes.ok) {
          const errorData = await matchesRes.json().catch(() => ({}));
          console.error('Failed to load matches:', errorData);
          throw new Error(errorData.message || 'Failed to load matches');
        }

        const matchesData = (await matchesRes.json()) as MatchingResponsePayload;
        const matchItems = matchesData.items || [];
        const eligibility = matchesData.eligibility || matchesData.meta?.eligibility || null;

        if (matchesData.topActions && matchesData.topActions.length > 0) {
          setReadinessActions(matchesData.topActions);
        }

        setActivationState(eligibility && !eligibility.eligible ? eligibility : null);
        setMatches(matchItems);
        setFilteredMatches(matchItems);

        // Track first match shown for TTFQI metric
        if (matchItems.length > 0) {
          try {
            await fetch('/api/analytics/track', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventType: 'first_match_shown',
                userId: matchItems[0].userId || matchItems[0].user_id,
                entityType: 'match',
                entityId: matchItems[0].id,
                properties: {
                  totalMatches: matchItems.length,
                  topScore: matchItems[0].score || matchItems[0].totalScore,
                },
              }),
            });
          } catch (analyticsError) {
            // Log but don't fail the page load
            console.error('Failed to track first match shown:', analyticsError);
          }
        }
      } else {
        setActivationState(null);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Matching data request timed out');
        toast.error('Request timed out', {
          description: 'Please check your connection and try again.',
        });
        // Set empty state on timeout
        setMatchingProfile(null);
        setActivationState(null);
        setMatches([]);
        setFilteredMatches([]);
      } else {
        console.error('Error loading matching data:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load matching data';
        toast.error(errorMessage);
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  // Debounced refresh helper so multiple restores don't spam the API
  const refreshMatches = () => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
    }
    refreshTimer.current = setTimeout(() => {
      fetchMatches().catch((err) => {
        console.error('Failed to refresh matches after restore:', err);
        toast.error('Could not refresh matches. Please try again.');
      });
    }, 120);
  };

  // Apply filters when they change
  useEffect(() => {
    let filtered = [...matches];

    // Filter by causes
    if (activeFilters.causes.length > 0) {
      filtered = filtered.filter((match: any) => {
        const assignmentCauses = match.assignment?.causeTags || [];
        return activeFilters.causes.some((cause) => assignmentCauses.includes(cause));
      });
    }

    // Filter by location mode
    if (activeFilters.locationMode) {
      filtered = filtered.filter((match: any) => {
        return match.assignment?.locationMode === activeFilters.locationMode;
      });
    }

    // Filter by work mode
    if (activeFilters.workMode) {
      filtered = filtered.filter((match: any) => {
        return match.assignment?.workMode === activeFilters.workMode;
      });
    }

    // Filter by values
    if (activeFilters.values.length > 0) {
      filtered = filtered.filter((match: any) => {
        const assignmentValues = match.assignment?.valuesTags || [];
        return activeFilters.values.some((val) => assignmentValues.includes(val));
      });
    }

    // Filter by compensation band
    if (activeFilters.minComp !== undefined || activeFilters.maxComp !== undefined) {
      filtered = filtered.filter((match: any) => {
        const compMin = match.assignment?.compMin ?? 0;
        const compMax = match.assignment?.compMax ?? compMin;
        const withinMin =
          activeFilters.minComp === undefined ? true : compMax >= activeFilters.minComp;
        const withinMax =
          activeFilters.maxComp === undefined ? true : compMin <= activeFilters.maxComp;
        return withinMin && withinMax;
      });
    }

    setFilteredMatches(filtered);
  }, [activeFilters, matches]);

  const resetFilters = () => {
    setActiveFilters({ ...EMPTY_FILTERS });
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="h-8 w-48 bg-proofound-stone dark:bg-[#2C3244] rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-proofound-stone dark:bg-[#2C3244] rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Show setup wizard if triggered or if starting fresh
  if (showSetup || (!matchingProfile && !isLoading)) {
    return (
      <MatchingProfileSetup
        onComplete={() => {
          setShowSetup(false);
          router.refresh();
        }}
        onCancel={() => {
          setShowSetup(false);
          router.push('/app/i/home');
        }}
      />
    );
  }

  // Show empty state if no profile
  if (!matchingProfile) {
    return <IndividualMatchingEmpty onSetup={() => setShowSetup(true)} />;
  }

  // Show filled view with matches
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-semibold text-[#2D3330] dark:text-[#E8DCC4]">Matching</h1>
          <div className="flex items-center gap-2">
            <EnhancedMatchFilters
              activeFilters={activeFilters}
              onFiltersChange={setActiveFilters}
            />
            <button
              onClick={() => {
                setShowSetup(true);
              }}
              className="text-sm underline text-proofound-forest"
            >
              Edit Profile
            </button>
          </div>
        </div>
        <p className="text-sm text-[#6B6760] dark:text-[#8A8174]">
          {activationState
            ? 'You can explore now. Complete these steps to unlock stronger match quality.'
            : `${filteredMatches.length} opportunit${filteredMatches.length === 1 ? 'y' : 'ies'} aligned with your skills and values`}
        </p>
      </div>

      {activationState ? (
        <div className="rounded-xl border border-[#E8E6DD] bg-[#F7F6F1] p-5">
          <h2 className="text-lg font-semibold text-[#2D3330]">Get match-ready in 4 quick steps</h2>
          <p className="mt-1 text-sm text-[#6B6760]">{activationState.message}</p>

          <div className="mt-4 space-y-2">
            {Object.values(activationState.criteria)
              .sort((a, b) => checklistOrder.indexOf(a.id) - checklistOrder.indexOf(b.id))
              .map((criterion) => (
                <div
                  key={criterion.id}
                  className="rounded-md border border-[#E8E6DD] bg-white px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    {criterion.met ? (
                      <CheckCircle2 className="h-4 w-4 text-[#1C4D3A]" />
                    ) : (
                      <Circle className="h-4 w-4 text-[#6B6760]" />
                    )}
                    <p className="text-sm font-medium text-[#2D3330]">{criterion.label}</p>
                  </div>
                  <p className="mt-1 text-xs text-[#6B6760]">
                    {criterion.met ? 'Completed' : criterion.detail}
                  </p>
                </div>
              ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
            {activationRecoveryActions.map((action) => (
              <button
                key={action.id}
                onClick={() => router.push(action.actionUrl)}
                className="rounded-lg border border-[#E8E6DD] px-3 py-2 text-left hover:border-[#1C4D3A] hover:bg-white"
              >
                <p className="text-sm font-medium text-[#2D3330]">{action.title}</p>
                <p className="text-xs text-[#6B6760]">{action.description}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {filteredMatches.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg mb-2 text-proofound-charcoal">No matches yet</p>
          <p className="text-sm text-muted-foreground">
            {matches.length === 0
              ? 'Check back soon for new opportunities'
              : 'No matches found with current filters. Try adjusting your filters.'}
          </p>
          {hasFilteredOutMatches ? (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 rounded-lg border border-[#1C4D3A] px-3 py-2 text-sm font-medium text-[#1C4D3A] hover:bg-[#EEF1EA]"
            >
              Reset filters
            </button>
          ) : null}
          <div className="mt-4 mx-auto max-w-xl text-left space-y-2">
            {emptyRecoveryActions.map((action) => (
              <button
                key={action.id}
                onClick={() => router.push(action.actionUrl)}
                className="w-full rounded-lg border border-[#E8E6DD] px-3 py-2 hover:border-[#1C4D3A] hover:bg-[#F7F6F1]"
              >
                <p className="text-sm font-medium text-[#2D3330]">{action.title}</p>
                <p className="text-xs text-[#6B6760]">{action.description}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((match: any, index: number) => (
            <MatchResultCard
              key={index}
              result={match}
              variant="blind"
              skills={
                match.assignment?.skills
                  ? Object.entries(match.assignment.skills).map(([id, data]: [string, any]) => ({
                      id,
                      label: id,
                      level: data?.level || 0,
                    }))
                  : []
              }
              onInterested={async () => {
                try {
                  // Proceed with introduction (gates checked by card component)
                  const response = await fetch('/api/match/interest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      assignmentId: match.assignmentId,
                    }),
                  });

                  if (!response.ok) throw new Error('Failed');

                  const data = await response.json();
                  if (data.revealed) {
                    // Mutual interest detected - navigate to conversation
                    if (data.conversationId) {
                      toast.success('Mutual interest! Starting conversation...');
                      // Small delay to let the toast be visible
                      setTimeout(() => {
                        router.push(`/app/i/messages?conversation=${data.conversationId}`);
                      }, 500);
                    } else {
                      toast.success('Mutual interest! Go to Messages to start chatting.');
                    }
                  } else {
                    toast.success('Interest recorded! Waiting for org response.');
                  }
                } catch (error) {
                  toast.error('Failed to record interest');
                }
              }}
              onHide={async () => {
                if (match.id) {
                  try {
                    await fetch('/api/match/hide', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ matchId: match.id }),
                    });
                  } catch (error) {
                    console.error('Failed to hide match:', error);
                  }
                }

                const shouldKeep = (m: any) => {
                  if (match.id && m.id) return m.id !== match.id;
                  if (match.assignmentId && m.assignmentId)
                    return m.assignmentId !== match.assignmentId;
                  return m !== match;
                };

                const updatedMatches = matches.filter(shouldKeep);
                setMatches(updatedMatches);
                setFilteredMatches((prev) => prev.filter(shouldKeep));
                toast.success('Hidden from results');
              }}
            />
          ))}
        </div>
      )}

      <div className="mt-8">
        <button
          onClick={() => setShowManageHiddenSnoozed((prev) => !prev)}
          className="text-sm text-[#1C4D3A] underline flex items-center gap-2"
        >
          {showManageHiddenSnoozed
            ? 'Hide snoozed/hidden manager'
            : 'Manage snoozed or hidden matches'}
        </button>

        {showManageHiddenSnoozed && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <SnoozedMatchesList onRestored={refreshMatches} />
            <HiddenMatchesList onRestored={refreshMatches} />
          </div>
        )}
      </div>
    </div>
  );
}
