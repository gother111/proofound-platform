import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[#1C4D3A] text-white hover:bg-[#2D5D4A] dark:bg-[#D4C4A8] dark:text-[#1A1D2E]',
        secondary: 'border-transparent bg-[#C76B4A] text-white hover:bg-[#D77B5A]',
        destructive: 'border-transparent bg-[#B5542D] text-white hover:bg-[#A54927]',
        success: 'border-transparent bg-[#7A9278] text-white hover:bg-[#8AA288]',
        warning: 'border-transparent bg-[#D4A574] text-white hover:bg-[#E4B584]',
        info: 'border-transparent bg-[#5C8B89] text-white hover:bg-[#6C9B99]',
        outline: 'text-[#2D3330] dark:text-[#E8DCC4] border-[#E8E6DD] dark:border-[#D4C4A8]/10',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
