'use client';

import { ArrowRight, Briefcase, ShieldCheck, Users } from 'lucide-react';
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
  const launchSteps = [
    {
      label: 'Trust profile',
      detail: 'Basics make the review corridor credible',
      icon: ShieldCheck,
    },
    {
      label: 'Assignment',
      detail: 'Define one role with clear proof requirements',
      icon: Briefcase,
    },
    {
      label: 'Proof-submission signals',
      detail: 'Review starts after the corridor is ready',
      icon: ArrowRight,
    },
  ] as const;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 md:px-0">
      <Card variant="bento" className="w-full max-w-3xl overflow-hidden p-6 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <div className="space-y-6 text-left">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-proofound-stone/70 bg-white shadow-sm">
              <Users className="w-10 h-10 text-proofound-forest" strokeWidth={1.5} />
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-3xl font-semibold tracking-tight text-proofound-charcoal">
                Open matching with one clear assignment
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                Start with the role context reviewers need: skills, constraints, and proof
                expectations. Identity stays protected until the corridor is ready.
              </p>
            </div>

            <div className="flex max-w-sm flex-col items-start gap-2">
              <Button
                size="lg"
                onClick={onCreateAssignment}
                className="w-full bg-proofound-forest text-white shadow-sm hover:bg-proofound-forest/90 sm:w-auto"
              >
                Create first assignment
              </Button>
              <p className="text-xs font-medium text-muted-foreground">
                Matching stays quiet until trust and role context are ready.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-proofound-stone/70 bg-white/65 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-proofound-charcoal/60">
              Corridor sequence
            </p>
            <div className="space-y-3">
              {launchSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.label}
                    className="flex gap-3 rounded-xl bg-proofound-parchment/50 p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-proofound-forest">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-proofound-charcoal">{step.label}</p>
                      <p className="text-xs leading-5 text-muted-foreground">{step.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-3 text-left sm:grid-cols-2 lg:grid-cols-3">
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
              className="group flex min-h-32 flex-col rounded-xl border border-proofound-stone/70 bg-white/70 p-4 transition-colors hover:border-proofound-forest hover:bg-white"
            >
              <h3 className="mb-2 text-sm font-semibold text-proofound-charcoal transition-colors group-hover:text-proofound-forest">
                {action.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{action.description}</p>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
