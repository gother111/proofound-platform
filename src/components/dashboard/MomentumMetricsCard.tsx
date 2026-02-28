/**
 * Momentum Metrics Tile
 *
 * Shows TTFQI, TTV, TTSC trends with targets.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api/fetch';
import { TrendingUp, Gauge, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { DASHBOARD_STATUS_CHIP_CLASS } from '@/components/dashboard/chipStyles';

type MetricRow = {
  metric: string;
  value: number;
  unit: string;
  target: number;
  onTrack: boolean;
};

type MetricsResponse = {
  metrics?: {
    ttfqi?: MetricRow;
    ttv?: MetricRow;
    ttsc?: MetricRow;
  };
};

type MomentumMetricsCardProps = {
  useMockData?: boolean;
};

export function MomentumMetricsCard({ useMockData }: MomentumMetricsCardProps) {
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (useMockData) {
      setMetrics([
        { metric: 'TTFQI', value: 48, unit: 'hours', target: 72, onTrack: true },
        { metric: 'TTV', value: 6, unit: 'days', target: 7, onTrack: true },
        { metric: 'TTSC', value: 22, unit: 'days', target: 30, onTrack: true },
      ]);
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const response = await apiFetch('/api/metrics?metric=all');
        if (!response.ok) throw new Error('Failed to fetch metrics');
        const json = (await response.json()) as MetricsResponse;
        const rows: MetricRow[] = [];
        if (json.metrics?.ttfqi) rows.push(json.metrics.ttfqi);
        if (json.metrics?.ttv) rows.push(json.metrics.ttv);
        if (json.metrics?.ttsc) rows.push(json.metrics.ttsc);
        setMetrics(rows);
      } catch (error) {
        console.error(error);
        setMetrics([
          { metric: 'TTFQI', value: 0, unit: 'hours', target: 72, onTrack: false },
          { metric: 'TTV', value: 0, unit: 'days', target: 7, onTrack: false },
          { metric: 'TTSC', value: 0, unit: 'days', target: 30, onTrack: false },
        ]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [useMockData]);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gauge className="h-5 w-5 text-[#1C4D3A]" />
            Momentum Metrics
          </CardTitle>
          <p className="text-sm text-muted-foreground">Core PRD metrics: TTFQI, TTV, TTSC.</p>
        </div>
        <Badge variant="outline" className={DASHBOARD_STATUS_CHIP_CLASS}>
          Weekly
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {metrics.map((metric) => (
            <div
              key={metric.metric}
              className="flex items-center justify-between rounded-lg border border-[#E8E6DD] px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-[#2D3330]">{metric.metric}</p>
                <p className="text-xs text-muted-foreground">
                  Target ≤ {metric.target} {metric.unit}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-[#2D3330]">
                  {loading ? '—' : metric.value}
                  <span className="text-xs text-muted-foreground ml-1">{metric.unit}</span>
                </span>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    metric.onTrack ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {metric.onTrack ? 'On track' : 'Watch'}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/app/i/home"
          className="flex items-center justify-between rounded-lg border border-[#E8E6DD] px-3 py-2 hover:border-[#1C4D3A] hover:bg-[#F7F6F1] text-sm"
        >
          <span className="text-[#2D3330]">View analytics dashboard</span>
          <TrendingUp className="h-4 w-4 text-[#9B9891]" />
        </Link>

        <p className="text-xs text-muted-foreground">
          Baseline vs target appears by week two; sampled per PRD cohorts.
        </p>

        <Link
          href="/app/i/home"
          className="flex items-center justify-center gap-2 text-xs text-[#1C4D3A] font-medium hover:underline"
        >
          Refresh metrics
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
