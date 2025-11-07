/**
 * Snoozed Matches List Component
 *
 * Displays all currently snoozed matches with unsnooze actions
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Bell, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface SnoozedMatch {
  id: string;
  matchScore: number;
  snoozedUntil: string;
  assignment: {
    id: string;
    title: string;
    description: string;
    status: string;
  };
  organization: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
}

export function SnoozedMatchesList() {
  const [matches, setMatches] = useState<SnoozedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [unsnoozing, setUnsnoozing] = useState<string | null>(null);

  useEffect(() => {
    fetchSnoozedMatches();
  }, []);

  const fetchSnoozedMatches = async () => {
    try {
      const response = await fetch('/api/match/snoozed');
      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches || []);
      }
    } catch (error) {
      console.error('Failed to fetch snoozed matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsnooze = async (matchId: string) => {
    setUnsnoozing(matchId);
    try {
      const response = await fetch(`/api/match/snooze?matchId=${matchId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to unsnooze');
      }

      toast.success('Match unsnoozed', {
        description: 'This match will now appear in your main feed',
      });

      // Remove from list
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
    } catch (error) {
      console.error('Error unsnoozing match:', error);
      toast.error('Failed to unsnooze match', {
        description: 'Please try again',
      });
    } finally {
      setUnsnoozing(null);
    }
  };

  const formatSnoozeEnd = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Ends today';
    if (diffDays === 1) return 'Ends tomorrow';
    if (diffDays < 7) return `Ends in ${diffDays} days`;
    if (diffDays < 30) return `Ends in ${Math.ceil(diffDays / 7)} weeks`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Clock className="h-16 w-16 mx-auto mb-4 text-[#A8B69D]" />
        <h3 className="text-lg font-semibold text-[#2D3330] mb-2">No Snoozed Matches</h3>
        <p className="text-sm text-[#6B6760] mb-6">
          Matches you snooze will appear here until they're unsnoozed or the snooze period ends.
        </p>
        <Button
          variant="outline"
          onClick={() => (window.location.href = '/app/i/matching')}
          className="border-[#4A5943] text-[#4A5943]"
        >
          View All Matches
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <Card key={match.id} className="p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-6">
            {/* Match Info */}
            <div className="flex-1">
              <div className="flex items-start gap-4">
                {/* Organization Logo */}
                {match.organization.logoUrl ? (
                  <Image
                    src={match.organization.logoUrl}
                    alt={match.organization.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: '#4A5943' }}
                  >
                    {match.organization.name.charAt(0)}
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#2D3330] mb-1">
                    {match.assignment.title}
                  </h3>
                  <p className="text-sm text-[#6B6760] mb-2">{match.organization.name}</p>

                  {/* Match Score */}
                  <div className="flex items-center gap-3 mb-3">
                    <Badge
                      variant="secondary"
                      className="bg-[#1C4D3A]/10 text-[#1C4D3A] border-[#1C4D3A]/20"
                    >
                      {Math.round(match.matchScore * 100)}% Match
                    </Badge>

                    <div className="flex items-center gap-1.5 text-xs text-[#6B6760]">
                      <Clock className="w-3.5 h-3.5" />
                      {formatSnoozeEnd(match.snoozedUntil)}
                    </div>
                  </div>

                  {/* Description */}
                  {match.assignment.description && (
                    <p className="text-sm text-[#6B6760] line-clamp-2">
                      {match.assignment.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                onClick={() => handleUnsnooze(match.id)}
                disabled={unsnoozing === match.id}
                className="bg-[#4A5943] text-white hover:bg-[#3C4936]"
              >
                <Bell className="w-3.5 h-3.5 mr-1.5" />
                {unsnoozing === match.id ? 'Unsnoozing...' : 'Unsnooze'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => (window.location.href = `/app/i/matching/${match.assignment.id}`)}
                className="border-[#D8D2C8] text-[#6B6760]"
              >
                View Details
              </Button>
            </div>
          </div>

          {/* Snooze End Date */}
          <div className="mt-4 pt-4 border-t border-[#E8E6DD]">
            <div className="flex items-center gap-2 text-xs text-[#6B6760]">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Will automatically reappear on{' '}
                {new Date(match.snoozedUntil).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
