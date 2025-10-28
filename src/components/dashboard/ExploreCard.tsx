'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ExploreTab = 'people' | 'projects' | 'partners';

export function ExploreCard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ExploreTab>('people');

  // TODO: Replace with actual data fetching from database
  // For now, always show empty state
  const hasData = false;

  return (
    <Card className="p-4 border lg:col-span-3" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-sm" style={{ color: '#2D3330' }}>
          Explore
        </h5>
      </div>

      {!hasData ? (
        <div className="text-center py-6">
          <Briefcase className="w-10 h-10 mx-auto mb-2" style={{ color: '#E8E6DD' }} />
          <p className="text-xs mb-3" style={{ color: '#6B6760' }}>
            Discover opportunities aligned with your interests.
          </p>
          <Button
            size="sm"
            className="h-7 text-xs"
            style={{ backgroundColor: '#1C4D3A', color: '#F7F6F1' }}
            onClick={() => router.push('/app/i/opportunities')}
          >
            Start exploring
          </Button>
        </div>
      ) : (
        <>
          {/* Tabs - will be populated when data exists */}
          <div
            className="flex items-center gap-1 mb-3 p-0.5 rounded-lg w-fit"
            style={{ backgroundColor: '#E8E6DD' }}
          >
            <button
              className={`px-2.5 py-1 rounded text-xs transition-all ${activeTab === 'people' ? 'font-medium' : ''}`}
              style={{
                backgroundColor: activeTab === 'people' ? 'white' : 'transparent',
                color: '#2D3330',
              }}
              onClick={() => setActiveTab('people')}
            >
              People
            </button>
            <button
              className={`px-2.5 py-1 rounded text-xs transition-all ${activeTab === 'projects' ? 'font-medium' : ''}`}
              style={{
                backgroundColor: activeTab === 'projects' ? 'white' : 'transparent',
                color: '#2D3330',
              }}
              onClick={() => setActiveTab('projects')}
            >
              Projects
            </button>
            <button
              className={`px-2.5 py-1 rounded text-xs transition-all ${activeTab === 'partners' ? 'font-medium' : ''}`}
              style={{
                backgroundColor: activeTab === 'partners' ? 'white' : 'transparent',
                color: '#2D3330',
              }}
              onClick={() => setActiveTab('partners')}
            >
              Partners
            </button>
          </div>

          {/* Content grid - will be populated when data exists */}
          <div className="grid grid-cols-4 gap-3">
            {/* Opportunity cards will be rendered here when data is available */}
          </div>
        </>
      )}
    </Card>
  );
}
