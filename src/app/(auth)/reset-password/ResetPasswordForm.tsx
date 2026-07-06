'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requestPasswordReset } from '@/actions/auth';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { Mail, ArrowLeft } from 'lucide-react';

const PASSWORD_RESET_REQUEST_FAILED_MESSAGE =
  'Reset link could not be sent. Your account is unchanged; check the email and try again.';

export function ResetPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError('Please enter your email address.');
      setIsLoading(false);
      return;
    }

    if (!validateEmail(normalizedEmail)) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('email', normalizedEmail);

    try {
      const result = await requestPasswordReset(formData);

      if (result.error) {
        const resetError = new Error(result.error);
        dispatchClientErrorDiagnostic('auth.reset_password.request_failed', resetError);
        setError(PASSWORD_RESET_REQUEST_FAILED_MESSAGE);
        return;
      }

      setIsSuccess(true);
    } catch (caught) {
      dispatchClientErrorDiagnostic('auth.reset_password.request_failed', caught);
      setError(PASSWORD_RESET_REQUEST_FAILED_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-proofound-parchment px-4 py-10 dark:bg-background"
        data-testid="reset-password-success"
      >
        <Card className="w-full max-w-md rounded-[24px] border-proofound-stone bg-white/95 shadow-[0_4px_24px_rgba(29,51,48,0.08)] dark:border-border">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-proofound-forest/10">
              <Mail className="h-6 w-6 text-proofound-forest dark:text-primary" />
            </div>
            <h1 className="font-display text-2xl font-semibold leading-none tracking-tight text-proofound-charcoal dark:text-foreground">
              Check your email
            </h1>
            <CardDescription className="leading-6 text-proofound-charcoal/70 dark:text-muted-foreground">
              We&apos;ve sent a password reset link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm leading-6 text-proofound-charcoal/70 dark:text-muted-foreground">
              Click the link in the email to reset your password. The link will expire in 1 hour.
            </p>
            <Button
              asChild
              variant="outline"
              className="w-full border-proofound-stone dark:border-border"
            >
              <Link href="/login">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-proofound-parchment px-4 py-10 dark:bg-background"
      data-testid="reset-password-shell"
    >
      <Card className="w-full max-w-md rounded-[24px] border-proofound-stone bg-white/95 shadow-[0_4px_24px_rgba(29,51,48,0.08)] dark:border-border">
        <CardHeader className="space-y-2">
          <h1 className="font-display text-2xl font-semibold leading-none tracking-tight text-proofound-charcoal dark:text-foreground">
            Reset your password
          </h1>
          <CardDescription className="leading-6 text-proofound-charcoal/70 dark:text-muted-foreground">
            Enter your email and we&apos;ll send one secure reset link. Nothing else changes until
            you use it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            noValidate
            data-testid="reset-password-form"
          >
            <div>
              <Label htmlFor="email" className="text-proofound-charcoal dark:text-foreground">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                data-testid="reset-password-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={isLoading}
                className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm"
                data-testid="reset-password-error"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              data-testid="reset-password-submit"
              className="w-full bg-proofound-forest hover:bg-proofound-forest/90 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send reset link'}
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground hover:text-proofound-forest dark:hover:text-primary transition-colors inline-flex min-h-[44px] items-center px-2 -mx-2"
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
