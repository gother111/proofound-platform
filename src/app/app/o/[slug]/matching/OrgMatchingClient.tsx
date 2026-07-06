'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, Info, RefreshCcw } from 'lucide-react';
import { OrganizationMatchingEmpty } from '@/components/matching/OrganizationMatchingEmpty';
import { MatchingOrganizationView } from '@/components/matching/MatchingOrganizationView';
import { toast } from 'sonner';
import { CardGridSkeleton, PageIntroSkeleton } from '@/components/skeletons/CoreLoadingPrimitives';
import { Button } from '@/components/ui/button';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

export function OrgMatchingClient() {
  const router = useRouter();
  const params = useParams();
  const slug =
    typeof params?.slug === 'string'
      ? params.slug
      : Array.isArray(params?.slug)
        ? params.slug[0]
        : null;
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showShortlistNotice, setShowShortlistNotice] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('from') === 'shortlist') {
        setShowShortlistNotice(true);
      }
    }
  }, []);

  const dismissShortlistNotice = () => {
    setShowShortlistNotice(false);
    if (!slug) {
      return;
    }

    router.replace(`/app/o/${encodeURIComponent(slug)}/assignments`);
  };

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const orgQuery = slug ? `?orgSlug=${encodeURIComponent(slug)}` : '';
      const response = await fetch(`/api/assignments${orgQuery}`);

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(
          typeof errorPayload?.error === 'string'
            ? errorPayload.error
            : 'Failed to fetch assignments'
        );
      }

      const data = await response.json();
      setAssignments(data.items || []);
    } catch (error) {
      dispatchClientErrorDiagnostic('matching.organization_assignments.load_failed', error);
      setAssignments([]);
      setLoadError(
        'Your assignments and review queue are still safe. Retry loading this section before creating a new assignment.'
      );
      toast.error('Assignments could not load', {
        description: 'Retry the assignment corridor without leaving this page.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void fetchAssignments();
  }, [fetchAssignments]);

  const handleCreateAssignment = () => {
    if (!slug) {
      toast.error('Organization context not found');
      return;
    }
    router.push(`/app/o/${slug}/assignments/new`);
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section className="rounded-2xl border border-proofound-stone bg-white/85 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Assignments
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold text-foreground">
            Preparing assignment review workspace
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            We are loading assignment cards, proof submissions, and review context for this
            organization. No shortlist, intro, or reveal action changes while this workspace loads.
          </p>
          <p className="mt-3 text-sm text-muted-foreground" role="status">
            Preparing assignment review workspace...
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
    );
  }

  if (loadError) {
    return (
      <div
        className="mx-auto flex min-h-[420px] w-full max-w-3xl flex-col items-center justify-center rounded-xl border border-proofound-stone/80 bg-white/75 p-8 text-center shadow-sm"
        role="alert"
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#fff1d6] text-[#8a5b00]">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="font-display text-xl font-semibold text-proofound-charcoal">
          Assignments could not load
        </h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{loadError}</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => void fetchAssignments()}
          className="mt-4 min-h-[44px] rounded-full border-proofound-stone/85 bg-white px-4 text-proofound-forest hover:border-proofound-forest hover:bg-proofound-parchment/30"
        >
          <RefreshCcw className="mr-2 h-4 w-4" aria-hidden="true" />
          Retry assignments
        </Button>
      </div>
    );
  }

  if (assignments.length === 0) {
    return <OrganizationMatchingEmpty orgSlug={slug} onCreateAssignment={handleCreateAssignment} />;
  }

  return (
    <div className="space-y-4">
      {showShortlistNotice ? (
        <div
          className="flex items-start gap-3 rounded-xl border border-proofound-stone/70 bg-[#f3f6ef] px-4 py-3 text-sm text-proofound-charcoal"
          role="status"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-proofound-forest" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">Shortlist lives inside each assignment</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Open an assignment, then use the Shortlist tab to review staged proof submissions and
              request introductions.
            </p>
          </div>
          <button
            type="button"
            onClick={dismissShortlistNotice}
            className="inline-flex min-h-[44px] shrink-0 items-center rounded-md px-3 text-xs font-medium text-proofound-forest hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
          >
            Dismiss
          </button>
        </div>
      ) : null}
      <MatchingOrganizationView assignments={assignments} onCreateNew={handleCreateAssignment} />
    </div>
  );
}
