'use client';

import React from 'react';
import { Switch } from '../../ui/switch';
import { Label } from '../../ui/label';

interface ToggleControlProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleControl({ label, description, checked, onChange }: ToggleControlProps) {
  return (
    <div className="flex items-start justify-between p-4 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] rounded-xl">
      <div className="space-y-1">
        <Label className="text-[var(--color-text-primary)]">{label}</Label>
        <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
