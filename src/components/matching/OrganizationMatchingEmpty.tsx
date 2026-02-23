'use client';

import { Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getOrganizationRecoveryActions } from '@/lib/ui/recovery-actions';

interface OrganizationMatchingEmptyProps {
  orgSlug?: string | null;
  onCreateAssignment: () => void;
}

/**
 * Empty state for organizations who haven't created any assignments yet.
 */
export function OrganizationMatchingEmpty({
  orgSlug,
  onCreateAssignment,
}: OrganizationMatchingEmptyProps) {
  const router = useRouter();
  const remediationActions = getOrganizationRecoveryActions('org-matching-empty', orgSlug);

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

        <div className="mt-6 grid grid-cols-1 gap-2 text-left">
          {remediationActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => {
                if (action.id === 'publish-assignment') {
                  onCreateAssignment();
                  return;
                }
                router.push(action.actionUrl);
              }}
              className="rounded-lg border border-[#E8E6DD] bg-white px-3 py-2 hover:border-[#1C4D3A] hover:bg-[#F7F6F1]"
            >
              <p className="text-sm font-medium text-[#2D3330]">{action.title}</p>
              <p className="text-xs text-[#6B6760]">{action.description}</p>
            </button>
          ))}
        </div>

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
