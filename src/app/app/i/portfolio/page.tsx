import { requireAuth } from '@/lib/auth';
import { getIndividualReadiness } from '@/lib/readiness/individual';
import { getIndividualProfileCompletionState } from '@/lib/profile/completion-flow.server';
import { PortfolioWorkspaceClient } from './PortfolioWorkspaceClient';

export const dynamic = 'force-dynamic';

export default async function IndividualPortfolioPage() {
  const user = await requireAuth();
  const [completionState, readiness] = await Promise.all([
    getIndividualProfileCompletionState(user.id),
    getIndividualReadiness(user.id),
  ]);

  return <PortfolioWorkspaceClient completionState={completionState} readiness={readiness} />;
}
