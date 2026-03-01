import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export type WidgetGridSkeletonVariant = 'individualDashboard' | 'organizationDashboard';

interface WidgetGridSkeletonProps {
  variant?: WidgetGridSkeletonVariant;
  className?: string;
}

type SkeletonTile = {
  className: string;
  minHeightClassName?: string;
  showChartBars?: boolean;
  showCircle?: boolean;
};

const INDIVIDUAL_TILES: SkeletonTile[] = [
  { className: 'col-span-1 md:col-span-1 lg:col-span-1', minHeightClassName: 'min-h-[300px]' },
  {
    className: 'col-span-1 md:col-span-2 lg:col-span-1',
    minHeightClassName: 'min-h-[300px]',
    showChartBars: true,
  },
  { className: 'col-span-1 md:col-span-1 lg:col-span-1', minHeightClassName: 'min-h-[300px]' },
  {
    className: 'col-span-1 md:col-span-1 lg:col-span-1',
    minHeightClassName: 'min-h-[260px]',
    showCircle: true,
  },
  { className: 'col-span-1 md:col-span-1 lg:col-span-1', minHeightClassName: 'min-h-[260px]' },
  { className: 'col-span-1 md:col-span-2 lg:col-span-3', minHeightClassName: 'min-h-[240px]' },
];

const ORGANIZATION_TILES: SkeletonTile[] = [
  {
    className: 'col-span-1 md:col-span-2 lg:col-span-2',
    minHeightClassName: 'min-h-[280px]',
    showChartBars: true,
  },
  {
    className: 'col-span-1 md:col-span-2 lg:col-span-2',
    minHeightClassName: 'min-h-[280px]',
  },
  { className: 'col-span-1 md:col-span-1 lg:col-span-1', minHeightClassName: 'min-h-[240px]' },
  { className: 'col-span-1 md:col-span-1 lg:col-span-1', minHeightClassName: 'min-h-[240px]' },
  { className: 'col-span-1 md:col-span-1 lg:col-span-1', minHeightClassName: 'min-h-[240px]' },
];

function WidgetShell({ tile }: { tile: SkeletonTile }) {
  return (
    <Card
      variant="bento"
      className={cn('border-black/5 dark:border-white/5 bg-card/50', tile.minHeightClassName)}
    >
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-32 rounded-md mb-2" />
        <Skeleton className="h-4 w-48 rounded-md" />
      </CardHeader>
      <CardContent className="space-y-4">
        {tile.showChartBars ? (
          <div className="w-full flex justify-around items-end h-32 space-x-2">
            <Skeleton className="w-12 h-24 rounded-t-md" />
            <Skeleton className="w-12 h-16 rounded-t-md" />
            <Skeleton className="w-12 h-32 rounded-t-md" />
            <Skeleton className="w-12 h-20 rounded-t-md" />
          </div>
        ) : tile.showCircle ? (
          <div className="flex flex-col items-center justify-center pt-6">
            <Skeleton className="w-32 h-32 rounded-full" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-4 items-center">
              <Skeleton className="w-12 h-12 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <Skeleton className="w-12 h-12 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-2/3 rounded-md" />
                <Skeleton className="h-4 w-1/3 rounded-md" />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function WidgetGridSkeleton({
  variant = 'individualDashboard',
  className,
}: WidgetGridSkeletonProps) {
  const isOrganization = variant === 'organizationDashboard';
  const tiles = isOrganization ? ORGANIZATION_TILES : INDIVIDUAL_TILES;
  const gridClassName = isOrganization
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 grid-flow-dense auto-rows-min';

  return (
    <div
      data-testid={`widget-grid-skeleton-${variant}`}
      className={cn(gridClassName, 'animate-pulse', className)}
    >
      {tiles.map((tile, index) => (
        <div
          key={`${variant}-${index}`}
          className={tile.className}
          data-testid={`widget-grid-skeleton-tile-${variant}-${index}`}
        >
          <WidgetShell tile={tile} />
        </div>
      ))}
    </div>
  );
}
