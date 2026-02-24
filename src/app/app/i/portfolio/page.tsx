import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function IndividualPortfolioShortcutPage() {
  const user = await requireAuth();

  if (!user.handle) {
    redirect('/app/i/profile');
  }

  redirect(`/portfolio/${user.handle}`);
}
