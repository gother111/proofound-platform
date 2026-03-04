'use client';

import { CheckCircle2, ListChecks, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ImportActionSummary {
  skillsSelected: number;
  skillsNeedingMapping: number;
  workCount: number;
  learningCount: number;
  volunteeringCount: number;
  languageCount: number;
}

interface ImportActionBannerProps {
  summary: ImportActionSummary;
  onApplyReviewed: () => void;
  onApplySkillsOnly: () => void;
  onExpandAll: () => void;
  isApplying?: boolean;
  applyDisabled?: boolean;
  applySkillsOnlyDisabled?: boolean;
  className?: string;
}

export function ImportActionBanner({
  summary,
  onApplyReviewed,
  onApplySkillsOnly,
  onExpandAll,
  isApplying = false,
  applyDisabled = false,
  applySkillsOnlyDisabled = false,
  className,
}: ImportActionBannerProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-proofound-forest/20 bg-proofound-forest/5 p-4',
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-proofound-forest" />
            Analysis summary and next step
          </p>
          <p className="text-sm text-muted-foreground">
            Finish review and apply all approved entries, or apply approved skills only.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="secondary">Skills selected: {summary.skillsSelected}</Badge>
            <Badge variant="secondary">Needs mapping: {summary.skillsNeedingMapping}</Badge>
            <Badge variant="secondary">Work: {summary.workCount}</Badge>
            <Badge variant="secondary">Learning: {summary.learningCount}</Badge>
            <Badge variant="secondary">Volunteering: {summary.volunteeringCount}</Badge>
            <Badge variant="secondary">Languages: {summary.languageCount}</Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={onApplyReviewed}
            disabled={applyDisabled || isApplying}
            className="min-w-[210px]"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {isApplying ? 'Applying...' : 'Finish Review & Apply'}
          </Button>
          <Button
            variant="outline"
            onClick={onApplySkillsOnly}
            className="min-w-[180px]"
            disabled={applySkillsOnlyDisabled || isApplying}
          >
            Apply skills only
          </Button>
          <Button variant="outline" onClick={onExpandAll} className="min-w-[200px]">
            <ListChecks className="mr-2 h-4 w-4" />
            Expand all sections
          </Button>
        </div>
      </div>
    </div>
  );
}
