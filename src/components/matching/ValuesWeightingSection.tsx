/**
 * Values Weighting Section
 * Implements PRD Gap 5: Adjust matching weights (±15pp from defaults)
 */

'use client';

import { Label } from '@/components/ui/label';
// @ts-nocheck

import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const DEFAULT_WEIGHTS = {
  mission: 30,
  expertise: 40,
  tools: 10,
  logistics: 10,
  recency: 10,
};

const WEIGHT_LABELS: Record<string, string> = {
  mission: 'Mission & Values Alignment',
  expertise: 'Skills & Expertise Match',
  tools: 'Tools & Technologies',
  logistics: 'Location & Logistics',
  recency: 'Profile Recency',
};

export function ValuesWeightingSection({ profile, onChange }: any) {
  const weights = profile.weights || DEFAULT_WEIGHTS;
  const totalWeight = Object.values(weights).reduce((sum: number, w: any) => sum + w, 0);
  const isValid = totalWeight === 100;

  const handleWeightChange = (key: string, value: number[]) => {
    onChange({
      weights: {
        ...weights,
        [key]: value[0],
      },
    });
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Adjust how much each factor matters in your matches. Total must equal 100%. You can adjust
          each weight by ±15 percentage points from the default.
        </AlertDescription>
      </Alert>

      {Object.entries(DEFAULT_WEIGHTS).map(([key, defaultValue]) => {
        const currentValue = weights[key] || defaultValue;
        const min = Math.max(0, defaultValue - 15);
        const max = Math.min(100, defaultValue + 15);

        return (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={`weight-${key}`}>{WEIGHT_LABELS[key]}</Label>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Default: {defaultValue}%</span>
                <span className="font-semibold">{currentValue}%</span>
              </div>
            </div>
            <Slider
              id={`weight-${key}`}
              min={min}
              max={max}
              step={1}
              value={[currentValue]}
              onValueChange={(value) => handleWeightChange(key, value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{min}%</span>
              <span>{max}%</span>
            </div>
          </div>
        );
      })}

      {/* Total Weight Indicator */}
      <div className="pt-4 border-t">
        <div className="flex items-center justify-between text-lg font-semibold">
          <span>Total Weight:</span>
          <span className={isValid ? 'text-green-600' : 'text-red-600'}>
            {totalWeight}%{isValid ? ' ✓' : ' ✗'}
          </span>
        </div>
        {!isValid && <p className="text-sm text-red-600 mt-1">Weights must sum to exactly 100%</p>}
      </div>
    </div>
  );
}
