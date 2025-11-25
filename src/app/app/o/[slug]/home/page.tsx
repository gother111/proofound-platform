/**
 * Organization Home Page
 *
 * Displays the organization dashboard with customizable widgets
 * PRD Reference: O8 - Company Dashboard
 */

import { requireAuth, getActiveOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Briefcase, Users, Target, TrendingUp, ArrowRight, Building2 } from 'lucide-react';
import { OrgDashboardClient } from './OrgDashboardClient';

export const dynamic = 'force-dynamic';

export default async function OrganizationHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireAuth();
  const { slug } = await params;
  const result = await getActiveOrg(slug, user.id);

  if (!result) {
    notFound();
  }

  const { org, membership } = result;

  // Fetch org dashboard metrics for hero section
  let metrics = {
    activeAssignments: 0,
    totalMatches: 0,
    teamMembers: 0,
    shortlists: 0,
  };

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/org/${slug}/dashboard`,
      {
        headers: {
          cookie: `sb-access-token=${process.env.SUPABASE_ACCESS_TOKEN || ''}`,
        },
        cache: 'no-store',
      }
    );

    if (response.ok) {
      const data = await response.json();
      metrics = {
        activeAssignments: data.pipeline?.openAssignments || 0,
        totalMatches: data.pipeline?.matches?.totalMatches || 0,
        teamMembers: data.team?.total || 0,
        shortlists: data.pipeline?.shortlists || 0,
      };
    }
  } catch (error) {
    console.error('Failed to fetch org dashboard metrics:', error);
  }

  const heroStats = [
    {
      icon: Briefcase,
      label: 'Active assignments',
      value: String(metrics.activeAssignments),
    },
    {
      icon: Users,
      label: 'Candidates matched',
      value: String(metrics.totalMatches),
    },
    {
      icon: Target,
      label: 'In shortlist',
      value: String(metrics.shortlists),
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F6F1' }}>
      <div className="max-w-[1400px] mx-auto px-4 py-4">
        <div className="space-y-4">
          {/* Hero Section */}
          <section
            className="rounded-2xl p-6 text-white"
            style={{
              background: 'linear-gradient(135deg, #1C4D3A 0%, #2D5F4A 45%, #1C4D3A 100%)',
            }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3 max-w-xl">
                <div className="flex items-center gap-2">
                  <Building2 className="w-6 h-6" />
                  <h1 className="text-3xl font-['Crimson_Pro']">{org.displayName}</h1>
                </div>
                <p className="text-white/90 text-sm leading-relaxed">
                  {metrics.activeAssignments > 0
                    ? `You have ${metrics.activeAssignments} active assignment${metrics.activeAssignments > 1 ? 's' : ''} with ${metrics.totalMatches} candidate match${metrics.totalMatches > 1 ? 'es' : ''}. ${metrics.shortlists > 0 ? `${metrics.shortlists} candidate${metrics.shortlists > 1 ? 's' : ''} in your shortlist.` : ''}`
                    : 'Create an assignment to start matching with qualified candidates.'}
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
                <Link href={`/app/o/${slug}/assignments/new`}>
                  <Button
                    size="sm"
                    className="text-sm mt-1 bg-white text-[#1C4D3A] hover:bg-[#F7F6F1]"
                  >
                    {metrics.activeAssignments > 0
                      ? 'Create new assignment'
                      : 'Create first assignment'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* KPI Grid */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="p-4" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
              <div className="flex items-center justify-between mb-3">
                <Briefcase className="w-5 h-5" style={{ color: '#1C4D3A' }} />
                <TrendingUp className="w-4 h-4" style={{ color: '#7A9278' }} />
              </div>
              <p className="text-3xl font-['Crimson_Pro']" style={{ color: '#2D3330' }}>
                {metrics.activeAssignments}
              </p>
              <p className="text-xs" style={{ color: '#6B6760' }}>
                Active assignments
              </p>
              <Link
                href={`/app/o/${slug}/assignments`}
                className="mt-3 inline-flex text-xs font-medium"
                style={{ color: '#1C4D3A' }}
              >
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Card>

            <Card className="p-4" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
              <div className="flex items-center justify-between mb-3">
                <Users className="w-5 h-5" style={{ color: '#1C4D3A' }} />
                <TrendingUp className="w-4 h-4" style={{ color: '#7A9278' }} />
              </div>
              <p className="text-3xl font-['Crimson_Pro']" style={{ color: '#2D3330' }}>
                {metrics.totalMatches}
              </p>
              <p className="text-xs" style={{ color: '#6B6760' }}>
                Total matches
              </p>
              <Link
                href={`/app/o/${slug}/matching`}
                className="mt-3 inline-flex text-xs font-medium"
                style={{ color: '#1C4D3A' }}
              >
                Review candidates <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Card>

            <Card className="p-4" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
              <div className="flex items-center justify-between mb-3">
                <Target className="w-5 h-5" style={{ color: '#1C4D3A' }} />
                <TrendingUp className="w-4 h-4" style={{ color: '#7A9278' }} />
              </div>
              <p className="text-3xl font-['Crimson_Pro']" style={{ color: '#2D3330' }}>
                {metrics.shortlists}
              </p>
              <p className="text-xs" style={{ color: '#6B6760' }}>
                In shortlist
              </p>
              <Link
                href={`/app/o/${slug}/shortlist`}
                className="mt-3 inline-flex text-xs font-medium"
                style={{ color: '#1C4D3A' }}
              >
                Review shortlist <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Card>
          </section>

          {/* Customizable Dashboard */}
          <OrgDashboardClient orgSlug={slug} orgId={org.id} userRole={membership.role} />
        </div>
      </div>
    </div>
  );
}
