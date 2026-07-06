'use client';

import { CheckCircle2, Circle, Clock3, Shield } from 'lucide-react';

import {
  getHiringCorridorPrivacyLabel,
  type HiringCorridorSnapshot,
} from '@/lib/hiring-corridor/snapshot';
import { cn } from '@/lib/utils';

type HiringCorridorTimelineProps = {
  corridor: HiringCorridorSnapshot;
};

function StepIcon({ status }: { status: HiringCorridorSnapshot['steps'][number]['status'] }) {
  if (status === 'complete') {
    return <CheckCircle2 className="h-4 w-4 text-[#1C4D3A]" />;
  }

  if (status === 'current') {
    return <Clock3 className="h-4 w-4 text-[#C76B4A]" />;
  }

  return <Circle className="h-4 w-4 text-[#B6B0A7]" />;
}

export function HiringCorridorTimeline({ corridor }: HiringCorridorTimelineProps) {
  const currentStepIndex = Math.max(
    corridor.steps.findIndex((step) => step.status === 'current'),
    0
  );
  const currentStep = corridor.steps[currentStepIndex] ?? corridor.steps[0];

  return (
    <div className="space-y-3 rounded-2xl border border-black/5 bg-[#FAF9F5] p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{corridor.summary}</p>
          <p className="text-sm text-muted-foreground">{corridor.nextAction.description}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-[#1C4D3A]">
          <Shield className="h-3.5 w-3.5" />
          <span>{getHiringCorridorPrivacyLabel(corridor.privacyStage)}</span>
        </div>
      </div>

      <div className="rounded-2xl bg-white/80 p-3 md:hidden">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6B6760]">
          Corridor step
        </p>
        <div className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
          {currentStep ? <StepIcon status={currentStep.status} /> : null}
          <span>
            {currentStep?.label ?? 'In progress'} · step {currentStepIndex + 1} of{' '}
            {corridor.steps.length}
          </span>
        </div>
      </div>

      <div className="hidden flex-wrap gap-2 md:flex">
        {corridor.steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium',
              step.status === 'complete' && 'border-[#CFE0D8] bg-[#ECF6F1] text-[#1C4D3A]',
              step.status === 'current' && 'border-[#E7D7C8] bg-[#FFF4EA] text-[#8B5A2B]',
              step.status === 'upcoming' && 'border-black/5 bg-white text-[#6B6760]'
            )}
          >
            <StepIcon status={step.status} />
            <span>{step.label}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white/80 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6B6760]">
          Current next action
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">{corridor.nextAction.label}</p>
      </div>
    </div>
  );
}
