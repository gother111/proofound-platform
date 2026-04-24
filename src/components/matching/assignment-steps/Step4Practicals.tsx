'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';

import { CityCountryAutocompleteFields } from '@/components/location/CityCountryAutocompleteFields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  isSubmitting?: boolean;
}

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
];

export function Step4Practicals({ form, onNext, onBack, isSubmitting = false }: Step4Props) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const compMin = watch('compMin') || 0;
  const compMax = watch('compMax') || 0;
  const currency = watch('currency') || 'USD';
  const hoursMin = watch('hoursMin') || 10;
  const hoursMax = watch('hoursMax') || 40;
  const locationMode = watch('locationMode') || 'hybrid';
  const city = watch('city') || '';
  const country = watch('country') || '';

  const hasLocation = locationMode === 'remote' || Boolean(country.trim());
  const isValid = compMin > 0 && compMax > compMin && hasLocation;

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Step 4: What practical constraints are real</h2>
          <span className="text-sm text-muted-foreground">Step 4 of 5</span>
        </div>
        <p className="text-muted-foreground">
          Capture the real operating constraints, including location, timing, and compensation
          posture where relevant.
        </p>
        <Progress value={80} className="mt-4" />
      </div>

      <div className="space-y-4">
        <Label>
          Compensation range <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-[1fr,1fr,auto] gap-4">
          <div className="space-y-2">
            <Label htmlFor="compMin" className="text-sm">
              Minimum
            </Label>
            <Input
              id="compMin"
              type="number"
              placeholder="50000"
              {...register('compMin', {
                required: 'Minimum compensation is required',
                valueAsNumber: true,
                min: { value: 1, message: 'Must be greater than 0' },
              })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="compMax" className="text-sm">
              Maximum
            </Label>
            <Input
              id="compMax"
              type="number"
              placeholder="120000"
              {...register('compMax', {
                required: 'Maximum compensation is required',
                valueAsNumber: true,
                validate: (value) => value > compMin || 'Maximum must be greater than minimum',
              })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency" className="text-sm">
              Currency
            </Label>
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

      <div className="space-y-3">
        <Label>Hours per week</Label>
        <div className="flex items-center gap-4">
          <span className="w-12 text-sm font-medium">{hoursMin}h</span>
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
          <span className="w-12 text-sm font-medium">{hoursMax}h</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="locationMode">
          Work mode <span className="text-destructive">*</span>
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

      {locationMode !== 'remote' ? (
        <CityCountryAutocompleteFields
          city={city}
          country={country}
          cityOptional
          onCityChange={(value) =>
            setValue('city', value, {
              shouldDirty: true,
              shouldTouch: true,
            })
          }
          onCountryChange={(value) =>
            setValue('country', value, {
              shouldDirty: true,
              shouldTouch: true,
            })
          }
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startEarliest">Earliest start date</Label>
          <Input id="startEarliest" type="date" {...register('startEarliest')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="startLatest">Latest start date</Label>
          <Input id="startLatest" type="date" {...register('startLatest')} />
        </div>
      </div>

      {!hasLocation ? (
        <p className="text-sm text-destructive">
          Add a real location constraint or mark the role as remote before review.
        </p>
      ) : null}

      <div className="flex justify-between border-t pt-4">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid || isSubmitting}>
          Continue to internal review and publish
        </Button>
      </div>
    </div>
  );
}
