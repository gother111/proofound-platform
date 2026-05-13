import { requireAuth } from '@/lib/auth';
import { DeferredSettingsContent } from '@/components/settings/DeferredSettingsContent';

export const dynamic = 'force-dynamic';

export default async function IndividualSettingsPage() {
  const user = await requireAuth();

  return <DeferredSettingsContent userId={user.id} />;
}
