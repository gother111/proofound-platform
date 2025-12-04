'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export interface ShortlistItem {
  id: string;
  assignmentId: string;
  assignmentRole: string | null;
  assignmentStatus: string | null;
  candidateId: string | null;
  candidateName: string | null;
  candidateEmail: string | null;
  score: string | number | null;
  createdAt: string;
}

type SortOption = 'recent' | 'score';

interface Props {
  items: ShortlistItem[];
}

export function OrgShortlistClient({ items }: Props) {
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [search, setSearch] = useState('');

  const assignmentOptions = useMemo(() => {
    const roles = new Map<string, string>();
    items.forEach((item) => {
      if (item.assignmentId) {
        roles.set(item.assignmentId, item.assignmentRole || 'Untitled role');
      }
    });
    return Array.from(roles.entries());
  }, [items]);

  const filtered = useMemo(() => {
    let next = items;

    if (assignmentFilter !== 'all') {
      next = next.filter((i) => i.assignmentId === assignmentFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      next = next.filter(
        (i) =>
          i.candidateName?.toLowerCase().includes(q) ||
          i.candidateEmail?.toLowerCase().includes(q)
      );
    }

    next = [...next].sort((a, b) => {
      if (sortBy === 'score') {
        const sa = Number(a.score ?? 0);
        const sb = Number(b.score ?? 0);
        return sb - sa;
      }
      // recent
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return next;
  }, [items, assignmentFilter, sortBy, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {filtered.length} candidate{filtered.length === 1 ? '' : 's'}
          </Badge>
          {assignmentFilter !== 'all' && (
            <Badge variant="secondary">Filtered</Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Assignment</label>
            <select
              value={assignmentFilter}
              onChange={(e) => setAssignmentFilter(e.target.value)}
              className="h-9 rounded-md border border-neutral-300 bg-white px-2 text-sm"
            >
              <option value="all">All</option>
              {assignmentOptions.map(([id, role]) => (
                <option key={id} value={id}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Sort</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-9 rounded-md border border-neutral-300 bg-white px-2 text-sm"
            >
              <option value="recent">Most recent</option>
              <option value="score">Highest score</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Search</label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or email"
              className="h-9 w-48"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            No shortlist entries match these filters. Try clearing filters or refreshing.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((item) => (
            <Card key={item.id} className="p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-medium text-proofound-charcoal">
                    {item.candidateName || 'Candidate'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.candidateEmail || 'Email unavailable'}
                  </div>
                </div>
                <Badge variant="secondary">
                  {item.assignmentStatus ?? 'active'}
                </Badge>
              </div>

              <div className="text-sm text-proofound-charcoal/80">
                <span className="font-medium">Assignment:</span>{' '}
                {item.assignmentRole || 'Untitled role'}
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Shortlisted: {new Date(item.createdAt).toLocaleDateString()}</span>
                {item.score ? <span>Score: {Number(item.score).toFixed(0)}</span> : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

