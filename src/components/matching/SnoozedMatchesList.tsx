/**
 * Paused assignment reviews list.
 *
 * Displays paused assignment reviews with restore actions.
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Bell, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

interface SnoozedMatch {
  id: string;
  proofFitLabel?: string;
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

interface SnoozedMatchesListProps {
  onRestored?: () => void;
}

export function SnoozedMatchesList({ onRestored }: SnoozedMatchesListProps) {
  const router = useRouter();
  const [matches, setMatches] = useState<SnoozedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [unsnoozing, setUnsnoozing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  useEffect(() => {
    fetchSnoozedMatches();
  }, []);

  const fetchSnoozedMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      setRestoreError(null);
      const response = await apiFetch('/api/match/snoozed');
      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches || []);
      } else {
        const text = await response.text().catch(() => '');
        setError('Paused assignment reviews could not load');
        toast.error('Paused assignment reviews could not load', {
          description: text || 'You can retry without leaving matching.',
        });
      }
    } catch (error) {
      dispatchClientErrorDiagnostic('matching.snoozed_matches.load_failed', error);
      setError('Paused assignment reviews could not load');
      toast.error('Paused assignment reviews could not load', {
        description: 'You can retry without leaving matching.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnsnooze = async (matchId: string) => {
    setUnsnoozing(matchId);
    setRestoreError(null);

    // Optimistically remove from local list, keep snapshot for rollback
    const prevMatches = matches;
    setMatches((prev) => prev.filter((m) => m.id !== matchId));

    try {
      const response = await apiFetch(`/api/matches/${encodeURIComponent(matchId)}/snooze`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to unsnooze');
      }

      toast.success('Assignment review restored', {
        description: 'This assignment review will reappear in matching.',
      });

      // Refresh the main matching list before we exit (best-effort) and also warm API
      const warmMatches = apiFetch('/api/match/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }).catch((err) =>
        dispatchClientErrorDiagnostic('matching.snoozed_matches.warm_after_unsnooze_failed', err)
      );

      await Promise.allSettled([
        onRestored?.(),
        warmMatches,
        Promise.resolve().then(() => router.refresh()),
      ]);
    } catch (error) {
      dispatchClientErrorDiagnostic('matching.snoozed_matches.unsnooze_failed', error);
      // Rollback optimistic removal if API failed
      setMatches(prevMatches);
      setRestoreError(
        'Assignment review could not be restored. It is still paused, and you can try again.'
      );
      toast.error('Assignment review could not be restored', {
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
          <Card variant="bento" key={i} className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card variant="bento" className="border p-4" role="alert" aria-live="assertive">
        <div className="mb-2 flex items-center gap-2 text-[#DC2626]">
          <Clock className="h-4 w-4" />
          <h3 className="text-sm font-medium">Paused</h3>
        </div>
        <p className="mb-1 text-sm text-[#DC2626]">{error}</p>
        <p className="mb-3 text-xs leading-5 text-muted-foreground">
          Your paused assignment reviews are unchanged. Retry this panel to refresh the list.
        </p>
        <Button size="sm" variant="outline" onClick={fetchSnoozedMatches} className="text-xs">
          Retry paused reviews
        </Button>
      </Card>
    );
  }

  if (matches.length === 0) {
    return (
      <Card variant="bento" className="p-12 text-center">
        <Clock className="h-16 w-16 mx-auto mb-4 text-[#A8B69D]" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No paused assignment reviews right now
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Assignment reviews you pause will appear here until you restore them or the pause period
          ends.
        </p>
        <Button
          variant="outline"
          onClick={() => router.push('/app/i/matching')}
          className="border-proofound-forest text-proofound-forest"
        >
          Back to matching feed
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {restoreError && (
        <p
          className="rounded border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-xs leading-5 text-[#B91C1C]"
          role="alert"
          aria-live="assertive"
        >
          {restoreError}
        </p>
      )}

      {matches.map((match) => (
        <Card variant="bento" key={match.id} className="p-6">
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
                    style={{ backgroundColor: '#1C4D3A' }}
                  >
                    {match.organization.name.charAt(0)}
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {match.assignment.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">{match.organization.name}</p>

                  <div className="flex items-center gap-3 mb-3">
                    <Badge
                      variant="secondary"
                      className="bg-proofound-forest/10 text-proofound-forest border-proofound-forest/20"
                    >
                      {match.proofFitLabel ?? 'Proof review needed'}
                    </Badge>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {formatSnoozeEnd(match.snoozedUntil)}
                    </div>
                  </div>

                  {/* Description */}
                  {match.assignment.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
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
                className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
              >
                <Bell className="w-3.5 h-3.5 mr-1.5" />
                {unsnoozing === match.id ? 'Restoring...' : 'Restore'}
              </Button>
            </div>
          </div>

          {/* Snooze End Date */}
          <div className="mt-4 pt-4 border-t border-proofound-stone">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
