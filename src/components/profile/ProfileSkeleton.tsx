import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-proofound-parchment dark:bg-background pb-12 animate-in fade-in duration-500">
      {/* Hero Skeleton */}
      <div className="h-64 md:h-80 w-full bg-muted/40 animate-pulse relative">
        <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 mb-8">
          <Card className="p-6 md:p-8 rounded-3xl border-black/5 dark:border-white/5 bg-white/70 dark:bg-stone-900/60 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Avatar Skeleton */}
              <Skeleton className="w-32 h-32 rounded-full border-4 border-background shrink-0" />

              {/* Basic Info Skeleton */}
              <div className="flex-1 space-y-4 w-full pt-2">
                <Skeleton className="h-10 w-3/4 max-w-sm rounded-lg" />
                <div className="flex gap-4">
                  <Skeleton className="h-5 w-24 rounded-md" />
                  <Skeleton className="h-5 w-32 rounded-md" />
                </div>
                <Skeleton className="h-16 w-full max-w-2xl rounded-xl" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar Skeleton */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className="p-6 rounded-3xl border-black/5 dark:border-white/5 bg-card/50"
              >
                <CardHeader className="p-0 mb-4 flex flex-row items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-xl" />
                  <Skeleton className="h-6 w-24 rounded-md" />
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-5/6 rounded-md" />
                  <Skeleton className="h-4 w-4/6 rounded-md" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Content Skeleton */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tabs Skeleton */}
            <div className="flex gap-4 border-b border-border pb-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-8 w-24 rounded-full" />
              ))}
            </div>

            {/* Feed/List Items Skeleton */}
            <div className="space-y-6 mt-6">
              {[1, 2].map((i) => (
                <Card key={i} className="p-6 md:p-8 rounded-3xl border-black/5 dark:border-white/5">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-4">
                      <Skeleton className="h-6 w-1/3 rounded-lg" />
                      <Skeleton className="h-4 w-1/4 rounded-md" />
                      <div className="space-y-2 pt-2">
                        <Skeleton className="h-4 w-full rounded-md" />
                        <Skeleton className="h-4 w-full rounded-md" />
                        <Skeleton className="h-4 w-2/3 rounded-md" />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
