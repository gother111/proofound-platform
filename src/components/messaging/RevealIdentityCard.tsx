'use client';

/**
 * RevealIdentityCard Component
 *
 * UI for requesting identity reveal in masked conversations.
 *
 * Reference: DATA_SECURITY_PRIVACY_ARCHITECTURE.md Section 10.4
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Eye, EyeOff, Clock, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConsentExplainer } from '@/components/workflow/ConsentExplainer';

interface RevealIdentityCardProps {
  currentUserWantsReveal: boolean;
  otherUserWantsReveal: boolean;
  onReveal: () => Promise<any>;
}

export function RevealIdentityCard({
  currentUserWantsReveal,
  otherUserWantsReveal,
  onReveal,
}: RevealIdentityCardProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const { toast } = useToast();

  const handleRevealClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmReveal = async () => {
    setShowConfirmDialog(false);
    setRevealing(true);

    try {
      const result = await onReveal();

      if (result.revealed) {
        // Both agreed - identities revealed
        toast({
          title: 'Identity reveal approved',
          description:
            'Approved identity fields are now visible. Direct contact details still stay inside the workflow until the right stage.',
          duration: 5000,
        });
      } else {
        toast({
          title: 'Reveal request sent',
          description:
            'The other person will be notified. Approved identity fields stay hidden until they agree.',
          duration: 5000,
        });
      }
    } catch (err) {
      toast({
        title: 'Reveal request failed',
        description: err instanceof Error ? err.message : 'Failed to request reveal',
        variant: 'destructive',
      });
    } finally {
      setRevealing(false);
    }
  };

  // State 1: Neither requested
  if (!currentUserWantsReveal && !otherUserWantsReveal) {
    return (
      <>
        <Card variant="bento" className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <EyeOff className="h-5 w-5" />
              Masked review thread
            </CardTitle>
            <CardDescription>
              Identity-bearing fields are currently hidden. You can keep talking in the masked
              thread, or request the next reveal step.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ConsentExplainer
              nowVisible={[
                'Name',
                'Allowed avatar or photo',
                'Public Page link if it is published and permitted',
                'Permitted organization or school names',
              ]}
              hiddenUntilLater={[
                'Direct contact details',
                'Scheduling links and meeting logistics',
                'Any identity-bearing details that are still outside the approved reveal scope',
              ]}
              whyThisRequestExists="Reveal exists to move this workflow from masked review into approved identity-bearing coordination. Approval is required before that handoff happens."
            />

            <Button onClick={handleRevealClick} className="w-full" disabled={revealing}>
              <Eye className="mr-2 h-4 w-4" />
              Request Identity Reveal
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Both people must agree before approved identity fields are shown
            </p>
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Request Identity Reveal?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>This asks the other person to approve identity-bearing reveal.</p>
                  <p>
                    If they agree, both of you can see the allowed identity fields now, while direct
                    contact details still stay hidden until interview coordination requires them.
                  </p>
                  <p className="font-semibold text-foreground">
                    Blind review remains in place until the other person approves this request.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmReveal}>Confirm & Request</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // State 2: Current user requested, waiting for other
  if (currentUserWantsReveal && !otherUserWantsReveal) {
    return (
      <Card variant="bento" className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-amber-900 dark:text-amber-100">
            <Clock className="h-5 w-5" />
            Reveal request pending
          </CardTitle>
          <CardDescription className="text-amber-800 dark:text-amber-200">
            You've requested the reveal step. The other person can approve the stage-scoped identity
            fields or keep the thread masked.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-100">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>Approved identity fields become visible only when the other person agrees</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // State 3: Other user requested, current user hasn't
  if (!currentUserWantsReveal && otherUserWantsReveal) {
    return (
      <>
        <Card variant="bento" className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-blue-900 dark:text-blue-100">
              <Eye className="h-5 w-5" />
              Reveal approval requested
            </CardTitle>
            <CardDescription className="text-blue-800 dark:text-blue-200">
              The other person has requested identity reveal. If you agree, both sides can see the
              approved identity fields for this workflow stage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ConsentExplainer
              nowVisible={[
                'Name',
                'Allowed avatar or photo',
                'Public Page link if it is published and permitted',
                'Permitted organization or school names',
              ]}
              hiddenUntilLater={[
                'Direct contact details',
                'Scheduling links and meeting logistics',
                'Any identity-bearing details that still require interview coordination',
              ]}
              whyThisRequestExists="The other side wants to move this workflow beyond masked review. They cannot see identity-bearing details unless you approve this reveal step."
            />

            <Button onClick={handleRevealClick} className="w-full" disabled={revealing}>
              <Eye className="mr-2 h-4 w-4" />
              Agree To Reveal Approved Fields
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              You can keep the thread masked if you prefer
            </p>
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reveal Approved Identity Fields?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    By agreeing, both of you will be able to see the approved identity-bearing
                    fields now, including names and other permitted public information.
                  </p>
                  <p>
                    Direct contact details and scheduling logistics still stay hidden until
                    interview coordination requires them.
                  </p>
                  <p className="font-semibold text-foreground">
                    Public Page publication does not widen this reveal by itself.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Not Now</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmReveal}>
                Reveal Approved Fields
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // State 4: Both agreed (should not reach here, parent handles transition)
  return null;
}
