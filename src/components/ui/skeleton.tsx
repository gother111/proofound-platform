import { cn } from '@/lib/utils';

/**
 * Skeleton Component - Loading State Placeholder
 *
 * Design Philosophy:
 * - Mimics the shape and size of actual content
 * - Subtle shimmer animation for visual feedback
 * - Uses neutral colors that work on any background
 *
 * Accessibility:
 * - aria-busy="true" on parent container indicates loading
 * - aria-live="polite" announces when loading completes
 * - Respects prefers-reduced-motion (no shimmer)
 *
 * Responsive:
 * - Adapts to parent container width by default
 * - Can be constrained with className
 *
 * Animation:
 * - Subtle shimmer effect (2s infinite loop)
 * - Pulse fallback for reduced motion
 * - Smooth fade-in when content loads
 *
 * Usage:
 * - Text: <Skeleton className="h-4 w-[250px]" />
 * - Avatar: <Skeleton className="h-12 w-12 rounded-full" />
 * - Card: <Skeleton className="h-[200px] w-full rounded-xl" />
 */

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-[#E8E6DD] dark:bg-[#2C3244]',
        // Shimmer effect for normal motion preferences
        'motion-safe:animate-shimmer',
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * SkeletonText - For text content placeholders
 * Shows multiple lines with varying widths
 */
function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            // Vary widths to look more natural
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

/**
 * SkeletonCard - For card-based layouts
 * Includes avatar, title, and text lines
 */
function SkeletonCard() {
  return (
    <div className="rounded-lg border border-[#E8E6DD] bg-white p-6 dark:border-[#D4C4A8]/10 dark:bg-[#252834]">
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-3">
          {/* Title */}
          <Skeleton className="h-5 w-3/4" />
          {/* Text lines */}
          <SkeletonText lines={2} />
        </div>
      </div>
    </div>
  );
}

/**
 * SkeletonTable - For table layouts
 * Shows header and rows
 */
function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-6 flex-1" />
          <Skeleton className="h-6 flex-1" />
          <Skeleton className="h-6 flex-1" />
        </div>
      ))}
    </div>
  );
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonTable };
