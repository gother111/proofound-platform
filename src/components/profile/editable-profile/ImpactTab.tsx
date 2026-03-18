'use client';

import Link from 'next/link';
import { PackageOpen, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import type { IndividualProfileCompletionState } from '@/lib/profile/completion-flow';
import type { ImpactStory } from '@/types/profile';

type ImpactTabProps = {
  impactStories: ImpactStory[];
  onAddStory: () => void;
  onEditStory: (story: ImpactStory) => void;
  onDeleteStory: (id: string) => void;
  actionsDisabled: boolean;
  completionState: IndividualProfileCompletionState;
  proofArtifactCount: number;
  acceptedVerificationCount: number;
};

function resolveProofPackBlockers(completionState: IndividualProfileCompletionState) {
  const blockers: string[] = [];

  if (!completionState.checks.hasRealContext) {
    blockers.push('Add one real context so your proof has a credible anchor.');
  }

  if (!completionState.checks.hasFirstProof) {
    blockers.push('Add your first proof link or artifact.');
  }

  if (!completionState.checks.hasStructuredProofPack) {
    blockers.push('Structure one anchored Proof Pack before you publish.');
  }

  if (!completionState.checks.hasPublishedPortfolio) {
    blockers.push('Choose one proof-backed public signal and publish your portfolio.');
  }

  return blockers.slice(0, 3);
}

export function ImpactTab({
  completionState,
  proofArtifactCount,
  acceptedVerificationCount,
}: ImpactTabProps) {
  const blockers = resolveProofPackBlockers(completionState);
  const primaryCtaLabel =
    proofArtifactCount > 0 ? 'Open portfolio workspace' : 'Add your first proof';

  return (
    <TabsContent value="proof_packs" className="space-y-6">
      <Card className="border-proofound-stone/60 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-proofound-forest/10 p-2 text-proofound-forest">
            <PackageOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">Proof Packs</h3>
              <p className="text-sm text-muted-foreground">
                Proof Pack is the canonical proof object. Keep the story calm and anchored to real
                context, then manage publication from the portfolio workspace.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-proofound-stone/60 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Proof items
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{proofArtifactCount}</p>
              </div>
              <div className="rounded-lg border border-proofound-stone/60 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Accepted trust signals
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {acceptedVerificationCount}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-proofound-stone/60 bg-japandi-bg/50 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-proofound-forest" />
                Readiness blockers
              </p>
              {blockers.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {blockers.map((blocker) => (
                    <li key={blocker} className="text-sm text-muted-foreground">
                      {blocker}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Your portfolio foundation is in place. Keep proof fresh and public-safe.
                </p>
              )}
            </div>

            <Button asChild className="bg-proofound-forest text-white hover:bg-proofound-forest/90">
              <Link href="/app/i/portfolio">{primaryCtaLabel}</Link>
            </Button>
          </div>
        </div>
      </Card>
    </TabsContent>
  );
}
