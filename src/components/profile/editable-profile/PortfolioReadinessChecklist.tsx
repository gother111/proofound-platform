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
      passed: completionState.checks.hasSafeShell,
    },
    {
      id: 'context',
      label: 'One real context is anchored',
      passed: completionState.checks.hasRealContext,
    },
    {
      id: 'proof',
      label: 'One real proof is added and structured',
      passed: completionState.checks.hasFirstProof && completionState.checks.hasStructuredProofPack,
    },
    {
      id: 'verification',
      label: 'One non-self verification is accepted',
      passed: completionState.checks.hasRequiredVerification,
    },
    {
      id: 'publish',
      label: 'Portfolio is published and accessible',
      passed: completionState.checks.hasPublishedPortfolio,
    },
  ];

  return (
    <Card className="p-4 border-proofound-stone/60" data-testid="portfolio-readiness-checklist">
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-proofound-charcoal">Public Portfolio readiness</h2>
        <p className="text-xs text-muted-foreground">
          Keep this calm and minimal. Portfolio readiness now depends on a safe shell, one real
          context, one anchored Proof Pack, one accepted non-self verification, and an accessible
          public portfolio state.
        </p>
        <div className="pt-1 space-y-2">
          {checklist.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              {item.passed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
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
