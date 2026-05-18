import { CommunicationsHub } from '@/components/communications/CommunicationsHub';
import { requirePersona } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function OrganizationCommunicationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ section?: string }>;
}) {
  const user = await requirePersona('org_member');
  const params = await searchParams;

  return (
    <CommunicationsHub
      perspective="organization"
      currentUserId={user.id}
      initialSection={params?.section}
    />
  );
}
