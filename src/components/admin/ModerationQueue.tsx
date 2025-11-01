'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  AlertCircle,
  Ban,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';

interface ContentReport {
  id: string;
  content_type: string;
  content_id: string;
  reason: string;
  details: string | null;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  reporter: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url: string | null;
  };
  content: any;
}

const priorityColors = {
  critical: 'bg-red-600',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-gray-400',
};

const reasonLabels: Record<string, string> = {
  spam: 'Spam',
  harassment: 'Harassment',
  inappropriate_content: 'Inappropriate Content',
  false_information: 'False Information',
  impersonation: 'Impersonation',
  other: 'Other',
};

export function ModerationQueue() {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionNote, setActionNote] = useState('');
  const [suspensionDuration, setSuspensionDuration] = useState(7);

  // Fetch reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/moderation/queue?status=${selectedStatus}&limit=50`);

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data.reports || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load moderation queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  // Take action on report
  const handleAction = async (
    action: 'approve' | 'dismiss' | 'delete_content' | 'warn_user' | 'suspend_user'
  ) => {
    if (!selectedReport) return;

    try {
      setActionLoading(true);

      const response = await fetch('/api/admin/moderation/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId: selectedReport.id,
          action,
          note: actionNote || undefined,
          duration: action === 'suspend_user' ? suspensionDuration : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to take action');
      }

      toast.success('Action completed successfully');
      setSelectedReport(null);
      setActionNote('');
      fetchReports(); // Refresh list
    } catch (error) {
      console.error('Error taking action:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to take action');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.in_review || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Moderation Queue</CardTitle>
          <CardDescription>Review and take action on reported content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={fetchReports} variant="outline" size="sm">
              Refresh
            </Button>
          </div>

          {/* Reports List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No reports found</div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card
                  key={report.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedReport(report)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={priorityColors[report.priority]}>
                            {report.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{report.content_type}</Badge>
                          <Badge variant="outline">{reasonLabels[report.reason]}</Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">
                          Reported by <strong>@{report.reporter.handle}</strong> on{' '}
                          {format(new Date(report.created_at), 'MMM d, yyyy HH:mm')}
                        </p>

                        {report.details && <p className="text-sm">{report.details}</p>}
                      </div>

                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Report</DialogTitle>
            <DialogDescription>Take action on this content report</DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              {/* Report Details */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={priorityColors[selectedReport.priority]}>
                    {selectedReport.priority.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">{selectedReport.content_type}</Badge>
                </div>
                <p>
                  <strong>Reason:</strong> {reasonLabels[selectedReport.reason]}
                </p>
                {selectedReport.details && (
                  <p>
                    <strong>Details:</strong> {selectedReport.details}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Reported by @{selectedReport.reporter.handle} on{' '}
                  {format(new Date(selectedReport.created_at), 'MMM d, yyyy HH:mm')}
                </p>
              </div>

              {/* Content Preview */}
              {selectedReport.content && (
                <div className="bg-background border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Content Preview</h4>
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(selectedReport.content, null, 2)}
                  </pre>
                </div>
              )}

              {/* Admin Note */}
              <div className="space-y-2">
                <label htmlFor="admin-note" className="text-sm font-medium">
                  Admin Note (Optional)
                </label>
                <Textarea
                  id="admin-note"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Add internal notes about this decision..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleAction('approve')}
                  disabled={actionLoading}
                  variant="outline"
                  className="w-full"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve (No Action)
                </Button>

                <Button
                  onClick={() => handleAction('dismiss')}
                  disabled={actionLoading}
                  variant="outline"
                  className="w-full"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Dismiss Report
                </Button>

                <Button
                  onClick={() => handleAction('delete_content')}
                  disabled={actionLoading}
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Content
                </Button>

                <Button
                  onClick={() => handleAction('warn_user')}
                  disabled={actionLoading}
                  variant="outline"
                  className="w-full"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Warn User
                </Button>

                <Button
                  onClick={() => handleAction('suspend_user')}
                  disabled={actionLoading}
                  variant="destructive"
                  className="w-full col-span-2"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Suspend User ({suspensionDuration} days)
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
