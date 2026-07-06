'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';

type VerificationTabProps = {
  acceptedVerificationCount: number;
};

export function VerificationTab({ acceptedVerificationCount }: VerificationTabProps) {
  return (
    <TabsContent value="verification" className="space-y-6">
      <Card className="border-proofound-stone/60 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-proofound-forest/10 p-2 text-proofound-forest">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">Verification</h3>
              <p className="text-sm text-muted-foreground">
                Verification is scoped, not global. You can publish with structured proof first;
                accepted non-self trust upgrades the public badge and supports intro readiness.
              </p>
            </div>

            <div className="rounded-lg border border-proofound-stone/60 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Accepted verifications
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {acceptedVerificationCount}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {acceptedVerificationCount > 0
                  ? 'Your profile already has non-self trust attached to it.'
                  : 'No trust signals are attached yet. Your public proof stays Self-reported until one is accepted.'}
              </p>
            </div>

            <Button asChild variant="outline">
              <Link href="/app/i/verifications">Open verification center</Link>
            </Button>
          </div>
        </div>
      </Card>
    </TabsContent>
  );
}
