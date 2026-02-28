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

export const dynamic = 'force-dynamic';

type MatchabilityCriterion = {
  id: string;
  label: string;
  met: boolean;
  detail: string;
  current: number | boolean;
  required: number | string;
};

type MatchabilityBlockedPayload = {
  error: 'PROFILE_NOT_MATCHABLE';
  message: string;
  eligibility: {
    criteria: Record<string, MatchabilityCriterion>;
  };
  topActions: Array<{ id: string; title: string; description: string; actionUrl: string }>;
};

type TestMatchItem = {
  matchId: string;
  assignmentId: string;
  assignmentRole: string | null;
  assignmentStatus: string;
  orgId: string;
  orgSlug: string;
  orgDisplayName: string;
  conversationId: string | null;
  createdAt: string;
};

function isMatchabilityBlockedPayload(payload: unknown): payload is MatchabilityBlockedPayload {
  return Boolean(
    payload &&
      typeof payload === 'object' &&
      (payload as { error?: string }).error === 'PROFILE_NOT_MATCHABLE' &&
      Array.isArray((payload as { topActions?: unknown }).topActions)
  );
}

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
  }>({
    causes: [],
    skillDomains: [],
    values: [],
  });
  const [showManageHiddenSnoozed, setShowManageHiddenSnoozed] = useState(false);
  const [blockedState, setBlockedState] = useState<MatchabilityBlockedPayload | null>(null);
  const [readinessActions, setReadinessActions] = useState<
    Array<{ id: string; title: string; description: string; actionUrl: string }>
  >([]);
  const [testMatches, setTestMatches] = useState<TestMatchItem[]>([]);
  const [isTestMatchesLoading, setIsTestMatchesLoading] = useState(true);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ensureThreeActions = (
    actions: Array<{ id: string; title: string; description: string; actionUrl: string }>
  ) => {
    const defaults = [
      {
        id: 'update-expertise-atlas-default',
        title: 'Update Expertise Atlas',
        description: 'Add skills with recency and at least one proof artifact.',
        actionUrl: '/app/i/expertise',
      },
      {
        id: 'set-matching-constraints-default',
        title: 'Set matching constraints',
        description: 'Save work mode, availability window, and compensation range.',
        actionUrl: '/app/i/matching/preferences',
      },
      {
        id: 'complete-purpose-default',
        title: 'Complete purpose section',
        description: 'Add mission, values, or causes to improve purpose fit.',
        actionUrl: '/app/i/profile',
      },
    ] as const;

    const merged = [...actions];
    for (const fallback of defaults) {
      if (merged.length >= 3) break;
      if (!merged.some((item) => item.actionUrl === fallback.actionUrl)) {
        merged.push(fallback);
      }
    }
    return merged.slice(0, 3);
  };

  const fetchMatches = async () => {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    setIsTestMatchesLoading(true);

    try {
      // Fetch matching profile
      const [profileRes, readinessRes, testMatchesRes] = await Promise.all([
        fetch('/api/matching-profile', {
          signal: controller.signal,
        }),
        fetch('/api/individual/readiness', {
          signal: controller.signal,
        }),
        fetch('/api/match/test', {
          signal: controller.signal,
        }),
      ]);

      if (readinessRes.ok) {
        const readinessPayload = await readinessRes.json();
        setReadinessActions(readinessPayload.topActions || []);
      }

      if (testMatchesRes.ok) {
        const testMatchesPayload = await testMatchesRes.json().catch(() => null);
        setTestMatches(testMatchesPayload?.items || []);
      } else {
        setTestMatches([]);
      }

      if (!profileRes.ok) {
        const errorData = await profileRes.json().catch(() => ({}));
        console.error('Failed to load matching profile:', errorData);
        throw new Error(errorData.message || 'Failed to load matching profile');
      }

      const profileData = await profileRes.json();
      setMatchingProfile(profileData.profile);

      // If profile exists, fetch matches
      if (profileData.profile) {
        const matchesRes = await fetch('/api/match/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
          signal: controller.signal,
        });

        const matchesPayload = await matchesRes.json().catch(() => null);

        if (isMatchabilityBlockedPayload(matchesPayload)) {
          const blockedPayload = matchesPayload;
          setBlockedState(blockedPayload);
          setMatches([]);
          setFilteredMatches([]);
          return;
        }

        if (!matchesRes.ok) {
          const errorData = matchesPayload || {};
          console.error('Failed to load matches:', errorData);
          throw new Error(errorData.message || 'Failed to load matches');
        }

        const matchesData = matchesPayload || {};
        const matchItems = matchesData.items || [];
        setBlockedState(null);
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
        setBlockedState(null);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Matching data request timed out');
        toast.error('Request timed out', {
          description: 'Please check your connection and try again.',
        });
        // Set empty state on timeout
        setMatchingProfile(null);
        setBlockedState(null);
        setMatches([]);
        setFilteredMatches([]);
        setTestMatches([]);
      } else {
        console.error('Error loading matching data:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load matching data';
        toast.error(errorMessage);
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
      setIsTestMatchesLoading(false);
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

  const renderTestMatchesSection = () => {
    if (!isTestMatchesLoading && testMatches.length === 0) {
      return null;
    }

    return (
      <div className="mb-6 space-y-3">
        <h2 className="text-lg font-semibold text-[#2D3330] dark:text-[#E8DCC4]">Test matches</h2>
        {isTestMatchesLoading ? (
          <div className="rounded-lg border border-[#E8E6DD] bg-white px-4 py-3">
            <p className="text-sm text-[#6B6760]">Loading test matches...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {testMatches.map((testMatch) => (
              <div
                key={testMatch.matchId}
                className="rounded-lg border border-[#E8E6DD] bg-white px-4 py-3 space-y-2"
              >
                <p className="text-sm font-medium text-[#2D3330]">
                  {testMatch.assignmentRole || 'Untitled assignment'}
                </p>
                <p className="text-xs text-[#6B6760]">Organization: {testMatch.orgDisplayName}</p>
                <div className="flex flex-wrap gap-2">
                  {testMatch.conversationId ? (
                    <button
                      className="rounded-md border border-[#E8E6DD] px-3 py-1.5 text-xs hover:border-[#1C4D3A] hover:bg-[#F7F6F1]"
                      onClick={() =>
                        router.push(`/app/i/messages?conversation=${testMatch.conversationId}`)
                      }
                    >
                      Open messages
                    </button>
                  ) : null}
                  <button
                    className="rounded-md border border-[#E8E6DD] px-3 py-1.5 text-xs hover:border-[#1C4D3A] hover:bg-[#F7F6F1]"
                    onClick={() => router.push('/app/i/matching')}
                  >
                    Open matching
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
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
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        {renderTestMatchesSection()}
        <IndividualMatchingEmpty onSetup={() => setShowSetup(true)} />
      </div>
    );
  }

  // Show filled view with matches
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {renderTestMatchesSection()}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-semibold text-[#2D3330] dark:text-[#E8DCC4]">Matching</h1>
          <div className="flex items-center gap-2">
            {!blockedState ? (
              <EnhancedMatchFilters
                activeFilters={activeFilters}
                onFiltersChange={setActiveFilters}
              />
            ) : null}
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
          {blockedState
            ? 'Complete the required matchability steps to unlock personalized opportunities.'
            : `${filteredMatches.length} opportunit${filteredMatches.length === 1 ? 'y' : 'ies'} aligned with your skills and values`}
        </p>
      </div>

      {blockedState ? (
        <div className="rounded-xl border border-[#E8E6DD] bg-[#F7F6F1] p-5">
          <h2 className="text-lg font-semibold text-[#2D3330]">Profile setup required</h2>
          <p className="mt-1 text-sm text-[#6B6760]">{blockedState.message}</p>

          <div className="mt-4 space-y-2">
            {Object.values(blockedState.eligibility.criteria)
              .filter((criterion) => !criterion.met)
              .map((criterion) => (
                <div
                  key={criterion.id}
                  className="rounded-md border border-[#E8E6DD] bg-white px-3 py-2"
                >
                  <p className="text-sm font-medium text-[#2D3330]">{criterion.label}</p>
                  <p className="text-xs text-[#6B6760]">{criterion.detail}</p>
                </div>
              ))}
          </div>

          {ensureThreeActions(blockedState.topActions).length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
              {ensureThreeActions(blockedState.topActions).map((action) => (
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
          ) : null}
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg mb-2 text-proofound-charcoal">No matches yet</p>
          <p className="text-sm text-muted-foreground">
            {matches.length === 0
              ? 'Check back soon for new opportunities'
              : 'No matches found with current filters. Try adjusting your filters.'}
          </p>
          {ensureThreeActions(readinessActions).length > 0 ? (
            <div className="mt-4 mx-auto max-w-xl text-left space-y-2">
              {ensureThreeActions(readinessActions).map((action) => (
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
          ) : null}
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

      {!blockedState ? (
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
      ) : null}
    </div>
  );
}
