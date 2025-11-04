import { requireAuth } from '@/lib/auth';
import { FairnessSettingsClient } from './FairnessSettingsClient';

export const dynamic = 'force-dynamic';

export default async function FairnessSettingsPage() {
  await requireAuth();

  return <FairnessSettingsClient />;
}

