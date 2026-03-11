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
  'rounded-[24px] bg-card text-card-foreground transition-all duration-300 dark:bg-card dark:text-card-foreground',
  {
    variants: {
      variant: {
        default:
          'border border-black/[0.04] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.04)] dark:border-white/5',
        flat: 'card-flat',
        elevated:
          'border border-black/[0.04] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.08)] dark:border-white/10 dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.2)]',
        interactive:
          'border border-black/[0.04] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-1 cursor-pointer dark:hover:border-white/10 dark:hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.2)]',
        glass: 'glass-panel rounded-[24px]',
        bento: 'glass-panel-heavy rounded-[24px]',
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
    <div
      ref={ref}
      className={cn('flex flex-col space-y-2 p-6 sm:p-8 sm:pb-6', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-xl font-semibold leading-none tracking-tight font-display', className)}
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
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground dark:text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0 sm:p-8 sm:pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-4 pt-0 sm:p-6 sm:pt-0', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
