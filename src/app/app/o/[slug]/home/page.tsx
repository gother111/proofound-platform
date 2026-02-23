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
import { db } from '@/db';
import { assignments, matches, matchInterest, organizationMembers } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

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
    // Query DB directly to avoid URL/env issues during SSR
    const [assignmentsData, teamData, matchesData, shortlistData] = await Promise.all([
      db
        .select({
          status: assignments.status,
          count: sql<number>`count(*)::int`,
        })
        .from(assignments)
        .where(eq(assignments.orgId, org.id))
        .groupBy(assignments.status),
      db
        .select({
          role: organizationMembers.role,
          count: sql<number>`count(*)::int`,
        })
        .from(organizationMembers)
        .where(eq(organizationMembers.orgId, org.id))
        .groupBy(organizationMembers.role),
      db
        .select({
          matchCount: sql<number>`count(${matches.id})::int`,
        })
        .from(assignments)
        .leftJoin(
          matches,
          and(eq(matches.assignmentId, assignments.id), eq(assignments.status, 'active'))
        )
        .where(eq(assignments.orgId, org.id)),
      db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(matchInterest)
        .innerJoin(assignments, eq(matchInterest.assignmentId, assignments.id))
        .where(eq(assignments.orgId, org.id)),
    ]);

    metrics = {
      activeAssignments: assignmentsData.find((a) => a.status === 'active')?.count || 0,
      totalMatches: matchesData[0]?.matchCount || 0,
      teamMembers: teamData.reduce((sum, t) => sum + (t.count || 0), 0),
      shortlists: shortlistData[0]?.count || 0,
    };
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
                    ? `Your public organization portfolio is live. You also have ${metrics.activeAssignments} active assignment${metrics.activeAssignments > 1 ? 's' : ''} with ${metrics.totalMatches} candidate match${metrics.totalMatches > 1 ? 'es' : ''}.`
                    : 'Your day-1 win is live: a clean public organization portfolio link. Next, create your first assignment when ready.'}
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
                <Link href={`/app/o/${slug}/portfolio`}>
                  <Button className="text-sm mt-1 bg-white text-[#1C4D3A] hover:bg-[#F7F6F1] min-h-[44px]">
                    Open public portfolio
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
                className="mt-3 inline-flex min-h-[44px] items-center px-3 -mx-3 rounded-md text-xs font-medium"
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
                className="mt-3 inline-flex min-h-[44px] items-center px-3 -mx-3 rounded-md text-xs font-medium"
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
                className="mt-3 inline-flex min-h-[44px] items-center px-3 -mx-3 rounded-md text-xs font-medium"
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
