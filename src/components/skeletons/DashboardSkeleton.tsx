import { SkeletonCard } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F6F1' }}>
      <div className="max-w-[1400px] mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* While Away - hidden by default */}
          <div className="lg:col-span-3">
            <SkeletonCard />
          </div>

          {/* Row 1: Goals | Tasks | Projects */}
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />

          {/* Row 2: Matching (2 cols) | Team (1 col) */}
          <div className="lg:col-span-2">
            <SkeletonCard />
          </div>
          <SkeletonCard />

          {/* Row 3: Explore (full 3 cols) */}
          <div className="lg:col-span-3">
            <SkeletonCard />
          </div>
        </div>
      </div>
    </div>
  );
}
