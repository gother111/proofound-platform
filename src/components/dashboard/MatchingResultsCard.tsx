'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, MapPin, Shield, Sparkles, Star, TrendingUp } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api/fetch';
import type { ReadinessAction } from '@/lib/momentum/types';
import { getIndividualRecoveryActions } from '@/lib/ui/recovery-actions';

interface MatchingResultsCardProps {
  className?: string;
  basePath?: string;
}

interface MatchResult {
  assignmentId: string;
  score: number;
  subscores: Record<string, number>;
  assignment: {
    title?: string;
    headline?: string;
    locationMode?: string;
    country?: string;
  };
}

interface MatchResponse {
  items: MatchResult[];
  meta: {
    total: number;
  };
}

function getScoreColor(score: number): { text: string; bg: string } {
  if (score >= 80) return { text: '#166534', bg: '#DCFCE7' };
  if (score >= 60) return { text: '#1C4D3A', bg: '#D8EDE4' };
  if (score >= 40) return { text: '#F59E0B', bg: '#FEF3C7' };
  return { text: '#6B6760', bg: '#E8E6DD' };
}

function formatLocation(mode?: string, country?: string): string {
  if (mode === 'remote') return 'Remote';
  if (mode === 'hybrid' && country) return `Hybrid · ${country}`;
  if (mode === 'on-site' && country) return country;
  return mode || 'Flexible';
}

export function MatchingResultsCard({ className, basePath = '/app/i' }: MatchingResultsCardProps) {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noProfile, setNoProfile] = useState(false);
  const [readinessActions, setReadinessActions] = useState<ReadinessAction[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        setNoProfile(false);

        const [matchesResponse, readinessResponse] = await Promise.all([
          apiFetch('/api/match/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ k: 5 }),
          }),
          fetch('/api/individual/readiness', { cache: 'no-store' }),
        ]);

        if (readinessResponse.ok) {
          const readinessPayload = await readinessResponse.json();
          setReadinessActions(readinessPayload.topActions || []);
        }

        if (matchesResponse.status === 404) {
          setNoProfile(true);
          return;
        }

        if (!matchesResponse.ok) {
          const errorData = await matchesResponse.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch matches');
        }

        const data: MatchResponse = await matchesResponse.json();
        setMatches(data.items.slice(0, 3));
        setTotalMatches(data.meta.total);
      } catch (err) {
        console.error('Error fetching matches:', err);
        setError(err instanceof Error ? err.message : 'Failed to load matches');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Card
        className={`p-4 border ${className || ''}`}
        style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Matches
          </h5>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-2.5 rounded-lg border border-[#E8E6DD]/60 bg-[#F7F6F1]/50 space-y-2"
            >
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/2 rounded-md" />
                <Skeleton className="h-4 w-8 rounded-full" />
              </div>
              <Skeleton className="h-3 w-1/3 rounded-md" />
              <div className="w-full flex items-center gap-2 mt-2">
                <Skeleton className="h-1.5 flex-1 rounded-full" />
                <Skeleton className="h-3 w-3 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card
        className={`p-4 border ${className || ''}`}
        style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Matches
          </h5>
        </div>
        <div className="text-center py-4">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#DC2626' }} />
          <p className="text-xs" style={{ color: '#6B6760' }}>
            {error}
          </p>
        </div>
      </Card>
    );
  }

  if (noProfile || matches.length === 0) {
    const fallbackActions = getIndividualRecoveryActions(
      noProfile ? 'profile-incomplete' : 'matching-empty',
      readinessActions
    );

    return (
      <Card
        className={`p-4 border ${className || ''}`}
        style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Matches
          </h5>
        </div>

        <div className="text-center py-2">
          <Sparkles className="w-10 h-10 mx-auto mb-2" style={{ color: '#E8E6DD' }} />
          <p className="text-xs mb-3" style={{ color: '#6B6760' }}>
            {noProfile
              ? 'Set up your matching profile to unlock real opportunities.'
              : 'No matches yet. Use these actions to improve match readiness.'}
          </p>
        </div>

        <div className="space-y-2">
          {fallbackActions.map((action) => (
            <Link
              key={action.id}
              href={action.actionUrl}
              className="block rounded-lg border border-[#E8E6DD] px-3 py-2 hover:border-[#1C4D3A] hover:bg-[#F7F6F1]"
            >
              <p className="text-xs font-semibold text-[#2D3330]">{action.title}</p>
              <p className="text-xs text-[#6B6760] mt-1">{action.description}</p>
            </Link>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`p-4 border ${className || ''}`}
      style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Matches
          </h5>
          {totalMatches > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: '#D8EDE4', color: '#1C4D3A' }}
            >
              {totalMatches} found
            </span>
          )}
        </div>
        <Link
          href={`${basePath}/matching`}
          className="text-xs hover:underline"
          style={{ color: '#1C4D3A' }}
        >
          View all
        </Link>
      </div>

      <div className="space-y-3">
        {matches.map((match) => {
          const scorePercent = Math.round(match.score * 100);
          const colors = getScoreColor(scorePercent);

          return (
            <Link key={match.assignmentId} href={`${basePath}/matching`} className="block">
              <div
                className="p-2.5 rounded-lg border hover:border-opacity-100 transition-all"
                style={{
                  borderColor: 'rgba(232, 230, 221, 0.6)',
                  backgroundColor: 'rgba(247, 246, 241, 0.5)',
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: '#2D3330' }}>
                      {match.assignment.title || match.assignment.headline || 'Opportunity'}
                    </p>
                    {(match.assignment.locationMode || match.assignment.country) && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" style={{ color: '#6B6760' }} />
                        <p className="text-xs" style={{ color: '#6B6760' }}>
                          {formatLocation(match.assignment.locationMode, match.assignment.country)}
                        </p>
                      </div>
                    )}
                  </div>
                  <Badge
                    className="text-xs px-2 py-0.5 flex-shrink-0"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {scorePercent}%
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Progress
                    value={scorePercent}
                    className="h-1.5 flex-1"
                    style={{ backgroundColor: '#E8E6DD' }}
                  />
                  {Number(match.subscores?.skills ?? 0) >= 0.7 && (
                    <span title="Strong skills match">
                      <Star className="w-3 h-3" style={{ color: '#F59E0B' }} />
                    </span>
                  )}
                  {Number(match.subscores?.values ?? 0) >= 0.7 && (
                    <span title="Values aligned">
                      <Shield className="w-3 h-3" style={{ color: '#1C4D3A' }} />
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div
        className="mt-4 pt-3 border-t flex items-center justify-between"
        style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
      >
        <div className="flex items-center gap-1 text-xs" style={{ color: '#6B6760' }}>
          <TrendingUp className="w-3 h-3" />
          <span>Updated live</span>
        </div>
        <Link href={`${basePath}/matching`}>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            style={{ color: '#1C4D3A' }}
          >
            Explore
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
