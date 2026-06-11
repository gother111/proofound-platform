'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
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
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertCircle, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientDiagnostic } from '@/lib/client-diagnostics';
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

interface OrgAuditPreviewResponse {
  orgId: string;
  accessedAt: string;
  preview: {
    mode: 'minimum_necessary';
    returned: number;
    warning: string;
  };
  logs: Array<{
    id: number;
    action: string;
    targetType: string | null;
    targetId: string | null;
    createdAt: string;
    riskLabels: string[];
  }>;
}

type PendingBreakGlassPreview = {
  orgId: string;
  reason: string;
};

function formatAuditLabel(value: string) {
  return internalValueLabel(value.replace(/[.:-]+/g, '_'));
}

export function AuditLogTable() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [breakGlassOrgId, setBreakGlassOrgId] = useState('');
  const [breakGlassReason, setBreakGlassReason] = useState('');
  const [breakGlassLoading, setBreakGlassLoading] = useState(false);
  const [breakGlassError, setBreakGlassError] = useState<string | null>(null);
  const [breakGlassPreview, setBreakGlassPreview] = useState<OrgAuditPreviewResponse | null>(null);
  const [pendingBreakGlassPreview, setPendingBreakGlassPreview] =
    useState<PendingBreakGlassPreview | null>(null);

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
      dispatchClientDiagnostic('admin.audit_history.load_failed', {
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

  const handleBreakGlassPreview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const orgId = breakGlassOrgId.trim();
    const reason = breakGlassReason.trim();
    setBreakGlassError(null);
    setBreakGlassPreview(null);

    if (!orgId) {
      setBreakGlassError('Enter an organization id before requesting a break-glass preview.');
      return;
    }

    if (reason.length < 12) {
      setBreakGlassError('Break-glass reason must be at least 12 characters.');
      return;
    }

    setPendingBreakGlassPreview({ orgId, reason });
  };

  const loadBreakGlassPreview = async ({ orgId, reason }: PendingBreakGlassPreview) => {
    setBreakGlassLoading(true);
    try {
      const res = await apiFetch(
        `/api/admin/organizations/${encodeURIComponent(orgId)}/audit?limit=10`,
        {
          headers: {
            'x-break-glass-reason': reason,
          },
        }
      );
      if (!res.ok) {
        throw new Error('Break-glass preview failed');
      }
      setBreakGlassPreview((await res.json()) as OrgAuditPreviewResponse);
      setPendingBreakGlassPreview(null);
    } catch (error) {
      dispatchClientDiagnostic('admin.break_glass_org_audit.preview_failed', {
        errorName: error instanceof Error ? error.name : typeof error,
      });
      setBreakGlassError('Break-glass preview could not be loaded. Check the id and reason.');
      setPendingBreakGlassPreview(null);
    } finally {
      setBreakGlassLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-amber-950">Break-glass org audit preview</h2>
          <p className="text-sm text-amber-900">
            Use only for approved privacy, trust, or incident review. The dashboard preview records
            the reason and withholds raw audit metadata.
          </p>
        </div>
        <form
          className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]"
          onSubmit={handleBreakGlassPreview}
        >
          <Input
            aria-label="Organization id"
            placeholder="Organization id"
            value={breakGlassOrgId}
            onChange={(event) => setBreakGlassOrgId(event.target.value)}
          />
          <Input
            aria-label="Break-glass reason"
            placeholder="Break-glass reason"
            value={breakGlassReason}
            onChange={(event) => setBreakGlassReason(event.target.value)}
          />
          <Button type="submit" disabled={breakGlassLoading}>
            {breakGlassLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading
              </>
            ) : (
              'Preview'
            )}
          </Button>
        </form>
        {breakGlassError ? (
          <p className="mt-3 text-sm text-amber-950" role="alert">
            {breakGlassError}
          </p>
        ) : null}
        {breakGlassPreview ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-white p-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-foreground">
                {breakGlassPreview.preview.returned} preview rows for {breakGlassPreview.orgId}
              </p>
              <p className="text-xs text-muted-foreground">
                Accessed {format(new Date(breakGlassPreview.accessedAt), 'MMM d, HH:mm')}
              </p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {breakGlassPreview.preview.warning}
            </p>
            <div className="mt-3 space-y-2">
              {breakGlassPreview.logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No org audit rows in the preview.</p>
              ) : (
                breakGlassPreview.logs.map((log) => (
                  <div key={log.id} className="rounded-md border border-proofound-stone/70 p-3">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {formatAuditLabel(log.action)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatAuditLabel(log.targetType || 'unknown')} ·{' '}
                          {log.targetId || 'No target'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.createdAt), 'MMM d, HH:mm')}
                      </p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {log.riskLabels.map((label) => (
                        <span
                          key={`${log.id}:${label}`}
                          className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-950"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </section>

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

      <AlertDialog
        open={Boolean(pendingBreakGlassPreview)}
        onOpenChange={(open) => {
          if (!open && !breakGlassLoading) {
            setPendingBreakGlassPreview(null);
          }
        }}
      >
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Open break-glass audit preview?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  This records the reason and returns only the minimum necessary organization audit
                  preview. Raw metadata remains hidden.
                </p>
                {pendingBreakGlassPreview ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-left text-sm text-amber-950">
                    <p className="font-medium">Organization id</p>
                    <p className="mt-1 break-all text-foreground">
                      {pendingBreakGlassPreview.orgId}
                    </p>
                    <p className="mt-3 font-medium">Break-glass reason</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-foreground">
                      {pendingBreakGlassPreview.reason}
                    </p>
                  </div>
                ) : null}
                <p>
                  Continue only for approved privacy, trust, or incident review. Do not copy private
                  user content from other systems into the reason.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={breakGlassLoading}>Keep closed</AlertDialogCancel>
            <Button
              type="button"
              loading={breakGlassLoading}
              disabled={breakGlassLoading}
              onClick={() => {
                if (pendingBreakGlassPreview) {
                  void loadBreakGlassPreview(pendingBreakGlassPreview);
                }
              }}
            >
              Confirm preview
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
