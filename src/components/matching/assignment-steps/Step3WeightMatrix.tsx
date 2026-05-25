'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Step5ExpertiseMapping } from './Step5ExpertiseMapping';

interface Step3Props {
  form: UseFormReturn<any>;
  onNext: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

const VERIFICATION_GATES = [
  {
    id: 'identity',
    label: 'Identity verification',
    description: 'Use when identity confirmation is genuinely necessary before matching.',
  },
  {
    id: 'work_email',
    label: 'Work email verification',
    description: 'Use only for roles where domain-backed work identity matters.',
  },
  {
    id: 'background_check',
    label: 'Background check',
    description: 'For roles with clear compliance or safety requirements.',
  },
  {
    id: 'education',
    label: 'Education verification',
    description: 'Only if a credential is truly necessary for the work.',
  },
];

export function Step3WeightMatrix({ form, onNext, onBack, isSubmitting = false }: Step3Props) {
  const { watch, setValue } = form;

  const expectedImpact = watch('expectedImpact') || '';
  const mustHaveSkills = watch('mustHaveSkills') || [];
  const verificationGates = watch('verificationGates') || [];
  const minMustHaveSkills = 3;

  const toggleVerificationGate = (gateId: string) => {
    const current = verificationGates || [];
    if (current.includes(gateId)) {
      setValue(
        'verificationGates',
        current.filter((id: string) => id !== gateId),
        { shouldDirty: true, shouldTouch: true }
      );
      return;
    }

    setValue('verificationGates', [...current, gateId], {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const isValid = expectedImpact.trim().length > 0 && mustHaveSkills.length >= minMustHaveSkills;

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold leading-tight">
            Step 3: What proof would convince the org
          </h2>
          <span className="text-sm text-muted-foreground">Step 3 of 5</span>
        </div>
        <p className="text-muted-foreground">
          Define what evidence, skills, or signals would make a proof submission credible for this
          assignment.
        </p>
        <Progress value={60} className="mt-4" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="expectedImpact">
          What proof would count <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="expectedImpact"
          value={expectedImpact}
          onChange={(event) =>
            setValue('expectedImpact', event.target.value, {
              shouldDirty: true,
              shouldTouch: true,
            })
          }
          className="min-h-[160px]"
          maxLength={1200}
          placeholder="Describe the proof, evidence, or practical signal that would make the org confident the submitter can do the work."
        />
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Spell out what would count as credible proof. Generic traits are not enough.
          </p>
          <span className="shrink-0 text-xs text-muted-foreground">
            {expectedImpact.length}/1200
          </span>
        </div>
      </div>

      <Step5ExpertiseMapping
        form={form}
        onBack={onBack}
        onSubmit={onNext}
        hideOptionalSections
        hideProgressHeader
        hideNavigation
        minMustHaveSkills={minMustHaveSkills}
      />

      <div className="space-y-4 rounded-lg border p-4">
        <div className="space-y-1">
          <Label>Additional verification gates</Label>
          <p className="text-sm text-muted-foreground">
            Keep these narrow. These add role-specific requirements on top of the baseline
            proof-plus-verification readiness rule.
          </p>
        </div>
        <div className="space-y-3">
          {VERIFICATION_GATES.map((gate) => (
            <div key={gate.id} className="flex items-start space-x-3 rounded-lg border p-3">
              <Checkbox
                id={gate.id}
                checked={verificationGates.includes(gate.id)}
                onCheckedChange={() => toggleVerificationGate(gate.id)}
              />
              <div className="flex-1">
                <Label htmlFor={gate.id} className="cursor-pointer font-medium">
                  {gate.label}
                </Label>
                <p className="mt-0.5 text-sm text-muted-foreground">{gate.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between border-t pt-4">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid || isSubmitting}>
          Next: What practical constraints are real
        </Button>
      </div>
    </div>
  );
}
