/**
 * Metrics Dashboard Component
 *
 * Displays the 6 core PRD metrics:
 * 1. TTSC (Time-to-Signed-Contract) - North Star Metric
 * 2. TTFQI (Time-to-First Qualified Introduction)
 * 3. TTV (Time-to-Value)
 * 4. Well-Being Delta
 * 5. SUS (System Usability Scale)
 * 6. PAC Lift (Purpose-Alignment Contribution)
 *
 * PRD References:
 * - Part 2: Goals & Success Metrics
 * - Part 12: Acceptance Criteria
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Heart,
  ThumbsUp,
  Sparkles,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  TTSC_TARGET_DAYS,
  TTFQI_TARGET_HOURS,
  TTV_TARGET_DAYS,
  SUS_TARGET_SCORE,
  WELLBEING_DELTA_TARGET_PERCENT,
  PAC_LIFT_TARGET_PERCENT,
} from '@/lib/analytics/constants';

interface MetricsData {
  ttsc: {
    median: number | null;
    p75: number | null;
    count: number;
    targetMet: boolean;
  };
  ttfqi: {
    median: number | null;
    p75: number | null;
    count: number;
    targetMet: boolean;
  };
  ttv: {
    median: number | null;
    p75: number | null;
    count: number;
    targetMet: boolean;
  };
  wellbeing: {
    improvementRate: number | null;
    targetMet: boolean;
    sampleSize: number;
  };
  sus: {
    average: number | null;
    targetMet: boolean;
    responseCount: number;
  };
  pac: {
    topDecileLift: number | null;
    targetMet: boolean;
    sampleSize: number;
  };
}

export function MetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadMetrics();
    // Refresh every 5 minutes
    const interval = setInterval(loadMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/admin/metrics/overview');

      if (!response.ok) {
        throw new Error('Failed to load metrics');
      }

      const data = await response.json();
      setMetrics(data.metrics);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load metrics:', error);
      toast.error('Failed to load metrics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Activity className="h-8 w-8 text-muted-foreground animate-spin" />
            <span className="ml-2 text-muted-foreground">Loading metrics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            No metrics data available yet
          </div>
        </CardContent>
      </Card>
    );
  }

  const MetricCard = ({
    title,
    value,
    target,
    unit,
    targetMet,
    count,
    icon: Icon,
    description,
  }: {
    title: string;
    value: number | null;
    target: number;
    unit: string;
    targetMet: boolean;
    count: number;
    icon: React.ElementType;
    description: string;
  }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-5 w-5 text-proofound-forest" />
              <h3 className="font-semibold text-foreground">{title}</h3>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          {value !== null && (
            <div
              className={`px-2 py-1 rounded text-xs font-medium ${
                targetMet ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {targetMet ? '✓ Target Met' : '⚠ Below Target'}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">
                {value !== null ? value.toFixed(value < 10 ? 1 : 0) : '—'}
              </span>
              <span className="text-sm text-muted-foreground">{unit}</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">
                Target: {target}
                {unit}
              </span>
              {value !== null &&
                (targetMet ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-amber-600" />
                ))}
            </div>
          </div>

          <div className="pt-2 border-t border-proofound-stone">
            <p className="text-xs text-muted-foreground">
              Sample size: <span className="font-medium text-foreground">{count}</span>
              {value === null && ' (insufficient data)'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Core Metrics (PRD Part 2)</h2>
          <p className="text-sm text-muted-foreground mt-1">
            North Star Metric and success indicators per Product Requirements
          </p>
        </div>
        {lastUpdated && (
          <div className="text-xs text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* North Star Metric - TTSC */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          North Star Metric
        </h3>
        <MetricCard
          title="TTSC (Time-to-Signed-Contract)"
          value={metrics.ttsc.median}
          target={TTSC_TARGET_DAYS}
          unit=" days"
          targetMet={metrics.ttsc.targetMet}
          count={metrics.ttsc.count}
          icon={Target}
          description="Median time from profile activation to signed contract"
        />
      </div>

      {/* Outcome Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Outcome Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            title="TTFQI"
            value={metrics.ttfqi.median}
            target={TTFQI_TARGET_HOURS}
            unit=" hours"
            targetMet={metrics.ttfqi.targetMet}
            count={metrics.ttfqi.count}
            icon={Clock}
            description="Time to first qualified introduction"
          />

          <MetricCard
            title="TTV"
            value={metrics.ttv.median}
            target={TTV_TARGET_DAYS}
            unit=" days"
            targetMet={metrics.ttv.targetMet}
            count={metrics.ttv.count}
            icon={TrendingUp}
            description="Time to first interview scheduled"
          />

          <MetricCard
            title="Well-Being Delta"
            value={metrics.wellbeing.improvementRate}
            target={WELLBEING_DELTA_TARGET_PERCENT}
            unit="%"
            targetMet={metrics.wellbeing.targetMet}
            count={metrics.wellbeing.sampleSize}
            icon={Heart}
            description="Users showing improvement in stress/control"
          />
        </div>
      </div>

      {/* Quality Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Quality Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricCard
            title="SUS Score"
            value={metrics.sus.average}
            target={SUS_TARGET_SCORE}
            unit=" / 100"
            targetMet={metrics.sus.targetMet}
            count={metrics.sus.responseCount}
            icon={ThumbsUp}
            description="System Usability Scale (industry standard)"
          />

          <MetricCard
            title="PAC Lift"
            value={metrics.pac.topDecileLift}
            target={PAC_LIFT_TARGET_PERCENT}
            unit="% higher"
            targetMet={metrics.pac.targetMet}
            count={metrics.pac.sampleSize}
            icon={Sparkles}
            description="Intro acceptance lift from purpose alignment"
          />
        </div>
      </div>

      {/* Additional Context */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metrics Context</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-foreground">P75 Values:</span>
              <ul className="mt-1 space-y-1 text-muted-foreground ml-4">
                <li>• TTSC P75: {metrics.ttsc.p75?.toFixed(0) || '—'} days</li>
                <li>• TTFQI P75: {metrics.ttfqi.p75?.toFixed(0) || '—'} hours</li>
                <li>• TTV P75: {metrics.ttv.p75?.toFixed(0) || '—'} days</li>
              </ul>
            </div>
            <div className="pt-3 border-t border-proofound-stone">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> Metrics are calculated from analytics events and cached for 1
                hour. All targets are defined in PRD Part 2: Goals & Success Metrics.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
