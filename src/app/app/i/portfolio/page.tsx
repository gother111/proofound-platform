import { requireAuth } from '@/lib/auth';
import { getIndividualProfileCompletionState } from '@/lib/profile/completion-flow.server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function IndividualPortfolioPage() {
  const user = await requireAuth();
  const completionState = await getIndividualProfileCompletionState(user.id);

  const params = new URLSearchParams({
    profileView: 'full',
    tab: completionState.isPortfolioReady ? 'visibility' : 'proof_packs',
  });

  if (!completionState.isPortfolioReady) {
    params.set('portfolioLocked', '1');
    if (completionState.portfolioLockCode) {
      params.set('lockReason', completionState.portfolioLockCode);
    }
    if (!completionState.checks.hasFirstProof) {
      params.set('proof', 'first');
    }
  }

  redirect(`/app/i/profile?${params.toString()}`);
}
