import { requireAuth } from '@/lib/auth';
import { DeferredPrivacySettingsClient } from './DeferredPrivacySettingsClient';

export const dynamic = 'force-dynamic';

export default async function PrivacySettingsPage() {
  await requireAuth();

  return <DeferredPrivacySettingsClient />;
}
