'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export interface ShortlistItem {
  id: string;
  assignmentId: string;
  assignmentRole: string | null;
  assignmentStatus: string | null;
  reviewStage: string;
  revealScope: string;
  visibleIdentityFields: string[];
  candidate: {
    id: string;
    displayName: string | null;
    headline: string | null;
    tagline: string | null;
    desiredRoles: string[];
    workMode: string | null;
    valuesTags: string[];
    causeTags: string[];
    verificationSummary: number;
  };
  fairness: {
    status: string;
  };
  why?: {
    summary?: string[];
    reasonCodes?: string[];
  };
  reviewCard?: {
    candidateLabel: string;
    strongestProof: {
      summary: string | null;
      outcome: string | null;
      ownership: string | null;
      anchorContext: string | null;
      freshnessLabel: string | null;
    };
    verification: {
      summaryLabel: string;
      count: number | null;
    };
    trustLabels: string[];
    fitBand: string | null;
    fitSummary: {
      headline: string;
      bullets: string[];
      reasonCodes: string[];
    };
  };
  rankBand: string;
  shortlistedAt: string | null;
}

type SortOption = 'recent' | 'rankBand';

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
      next = next.filter((item) => item.assignmentId === assignmentFilter);
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      next = next.filter((item) => {
        const searchValues = [
          item.assignmentRole,
          item.reviewCard?.candidateLabel,
          item.reviewCard?.strongestProof.summary,
          item.reviewCard?.strongestProof.outcome,
          item.reviewCard?.strongestProof.ownership,
          item.reviewCard?.strongestProof.anchorContext,
          item.reviewCard?.verification.summaryLabel,
          item.reviewCard?.fitBand,
          item.reviewCard?.fitSummary.headline,
          ...(item.reviewCard?.fitSummary.bullets || []),
          ...(item.reviewCard?.fitSummary.reasonCodes || []),
          ...(item.reviewCard?.trustLabels || []),
          ...(item.why?.summary || []),
          ...(item.why?.reasonCodes || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchValues.includes(query);
      });
    }

    next = [...next].sort((a, b) => {
      if (sortBy === 'rankBand') {
        return a.rankBand.localeCompare(b.rankBand);
      }
      return new Date(b.shortlistedAt || 0).getTime() - new Date(a.shortlistedAt || 0).getTime();
    });

    return next;
  }, [items, assignmentFilter, sortBy, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {filtered.length} candidate{filtered.length === 1 ? '' : 's'}
          </Badge>
          <Badge variant="secondary">Progressive reveal</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <label htmlFor="assignment-filter" className="text-sm text-muted-foreground">
              Assignment
            </label>
            <select
              id="assignment-filter"
              value={assignmentFilter}
              onChange={(event) => setAssignmentFilter(event.target.value)}
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
            <label htmlFor="sort-by" className="text-sm text-muted-foreground">
              Sort
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="h-9 rounded-md border border-neutral-300 bg-white px-2 text-sm"
            >
              <option value="recent">Most recent</option>
              <option value="rankBand">Rank band</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="shortlist-search" className="text-sm text-muted-foreground">
              Search
            </label>
            <Input
              id="shortlist-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, role focus, value"
              className="h-9 w-56"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            No shortlisted candidates match these filters right now.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((item) => (
            <Card key={item.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-proofound-charcoal">
                    {item.reviewCard?.candidateLabel || 'Candidate'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.reviewCard?.fitSummary.headline ||
                      'Proof-led review stays anonymous until a later reveal trigger.'}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{item.assignmentStatus ?? 'active'}</Badge>
                  <Badge variant="outline">
                    {item.reviewCard?.fitBand || item.rankBand || 'Shortlisted'}
                  </Badge>
                </div>
              </div>

              <div className="text-sm text-proofound-charcoal/80">
                <span className="font-medium">Assignment:</span>{' '}
                {item.assignmentRole || 'Untitled role'}
              </div>

              <div className="rounded-lg border border-proofound-stone/80 bg-proofound-parchment/35 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Strongest relevant proof
                </p>
                <p className="text-sm font-medium text-proofound-charcoal">
                  {item.reviewCard?.strongestProof.summary || 'Proof-backed evidence is available.'}
                </p>
                {item.reviewCard?.strongestProof.outcome ? (
                  <p className="mt-2 text-sm text-proofound-charcoal/85">
                    Outcome: {item.reviewCard.strongestProof.outcome}
                  </p>
                ) : null}
                {item.reviewCard?.strongestProof.ownership ? (
                  <p className="mt-2 text-sm text-proofound-charcoal/85">
                    Ownership: {item.reviewCard.strongestProof.ownership}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {item.reviewCard?.strongestProof.anchorContext ? (
                  <Badge variant="outline">{item.reviewCard.strongestProof.anchorContext}</Badge>
                ) : null}
                {item.reviewCard?.strongestProof.freshnessLabel ? (
                  <Badge variant="outline">{item.reviewCard.strongestProof.freshnessLabel}</Badge>
                ) : null}
                {(item.reviewCard?.trustLabels || []).map((label) => (
                  <Badge key={label} variant="outline">
                    {label}
                  </Badge>
                ))}
              </div>

              <div className="rounded-lg border border-proofound-stone/80 bg-white p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Reason-coded fit summary
                </p>
                <ul className="space-y-2 text-sm text-proofound-charcoal/85">
                  {(item.reviewCard?.fitSummary.bullets || item.why?.summary || []).map(
                    (bullet) => (
                      <li key={bullet} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-proofound-forest" />
                        <span>{bullet}</span>
                      </li>
                    )
                  )}
                </ul>
                {(item.reviewCard?.fitSummary.reasonCodes || item.why?.reasonCodes || []).length >
                0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(item.reviewCard?.fitSummary.reasonCodes || item.why?.reasonCodes || []).map(
                      (reasonCode) => (
                        <Badge
                          key={reasonCode}
                          variant="secondary"
                          className="font-mono text-[11px]"
                        >
                          {reasonCode}
                        </Badge>
                      )
                    )}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span>
                  Shortlisted:{' '}
                  {item.shortlistedAt
                    ? new Date(item.shortlistedAt).toLocaleDateString()
                    : 'Just now'}
                </span>
                <span>Reveal scope: {item.revealScope}</span>
                <span>Fairness: {item.fairness.status}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
