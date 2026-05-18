'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
    <MatchingOrganizationView assignments={assignments} onCreateNew={handleCreateAssignment} />
  );
}
