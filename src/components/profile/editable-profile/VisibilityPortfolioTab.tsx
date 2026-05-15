'use client';

import Link from 'next/link';
import { Download, Globe, History, LockKeyhole } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import type { IndividualProfileCompletionState } from '@/lib/profile/completion-flow';

type VisibilityPortfolioTabProps = {
  completionState: IndividualProfileCompletionState;
  onCompleteSafeShell: () => void;
};

export function VisibilityPortfolioTab({
  completionState,
  onCompleteSafeShell,
}: VisibilityPortfolioTabProps) {
  const isSafeShellLocked = completionState.portfolioLockCode === 'safe_shell';
  const trustLinks = [
    {
      icon: LockKeyhole,
      label: 'Privacy controls',
      href: '/app/i/settings/privacy',
    },
    {
      icon: Download,
      label: 'Export or delete',
      href: '/app/i/settings?tab=privacy',
    },
    {
      icon: History,
      label: 'Audit log',
      href: '/app/i/settings/audit-log',
    },
  ];

  return (
    <TabsContent value="visibility" className="space-y-6">
      <Card className="border-proofound-stone/60 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-proofound-forest/10 p-2 text-proofound-forest">
            <Globe className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">Public Page visibility</h3>
              <p className="text-sm text-muted-foreground">
                Public Page publication is an explicit direct-link proof snapshot. It never weakens
                blind review or bypasses consent-based reveal.
              </p>
            </div>

            <div className="rounded-lg border border-proofound-stone/60 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Current state
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {completionState.checks.hasPublishedPortfolio
                  ? 'Your Public Page is published and accessible by direct link.'
                  : completionState.portfolioLockReason ||
                    'Choose one proof-backed and verified public signal when it is ready and public-safe.'}
              </p>
            </div>

            {isSafeShellLocked ? (
              <Button type="button" onClick={onCompleteSafeShell}>
                Complete safe shell
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/app/i/profile?profileView=full&tab=visibility">Manage visibility</Link>
              </Button>
            )}

            <div className="grid gap-2 sm:grid-cols-3">
              {trustLinks.map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex min-h-11 items-center gap-2 rounded-lg border border-proofound-stone/60 bg-[#fbf8f1]/70 px-3 py-2 text-sm font-medium text-proofound-charcoal transition-colors hover:border-proofound-forest/30 hover:bg-[#fbf8f1]"
                >
                  <Icon className="h-4 w-4 shrink-0 text-proofound-forest" />
                  <span className="min-w-0 truncate">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </TabsContent>
  );
}
