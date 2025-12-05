/**
 * Admin Cron Status
 *
 * Shows latest cron outputs (fairness note/report) and live health status.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

type FairnessNoteSummary = {
  id: string;
  releaseVersion: string;
  generatedAt: string | null;
  hasSignificantGaps: boolean;
  findings: number;
} | null;

type FairnessReportSummary = {
  id: string;
  releaseVersion: string;
  createdAt: string | null;
} | null;

type HealthSummary = {
  status: string;
  statusCode: number;
  durationMs?: number;
  warningCount?: number;
  unhealthyCount?: number;
  error?: string;
};

type CronSummaryResponse = {
  success: boolean;
  data?: {
    fairnessNote: FairnessNoteSummary;
    fairnessReport: FairnessReportSummary;
    health: HealthSummary;
  };
};

export default function AdminCronPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fairnessNote, setFairnessNote] = useState<FairnessNoteSummary>(null);
  const [fairnessReport, setFairnessReport] = useState<FairnessReportSummary>(null);
  const [health, setHealth] = useState<HealthSummary | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/cron/summary', { cache: 'no-store' });
        const json: CronSummaryResponse = await res.json();
        if (!json.success) {
          setError('Failed to load cron summary');
          return;
        }
        setFairnessNote(json.data?.fairnessNote ?? null);
        setFairnessReport(json.data?.fairnessReport ?? null);
        setHealth(json.data?.health ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const d = new Date(value);
    return d.toLocaleString();
  };

  const healthBadge = () => {
    if (!health) return null;
    const status = health.status;
    let variant: 'default' | 'secondary' | 'destructive' = 'secondary';
    if (status === 'healthy') variant = 'default';
    else if (status === 'warning') variant = 'secondary';
    else if (status === 'unhealthy' || status === 'error') variant = 'destructive';
    return <Badge variant={variant}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-6">
        <p className="text-muted-foreground">Loading cron status…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cron Status</h1>
        <p className="text-muted-foreground">
          Latest cron outputs and live health signal (see README “Cron Ops” for schedules & auth)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Fairness Note</CardTitle>
              {fairnessNote ? (
                fairnessNote.hasSignificantGaps ? (
                  <Badge variant="destructive">Gaps detected</Badge>
                ) : (
                  <Badge variant="default">OK</Badge>
                )
              ) : (
                <Badge variant="secondary">No data</Badge>
              )}
            </div>
            <CardDescription>Source: /api/cron/fairness-note → fairnessNotes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Release: {fairnessNote?.releaseVersion ?? '—'}</p>
            <p className="text-sm text-muted-foreground">
              Generated: {formatDate(fairnessNote?.generatedAt ?? null)}
            </p>
            <p className="text-sm text-muted-foreground">
              Findings: {fairnessNote ? fairnessNote.findings : '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Fairness Report</CardTitle>
              {fairnessReport ? <Badge variant="default">Latest</Badge> : <Badge variant="secondary">No data</Badge>}
            </div>
            <CardDescription>Source: /api/cron/fairness-report → fairnessReports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Release: {fairnessReport?.releaseVersion ?? '—'}
            </p>
            <p className="text-sm text-muted-foreground">
              Created: {formatDate(fairnessReport?.createdAt ?? null)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Health Check</CardTitle>
            {healthBadge()}
          </div>
          <CardDescription>Live ping to /api/cron/health-check</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {health?.status === 'healthy' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : health?.status === 'warning' ? (
              <Clock className="h-4 w-4 text-yellow-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span>Status code: {health?.statusCode ?? '—'}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Duration: {health?.durationMs != null ? `${Math.round(health.durationMs)} ms` : '—'}
          </p>
          {health?.warningCount != null && (
            <p className="text-sm text-muted-foreground">Warnings: {health.warningCount}</p>
          )}
          {health?.unhealthyCount != null && (
            <p className="text-sm text-muted-foreground">Unhealthy checks: {health.unhealthyCount}</p>
          )}
          {health?.error && <p className="text-sm text-destructive">Error: {health.error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}

