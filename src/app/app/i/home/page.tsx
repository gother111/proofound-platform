import { requireAuth } from '@/lib/auth';
import { WhileAwayCard } from '@/components/dashboard/WhileAwayCard';
import { GoalsCard } from '@/components/dashboard/GoalsCard';
import { TasksCard } from '@/components/dashboard/TasksCard';
import { ProjectsCard } from '@/components/dashboard/ProjectsCard';
import { MatchingResultsCard } from '@/components/dashboard/MatchingResultsCard';
import { ImpactSnapshotCard } from '@/components/dashboard/ImpactSnapshotCard';
import { ExploreCard } from '@/components/dashboard/ExploreCard';

export const dynamic = 'force-dynamic';

export default async function IndividualHomePage() {
  const user = await requireAuth();
  const persona = 'individual';

  return (
    <div className="min-h-screen bg-proofound-parchment dark:bg-background">
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

          {/* Row 2: Matching (2 cols) | Impact (1 col) */}
          <MatchingResultsCard className="lg:col-span-2" />
          <ImpactSnapshotCard />

          {/* Row 3: Explore (full 3 cols) */}
          <ExploreCard />
        </div>
      </div>
    </div>
  );
}
