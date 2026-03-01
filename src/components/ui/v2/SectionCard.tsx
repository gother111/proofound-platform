import React from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  noPadding?: boolean;
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  noPadding = false,
  ...props
}: SectionCardProps) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col backdrop-blur-xl transition-all duration-300 hover:shadow-md dark:bg-background/80 dark:border-border/10',
        className
      )}
      {...props}
    >
      {(title || description || action) && (
        <div className="px-6 py-5 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-transparent dark:border-border/10">
          <div className="flex flex-col gap-1.5">
            {title && (
              <h3 className="font-semibold text-lg tracking-tight text-foreground dark:text-foreground">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn('flex flex-col flex-1', !noPadding && 'p-5 sm:p-6')}>{children}</div>
    </div>
  );
}
