'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientDiagnostic, dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

const PASSWORD_UPDATE_FAILED_MESSAGE =
  'Password was not updated. Your password has not changed; review the entries and try again.';

function getSafePasswordUpdateError(error: unknown): string {
  const message = error instanceof Error ? error.message : '';

  if (message === 'password_current_incorrect' || /current password is incorrect/i.test(message)) {
    return 'Current password is incorrect. Please re-enter it and try again.';
  }

  if (message === 'password_session_unconfirmed' || /unauthorized/i.test(message)) {
    return 'Your session could not be confirmed. Sign in again, then update your password.';
  }

  return PASSWORD_UPDATE_FAILED_MESSAGE;
}

function getResponseStatus(response: Response) {
  return typeof response.status === 'number' ? response.status : 'unknown';
}

function getReturnedError(payload: unknown) {
  if (
    payload &&
    typeof payload === 'object' &&
    'error' in payload &&
    typeof payload.error === 'string'
  ) {
    return payload.error.trim();
  }

  return '';
}

function getPasswordUpdateErrorCode(returnedError: string) {
  if (/current password is incorrect/i.test(returnedError)) {
    return 'password_current_incorrect';
  }

  if (/unauthorized/i.test(returnedError)) {
    return 'password_session_unconfirmed';
  }

  return 'password_update_request_failed';
}

/**
 * PasswordChangeForm Component
 *
 * Allows users to change their password
 * Requires current password for security
 * Shows password strength indicator
 */
export function PasswordChangeForm() {
  const [isChanging, setIsChanging] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Calculate password strength
  const getPasswordStrength = (
    password: string
  ): { score: number; label: string; color: string } => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;

    if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { score, label: 'Medium', color: 'bg-amber-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = newPassword ? getPasswordStrength(newPassword) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiFetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const returnedError = getReturnedError(data);
        const errorCode = getPasswordUpdateErrorCode(returnedError);
        dispatchClientDiagnostic('settings.password.update_returned_error', {
          status: getResponseStatus(response),
          hasReturnedError: returnedError.length > 0,
          errorKind: errorCode,
        });
        throw new Error(errorCode);
      }

      toast.success('Password updated successfully');

      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChanging(false);
    } catch (err) {
      dispatchClientErrorDiagnostic('settings.password.update_failed', err);
      const safeErrorMessage = getSafePasswordUpdateError(err);
      setError(safeErrorMessage);
      toast.error(safeErrorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isChanging) {
    return (
      <div>
        <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground mb-4">
          Keep your account secure by regularly updating your password
        </p>
        <Button
          onClick={() => setIsChanging(true)}
          variant="outline"
          className="border-proofound-forest text-proofound-forest hover:bg-proofound-forest/5"
        >
          <Lock className="w-4 h-4 mr-2" />
          Change Password
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Current Password */}
      <div className="space-y-2">
        <Label htmlFor="current-password">Current Password</Label>
        <div className="relative">
          <Input
            id="current-password"
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            disabled={isLoading}
            className="pr-14"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
            className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-proofound-charcoal/50 transition-colors hover:bg-muted hover:text-proofound-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest"
          >
            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* New Password */}
      <div className="space-y-2">
        <Label htmlFor="new-password">New Password</Label>
        <div className="relative">
          <Input
            id="new-password"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password (min. 8 characters)"
            disabled={isLoading}
            className="pr-14"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
            className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-proofound-charcoal/50 transition-colors hover:bg-muted hover:text-proofound-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest"
          >
            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {passwordStrength && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-proofound-charcoal/70">Password strength:</span>
              <span className="font-medium">{passwordStrength.label}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            disabled={isLoading}
            className="pr-14"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
            className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-proofound-charcoal/50 transition-colors hover:bg-muted hover:text-proofound-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Password Requirements */}
      <div className="bg-proofound-parchment/50 dark:bg-slate-800/50 rounded-lg p-3 space-y-1.5">
        <p className="text-xs font-medium text-proofound-charcoal dark:text-foreground">
          Password Requirements:
        </p>
        <ul className="space-y-1 text-xs text-proofound-charcoal/70 dark:text-muted-foreground">
          <li className="flex items-center gap-2">
            <CheckCircle2
              className={`w-3 h-3 ${newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}
            />
            At least 8 characters
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2
              className={`w-3 h-3 ${/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}
            />
            Mix of uppercase and lowercase letters
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2
              className={`w-3 h-3 ${/\d/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}
            />
            At least one number
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center">
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-proofound-forest hover:bg-proofound-forest/90 sm:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Update Password
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsChanging(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setError(null);
          }}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
