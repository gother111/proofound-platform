import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * DashboardGrid
 * Standardized mathematical grid for dashboard main content areas.
 * Enforces consistent gap and responsive columns across the application.
 */
export function DashboardGrid({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'grid gap-4 md:gap-6',
        // Responsive columns can be overridden via className, but default to 1 col spanning to 2/3 on larger screens if needed
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * ContentCardSlot
 * A specialized container for primary content cards within the DashboardGrid.
 * Enforces typographic hierarchy on headers and consistent padding.
 */
interface ContentCardSlotProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'bento' | 'glass' | 'flat' | 'default';
}

export function ContentCardSlot({
  title,
  description,
  action,
  variant = 'bento',
  className,
  children,
  ...props
}: ContentCardSlotProps) {
  return (
    <Card variant={variant} className={cn('flex flex-col h-full', className)} {...props}>
      {(title || description || action) && (
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="space-y-1">
            {title && <CardTitle className="text-xl md:text-2xl">{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {action && <div>{action}</div>}
        </CardHeader>
      )}
      <CardContent className="flex-1">{children}</CardContent>
    </Card>
  );
}

/**
 * EmptyStateShell
 * A standardized shell for empty configurations (e.g. matching lists, verifications)
 * Centers content, enforces max-width, and ensures the glass variant is used.
 */
interface EmptyStateShellProps extends React.HTMLAttributes<HTMLDivElement> {
  illustration?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyStateShell({
  illustration,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateShellProps) {
  return (
    <Card
      variant="glass"
      className={cn(
        'max-w-2xl mx-auto flex flex-col items-center justify-center p-8 md:p-12 text-center overflow-hidden relative',
        className
      )}
      {...props}
    >
      {illustration && <div className="mb-6 relative z-10">{illustration}</div>}
      <CardHeader className="p-0 z-10">
        <CardTitle className="text-2xl md:text-3xl mb-3">{title}</CardTitle>
        <CardDescription className="text-base md:text-lg max-w-lg mx-auto mb-6">
          {description}
        </CardDescription>
      </CardHeader>
      {action && <CardContent className="p-0 z-10 mt-2">{action}</CardContent>}

      {/* Decorative Japandi Background Elements for Empty States */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-proofound-parchment/40 dark:bg-proofound-terracotta/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-proofound-terracotta/5 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />
    </Card>
  );
}
