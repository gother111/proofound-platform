'use client';

import Link from 'next/link';
import { Globe } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import type { IndividualProfileCompletionState } from '@/lib/profile/completion-flow';

type VisibilityPortfolioTabProps = {
  completionState: IndividualProfileCompletionState;
};

export function VisibilityPortfolioTab({ completionState }: VisibilityPortfolioTabProps) {
  return (
    <TabsContent value="visibility" className="space-y-6">
      <Card className="border-proofound-stone/60 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-proofound-forest/10 p-2 text-proofound-forest">
            <Globe className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">Visibility / Portfolio</h3>
              <p className="text-sm text-muted-foreground">
                Public portfolio publication is an explicit share surface. It never weakens blind
                review or bypasses consent-based reveal.
              </p>
            </div>

            <div className="rounded-lg border border-proofound-stone/60 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Current state
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {completionState.checks.hasPublishedPortfolio
                  ? 'Your public portfolio is published and accessible.'
                  : completionState.portfolioLockReason ||
                    'Choose one proof-backed public signal when it is ready and public-safe.'}
              </p>
            </div>

            <Button asChild variant="outline">
              <Link href="/app/i/portfolio">Open portfolio workspace</Link>
            </Button>
          </div>
        </div>
      </Card>
    </TabsContent>
  );
}
