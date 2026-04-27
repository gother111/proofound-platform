import { CardGridSkeleton, PageIntroSkeleton } from '@/components/skeletons/CoreLoadingPrimitives';

export default function LoadingIndividualMatching() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <p className="mb-3 text-sm text-muted-foreground" role="status" aria-live="polite">
        Preparing matches...
      </p>
      <div className="mb-6">
        <PageIntroSkeleton showAction titleWidthClassName="w-44" subtitleWidthClassName="w-72" />
      </div>
      <CardGridSkeleton
        count={6}
        columnsClassName="grid grid-cols-1 md:grid-cols-2 gap-4"
        tileClassName="min-h-[220px]"
      />
    </div>
  );
}
