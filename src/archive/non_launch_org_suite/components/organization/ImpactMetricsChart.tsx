'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Target, Award } from 'lucide-react';

interface ImpactMetric {
  name: string;
  value: string;
  unit: string;
}

interface ImpactEntry {
  id?: string;
  title: string;
  description: string;
  metrics: ImpactMetric[];
  beneficiaries?: string;
  timeframe: string;
  artifacts?: string[];
  createdAt?: string;
}

interface ImpactMetricsChartProps {
  entries: ImpactEntry[];
}

export function ImpactMetricsChart({ entries }: ImpactMetricsChartProps) {
  if (entries.length === 0) {
    return (
      <Card className="border-proofound-stone dark:border-border">
        <CardContent className="p-12">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No impact data to visualize yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Aggregate metrics across all entries
  const allMetrics = entries.flatMap((entry) => entry.metrics);

  // Count total metrics and entries
  const totalMetrics = allMetrics.length;
  const totalEntries = entries.length;

  // Get unique metric types
  const uniqueMetricNames = Array.from(new Set(allMetrics.map((m) => m.name)));

  // Calculate some sample stats
  const recentEntry = entries
    .filter((entry) => entry.createdAt)
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())[0];

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-proofound-stone dark:border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-proofound-forest/10">
                <Award className="h-5 w-5 text-proofound-forest" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalEntries}</p>
                <p className="text-sm text-muted-foreground">Impact Entries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-proofound-stone dark:border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-proofound-sage/10">
                <Target className="h-5 w-5 text-proofound-sage" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalMetrics}</p>
                <p className="text-sm text-muted-foreground">Total Metrics</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-proofound-stone dark:border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-proofound-terracotta/10">
                <TrendingUp className="h-5 w-5 text-proofound-terracotta" />
              </div>
              <div>
                <p className="text-2xl font-bold">{uniqueMetricNames.length}</p>
                <p className="text-sm text-muted-foreground">Metric Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Impact */}
      {recentEntry && (
        <Card className="border-proofound-stone dark:border-border">
          <CardHeader>
            <CardTitle className="text-base font-medium">Most Recent Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold">{recentEntry.title}</h4>
                <p className="text-sm text-muted-foreground">{recentEntry.timeframe}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentEntry.metrics.slice(0, 4).map((metric, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-muted/30 border border-muted-foreground/10"
                  >
                    <p className="text-xs text-muted-foreground mb-1">{metric.name}</p>
                    <p className="text-lg font-bold">
                      {metric.value} <span className="text-sm font-normal">{metric.unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline View */}
      <Card className="border-proofound-stone dark:border-border">
        <CardHeader>
          <CardTitle className="text-base font-medium">Impact Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {entries
              .filter((entry) => entry.createdAt && entry.id)
              .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
              .map((entry) => (
                <div
                  key={entry.id!}
                  className="flex gap-4 pb-4 border-b last:border-b-0 border-muted-foreground/10"
                >
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-proofound-forest" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="font-medium text-sm">{entry.title}</h5>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {entry.timeframe}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {entry.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {entry.metrics.slice(0, 3).map((metric, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-muted"
                        >
                          {metric.value} {metric.unit}
                        </span>
                      ))}
                      {entry.metrics.length > 3 && (
                        <span className="text-xs text-muted-foreground px-2 py-1">
                          +{entry.metrics.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
