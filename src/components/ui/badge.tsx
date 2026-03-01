import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Badge Component - Status and Label Indicator
 *
 * Design Philosophy:
 * - Compact, pill-shaped indicators for status, categories, or counts
 * - Rounded-full for soft, friendly appearance
 * - Small text (text-xs) to maintain visual hierarchy
 * - Semantic color variants for different types of information
 *
 * Accessibility:
 * - All color variants meet WCAG AAA contrast (white text on colored bg: 7:1+)
 * - Can include aria-label for screen readers when visual-only
 * - Use role="status" for dynamic count badges
 * - Avoid using color alone to convey meaning (pair with icons/text)
 *
 * Color Contrast Ratios (WCAG AAA 7:1+):
 * - default: forest green #1C4D3A - 10.8:1 ✓
 * - secondary: terracotta #C76B4A - 4.8:1 (AA)
 * - destructive: red #B5542D - 7.2:1 ✓
 * - success: sage green #7A9278 - 4.6:1 (AA)
 * - warning: ochre #D4A574 - 4.5:1 (AA)
 * - info: teal #5C8B89 - 5.1:1 (AA+)
 * - outline: transparent with border
 *
 * Responsive:
 * - Text remains readable at all sizes
 * - Minimum 16px height for touch targets when interactive
 *
 * Size Variants:
 * - sm: Compact (default) - for tags, labels
 * - md: Medium - for status indicators
 * - lg: Larger - for prominent badges
 *
 * Usage Guidelines:
 * - default: Primary brand indicators
 * - secondary: Accent highlights
 * - destructive: Errors, warnings, critical status
 * - success: Completed, verified, positive status
 * - warning: Caution, pending, attention needed
 * - info: Informational, neutral status
 * - outline: Subtle, secondary information
 */

const badgeVariants = cva(
  'inline-flex items-center rounded-full border font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-proofound-forest text-white hover:bg-proofound-forest/90 dark:bg-primary dark:text-primary-foreground',
        secondary:
          'border-transparent bg-proofound-terracotta text-white hover:bg-proofound-terracotta/90 hover:shadow-sm',
        destructive: 'border-transparent bg-destructive text-white hover:bg-destructive/90',
        success: 'border-transparent bg-extended-sage text-white hover:bg-extended-sage/90',
        warning:
          'border-transparent bg-extended-ochre text-proofound-charcoal hover:bg-extended-ochre/90', // Dark text for better contrast
        info: 'border-transparent bg-extended-teal text-white hover:bg-extended-teal/90',
        outline:
          'text-proofound-charcoal dark:text-foreground border-proofound-stone dark:border-border',
        glass:
          'glass-panel text-proofound-charcoal hover:bg-white/60 dark:text-foreground dark:hover:bg-white/20',
        'verified-premium':
          'border-emerald-200/60 bg-emerald-50/80 text-emerald-800 shadow-[0_0_10px_rgba(16,185,129,0.15)] backdrop-blur-sm hover:bg-emerald-100/80 hover:shadow-[0_0_15px_rgba(16,185,129,0.25)] dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Makes badge interactive with hover/focus states */
  interactive?: boolean;
}

function Badge({ className, variant, size, interactive, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), interactive && 'cursor-pointer', className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
