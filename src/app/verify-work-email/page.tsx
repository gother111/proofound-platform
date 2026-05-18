import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { VerifyWorkEmailContent } from './VerifyWorkEmailContent';

export const dynamic = 'force-dynamic';

export default function VerifyWorkEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-proofound-parchment dark:bg-background">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-proofound-forest/10">
            <Loader2 className="h-6 w-6 animate-spin text-proofound-forest" />
          </span>
        </div>
      }
    >
      <VerifyWorkEmailContent />
    </Suspense>
  );
}
