import { requireAuth } from '@/lib/auth';
import { PrivacySettingsClient } from './PrivacySettingsClient';

export const dynamic = 'force-dynamic';

export default async function PrivacySettingsPage() {
  await requireAuth();

  return <PrivacySettingsClient />;
}

