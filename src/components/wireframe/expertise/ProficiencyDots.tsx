'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { EvidenceType } from './types';

type ProficiencyLevel = 1 | 2 | 3 | 4 | 5;

interface ProficiencyDotsProps {
  level: ProficiencyLevel;
  showLabel?: boolean;
  showBARS?: boolean;
  onChange?: (level: ProficiencyLevel) => void;
  editable?: boolean;
}

const LABELS: Record<ProficiencyLevel, string> = {
  1: 'Novice',
  2: 'Advanced Beginner',
  3: 'Competent',
  4: 'Proficient',
  5: 'Expert',
};

const DESCRIPTIONS: Record<ProficiencyLevel, { short: string; full: string; sfia: string }> = {
  1: {
    short: 'Follows steps',
    full: 'Relies on guidance and known procedures.',
    sfia: 'SFIA 1-2: Follow, Assist',
  },
  2: {
    short: 'Recognizes patterns',
    full: 'Adapts solutions using emerging experience.',
    sfia: 'SFIA 3: Apply',
  },
  3: {
    short: 'Plans & prioritizes',
    full: 'Manages complexity, balances trade-offs.',
    sfia: 'SFIA 4: Enable',
  },
  4: {
    short: 'Optimizes & adapts',
    full: 'Reads context, guides others, adjusts practices.',
    sfia: 'SFIA 5-6: Ensure, Initiate',
  },
  5: {
    short: 'Innovates & mentors',
    full: 'Sets standards, invents new approaches, mentors teams.',
    sfia: 'SFIA 7: Set strategy, Inspire',
  },
};

export function ProficiencyDots({
  level,
  showLabel = true,
  showBARS = true,
  onChange,
  editable = false,
}: ProficiencyDotsProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => {
            const active = value <= level;
            return (
              <Tooltip key={value}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => editable && onChange?.(value as ProficiencyLevel)}
                    className={`h-2.5 w-2.5 rounded-full transition ${
                      active
                        ? 'scale-100 bg-[#1C4D3A] dark:bg-[#B8D4C6]'
                        : 'scale-75 bg-[#E8E6DD] opacity-50 dark:bg-[#4A4540]'
                    } ${editable ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
                    aria-label={`${LABELS[value as ProficiencyLevel]}: ${DESCRIPTIONS[value as ProficiencyLevel].short}`}
                  />
                </TooltipTrigger>
                {showBARS && (
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs font-medium">
                      Level {value}: {LABELS[value as ProficiencyLevel]}
                    </p>
                    <p className="text-xs opacity-80">
                      {DESCRIPTIONS[value as ProficiencyLevel].full}
                    </p>
                    <p className="text-[11px] opacity-60">
                      {DESCRIPTIONS[value as ProficiencyLevel].sfia}
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>
        {showLabel && (
          <span className="text-xs text-[#2D3330]/80 dark:text-[#E8E6DD]/80">{LABELS[level]}</span>
        )}
      </div>
    </TooltipProvider>
  );
}
