'use client';

/**
 * AuditLogTable Component
 *
 * Displays user's audit log with pagination.
 * Shows recent activity for transparency (GDPR Article 15 compliance).
 *
 * Reference: DATA_SECURITY_PRIVACY_ARCHITECTURE.md Section 13.3
 */

import { useState, useEffect, useCallback } from 'react';
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
import { ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { apiFetch } from '@/lib/api/fetch';

interface AuditLogEntry {
  id: string;
  eventType: string;
  eventDescription: string;
  timestamp: string;
  ipHash: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

export function AuditLogTable() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    fetchAuditLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchAuditLog = async () => {
    try {
      setLoading(true);

      const response = await apiFetch(`/api/user/audit-log?page=${page}&limit=${pageSize}`);
      if (!response.ok) throw new Error('Failed to fetch audit log');

      const data = await response.json();
      setLogs(data.events || []);
      setHasMore(data.hasMore || false);
    } catch (error) {
      console.error('Failed to fetch audit log:', error);
    } finally {
      setLoading(false);
    }
  };

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
    return eventType
      .split('.')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch {
      return timestamp;
    }
  };

  const abbreviateHash = (hash: string): string => {
    if (!hash || hash.length <= 12) return hash;
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 4)}`;
  };

  if (loading && logs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading audit log...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Log
        </CardTitle>
        <CardDescription>
          Your recent account activity (last 50 events). IP addresses are hashed for privacy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No activity recorded yet</p>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Timestamp</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[150px]">IP Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getEventBadgeColor(log.eventType)} variant="secondary">
                          {formatEventType(log.eventType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <span className="text-sm">{log.eventDescription}</span>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <details className="mt-1">
                            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                              View details
                            </summary>
                            <pre className="mt-2 rounded bg-muted p-2 text-xs overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {abbreviateHash(log.ipHash)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">Showing page {page} of activity</div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasMore || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>

            <div className="mt-4 rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="font-semibold mb-1">Privacy Note:</p>
              <p>
                IP addresses are one-way hashed for security. We cannot reverse the hash to see your
                original IP address. This protects your privacy while maintaining audit integrity.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
