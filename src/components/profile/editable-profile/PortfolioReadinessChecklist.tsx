'use client';

import { CheckCircle2, Circle } from 'lucide-react';

import { Card } from '@/components/ui/card';
import type { IndividualProfileCompletionState } from '@/lib/profile/completion-flow';

type PortfolioReadinessChecklistProps = {
  completionState: IndividualProfileCompletionState;
};

export function PortfolioReadinessChecklist({ completionState }: PortfolioReadinessChecklistProps) {
  const checklist = [
    {
      id: 'safe_shell',
      label: 'Safe shell is complete',
      nextAction: 'Complete your safe shell',
      passed: completionState.checks.hasSafeShell,
    },
    {
      id: 'context',
      label: 'One real context is anchored',
      nextAction: 'Anchor one real context',
      passed: completionState.checks.hasRealContext,
    },
    {
      id: 'proof',
      label: 'One real proof is added and structured',
      nextAction: completionState.checks.hasFirstProof
        ? 'Structure your first Proof Pack'
        : 'Add your first proof',
      passed: completionState.checks.hasFirstProof && completionState.checks.hasStructuredProofPack,
    },
    {
      id: 'verification',
      label: 'One non-self verification is accepted',
      nextAction: 'Request one non-self verification',
      passed: completionState.checks.hasRequiredVerification,
    },
    {
      id: 'publish',
      label: 'Portfolio is published and accessible',
      nextAction: 'Publish one proof-backed signal',
      passed: completionState.checks.hasPublishedPortfolio,
    },
  ];
  const completedCount = checklist.filter((item) => item.passed).length;
  const nextItem = checklist.find((item) => !item.passed);

  return (
    <Card
      className="border-proofound-stone/60 p-4 sm:p-5"
      data-testid="portfolio-readiness-checklist"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-proofound-forest text-sm font-semibold text-white">
              {completedCount}/{checklist.length}
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-proofound-charcoal">
                Public Page readiness
              </h2>
              <p className="text-xs leading-5 text-muted-foreground">
                Complete one clear proof path before publishing.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-proofound-stone/70 bg-white/65 px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-proofound-charcoal">
              Next
            </p>
            <p className="mt-1 text-sm text-proofound-charcoal">
              {nextItem ? nextItem.nextAction : 'Public Page is ready to review'}
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {checklist.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-xl border border-proofound-stone/60 bg-white/55 px-3 py-2 text-sm"
            >
              {item.passed ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
              <span className={item.passed ? 'text-proofound-charcoal' : 'text-muted-foreground'}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
