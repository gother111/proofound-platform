import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface PageIntroSkeletonProps {
  className?: string;
  titleWidthClassName?: string;
  subtitleWidthClassName?: string;
  showAction?: boolean;
  actionWidthClassName?: string;
}

export function PageIntroSkeleton({
  className,
  titleWidthClassName = 'w-56',
  subtitleWidthClassName = 'w-80',
  showAction = true,
  actionWidthClassName = 'w-40',
}: PageIntroSkeletonProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <div className="space-y-2">
        <Skeleton className={cn('h-8 rounded-md', titleWidthClassName)} />
        <Skeleton className={cn('h-4 rounded-md', subtitleWidthClassName)} />
      </div>
      {showAction ? <Skeleton className={cn('h-10 rounded-md', actionWidthClassName)} /> : null}
    </div>
  );
}

interface CardGridSkeletonProps {
  count?: number;
  className?: string;
  columnsClassName?: string;
  tileClassName?: string;
}

export function CardGridSkeleton({
  count = 3,
  className,
  columnsClassName = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  tileClassName = 'min-h-[220px]',
}: CardGridSkeletonProps) {
  return (
    <div className={cn(columnsClassName, className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} variant="bento" className={cn('p-4', tileClassName)}>
          <div className="space-y-3">
            <Skeleton className="h-6 w-1/2 rounded-md" />
            <Skeleton className="h-4 w-2/3 rounded-md" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-5/6 rounded-lg" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

interface CardListSkeletonProps {
  count?: number;
  className?: string;
  itemClassName?: string;
}

export function CardListSkeleton({
  count = 3,
  className,
  itemClassName = 'p-5',
}: CardListSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className={itemClassName}>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-6 w-48 rounded-md" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-2/3 rounded-md" />
            <div className="flex flex-wrap gap-2 pt-1">
              <Skeleton className="h-8 w-24 rounded-md" />
              <Skeleton className="h-8 w-28 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

interface CenteredStatusSkeletonProps {
  className?: string;
  containerClassName?: string;
  showLine?: boolean;
}

export function CenteredStatusSkeleton({
  className,
  containerClassName = 'min-h-[280px]',
  showLine = true,
}: CenteredStatusSkeletonProps) {
  return (
    <div className={cn('flex items-center justify-center', containerClassName, className)}>
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        {showLine ? <Skeleton className="h-4 w-40 rounded-md" /> : null}
      </div>
    </div>
  );
}

interface SummaryMetricsSkeletonProps {
  count?: number;
  className?: string;
  columnsClassName?: string;
}

export function SummaryMetricsSkeleton({
  count = 3,
  className,
  columnsClassName = 'grid grid-cols-1 gap-4 md:grid-cols-3',
}: SummaryMetricsSkeletonProps) {
  return (
    <div className={cn(columnsClassName, className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="p-4">
          <CardHeader className="p-0 pb-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="p-0 space-y-2">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
