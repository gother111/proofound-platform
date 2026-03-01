/**
 * Metrics Dashboard Component
 *
 * Real-time dashboard showing all PRD metrics:
 * - TTFQI (Time to First Qualified Introduction)
 * - TTV (Time to Video Interview)
 * - TTSC (Time to Signed Contract)
 * - PAC Lift (Purpose-Alignment Contribution)
 * - SUS (System Usability Scale)
 * - Well-Being Delta
 *
 * PRD Reference: Part 7 - Metrics Instrumentation
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Heart,
  Users,
  Target,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api/fetch';

interface MetricsData {
  ttfqi: {
    value: number;
    target: number;
    onTrack: boolean;
    percentile: { p50: number; p75: number; p90: number };
    sampleSize: number;
  };
  ttv: {
    value: number;
    target: number;
    onTrack: boolean;
    percentile: { p50: number; p75: number; p90: number };
    sampleSize: number;
  };
  ttsc: {
    value: number;
    target: number;
    onTrack: boolean;
    percentile: { p50: number; p75: number; p90: number };
    sampleSize: number;
  };
  pacLift: {
    withPAC: number;
    withoutPAC: number;
    lift: number;
    targetLift: number;
    onTrack: boolean;
    sampleSize: { withPAC: number; withoutPAC: number };
  };
  sus: {
    value: number;
    target: number;
    onTrack: boolean;
    responses: number;
  };
  wellBeingDelta: {
    averageDelta: number;
    positiveChange: number;
    target: number;
    onTrack: boolean;
    sampleSize: number;
  };
}

export function MetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('30'); // days
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch(`/api/metrics/all?days=${period}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
        setLastUpdated(new Date());
      } else {
        toast.error('Failed to load metrics');
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      toast.error('Failed to load metrics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-proofound-forest" />
          <p className="text-muted-foreground">Loading metrics...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-proofound-terracotta" />
        <p className="text-foreground font-medium">Failed to load metrics</p>
        <Button onClick={fetchMetrics} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Platform Metrics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time performance metrics and KPIs
            {lastUpdated && ` • Last updated: ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchMetrics} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* TTFQI */}
        <MetricCard
          title="TTFQI"
          subtitle="Time to First Qualified Introduction"
          value={metrics.ttfqi.value.toFixed(1)}
          unit="hours"
          target={metrics.ttfqi.target}
          onTrack={metrics.ttfqi.onTrack}
          percentiles={metrics.ttfqi.percentile}
          sampleSize={metrics.ttfqi.sampleSize}
          icon={<Zap className="w-5 h-5" />}
        />

        {/* TTV */}
        <MetricCard
          title="TTV"
          subtitle="Time to Video Interview"
          value={metrics.ttv.value.toFixed(1)}
          unit="days"
          target={metrics.ttv.target}
          onTrack={metrics.ttv.onTrack}
          percentiles={metrics.ttv.percentile}
          sampleSize={metrics.ttv.sampleSize}
          icon={<Clock className="w-5 h-5" />}
        />

        {/* TTSC */}
        <MetricCard
          title="TTSC"
          subtitle="Time to Signed Contract"
          value={metrics.ttsc.value.toFixed(1)}
          unit="days"
          target={metrics.ttsc.target}
          onTrack={metrics.ttsc.onTrack}
          percentiles={metrics.ttsc.percentile}
          sampleSize={metrics.ttsc.sampleSize}
          icon={<Target className="w-5 h-5" />}
        />

        {/* PAC Lift */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="w-5 h-5 text-proofound-terracotta" />
                  PAC Lift
                </CardTitle>
                <CardDescription>Purpose-Alignment Contribution Impact</CardDescription>
              </div>
              <Badge
                variant={metrics.pacLift.onTrack ? 'default' : 'destructive'}
                className={metrics.pacLift.onTrack ? 'bg-green-600' : ''}
              >
                {metrics.pacLift.onTrack ? 'On Track' : 'Below Target'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">With PAC</p>
                <p className="text-2xl font-bold text-foreground">
                  {metrics.pacLift.withPAC.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  n={metrics.pacLift.sampleSize.withPAC}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Without PAC</p>
                <p className="text-2xl font-bold text-foreground">
                  {metrics.pacLift.withoutPAC.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  n={metrics.pacLift.sampleSize.withoutPAC}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Lift</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-proofound-forest">
                    +{metrics.pacLift.lift.toFixed(1)}%
                  </p>
                  {metrics.pacLift.lift >= metrics.pacLift.targetLift ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-proofound-terracotta" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Target: ≥{metrics.pacLift.targetLift}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SUS */}
        <MetricCard
          title="SUS"
          subtitle="System Usability Scale"
          value={metrics.sus.value.toFixed(0)}
          unit="score"
          target={metrics.sus.target}
          onTrack={metrics.sus.onTrack}
          sampleSize={metrics.sus.responses}
          icon={<Users className="w-5 h-5" />}
        />
      </div>

      {/* Well-Being Delta Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="w-5 h-5 text-proofound-terracotta" />
                Well-Being Delta
              </CardTitle>
              <CardDescription>Change in user well-being over time</CardDescription>
            </div>
            <Badge
              variant={metrics.wellBeingDelta.onTrack ? 'default' : 'destructive'}
              className={metrics.wellBeingDelta.onTrack ? 'bg-green-600' : ''}
            >
              {metrics.wellBeingDelta.onTrack ? 'On Track' : 'Below Target'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Average Delta</p>
              <p className="text-3xl font-bold text-foreground">
                {metrics.wellBeingDelta.averageDelta >= 0 ? '+' : ''}
                {metrics.wellBeingDelta.averageDelta.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                n={metrics.wellBeingDelta.sampleSize}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Users Improved</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-proofound-forest">
                    {metrics.wellBeingDelta.positiveChange.toFixed(0)}%
                  </p>
                  {metrics.wellBeingDelta.positiveChange >= metrics.wellBeingDelta.target ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                  )}
                </div>
                <Progress value={metrics.wellBeingDelta.positiveChange} className="h-2" />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Target</p>
              <p className="text-3xl font-bold text-muted-foreground">
                ≥{metrics.wellBeingDelta.target}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">of users show improvement</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-gradient-to-br from-[#E8F5E1] to-[#F7F6F1]">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {Object.values(metrics).filter((m: any) => m.onTrack).length >= 5 ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <AlertCircle className="w-8 h-8 text-amber-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Platform Health Summary</h3>
              <p className="text-sm text-muted-foreground">
                {Object.values(metrics).filter((m: any) => m.onTrack).length} of 6 key metrics on
                track.{' '}
                {Object.values(metrics).some((m: any) => !m.onTrack) &&
                  'Review below-target metrics and consider interventions.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Individual Metric Card Component
 */
function MetricCard({
  title,
  subtitle,
  value,
  unit,
  target,
  onTrack,
  percentiles,
  sampleSize,
  icon,
}: {
  title: string;
  subtitle: string;
  value: string;
  unit: string;
  target: number;
  onTrack: boolean;
  percentiles?: { p50: number; p75: number; p90: number };
  sampleSize: number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <Badge
          variant={onTrack ? 'default' : 'destructive'}
          className={cn(
            'text-[10px] px-1.5 py-0 h-5 font-medium',
            onTrack
              ? 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200'
              : 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200'
          )}
        >
          {onTrack ? 'On Track' : 'Off Track'}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
              <span className="text-sm font-normal text-muted-foreground">{unit}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>

          <div className="pt-3 border-t border-border/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Target: ≤{target} {unit}
              </span>
              <span className="text-muted-foreground">n={sampleSize}</span>
            </div>

            {percentiles && (
              <div className="grid grid-cols-3 gap-2 text-center mt-3 bg-muted/30 p-2 rounded-md">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">P50</p>
                  <p className="text-xs font-semibold text-foreground">
                    {percentiles.p50.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">P75</p>
                  <p className="text-xs font-semibold text-foreground">
                    {percentiles.p75.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">P90</p>
                  <p className="text-xs font-semibold text-foreground">
                    {percentiles.p90.toFixed(1)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
