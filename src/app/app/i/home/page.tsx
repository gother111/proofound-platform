import { requireAuth } from '@/lib/auth';
import Link from 'next/link';
import { WhileAwayCard } from '@/components/dashboard/WhileAwayCard';
import { GoalsCard } from '@/components/dashboard/GoalsCard';
import { TasksCard } from '@/components/dashboard/TasksCard';
import { ProjectsCard } from '@/components/dashboard/ProjectsCard';
import { MatchingResultsCard } from '@/components/dashboard/MatchingResultsCard';
import { ImpactSnapshotCard } from '@/components/dashboard/ImpactSnapshotCard';
import { ExploreCard } from '@/components/dashboard/ExploreCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

export const dynamic = 'force-dynamic';

export default async function IndividualHomePage() {
  const user = await requireAuth();
  const metrics = await getDashboardMetrics();
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

  const kpiCards = [
    {
      title: 'Quality Matches',
      value: String(metrics.qualityMatches),
      description: '80%+ fit suggestions',
      footnote:
        metrics.qualityMatches > 0
          ? 'Keep proofs fresh to climb higher.'
          : 'Add proofs to unlock stronger matches.',
      Icon: Users,
      changeColor: '#7A9278',
    },
    {
      title: 'Pending Verifications',
      value: String(metrics.pendingVerifications),
      description: 'Reviews waiting',
      ctaLabel: metrics.pendingVerifications > 0 ? 'Review now' : 'Request more proofs',
      Icon: ShieldCheck,
      changeColor: '#C76B4A',
      ctaHref: '/app/i/profile',
    },
    {
      title: 'Active Applications',
      value: String(metrics.activeApplications),
      description: 'Assignments in progress',
      footnote:
        metrics.activeApplications > 0
          ? 'Follow up to stay top of mind.'
          : 'Explore opportunities to get started.',
      Icon: Briefcase,
      changeColor: '#C76B4A',
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F6F1' }}>
      <div className="max-w-[1400px] mx-auto px-4 py-4">
        <div className="space-y-4">
          {/* Hero */}
          <section
            className="rounded-2xl p-6 text-white"
            style={{
              background: 'linear-gradient(135deg, #1C4D3A 0%, #2D5F4A 45%, #1C4D3A 100%)',
            }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3 max-w-xl">
                <h1 className="text-3xl font-['Crimson_Pro']">Welcome back, {firstName}</h1>
                <p className="text-white/90 text-sm leading-relaxed">
                  You have {metrics.qualityMatches} high-fit matches and{' '}
                  {metrics.pendingVerifications} verification
                  {metrics.pendingVerifications === 1 ? '' : 's'} awaiting review. Keep your proofs
                  active to stay momentum-ready.
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  {heroStats.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-2">
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{value}</span>
                      <span className="text-white/70">{label}</span>
                    </div>
                  ))}
                </div>
                <Link href="/app/i/profile">
                  <Button
                    size="sm"
                    className="text-sm mt-1 bg-white text-[#1C4D3A] hover:bg-[#F7F6F1]"
                  >
                    Complete your profile
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* KPI Grid */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {kpiCards.map(
              ({ title, value, description, footnote, Icon, changeColor, ctaHref, ctaLabel }) => (
                <Card
                  key={title}
                  className="p-4"
                  style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Icon className="w-5 h-5" style={{ color: '#1C4D3A' }} />
                    {title === 'Pending Verifications' ? (
                      <AlertCircle className="w-4 h-4" style={{ color: '#D4A574' }} />
                    ) : (
                      <TrendingUp className="w-4 h-4" style={{ color: '#7A9278' }} />
                    )}
                  </div>
                  <p className="text-3xl font-['Crimson_Pro']" style={{ color: '#2D3330' }}>
                    {value}
                  </p>
                  <p className="text-xs" style={{ color: '#6B6760' }}>
                    {description}
                  </p>
                  {ctaHref ? (
                    <Link
                      href={ctaHref}
                      className="mt-3 inline-flex text-xs font-medium"
                      style={{ color: '#1C4D3A' }}
                    >
                      {ctaLabel ?? 'Review now'} <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  ) : (
                    <p className="text-xs mt-2" style={{ color: changeColor }}>
                      {footnote}
                    </p>
                  )}
                </Card>
              )
            )}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* While Away - hidden by default */}
            <div className="lg:col-span-3">
              <WhileAwayCard />
            </div>

            {/* Row 1: Goals | Tasks | Projects */}
            <GoalsCard />
            <TasksCard />
            <ProjectsCard />

            {/* Row 2: Matching (2 cols) | Impact (1 col) */}
            <MatchingResultsCard className="lg:col-span-2" />
            <ImpactSnapshotCard />

            {/* Row 3: Explore (full 3 cols) */}
            <ExploreCard />
          </div>
        </div>
      </div>
    </div>
  );
}
