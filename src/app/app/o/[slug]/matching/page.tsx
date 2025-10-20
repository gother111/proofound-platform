'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OrganizationMatchingEmpty } from '@/components/matching/OrganizationMatchingEmpty';
import { AssignmentBuilder } from '@/components/matching/AssignmentBuilder';
import { MatchingOrganizationView } from '@/components/matching/MatchingOrganizationView';
import { toast } from 'sonner';
import { MATCHING_ENABLED } from '@/lib/featureFlags';

export const dynamic = 'force-dynamic';

export default function OrgMatchingPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!MATCHING_ENABLED) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/assignments');
        const data = await response.json();
        setAssignments(data.items || []);
      } catch (error) {
        toast.error('Failed to load assignments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  if (!MATCHING_ENABLED) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-2">Matching</h1>
        <p className="text-muted-foreground">Coming soon</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>Loading...</p>
      </div>
    );
  }

  // Show builder if triggered
  if (showBuilder) {
    return (
      <AssignmentBuilder
        onComplete={(assignmentId) => {
          setShowBuilder(false);
          router.refresh();
          // Refresh assignments list
          fetch('/api/assignments')
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
