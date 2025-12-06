'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Copy, Mail, Send } from 'lucide-react';

type ReferProfessionalModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
  assignmentTitle?: string;
  onCreated?: (referral: any) => void;
};

/**
 * Modal for referring a professional to a specific assignment.
 * Keeps things simple: store email + message, then provide a shareable link.
 */
export function ReferProfessionalModal({
  open,
  onOpenChange,
  assignmentId,
  assignmentTitle,
  onCreated,
}: ReferProfessionalModalProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setEmail('');
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralType: 'assignment',
          assignmentId,
          referredEmail: email || undefined,
          message: message || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Unable to create referral right now.');
      }

      const data = await response.json();
      setReferralLink(data.referralLink);
      onCreated?.(data.referral);

      toast({
        title: 'Referral ready',
        description: 'Copy the link or share it directly.',
      });

      resetForm();
    } catch (error) {
      toast({
        title: 'Could not create referral',
        description: error instanceof Error ? error.message : 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    toast({ title: 'Link copied', description: 'Share it with your referral.' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Refer a professional</DialogTitle>
          <DialogDescription>
            Invite someone you trust to{' '}
            {assignmentTitle ? `“${assignmentTitle}”` : 'this assignment'}. No email is sent
            automatically—copy the link or send it yourself.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="referral-email">Their email (optional)</Label>
            <Input
              id="referral-email"
              placeholder="name@email.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              We store it for tracking; you choose how to send the invite.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referral-message">Personal message</Label>
            <Textarea
              id="referral-message"
              placeholder="Add context, why this role is a fit, etc."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {referralLink && (
            <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Shareable link</Badge>
                <Button type="button" variant="ghost" size="sm" onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
              <p className="text-sm break-all">{referralLink}</p>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                'Sending...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Create referral
                </>
              )}
            </Button>
          </DialogFooter>
        </form>

        <div className="flex items-start gap-2 rounded-md bg-muted/60 p-3 text-sm">
          <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <p className="text-muted-foreground">
            We’re using shareable links first. If you prefer an automatic email send later, we can
            wire it up without changing this flow.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
