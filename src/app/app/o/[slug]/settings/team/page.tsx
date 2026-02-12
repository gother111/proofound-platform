import { getActiveOrg, requireAuth } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import OrganizationMembersPage from '../../members/page';

export const dynamic = 'force-dynamic';

export default async function OrganizationTeamSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireAuth();
  const { slug } = await params;
  const result = await getActiveOrg(slug, user.id);

  if (!result) {
    notFound();
  }

  const { membership } = result;
  const canManageSettings = membership.role === 'owner' || membership.role === 'admin';
  if (!canManageSettings) {
    redirect(`/app/o/${slug}/home`);
  }

  return <OrganizationMembersPage params={Promise.resolve({ slug })} />;
}
