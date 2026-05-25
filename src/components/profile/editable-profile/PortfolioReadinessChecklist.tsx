'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';

import { Card } from '@/components/ui/card';
import type { IndividualProfileCompletionState } from '@/lib/profile/completion-flow';

type PortfolioReadinessChecklistProps = {
  completionState: IndividualProfileCompletionState;
};

export function PortfolioReadinessChecklist({ completionState }: PortfolioReadinessChecklistProps) {
  const [isOpen, setIsOpen] = useState(true);

  const checklist = [
    {
      id: 'safe_shell',
      label: 'Safe shell basics',
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
      id: 'first_proof',
      label: 'First proof artifact added',
      nextAction: 'Add your first proof',
      passed: completionState.checks.hasFirstProof,
    },
    {
      id: 'structured_proof',
      label: 'Proof Pack structured',
      nextAction: 'Structure your first Proof Pack',
      passed: completionState.checks.hasStructuredProofPack,
    },
    {
      id: 'verification',
      label: 'One non-self verification is accepted',
      nextAction: 'Request one non-self verification',
      passed: completionState.checks.hasRequiredVerification,
    },
    {
      id: 'publish',
      label: 'Public Page publication',
      nextAction: 'Publish one public-safe proof item',
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
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-proofound-forest text-xs font-semibold text-white">
              {completedCount}/{checklist.length}
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-proofound-charcoal">
                Public Page readiness
              </h2>
              <p className="text-xs text-muted-foreground">
                Complete one clear proof path before publishing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial rounded-lg border border-proofound-stone/70 bg-white/65 px-3 py-1.5 text-xs text-proofound-charcoal">
              <span className="font-medium text-muted-foreground">Next: </span>
              {nextItem ? nextItem.nextAction : 'Ready to review'}
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-proofound-stone/60 hover:bg-[#fbf8f1] transition-colors"
              aria-label={isOpen ? 'Collapse checklist' : 'Expand checklist'}
            >
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="grid gap-2 border-t border-proofound-stone/50 pt-4 sm:grid-cols-2 md:grid-cols-3">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-xl border border-proofound-stone/60 bg-white/55 px-3 py-2 text-xs"
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
        )}
      </div>
    </Card>
  );
}
