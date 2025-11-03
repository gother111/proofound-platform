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
              Welcome to Zen Hub
            </h3>
            <p className="text-sm text-proofound-charcoal/80 dark:text-muted-foreground mb-4">
              Zen Hub is your private well-being center. Your check-ins and reflections are
              <strong> completely private</strong> and will{' '}
              <strong>never be used for matching, ranking, or recommendations</strong>. This space
              is for you alone.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleOptIn}
                disabled={isLoading}
                className="bg-[#7A9278] hover:bg-[#7A9278]/90 text-white"
              >
                {isLoading ? 'Enabling...' : 'Enable Zen Hub'}
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
              Zen Hub Privacy & Purpose
            </DialogTitle>
            <DialogDescription>How Zen Hub protects your well-being data</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-sm">
            <div>
              <h4 className="font-semibold text-proofound-charcoal dark:text-foreground mb-2">
                What is Zen Hub?
              </h4>
              <p className="text-proofound-charcoal/80 dark:text-muted-foreground">
                Zen Hub is a well-being center designed to help you navigate the emotional ups and
                downs of your career journey. It provides evidence-based practices, check-in tools,
                and reflection spaces to support your mental health during transitions.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-proofound-charcoal dark:text-foreground mb-2">
                Complete Privacy Guarantee
              </h4>
              <ul className="list-disc list-inside space-y-2 text-proofound-charcoal/80 dark:text-muted-foreground">
                <li>
                  <strong>Never used for matching:</strong> Your well-being data will never affect
                  which opportunities you see or how you&apos;re ranked
                </li>
                <li>
                  <strong>Never shared:</strong> No organizations, recruiters, or other users can
                  access your check-ins or reflections
                </li>
                <li>
                  <strong>Private by default:</strong> All Zen Hub data is isolated from your
                  professional profile
                </li>
                <li>
                  <strong>You control your data:</strong> You can export or delete all your
                  well-being data at any time
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-proofound-charcoal dark:text-foreground mb-2">
                What We Track
              </h4>
              <p className="text-proofound-charcoal/80 dark:text-muted-foreground mb-2">
                When you opt in, you can:
              </p>
              <ul className="list-disc list-inside space-y-1 text-proofound-charcoal/80 dark:text-muted-foreground">
                <li>Log check-ins (stress level and sense of control) - optional, 1-5 scale</li>
                <li>Write reflections linked to career milestones - optional, private journal</li>
                <li>View your well-being trends over time - 14 and 30-day comparisons</li>
                <li>Access evidence-based practices and resources</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-proofound-charcoal dark:text-foreground mb-2">
                Non-Diagnostic Tool
              </h4>
              <p className="text-proofound-charcoal/80 dark:text-muted-foreground">
                Zen Hub is <strong>not a clinical mental health tool</strong> and does not provide
                diagnoses or treatment. It&apos;s a self-reflection and wellness resource. If
                you&apos;re experiencing mental health challenges, please consult a licensed
                professional.
              </p>
            </div>

            <div className="bg-[#7A9278]/10 p-4 rounded-lg border border-[#7A9278]/20">
              <p className="text-sm text-proofound-charcoal/90 dark:text-foreground">
                <strong>Your choice:</strong> Zen Hub is completely optional. You can opt out at any
                time from your settings, and your professional profile and matching experience will
                not be affected.
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
              {isLoading ? 'Enabling...' : 'Enable Zen Hub'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
