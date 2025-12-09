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
import { Eye, EyeOff, Loader2, Undo2 } from 'lucide-react';
import { apiFetch } from '@/lib/api/fetch';
import { toast } from 'sonner';

interface HiddenMatch {
  id: string;
  assignmentId: string;
  score: number;
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
        const text = await response.text();
        setError('Failed to load hidden matches');
        toast.error('Failed to load hidden matches', {
          description: text || undefined,
        });
      }
    } catch (error) {
      console.error('Failed to fetch hidden matches:', error);
      setError('Failed to load hidden matches');
      toast.error('Failed to load hidden matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHidden();
  }, []);

  const handleUnhide = async (matchId: string) => {
    setUnhidingId(matchId);
    try {
      const response = await apiFetch(`/api/match/hide?matchId=${matchId}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to unhide match');
      }
      setHidden((prev) => prev.filter((m) => m.id !== matchId));
      toast.success('Match restored', { description: 'It will reappear in your matches list.' });

      // Kick off parallel refreshes so Matching updates immediately
      const warmMatches = fetch('/api/match/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }).catch((err) => console.error('Warm matches fetch failed after unhide:', err));

      await Promise.allSettled([
        onRestored?.(),
        warmMatches,
        Promise.resolve().then(() => router.refresh()),
      ]);
    } catch (error) {
      console.error('Failed to unhide match:', error);
      toast.error('Failed to unhide match');
    } finally {
      setUnhidingId(null);
    }
  };

  if (loading) {
    return (
      <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-[#2D3330]">Hidden</h3>
          <Loader2 className="w-4 h-4 animate-spin text-[#1C4D3A]" />
        </div>
        <p className="text-xs text-[#6B6760]">Loading hidden matches…</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
        <div className="flex items-center gap-2 mb-2 text-[#DC2626]">
          <EyeOff className="w-4 h-4" />
          <h3 className="text-sm font-medium">Hidden</h3>
        </div>
        <p className="text-sm text-[#DC2626] mb-3">{error}</p>
        <Button size="sm" variant="outline" onClick={fetchHidden} className="text-xs">
          Retry
        </Button>
      </Card>
    );
  }

  if (hidden.length === 0) {
    return (
      <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
        <div className="flex items-center gap-2 mb-1">
          <EyeOff className="w-4 h-4 text-[#6B6760]" />
          <h3 className="text-sm font-medium text-[#2D3330]">Hidden</h3>
        </div>
        <p className="text-xs text-[#6B6760]">No hidden matches right now.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
      <div className="flex items-center gap-2 mb-3">
        <EyeOff className="w-4 h-4 text-[#6B6760]" />
        <h3 className="text-sm font-medium text-[#2D3330]">Hidden</h3>
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
                <p className="text-sm font-medium text-[#2D3330] truncate">
                  {match.assignment.title || 'Opportunity'}
                </p>
                {match.organization?.name && (
                  <p className="text-xs text-[#6B6760] truncate">{match.organization.name}</p>
                )}
                <p className="text-xs text-[#6B6760]">
                  {match.assignment.locationMode || 'Flexible'}
                  {match.assignment.country ? ` • ${match.assignment.country}` : ''}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {Math.round(match.score * 100)}%
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
              <a
                href={`/app/i/matching/${match.assignmentId}`}
                className="text-xs text-[#1C4D3A] hover:underline flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                View
              </a>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

