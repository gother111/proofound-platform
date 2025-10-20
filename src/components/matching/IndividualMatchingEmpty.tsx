'use client';

import { Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface IndividualMatchingEmptyProps {
  onSetup: () => void;
}

/**
 * Empty state for individuals who haven't set up matching yet.
 */
export function IndividualMatchingEmpty({ onSetup }: IndividualMatchingEmptyProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Card
        className="max-w-2xl p-8 text-center"
        style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#E8E6DD' }}
          >
            <Target className="w-8 h-8" style={{ color: '#1C4D3A' }} />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-semibold mb-3" style={{ color: '#2D3330' }}>
          Start Finding Meaningful Opportunities
        </h2>

        {/* Description */}
        <p className="text-base mb-6" style={{ color: '#6B6760' }}>
          Set up your matching profile to discover roles aligned with your skills, values, and
          impact goals. Our blind-first matching ensures bias-free connections—organizations
          won&apos;t see your name, photo, or background until there&apos;s mutual interest.
        </p>

        {/* CTA */}
        <Button size="lg" onClick={onSetup} className="mb-4" style={{ backgroundColor: '#1C4D3A' }}>
          Set Up Matching Profile
        </Button>

        {/* Secondary info */}
        <p className="text-sm" style={{ color: '#6B6760' }}>
          Takes ~5 minutes • 100% anonymous until mutual interest
        </p>

        {/* Subtle background decoration */}
        <div className="mt-8 flex justify-center gap-2 opacity-20">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#7A9278' }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#C76B4A' }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#7A9278' }} />
        </div>
      </Card>
    </div>
  );
}
