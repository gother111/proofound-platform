/**
 * Field Visibility Control Component
 *
 * Allows users to set granular visibility for profile fields
 *
 * Visibility levels per PRD Part 5, F4:
 * - public: Visible to all organizations
 * - network_only: Visible to trusted network/link contexts
 * - match_only: Only visible after mutual interest
 * - private: Never shown to organizations
 *
 * PRD References:
 * - Part 5: F4 - Matching Profile (Field-Level Visibility)
 * - Part 8: Privacy by default
 */

'use client';

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
import type { ProfileVisibilityLevel } from '@/lib/contracts/domain';

export type VisibilityLevel = ProfileVisibilityLevel;

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
    description: 'Visible to everyone',
    color: 'text-blue-600',
  },
  {
    value: 'network_only' as const,
    label: 'Network-only',
    icon: Eye,
    description: 'Visible to trusted network views and matched organizations',
    color: 'text-amber-600',
  },
  {
    value: 'match_only' as const,
    label: 'Match-only',
    icon: Eye,
    description: 'Only visible after mutual interest is confirmed',
    color: 'text-emerald-600',
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
  const currentOption =
    visibilityOptions.find((opt) => opt.value === value) || visibilityOptions[3];
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
