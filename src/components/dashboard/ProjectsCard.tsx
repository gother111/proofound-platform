'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderKanban } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ProjectsCard() {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  // TODO: Replace with actual data fetching from database
  // For now, always show empty state
  const projects = [];

  return (
    <Card className="p-4 border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-sm" style={{ color: '#2D3330' }}>
          Projects
        </h5>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-6">
          <FolderKanban className="w-10 h-10 mx-auto mb-2" style={{ color: '#E8E6DD' }} />
          <p className="text-xs mb-3" style={{ color: '#6B6760' }}>
            No active projects yet.
          </p>
          <Button
            size="sm"
            className="h-7 text-xs"
            style={{
              backgroundColor: isHovered ? '#2D5F4A' : '#1C4D3A',
              color: '#F7F6F1',
              transition: 'background-color 200ms',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => router.push('/app/i/opportunities')}
          >
            Explore
          </Button>
        </div>
      ) : (
        // When projects exist, they will render here from database
        <div className="space-y-3">
          {/* Project cards will be rendered here when data is available */}
        </div>
      )}
    </Card>
  );
}
