'use client';

/**
 * DeleteAccountSection Component
 *
 * Handles account deletion request with 30-day grace period.
 * GDPR Article 17 (Right to Erasure) compliance.
 *
 * Reference: DATA_SECURITY_PRIVACY_ARCHITECTURE.md Section 13.4 & 16
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, AlertTriangle, Shield, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/fetch';
import { toast } from 'sonner';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase/client';

const DELETION_REASONS = [
  'No longer need the service',
  'Privacy concerns',
  'Found a better alternative',
  'Too many emails/notifications',
  'Difficult to use',
  'Not enough matches',
  'Account security concern',
  'Other',
] as const;

const CONFIRM_PHRASE = 'DELETE MY ACCOUNT';

type AccountStatusResponse = {
  accountStatus: 'active' | 'deletion_scheduled' | 'deleted';
  deletionRequestedAt: string | null;
  deletionScheduledFor: string | null;
  daysRemaining: number | null;
  canCancelDeletion: boolean;
};

export function DeleteAccountSection() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<AccountStatusResponse | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [deletionReason, setDeletionReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const fetchAccountStatus = async () => {
    try {
      const response = await apiFetch('/api/user/account');
      if (!response.ok) {
        throw new Error('Failed to fetch account status');
      }
      const data = (await response.json()) as AccountStatusResponse;
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch account status:', error);
      toast.error('Failed to load account status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScheduleDeletion = async () => {
    if (confirmText.trim() !== CONFIRM_PHRASE) {
      toast.error(`Please type "${CONFIRM_PHRASE}" to confirm`);
      return;
    }

    if (!password.trim()) {
      toast.error('Password is required to confirm deletion');
      return;
    }

    try {
      setSubmitting(true);

      const response = await apiFetch('/api/user/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          confirmPhrase: confirmText.trim(),
          reason: deletionReason || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to request deletion');
      }

      const data = await response.json();

      toast.success('Account deletion scheduled', {
        description: `Scheduled for ${new Date(data.deletionScheduledFor).toLocaleDateString()}. You have 30 days to cancel.`,
      });

      // Sign out immediately (grace-period flow)
      try {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error('Sign out after scheduling deletion failed:', signOutError);
      }

      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Deletion request failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to request account deletion');
    } finally {
      setSubmitting(false);
      setShowDeleteDialog(false);
      setPassword('');
      setConfirmText('');
      setDeletionReason('');
    }
  };

  return (
    <>
      <div id="delete-account">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Account
            </CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading account status...</div>
            ) : status?.accountStatus === 'deleted' ? (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-1">Account deleted</p>
                  <p className="text-sm">Your account has been deleted and cannot be recovered.</p>
                </AlertDescription>
              </Alert>
            ) : status?.accountStatus === 'deletion_scheduled' ? (
              <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-1">Account deletion scheduled</p>
                  <p className="text-sm">
                    Scheduled for{' '}
                    <strong>
                      {status.deletionScheduledFor
                        ? new Date(status.deletionScheduledFor).toLocaleDateString()
                        : 'unknown'}
                    </strong>
                    {typeof status.daysRemaining === 'number'
                      ? ` (${status.daysRemaining} days remaining).`
                      : '.'}
                  </p>
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!status.canCancelDeletion || submitting}
                      onClick={async () => {
                        try {
                          setSubmitting(true);
                          const res = await apiFetch('/api/user/account/cancel-deletion', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                          });
                          const payload = await res.json();
                          if (!res.ok) {
                            throw new Error(payload?.message || 'Failed to cancel deletion');
                          }
                          toast.success('Account deletion cancelled');
                          await fetchAccountStatus();
                        } catch (err) {
                          toast.error(
                            err instanceof Error ? err.message : 'Failed to cancel deletion'
                          );
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                    >
                      Cancel deletion
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-semibold mb-2">This action cannot be undone after 30 days</p>
                    <p className="text-sm">
                      Deleting your account will remove all your data including profile, skills,
                      projects, messages, and verification history. You will have a 30-day grace
                      period to cancel the deletion.
                    </p>
                  </AlertDescription>
                </Alert>

                <div className="rounded-lg border bg-muted/50 p-4 space-y-2 text-sm">
                  <p className="font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    What happens when you delete your account:
                  </p>
                  <ul className="space-y-1 ml-6 text-muted-foreground">
                    <li>
                      • <strong>Day 0:</strong> Account marked for deletion, you're logged out
                    </li>
                    <li>
                      • <strong>Day 0-30:</strong> Grace period - you can cancel deletion by logging
                      in
                    </li>
                    <li>
                      • <strong>Day 30:</strong> Account and all data permanently deleted
                    </li>
                    <li>
                      • <strong>Email:</strong> You'll receive a reminder 7 days before deletion
                    </li>
                  </ul>
                </div>

                <div className="space-y-3 pt-2">
                  <p className="text-sm font-semibold">Data that will be deleted:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded border p-2">
                      <p className="font-semibold">✓ Profile Data</p>
                      <p className="text-xs text-muted-foreground">Name, email, avatar, bio</p>
                    </div>
                    <div className="rounded border p-2">
                      <p className="font-semibold">✓ Professional Data</p>
                      <p className="text-xs text-muted-foreground">Skills, projects, experience</p>
                    </div>
                    <div className="rounded border p-2">
                      <p className="font-semibold">✓ Messages</p>
                      <p className="text-xs text-muted-foreground">All conversation history</p>
                    </div>
                    <div className="rounded border p-2">
                      <p className="font-semibold">✓ Analytics</p>
                      <p className="text-xs text-muted-foreground">Activity logs and statistics</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    className="w-full"
                    disabled={loading || submitting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Request Account Deletion
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  This will start the account deletion process. You will have 30 days to change your
                  mind before permanent deletion.
                </p>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="deletion-password">Password (required)</Label>
                    <Input
                      id="deletion-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="deletion-reason">Reason for leaving (optional)</Label>
                    <Select value={deletionReason} onValueChange={setDeletionReason}>
                      <SelectTrigger id="deletion-reason">
                        <SelectValue placeholder="Select a reason..." />
                      </SelectTrigger>
                      <SelectContent>
                        {DELETION_REASONS.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="confirm-text">
                      Type{' '}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">{CONFIRM_PHRASE}</code>{' '}
                      to confirm
                    </Label>
                    <Input
                      id="confirm-text"
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder={CONFIRM_PHRASE}
                      className="mt-1"
                    />
                  </div>
                </div>

                <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
                  <AlertDescription className="text-xs">
                    <strong>Reminder:</strong> You can cancel deletion within 30 days by logging in.
                    We'll send you a reminder email 7 days before permanent deletion.
                  </AlertDescription>
                </Alert>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleScheduleDeletion}
              disabled={submitting || confirmText.trim() !== CONFIRM_PHRASE || !password.trim()}
              className="bg-destructive hover:bg-destructive/90"
            >
              {submitting ? 'Processing...' : 'Schedule Deletion'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
