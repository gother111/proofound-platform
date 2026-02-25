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
      id: 'name',
      label: 'Name + surname',
      passed: completionState.checks.hasTwoWordName,
    },
    {
      id: 'purpose',
      label: 'At least 1 value and 1 cause',
      passed: completionState.checks.hasValues && completionState.checks.hasCauses,
    },
    {
      id: 'skills',
      label: 'At least 3 skills',
      passed: completionState.checks.hasMinimumSkills,
    },
    {
      id: 'artifact',
      label: 'At least 1 proof or accepted verification',
      passed: completionState.checks.hasVerificationArtifact,
    },
  ];

  return (
    <Card className="p-4 border-proofound-stone/60" data-testid="portfolio-readiness-checklist">
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-proofound-charcoal">Public Portfolio readiness</h2>
        <p className="text-xs text-muted-foreground">
          Complete each requirement to unlock Public Portfolio navigation.
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
