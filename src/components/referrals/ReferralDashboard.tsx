'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { InviteToProofoundModal } from '@/components/referrals/InviteToProofoundModal';
import { Copy, Link as LinkIcon, RefreshCw, ShieldCheck, UserPlus } from 'lucide-react';

type ReferralStatus = 'pending' | 'signed_up' | 'hired' | 'expired';

type ReferralListItem = {
  id: string;
  referralType: 'platform' | 'assignment';
  referralCode: string;
  referralLink: string;
  referredEmail?: string | null;
  referredUserId?: string | null;
  status: ReferralStatus;
  assignmentRole?: string | null;
  assignmentOrgId?: string | null;
  message?: string | null;
  counterpartName?: string | null;
  createdAt?: string;
  expiresAt?: string | null;
};

type ReferralResponse = {
  sent: ReferralListItem[];
  received: ReferralListItem[];
};

function statusBadge(status: ReferralStatus) {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary">Pending</Badge>;
    case 'signed_up':
      return <Badge variant="default">Signed up</Badge>;
    case 'hired':
      return <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">Hired</Badge>;
    case 'expired':
    default:
      return <Badge variant="outline">Expired</Badge>;
  }
}

export function ReferralDashboard() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReferralResponse>({ sent: [], received: [] });
  const [acceptCode, setAcceptCode] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);

  const stats = useMemo(
    () => ({
      totalSent: data.sent.length,
      totalReceived: data.received.length,
      signups: data.sent.filter((r) => r.status === 'signed_up').length,
      pending: data.sent.filter((r) => r.status === 'pending').length,
    }),
    [data]
  );

  const fetchReferrals = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/referrals');
      if (!response.ok) throw new Error('Failed to load referrals');
      const json = await response.json();
      setData({ sent: json.sent || [], received: json.received || [] });
    } catch (error) {
      toast({
        title: 'Could not load referrals',
        description: error instanceof Error ? error.message : 'Please try again shortly.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const acceptReferral = useCallback(
    async (code: string, silent = false) => {
      if (!code) return;
      try {
        const response = await fetch('/api/referrals/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Referral code not valid');
        }

        if (!silent) {
          toast({
            title: 'Referral accepted',
            description: 'Thanks for confirming—we linked this referral to your account.',
          });
        }

        fetchReferrals();
      } catch (error) {
        toast({
          title: 'Could not accept referral',
          description: error instanceof Error ? error.message : 'Try again with a valid link.',
          variant: 'destructive',
        });
      }
    },
    [toast, fetchReferrals]
  );

  const handleCopy = async (link: string) => {
    await navigator.clipboard.writeText(link);
    toast({ title: 'Link copied', description: 'Share it via email or chat.' });
  };

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      acceptReferral(code, true);
    }
  }, [searchParams, acceptReferral]);

  return (
    <div className="space-y-6">
      <InviteToProofoundModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        recentInvites={data.sent.filter((r) => r.referralType === 'platform').slice(0, 3)}
        onCreated={fetchReferrals}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Referrals & Endorsements</h1>
          <p className="text-muted-foreground">
            Share proof-based invites that help the right people join assignments or the platform.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => fetchReferrals()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite to platform
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total invites sent</CardDescription>
            <CardTitle className="text-3xl">{stats.totalSent}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Signups from your links</CardDescription>
            <CardTitle className="text-3xl">{stats.signups}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending responses</CardDescription>
            <CardTitle className="text-3xl">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Referrals you received</CardDescription>
            <CardTitle className="text-3xl">{stats.totalReceived}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sent referrals</CardTitle>
          <CardDescription>Copy and share your links. Status updates in real time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-muted-foreground">Loading referrals...</p>}
          {!loading && data.sent.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No referrals yet. Invite a friend to get started.
            </p>
          )}
          {!loading &&
            data.sent.map((referral) => (
              <div
                key={referral.id}
                className="rounded-md border p-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {referral.referralType}
                    </Badge>
                    {statusBadge(referral.status)}
                  </div>
                  <p className="text-sm font-medium">
                    {referral.referredEmail || referral.counterpartName || 'Shareable link'}
                  </p>
                  {referral.assignmentRole && (
                    <p className="text-xs text-muted-foreground">
                      Assignment: {referral.assignmentRole}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground break-all">{referral.referralLink}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(referral.referralLink)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy link
                  </Button>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Referrals you received</CardTitle>
          <CardDescription>
            Accept codes from trusted colleagues to show attribution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Input
              placeholder="Paste referral code"
              value={acceptCode}
              onChange={(e) => setAcceptCode(e.target.value)}
              className="md:max-w-xs"
            />
            <Button onClick={() => acceptReferral(acceptCode)}>
              <ShieldCheck className="h-4 w-4 mr-2" />
              Accept code
            </Button>
          </div>

          <Separator />

          {loading && (
            <p className="text-sm text-muted-foreground">Loading received referrals...</p>
          )}
          {!loading && data.received.length === 0 && (
            <p className="text-sm text-muted-foreground">No received referrals yet.</p>
          )}

          {!loading &&
            data.received.map((referral) => (
              <div
                key={referral.id}
                className="rounded-md border p-3 flex flex-col gap-1 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {referral.referralType}
                    </Badge>
                    {statusBadge(referral.status)}
                  </div>
                  <p className="text-sm font-medium">
                    From: {referral.counterpartName || 'A referrer'}
                  </p>
                  {referral.assignmentRole && (
                    <p className="text-xs text-muted-foreground">
                      Assignment: {referral.assignmentRole}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground break-all">
                    Code: {referral.referralCode}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(referral.referralLink)}
                  >
                    <LinkIcon className="h-4 w-4 mr-1" />
                    Copy link
                  </Button>
                  {referral.status === 'pending' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => acceptReferral(referral.referralCode)}
                    >
                      Accept
                    </Button>
                  )}
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
