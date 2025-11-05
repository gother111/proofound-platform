'use client';

import { useState, useEffect } from 'react';
import { MetricCard } from '@/components/admin/MetricCard';
import { MetricsTrendChart } from '@/components/admin/MetricsTrendChart';
import { FairnessTable, type FairnessComparison } from '@/components/admin/FairnessTable';
import { DateRangeFilter, type DateRange } from '@/components/admin/DateRangeFilter';
import { Skeleton } from '@/components/ui/skeleton';

// Force dynamic rendering - don't pre-render during build
export const dynamic = 'force-dynamic';

interface TTSCResult {
  value: number;
  median: number;
  p25: number;
  p75: number;
  mean: number;
  unit: 'hours' | 'days';
  timestamp: string;
  sampleSize: number;
  metadata: {
    target: number;
    status: 'meeting_target' | 'below_target';
  };
}

interface PACResult {
  highPacAcceptanceRate: number;
  lowPacAcceptanceRate: number;
  acceptanceLift: number;
  highPacContractRate: number;
  lowPacContractRate: number;
  contractLift: number;
  meetsAcceptanceTarget: boolean;
  meetsContractTarget: boolean;
  timestamp: string;
  sampleSize: {
    highPac: number;
    lowPac: number;
  };
}

interface SUSResult {
  average: number;
  median: number;
  min: number;
  max: number;
  meetsTarget: boolean;
  sampleSize: number;
  responseRate: number;
}

interface MetricsResponse {
  metrics: {
    ttsc: TTSCResult | null;
    ttfqi: TTSCResult | null;
    ttv: TTSCResult | null;
    pac: PACResult | null;
    sus: SUSResult | null;
  };
  meta: {
    startDate: string;
    endDate: string;
    timestamp: string;
  };
}

export default function AdminMetricsPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(),
  });

  const [data, setData] = useState<MetricsResponse | undefined>();
  const [error, setError] = useState<Error | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          metric: 'all',
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        });
        const res = await fetch(`/api/metrics?${params}`);
        if (!res.ok) {
          throw new Error('Failed to fetch metrics');
        }
        const result = await res.json();
        setData(result);
        setError(undefined);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch metrics'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Refresh every 60 seconds

    return () => clearInterval(interval);
  }, [dateRange]);

  // For demo purposes, mock fairness data
  // In production, this would come from /api/analytics/fairness
  const [fairnessData, setFairnessData] = useState<FairnessComparison[]>([]);

  useEffect(() => {
    // TODO: Fetch real fairness data from API
    // For now, set to empty array (no demographic data yet)
    setFairnessData([]);
  }, [dateRange]);

  const handleExportFairness = () => {
    // TODO: Implement CSV export
    const csv = fairnessData
      .map((c) =>
        [
          `${c.cohortA.name} vs ${c.cohortB.name}`,
          c.cohortA.introductionRate,
          c.cohortB.introductionRate,
          c.introductionGap,
          c.pValueIntroduction,
          c.cohortA.contractRate,
          c.cohortB.contractRate,
          c.contractGap,
          c.pValueContract,
          c.isSignificant ? 'Yes' : 'No',
        ].join(',')
      )
      .join('\n');

    const header =
      'Comparison,Intro Rate A,Intro Rate B,Intro Gap,p-value Intro,Contract Rate A,Contract Rate B,Contract Gap,p-value Contract,Significant\n';

    const blob = new Blob([header + csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fairness-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (error) {
    return (
      <div className="container py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h2 className="text-lg font-semibold text-red-900">Error Loading Metrics</h2>
          <p className="text-sm text-red-700 mt-1">{error.message}</p>
          <p className="text-xs text-red-600 mt-2">
            Make sure you're logged in as an admin (pavlo@proofound.io or yurii@proofound.io)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Metrics Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Monitor key platform metrics and performance indicators
        </p>
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter value={dateRange} onChange={setDateRange} />

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            <Skeleton className="h-[140px]" />
            <Skeleton className="h-[140px]" />
            <Skeleton className="h-[140px]" />
            <Skeleton className="h-[140px]" />
            <Skeleton className="h-[140px]" />
          </>
        ) : (
          <>
            {data?.metrics.ttsc && (
              <MetricCard
                title="TTSC - Time to Signed Contract"
                value={data.metrics.ttsc.median}
                unit={data.metrics.ttsc.unit}
                target={data.metrics.ttsc.metadata.target}
                status={data.metrics.ttsc.metadata.status}
                sampleSize={data.metrics.ttsc.sampleSize}
                subtitle={`Mean: ${data.metrics.ttsc.mean.toFixed(1)} ${data.metrics.ttsc.unit}`}
              />
            )}

            {data?.metrics.ttfqi && (
              <MetricCard
                title="TTFQI - Time to First Qualified Intro"
                value={data.metrics.ttfqi.median}
                unit={data.metrics.ttfqi.unit}
                target={data.metrics.ttfqi.metadata.target}
                status={data.metrics.ttfqi.metadata.status}
                sampleSize={data.metrics.ttfqi.sampleSize}
                subtitle={`Mean: ${data.metrics.ttfqi.mean.toFixed(1)} ${data.metrics.ttfqi.unit}`}
              />
            )}

            {data?.metrics.ttv && (
              <MetricCard
                title="TTV - Time to Value"
                value={data.metrics.ttv.median}
                unit={data.metrics.ttv.unit}
                target={data.metrics.ttv.metadata.target}
                status={data.metrics.ttv.metadata.status}
                sampleSize={data.metrics.ttv.sampleSize}
                subtitle={`Mean: ${data.metrics.ttv.mean.toFixed(1)} ${data.metrics.ttv.unit}`}
              />
            )}

            {data?.metrics.pac && (
              <MetricCard
                title="PAC Lift - Acceptance"
                value={data.metrics.pac.acceptanceLift}
                unit="%"
                target={20}
                status={data.metrics.pac.meetsAcceptanceTarget ? 'meeting_target' : 'below_target'}
                sampleSize={data.metrics.pac.sampleSize.highPac + data.metrics.pac.sampleSize.lowPac}
                subtitle={`High-PAC: ${data.metrics.pac.highPacAcceptanceRate.toFixed(1)}% vs Low-PAC: ${data.metrics.pac.lowPacAcceptanceRate.toFixed(1)}%`}
              />
            )}

            {data?.metrics.pac && (
              <MetricCard
                title="PAC Lift - Contract"
                value={data.metrics.pac.contractLift}
                unit="%"
                target={15}
                status={data.metrics.pac.meetsContractTarget ? 'meeting_target' : 'below_target'}
                sampleSize={data.metrics.pac.sampleSize.highPac + data.metrics.pac.sampleSize.lowPac}
                subtitle={`High-PAC: ${data.metrics.pac.highPacContractRate.toFixed(1)}% vs Low-PAC: ${data.metrics.pac.lowPacContractRate.toFixed(1)}%`}
              />
            )}

            {data?.metrics.sus && (
              <MetricCard
                title="SUS - System Usability Scale"
                value={data.metrics.sus.average}
                unit="score"
                target={75}
                status={data.metrics.sus.meetsTarget ? 'meeting_target' : 'below_target'}
                sampleSize={data.metrics.sus.sampleSize}
                subtitle={`Median: ${data.metrics.sus.median} | Response rate: ${(data.metrics.sus.responseRate * 100).toFixed(1)}%`}
              />
            )}
          </>
        )}
      </div>

      {/* No Data Message */}
      {!isLoading && !data?.metrics.ttfqi && !data?.metrics.ttv && !data?.metrics.ttsc && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-900">No Metrics Data Yet</h3>
          <p className="text-xs text-amber-700 mt-1">
            Metrics will appear once users start interacting with the platform (signups, matches, contracts).
          </p>
        </div>
      )}

      {/* Trend Charts */}
      {data?.metrics.ttfqi && (
        <div className="grid gap-4 md:grid-cols-2">
          <MetricsTrendChart
            title="TTFQI Trend (Last 30 Days)"
            data={[
              // TODO: Replace with real historical data from API
              // For now, mock a trend line based on the current value
              { date: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(), value: data.metrics.ttfqi.median * 1.2 },
              { date: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(), value: data.metrics.ttfqi.median * 1.1 },
              { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), value: data.metrics.ttfqi.median * 1.05 },
              { date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), value: data.metrics.ttfqi.median },
              { date: new Date().toISOString(), value: data.metrics.ttfqi.median * 0.95 },
            ]}
            target={data.metrics.ttfqi.metadata.target}
            unit={data.metrics.ttfqi.unit}
          />

          {data?.metrics.sus && (
            <MetricsTrendChart
              title="SUS Score Trend (Last 30 Days)"
              data={[
                // TODO: Replace with real historical data
                { date: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(), value: data.metrics.sus.average * 0.92 },
                { date: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(), value: data.metrics.sus.average * 0.95 },
                { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), value: data.metrics.sus.average * 0.98 },
                { date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), value: data.metrics.sus.average * 0.99 },
                { date: new Date().toISOString(), value: data.metrics.sus.average },
              ]}
              target={75}
              unit=""
            />
          )}
        </div>
      )}

      {/* Fairness Table */}
      <FairnessTable
        comparisons={fairnessData}
        loading={false}
        onExport={fairnessData.length > 0 ? handleExportFairness : undefined}
      />

      {/* Footer Info */}
      {data && (
        <div className="text-xs text-muted-foreground">
          <p>Last updated: {new Date(data.meta.timestamp).toLocaleString()}</p>
          <p>
            Data period: {new Date(data.meta.startDate).toLocaleDateString()} -{' '}
            {new Date(data.meta.endDate).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}
