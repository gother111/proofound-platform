'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IndividualMatchingEmpty } from '@/components/matching/IndividualMatchingEmpty';
import { MatchingProfileSetup } from '@/components/matching/MatchingProfileSetup';
import { MatchResultCard } from '@/components/matching/MatchResultCard';
import { EnhancedMatchFilters } from '@/components/matching/EnhancedMatchFilters';
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
      try {
        // Fetch matching profile
        const profileRes = await fetch('/api/matching-profile');
        
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
              const { emitFirstMatchShown } = await import('@/lib/analytics/events');
              await emitFirstMatchShown(
                matchItems[0].userId || matchItems[0].user_id,
                matchItems[0].id,
                {
                  totalMatches: matchItems.length,
                  topScore: matchItems[0].score || matchItems[0].totalScore,
                }
              );
            } catch (analyticsError) {
              // Log but don't fail the page load
              console.error('Failed to track first match shown:', analyticsError);
            }
          }
        }
      } catch (error) {
        console.error('Error loading matching data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load matching data';
        toast.error(errorMessage);
      } finally {
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
      <div className="flex items-center justify-center min-h-[60vh] bg-proofound-parchment dark:bg-background">
        <p className="text-proofound-charcoal/70 dark:text-muted-foreground">Loading...</p>
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
          <h1 className="text-2xl font-semibold">Matching</h1>
          <div className="flex items-center gap-2">
            <EnhancedMatchFilters
              activeFilters={activeFilters}
              onFiltersChange={setActiveFilters}
            />
            <button
              onClick={() => {
                setShowSetup(true);
              }}
              className="text-sm underline"
              style={{ color: '#1C4D3A' }}
            >
              Edit Profile
            </button>
          </div>
        </div>
        <p className="text-sm" style={{ color: '#6B6760' }}>
          {filteredMatches.length} opportunit{filteredMatches.length === 1 ? 'y' : 'ies'} aligned with your skills and values
        </p>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg mb-2" style={{ color: '#2D3330' }}>
            No matches yet
          </p>
          <p className="text-sm" style={{ color: '#6B6760' }}>
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
                    toast.success('Mutual interest! Identity revealed.');
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
