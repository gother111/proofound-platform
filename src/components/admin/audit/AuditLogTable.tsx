'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { apiFetch } from '@/lib/api/fetch';
import { internalValueLabel } from '@/lib/copy/labels';
import type { AdminAuditListEntry } from '@/lib/audit/admin-audit-list';

interface AuditResponse {
  logs: AdminAuditListEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function AuditLogTable() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: debouncedSearch,
      });
      const res = await apiFetch(`/api/admin/audit?${params}`);
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Audit history load failed', {
        errorName: error instanceof Error ? error.name : typeof error,
      });
      setError('Audit history could not be loaded. Try again in a moment.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search history..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}

      <div className="rounded-md border max-md:hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  {debouncedSearch ? 'No logs match this search.' : 'No audit history yet.'}
                </TableCell>
              </TableRow>
            ) : (
              data?.logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(log.createdAt), 'MMM d, HH:mm')}
                  </TableCell>
                  <TableCell>{log.admin?.displayName || log.admin?.handle || 'Unknown'}</TableCell>
                  <TableCell className="font-medium">{internalValueLabel(log.action)}</TableCell>
                  <TableCell>{internalValueLabel(log.targetType)}</TableCell>
                  <TableCell className="max-w-md truncate text-muted-foreground">
                    {log.reason || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="flex min-h-32 items-center justify-center rounded-lg border bg-white text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading audit history...
          </div>
        ) : data?.logs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-proofound-stone/80 bg-japandi-bg px-4 py-8 text-center text-sm text-muted-foreground">
            {debouncedSearch ? 'No logs match this search.' : 'No audit history yet.'}
          </div>
        ) : (
          data?.logs.map((log) => (
            <article
              key={log.id}
              className="rounded-lg border border-proofound-stone/80 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="break-words text-sm font-semibold text-foreground">
                    {internalValueLabel(log.action)}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(new Date(log.createdAt), 'MMM d, HH:mm')}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-proofound-stone bg-japandi-bg px-2 py-1 text-xs text-muted-foreground">
                  {internalValueLabel(log.targetType)}
                </span>
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Admin
                  </dt>
                  <dd className="break-words text-foreground">
                    {log.admin?.displayName || log.admin?.handle || 'Unknown'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Details
                  </dt>
                  <dd className="break-words text-muted-foreground">{log.reason || '-'}</dd>
                </div>
              </dl>
            </article>
          ))
        )}
      </div>

      {data && (
        <div className="flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {data.pagination.total === 0
              ? 'No logs to show'
              : `Showing ${(data.pagination.page - 1) * data.pagination.limit + 1} to ${Math.min(
                  data.pagination.page * data.pagination.limit,
                  data.pagination.total
                )} of ${data.pagination.total} logs`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page >= data.pagination.totalPages || loading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
