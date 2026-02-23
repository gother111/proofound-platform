'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { OrganizationMatchingEmpty } from '@/components/matching/OrganizationMatchingEmpty';
import { MatchingOrganizationView } from '@/components/matching/MatchingOrganizationView';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';

export default function OrgMatchingPage() {
  const router = useRouter();
  const params = useParams();
  const slug =
    typeof params.slug === 'string'
      ? params.slug
      : Array.isArray(params.slug)
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
      } catch (error) {
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
      <div className="flex items-center justify-center min-h-[60vh] bg-proofound-parchment dark:bg-background">
        <p className="text-proofound-charcoal/70 dark:text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Show empty state if no assignments
  if (assignments.length === 0) {
    return <OrganizationMatchingEmpty orgSlug={slug} onCreateAssignment={handleCreateAssignment} />;
  }

  // Show filled view with matches
  return (
    <MatchingOrganizationView assignments={assignments} onCreateNew={handleCreateAssignment} />
  );
}
