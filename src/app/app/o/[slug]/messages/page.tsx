import { DeferredOrgMessagesClient } from './DeferredOrgMessagesClient';
import { requirePersona } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function OrganizationMessagesPage() {
  const user = await requirePersona('org_member');

  return <DeferredOrgMessagesClient currentUserId={user.id} />;
}
