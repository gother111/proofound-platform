'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface DeleteAccountProps {
  userId: string;
}

interface AccountStatus {
  accountStatus: 'active' | 'deletion_scheduled' | 'deleted';
  deletionRequestedAt: string | null;
  deletionScheduledFor: string | null;
  daysRemaining: number | null;
  canCancelDeletion: boolean;
}

export function DeleteAccount({ userId }: DeleteAccountProps) {
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchAccountStatus();
  }, [userId]);

  const fetchAccountStatus = async () => {
    try {
      const response = await fetch('/api/user/account');
      if (!response.ok) {
        throw new Error('Failed to fetch account status');
      }
      const data = await response.json();
      setAccountStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load account status');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    if (!password) {
      setError('Password is required to confirm deletion');
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch('/api/user/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          reason: reason || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to schedule deletion');
      }

      setSuccess('Account deletion scheduled successfully');
      setShowConfirmDialog(false);
      await fetchAccountStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule deletion');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDeletion = async () => {
    setCancelling(true);
    setError(null);

    try {
      const response = await fetch('/api/user/account/cancel-deletion', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel deletion');
      }

      setSuccess('Account deletion cancelled successfully');
      await fetchAccountStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel deletion');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-proofound-forest" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show deletion scheduled banner
  if (accountStatus?.accountStatus === 'deletion_scheduled') {
    return (
      <div className="space-y-4">
        {success && (
          <Card className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <p className="text-sm text-green-800 dark:text-green-300">{success}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-amber-200 dark:border-amber-900 rounded-2xl">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-300" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl font-['Crimson_Pro'] text-amber-900 dark:text-amber-100">
                  Account Deletion Scheduled
                </CardTitle>
                <CardDescription className="mt-2 text-amber-800 dark:text-amber-200">
                  Your account will be permanently deleted on{' '}
                  <strong>{formatDate(accountStatus.deletionScheduledFor)}</strong>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-amber-200 dark:border-amber-900">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">Deletion Requested</p>
                    <p className="text-sm font-medium">{formatDate(accountStatus.deletionRequestedAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">Days Remaining</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {accountStatus.daysRemaining}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-proofound-charcoal dark:text-foreground">
                  What happens next:
                </p>
                <ul className="space-y-1 text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
                  <li>• You can cancel this request anytime within the next {accountStatus.daysRemaining} days</li>
                  <li>• You&apos;ll receive a reminder email 7 days before deletion</li>
                  <li>• After {formatDate(accountStatus.deletionScheduledFor)}, your account will be permanently anonymized</li>
                  <li>• All your PII will be removed/replaced with &quot;Deleted User&quot;</li>
                  <li>• Some data may be retained for 90 days for legal compliance</li>
                </ul>
              </div>

              {accountStatus.canCancelDeletion && (
                <Button
                  onClick={handleCancelDeletion}
                  disabled={cancelling}
                  className="w-full bg-proofound-forest hover:bg-proofound-forest/90"
                  size="lg"
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Cancel Deletion Request'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show deletion form for active accounts
  return (
    <div className="space-y-4">
      {error && (
        <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <p className="text-sm text-green-800 dark:text-green-300">{success}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-red-200 dark:border-red-900 rounded-2xl">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-300" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl font-['Crimson_Pro'] text-red-900 dark:text-red-100">
                Delete Your Account
              </CardTitle>
              <CardDescription className="mt-2 text-red-800 dark:text-red-200">
                This action will permanently delete all your data after a 30-day grace period
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg p-4">
              <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                What will be deleted:
              </p>
              <ul className="space-y-1 text-sm text-red-800 dark:text-red-200">
                <li>• Your profile and all personal information</li>
                <li>• All skills, capabilities, and evidence</li>
                <li>• Projects, experiences, and impact stories</li>
                <li>• Match history and conversations</li>
                <li>• All analytics events</li>
              </ul>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
                Grace period:
              </p>
              <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
                <li>• You have 30 days to cancel this request</li>
                <li>• You&apos;ll receive reminder emails before deletion</li>
                <li>• After 30 days, deletion is permanent and cannot be undone</li>
              </ul>
            </div>

            <Button
              onClick={() => setShowConfirmDialog(true)}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              Delete My Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-['Crimson_Pro'] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Confirm Account Deletion
            </DialogTitle>
            <DialogDescription className="text-base">
              This action will schedule your account for permanent deletion in 30 days.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">Enter your password to confirm</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for leaving (optional)</Label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Help us improve by sharing why you're leaving..."
                className="flex min-h-[100px] w-full rounded-lg border border-proofound-stone dark:border-border bg-white dark:bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest"
                maxLength={500}
              />
              <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">
                {reason.length}/500 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Type &quot;DELETE&quot; to confirm</Label>
              <Input
                id="confirm"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="DELETE"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setPassword('');
                setReason('');
                setConfirmText('');
                setError(null);
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRequest}
              disabled={deleting || confirmText !== 'DELETE' || !password}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Delete Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

