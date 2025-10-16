'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

type ProgressProps = React.ComponentPropsWithoutRef<'div'> & {
  value?: number;
  max?: number;
  indicatorClassName?: string;
};

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, indicatorClassName, value = 0, max = 100, ...props }, ref) => {
    const percentage =
      Number.isFinite(value) && Number.isFinite(max) && max > 0 ? (value / max) * 100 : 0;
    const clamped = Math.min(Math.max(percentage, 0), 100);

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
        {...props}
      >
        <div
          className={cn('h-full w-full bg-primary transition-all', indicatorClassName)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
