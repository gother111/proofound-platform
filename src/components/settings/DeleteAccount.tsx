'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { AlertTriangle, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

interface DeleteAccountProps {
  userId: string;
}

interface AccountStatus {
  accountStatus: 'active' | 'deleted';
  deletionRequestedAt: string | null;
}

export function DeleteAccount({ userId }: DeleteAccountProps) {
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchAccountStatus();
  }, [userId]);

  const fetchAccountStatus = async () => {
    try {
      const response = await apiFetch('/api/user/account');
      if (!response.ok) {
        throw new Error('Failed to fetch account status');
      }
      const data = await response.json();
      setAccountStatus(data);
    } catch (err) {
      dispatchClientErrorDiagnostic('settings.delete_account.status_load_failed', err);
      setError(err instanceof Error ? err.message : 'Failed to load account status');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (confirmText !== 'DELETE MY ACCOUNT') {
      setError('Please type DELETE MY ACCOUNT to confirm');
      return;
    }

    if (!password) {
      setError('Password is required to confirm deletion');
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await apiFetch('/api/user/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          confirmPhrase: confirmText,
          reason: reason || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete account');
      }

      setSuccess('Your account has been deleted permanently.');
      setShowConfirmDialog(false);
      await fetchAccountStatus();
    } catch (err) {
      dispatchClientErrorDiagnostic('settings.delete_account.request_failed', err);
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Card variant="bento" className="border-proofound-stone dark:border-border rounded-2xl">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-proofound-forest" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show deleted state
  if (accountStatus?.accountStatus === 'deleted') {
    return (
      <Card
        variant="bento"
        className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 rounded-2xl"
      >
        <CardHeader>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            <div>
              <CardTitle className="text-xl font-['Crimson_Pro'] text-green-900 dark:text-green-100">
                Account Deleted
              </CardTitle>
              <CardDescription className="mt-2 text-green-800 dark:text-green-300">
                Your account and personal data have been deleted. You can close this window.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  // Show deletion form for active accounts
  return (
    <div className="space-y-4">
      {error && !showConfirmDialog && (
        <Card
          variant="bento"
          className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 rounded-2xl"
          role="alert"
          aria-live="assertive"
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card
          variant="bento"
          className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 rounded-2xl"
          role="status"
          aria-live="polite"
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <p className="text-sm text-green-800 dark:text-green-300">{success}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card variant="bento" className="border-red-200 dark:border-red-900 rounded-2xl">
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
                Permanently delete your account and data immediately. This action cannot be undone.
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
              This will delete your account and personal data right now. This cannot be undone.
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
              <Label htmlFor="confirm">Type &quot;DELETE MY ACCOUNT&quot; to confirm</Label>
              <Input
                id="confirm"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="DELETE MY ACCOUNT"
              />
            </div>

            {error && (
              <p
                id="settings-delete-account-error"
                className="text-sm text-red-600 dark:text-red-400"
                role="alert"
                aria-live="assertive"
              >
                {error}
              </p>
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
              disabled={deleting || confirmText !== 'DELETE MY ACCOUNT' || !password}
              aria-describedby={error ? 'settings-delete-account-error' : undefined}
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
