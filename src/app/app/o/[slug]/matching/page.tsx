'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { OrganizationMatchingEmpty } from '@/components/matching/OrganizationMatchingEmpty';
import { AssignmentBuilderV2 } from '@/components/matching/AssignmentBuilderV2';
import { MatchingOrganizationView } from '@/components/matching/MatchingOrganizationView';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';

export default function OrgMatchingPage() {
  const router = useRouter();
  const params = useParams();
  const slug = (params as { slug?: string }).slug;
  const [assignments, setAssignments] = useState<any[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const query = slug ? `?orgSlug=${encodeURIComponent(slug)}` : '';
        const response = await fetch(`/api/assignments${query}`);
        const data = await response.json();
        setAssignments(data.items || []);
      } catch (error) {
        toast.error('Failed to load assignments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-proofound-parchment dark:bg-background">
        <p className="text-proofound-charcoal/70 dark:text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Show builder if triggered
  if (showBuilder) {
    return (
      <AssignmentBuilderV2
        orgSlug={slug}
        onComplete={(assignmentId) => {
          setShowBuilder(false);
          router.refresh();
          const query = slug ? `?orgSlug=${encodeURIComponent(slug)}` : '';
          fetch(`/api/assignments${query}`)
            .then((res) => res.json())
            .then((data) => setAssignments(data.items || []));
        }}
        onCancel={() => {
          setShowBuilder(false);
        }}
      />
    );
  }

  // Show empty state if no assignments
  if (assignments.length === 0) {
    return <OrganizationMatchingEmpty onCreateAssignment={() => setShowBuilder(true)} />;
  }

  // Show filled view with matches
  return (
    <MatchingOrganizationView assignments={assignments} onCreateNew={() => setShowBuilder(true)} />
  );
}
