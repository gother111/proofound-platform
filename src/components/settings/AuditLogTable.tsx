'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';

interface AuditLogTableProps {
  userId: string;
}

interface AuditLogEvent {
  id: string;
  timestamp: string;
  action: string;
  ipHash: string;
  device: string;
  metadata?: any;
}

interface AuditLogResponse {
  events: AuditLogEvent[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export function AuditLogTable({ userId }: AuditLogTableProps) {
  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  useEffect(() => {
    fetchAuditLog(0);
  }, [userId]);

  const fetchAuditLog = async (newOffset: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(`/api/user/audit-log?limit=${limit}&offset=${newOffset}`);
      if (!response.ok) {
        throw new Error('Failed to fetch audit log');
      }

      const auditData: AuditLogResponse = await response.json();
      
      if (append && data) {
        setData({
          ...auditData,
          events: [...data.events, ...auditData.events],
        });
      } else {
        setData(auditData);
      }
      
      setOffset(newOffset);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit log');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const newOffset = offset + limit;
    fetchAuditLog(newOffset, true);
  };

  const handleExportCSV = () => {
    if (!data) return;

    // Convert to CSV
    const headers = ['Date & Time', 'Action', 'IP Hash', 'Device'];
    const rows = data.events.map((event) => [
      new Date(event.timestamp).toLocaleString(),
      event.action,
      event.ipHash,
      event.device,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proofound-audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-proofound-forest" />
            <span className="ml-3 text-proofound-charcoal/70 dark:text-muted-foreground">
              Loading audit log...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-red-200 dark:border-red-900 rounded-2xl">
        <CardContent className="pt-6">
          <p className="text-red-600 dark:text-red-400">
            {error || 'Failed to load audit log. Please try again.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-['Crimson_Pro']">Audit Log</CardTitle>
              <CardDescription>
                Last {data.events.length} of {data.total} recent activities
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={data.events.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-proofound-charcoal/60 dark:text-muted-foreground">
                No activity recorded yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-proofound-parchment dark:bg-slate-800 rounded-lg text-sm font-medium text-proofound-charcoal/70 dark:text-muted-foreground">
                <div className="col-span-3">Date & Time</div>
                <div className="col-span-4">Action</div>
                <div className="col-span-3">IP Hash</div>
                <div className="col-span-2">Device</div>
              </div>

              {/* Table Rows */}
              {data.events.map((event) => (
                <div
                  key={event.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 border border-proofound-stone dark:border-border rounded-lg hover:bg-proofound-parchment/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="col-span-3 text-sm text-proofound-charcoal dark:text-foreground">
                    {formatTimestamp(event.timestamp)}
                  </div>
                  <div className="col-span-4 text-sm font-medium text-proofound-charcoal dark:text-foreground">
                    {event.action}
                  </div>
                  <div className="col-span-3 text-xs font-mono text-proofound-charcoal/60 dark:text-muted-foreground">
                    {event.ipHash}
                  </div>
                  <div className="col-span-2 text-xs text-proofound-charcoal/60 dark:text-muted-foreground truncate">
                    {event.device}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {data.hasMore && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  `Load More (${data.total - data.events.length} remaining)`
                )}
              </Button>
            </div>
          )}

          {/* Privacy Note */}
          <div className="mt-6 bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              ℹ️ All IP addresses shown are hashed (SHA-256) and abbreviated for privacy. Full IP addresses are never stored.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

