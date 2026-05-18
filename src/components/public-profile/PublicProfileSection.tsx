import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

type PublicProfileSectionProps = {
  title: string;
  children: ReactNode;
  right?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function PublicProfileSection({
  title,
  children,
  right,
  className,
  contentClassName,
}: PublicProfileSectionProps) {
  return (
    <Card variant="bento" className={cn('min-w-0 overflow-hidden', className)}>
      <header className="flex min-w-0 items-center justify-between gap-3 border-b border-[#ECEAE3]/50 px-3 py-2.5 sm:px-4">
        <h2 className="min-w-0 break-words text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {title}
        </h2>
        {right}
      </header>
      <div className={cn('min-w-0 px-3 py-3 sm:px-4', contentClassName)}>{children}</div>
    </Card>
  );
}
