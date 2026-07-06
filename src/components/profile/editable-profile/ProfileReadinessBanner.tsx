'use client';

import { CheckCircle2, Circle, Compass, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

import { Card } from '@/components/ui/card';
import type { IndividualProfileCompletionState } from '@/lib/profile/completion-flow';

export function ProfileReadinessBanner({
  completionState,
}: {
  completionState: IndividualProfileCompletionState;
}) {
  const checklist = [
    {
      label: 'First proof record created',
      met: completionState.checks.hasFirstProof && completionState.checks.hasStructuredProofPack,
    },
    {
      label: 'Public Page ready',
      met: completionState.isPortfolioReady,
    },
    {
      label: 'Matching preferences saved',
      met:
        completionState.checks.hasTargetRoleFocus &&
        completionState.checks.hasWorkPreference &&
        completionState.checks.hasEngagementPreference,
    },
    {
      label: 'Non-self verification added',
      met: completionState.checks.hasRequiredVerification,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
    >
      <Card className="p-6 border-2 border-proofound-forest/30 dark:border-border rounded-2xl bg-gradient-to-br from-proofound-forest/5 via-background to-brand-teal/5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-proofound-forest/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-proofound-forest dark:text-primary" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-lg font-['Crimson_Pro'] font-semibold text-proofound-charcoal dark:text-foreground">
                Keep building proof readiness
              </h3>
              <p className="mt-2 text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
                Keep the first milestone anchored in real work. Add proof context, visibility
                choices, and optional trust signals before broad profile polish.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {checklist.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 text-xs text-proofound-charcoal/70 dark:text-muted-foreground"
                >
                  {item.met ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-proofound-forest" />
                  ) : (
                    <Circle className="h-3.5 w-3.5" />
                  )}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-proofound-charcoal/70 dark:text-muted-foreground">
              <Compass className="w-3 h-3" />
              <span>Start with one context-backed proof record</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
