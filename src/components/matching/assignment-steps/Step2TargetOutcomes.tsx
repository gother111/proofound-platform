/**
 * Assignment Builder - Step 2: Target Outcomes
 * 
 * Define measurable outcomes and improvement targets
 */

'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';

interface Step2Props {
  form: UseFormReturn<any>;
  onNext: () => void;
  onBack: () => void;
}

const TIMEFRAME_OPTIONS = [
  { value: '3mo', label: '3 months' },
  { value: '6mo', label: '6 months' },
  { value: '12mo', label: '12 months' },
  { value: '18mo', label: '18 months' },
  { value: '24mo', label: '24 months' },
];

export function Step2TargetOutcomes({ form, onNext, onBack }: Step2Props) {
  const { watch, setValue, formState: { errors } } = form;
  
  const outcomes = watch('outcomes') || [];
  
  const addOutcome = () => {
    setValue('outcomes', [
      ...outcomes,
      { metric: '', target: '', timeframe: '6mo' },
    ]);
  };
  
  const removeOutcome = (index: number) => {
    setValue(
      'outcomes',
      outcomes.filter((_: any, i: number) => i !== index)
    );
  };
  
  const updateOutcome = (index: number, field: string, value: string) => {
    const updated = [...outcomes];
    updated[index] = { ...updated[index], [field]: value };
    setValue('outcomes', updated);
  };
  
  const isValid = outcomes.length > 0 && outcomes.every(
    (o: any) => o.metric && o.target && o.timeframe
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">Step 2: Target Outcomes</h2>
          <span className="text-sm text-muted-foreground">Step 2 of 5</span>
        </div>
        <p className="text-muted-foreground">
          Define measurable outcomes and improvement targets
        </p>
        <Progress value={40} className="mt-4" />
      </div>

      {/* Outcomes List */}
      <div className="space-y-4">
        {outcomes.length === 0 && (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No outcomes defined yet. Add at least one measurable outcome.
            </p>
            <Button onClick={addOutcome} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add First Outcome
            </Button>
          </div>
        )}

        {outcomes.map((outcome: any, index: number) => (
          <div
            key={index}
            className="border rounded-lg p-4 space-y-4 relative"
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => removeOutcome(index)}
            >
              <X className="w-4 h-4" />
            </Button>

            <div className="space-y-2 pr-10">
              <Label htmlFor={`metric-${index}`}>
                Metric <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`metric-${index}`}
                placeholder="e.g., Revenue increase"
                value={outcome.metric}
                onChange={(e) => updateOutcome(index, 'metric', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`target-${index}`}>
                  Target <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`target-${index}`}
                  placeholder="e.g., 15%"
                  value={outcome.target}
                  onChange={(e) => updateOutcome(index, 'target', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`timeframe-${index}`}>
                  Timeframe <span className="text-destructive">*</span>
                </Label>
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

        {outcomes.length > 0 && (
          <Button onClick={addOutcome} variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Another Outcome
          </Button>
        )}
      </div>

      {/* Validation Error */}
      {outcomes.length === 0 && (
        <p className="text-sm text-destructive">
          At least one outcome is required
        </p>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid}>
          Next: Weight Matrix
        </Button>
      </div>
    </div>
  );
}
