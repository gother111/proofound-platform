import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { IntegrationsClient } from './IntegrationsClient';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function IntegrationsPage() {
  await requireAuth();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F6F1] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#6B6760] animate-spin" />
        </div>
      }
    >
      <IntegrationsClient />
    </Suspense>
  );
}
