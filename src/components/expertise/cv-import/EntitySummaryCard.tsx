'use client';

import { ChevronDown } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EntitySummaryCardProps {
  title: string;
  totalCount: number;
  approvedCount: number;
  summary: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function EntitySummaryCard({
  title,
  totalCount,
  approvedCount,
  summary,
  children,
  defaultOpen = false,
  className,
}: EntitySummaryCardProps) {
  return (
    <details className={cn('group rounded-lg border bg-background', className)} open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{summary}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {approvedCount}/{totalCount} approved
          </Badge>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </div>
      </summary>
      <div className="border-t px-4 py-3">{children}</div>
    </details>
  );
}
