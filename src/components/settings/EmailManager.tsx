'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pencil, Check, X, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

interface EmailManagerProps {
  currentEmail: string;
  onEmailUpdated?: () => void;
}

const EMAIL_UPDATE_FAILED_MESSAGE =
  'Email was not updated. Your current email is still active; review the new address and try again.';

function getSafeEmailUpdateError(error: unknown): string {
  const message = error instanceof Error ? error.message : '';

  if (/valid email address/i.test(message)) {
    return 'Please enter a valid email address.';
  }

  if (/unauthorized/i.test(message)) {
    return 'Your session could not be confirmed. Sign in again, then update your email.';
  }

  return EMAIL_UPDATE_FAILED_MESSAGE;
}

/**
 * EmailManager Component
 *
 * Allows users to view and update their email address
 * Handles email verification flow through Supabase auth
 */
export function EmailManager({ currentEmail, onEmailUpdated }: EmailManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = () => {
    setIsEditing(true);
    setNewEmail(currentEmail);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewEmail('');
    setError(null);
  };

  const handleSave = async () => {
    // Validate email
    if (!newEmail || !newEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (newEmail === currentEmail) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch('/api/user/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'email update failed');
      }

      toast.success('Email updated successfully', {
        description: 'Please check your new email to confirm the change.',
      });

      setIsEditing(false);
      onEmailUpdated?.();
    } catch (err) {
      dispatchClientErrorDiagnostic('settings.email.update_failed', err);
      const safeErrorMessage = getSafeEmailUpdateError(err);
      setError(safeErrorMessage);
      toast.error(safeErrorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-proofound-charcoal/70" />
          <Input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter new email"
            className="flex-1"
            disabled={isLoading}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isLoading}
            className="bg-proofound-forest hover:bg-proofound-forest/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel} disabled={isLoading}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>

        <p className="text-xs text-proofound-charcoal/70">
          You'll receive a confirmation email at your new address. Click the link to complete the
          change.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-proofound-charcoal dark:text-foreground">Email</p>
          <p className="break-all text-proofound-charcoal/70 dark:text-muted-foreground">
            {currentEmail}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleEdit}
          className="w-full justify-center border-proofound-forest text-proofound-forest hover:bg-proofound-forest/5 sm:w-auto sm:shrink-0"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Change Email
        </Button>
      </div>
    </div>
  );
}
