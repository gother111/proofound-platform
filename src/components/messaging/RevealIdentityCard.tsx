'use client';

/**
 * RevealIdentityCard Component
 * 
 * UI for requesting identity reveal in masked conversations.
 * 
 * States:
 * 1. Neither requested: Show "Reveal my identity" button
 * 2. Current user requested: Show "Waiting for other person" state
 * 3. Other user requested: Show "They want to reveal" with button
 * 4. Both agreed: Transition to revealed (handled by parent)
 * 
 * Reference: DATA_SECURITY_PRIVACY_ARCHITECTURE.md Section 10.4
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Eye, EyeOff, Clock, CheckCircle2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
          title: '✅ Identities Revealed!',
          description: 'You can now see each other\'s full profiles and continue your conversation.',
          duration: 5000,
        });
      } else {
        // Request sent - waiting for other person
        toast({
          title: '⏳ Request Sent',
          description: 'The other person will be notified. You\'ll be able to see their profile when they agree.',
          duration: 5000,
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
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
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <EyeOff className="h-5 w-5" />
              Anonymous Conversation
            </CardTitle>
            <CardDescription>
              Your identities are currently hidden. You can continue talking anonymously,
              or both agree to reveal identities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Why reveal?</strong> Revealing identities allows you to:
                <ul className="mt-1 ml-4 list-disc space-y-1">
                  <li>See each other's full profiles</li>
                  <li>Share contact information safely</li>
                  <li>Connect on other platforms</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button onClick={handleRevealClick} className="w-full" disabled={revealing}>
              <Eye className="mr-2 h-4 w-4" />
              Reveal My Identity
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Both people must agree before identities are revealed
            </p>
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reveal Your Identity?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  This will request to reveal identities. If the other person agrees, you'll
                  both be able to see each other's full profiles.
                </p>
                <p className="text-sm font-semibold">
                  This action cannot be undone once both parties agree.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmReveal}>
                Confirm & Request
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // State 2: Current user requested, waiting for other
  if (currentUserWantsReveal && !otherUserWantsReveal) {
    return (
      <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-amber-900 dark:text-amber-100">
            <Clock className="h-5 w-5" />
            Waiting for Response
          </CardTitle>
          <CardDescription className="text-amber-800 dark:text-amber-200">
            You've requested to reveal identities. The other person will be notified and
            can choose to accept or continue anonymously.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-100">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>Your identity will be revealed when they agree</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // State 3: Other user requested, current user hasn't
  if (!currentUserWantsReveal && otherUserWantsReveal) {
    return (
      <>
        <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-blue-900 dark:text-blue-100">
              <Eye className="h-5 w-5" />
              Identity Reveal Requested
            </CardTitle>
            <CardDescription className="text-blue-800 dark:text-blue-200">
              The other person has requested to reveal identities. If you agree, you'll both
              be able to see each other's full profiles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                They won't see your information until you also agree to reveal.
              </AlertDescription>
            </Alert>

            <Button onClick={handleRevealClick} className="w-full" disabled={revealing}>
              <Eye className="mr-2 h-4 w-4" />
              Agree & Reveal Identities
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              You can continue the conversation anonymously if you prefer
            </p>
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reveal Identities?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  By agreeing, both of you will be able to see each other's full profiles,
                  including names, avatars, and other public information.
                </p>
                <p className="text-sm font-semibold">
                  This action cannot be undone.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Not Now</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmReveal}>
                Reveal Identities
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

