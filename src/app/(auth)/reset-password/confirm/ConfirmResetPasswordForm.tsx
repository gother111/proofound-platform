'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { confirmPasswordReset } from '@/actions/auth';
import { Eye, EyeOff, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function ConfirmResetPasswordForm() {
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
    if (typeof window === 'undefined') {
      return;
    }

    const hash = window.location.hash;

    if (!hash || !hash.startsWith('#')) {
      return;
    }

    const hashParams = new URLSearchParams(hash.slice(1));

    if (hashParams.size === 0) {
      return;
    }

    const currentParams = new URLSearchParams(window.location.search);
    let updated = false;

    hashParams.forEach((value, key) => {
      if (!value) {
        return;
      }

      if (currentParams.get(key) !== value) {
        currentParams.set(key, value);
        updated = true;
      }
    });

    if (updated) {
      const nextUrl = `${window.location.pathname}?${currentParams.toString()}`;
      router.replace(nextUrl, { scroll: false });
    }
  }, [router]);

  useEffect(() => {
    const codeParam = searchParams?.get('code');
    const tokenHashParam = searchParams?.get('token_hash') ?? searchParams?.get('token');

    if (!codeParam && !tokenHashParam) {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        if (hash && (hash.includes('code=') || hash.includes('token_hash='))) {
          return;
        }
      }

      setIsAuthenticating(false);
      return;
    }

    let isMounted = true;

    async function bootstrapRecoverySession() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        let error: { message?: string } | null = null;

        if (!session) {
          if (codeParam) {
            const exchangeResult = await supabase.auth.exchangeCodeForSession(codeParam);
            error = exchangeResult.error;
          } else if (tokenHashParam) {
            const verifyResult = await supabase.auth.verifyOtp({
              type: 'recovery',
              token_hash: tokenHashParam,
            });
            error = verifyResult.error;
          }
        }

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

    bootstrapRecoverySession();

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
      <div className="flex min-h-screen items-center justify-center bg-proofound-parchment px-4 py-10">
        <Card className="w-full max-w-md rounded-[24px] border-proofound-stone bg-white/95 shadow-[0_4px_24px_rgba(29,51,48,0.08)]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-proofound-forest/10">
              <CheckCircle className="h-6 w-6 text-proofound-forest" />
            </div>
            <CardTitle className="font-display text-2xl text-proofound-charcoal">
              Password reset successful
            </CardTitle>
            <CardDescription className="leading-6 text-proofound-charcoal/70">
              Your password has been reset. Redirecting to login.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isAuthenticating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-proofound-parchment px-4 py-10">
        <Card className="w-full max-w-md rounded-[24px] border-proofound-stone bg-white/95 shadow-[0_4px_24px_rgba(29,51,48,0.08)]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-proofound-forest/10">
              <Loader2 className="h-6 w-6 animate-spin text-proofound-forest" />
            </div>
            <CardTitle className="font-display text-2xl text-proofound-charcoal">
              Verifying reset link
            </CardTitle>
            <CardDescription className="leading-6 text-proofound-charcoal/70">
              Please wait while we verify your reset link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-proofound-parchment px-4 py-10">
        <Card className="w-full max-w-md rounded-[24px] border-proofound-stone bg-white/95 shadow-[0_4px_24px_rgba(29,51,48,0.08)]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="font-display text-2xl text-proofound-charcoal">
              Reset link invalid
            </CardTitle>
            <CardDescription className="leading-6 text-proofound-charcoal/70">
              {authError}
            </CardDescription>
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
    <div className="flex min-h-screen items-center justify-center bg-proofound-parchment px-4 py-10">
      <Card className="w-full max-w-md rounded-[24px] border-proofound-stone bg-white/95 shadow-[0_4px_24px_rgba(29,51,48,0.08)]">
        <CardHeader className="space-y-2">
          <CardTitle className="font-display text-2xl text-proofound-charcoal">
            Set new password
          </CardTitle>
          <CardDescription className="leading-6 text-proofound-charcoal/70">
            Choose a new password for your Proofound account.
          </CardDescription>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-proofound-charcoal/55 hover:text-proofound-charcoal"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {formError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-proofound-forest text-white hover:bg-proofound-forest/90"
              disabled={isLoading}
            >
              {isLoading ? 'Resetting password...' : 'Reset password'}
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex min-h-[44px] items-center px-2 text-sm text-proofound-charcoal/70 transition-colors hover:text-proofound-forest"
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
