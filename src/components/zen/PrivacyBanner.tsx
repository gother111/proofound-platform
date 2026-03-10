'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Shield, X } from 'lucide-react';

interface PrivacyBannerProps {
  onOptIn: () => Promise<void>;
  onDismiss?: () => void;
}

export function PrivacyBanner({ onOptIn, onDismiss }: PrivacyBannerProps) {
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleOptIn = async () => {
    setIsLoading(true);
    try {
      await onOptIn();
    } catch (error) {
      console.error('Failed to opt in:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="border-2 border-[#7A9278] bg-[#7A9278]/5 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <Shield className="w-8 h-8 text-[#7A9278]" />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-proofound-charcoal dark:text-foreground mb-2">
              Private check-ins stay optional
            </h3>
            <p className="text-sm text-proofound-charcoal/80 dark:text-muted-foreground mb-4">
              Private check-ins are an optional space for brief check-ins and milestone reflections.
              Your entries stay <strong>private to you</strong> and
              <strong>
                {' '}
                never affect matching, ranking, reveal, fairness review, or org analytics
              </strong>
              .
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleOptIn}
                disabled={isLoading}
                className="bg-[#7A9278] hover:bg-[#7A9278]/90 text-white"
              >
                {isLoading ? 'Enabling...' : 'Enable private check-ins'}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowLearnMore(true)}
                className="border-[#7A9278] text-[#7A9278] hover:bg-[#7A9278]/10"
              >
                Learn More
              </Button>

              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="ml-auto text-proofound-charcoal/60"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Learn More Dialog */}
      <Dialog open={showLearnMore} onOpenChange={setShowLearnMore}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#7A9278]" />
              Private check-ins privacy boundary
            </DialogTitle>
            <DialogDescription>
              How private check-ins stay narrow, private, and optional
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-sm">
            <div>
              <h4 className="font-semibold text-proofound-charcoal dark:text-foreground mb-2">
                What are private check-ins?
              </h4>
              <p className="text-proofound-charcoal/80 dark:text-muted-foreground">
                This is a minimal private support surface for volatile work-search moments. In MVP
                it includes only opt-in check-ins, milestone reflections, export, and deletion.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-proofound-charcoal dark:text-foreground mb-2">
                Complete Privacy Guarantee
              </h4>
              <ul className="list-disc list-inside space-y-2 text-proofound-charcoal/80 dark:text-muted-foreground">
                <li>
                  <strong>Never used for matching:</strong> Your well-being data will never affect
                  which introductions you see or how you&apos;re ranked
                </li>
                <li>
                  <strong>Never shared with organizations:</strong> Recruiters, hiring teams, and
                  other users cannot access your check-ins or reflections
                </li>
                <li>
                  <strong>Isolated from analytics:</strong> Reflection text is never sent in
                  analytics payloads, and Zen data is excluded from fairness review and org
                  analytics
                </li>
                <li>
                  <strong>You control your data:</strong> You can export or delete all private
                  check-in data at any time
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-proofound-charcoal dark:text-foreground mb-2">
                What stays in scope
              </h4>
              <ul className="list-disc list-inside space-y-1 text-proofound-charcoal/80 dark:text-muted-foreground">
                <li>Record optional check-ins using private 1-5 stress and control scales</li>
                <li>
                  Write optional reflections linked to milestone tags such as rejection or offer
                </li>
                <li>Export your own records as JSON or check-in CSV</li>
                <li>
                  Delete all private check-in data without affecting your portfolio or matching
                  state
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-proofound-charcoal dark:text-foreground mb-2">
                What this is not
              </h4>
              <p className="text-proofound-charcoal/80 dark:text-muted-foreground">
                This is <strong>not</strong> a wellness feed, self-assessment center, burnout
                tracker, local resource directory, or diagnostic tool. It is intentionally narrow so
                it remains calm, private, and optional.
              </p>
            </div>

            <div className="bg-[#7A9278]/10 p-4 rounded-lg border border-[#7A9278]/20">
              <p className="text-sm text-proofound-charcoal/90 dark:text-foreground">
                <strong>Your choice:</strong> Private check-ins are completely optional. You can opt
                out at any time, and your professional profile and matching experience will not be
                affected.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLearnMore(false)}>
              Close
            </Button>
            <Button
              onClick={async () => {
                setShowLearnMore(false);
                await handleOptIn();
              }}
              disabled={isLoading}
              className="bg-[#7A9278] hover:bg-[#7A9278]/90 text-white"
            >
              {isLoading ? 'Enabling...' : 'Enable private check-ins'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
