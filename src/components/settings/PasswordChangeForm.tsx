'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/fetch';

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      toast.success('Password updated successfully');

      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChanging(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update password';
      setError(errorMessage);
      toast.error(errorMessage);
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
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-proofound-charcoal/50 hover:text-proofound-charcoal"
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
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-proofound-charcoal/50 hover:text-proofound-charcoal"
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
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
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
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-proofound-charcoal/50 hover:text-proofound-charcoal"
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
      <div className="flex items-center gap-2 pt-2">
        <Button
          type="submit"
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
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
