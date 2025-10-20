'use client';

import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface OrganizationMatchingEmptyProps {
  onCreateAssignment: () => void;
}

/**
 * Empty state for organizations who haven't created any assignments yet.
 */
export function OrganizationMatchingEmpty({ onCreateAssignment }: OrganizationMatchingEmptyProps) {
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
            <Users className="w-8 h-8" style={{ color: '#1C4D3A' }} />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-semibold mb-3" style={{ color: '#2D3330' }}>
          Find Perfect-Fit Contributors
        </h2>

        {/* Description */}
        <p className="text-base mb-6" style={{ color: '#6B6760' }}>
          Create your first assignment to match with skilled individuals who align with your mission
          and values. Blind-first matching removes bias from your hiring—candidates remain anonymous
          until there&apos;s mutual interest.
        </p>

        {/* CTA */}
        <Button
          size="lg"
          onClick={onCreateAssignment}
          className="mb-4"
          style={{ backgroundColor: '#1C4D3A' }}
        >
          Create Your First Assignment
        </Button>

        {/* Secondary info */}
        <p className="text-sm" style={{ color: '#6B6760' }}>
          Define skills, values, and impact areas • Candidates remain anonymous
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
