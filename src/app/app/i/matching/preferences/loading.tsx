import { CardListSkeleton, PageIntroSkeleton } from '@/components/skeletons/CoreLoadingPrimitives';

export default function LoadingMatchingPreferences() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-proofound-forest">
          Matching
        </p>
        <h1 className="font-display text-3xl font-semibold text-proofound-charcoal">
          Matching Preferences
        </h1>
        <p
          className="max-w-2xl text-sm leading-6 text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          Loading your proof-review preferences...
        </p>
      </div>
      <PageIntroSkeleton showAction={false} />
      <CardListSkeleton count={4} />
    </div>
  );
}
