import { requireAuth } from '@/lib/auth';
import Link from 'next/link';
import { DashboardClient } from './DashboardClient';
import { ReadinessSprintPanel } from '@/components/dashboard/ReadinessSprintPanel';
import { Button } from '@/components/ui/button';
import { getDashboardMetrics } from '@/lib/dashboard/metrics';
import {
  TrendingUp,
  Target,
  Award,
  Users,
  ShieldCheck,
  Briefcase,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

import { AppSurface } from '@/components/ui/v2/AppSurface';
import { MetricStrip } from '@/components/ui/v2/MetricStrip';
import { StatTileModel } from '@/lib/ui/v2/types';
import { Suspense } from 'react';
import { SuspendedDashboardClient } from './SuspendedDashboardClient';
import { WidgetGridSkeleton } from '@/components/dashboard/WidgetGridSkeleton';

export const dynamic = 'force-dynamic';

export default async function IndividualHomePage() {
  const user = await requireAuth();

  // Safely load metrics with fallback values
  let metrics;
  try {
    metrics = await getDashboardMetrics();
  } catch (error) {
    console.error('Failed to load dashboard metrics:', error);
    // Fallback to default values if metrics fail to load
    metrics = {
      profileScore: 0,
      impactStoryCount: 0,
      verifiedSkills: 0,
      pendingVerifications: 0,
      qualityMatches: 0,
      activeApplications: 0,
    };
  }

  // Data fetching for dashboard widgets is now handled by SuspendedDashboardClient

  const userName = user.displayName || user.handle || 'there';
  const firstName = userName.split(' ')[0];

  const heroStats = [
    {
      icon: TrendingUp,
      label: 'Profile score',
      value: `${metrics.profileScore}/100`,
    },
    {
      icon: Target,
      label: 'Impact stories',
      value: String(metrics.impactStoryCount),
    },
    {
      icon: Award,
      label: 'Verified skills',
      value: String(metrics.verifiedSkills),
    },
  ];

  const kpiCards: StatTileModel[] = [
    {
      id: 'matches',
      title: 'Quality Matches',
      value: String(metrics.qualityMatches),
      description:
        metrics.qualityMatches > 0
          ? 'Keep proofs fresh to climb higher.'
          : 'Add proofs to strengthen your public portfolio and unlock stronger matches.',
      icon: <Users className="w-5 h-5" />,
      trend: { direction: 'up', label: '80%+ fit suggestions' },
    },
    {
      id: 'verifications',
      title: 'Pending Verifications',
      value: String(metrics.pendingVerifications),
      description: 'Reviews waiting',
      icon: <ShieldCheck className="w-5 h-5" />,
      action: {
        id: 'review-verifs',
        label: metrics.pendingVerifications > 0 ? 'Review now' : 'Request more proofs',
        href: '/app/i/profile',
      },
    },
    {
      id: 'applications',
      title: 'Active Applications',
      value: String(metrics.activeApplications),
      description:
        metrics.activeApplications > 0
          ? 'Follow up to stay top of mind.'
          : 'Explore opportunities to get started.',
      icon: <Briefcase className="w-5 h-5" />,
      trend: { direction: 'neutral', label: 'Assignments in progress' },
    },
  ];

  return (
    <AppSurface>
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-proofound-forest text-white shadow-xl isolate">
        <div className="absolute inset-0 bg-gradient-to-br from-proofound-forest via-proofound-forest/90 to-extended-clay/60 mix-blend-multiply" />

        {/* Glassmorphism accent */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-white/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-extended-clay/20 blur-3xl rounded-full pointer-events-none" />

        <div className="relative p-8 md:p-12 lg:p-14 flex flex-col md:flex-row gap-8 items-start justify-between">
          <div className="max-w-3xl space-y-8">
            <h1 className="text-4xl md:text-5xl font-display font-medium tracking-tight">
              Welcome back, {firstName}
            </h1>
            <p className="text-white/80 text-lg leading-relaxed max-w-2xl">
              Your public portfolio is your day-1 asset. You currently have{' '}
              <span className="text-white font-semibold">{metrics.pendingVerifications}</span>{' '}
              verification
              {metrics.pendingVerifications === 1 ? '' : 's'} awaiting review and{' '}
              <span className="text-white font-semibold">{metrics.qualityMatches}</span> high-fit
              matches building in the background.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              {heroStats.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 bg-white/10 rounded-2xl px-5 py-3 backdrop-blur-md border border-white/10 shadow-sm"
                >
                  <div className="bg-white/20 p-2.5 rounded-xl text-white">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-white/70 tracking-wide uppercase font-medium">
                      {label}
                    </span>
                    <span className="font-semibold text-xl tracking-tight mt-0.5">{value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6">
              <Button
                size="lg"
                className="bg-white text-proofound-forest hover:bg-neutral-light-50 rounded-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md font-medium text-base h-12 px-6"
                asChild
              >
                <Link href="/app/i/portfolio">
                  Open public portfolio
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div data-tour="dashboard">
        <MetricStrip metrics={kpiCards} />
      </div>

      <ReadinessSprintPanel />

      <Suspense fallback={<WidgetGridSkeleton variant="individualDashboard" />}>
        <SuspendedDashboardClient userId={user.id} />
      </Suspense>
    </AppSurface>
  );
}
