'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Settings } from 'lucide-react';

interface WeightsFiltersSheetProps {
  initialWeights?: Record<string, number>;
  onApply: (weights: Record<string, number>) => void;
  trigger?: React.ReactNode;
}

const DEFAULT_WEIGHTS = {
  values: 20,
  causes: 15,
  skills: 25,
  experience: 15,
  verifications: 8,
  availability: 7,
  location: 5,
  compensation: 3,
  language: 2,
};

const WEIGHT_LABELS: Record<string, string> = {
  values: 'Values Alignment',
  causes: 'Causes & Impact',
  skills: 'Skills Match',
  experience: 'Experience',
  verifications: 'Verifications',
  availability: 'Availability',
  location: 'Location Match',
  compensation: 'Compensation Fit',
  language: 'Language',
};

/**
 * Side sheet for adjusting match weights and hard filters.
 */
export function WeightsFiltersSheet({
  initialWeights,
  onApply,
  trigger,
}: WeightsFiltersSheetProps) {
  const [weights, setWeights] = useState<Record<string, number>>(initialWeights || DEFAULT_WEIGHTS);
  const [isOpen, setIsOpen] = useState(false);

  const handleWeightChange = (key: string, value: number) => {
    setWeights({ ...weights, [key]: value });
  };

  const handleReset = () => {
    setWeights(DEFAULT_WEIGHTS);
  };

  const handleApply = () => {
    // Normalize weights to sum to 100
    const sum = Object.values(weights).reduce((acc, val) => acc + val, 0);
    const normalized: Record<string, number> = {};

    if (sum > 0) {
      for (const [key, value] of Object.entries(weights)) {
        normalized[key] = value / sum;
      }
    } else {
      // If all zeros, use defaults
      const defaultSum = Object.values(DEFAULT_WEIGHTS).reduce((acc, val) => acc + val, 0);
      for (const [key, value] of Object.entries(DEFAULT_WEIGHTS)) {
        normalized[key] = value / defaultSum;
      }
    }

    onApply(normalized);
    setIsOpen(false);
  };

  const totalWeight = Object.values(weights).reduce((acc, val) => acc + val, 0);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Weights & Filters
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Adjust Matching Weights</SheetTitle>
          <SheetDescription>
            Customize how much each factor contributes to match scores. Higher values increase
            importance.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Weight sliders */}
          <div className="space-y-4">
            {Object.entries(weights).map(([key, value]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor={key} className="text-sm">
                    {WEIGHT_LABELS[key] || key}
                  </Label>
                  <span className="text-sm font-medium">{value}</span>
                </div>
                <input
                  id={key}
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={value}
                  onChange={(e) => handleWeightChange(key, parseInt(e.target.value, 10))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #1C4D3A 0%, #1C4D3A ${value}%, #E8E6DD ${value}%, #E8E6DD 100%)`,
                  }}
                />
              </div>
            ))}
          </div>

          <Separator />

          {/* Summary */}
          <div className="rounded-md p-3" style={{ backgroundColor: '#F7F6F1' }}>
            <p className="text-sm mb-2" style={{ color: '#2D3330' }}>
              <strong>Total:</strong> {totalWeight} (will be normalized to 100%)
            </p>
            <p className="text-xs" style={{ color: '#6B6760' }}>
              Match scores will be recalculated based on these weights.
            </p>
          </div>

          {/* Hard filters section (placeholder for future) */}
          <div>
            <h4 className="text-sm font-medium mb-2">Hard Filters</h4>
            <p className="text-xs" style={{ color: '#6B6760' }}>
              Coming soon: Toggle filters like &quot;Remote only&quot;, &quot;Verified only&quot;,
              etc.
            </p>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              Reset to Default
            </Button>
            <Button onClick={handleApply} className="flex-1" style={{ backgroundColor: '#1C4D3A' }}>
              Apply Weights
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
