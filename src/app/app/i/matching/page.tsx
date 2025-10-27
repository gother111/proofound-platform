'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IndividualMatchingEmpty } from '@/components/matching/IndividualMatchingEmpty';
import { MatchingProfileSetup } from '@/components/matching/MatchingProfileSetup';
import { MatchResultCard } from '@/components/matching/MatchResultCard';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';

export default function MatchingPage() {
  const router = useRouter();
  const [matchingProfile, setMatchingProfile] = useState<unknown | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [matches, setMatches] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch matching profile
        const profileRes = await fetch('/api/matching-profile');
        const profileData = await profileRes.json();

        setMatchingProfile(profileData.profile);

        // If profile exists, fetch matches
        if (profileData.profile) {
          const matchesRes = await fetch('/api/match/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
          const matchesData = await matchesRes.json();
          setMatches(matchesData.items || []);
        }
      } catch (error) {
        toast.error('Failed to load matching data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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
        <p className="text-sm" style={{ color: '#6B6760' }}>
          Opportunities aligned with your skills and values
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg mb-2" style={{ color: '#2D3330' }}>
            No matches yet
          </p>
          <p className="text-sm" style={{ color: '#6B6760' }}>
            Check back soon or adjust your filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((match: any, index: number) => (
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
                setMatches(matches.filter((_: unknown, i: number) => i !== index));
                toast.success('Hidden from results');
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
