import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { VerifyWorkEmailContent } from './VerifyWorkEmailContent';

export const dynamic = 'force-dynamic';

export default function VerifyWorkEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-proofound-parchment dark:bg-background">
          <Loader2 className="w-16 h-16 text-proofound-forest animate-spin" />
        </div>
      }
    >
      <VerifyWorkEmailContent />
    </Suspense>
  );
}
