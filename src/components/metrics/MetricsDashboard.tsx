'use client';

import { useEffect, useState } from 'react';

interface TTSCResult {
  median: number;
  p25: number;
  p75: number;
  mean: number;
  unit: 'days';
  sampleSize: number;
  metadata?: {
    target: number;
    status: string;
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

interface MetricsData {
  ttsc: TTSCResult | null;
  ttfqi: TTSCResult | null;
  ttv: TTSCResult | null;
  pac: PACResult | null;
  sus: SUSResult | null;
  timestamp: string;
}

export function MetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/metrics?metric=all');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch metrics');
      }

      const data = await response.json();
      setMetrics(data.metrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Metrics</h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchMetrics}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Platform Metrics</h2>
        <button
          onClick={fetchMetrics}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TTSC - Time to Signed Contract */}
        <MetricCard
          title="TTSC - Time to Signed Contract"
          target="≤30 days"
          metric={metrics?.ttsc}
          renderValue={(m) => (
            <>
              <div className="text-4xl font-bold">
                {m.median.toFixed(1)}
                <span className="text-xl text-gray-600 ml-2">days</span>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <span>P25: {m.p25.toFixed(1)}d</span>
                <span className="mx-2">•</span>
                <span>P75: {m.p75.toFixed(1)}d</span>
                <span className="mx-2">•</span>
                <span>n={m.sampleSize}</span>
              </div>
            </>
          )}
        />

        {/* TTFQI - Time to First Qualified Introduction */}
        <MetricCard
          title="TTFQI - Time to First Qualified Introduction"
          target="≤72 hours"
          metric={metrics?.ttfqi}
          renderValue={(m) => (
            <>
              <div className="text-4xl font-bold">
                {m.median.toFixed(1)}
                <span className="text-xl text-gray-600 ml-2">hours</span>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <span>P25: {m.p25.toFixed(1)}h</span>
                <span className="mx-2">•</span>
                <span>P75: {m.p75.toFixed(1)}h</span>
                <span className="mx-2">•</span>
                <span>n={m.sampleSize}</span>
              </div>
            </>
          )}
        />

        {/* TTV - Time to Value */}
        <MetricCard
          title="TTV - Time to Value"
          target="≤7 days"
          metric={metrics?.ttv}
          renderValue={(m) => (
            <>
              <div className="text-4xl font-bold">
                {m.median.toFixed(1)}
                <span className="text-xl text-gray-600 ml-2">days</span>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <span>P25: {m.p25.toFixed(1)}d</span>
                <span className="mx-2">•</span>
                <span>P75: {m.p75.toFixed(1)}d</span>
                <span className="mx-2">•</span>
                <span>n={m.sampleSize}</span>
              </div>
            </>
          )}
        />

        {/* PAC - Purpose-Alignment Contribution */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            PAC - Purpose-Alignment Contribution
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Target: ≥20% acceptance lift, ≥15% contract lift
          </p>

          {metrics?.pac ? (
            <>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-medium text-gray-700">Acceptance Lift</span>
                    <span
                      className={`text-2xl font-bold ${
                        metrics.pac.meetsAcceptanceTarget ? 'text-green-600' : 'text-amber-600'
                      }`}
                    >
                      +{metrics.pac.acceptanceLift.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    High PAC: {metrics.pac.highPacAcceptanceRate.toFixed(1)}% vs Low PAC:{' '}
                    {metrics.pac.lowPacAcceptanceRate.toFixed(1)}%
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-medium text-gray-700">Contract Lift</span>
                    <span
                      className={`text-2xl font-bold ${
                        metrics.pac.meetsContractTarget ? 'text-green-600' : 'text-amber-600'
                      }`}
                    >
                      +{metrics.pac.contractLift.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    High PAC: {metrics.pac.highPacContractRate.toFixed(1)}% vs Low PAC:{' '}
                    {metrics.pac.lowPacContractRate.toFixed(1)}%
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200 text-xs text-gray-600">
                  Sample: {metrics.pac.sampleSize.highPac} high PAC matches,{' '}
                  {metrics.pac.sampleSize.lowPac} low PAC matches
                </div>
              </div>
            </>
          ) : (
            <div className="text-gray-500 italic">No data available</div>
          )}
        </div>

        {/* SUS - System Usability Scale */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">SUS - System Usability Scale</h3>
          <p className="text-sm text-gray-600 mb-4">Target: ≥75 (Good usability)</p>

          {metrics?.sus ? (
            <>
              <div className="space-y-4">
                <div>
                  <div className="text-4xl font-bold">
                    <span className={metrics.sus.meetsTarget ? 'text-green-600' : 'text-amber-600'}>
                      {metrics.sus.average.toFixed(1)}
                    </span>
                    <span className="text-xl text-gray-600 ml-2">/ 100</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <span>Median: {metrics.sus.median.toFixed(1)}</span>
                    <span className="mx-2">•</span>
                    <span>
                      Range: {metrics.sus.min.toFixed(0)} - {metrics.sus.max.toFixed(0)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Sample size: {metrics.sus.sampleSize} surveys</span>
                    <span>Response rate: {(metrics.sus.responseRate * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="mt-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      metrics.sus.meetsTarget
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {metrics.sus.meetsTarget ? '✓ Meeting Target' : '⚠ Below Target'}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-gray-500 italic">No data available</div>
          )}
        </div>
      </div>

      {metrics?.timestamp && (
        <div className="text-sm text-gray-500 text-right">
          Last updated: {new Date(metrics.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  target: string;
  metric: TTSCResult | null | undefined;
  renderValue: (metric: TTSCResult) => React.ReactNode;
}

function MetricCard({ title, target, metric, renderValue }: MetricCardProps) {
  const meetsTarget = metric?.metadata?.status === 'meeting_target';

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">Target: {target}</p>

      {metric ? (
        <>
          <div className={meetsTarget ? 'text-green-600' : 'text-amber-600'}>
            {renderValue(metric)}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                meetsTarget ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {meetsTarget ? '✓ Meeting Target' : '⚠ Below Target'}
            </span>
          </div>
        </>
      ) : (
        <div className="text-gray-500 italic">No data available</div>
      )}
    </div>
  );
}
