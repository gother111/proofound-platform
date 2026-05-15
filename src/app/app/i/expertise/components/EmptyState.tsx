'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Plus, BookOpen } from 'lucide-react';
import { getIndividualRecoveryActions } from '@/lib/ui/recovery-actions';

interface EmptyStateProps {
  onAddSkill: () => void;
}

export function EmptyState({ onAddSkill }: EmptyStateProps) {
  const router = useRouter();
  const remediationActions = getIndividualRecoveryActions('expertise-empty');

  return (
    <div className="min-h-[600px] flex items-center justify-center px-6 py-12">
      <Card className="max-w-2xl w-full border border-border bg-white/90 p-12 shadow-sm">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-proofound-forest/5 p-6">
              <Sparkles className="h-12 w-12 text-proofound-forest" />
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-semibold text-foreground mb-3 text-center">
            Your Expertise Atlas is empty
          </h2>

          {/* Description */}
          <p className="text-muted-foreground mb-8 max-w-lg text-center">
            Add your first 3 skills to unlock charts and matching. Choose from over 18,000 curated
            skills, attach proof, or create your own.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center items-center w-full">
            <Button
              size="lg"
              onClick={onAddSkill}
              className="flex items-center justify-center bg-proofound-forest text-white hover:bg-proofound-forest/90 w-full sm:w-auto"
            >
              <span className="flex items-center">
                <Plus className="mr-2 h-5 w-5" />
                Add manually
              </span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex items-center justify-center border-proofound-forest text-proofound-forest hover:bg-proofound-forest/5 w-full sm:w-auto"
            >
              <span className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                Learn how it works
              </span>
            </Button>
          </div>

          <div className="mt-8 w-full max-w-xl space-y-2 text-left">
            {remediationActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => {
                  if (action.id === 'add-proof' || action.id === 'add-skill') {
                    onAddSkill();
                    return;
                  }
                  router.push(action.actionUrl);
                }}
                className="w-full rounded-lg border border-proofound-stone bg-white px-3 py-2 hover:border-proofound-forest hover:bg-japandi-bg"
              >
                <p className="text-sm font-medium text-foreground">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </button>
            ))}
          </div>

          {/* Info Pills */}
          <div className="mt-8 flex flex-wrap gap-3 justify-center items-center text-xs text-proofound-forest">
            <span className="flex items-center gap-2 rounded-full bg-proofound-forest/5 px-4 py-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              18,000+ curated skills
            </span>
            <span className="flex items-center gap-2 rounded-full bg-proofound-forest/5 px-4 py-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              Attach proofs & verifications
            </span>
            <span className="flex items-center gap-2 rounded-full bg-proofound-forest/5 px-4 py-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Track recency & growth
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
