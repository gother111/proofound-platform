'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Globe, PackageOpen, ShieldCheck, Sparkles, Workflow } from 'lucide-react';

import { ShareLinkButton } from '@/app/portfolio/[handle]/ShareLinkButton';
import { CopyTextButton } from '@/app/portfolio/[handle]/CopyTextButton';
import { DownloadPdfButton } from '@/app/portfolio/[handle]/DownloadPdfButton';
import { AddSkillDrawer } from '@/app/app/i/expertise/components/AddSkillDrawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { PortfolioVisibilityCard } from '@/components/settings/PortfolioVisibilityCard';
import type { IndividualReadiness } from '@/lib/momentum/types';
import type { IndividualProfileCompletionState } from '@/lib/profile/completion-flow';
import {
  getLaunchPrimaryAction,
  getLaunchReadinessBlockers,
  getLaunchReadinessDisplayLabel,
  getLaunchReadinessSummary,
} from '@/lib/readiness/launch-display';

type PortfolioWorkspaceClientProps = {
  readiness: IndividualReadiness;
  completionState: IndividualProfileCompletionState;
};

export function PortfolioWorkspaceClient({
  readiness,
  completionState,
}: PortfolioWorkspaceClientProps) {
  const router = useRouter();
  const [isAddSkillDrawerOpen, setIsAddSkillDrawerOpen] = useState(false);
  const launchLabel = getLaunchReadinessDisplayLabel(readiness.flags);
  const launchSummary = getLaunchReadinessSummary(readiness.flags);
  const blockers = getLaunchReadinessBlockers(readiness);
  const primaryAction = getLaunchPrimaryAction(readiness.topActions);
  const publicUrl =
    readiness.flags.portfolioReady && completionState.checks.hasPublishedPortfolio
      ? readiness.publicPortfolioUrl
      : null;

  const handlePrimaryAction = () => {
    if (readiness.proofProgress.totalProofs === 0 || primaryAction?.id === 'add-first-proof') {
      setIsAddSkillDrawerOpen(true);
      return;
    }

    if (primaryAction?.category === 'verification') {
      router.push('/app/i/verifications');
      return;
    }

    if (primaryAction?.id === 'publish-portfolio' || primaryAction?.id === 'preview-portfolio') {
      document.getElementById('visibility-portfolio-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      return;
    }

    if (primaryAction?.actionUrl === '/app/i/portfolio') {
      document.getElementById('proof-packs-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      return;
    }

    router.push(primaryAction?.actionUrl || '/app/i/portfolio');
  };

  const primaryActionLabel =
    readiness.proofProgress.totalProofs === 0
      ? 'Add your first proof'
      : primaryAction?.title || 'Strengthen proof packs';
  const primaryActionDescription =
    readiness.proofProgress.totalProofs === 0
      ? 'Start with one real proof linked to a real skill or context.'
      : primaryAction?.description || 'Keep your proof packs current, anchored, and public-safe.';

  return (
    <AppSurface>
      <div className="space-y-6">
        <Card className="border-proofound-stone/60 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="w-fit">
                  {launchLabel}
                </Badge>
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Proof-first workspace
                </span>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold text-foreground">Portfolio workspace</h1>
                <p className="max-w-2xl text-sm text-muted-foreground">{launchSummary}</p>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Public portfolio publication stays separate from blind review. Identity-bearing
                  reveal still requires candidate consent.
                </p>
              </div>
            </div>

            <Card className="w-full max-w-md border-proofound-stone/60 bg-japandi-bg/50 p-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Next action
                  </p>
                  <h2 className="text-lg font-semibold text-foreground">{primaryActionLabel}</h2>
                  <p className="text-sm text-muted-foreground">{primaryActionDescription}</p>
                </div>
                <Button
                  onClick={handlePrimaryAction}
                  className="w-full bg-proofound-forest text-white hover:bg-proofound-forest/90"
                >
                  {primaryActionLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Card id="proof-packs-section" className="border-proofound-stone/60 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-proofound-forest/10 p-2 text-proofound-forest">
                  <PackageOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0 space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-foreground">Proof Packs</h2>
                    <p className="text-sm text-muted-foreground">
                      Proof Pack is the canonical proof object. Start there, then add verification
                      and visibility when the pack is strong enough.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-proofound-stone/60 bg-white p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Proof items
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">
                        {readiness.proofProgress.totalProofs}
                      </p>
                    </div>
                    <div className="rounded-lg border border-proofound-stone/60 bg-white p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Verified
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">
                        {readiness.proofProgress.verifiedProofs}
                      </p>
                    </div>
                    <div className="rounded-lg border border-proofound-stone/60 bg-white p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Next
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {readiness.proofProgress.nextStep}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-proofound-stone/60 bg-white p-4">
                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Sparkles className="h-4 w-4 text-proofound-forest" />
                      What still blocks the next launch state
                    </p>
                    {blockers.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {blockers.map((item) => (
                          <li key={item.id} className="rounded-md bg-japandi-bg/50 px-3 py-2">
                            <p className="text-sm font-medium text-foreground">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.detail}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        No launch blockers are active right now. Keep proof fresh and public-safe.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card id="visibility-portfolio-section" className="border-proofound-stone/60 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-proofound-forest/10 p-2 text-proofound-forest">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0 space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-foreground">Verification</h2>
                    <p className="text-sm text-muted-foreground">
                      Verification is optional for portfolio-ready, but it matters for stronger
                      matching signal and for introductions.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-proofound-stone/60 bg-white p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Accepted trust signals
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">
                        {completionState.counts.acceptedVerifications}
                      </p>
                    </div>
                    <div className="rounded-lg border border-proofound-stone/60 bg-white p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Pending requests
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">
                        {readiness.metrics.pendingVerifications}
                      </p>
                    </div>
                  </div>

                  <Button asChild variant="outline">
                    <Link href="/app/i/verifications">
                      Open verification center
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-proofound-stone/60 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-proofound-forest/10 p-2 text-proofound-forest">
                  <Globe className="h-5 w-5" />
                </div>
                <div className="min-w-0 space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-foreground">
                      Visibility / Portfolio
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Shareable by direct link comes first. Public publication never weakens review
                      stage privacy.
                    </p>
                  </div>

                  {publicUrl ? (
                    <div className="rounded-lg border border-proofound-stone/60 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Public portfolio link
                      </p>
                      <p className="mt-2 break-all text-sm text-foreground">{publicUrl}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={publicUrl} target="_blank" rel="noreferrer">
                            Preview public portfolio
                          </Link>
                        </Button>
                        <ShareLinkButton url={publicUrl} />
                        <CopyTextButton />
                        <DownloadPdfButton />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-proofound-stone/60 bg-white p-4">
                      <p className="text-sm font-medium text-foreground">
                        Your public link is not live yet.
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {completionState.portfolioLockReason ||
                          'Publish one proof-backed signal when it is ready and public-safe.'}
                      </p>
                    </div>
                  )}

                  <div className="rounded-lg border border-proofound-stone/60 bg-japandi-bg/50 p-4">
                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Workflow className="h-4 w-4 text-proofound-forest" />
                      Privacy guardrail
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Blind-by-default review stays intact. Identity-bearing reveal still needs your
                      consent, even after portfolio publication.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <PortfolioVisibilityCard />
          </div>
        </div>
      </div>

      <AddSkillDrawer
        open={isAddSkillDrawerOpen}
        onOpenChange={setIsAddSkillDrawerOpen}
        domains={[]}
        taxonomyReady
        onSkillAdded={() => {
          router.refresh();
        }}
      />
    </AppSurface>
  );
}
