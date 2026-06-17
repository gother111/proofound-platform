import { Card, CardDescription, CardHeader } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function VerifyEmailPageFallback() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-proofound-parchment px-4 py-10 dark:bg-background"
      data-testid="verify-email-page-fallback"
    >
      <Card className="w-full max-w-md rounded-[24px] border-proofound-stone bg-white/95 shadow-[0_4px_24px_rgba(29,51,48,0.08)] dark:border-border">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-proofound-forest/10">
            <Loader2
              className="h-6 w-6 animate-spin text-proofound-forest dark:text-primary"
              aria-hidden="true"
            />
          </div>
          <h1 className="font-display text-2xl font-semibold leading-none tracking-tight text-proofound-charcoal dark:text-foreground">
            Verifying your email
          </h1>
          <CardDescription className="leading-6 text-proofound-charcoal/70 dark:text-muted-foreground">
            We are checking this verification link before opening your Proofound account. No
            profile, proof, or privacy setting changes from this loading state.
          </CardDescription>
          <p
            className="mt-3 text-sm text-proofound-charcoal/70 dark:text-muted-foreground"
            role="status"
          >
            Checking verification link...
          </p>
        </CardHeader>
      </Card>
    </div>
  );
}
