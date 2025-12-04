'use client';

/**
 * DeleteAccountSection Component
 * 
 * Handles account deletion request with 30-day grace period.
 * GDPR Article 17 (Right to Erasure) compliance.
 * 
 * Reference: DATA_SECURITY_PRIVACY_ARCHITECTURE.md Section 13.4 & 16
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

export function DeleteAccountSection() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deletionReason, setDeletionReason] = useState<string>('');
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDeleteRequest = async () => {
    if (confirmText.toLowerCase() !== 'delete my account') {
      alert('Please type "delete my account" to confirm');
      return;
    }

    if (!deletionReason) {
      alert('Please select a reason for deletion');
      return;
    }

    try {
      setDeleting(true);

      const response = await apiFetch('/api/user/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: deletionReason,
          confirmText,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to request deletion');
      }

      const data = await response.json();

      // Show success and redirect
      alert(`Account deletion scheduled for ${new Date(data.deletionScheduledFor).toLocaleDateString()}. You have 30 days to cancel.`);
      
      // Log out and redirect
      router.push('/');
    } catch (error) {
      console.error('Deletion request failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to request account deletion');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
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
          <CardDescription>
            Permanently delete your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <li>• <strong>Day 0:</strong> Account marked for deletion, you're logged out</li>
              <li>• <strong>Day 0-30:</strong> Grace period - you can cancel deletion by logging in</li>
              <li>• <strong>Day 30:</strong> Account and all data permanently deleted</li>
              <li>• <strong>Emails:</strong> You'll receive reminders on days 7, 14, and 28</li>
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
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Request Account Deletion
            </Button>
          </div>
        </CardContent>
      </Card>

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
                  This will start the account deletion process. You will have 30 days to change
                  your mind before permanent deletion.
                </p>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="deletion-reason">Reason for leaving (required)</Label>
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
                      Type <code className="text-xs bg-muted px-1 py-0.5 rounded">delete my account</code> to confirm
                    </Label>
                    <Input
                      id="confirm-text"
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="delete my account"
                      className="mt-1"
                    />
                  </div>
                </div>

                <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
                  <AlertDescription className="text-xs">
                    <strong>Reminder:</strong> You can cancel deletion within 30 days by logging in.
                    We'll send you reminder emails before permanent deletion.
                  </AlertDescription>
                </Alert>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRequest}
              disabled={
                deleting ||
                confirmText.toLowerCase() !== 'delete my account' ||
                !deletionReason
              }
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? 'Processing...' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

