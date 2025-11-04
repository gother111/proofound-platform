import { requireAuth } from '@/lib/auth';
import { IntegrationsClient } from './IntegrationsClient';

export const dynamic = 'force-dynamic';

export default async function IntegrationsPage() {
  await requireAuth();

  return <IntegrationsClient />;
}

