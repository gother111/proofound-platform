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
        'bg-white border border-proofound-stone rounded-2xl overflow-hidden shadow-sm flex flex-col',
        className
      )}
      {...props}
    >
      {(title || description || action) && (
        <div className="px-5 py-4 border-b border-proofound-stone/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50">
          <div className="flex flex-col gap-1">
            {title && <h3 className="font-semibold text-lg text-proofound-charcoal">{title}</h3>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn('flex flex-col flex-1', !noPadding && 'p-5 sm:p-6')}>{children}</div>
    </div>
  );
}
