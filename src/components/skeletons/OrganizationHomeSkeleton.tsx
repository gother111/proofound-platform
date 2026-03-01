import { AppSurface } from '@/components/ui/v2/AppSurface';
import { WidgetGridSkeleton } from '@/components/dashboard/WidgetGridSkeleton';
import {
  PageIntroSkeleton,
  SummaryMetricsSkeleton,
} from '@/components/skeletons/CoreLoadingPrimitives';
import { Skeleton } from '@/components/ui/skeleton';

export function OrganizationHomeSkeleton() {
  return (
    <AppSurface>
      <div className="max-w-[1400px] mx-auto px-4 py-4 space-y-4">
        <section
          className="rounded-2xl p-6"
          style={{ background: 'linear-gradient(135deg, #1C4D3A 0%, #2D5F4A 45%, #1C4D3A 100%)' }}
        >
          <PageIntroSkeleton
            titleWidthClassName="w-64"
            subtitleWidthClassName="w-[26rem]"
            actionWidthClassName="w-40"
            className="items-start"
          />
          <Skeleton className="h-10 w-44 rounded-md mt-4 bg-white/20" />
        </section>

        <SummaryMetricsSkeleton
          count={3}
          columnsClassName="grid grid-cols-1 gap-4 md:grid-cols-3"
        />

        <WidgetGridSkeleton variant="organizationDashboard" />
      </div>
    </AppSurface>
  );
}
