/**
 * Assignment Builder - Step 4: Practicals
 * 
 * Define budget, location, timing, and availability
 */

'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Step4Props {
  form: UseFormReturn<any>;
  onNext: () => void;
  onBack: () => void;
}

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
];

const DURATION_OPTIONS = [
  { value: '3mo', label: '3 months' },
  { value: '6mo', label: '6 months' },
  { value: '12mo', label: '12 months' },
  { value: 'contract_to_hire', label: 'Contract-to-Hire' },
  { value: 'permanent', label: 'Permanent' },
];

export function Step4Practicals({ form, onNext, onBack }: Step4Props) {
  const { register, watch, setValue, formState: { errors } } = form;
  
  const compMin = watch('compMin') || 0;
  const compMax = watch('compMax') || 0;
  const currency = watch('currency') || 'USD';
  const hoursMin = watch('hoursMin') || 10;
  const hoursMax = watch('hoursMax') || 40;
  const duration = watch('duration') || '12mo';
  const locationMode = watch('locationMode') || watch('workModePreference') || 'hybrid';
  
  const isValid = compMin > 0 && compMax > compMin;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">Step 4: Practicals</h2>
          <span className="text-sm text-muted-foreground">Step 4 of 5</span>
        </div>
        <p className="text-muted-foreground">
          Budget, location, timing, and availability
        </p>
        <Progress value={80} className="mt-4" />
      </div>

      {/* Compensation Range */}
      <div className="space-y-4">
        <Label>
          Salary Range <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-[1fr,1fr,auto] gap-4">
          <div className="space-y-2">
            <Label htmlFor="compMin" className="text-sm">Minimum</Label>
            <Input
              id="compMin"
              type="number"
              placeholder="50000"
              {...register('compMin', {
                required: 'Minimum salary is required',
                valueAsNumber: true,
                min: { value: 1, message: 'Must be greater than 0' },
              })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="compMax" className="text-sm">Maximum</Label>
            <Input
              id="compMax"
              type="number"
              placeholder="120000"
              {...register('compMax', {
                required: 'Maximum salary is required',
                valueAsNumber: true,
                validate: (value) =>
                  value > compMin || 'Maximum must be greater than minimum',
              })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency" className="text-sm">Currency</Label>
            <Select value={currency} onValueChange={(value) => setValue('currency', value)}>
              <SelectTrigger id="currency" className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {errors.compMin && (
          <p className="text-sm text-destructive">{errors.compMin.message as string}</p>
        )}
        {errors.compMax && (
          <p className="text-sm text-destructive">{errors.compMax.message as string}</p>
        )}
      </div>

      {/* Hours Per Week */}
      <div className="space-y-3">
        <Label>Hours Per Week</Label>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium w-12">{hoursMin}h</span>
          <Slider
            value={[hoursMin]}
            onValueChange={(value) => setValue('hoursMin', value[0])}
            min={10}
            max={hoursMax - 5}
            step={5}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Slider
            value={[hoursMax]}
            onValueChange={(value) => setValue('hoursMax', value[0])}
            min={hoursMin + 5}
            max={40}
            step={5}
            className="flex-1"
          />
          <span className="text-sm font-medium w-12">{hoursMax}h</span>
        </div>
      </div>

      {/* Location Mode */}
      <div className="space-y-2">
        <Label htmlFor="locationMode">
          Location Mode <span className="text-destructive">*</span>
        </Label>
        <Select value={locationMode} onValueChange={(value) => setValue('locationMode', value)}>
          <SelectTrigger id="locationMode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="onsite">Onsite</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
            <SelectItem value="remote">Remote</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* City & Country (conditional on location mode) */}
      {locationMode !== 'remote' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="e.g., San Francisco"
              {...register('city')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              placeholder="e.g., USA"
              {...register('country')}
            />
          </div>
        </div>
      )}

      {/* Start Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startEarliest">Start Date (Earliest)</Label>
          <Input
            id="startEarliest"
            type="date"
            {...register('startEarliest')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="startLatest">Start Date (Latest)</Label>
          <Input
            id="startLatest"
            type="date"
            {...register('startLatest')}
          />
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <Label htmlFor="duration">Duration</Label>
        <Select value={duration} onValueChange={(value) => setValue('duration', value)}>
          <SelectTrigger id="duration">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DURATION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid}>
          Next: Expertise Mapping
        </Button>
      </div>
    </div>
  );
}
