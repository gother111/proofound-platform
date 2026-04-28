/**
 * Audit Log Viewer Component
 *
 * User-facing activity log for transparency
 * PRD Reference: Part 6 - Privacy by Design (Audit Trail)
 * GDPR Article 15 - Right to Access
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  Calendar,
  Monitor,
  Search,
  Download,
  Shield,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api/fetch';
import { internalValueLabel, isMachineIdentifier } from '@/lib/copy/labels';

interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  ipHash: string;
  device: string;
  metadata?: Record<string, any>;
}

interface AuditLogResponse {
  events: AuditEvent[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

function readableMetadataValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Not set';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    if (isMachineIdentifier(value)) return 'Protected reference';
    return /[_-]/.test(value) ? internalValueLabel(value) : value;
  }
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? '' : 's'}`;
  return 'Additional details';
}

export function AuditLogViewer() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEvents, setFilteredEvents] = useState<AuditEvent[]>([]);
  const { toast } = useToast();

  const LIMIT = 50;

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  useEffect(() => {
    // Filter events based on search query
    if (searchQuery.trim() === '') {
      setFilteredEvents(events);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = events.filter(
        (event) =>
          event.action.toLowerCase().includes(query) ||
          event.device.toLowerCase().includes(query) ||
          new Date(event.timestamp).toLocaleString().toLowerCase().includes(query)
      );
      setFilteredEvents(filtered);
    }
  }, [searchQuery, events]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch(`/api/user/audit-log?limit=${LIMIT}&offset=${offset}`);

      if (!response.ok) {
        throw new Error('Failed to load account history');
      }

      const data: AuditLogResponse = await response.json();

      setEvents(data.events);
      setTotal(data.total);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('audit_log.load.failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      toast({
        title: 'Failed to load account history',
        description: 'Could not fetch your activity history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      // Export all events as JSON
      const response = await apiFetch(`/api/user/audit-log?limit=1000&offset=0`);

      if (!response.ok) {
        throw new Error('Failed to download account history');
      }

      const data = await response.json();

      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(data.events, null, 2)], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `account-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Account history downloaded',
        description: 'Your activity history has been downloaded',
      });
    } catch (error) {
      console.error('audit_log.export.failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      toast({
        title: 'Download failed',
        description: 'Could not download your account history',
        variant: 'destructive',
      });
    }
  };

  const handlePrevPage = () => {
    setOffset((prev) => Math.max(0, prev - LIMIT));
  };

  const handleNextPage = () => {
    if (hasMore) {
      setOffset((prev) => prev + LIMIT);
    }
  };

  const getEventIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('profile')) return '👤';
    if (actionLower.includes('skill')) return '🎯';
    if (actionLower.includes('match')) return '🤝';
    if (actionLower.includes('message')) return '💬';
    if (actionLower.includes('project')) return '📁';
    if (actionLower.includes('sign')) return '🔐';
    if (actionLower.includes('data') || actionLower.includes('export')) return '📦';
    if (actionLower.includes('interview')) return '📅';
    if (actionLower.includes('decision')) return '✅';
    return '📊';
  };

  const getActionColor = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('created') || actionLower.includes('added'))
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (actionLower.includes('updated') || actionLower.includes('changed'))
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    if (actionLower.includes('deleted') || actionLower.includes('removed'))
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    if (actionLower.includes('viewed') || actionLower.includes('accessed'))
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    if (actionLower.includes('signed'))
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  if (isLoading && events.length === 0) {
    return (
      <Card variant="bento">
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPage = Math.floor(offset / LIMIT) + 1;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <Card variant="bento">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account history
            </CardTitle>
            <CardDescription>Complete history of your account activity</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search and Stats */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <Activity className="inline h-4 w-4 mr-1" />
            {total.toLocaleString()} total events
          </div>
        </div>

        {/* Events List */}
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-3">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchQuery ? 'No events match your search' : 'No activity recorded yet'}
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="text-2xl flex-shrink-0">{getEventIcon(event.action)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-xs ${getActionColor(event.action)}`}>
                        {internalValueLabel(event.action)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Monitor className="h-3 w-3" />
                        {event.device}
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Access detail: {event.ipHash ? 'Protected' : 'Not recorded'}
                      </div>
                    </div>

                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                          More information
                        </summary>
                        <dl className="mt-2 grid gap-1 rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
                          {Object.entries(event.metadata)
                            .slice(0, 6)
                            .map(([key, value]) => (
                              <div key={key} className="flex justify-between gap-3">
                                <dt className="text-gray-500 dark:text-gray-400">
                                  {internalValueLabel(key)}
                                </dt>
                                <dd className="text-right">{readableMetadataValue(value)}</dd>
                              </div>
                            ))}
                        </dl>
                      </details>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {offset + 1}-{Math.min(offset + LIMIT, total)} of {total}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={offset === 0}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <Button variant="outline" size="sm" onClick={handleNextPage} disabled={!hasMore}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 p-4 mt-4">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Your privacy and transparency
              </p>
              <p className="text-blue-800 dark:text-blue-200">
                This account history shows activity on your account. Access details are protected
                before storage, and you can download this information at any time.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
