'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { confirmPasswordReset } from '@/actions/auth';
import { Eye, EyeOff, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function ConfirmResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  useEffect(() => {
    const codeParam = searchParams.get('code');

    if (!codeParam) {
      setIsAuthenticating(false);
      return;
    }

    let isMounted = true;

    async function exchangeCode(currentCode: string) {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(currentCode);

        if (!isMounted) {
          return;
        }

        if (error) {
          setAuthError(
            'This password reset link is invalid or has expired. Please request a new one.'
          );
        }
      } catch (error) {
        if (isMounted) {
          setAuthError('We ran into a problem validating your reset link. Please try again.');
        }
      } finally {
        if (isMounted) {
          setIsAuthenticating(false);
        }
      }
    }

    exchangeCode(codeParam);

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('password', password);

    const result = await confirmPasswordReset(formData);

    if (result.error) {
      setFormError(result.error);
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

  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-100 px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mb-4">
              <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
            </div>
            <CardTitle>Verifying reset link</CardTitle>
            <CardDescription>Please wait while we verify your reset link...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-100 px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <CardTitle>Reset link invalid</CardTitle>
            <CardDescription>{authError}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/reset-password">Request a new reset link</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Back to login</Link>
            </Button>
          </CardContent>
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

            {formError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {formError}
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
