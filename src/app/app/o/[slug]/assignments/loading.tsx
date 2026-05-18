import { AppSurface } from '@/components/ui/v2/AppSurface';
import { CardGridSkeleton, PageIntroSkeleton } from '@/components/skeletons/CoreLoadingPrimitives';

export default function Loading() {
  return (
    <AppSurface>
      <div className="space-y-6 max-w-6xl mx-auto">
        <section className="rounded-2xl border border-proofound-stone bg-white/85 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Assignments
          </p>
          <h1 className="mt-2 font-display text-xl font-semibold text-foreground">
            Assignment workspace is loading
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            We are preparing the assignment cards, proof matches, and review context for this
            workspace.
          </p>
          <p className="mt-3 text-sm text-muted-foreground" role="status">
            Loading assignments and matches...
          </p>
        </section>
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
