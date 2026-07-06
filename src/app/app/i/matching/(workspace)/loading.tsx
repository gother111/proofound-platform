import { CardGridSkeleton, PageIntroSkeleton } from '@/components/skeletons/CoreLoadingPrimitives';

export default function LoadingIndividualMatching() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-proofound-forest">
          Assignment review
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-proofound-charcoal">
          Assignment review workspace
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Preparing privacy-safe assignment reviews, readiness context, and next actions.
        </p>
        <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
          Preparing assignment review workspace...
        </p>
      </div>
      <div className="mb-6" aria-hidden="true">
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
