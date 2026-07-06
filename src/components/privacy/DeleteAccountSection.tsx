'use client';

/**
 * DeleteAccountSection Component
 *
 * Handles immediate and irreversible account deletion.
 */

import { useState } from 'react';
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
import { Trash2, AlertTriangle, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientDiagnostic, dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

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

const CONFIRMATION_PHRASE = 'DELETE MY ACCOUNT';
const ACCOUNT_DELETION_FAILED_MESSAGE =
  'Account deletion could not finish. Check your password and confirmation phrase, then try again.';

function getResponseStatus(response: Response) {
  return typeof response.status === 'number' ? response.status : 'unknown';
}

function hasReturnedMessage(payload: unknown) {
  return Boolean(
    payload &&
      typeof payload === 'object' &&
      'message' in payload &&
      typeof payload.message === 'string' &&
      payload.message.trim().length > 0
  );
}

export function DeleteAccountSection() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [deletionReason, setDeletionReason] = useState<string>('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const router = useRouter();

  const resetDeleteDialog = () => {
    setPassword('');
    setConfirmText('');
    setDeletionReason('');
    setDeleteError(null);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (deleting) return;

    setShowDeleteDialog(open);
    if (!open) {
      resetDeleteDialog();
    }
  };

  const openDeleteDialog = () => {
    handleDialogOpenChange(true);
  };

  const handleDeleteRequest = async () => {
    setDeleteError(null);

    if (confirmText !== CONFIRMATION_PHRASE) {
      setDeleteError(`Type "${CONFIRMATION_PHRASE}" to confirm permanent deletion.`);
      return;
    }

    if (!password.trim()) {
      setDeleteError('Enter your password to confirm permanent deletion.');
      return;
    }

    try {
      setDeleting(true);

      const response = await apiFetch('/api/user/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          confirmPhrase: CONFIRMATION_PHRASE,
          reason: deletionReason || undefined,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        dispatchClientDiagnostic('privacy.delete_account.request_returned_error', {
          status: getResponseStatus(response),
          hasReturnedMessage: hasReturnedMessage(data),
          hasReason: Boolean(deletionReason),
        });
        throw new Error('account_deletion_request_failed');
      }

      resetDeleteDialog();
      setShowDeleteDialog(false);
      router.push('/');
      router.refresh();
    } catch (error) {
      dispatchClientErrorDiagnostic('privacy.delete_account.request_failed', error);
      setDeleteError(ACCOUNT_DELETION_FAILED_MESSAGE);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Account
          </CardTitle>
          <CardDescription>Permanently delete your account and associated data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">This action is immediate and cannot be undone</p>
              <p className="text-sm">
                Deleting your account permanently removes account access and triggers deletion or
                anonymization of related data under our retention policy.
              </p>
            </AlertDescription>
          </Alert>

          <div className="rounded-lg border bg-muted/50 p-4 space-y-2 text-sm">
            <p className="font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              What happens when you delete your account:
            </p>
            <ul className="space-y-1 ml-6 text-muted-foreground">
              <li>• Your account is disabled immediately</li>
              <li>• You are signed out and cannot restore the account</li>
              <li>• Linked profile and assignment-review data is deleted or anonymized</li>
              <li>• You can create a new account later, but deleted data is not recoverable</li>
            </ul>
          </div>

          <div className="pt-4">
            <Button variant="destructive" onClick={openDeleteDialog} className="w-full">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account Now
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={handleDialogOpenChange}>
        <AlertDialogContent className="max-h-[min(92vh,720px)] max-w-md overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirm Permanent Deletion
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>This will permanently delete your account right away.</p>
                <p>
                  If deletion cannot finish, this dialog stays open so you can correct the problem
                  without re-entering everything.
                </p>

                <div className="space-y-3">
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
                    <Label htmlFor="deletion-password">Password</Label>
                    <Input
                      id="deletion-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="mt-1"
                      aria-describedby="deletion-password-help"
                    />
                    <p id="deletion-password-help" className="mt-1 text-xs text-muted-foreground">
                      Required so account deletion cannot be triggered from an unattended session.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="confirm-text">
                      Type{' '}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {CONFIRMATION_PHRASE}
                      </code>{' '}
                      to confirm
                    </Label>
                    <Input
                      id="confirm-text"
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                      placeholder={CONFIRMATION_PHRASE}
                      className="mt-1"
                      aria-describedby="confirm-text-help"
                    />
                    <p id="confirm-text-help" className="mt-1 text-xs text-muted-foreground">
                      The delete button stays disabled until the phrase matches exactly.
                    </p>
                  </div>
                </div>

                {deleteError && (
                  <Alert
                    id="delete-account-error"
                    role="alert"
                    variant="destructive"
                    className="text-left"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{deleteError}</AlertDescription>
                  </Alert>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={deleting} className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteRequest();
              }}
              disabled={deleting || confirmText !== CONFIRMATION_PHRASE || !password}
              aria-describedby={deleteError ? 'delete-account-error' : undefined}
              className="w-full bg-destructive hover:bg-destructive/90 sm:w-auto"
            >
              {deleting ? 'Deleting account...' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
