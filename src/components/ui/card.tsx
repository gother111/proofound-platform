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
  'rounded-xl border bg-white text-proofound-charcoal transition-all duration-300 dark:bg-[#252834] dark:text-[#E8DCC4]',
  {
    variants: {
      variant: {
        default: 'border-proofound-stone shadow-sm dark:border-[#D4C4A8]/10',
        flat: 'border-proofound-stone/30 bg-transparent shadow-none dark:border-[#D4C4A8]/10',
        elevated: 'border-proofound-stone shadow-md dark:border-[#D4C4A8]/10',
        interactive:
          'border-proofound-stone shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-proofound-stone/80 cursor-pointer dark:border-[#D4C4A8]/10 dark:hover:border-[#D4C4A8]/30',
        glass:
          'border-white/20 bg-white/60 backdrop-blur-md shadow-sm dark:bg-[#252834]/60 dark:border-[#D4C4A8]/10',
        bento:
          'border-proofound-stone/60 bg-white/50 backdrop-blur-xl shadow-sm hover:shadow-md hover:-translate-y-1 hover:scale-[1.01] hover:border-white/60 hover:bg-white/80 transition-all duration-300 transform-gpu dark:bg-[#252834]/50 dark:border-[#D4C4A8]/10',
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
    className={cn('text-sm text-muted-foreground dark:text-[#A8A299]', className)}
    {...props}
  />
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
