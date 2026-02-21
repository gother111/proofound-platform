'use client';

import { useEffect, useState } from 'react';
import { StructureManager } from './StructureManager';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { apiFetch } from '@/lib/api/fetch';

interface Department {
  id: string;
  entityType: 'executive_team' | 'department' | 'team' | 'working_group';
  name: string;
  description?: string;
  teamSize?: number;
  focusArea?: string;
  parentId?: string;
}

interface StructureManagerClientProps {
  orgId: string;
}

export function StructureManagerClient({ orgId }: StructureManagerClientProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStructure() {
      try {
        const response = await apiFetch(`/api/organizations/${orgId}/structure`);

        if (!response.ok) {
          throw new Error('Failed to fetch structure');
        }

        const data = await response.json();

        // Map snake_case from API to camelCase for components
        const mappedStructure = (data.structure || []).map((item: any) => ({
          id: item.id,
          entityType: item.entity_type,
          name: item.name,
          description: item.description,
          teamSize: item.team_size,
          focusArea: item.focus_area,
          parentId: item.parent_id,
        }));

        setDepartments(mappedStructure);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load structure');
      } finally {
        setIsLoading(false);
      }
    }

    fetchStructure();
  }, [orgId]);

  if (isLoading) {
    return (
      <Card className="border-black/5 dark:border-white/5 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full max-w-lg" />
            <div className="space-y-3 pt-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-black/5 dark:border-white/5 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">Please try refreshing the page</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <StructureManager orgId={orgId} initialDepartments={departments} />;
}
