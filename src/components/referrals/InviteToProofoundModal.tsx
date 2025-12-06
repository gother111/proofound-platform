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
import { Copy, Sparkles } from 'lucide-react';

type RecentInvite = {
  id: string;
  referredEmail?: string | null;
  status: string;
  referralLink?: string;
};

type InviteToProofoundModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (referral: any) => void;
  recentInvites?: RecentInvite[];
};

/**
 * Modal for generating a platform referral link.
 * Share via link first; outbound email can be added later.
 */
export function InviteToProofoundModal({
  open,
  onOpenChange,
  onCreated,
  recentInvites = [],
}: InviteToProofoundModalProps) {
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
          referralType: 'platform',
          referredEmail: email || undefined,
          message: message || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Unable to create invite right now.');
      }

      const data = await response.json();
      setReferralLink(data.referralLink);
      onCreated?.(data.referral);

      toast({
        title: 'Invite ready',
        description: 'Copy the link and share it however you like.',
      });

      resetForm();
    } catch (error) {
      toast({
        title: 'Could not create invite',
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
    toast({ title: 'Link copied', description: 'Share it in email, chat, or DM.' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite to Proofound</DialogTitle>
          <DialogDescription>
            Create a shareable link to invite someone to the platform. We’ll track it for you.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="invite-email">Their email (optional)</Label>
            <Input
              id="invite-email"
              placeholder="friend@email.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Optional, for your tracking. We won’t email them automatically.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-message">Personal note</Label>
            <Textarea
              id="invite-message"
              placeholder="Why should they join? What do you recommend they try first?"
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

          {recentInvites.length > 0 && (
            <div className="rounded-md border bg-muted/40 p-3 space-y-2">
              <p className="text-sm font-medium">Recent invites</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {recentInvites.slice(0, 3).map((invite) => (
                  <li key={invite.id} className="flex items-center justify-between gap-2">
                    <span>{invite.referredEmail || 'Shared via link'}</span>
                    <Badge variant="outline" className="capitalize">
                      {invite.status.replace('_', ' ')}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                'Creating...'
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate link
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
