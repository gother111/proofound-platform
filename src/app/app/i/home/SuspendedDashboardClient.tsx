import { DashboardClient } from './DashboardClient';
import {
  getIndGoalsData,
  getIndSkillGapsData,
  getIndProfileCompletenessData,
  getIndInterviewsData,
  getIndMomentumData,
} from '@/lib/dashboard/indDataFetchers';

export async function SuspendedDashboardClient({ userId }: { userId: string }) {
  // Fetch initial data for dashboard widgets
  const [goalsData, skillGapsData, completenessData, interviewsData, momentumData] =
    await Promise.all([
      getIndGoalsData(userId).catch(() => null),
      getIndSkillGapsData(userId).catch(() => null),
      getIndProfileCompletenessData(userId).catch(() => null),
      getIndInterviewsData(userId).catch(() => null),
      getIndMomentumData(userId).catch(() => null),
    ]);

  const initialWidgetData = {
    goals: goalsData,
    skillGaps: skillGapsData,
    profileCompleteness: completenessData,
    interviews: interviewsData,
    momentum: momentumData,
  };

  return <DashboardClient initialData={initialWidgetData} />;
}
