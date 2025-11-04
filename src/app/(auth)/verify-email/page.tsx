import { Suspense } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { VerifyEmailContent } from './VerifyEmailContent';

export const dynamic = 'force-dynamic';

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-proofound-parchment dark:bg-background px-4">
          <Card className="max-w-md w-full border-proofound-stone dark:border-border rounded-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-proofound-forest/10 flex items-center justify-center mb-4">
                <Loader2 className="w-6 h-6 text-proofound-forest dark:text-primary animate-spin" />
              </div>
              <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
                Loading...
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
