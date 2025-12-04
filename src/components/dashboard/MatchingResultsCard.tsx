'use client';

/**
 * MatchingResultsCard Widget
 *
 * Displays user's top matches with scores and PAC (Proof of Authentic Connection)
 * Part of the customizable dashboard (PRD F2)
 *
 * Features:
 * - Shows top matches with match scores
 * - Visual score indicators
 * - Quick link to view all matches
 * - Prompt to set up matching if not configured
 */

import Link from 'next/link';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Shield,
  Star,
  Briefcase,
  MapPin,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/fetch';

interface MatchingResultsCardProps {
  className?: string;
  basePath?: string; // '/app/i' or '/app/o/[slug]'
}

// Type for match result
interface MatchResult {
  id?: string;
  assignmentId: string;
  score: number;
  subscores: Record<string, number>;
  contributions: Record<string, number>;
  gaps: Array<{ id: string; required: number; have: number }>;
  missing: string[];
  assignment: {
    title?: string;
    headline?: string;
    locationMode?: string;
    country?: string;
    compMin?: number;
    compMax?: number;
    currency?: string;
  };
}

interface MatchResponse {
  items: MatchResult[];
  meta: {
    total: number;
    returned: number;
    durationMs: number;
    weights: Record<string, number>;
  };
}

// Get score color based on match score
function getScoreColor(score: number): { text: string; bg: string } {
  if (score >= 80) return { text: '#166534', bg: '#DCFCE7' };
  if (score >= 60) return { text: '#1C4D3A', bg: '#D8EDE4' };
  if (score >= 40) return { text: '#F59E0B', bg: '#FEF3C7' };
  return { text: '#6B6760', bg: '#E8E6DD' };
}

// Format location
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
  const [isHovered, setIsHovered] = useState(false);

  // Fetch matches from API
  useEffect(() => {
    async function fetchMatches() {
      try {
        setIsLoading(true);
        setError(null);
        setNoProfile(false);

        const response = await apiFetch('/api/match/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ k: 5 }), // Fetch top 5 matches
        });

        if (response.status === 404) {
          // No matching profile set up yet
          setNoProfile(true);
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch matches');
        }

        const data: MatchResponse = await response.json();
        setMatches(data.items.slice(0, 3)); // Show top 3 on dashboard
        setTotalMatches(data.meta.total);
      } catch (err) {
        console.error('Error fetching matches:', err);
        setError(err instanceof Error ? err.message : 'Failed to load matches');
      } finally {
        setIsLoading(false);
      }
    }

    fetchMatches();
  }, []);

  // Loading state
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
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#1C4D3A' }} />
        </div>
      </Card>
    );
  }

  // Error state
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

  // No matching profile state
  if (noProfile) {
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
        <div className="text-center py-6">
          <Sparkles className="w-10 h-10 mx-auto mb-2" style={{ color: '#E8E6DD' }} />
          <p className="text-xs mb-3" style={{ color: '#6B6760' }}>
            Set up your matching profile to discover aligned opportunities.
          </p>
          <Link href={`${basePath}/matching/preferences`}>
            <Button
              size="sm"
              className="h-7 text-xs"
              style={{
                backgroundColor: isHovered ? '#2D5F4A' : '#1C4D3A',
                color: '#F7F6F1',
                transition: 'background-color 200ms',
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              Set up matching
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  // No matches found state
  if (matches.length === 0) {
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
        <div className="text-center py-6">
          <Sparkles className="w-10 h-10 mx-auto mb-2" style={{ color: '#E8E6DD' }} />
          <p className="text-xs mb-3" style={{ color: '#6B6760' }}>
            No matches yet. Update your profile and skills to improve your match potential.
          </p>
          <Link href={`${basePath}/expertise`}>
            <Button
              size="sm"
              className="h-7 text-xs"
              style={{
                backgroundColor: isHovered ? '#2D5F4A' : '#1C4D3A',
                color: '#F7F6F1',
                transition: 'background-color 200ms',
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              Improve profile
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  // Matches list view
  return (
    <Card
      className={`p-4 border ${className || ''}`}
      style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
    >
      {/* Header */}
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

      {/* Matches list */}
      <div className="space-y-3">
        {matches.map((match) => {
          const scorePercent = Math.round(match.score * 100);
          const colors = getScoreColor(scorePercent);

          return (
            <Link
              key={match.assignmentId}
              href={`${basePath}/matching/${match.assignmentId}`}
              className="block"
            >
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

                {/* Score breakdown preview */}
                <div className="flex items-center gap-2">
                  <Progress
                    value={scorePercent}
                    className="h-1.5 flex-1"
                    style={{ backgroundColor: '#E8E6DD' }}
                  />
                  {match.subscores.skills >= 0.7 && (
                    <Star
                      className="w-3 h-3"
                      style={{ color: '#F59E0B' }}
                      title="Strong skills match"
                    />
                  )}
                  {match.subscores.values >= 0.7 && (
                    <Shield
                      className="w-3 h-3"
                      style={{ color: '#1C4D3A' }}
                      title="Values aligned"
                    />
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
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
