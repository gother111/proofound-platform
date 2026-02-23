import { requirePersona } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function IndividualPortfolioRedirectPage() {
  const user = await requirePersona('individual');
  const handle = user.handle?.trim();

  if (!handle) {
    redirect('/onboarding');
  }

  redirect(`/portfolio/${encodeURIComponent(handle)}`);
}
