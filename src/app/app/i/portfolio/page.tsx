import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { getIndividualProfileCompletionState } from '@/lib/profile/completion-flow.server';

export const dynamic = 'force-dynamic';

export default async function IndividualPortfolioShortcutPage() {
  const user = await requireAuth();
  const completionState = await getIndividualProfileCompletionState(user.id);

  if (!completionState.isPortfolioReady) {
    const lockReason = completionState.portfolioLockCode || 'profile';
    redirect(`/app/i/profile?portfolioLocked=1&lockReason=${lockReason}`);
  }

  if (!user.handle) {
    redirect('/app/i/profile');
  }

  const returnTo = encodeURIComponent('/app/i/home');
  redirect(`/portfolio/${user.handle}?returnTo=${returnTo}`);
}
