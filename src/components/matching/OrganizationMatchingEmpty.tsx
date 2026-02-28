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
    <div className="flex items-center justify-center min-h-[60vh] px-4 md:px-0">
      <Card
        variant="glass"
        className="relative max-w-2xl w-full p-8 md:p-12 text-center overflow-hidden"
      >
        {/* Decorative background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-proofound-parchment/60 via-transparent to-transparent pointer-events-none" />

        {/* Icon */}
        <div className="relative z-10 flex justify-center mb-8">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-white/60 shadow-sm border border-white/80 backdrop-blur-md transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <Users className="w-10 h-10 text-proofound-forest" strokeWidth={1.5} />
          </div>
        </div>

        {/* Heading */}
        <div className="relative z-10 space-y-3 mb-8">
          <h2 className="text-3xl font-semibold text-proofound-charcoal font-display tracking-tight">
            Find Perfect-Fit Contributors
          </h2>
          {/* Description */}
          <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Create your first assignment to match with skilled individuals who align with your
            mission and values. Blind-first matching removes bias from your hiring—candidates remain
            anonymous until there&apos;s mutual interest.
          </p>
        </div>

        {/* CTA */}
        <div className="relative z-10 flex flex-col items-center gap-3">
          <Button
            size="lg"
            onClick={onCreateAssignment}
            className="bg-proofound-forest text-white hover:bg-proofound-forest/90 shadow-md"
          >
            Create Your First Assignment
          </Button>
          {/* Secondary info */}
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Define skills, values, and impact areas • High-quality candidates
          </p>
        </div>

        <div className="relative z-10 mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
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
              className="group flex flex-col p-5 rounded-xl border border-proofound-stone/40 bg-white/40 backdrop-blur-md hover:bg-white border-b-4 hover:border-b-proofound-forest/40 transition-all duration-300"
            >
              <h3 className="text-sm font-semibold text-proofound-charcoal mb-2 group-hover:text-proofound-forest transition-colors">
                {action.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{action.description}</p>
            </button>
          ))}
        </div>

        {/* Subtle background decoration */}
        <div className="mt-10 flex justify-center gap-3 opacity-30 pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-proofound-sage" />
          <div className="w-2 h-2 rounded-full bg-proofound-ochre" />
          <div className="w-2 h-2 rounded-full bg-proofound-sage" />
        </div>
      </Card>
    </div>
  );
}
