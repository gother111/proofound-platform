import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function WidgetGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {/* Widget 1 */}
      <Card className="col-span-1 md:col-span-2 lg:col-span-1 min-h-[300px] border-black/5 dark:border-white/5 bg-card/50">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32 rounded-md mb-2" />
          <Skeleton className="h-4 w-48 rounded-md" />
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      {/* Widget 2 */}
      <Card className="col-span-1 lg:col-span-2 min-h-[300px] border-black/5 dark:border-white/5 bg-card/50">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40 rounded-md mb-2" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <div className="w-full flex justify-around items-end h-32 space-x-2">
            <Skeleton className="w-12 h-24 rounded-t-md" />
            <Skeleton className="w-12 h-16 rounded-t-md" />
            <Skeleton className="w-12 h-32 rounded-t-md" />
            <Skeleton className="w-12 h-20 rounded-t-md" />
          </div>
        </CardContent>
      </Card>

      {/* Widget 3 */}
      <Card className="col-span-1 min-h-[250px] border-black/5 dark:border-white/5 bg-card/50">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48 rounded-md mb-2" />
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center pt-6">
          <Skeleton className="w-32 h-32 rounded-full" />
        </CardContent>
      </Card>

      {/* Widget 4 */}
      <Card className="col-span-1 md:col-span-2 min-h-[250px] border-black/5 dark:border-white/5 bg-card/50">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-36 rounded-md mb-4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}
