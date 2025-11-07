/**
 * Field Visibility Control Component
 *
 * Allows users to set granular visibility for profile fields
 *
 * Visibility levels per PRD Part 5, F4:
 * - public: Visible to all organizations
 * - matched: Only visible after mutual interest
 * - private: Never shown to organizations
 *
 * PRD References:
 * - Part 5: F4 - Matching Profile (Field-Level Visibility)
 * - Part 8: Privacy by default
 */

'use client';

import { useState } from 'react';
import { Lock, Users, Eye, Info } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';

export type VisibilityLevel = 'public' | 'matched' | 'private';

interface FieldVisibilityControlProps {
  fieldName: string;
  fieldLabel: string;
  value: VisibilityLevel;
  onChange: (value: VisibilityLevel) => void;
  description?: string;
  disabled?: boolean;
}

const visibilityOptions = [
  {
    value: 'public' as const,
    label: 'Public',
    icon: Users,
    description: 'Visible to all organizations during matching',
    color: 'text-blue-600',
  },
  {
    value: 'matched' as const,
    label: 'After Match',
    icon: Eye,
    description: 'Only visible after mutual interest is confirmed',
    color: 'text-amber-600',
  },
  {
    value: 'private' as const,
    label: 'Private',
    icon: Lock,
    description: 'Never shared with organizations',
    color: 'text-gray-600',
  },
];

export function FieldVisibilityControl({
  fieldName,
  fieldLabel,
  value,
  onChange,
  description,
  disabled = false,
}: FieldVisibilityControlProps) {
  const currentOption = visibilityOptions.find((opt) => opt.value === value);
  const Icon = currentOption?.icon || Lock;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor={`visibility-${fieldName}`} className="text-sm font-medium text-[#2D3330]">
            {fieldLabel}
          </Label>
          {description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-[#9B9891] cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger id={`visibility-${fieldName}`} className="w-[180px]">
            <SelectValue>
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${currentOption?.color}`} />
                <span>{currentOption?.label}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {visibilityOptions.map((option) => {
              const OptionIcon = option.icon;
              return (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-start gap-3 py-1">
                    <OptionIcon className={`h-4 w-4 mt-0.5 ${option.color}`} />
                    <div className="space-y-0.5">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-[#6B6760]">{option.description}</div>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
