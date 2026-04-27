import { CardListSkeleton, PageIntroSkeleton } from '@/components/skeletons/CoreLoadingPrimitives';
import { AppSurface } from '@/components/ui/v2/AppSurface';

export default function LoadingIndividualInterviews() {
  return (
    <AppSurface>
      <div className="max-w-4xl mx-auto space-y-6">
        <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
          Loading interview corridor...
        </p>
        <PageIntroSkeleton showAction={false} titleWidthClassName="w-44" />
        <CardListSkeleton count={2} itemClassName="p-5 sm:p-6" />
      </div>
    </AppSurface>
  );
}
