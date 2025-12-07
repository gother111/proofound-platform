import { requireAuth } from '@/lib/auth';
import Link from 'next/link';
import { DashboardClient } from './DashboardClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DashboardView } from './DashboardView';
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
    <DashboardView
      user={user}
      metrics={metrics}
      kpiCards={kpiCards}
      heroStats={heroStats}
    />
  );
}
