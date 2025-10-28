import { requireAuth, getActiveOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { WhileAwayCard } from '@/components/dashboard/WhileAwayCard';
import { GoalsCard } from '@/components/dashboard/GoalsCard';
import { TasksCard } from '@/components/dashboard/TasksCard';
import { ProjectsCard } from '@/components/dashboard/ProjectsCard';
import { MatchingResultsCard } from '@/components/dashboard/MatchingResultsCard';
import { TeamRolesCard } from '@/components/dashboard/TeamRolesCard';
import { ExploreCard } from '@/components/dashboard/ExploreCard';

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
  const persona = 'organization';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F6F1' }}>
      <div className="max-w-[1400px] mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* While Away - hidden by default */}
          <div className="lg:col-span-3">
            <WhileAwayCard />
          </div>

          {/* Row 1: Goals | Tasks | Projects */}
          <GoalsCard />
          <TasksCard />
          <ProjectsCard />

          {/* Row 2: Matching (2 cols) | Team (1 col) */}
          <MatchingResultsCard className="lg:col-span-2" basePath={`/app/o/${slug}`} />
          <TeamRolesCard />

          {/* Row 3: Explore (full 3 cols) */}
          <ExploreCard />
        </div>
      </div>
    </div>
  );
}
