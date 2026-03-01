/**
 * Performance Dashboard Component
 *
 * Displays Web Vitals and dashboard load time metrics for admins
 * PRD Reference: Part 8 NFR - Performance Monitoring
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  TrendingDown,
  TrendingUp,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { apiFetch } from '@/lib/api/fetch';

interface WebVitalMetric {
  metric_name: string;
  sample_count: number;
  avg_value: number;
  p50: number;
  p75: number;
  p95: number;
  good_count: number;
  needs_improvement_count: number;
  poor_count: number;
}

const METRIC_INFO = {
  LCP: {
    name: 'Largest Contentful Paint',
    description: 'Measures loading performance',
    threshold: 2500,
    unit: 'ms',
  },
  FID: {
    name: 'First Input Delay',
    description: 'Measures interactivity',
    threshold: 100,
    unit: 'ms',
  },
  CLS: {
    name: 'Cumulative Layout Shift',
    description: 'Measures visual stability',
    threshold: 0.1,
    unit: '',
  },
  FCP: {
    name: 'First Contentful Paint',
    description: 'Measures initial render',
    threshold: 1800,
    unit: 'ms',
  },
  TTFB: {
    name: 'Time to First Byte',
    description: 'Measures server response',
    threshold: 600,
    unit: 'ms',
  },
};

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<WebVitalMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState(7);

  const loadMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch(`/api/analytics/web-vitals?days=${days}`);

      if (!response.ok) {
        throw new Error('Failed to load metrics');
      }

      const data = await response.json();
      setMetrics(data.metrics || []);
    } catch (error) {
      console.error('performance.dashboard.load.failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const getRatingColor = (metric: WebVitalMetric) => {
    const info = METRIC_INFO[metric.metric_name as keyof typeof METRIC_INFO];
    if (!info) return 'text-muted-foreground';

    if (metric.metric_name === 'CLS') {
      return metric.p75 <= info.threshold ? 'text-green-600' : 'text-red-600';
    }

    return metric.p75 <= info.threshold ? 'text-green-600' : 'text-red-600';
  };

  const getHealthIcon = (metric: WebVitalMetric) => {
    const goodPercentage = (metric.good_count / metric.sample_count) * 100;

    if (goodPercentage >= 75) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }

    if (goodPercentage >= 50) {
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }

    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  };

  const formatValue = (metricName: string, value: number) => {
    if (metricName === 'CLS') {
      return value.toFixed(3);
    }
    return `${Math.round(value)}ms`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Monitoring</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Core Web Vitals and dashboard load times
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={days === 7 ? 'default' : 'outline'} size="sm" onClick={() => setDays(7)}>
            7 Days
          </Button>
          <Button
            variant={days === 30 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDays(30)}
          >
            30 Days
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => {
          const info = METRIC_INFO[metric.metric_name as keyof typeof METRIC_INFO];
          if (!info) return null;

          const goodPercentage = (metric.good_count / metric.sample_count) * 100;

          return (
            <Card key={metric.metric_name}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getHealthIcon(metric)}
                    <CardTitle className="text-base">{metric.metric_name}</CardTitle>
                  </div>
                  <Badge
                    variant={goodPercentage >= 75 ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {Math.round(goodPercentage)}% good
                  </Badge>
                </div>
                <CardDescription className="text-xs">{info.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Main Metric */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">75th Percentile (P75)</p>
                  <p className={`text-2xl font-bold ${getRatingColor(metric)}`}>
                    {formatValue(metric.metric_name, metric.p75)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Target: {formatValue(metric.metric_name, info.threshold)}
                  </p>
                </div>

                {/* Distribution */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">P50</span>
                    <span className="font-mono">{formatValue(metric.metric_name, metric.p50)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">P95</span>
                    <span className="font-mono">{formatValue(metric.metric_name, metric.p95)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Samples</span>
                    <span className="font-mono">{metric.sample_count.toLocaleString()}</span>
                  </div>
                </div>

                {/* Rating Breakdown */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-green-600" />
                    <span className="text-muted-foreground">Good:</span>
                    <span className="font-mono">{metric.good_count}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-yellow-600" />
                    <span className="text-muted-foreground">Needs Work:</span>
                    <span className="font-mono">{metric.needs_improvement_count}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-red-600" />
                    <span className="text-muted-foreground">Poor:</span>
                    <span className="font-mono">{metric.poor_count}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>Overall health of Core Web Vitals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium">Excellent Metrics</p>
              </div>
              <p className="text-3xl font-bold">
                {
                  metrics.filter((m) => {
                    const goodPct = (m.good_count / m.sample_count) * 100;
                    return goodPct >= 75;
                  }).length
                }
              </p>
              <p className="text-xs text-muted-foreground mt-1">≥75% good ratings</p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm font-medium">Needs Attention</p>
              </div>
              <p className="text-3xl font-bold">
                {
                  metrics.filter((m) => {
                    const goodPct = (m.good_count / m.sample_count) * 100;
                    return goodPct >= 50 && goodPct < 75;
                  }).length
                }
              </p>
              <p className="text-xs text-muted-foreground mt-1">50-75% good ratings</p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <p className="text-sm font-medium">Critical Issues</p>
              </div>
              <p className="text-3xl font-bold">
                {
                  metrics.filter((m) => {
                    const goodPct = (m.good_count / m.sample_count) * 100;
                    return goodPct < 50;
                  }).length
                }
              </p>
              <p className="text-xs text-muted-foreground mt-1">&lt;50% good ratings</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
