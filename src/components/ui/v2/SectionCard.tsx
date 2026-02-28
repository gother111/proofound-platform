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
        'bg-white/80 border border-proofound-stone/60 rounded-[24px] overflow-hidden shadow-sm flex flex-col backdrop-blur-xl transition-all duration-300 hover:shadow-md dark:bg-[#252834]/80 dark:border-[#D4C4A8]/10',
        className
      )}
      {...props}
    >
      {(title || description || action) && (
        <div className="px-6 py-5 border-b border-proofound-stone/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-transparent dark:border-[#D4C4A8]/10">
          <div className="flex flex-col gap-1.5">
            {title && (
              <h3 className="font-semibold text-lg tracking-tight text-proofound-charcoal dark:text-[#E8DCC4]">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground dark:text-[#A8A299]">{description}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn('flex flex-col flex-1', !noPadding && 'p-5 sm:p-6')}>{children}</div>
    </div>
  );
}
