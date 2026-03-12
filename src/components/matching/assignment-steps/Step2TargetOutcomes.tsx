'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Step2Props {
  form: UseFormReturn<any>;
  onNext: () => void;
  onBack: () => void;
}

const TIMEFRAME_OPTIONS = [
  { value: '30d', label: 'First 30 days' },
  { value: '90d', label: 'First 90 days' },
  { value: '6mo', label: 'Within 6 months' },
  { value: '12mo', label: 'Within 12 months' },
];

export function Step2TargetOutcomes({ form, onNext, onBack }: Step2Props) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const description = watch('description') || '';
  const outcomes = watch('outcomes') || [];

  const addOutcome = () => {
    setValue('outcomes', [...outcomes, { metric: '', target: '', timeframe: '90d' }], {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const removeOutcome = (index: number) => {
    setValue(
      'outcomes',
      outcomes.filter((_: unknown, currentIndex: number) => currentIndex !== index),
      {
        shouldDirty: true,
        shouldTouch: true,
      }
    );
  };

  const updateOutcome = (index: number, field: string, value: string) => {
    const updated = [...outcomes];
    updated[index] = { ...updated[index], [field]: value };
    setValue('outcomes', updated, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const isValid =
    description.trim().length > 0 &&
    outcomes.length > 0 &&
    outcomes.every((outcome: any) => outcome.metric && outcome.target && outcome.timeframe);

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Step 2: What work will actually be done</h2>
          <span className="text-sm text-muted-foreground">Step 2 of 5</span>
        </div>
        <p className="text-muted-foreground">
          Describe the real work, then list the deliverables or outcomes that would show progress.
        </p>
        <Progress value={40} className="mt-4" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          What work will actually be done <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Describe the responsibilities, deliverables, and type of work this person will actually do."
          className="min-h-[160px]"
          maxLength={1200}
          {...register('description', {
            required: 'Work summary is required',
          })}
        />
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Be concrete enough that a reviewer could tell what the role is expected to produce.
          </p>
          <span className="text-xs text-muted-foreground">{description.length}/1200</span>
        </div>
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message as string}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <Label>
            Outcomes or deliverables <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-muted-foreground">
            Add at least one concrete outcome that would help the organization decide whether the
            work is on track.
          </p>
        </div>

        {outcomes.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <p className="mb-4 text-muted-foreground">
              No outcomes added yet. Start with one clear deliverable or measurable result.
            </p>
            <Button onClick={addOutcome} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add first outcome
            </Button>
          </div>
        ) : null}

        {outcomes.map((outcome: any, index: number) => (
          <div key={index} className="relative space-y-4 rounded-lg border p-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => removeOutcome(index)}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="space-y-2 pr-10">
              <Label htmlFor={`metric-${index}`}>Outcome or deliverable</Label>
              <Input
                id={`metric-${index}`}
                placeholder="e.g., Launch a partner onboarding flow"
                value={outcome.metric}
                onChange={(event) => updateOutcome(index, 'metric', event.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`target-${index}`}>What success looks like</Label>
                <Input
                  id={`target-${index}`}
                  placeholder="e.g., First 20 partners fully onboarded"
                  value={outcome.target}
                  onChange={(event) => updateOutcome(index, 'target', event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`timeframe-${index}`}>Timeframe</Label>
                <Select
                  value={outcome.timeframe}
                  onValueChange={(value) => updateOutcome(index, 'timeframe', value)}
                >
                  <SelectTrigger id={`timeframe-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEFRAME_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}

        {outcomes.length > 0 ? (
          <Button onClick={addOutcome} variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add another outcome
          </Button>
        ) : null}
      </div>

      <div className="flex justify-between border-t pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid}>
          Next: What proof would convince the org
        </Button>
      </div>
    </div>
  );
}
