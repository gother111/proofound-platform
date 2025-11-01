/**
 * Assignment Builder - Step 3: Weight Matrix
 * 
 * Set relative weights for matching criteria
 */

'use client';

import React, { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';

interface Step3Props {
  form: UseFormReturn<any>;
  onNext: () => void;
  onBack: () => void;
}

export function Step3WeightMatrix({ form, onNext, onBack }: Step3Props) {
  const { watch, setValue } = form;
  
  const missionWeight = watch('weights.mission') || 33;
  const expertiseWeight = watch('weights.expertise') || 34;
  const workModeWeight = watch('weights.workMode') || 33;
  const workModeRequirement = watch('workModeRequirement') || 'soft';
  const workModePreference = watch('workModePreference') || 'hybrid';
  
  const total = missionWeight + expertiseWeight + workModeWeight;
  const isValid = total === 100;
  
  // Auto-adjust weights to maintain 100% total
  const handleWeightChange = (field: string, value: number[]) => {
    const newValue = value[0];
    
    if (field === 'mission') {
      const remaining = 100 - newValue;
      const expertiseRatio = expertiseWeight / (expertiseWeight + workModeWeight) || 0.5;
      setValue('weights.mission', newValue);
      setValue('weights.expertise', Math.round(remaining * expertiseRatio));
      setValue('weights.workMode', Math.round(remaining * (1 - expertiseRatio)));
    } else if (field === 'expertise') {
      const remaining = 100 - newValue;
      const missionRatio = missionWeight / (missionWeight + workModeWeight) || 0.5;
      setValue('weights.expertise', newValue);
      setValue('weights.mission', Math.round(remaining * missionRatio));
      setValue('weights.workMode', Math.round(remaining * (1 - missionRatio)));
    } else if (field === 'workMode') {
      const remaining = 100 - newValue;
      const missionRatio = missionWeight / (missionWeight + expertiseWeight) || 0.5;
      setValue('weights.workMode', newValue);
      setValue('weights.mission', Math.round(remaining * missionRatio));
      setValue('weights.expertise', Math.round(remaining * (1 - missionRatio)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">Step 3: Weight Matrix</h2>
          <span className="text-sm text-muted-foreground">Step 3 of 5</span>
        </div>
        <p className="text-muted-foreground">
          Balance mission/purpose fit vs expertise depth vs work mode
        </p>
        <Progress value={60} className="mt-4" />
      </div>

      {/* Total Display */}
      <div className={`p-4 rounded-lg border-2 ${isValid ? 'border-primary bg-primary/5' : 'border-destructive bg-destructive/5'}`}>
        <div className="flex items-center justify-between">
          <span className="font-medium">Total Weight:</span>
          <span className={`text-2xl font-bold ${isValid ? 'text-primary' : 'text-destructive'}`}>
            {total}%
          </span>
        </div>
        {!isValid && (
          <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span>Weights must total exactly 100%</span>
          </div>
        )}
      </div>

      {/* Mission/Purpose Fit Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Mission/Purpose Fit</Label>
          <span className="text-sm font-medium">{missionWeight}%</span>
        </div>
        <Slider
          value={[missionWeight]}
          onValueChange={(value) => handleWeightChange('mission', value)}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
        <p className="text-sm text-muted-foreground">
          How important is alignment with organizational values and causes?
        </p>
      </div>

      {/* Expertise Depth Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Expertise Depth</Label>
          <span className="text-sm font-medium">{expertiseWeight}%</span>
        </div>
        <Slider
          value={[expertiseWeight]}
          onValueChange={(value) => handleWeightChange('expertise', value)}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
        <p className="text-sm text-muted-foreground">
          How critical is deep technical/functional expertise?
        </p>
      </div>

      {/* Work Mode Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Work Mode Fit</Label>
          <span className="text-sm font-medium">{workModeWeight}%</span>
        </div>
        <Slider
          value={[workModeWeight]}
          onValueChange={(value) => handleWeightChange('workMode', value)}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
        <p className="text-sm text-muted-foreground">
          How important is the specific work mode (onsite/hybrid/remote)?
        </p>
      </div>

      {/* Work Mode Requirement */}
      <div className="space-y-3 pt-4 border-t">
        <Label>Work Mode Requirement</Label>
        <RadioGroup
          value={workModeRequirement}
          onValueChange={(value) => setValue('workModeRequirement', value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="hard" id="hard" />
            <Label htmlFor="hard" className="font-normal cursor-pointer">
              Hard Constraint - Must match exactly
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="soft" id="soft" />
            <Label htmlFor="soft" className="font-normal cursor-pointer">
              Soft Preference - Flexible, but preferred
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Work Mode Preference */}
      <div className="space-y-2">
        <Label htmlFor="workModePreference">
          Work Mode Preference <span className="text-destructive">*</span>
        </Label>
        <Select
          value={workModePreference}
          onValueChange={(value) => setValue('workModePreference', value)}
        >
          <SelectTrigger id="workModePreference">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="onsite">Onsite</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
            <SelectItem value="remote">Remote</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid}>
          Next: Practicals
        </Button>
      </div>
    </div>
  );
}
