'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface DateWindow {
  earliest: string; // ISO date string (YYYY-MM-DD)
  latest: string;
}

interface DateWindowInputProps {
  value: DateWindow;
  onChange: (value: DateWindow) => void;
  label?: string;
  earliestLabel?: string;
  latestLabel?: string;
}

/**
 * Date range picker for availability or start date windows.
 */
export function DateWindowInput({
  value,
  onChange,
  label = 'Availability Window',
  earliestLabel = 'Earliest',
  latestLabel = 'Latest',
}: DateWindowInputProps) {
  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      <div className="grid grid-cols-2 gap-3">
        {/* Earliest */}
        <div>
          <Label htmlFor="date-earliest" className="text-xs" style={{ color: '#6B6760' }}>
            {earliestLabel}
          </Label>
          <Input
            id="date-earliest"
            type="date"
            value={value.earliest || ''}
            onChange={(e) => onChange({ ...value, earliest: e.target.value })}
          />
        </div>

        {/* Latest */}
        <div>
          <Label htmlFor="date-latest" className="text-xs" style={{ color: '#6B6760' }}>
            {latestLabel}
          </Label>
          <Input
            id="date-latest"
            type="date"
            value={value.latest || ''}
            onChange={(e) => onChange({ ...value, latest: e.target.value })}
            min={value.earliest || undefined}
          />
        </div>
      </div>
    </div>
  );
}
