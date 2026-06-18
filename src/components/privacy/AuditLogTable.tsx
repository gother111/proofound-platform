'use client';

/**
 * AuditLogTable Component
 *
 * Displays user's audit log with pagination.
 * Shows recent activity for transparency (GDPR Article 15 compliance).
 *
 * Reference: DATA_SECURITY_PRIVACY_ARCHITECTURE.md Section 13.3
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ChevronLeft, ChevronRight, Activity, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { internalValueLabel, isMachineIdentifier } from '@/lib/copy/labels';

interface AuditLogEntry {
  id: string;
  eventType?: string;
  eventDescription?: string;
  action?: string;
  timestamp: string;
  ipHash?: string;
  userAgent?: string;
  device?: string;
  metadata?: Record<string, any>;
}

interface AuditLogTableProps {
  title?: string;
}

export function AuditLogTable({ title = 'Account history' }: AuditLogTableProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const pageSize = 20;

  const fetchAuditLog = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      setLoading(true);
      setLoadError(null);

      const offset = (page - 1) * pageSize;
      const response = await apiFetch(`/api/user/audit-log?offset=${offset}&limit=${pageSize}`);
      if (!response.ok) throw new Error('Failed to fetch account history');

      const data = await response.json();
      if (requestId !== requestIdRef.current) return;

      setLogs(data.events || []);
      setHasMore(data.hasMore || false);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;

      dispatchClientErrorDiagnostic('privacy.audit_log.load_failed', error);
      setLoadError(
        'Account history could not load. Your privacy records are still safe; retry this section to refresh recent activity.'
      );
      setHasMore(false);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [page]);

  useEffect(() => {
    void fetchAuditLog();
  }, [fetchAuditLog]);

  const getEventBadgeColor = (eventType: string) => {
    if (eventType.includes('login') || eventType.includes('auth')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
    if (eventType.includes('update') || eventType.includes('edit')) {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
    }
    if (eventType.includes('delete') || eventType.includes('remove')) {
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    }
    if (eventType.includes('export') || eventType.includes('download')) {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  const formatEventType = (eventType: string): string => {
    return internalValueLabel(eventType.replace(/\./g, '_'));
  };

  const normalizeEventType = (log: AuditLogEntry): string => {
    if (typeof log.eventType === 'string' && log.eventType.trim()) {
      return log.eventType;
    }
    if (typeof log.action === 'string' && log.action.trim()) {
      return log.action;
    }
    return 'account_activity';
  };

  const normalizeEventDescription = (log: AuditLogEntry): string => {
    if (typeof log.eventDescription === 'string' && log.eventDescription.trim()) {
      return log.eventDescription;
    }
    if (typeof log.action === 'string' && log.action.trim()) {
      return log.action;
    }
    return 'Account activity';
  };

  const readableMetadataValue = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return 'Not set';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return String(value);
    if (typeof value === 'string') {
      if (isMachineIdentifier(value)) return 'Protected reference';
      return internalValueLabel(value);
    }
    if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? '' : 's'}`;
    return 'Additional details';
  };

  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch {
      return timestamp;
    }
  };

  const renderMetadataDetails = (log: AuditLogEntry) => {
    if (!log.metadata || Object.keys(log.metadata).length === 0) {
      return null;
    }

    return (
      <details className="mt-2">
        <summary
          className="cursor-pointer rounded-sm text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
          tabIndex={0}
        >
          More information
        </summary>
        <dl className="mt-2 grid gap-1 rounded bg-muted p-2 text-xs">
          {Object.entries(log.metadata)
            .slice(0, 6)
            .map(([key, value]) => (
              <div key={key} className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{internalValueLabel(key)}</dt>
                <dd className="text-right">{readableMetadataValue(value)}</dd>
              </div>
            ))}
        </dl>
      </details>
    );
  };

  if (loading && logs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading account history...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          Your recent account activity. Access details are protected for privacy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadError ? (
          <div
            className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100"
            role="alert"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p>{loadError}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void fetchAuditLog()}
                disabled={loading}
                className="min-h-[44px] w-full gap-2 bg-white/70 sm:w-auto"
              >
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                Retry account history
              </Button>
            </div>
          </div>
        ) : null}

        {logs.length === 0 && !loadError ? (
          <p className="text-center text-muted-foreground py-8">No activity recorded yet</p>
        ) : (
          <>
            {logs.length > 0 ? (
              <div className="space-y-3 md:hidden">
                {logs.map((log) => {
                  const eventType = normalizeEventType(log);
                  return (
                    <article key={log.id} className="rounded-xl border bg-white p-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={getEventBadgeColor(eventType)} variant="secondary">
                            {formatEventType(eventType)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          {normalizeEventDescription(log)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Access detail: {log.ipHash ? 'Protected' : 'Not recorded'}
                        </p>
                        {renderMetadataDetails(log)}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}

            {logs.length > 0 ? (
              <div className="hidden overflow-x-auto rounded-md border md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Date and time</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[150px]">Access detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const eventType = normalizeEventType(log);
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-xs">
                            {formatTimestamp(log.timestamp)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getEventBadgeColor(eventType)} variant="secondary">
                              {formatEventType(eventType)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <span className="text-sm">{normalizeEventDescription(log)}</span>
                            {renderMetadataDetails(log)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {log.ipHash ? 'Protected' : 'Not recorded'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : null}

            {/* Pagination */}
            {logs.length > 0 ? (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">Showing page {page} of activity</div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="touch"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="touch"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasMore || loading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="mt-4 rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="font-semibold mb-1">Privacy note:</p>
              <p>
                Access details are protected before storage. They help keep account history useful
                without showing your original address information.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
