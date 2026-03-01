import { OrgDashboardClient } from './OrgDashboardClient';
import {
  getOrgGoalsData,
  getOrgProjectsData,
  getOrgTeamData,
  getOrgReadinessData,
  getOrgMomentumData,
  getOrgUpdatesData,
} from '@/lib/dashboard/orgDataFetchers';

interface SuspendedOrgDashboardClientProps {
  orgId: string;
  orgSlug: string;
  userId: string;
  userRole: string;
  dashboardMetricsPipeline: any;
}

export async function SuspendedOrgDashboardClient({
  orgId,
  orgSlug,
  userId,
  userRole,
  dashboardMetricsPipeline,
}: SuspendedOrgDashboardClientProps) {
  // Fetch widget data concurrently on the server
  let dashboardData: any = {};

  try {
    const [goalsData, projectsData, teamDataResult, readinessData, momentumData, updatesData] =
      await Promise.all([
        getOrgGoalsData(orgId),
        getOrgProjectsData(orgId),
        getOrgTeamData(orgId),
        getOrgReadinessData(orgId, userId),
        getOrgMomentumData(userId, orgSlug),
        getOrgUpdatesData(userId, orgSlug),
      ]);

    dashboardData = {
      pipeline: dashboardMetricsPipeline,
      goals: goalsData,
      projects: projectsData,
      team: teamDataResult,
      readiness: readinessData,
      momentum: momentumData,
      updates: updatesData,
    };
  } catch (error) {
    console.error('Failed to fetch org dashboard data:', error);
  }

  return (
    <OrgDashboardClient
      orgSlug={orgSlug}
      orgId={orgId}
      userRole={userRole}
      initialData={dashboardData}
    />
  );
}
