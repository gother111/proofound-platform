'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';

interface Step1Props {
  form: UseFormReturn<any>;
  onNext: () => void;
  onOpenTemplatePicker?: () => void;
  appliedTemplateName?: string | null;
  isLoadingTemplates?: boolean;
}

export function Step1BusinessValue({ form, onNext }: Step1Props) {
  const {
    register,
    watch,
    formState: { errors },
  } = form;

  const role = watch('role');
  const businessValue = watch('businessValue');
  const isValid = role && role.length >= 3 && businessValue && businessValue.trim().length > 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Step 1: Why this role exists</h2>
          <span className="text-sm text-muted-foreground">Step 1 of 5</span>
        </div>
        <p className="text-muted-foreground">
          Explain why the organization is opening this role now and what real value it needs to
          create.
        </p>
        <Progress value={20} className="mt-4" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">
          Role title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="role"
          placeholder="e.g., Operations lead for partner launches"
          {...register('role', {
            required: 'Role title is required',
            minLength: {
              value: 3,
              message: 'Role title must be at least 3 characters',
            },
          })}
        />
        {errors.role && <p className="text-sm text-destructive">{errors.role.message as string}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessValue">
          Why this role exists <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="businessValue"
          placeholder="Describe the concrete business or mission value this role must create and why that matters now."
          className="min-h-[140px]"
          maxLength={600}
          {...register('businessValue', {
            required: 'Why this role exists is required',
          })}
        />
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Keep this specific. Publishing will block vague or generic assignment language.
          </p>
          <span className="text-xs text-muted-foreground">{businessValue?.length || 0}/600</span>
        </div>
        {errors.businessValue && (
          <p className="text-sm text-destructive">{errors.businessValue.message as string}</p>
        )}
      </div>

      <div className="flex justify-end border-t pt-4">
        <Button onClick={onNext} disabled={!isValid}>
          Next: What work will actually be done
        </Button>
      </div>
    </div>
  );
}
