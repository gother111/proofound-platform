'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  BadgeCheck,
  Clock,
  Eye,
  FileCheck,
  FileSearch,
  ShieldCheck,
  Sparkles,
  Target,
  ThumbsUp,
  TrendingDown,
  TrendingUp,
  UserRoundX,
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PAC_LIFT_TARGET_PERCENT,
  TTFQI_TARGET_HOURS,
  TTSC_TARGET_DAYS,
  TTV_TARGET_DAYS,
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
  proofTrust: {
    sampleSize: number;
    proofCoverageRatio: number;
    proofCoverageRatioAvg: number;
    proofBackedSkillCount: number;
    publicSkillCount: number;
    verificationCoverageRatioAvg: number;
    trustSignalCoverageCountAvg: number;
    proofQualitySummaryAvg: number | null;
    timeToVerifiedHoursP50Avg: number | null;
    freshnessDistribution: {
      fresh: number;
      reviewSoon: number;
      stale: number;
      expired: number;
    };
  };
  workflow: {
    verification: {
      requests: number;
      completed: number;
      failed: number;
      expired: number;
      conversionRate: number;
      failureRate: number;
      expiryRate: number;
    };
    reveal: {
      requested: number;
      granted: number;
      denied: number;
      grantRate: number;
      denialRate: number;
    };
    intros: {
      created: number;
      expired: number;
      withdrawn: number;
      expiryRate: number;
      withdrawalRate: number;
    };
    interviews: {
      created: number;
      noShow: number;
      noShowRate: number;
    };
    overrides: {
      applied: number;
      rate: number;
    };
  };
  publication: {
    sampleSize: number;
    stateCounts: {
      publicIndexable: number;
      publicNoindex: number;
      publicLinkOnly: number;
      unavailable: number;
    };
    indexableCoverage: number;
    noindexCoverage: number;
  };
}

function formatPercent(value: number | null, digits = 0) {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${(value * 100).toFixed(digits)}%`;
}

function formatValue(value: number | null, digits = 1) {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toFixed(value < 10 ? digits : 0);
}

function freshnessShare(count: number, total: number) {
  if (total <= 0) return '—';
  return `${Math.round((count / total) * 100)}%`;
}

export function MetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadMetrics();
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

  const TargetMetricCard = ({
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
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-proofound-forest" />
              <h3 className="font-semibold text-foreground">{title}</h3>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          {value !== null && (
            <div
              className={`rounded px-2 py-1 text-xs font-medium ${
                targetMet ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {targetMet ? 'On target' : 'Needs attention'}
            </div>
          )}
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{formatValue(value)}</span>
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
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
          <div className="border-t border-proofound-stone pt-2 text-xs text-muted-foreground">
            Sample size: <span className="font-medium text-foreground">{count}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const OperationalCard = ({
    title,
    value,
    unit,
    detail,
    icon: Icon,
    description,
  }: {
    title: string;
    value: string;
    unit?: string;
    detail: string;
    icon: React.ElementType;
    description: string;
  }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-proofound-forest" />
              <h3 className="font-semibold text-foreground">{title}</h3>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{value}</span>
            {unit ? <span className="text-sm text-muted-foreground">{unit}</span> : null}
          </div>
          <p className="border-t border-proofound-stone pt-2 text-xs text-muted-foreground">
            {detail}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Activity className="h-8 w-8 animate-spin text-muted-foreground" />
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
          <div className="py-12 text-center text-muted-foreground">
            No metrics data available yet
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalFreshnessArtifacts = Object.values(metrics.proofTrust.freshnessDistribution).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Operational Metrics</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Outcome, proof, trust, workflow, and publication health for the hiring corridor.
          </p>
        </div>
        {lastUpdated ? (
          <div className="text-xs text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Sparkles className="h-5 w-5 text-amber-500" />
          Outcome Metrics
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TargetMetricCard
            title="TTSC"
            value={metrics.ttsc.median}
            target={TTSC_TARGET_DAYS}
            unit="days"
            targetMet={metrics.ttsc.targetMet}
            count={metrics.ttsc.count}
            icon={Target}
            description="Median time from activation to signed contract."
          />
          <TargetMetricCard
            title="TTFQI"
            value={metrics.ttfqi.median}
            target={TTFQI_TARGET_HOURS}
            unit="hours"
            targetMet={metrics.ttfqi.targetMet}
            count={metrics.ttfqi.count}
            icon={Clock}
            description="Median time to first qualified introduction."
          />
          <TargetMetricCard
            title="TTV"
            value={metrics.ttv.median}
            target={TTV_TARGET_DAYS}
            unit="days"
            targetMet={metrics.ttv.targetMet}
            count={metrics.ttv.count}
            icon={TrendingUp}
            description="Median time to first scheduled interview."
          />
          <TargetMetricCard
            title="Proof Fit Lift"
            value={metrics.pac.topDecileLift}
            target={PAC_LIFT_TARGET_PERCENT}
            unit="%"
            targetMet={metrics.pac.targetMet}
            count={metrics.pac.sampleSize}
            icon={Sparkles}
            description="Intro acceptance lift from proof-fit signals."
          />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Proof And Trust</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OperationalCard
            title="Proof Coverage"
            value={formatPercent(metrics.proofTrust.proofCoverageRatioAvg)}
            detail={`${metrics.proofTrust.proofBackedSkillCount} proof-backed public skills across ${metrics.proofTrust.publicSkillCount} public skills.`}
            icon={FileCheck}
            description="Average share of public skills backed by proof."
          />
          <OperationalCard
            title="Verification Coverage"
            value={formatPercent(metrics.proofTrust.verificationCoverageRatioAvg)}
            detail={`${metrics.workflow.verification.completed} completed from ${metrics.workflow.verification.requests} verification requests in the last 90 days.`}
            icon={BadgeCheck}
            description="Average share of proof-backed skills with accepted verification."
          />
          <OperationalCard
            title="Proof Quality"
            value={formatValue(metrics.proofTrust.proofQualitySummaryAvg)}
            unit="/ 100"
            detail={`Portfolio snapshot sample: ${metrics.proofTrust.sampleSize}. Use this internally with its components, not as a vanity score.`}
            icon={ShieldCheck}
            description="Internal composite of coverage, freshness, verification, and completeness."
          />
          <OperationalCard
            title="Time To Verified"
            value={formatValue(metrics.proofTrust.timeToVerifiedHoursP50Avg)}
            unit="hours"
            detail={`Average median verification cycle across ${metrics.proofTrust.sampleSize} portfolio snapshots.`}
            icon={Clock}
            description="Operational latency from verification creation to accepted verification."
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Freshness Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Fresh</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {freshnessShare(
                    metrics.proofTrust.freshnessDistribution.fresh,
                    totalFreshnessArtifacts
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Review Soon</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {freshnessShare(
                    metrics.proofTrust.freshnessDistribution.reviewSoon,
                    totalFreshnessArtifacts
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Stale</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {freshnessShare(
                    metrics.proofTrust.freshnessDistribution.stale,
                    totalFreshnessArtifacts
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Expired</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {freshnessShare(
                    metrics.proofTrust.freshnessDistribution.expired,
                    totalFreshnessArtifacts
                  )}
                </p>
              </div>
            </div>
            <p className="mt-4 border-t border-proofound-stone pt-3 text-xs text-muted-foreground">
              Average trust signal coverage:{' '}
              {formatValue(metrics.proofTrust.trustSignalCoverageCountAvg)} active trust signal
              classes per profile snapshot.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Workflow Audits</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OperationalCard
            title="Verification Conversion"
            value={formatPercent(metrics.workflow.verification.conversionRate)}
            detail={`${metrics.workflow.verification.completed} completed, ${metrics.workflow.verification.failed} failed, ${metrics.workflow.verification.expired} expired.`}
            icon={BadgeCheck}
            description="Completed verification records divided by created verification requests."
          />
          <OperationalCard
            title="Reveal Grant Rate"
            value={formatPercent(metrics.workflow.reveal.grantRate)}
            detail={`${metrics.workflow.reveal.granted} granted and ${metrics.workflow.reveal.denied} denied from ${metrics.workflow.reveal.requested} reveal requests.`}
            icon={Eye}
            description="Reveal workflow audit rate across explicit reveal requests."
          />
          <OperationalCard
            title="Intro Expiry Rate"
            value={formatPercent(metrics.workflow.intros.expiryRate)}
            detail={`${metrics.workflow.intros.expired} expired and ${metrics.workflow.intros.withdrawn} withdrawn from ${metrics.workflow.intros.created} intro workflows.`}
            icon={FileSearch}
            description="Share of intro workflows that expire before progressing."
          />
          <OperationalCard
            title="No-Show Rate"
            value={formatPercent(metrics.workflow.interviews.noShowRate)}
            detail={`${metrics.workflow.interviews.noShow} no-shows from ${metrics.workflow.interviews.created} interview records.`}
            icon={UserRoundX}
            description="Interview no-show audit rate."
          />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Publication And Platform Health</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OperationalCard
            title="SUS"
            value={formatValue(metrics.sus.average)}
            unit="/ 100"
            detail={`${metrics.sus.responseCount} SUS responses recorded. Internal target: 75 / 100.`}
            icon={ThumbsUp}
            description="Usability benchmark for the platform experience."
          />
          <OperationalCard
            title="Indexable Portfolios"
            value={formatPercent(metrics.publication.indexableCoverage)}
            detail={`${metrics.publication.stateCounts.publicIndexable} indexable portfolios from ${metrics.publication.sampleSize} portfolio publication snapshots.`}
            icon={TrendingUp}
            description="Share of portfolio snapshots eligible for search indexing."
          />
          <OperationalCard
            title="Noindex Coverage"
            value={formatPercent(metrics.publication.noindexCoverage)}
            detail={`${metrics.publication.stateCounts.publicNoindex + metrics.publication.stateCounts.publicLinkOnly} public-but-hidden or link-only portfolio states.`}
            icon={TrendingDown}
            description="Share of portfolio snapshots intentionally excluded from indexing."
          />
          <OperationalCard
            title="Manual Overrides"
            value={formatPercent(metrics.workflow.overrides.rate)}
            detail={`${metrics.workflow.overrides.applied} review overrides across the last 90 days.`}
            icon={ShieldCheck}
            description="Override usage rate against reviewed match decisions."
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metric Context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">P75 values:</span>
            <ul className="mt-2 space-y-1 pl-4">
              <li>TTSC P75: {metrics.ttsc.p75?.toFixed(0) || '—'} days</li>
              <li>TTFQI P75: {metrics.ttfqi.p75?.toFixed(0) || '—'} hours</li>
              <li>TTV P75: {metrics.ttv.p75?.toFixed(0) || '—'} days</li>
            </ul>
          </div>
          <p className="border-t border-proofound-stone pt-3 text-xs">
            Proof and workflow metrics are computed from lifecycle events, proof-trust snapshots,
            and publication state snapshots. Zen data is intentionally excluded from this dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
