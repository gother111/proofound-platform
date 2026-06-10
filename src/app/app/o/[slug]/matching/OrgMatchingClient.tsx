'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Info } from 'lucide-react';
import { OrganizationMatchingEmpty } from '@/components/matching/OrganizationMatchingEmpty';
import { MatchingOrganizationView } from '@/components/matching/MatchingOrganizationView';
import { toast } from 'sonner';
import { CardGridSkeleton, PageIntroSkeleton } from '@/components/skeletons/CoreLoadingPrimitives';

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

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const orgQuery = slug ? `?orgSlug=${encodeURIComponent(slug)}` : '';
        const response = await fetch(`/api/assignments${orgQuery}`);
        const data = await response.json();
        setAssignments(data.items || []);
      } catch {
        toast.error('Failed to load assignments');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAssignments();
  }, [slug]);

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
        <p className="text-sm text-muted-foreground">Loading assignments and matches...</p>
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
            className="inline-flex min-h-9 shrink-0 items-center rounded-md px-3 text-xs font-medium text-proofound-forest hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
          >
            Dismiss
          </button>
        </div>
      ) : null}
      <MatchingOrganizationView assignments={assignments} onCreateNew={handleCreateAssignment} />
    </div>
  );
}
