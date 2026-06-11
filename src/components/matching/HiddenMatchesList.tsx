/**
 * Hidden Matches List
 * Shows matches the user hid and allows restoring them.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EyeOff, Loader2, Undo2 } from 'lucide-react';
import { apiFetch } from '@/lib/api/fetch';
import { toast } from 'sonner';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

interface HiddenMatch {
  id: string;
  assignment: {
    title?: string;
    locationMode?: string;
    country?: string;
  };
  organization?: {
    name?: string | null;
    logoUrl?: string | null;
  };
}

interface HiddenMatchesResponse {
  matches: HiddenMatch[];
  count: number;
}

interface HiddenMatchesListProps {
  onRestored?: () => void;
}

export function HiddenMatchesList({ onRestored }: HiddenMatchesListProps) {
  const router = useRouter();
  const [hidden, setHidden] = useState<HiddenMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [unhidingId, setUnhidingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHidden = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch('/api/match/hide');
      if (response.ok) {
        const data: HiddenMatchesResponse = await response.json();
        setHidden(data.matches || []);
      } else {
        const text = await response.text().catch(() => '');
        setError('Hidden matches could not load');
        toast.error('Hidden matches could not load', {
          description: text || 'You can retry without leaving matching.',
        });
      }
    } catch (error) {
      dispatchClientErrorDiagnostic('matching.hidden_matches.load_failed', error);
      setError('Hidden matches could not load');
      toast.error('Hidden matches could not load', {
        description: 'You can retry without leaving matching.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHidden();
  }, []);

  const handleUnhide = async (matchId: string) => {
    setUnhidingId(matchId);

    // Optimistically remove the item; keep snapshot for rollback
    const prevHidden = hidden;
    setHidden((prev) => prev.filter((m) => m.id !== matchId));

    try {
      const response = await apiFetch(`/api/match/hide?matchId=${matchId}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to unhide match');
      }
      toast.success('Match restored', { description: 'It will reappear in your matches list.' });

      // Kick off parallel refreshes so Matching updates immediately
      const warmMatches = apiFetch('/api/match/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }).catch((err) =>
        dispatchClientErrorDiagnostic('matching.hidden_matches.warm_after_unhide_failed', err)
      );

      await Promise.allSettled([
        onRestored?.(),
        warmMatches,
        Promise.resolve().then(() => router.refresh()),
      ]);
    } catch (error) {
      dispatchClientErrorDiagnostic('matching.hidden_matches.unhide_failed', error);
      // Roll back optimistic removal
      setHidden(prevHidden);
      toast.error('Failed to unhide match');
    } finally {
      setUnhidingId(null);
    }
  };

  if (loading) {
    return (
      <Card variant="bento" className="p-4 border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-foreground">Hidden</h3>
          <Loader2 className="w-4 h-4 animate-spin text-proofound-forest" />
        </div>
        <p className="text-xs text-muted-foreground">Loading hidden matches…</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="bento" className="p-4 border">
        <div className="flex items-center gap-2 mb-2 text-[#DC2626]">
          <EyeOff className="w-4 h-4" />
          <h3 className="text-sm font-medium">Hidden</h3>
        </div>
        <p className="text-sm text-[#DC2626] mb-1">{error}</p>
        <p className="mb-3 text-xs leading-5 text-muted-foreground">
          Your hidden assignment reviews are unchanged. Retry this panel to refresh the list.
        </p>
        <Button size="sm" variant="outline" onClick={fetchHidden} className="text-xs">
          Retry hidden matches
        </Button>
      </Card>
    );
  }

  if (hidden.length === 0) {
    return (
      <Card variant="bento" className="p-4 border">
        <div className="flex items-center gap-2 mb-1">
          <EyeOff className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Hidden</h3>
        </div>
        <p className="text-xs text-muted-foreground">No hidden matches right now.</p>
      </Card>
    );
  }

  return (
    <Card variant="bento" className="p-4 border">
      <div className="flex items-center gap-2 mb-3">
        <EyeOff className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-foreground">Hidden</h3>
        <Badge className="text-xs" variant="secondary">
          {hidden.length}
        </Badge>
      </div>

      <div className="space-y-3">
        {hidden.map((match) => (
          <div
            key={match.id}
            className="p-3 rounded border"
            style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {match.assignment.title || 'Assignment'}
                </p>
                {match.organization?.name && (
                  <p className="text-xs text-muted-foreground truncate">
                    {match.organization.name}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {match.assignment.locationMode || 'Flexible'}
                  {match.assignment.country ? ` • ${match.assignment.country}` : ''}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                Hidden
              </Badge>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUnhide(match.id)}
                disabled={unhidingId === match.id}
                className="text-xs"
              >
                {unhidingId === match.id ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Restoring...
                  </>
                ) : (
                  <>
                    <Undo2 className="w-3 h-3 mr-1" />
                    Unhide
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
