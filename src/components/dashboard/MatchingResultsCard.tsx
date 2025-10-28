'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface MatchingResultsCardProps {
  className?: string;
  basePath?: string; // '/app/i' or '/app/o/[slug]'
}

export function MatchingResultsCard({ className, basePath = '/app/i' }: MatchingResultsCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className={`p-4 border ${className || ''}`}
      style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-sm" style={{ color: '#2D3330' }}>
          Matches
        </h5>
      </div>
      <div className="text-center py-6">
        <Sparkles className="w-10 h-10 mx-auto mb-2" style={{ color: '#E8E6DD' }} />
        <p className="text-xs mb-3" style={{ color: '#6B6760' }}>
          Turn on matching to discover aligned people and projects.
        </p>
        <Link href={`${basePath}/matching`}>
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
          >
            Open preferences
          </Button>
        </Link>
      </div>
    </Card>
  );
}
