import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PublicProfileShellProps = {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  compact?: boolean;
  className?: string;
  bodyClassName?: string;
  maxWidthClassName?: string;
};

export function PublicProfileShell({
  children,
  header,
  footer,
  compact = false,
  className,
  bodyClassName,
  maxWidthClassName = 'max-w-5xl',
}: PublicProfileShellProps) {
  return (
    <div
      className={cn(
        compact ? 'bg-japandi-bg p-3' : 'min-h-screen bg-japandi-bg p-4 sm:p-6 md:p-8',
        className
      )}
    >
      <div className={cn('mx-auto w-full', maxWidthClassName)}>
        <div className="overflow-hidden rounded-2xl border border-white/40 bg-white/60 backdrop-blur-2xl shadow-xl">
          <div className="h-2 bg-gradient-to-r from-[#1C4D3A] via-[#2B5F49] to-[#C76B4A]" />
          {header ? (
            <div className="border-b border-[#ECEAE3] px-4 py-4 sm:px-5">{header}</div>
          ) : null}
          <div className={cn('px-4 py-4 sm:px-5 sm:py-5', bodyClassName)}>{children}</div>
          {footer ? (
            <div className="border-t border-[#ECEAE3] bg-[#F4F2EC] px-4 py-2.5 text-xs text-[#7A756C] sm:px-5">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
