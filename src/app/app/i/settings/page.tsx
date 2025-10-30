import { requireAuth } from '@/lib/auth';
import { SettingsContent } from '@/components/settings/SettingsContent';

export const dynamic = 'force-dynamic';

export default async function IndividualSettingsPage() {
  const user = await requireAuth();

  return <SettingsContent userId={user.id} />;
}
