'use client';

import { useState } from 'react';
import { Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ExploreOpportunitiesCardProps {
  className?: string;
}

const tabs = ['People', 'Projects', 'Partners'];

export function ExploreOpportunitiesCard({ className }: ExploreOpportunitiesCardProps) {
  const [activeTab, setActiveTab] = useState('People');

  return (
    <Card
      className={`p-4 border ${className || ''}`}
      style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
    >
      <h5 className="text-sm font-medium mb-3" style={{ color: '#2D3330' }}>
        Explore
      </h5>

      {/* Tabs */}
      <div
        className="flex items-center gap-1 mb-3 p-0.5 rounded-lg w-fit"
        style={{ backgroundColor: '#E8E6DD' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-2.5 py-1 rounded text-xs font-medium transition-colors"
            style={
              activeTab === tab
                ? { backgroundColor: 'white', color: '#2D3330' }
                : { color: '#2D3330' }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="text-center py-6">
        <Briefcase className="w-10 h-10 mx-auto mb-2 text-muted" />
        <p className="text-xs mb-3 text-muted-foreground">
          Discover opportunities aligned with your interests.
        </p>
        <Button size="sm" className="h-7 text-xs">
          Start exploring
        </Button>
      </div>
    </Card>
  );
}
