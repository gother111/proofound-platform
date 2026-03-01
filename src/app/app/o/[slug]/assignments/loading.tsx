import { AppSurface } from '@/components/ui/v2/AppSurface';
import { CardGridSkeleton, PageIntroSkeleton } from '@/components/skeletons/CoreLoadingPrimitives';

export default function Loading() {
  return (
    <AppSurface>
      <div className="space-y-6 max-w-6xl mx-auto">
        <PageIntroSkeleton />
        <CardGridSkeleton
          count={4}
          columnsClassName="grid gap-3 sm:grid-cols-2"
          tileClassName="min-h-[160px]"
        />
        <CardGridSkeleton
          count={4}
          columnsClassName="grid grid-cols-1 md:grid-cols-2 gap-4"
          tileClassName="min-h-[220px]"
        />
      </div>
    </AppSurface>
  );
}
