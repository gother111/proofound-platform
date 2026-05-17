import { CommunicationsHub } from '@/components/communications/CommunicationsHub';
import { requirePersona } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function OrganizationCommunicationsPage() {
  const user = await requirePersona('org_member');

  return <CommunicationsHub perspective="organization" currentUserId={user.id} />;
}
