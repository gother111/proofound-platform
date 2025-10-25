'use client';

import { Lock, Users, Building2, Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { PrivacyLevel } from './types';

const OPTIONS: Array<{
  value: PrivacyLevel;
  label: string;
  icon: React.ReactNode;
  description: string;
}> = [
  {
    value: 'only-me',
    label: 'Only me',
    icon: <Lock className="h-4 w-4" />,
    description: 'Visible only to you',
  },
  {
    value: 'team',
    label: 'Team',
    icon: <Users className="h-4 w-4" />,
    description: 'Visible to your team members',
  },
  {
    value: 'organization',
    label: 'Organization',
    icon: <Building2 className="h-4 w-4" />,
    description: 'Visible to everyone in your org',
  },
  {
    value: 'public',
    label: 'Public',
    icon: <Globe className="h-4 w-4" />,
    description: 'Visible to anyone with the link',
  },
];

export function PrivacySelector({
  value,
  onChange,
  compact = false,
}: {
  value: PrivacyLevel;
  onChange: (val: PrivacyLevel) => void;
  compact?: boolean;
}) {
  const current = OPTIONS.find((opt) => opt.value === value) ?? OPTIONS[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-[#2D3330]/70 hover:text-[#2D3330] dark:text-[#E8E6DD]/70"
        >
          {current.icon}
          {!compact && <span>{current.label}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 border-[#E8E6DD] bg-white dark:border-[#4A4540] dark:bg-[#3A3530]"
      >
        {OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className={`flex items-start gap-3 p-3 ${value === option.value ? 'bg-[#F7F6F1] dark:bg-[#343430]' : ''}`}
            onClick={() => onChange(option.value)}
          >
            <div className="pt-0.5">{option.icon}</div>
            <div className="flex-1">
              <div className="text-sm text-[#2D3330] dark:text-[#E8E6DD]">{option.label}</div>
              <div className="text-xs text-[#2D3330]/70 dark:text-[#E8E6DD]/70">
                {option.description}
              </div>
            </div>
            {value === option.value && (
              <svg
                className="h-4 w-4 text-[#1C4D3A] dark:text-[#B8D4C6]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
              </svg>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
