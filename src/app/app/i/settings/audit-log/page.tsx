/**
 * Purpose Edit Audit Log Viewer
 *
 * Displays timeline of changes to mission, vision, values, and causes
 * User-accessible for transparency and accountability
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Calendar, Clock } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  fieldName: 'mission' | 'vision' | 'values' | 'causes';
  oldValue: string | string[] | null;
  newValue: string | string[];
  changedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export default function AuditLogPage() {
  const [history, setHistory] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const url =
        filter === 'all'
          ? '/api/user/audit-log/purpose'
          : `/api/user/audit-log/purpose?field=${filter}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Error fetching audit log:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const getFieldBadgeColor = (field: string) => {
    switch (field) {
      case 'mission':
        return 'bg-blue-100 text-blue-800';
      case 'vision':
        return 'bg-purple-100 text-purple-800';
      case 'values':
        return 'bg-green-100 text-green-800';
      case 'causes':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatValue = (value: string | string[] | null): string => {
    if (value === null) return '(empty)';
    if (Array.isArray(value)) {
      return value.join(', ') || '(empty)';
    }
    return value || '(empty)';
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading audit log...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Purpose Edit History</h1>
          <p className="text-muted-foreground">
            Track all changes to your mission, vision, values, and causes
          </p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by field" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fields</SelectItem>
            <SelectItem value="mission">Mission</SelectItem>
            <SelectItem value="vision">Vision</SelectItem>
            <SelectItem value="values">Values</SelectItem>
            <SelectItem value="causes">Causes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {history.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center min-h-[300px]">
            <div className="text-center space-y-2">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">No edit history yet</p>
              <p className="text-sm text-muted-foreground">
                Changes to your purpose fields will appear here
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {history.map((entry) => (
              <Card key={entry.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getFieldBadgeColor(entry.fieldName)}>
                        {entry.fieldName.toUpperCase()}
                      </Badge>
                      <CardTitle className="text-base">Field Updated</CardTitle>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(entry.changedAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(entry.changedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <CardDescription>Change #{entry.id.slice(0, 8)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Previous Value</p>
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm">{formatValue(entry.oldValue)}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">New Value</p>
                      <div className="p-3 bg-muted rounded-md border-l-4 border-green-500">
                        <p className="text-sm">{formatValue(entry.newValue)}</p>
                      </div>
                    </div>
                  </div>
                  {entry.ipAddress && (
                    <p className="text-xs text-muted-foreground">IP: {entry.ipAddress}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      <div className="text-sm text-muted-foreground">
        <p>
          This audit log is append-only and immutable for accountability. All changes are
          permanently recorded.
        </p>
        <p className="mt-2">Total entries: {history.length}</p>
      </div>
    </div>
  );
}
