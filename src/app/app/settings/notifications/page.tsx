import { redirect } from 'next/navigation';
import { requireAuth, getUserOrganizations } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Persona-agnostic entrypoint for notification preferences.
 *
 * - Individuals land on /app/i/settings/notifications
 * - Org members land on /app/o/[slug]/settings/notifications
 */
export default async function AppNotificationSettingsRedirect() {
  const user = await requireAuth();

  if (user.persona !== 'org_member') {
    redirect('/app/i/settings/notifications');
  }

  const orgs = await getUserOrganizations(user.id);
  const slug = orgs[0]?.org.slug;
  if (slug) {
    redirect(`/app/o/${slug}/settings/notifications`);
  }

  redirect('/app/i/settings/notifications');
}
