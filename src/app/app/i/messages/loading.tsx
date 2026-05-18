import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingIndividualMessages() {
  return (
    <div className="h-full min-h-[calc(100vh-3.5rem)] flex flex-col md:flex-row">
      <div className="w-full min-h-0 md:w-80 flex-shrink-0 border-r border-proofound-stone/70 bg-white/70">
        <div className="space-y-3 p-4">
          <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
            Loading proof-safe conversations...
          </p>
          <Skeleton className="h-8 w-32 rounded-md" />
          <Skeleton className="h-10 w-full rounded-lg" />
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-proofound-stone/70 p-3">
              <div className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-36 rounded-md" />
                  <Skeleton className="h-3 w-44 rounded-md" />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="hidden min-h-0 flex-1 items-center justify-center bg-japandi-bg md:flex">
        <div className="mx-6 w-full max-w-md rounded-2xl border border-proofound-stone/70 bg-white/60 p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-proofound-parchment">
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="mx-auto h-6 w-44 rounded-md" />
            <Skeleton className="mx-auto h-4 w-full rounded-md" />
            <Skeleton className="mx-auto h-4 w-4/5 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
