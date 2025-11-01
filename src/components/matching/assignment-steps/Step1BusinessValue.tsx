/**
 * Assignment Builder - Step 1: Business Value
 * 
 * Define role, outcomes, and assign stakeholders
 */

'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface Step1Props {
  form: UseFormReturn<any>;
  onNext: () => void;
}

const STAKEHOLDER_OPTIONS = [
  { id: 'cto', label: 'CTO' },
  { id: 'hr_lead', label: 'HR Lead' },
  { id: 'team_lead', label: 'Team Lead' },
  { id: 'ceo', label: 'CEO' },
];

export function Step1BusinessValue({ form, onNext }: Step1Props) {
  const { register, watch, setValue, formState: { errors } } = form;
  
  const role = watch('role');
  const businessValue = watch('businessValue');
  const stakeholders = watch('stakeholders') || [];
  
  const isValid = role && role.length >= 3 && businessValue && businessValue.length > 0;
  
  const toggleStakeholder = (stakeholderId: string) => {
    const current = stakeholders || [];
    if (current.includes(stakeholderId)) {
      setValue('stakeholders', current.filter((id: string) => id !== stakeholderId));
    } else {
      setValue('stakeholders', [...current, stakeholderId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">Step 1: Business Value</h2>
          <span className="text-sm text-muted-foreground">Step 1 of 5</span>
        </div>
        <p className="text-muted-foreground">
          Define the role and articulate the business value it will create
        </p>
        <Progress value={20} className="mt-4" />
      </div>

      {/* Role Title */}
      <div className="space-y-2">
        <Label htmlFor="role">
          Role Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="role"
          placeholder="e.g., Senior Full-Stack Engineer"
          {...register('role', {
            required: 'Role title is required',
            minLength: {
              value: 3,
              message: 'Role title must be at least 3 characters',
            },
          })}
        />
        {errors.role && (
          <p className="text-sm text-destructive">{errors.role.message as string}</p>
        )}
      </div>

      {/* Business Value */}
      <div className="space-y-2">
        <Label htmlFor="businessValue">
          Business Value <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="businessValue"
          placeholder="What business problem does this role solve? What value will they create?"
          className="min-h-[120px]"
          maxLength={500}
          {...register('businessValue', {
            required: 'Business value is required',
          })}
        />
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Explain the business value this role will create
          </p>
          <span className="text-xs text-muted-foreground">
            {businessValue?.length || 0}/500
          </span>
        </div>
        {errors.businessValue && (
          <p className="text-sm text-destructive">{errors.businessValue.message as string}</p>
        )}
      </div>

      {/* Expected Impact */}
      <div className="space-y-2">
        <Label htmlFor="expectedImpact">Expected Impact (Optional)</Label>
        <Textarea
          id="expectedImpact"
          placeholder="Describe the expected impact on the organization"
          className="min-h-[100px]"
          maxLength={500}
          {...register('expectedImpact')}
        />
        <span className="text-xs text-muted-foreground">
          {watch('expectedImpact')?.length || 0}/500
        </span>
      </div>

      {/* Stakeholders */}
      <div className="space-y-3">
        <Label>Stakeholders (Optional)</Label>
        <p className="text-sm text-muted-foreground">
          Who are the key stakeholders for this role?
        </p>
        <div className="space-y-2">
          {STAKEHOLDER_OPTIONS.map((stakeholder) => (
            <div key={stakeholder.id} className="flex items-center space-x-2">
              <Checkbox
                id={stakeholder.id}
                checked={stakeholders.includes(stakeholder.id)}
                onCheckedChange={() => toggleStakeholder(stakeholder.id)}
              />
              <Label
                htmlFor={stakeholder.id}
                className="text-sm font-normal cursor-pointer"
              >
                {stakeholder.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={onNext} disabled={!isValid}>
          Next: Target Outcomes
        </Button>
      </div>
    </div>
  );
}
