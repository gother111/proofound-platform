import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Card Component - Content Container
 *
 * Design Philosophy:
 * - Clean, minimal container for grouping related content
 * - Subtle shadow for depth perception (shadow-sm)
 * - Rounded corners (rounded-lg) for softness
 * - White background with subtle border
 *
 * Accessibility:
 * - Can be made interactive with proper ARIA roles when clickable
 * - Sufficient color contrast for text (border visible at 3:1)
 * - Semantic HTML can be applied via the 'as' prop pattern if needed
 *
 * Responsive:
 * - Full width by default, constrained by parent
 * - Padding scales appropriately
 *
 * Elevation Variants:
 * - flat: No shadow, just border (for nested cards)
 * - raised: Default shadow-sm (most cards)
 * - elevated: shadow-md (important/interactive cards)
 * - interactive: Hover effect with lift animation
 *
 * Animation:
 * - Interactive variant has subtle hover lift (200ms)
 * - Smooth transition for all state changes
 */

const cardVariants = cva(
  'rounded-lg border bg-white text-[#2D3330] transition-all duration-200 dark:bg-[#252834] dark:text-[#E8DCC4]',
  {
    variants: {
      variant: {
        default: 'border-[#E8E6DD] shadow-sm dark:border-[#D4C4A8]/10',
        flat: 'border-[#E8E6DD] dark:border-[#D4C4A8]/10',
        elevated: 'border-[#E8E6DD] shadow-md dark:border-[#D4C4A8]/10',
        interactive:
          'border-[#E8E6DD] shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer dark:border-[#D4C4A8]/10',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Make the card interactive with hover effects */
  interactive?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({
          variant: interactive ? 'interactive' : variant,
        }),
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight font-['Crimson_Pro']",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-[#6B6760] dark:text-[#A8A299]', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
