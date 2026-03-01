import { AppSurface } from '@/components/ui/v2/AppSurface';
import { CardListSkeleton, PageIntroSkeleton } from '@/components/skeletons/CoreLoadingPrimitives';

export default function Loading() {
  return (
    <AppSurface>
      <div className="space-y-6 max-w-4xl mx-auto w-full">
        <PageIntroSkeleton showAction={false} />
        <CardListSkeleton count={3} />
      </div>
    </AppSurface>
  );
}
