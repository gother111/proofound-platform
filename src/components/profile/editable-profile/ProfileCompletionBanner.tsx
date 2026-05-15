'use client';

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Compass } from 'lucide-react';
import { motion } from 'framer-motion';

export function ProfileCompletionBanner({ profileCompletion }: { profileCompletion: number }) {
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
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-['Crimson_Pro'] font-semibold text-proofound-charcoal dark:text-foreground">
                Keep building proof
              </h3>
              <span className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
                {profileCompletion}% readiness
              </span>
            </div>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground mb-4">
              Keep the first milestone anchored in real work. Add proof context, visibility choices,
              and optional trust signals before broad profile polish.
            </p>
            <Progress value={profileCompletion} className="h-2 mb-4" />
            <div className="flex items-center gap-2 text-xs text-proofound-charcoal/70 dark:text-muted-foreground">
              <Compass className="w-3 h-3" />
              <span>Start with one context-backed Proof Pack</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
