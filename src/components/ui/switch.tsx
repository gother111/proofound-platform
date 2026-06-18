'use client';

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';

import { cn } from '@/lib/utils';

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      'group peer relative inline-flex h-11 w-[68px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-primary',
      className
    )}
    {...props}
    ref={ref}
  >
    <span
      aria-hidden="true"
      className="absolute left-3 top-1/2 h-6 w-11 -translate-y-1/2 rounded-full bg-input transition-colors group-data-[state=checked]:bg-proofound-forest group-data-[state=checked]:dark:bg-primary"
    />
    <SwitchPrimitives.Thumb
      className={cn(
        'pointer-events-none relative z-10 block h-5 w-5 translate-x-[14px] rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-[34px] data-[state=unchecked]:translate-x-[14px]'
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
