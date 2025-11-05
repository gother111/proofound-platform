'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const PRESET_RANGES = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'All time', days: null },
];

export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePresetClick = (days: number | null) => {
    const endDate = new Date();
    const startDate = days ? new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000) : new Date(2024, 0, 1);
    
    onChange({ startDate, endDate });
    setIsOpen(false);
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className="flex space-x-2">
        {PRESET_RANGES.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick(preset.days)}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-[260px] justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(value.startDate, 'MMM d, yyyy')} - {format(value.endDate, 'MMM d, yyyy')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="flex">
            <div className="border-r p-3">
              <p className="text-sm font-medium mb-2">Start Date</p>
              <Calendar
                mode="single"
                selected={value.startDate}
                onSelect={(date) => date && onChange({ ...value, startDate: date })}
                initialFocus
              />
            </div>
            <div className="p-3">
              <p className="text-sm font-medium mb-2">End Date</p>
              <Calendar
                mode="single"
                selected={value.endDate}
                onSelect={(date) => date && onChange({ ...value, endDate: date })}
                disabled={(date) => date < value.startDate}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

