'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { IndividualMatchingEmpty } from '@/components/matching/IndividualMatchingEmpty';
import { MatchingProfileSetup } from '@/components/matching/MatchingProfileSetup';
import { MatchResultCard } from '@/components/matching/MatchResultCard';
import { EnhancedMatchFilters } from '@/components/matching/EnhancedMatchFilters';
import { toast } from 'sonner';
import { SnoozedMatchesList } from '@/components/matching/SnoozedMatchesList';
import { HiddenMatchesList } from '@/components/matching/HiddenMatchesList';
import { CardGridSkeleton, PageIntroSkeleton } from '@/components/skeletons/CoreLoadingPrimitives';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientDiagnostic, dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { Search } from 'lucide-react';

const MATCHING_DATA_TIMEOUT_MS = 10000;
const MATCHING_LOAD_RETRY_COPY =
  'Assignment reviews could not load. Your profile, proof records, and paused or hidden choices are still safe; retry this section before acting on assignment reviews.';
const MATCHING_LOAD_TOAST_DESCRIPTION =
  'Retry assignment reviews without changing proof, preferences, or hidden assignment reviews.';
const MATCHING_INTEREST_RETRY_TITLE = 'Interest could not be recorded';
const MATCHING_INTEREST_RETRY_DESCRIPTION =
  'No intro, reveal, or review state changed. Retry before moving to the next assignment review.';

type MatchabilityCriterion = {
  id: string;
  label: string;
  met: boolean;
  detail: string;
  current: number | boolean;
  required: number | string;
};

type MatchabilityBlockedPayload = {
  items: unknown[];
  meta: {
    softGated: true;
    message: string;
  };
  eligibility: {
    criteria: Record<string, MatchabilityCriterion>;
  };
  topActions: Array<{ id: string; title: string; description: string; actionUrl: string }>;
};

type MatchingReturnedDiagnosticEvent =
  | 'matching.client.profile_load_failed'
  | 'matching.client.matches_load_failed'
  | 'matching.client.interest_returned_error';

type MatchingReturnedError = Error & {
  hasReturnedError: true;
  status: number | 'unknown';
  diagnosticEvent: MatchingReturnedDiagnosticEvent;
};

function isMatchabilityBlockedPayload(payload: unknown): payload is MatchabilityBlockedPayload {
  return Boolean(
    payload &&
      typeof payload === 'object' &&
      (payload as { meta?: { softGated?: boolean } }).meta?.softGated === true &&
      Array.isArray((payload as { topActions?: unknown }).topActions)
  );
}

function getResponseStatus(response: Response) {
  return typeof response.status === 'number' ? response.status : 'unknown';
}

function matchingReturnedError(
  response: Response,
  fallback: string,
  diagnosticEvent: MatchingReturnedDiagnosticEvent
) {
  const error = new Error(fallback) as MatchingReturnedError;
  error.name = 'MatchingReturnedError';
  error.hasReturnedError = true;
  error.status = getResponseStatus(response);
  error.diagnosticEvent = diagnosticEvent;

  return error;
}

function isMatchingReturnedError(error: unknown): error is MatchingReturnedError {
  return (
    error instanceof Error && (error as Partial<MatchingReturnedError>).hasReturnedError === true
  );
}

function dispatchMatchingFailure(eventName: string, error: unknown) {
  if (isMatchingReturnedError(error)) {
    dispatchClientDiagnostic(eventName, {
      status: error.status,
      hasReturnedError: true,
    });
    return;
  }

  dispatchClientErrorDiagnostic(eventName, error);
}

export function MatchingClient() {
  const router = useRouter();
  const [matchingProfile, setMatchingProfile] = useState<unknown | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [matches, setMatches] = useState<unknown[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<{
    skillDomains: string[];
    locationMode?: string;
    workMode?: string;
    minComp?: number;
    maxComp?: number;
  }>({
    skillDomains: [],
  });
  const [showManageHiddenSnoozed, setShowManageHiddenSnoozed] = useState(false);
  const [blockedState, setBlockedState] = useState<MatchabilityBlockedPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [readinessActions, setReadinessActions] = useState<
    Array<{ id: string; title: string; description: string; actionUrl: string }>
  >([]);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ensureThreeActions = (
    actions: Array<{ id: string; title: string; description: string; actionUrl: string }>
  ) => {
    const defaults = [
      {
        id: 'update-public-portfolio-default',
        title: 'Strengthen Public Page proof',
        description:
          'Refresh proof-backed work examples and verification checks on your Public Page.',
        actionUrl: '/app/i/profile?profileView=full&tab=proof_packs',
      },
      {
        id: 'set-matching-constraints-default',
        title: 'Set matching constraints',
        description: 'Save work mode, availability window, and compensation range.',
        actionUrl: '/app/i/matching/preferences',
      },
      {
        id: 'proof-readiness-default',
        title: 'Strengthen proof readiness',
        description: 'Add recent proof and keep your matching preferences practical.',
        actionUrl: '/app/i/profile?profileView=full&tab=proof_packs',
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
    setIsLoading(true);
    setLoadError(null);
    const visualState =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('visualState')
        : null;
    const visualQuery =
      visualState === 'filled' || visualState === 'empty'
        ? `?visualState=${encodeURIComponent(visualState)}`
        : '';

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MATCHING_DATA_TIMEOUT_MS);

    try {
      // Fetch matching profile
      const [profileRes, readinessRes] = await Promise.all([
        fetch(`/api/matching-profile${visualQuery}`, {
          signal: controller.signal,
        }),
        fetch(`/api/individual/readiness${visualQuery}`, {
          signal: controller.signal,
        }),
      ]);

      if (readinessRes.ok) {
        const readinessPayload = await readinessRes.json();
        setReadinessActions(readinessPayload.topActions || []);
      }

      if (!profileRes.ok) {
        throw matchingReturnedError(
          profileRes,
          'matching_profile_request_failed',
          'matching.client.profile_load_failed'
        );
      }

      const profileData = await profileRes.json();
      setMatchingProfile(profileData.profile);

      // If profile exists, fetch matches
      if (profileData.profile) {
        const matchesRes = await apiFetch(`/api/match/profile${visualQuery}`, {
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
          throw matchingReturnedError(
            matchesRes,
            'matching_results_request_failed',
            'matching.client.matches_load_failed'
          );
        }

        const matchesData = matchesPayload || {};
        const matchItems = matchesData.items || [];
        setBlockedState(null);
        setMatches(matchItems);
        setFilteredMatches(matchItems);
      } else {
        setBlockedState(null);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        dispatchClientErrorDiagnostic('matching.client.load_timeout', error);
        setLoadError(
          'Matching is taking longer than usual. You can retry or review your proof readiness.'
        );
      } else {
        dispatchMatchingFailure(
          isMatchingReturnedError(error) ? error.diagnosticEvent : 'matching.client.load_failed',
          error
        );
        setLoadError(MATCHING_LOAD_RETRY_COPY);
        toast.error('Assignment reviews could not load', {
          description: MATCHING_LOAD_TOAST_DESCRIPTION,
        });
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
        dispatchClientErrorDiagnostic('matching.client.restore_refresh_failed', err);
        toast.error('Could not refresh assignment reviews. Please try again.');
      });
    }, 120);
  };

  // Apply filters when they change
  useEffect(() => {
    let filtered = [...matches];

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

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 pb-28 pt-6 md:pb-6">
        <p className="mb-3 text-sm text-muted-foreground" role="status" aria-live="polite">
          Preparing assignment reviews...
        </p>
        <div className="mb-6">
          <PageIntroSkeleton showAction={false} />
        </div>
        <CardGridSkeleton
          count={6}
          columnsClassName="grid grid-cols-1 md:grid-cols-2 gap-4"
          tileClassName="min-h-[220px]"
        />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div
          className="rounded-2xl border border-proofound-stone/80 bg-white/75 p-5 shadow-sm sm:p-6"
          role="alert"
        >
          <p className="text-sm font-medium text-muted-foreground">Assignment reviews</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-proofound-charcoal">
            Assignment reviews need another moment
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{loadError}</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                void fetchMatches();
              }}
              className="rounded-full bg-proofound-forest px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-proofound-forest/90"
            >
              Retry assignment reviews
            </button>
            <button
              type="button"
              onClick={() => router.push('/app/i/profile?profileView=full&tab=proof_packs')}
              className="rounded-full border border-proofound-stone px-4 py-2.5 text-sm font-medium text-proofound-charcoal transition-colors hover:border-proofound-forest hover:bg-white"
            >
              Review proof readiness
            </button>
          </div>
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
      <div className="mx-auto max-w-5xl px-4 pb-28 pt-6 md:pb-6">
        <IndividualMatchingEmpty onSetup={() => setShowSetup(true)} />
      </div>
    );
  }

  // Show filled view with matches
  return (
    <div className="mx-auto max-w-5xl px-4 pb-28 pt-6 md:pb-6">
      <div className="mb-6">
        <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-proofound-charcoal dark:text-[#E8DCC4]">
              Assignment reviews
            </h1>
            <p className="mt-1 text-sm leading-6 text-muted-foreground dark:text-[#8A8174]">
              {blockedState
                ? 'Browsing stays open. Add recent proof and one preference before introductions.'
                : `${filteredMatches.length} assignment review${
                    filteredMatches.length === 1 ? '' : 's'
                  } aligned with your skills, proof, and constraints`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!blockedState ? (
              <EnhancedMatchFilters
                activeFilters={activeFilters}
                onFiltersChange={setActiveFilters}
              />
            ) : null}
            <button
              type="button"
              onClick={() => {
                setShowSetup(true);
              }}
              className="rounded-full border border-proofound-stone bg-white/70 px-3 py-2 text-sm font-medium text-proofound-forest transition-colors hover:border-proofound-forest hover:bg-white"
            >
              Edit profile
            </button>
          </div>
        </div>
      </div>

      {blockedState ? (
        <div className="rounded-xl border border-proofound-stone bg-japandi-bg p-5">
          <h2 className="font-display text-xl font-semibold text-proofound-charcoal">
            Introductions need more proof
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{blockedState.meta.message}</p>

          <div className="mt-4 space-y-2">
            {Object.values(blockedState.eligibility.criteria)
              .filter((criterion) => !criterion.met)
              .map((criterion) => (
                <div
                  key={criterion.id}
                  className="rounded-md border border-proofound-stone bg-white px-3 py-2"
                >
                  <p className="text-sm font-medium text-foreground">{criterion.label}</p>
                  <p className="text-xs text-muted-foreground">{criterion.detail}</p>
                </div>
              ))}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            You can keep browsing, but introductions unlock after the required proof, one accepted
            verification, and intro constraints are current.
          </p>

          {ensureThreeActions(blockedState.topActions).length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
              {ensureThreeActions(blockedState.topActions).map((action) => (
                <button
                  type="button"
                  key={action.id}
                  onClick={() => router.push(action.actionUrl)}
                  className="rounded-lg border border-proofound-stone px-3 py-2 text-left hover:border-proofound-forest hover:bg-white"
                >
                  <p className="text-sm font-medium text-foreground">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-proofound-stone/70 bg-white px-4 py-16 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#eef3e8] text-proofound-forest">
            <Search className="h-8 w-8" />
          </div>
          <h2 className="mb-2 font-display text-xl font-semibold text-proofound-charcoal">
            No assignment reviews yet
          </h2>
          <p className="mb-6 mx-auto max-w-md text-sm leading-6 text-muted-foreground">
            {matches.length === 0
              ? 'Nothing needs your attention right now. Keep your proof and preferences current so new assignment reviews can land cleanly.'
              : 'Your review filters are hiding the available assignment reviews. Clear one filter to see more proof-led reviews.'}
          </p>
          {ensureThreeActions(readinessActions).length > 0 ? (
            <div className="mx-auto w-full max-w-xl space-y-2 text-left mt-2">
              {ensureThreeActions(readinessActions).map((action) => (
                <button
                  type="button"
                  key={action.id}
                  onClick={() => router.push(action.actionUrl)}
                  className="w-full rounded-lg border border-proofound-stone bg-white px-3 py-2 transition-colors hover:border-proofound-forest hover:bg-proofound-parchment/30 text-left"
                >
                  <p className="text-sm font-medium text-proofound-charcoal">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
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
                  const response = await apiFetch('/api/match/interest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      assignmentId: match.assignmentId,
                    }),
                  });

                  if (!response.ok) {
                    throw matchingReturnedError(
                      response,
                      'matching_interest_request_failed',
                      'matching.client.interest_returned_error'
                    );
                  }

                  const data = await response.json();
                  if (data.introApproved && data.conversationId) {
                    toast.success('Introduction approved. Opening messages...');
                    setTimeout(() => {
                      router.push(
                        `/app/i/communications?section=messages&conversation=${data.conversationId}`
                      );
                    }, 500);
                  } else if (data.requiresIntroApproval) {
                    toast.success(
                      'Interest is mutual. Proofound will open the introduction after shortlist approval.'
                    );
                  } else {
                    toast.success('Interest recorded. Waiting for shortlist review.');
                  }
                } catch (error) {
                  dispatchMatchingFailure(
                    isMatchingReturnedError(error)
                      ? error.diagnosticEvent
                      : 'matching.client.interest_failed',
                    error
                  );
                  toast.error(MATCHING_INTEREST_RETRY_TITLE, {
                    description: MATCHING_INTEREST_RETRY_DESCRIPTION,
                  });
                }
              }}
              onHide={async () => {
                if (match.id) {
                  try {
                    await apiFetch('/api/match/hide', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ matchId: match.id }),
                    });
                  } catch (error) {
                    dispatchClientErrorDiagnostic('matching.client.hide_failed', error);
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
                toast.success('Hidden from assignment reviews');
              }}
            />
          ))}
        </div>
      )}

      {!blockedState ? (
        <div className="mt-8">
          <button
            onClick={() => setShowManageHiddenSnoozed((prev) => !prev)}
            className="text-sm text-proofound-forest underline flex items-center gap-2"
          >
            {showManageHiddenSnoozed
              ? 'Hide paused/hidden review manager'
              : 'Manage paused or hidden reviews'}
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
