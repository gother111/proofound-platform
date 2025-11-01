import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-base font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C4D3A] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[#1C4D3A] text-white hover:bg-[#2D5D4A] dark:bg-[#D4C4A8] dark:text-[#1A1D2E] dark:hover:bg-[#E4D4B8]',
        destructive: 'bg-[#B5542D] text-white hover:bg-[#A54927] dark:bg-[#D4826F] dark:hover:bg-[#E49280]',
        outline: 'border-2 border-[#1C4D3A] bg-transparent text-[#1C4D3A] hover:bg-[#1C4D3A]/5 dark:border-[#D4C4A8] dark:text-[#D4C4A8] dark:hover:bg-[#D4C4A8]/10',
        secondary: 'bg-[#C76B4A] text-white hover:bg-[#D77B5A] dark:bg-[#C86B4A] dark:hover:bg-[#D87B5A]',
        ghost: 'hover:bg-[#1C4D3A]/5 hover:text-[#1C4D3A] dark:hover:bg-[#D4C4A8]/10 dark:hover:text-[#D4C4A8]',
        link: 'text-[#1C4D3A] underline-offset-4 hover:underline dark:text-[#D4C4A8]',
      },
      size: {
        default: 'h-11 px-6 py-2',
        sm: 'h-9 px-4 text-sm',
        lg: 'h-12 px-8 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
