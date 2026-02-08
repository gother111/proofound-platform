import { redirect } from 'next/navigation';
import { requireAuth, getUserOrganizations } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Persona-agnostic entrypoint for notifications.
 *
 * - Individuals land on /app/i/notifications
 * - Org members land on /app/o/[slug]/notifications
 */
export default async function AppNotificationsRedirect() {
  const user = await requireAuth();

  if (user.persona !== 'org_member') {
    redirect('/app/i/notifications');
  }

  const orgs = await getUserOrganizations(user.id);
  const slug = orgs[0]?.org.slug;
  if (slug) {
    redirect(`/app/o/${slug}/notifications`);
  }

  redirect('/app/i/notifications');
}
