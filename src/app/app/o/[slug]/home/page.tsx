import { requireAuth, getActiveOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { WhileAwayCard } from '@/components/dashboard/WhileAwayCard';
import { GoalsCard } from '@/components/dashboard/GoalsCard';
import { TasksVerificationsCard } from '@/components/dashboard/TasksVerificationsCard';
import { ProjectsCard } from '@/components/dashboard/ProjectsCard';
import { MatchingResultsCard } from '@/components/dashboard/MatchingResultsCard';
import { ExploreOpportunitiesCard } from '@/components/dashboard/ExploreOpportunitiesCard';
import { TeamRolesCard } from '@/components/dashboard/TeamRolesCard';

export const dynamic = 'force-dynamic';

export default async function OrganizationHomePage({ params }: { params: { slug: string } }) {
  const user = await requireAuth();
  const { slug } = params;
  const result = await getActiveOrg(slug, user.id);

  if (!result) {
    notFound();
  }

  const { org, membership } = result;

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* While Away - hidden by default */}
        <div className="lg:col-span-3">
          <WhileAwayCard />
        </div>

        {/* Row 1 */}
        <GoalsCard />
        <TasksVerificationsCard />
        <ProjectsCard />

        {/* Row 2 - Matching spans 2 cols */}
        <MatchingResultsCard className="lg:col-span-2" />

        {/* Organization-specific card */}
        <TeamRolesCard />

        {/* Row 3 - Explore spans full width */}
        <ExploreOpportunitiesCard className="lg:col-span-3" />
      </div>
    </div>
  );
}
