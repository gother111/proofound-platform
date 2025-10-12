'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { confirmPasswordReset } from '@/actions/auth';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

function ConfirmResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('password', password);

    const result = await confirmPasswordReset(formData);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setIsSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-100 px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <CardTitle>Password reset successful</CardTitle>
            <CardDescription>Your password has been reset. Redirecting to login...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-100 px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Set new password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-dark-500 hover:text-neutral-dark-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Resetting password...' : 'Reset password'}
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-neutral-dark-600 hover:text-primary-500 transition-colors"
              >
                ← Back to login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConfirmResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-secondary-100">
          <div>Loading...</div>
        </div>
      }
    >
      <ConfirmResetPasswordForm />
    </Suspense>
  );
}
