'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IndividualMatchingEmpty } from '@/components/matching/IndividualMatchingEmpty';
import { MatchingProfileSetup } from '@/components/matching/MatchingProfileSetup';
import { MatchResultCard } from '@/components/matching/MatchResultCard';
import { EnhancedMatchFilters } from '@/components/matching/EnhancedMatchFilters';
import { SkeletonCard } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';

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
    locationMode?: string;
    workMode?: string;
  }>({
    causes: [],
    skillDomains: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      try {
        // Fetch matching profile
        const profileRes = await fetch('/api/matching-profile', {
          signal: controller.signal,
        });

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

          if (!matchesRes.ok) {
            const errorData = await matchesRes.json().catch(() => ({}));
            console.error('Failed to load matches:', errorData);
            throw new Error(errorData.message || 'Failed to load matches');
          }

          const matchesData = await matchesRes.json();
          const matchItems = matchesData.items || [];
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
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.error('Matching data request timed out');
          toast.error('Request timed out', {
            description: 'Please check your connection and try again.',
          });
          // Set empty state on timeout
          setMatchingProfile(null);
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

    fetchData();
  }, []);

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

    setFilteredMatches(filtered);
  }, [activeFilters, matches]);

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
          {filteredMatches.length} opportunit{filteredMatches.length === 1 ? 'y' : 'ies'} aligned
          with your skills and values
        </p>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg mb-2 text-proofound-charcoal">No matches yet</p>
          <p className="text-sm text-muted-foreground">
            {matches.length === 0
              ? 'Check back soon for new opportunities'
              : 'No matches found with current filters. Try adjusting your filters.'}
          </p>
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
              onHide={() => {
                const updatedMatches = matches.filter((m: any) => m.id !== match.id);
                setMatches(updatedMatches);
                toast.success('Hidden from results');
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
