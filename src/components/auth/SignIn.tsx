'use client';

import { useActionState, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import SocialSignInButtons from '@/components/auth/social-sign-in-buttons';
import { NetworkBackground } from '@/components/NetworkBackground';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { signIn, type SignInState } from '@/actions/auth';
import { getUserErrorMessage } from '@/lib/error-handler';

interface SignInProps {
  onBack?: () => void;
  onCreateAccount?: () => void;
}

const INITIAL_STATE: SignInState = { error: null };
type ClientErrorField = 'email' | 'password' | 'form';

const OAUTH_CALLBACK_RETRY_MESSAGE =
  'We could not finish that sign-in link. Please try again or use email and password.';

function oauthCallbackErrorMessage(error?: string | null) {
  const normalized = error?.trim();
  if (!normalized) {
    return OAUTH_CALLBACK_RETRY_MESSAGE;
  }

  if (/provider.*not.*available|not enabled/i.test(normalized)) {
    return 'That sign-in provider is not available. Please use email and password instead.';
  }

  if (/expired|invalid|validate|authentication link/i.test(normalized)) {
    return 'That sign-in link is invalid or expired. Please try signing in again.';
  }

  return OAUTH_CALLBACK_RETRY_MESSAGE;
}

function SignInSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      data-testid="login-submit"
      type="submit"
      size="lg"
      disabled={pending}
      className="w-full rounded-xl bg-proofound-forest py-[14px] text-[15px] font-semibold tracking-[0.01em] text-white shadow-sm transition-all hover:-translate-y-[1px] hover:bg-[#2D5D4A] hover:shadow-md disabled:bg-proofound-stone disabled:text-foreground/40"
    >
      {pending ? 'Signing in…' : 'Sign in'}
    </Button>
  );
}

export function SignIn({ onBack, onCreateAccount }: SignInProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams?.get('next');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [clientErrorField, setClientErrorField] = useState<ClientErrorField | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const [formState, formAction, _isPending] = useActionState(signIn, INITIAL_STATE);

  // Surface OAuth errors passed back via the callback route
  useEffect(() => {
    const oauthError = searchParams?.get('error');
    if (oauthError) {
      setClientError(oauthCallbackErrorMessage(oauthError));
      setClientErrorField('form');
    }
  }, [searchParams]);

  // Safely extract error message (protects against Event objects)
  const error = clientError ?? (formState?.error ? getUserErrorMessage(formState.error) : null);
  const hasServerError = !clientError && Boolean(formState?.error);
  const emailInvalid = Boolean(
    error && (hasServerError || clientErrorField === 'email' || clientErrorField === 'form')
  );
  const passwordInvalid = Boolean(
    error && (hasServerError || clientErrorField === 'password' || clientErrorField === 'form')
  );

  const focusErrorMessage = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    errorRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' });
    errorRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!error) return;

    requestAnimationFrame(() => {
      focusErrorMessage();
    });
  }, [error, focusErrorMessage]);

  const setValidationError = (message: string, field: ClientErrorField) => {
    setClientError(message);
    setClientErrorField(field);
    setTimeout(focusErrorMessage, 0);
  };

  // Email validation helper
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    setClientError(null);
    setClientErrorField(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (!email) {
      event.preventDefault();
      setValidationError('Please enter your email address.', 'email');
      return;
    }

    if (!validateEmail(email)) {
      event.preventDefault();
      setValidationError('Please enter a valid email address.', 'email');
      return;
    }

    if (!password) {
      event.preventDefault();
      setValidationError('Please enter your password.', 'password');
      return;
    }
  };

  // Layout container with Figma background tokens and animated accents
  // Responsive: Adapts padding and card size for mobile/tablet/desktop
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-japandi-bg px-4 py-8 text-foreground sm:px-6 sm:py-16">
      {/* Network background from design system */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <NetworkBackground />
      </div>

      {/* Warm glow overlay to match Figma lighting */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(28,77,58,0.08),transparent_55%),radial-gradient(circle_at_85%_80%,rgba(199,107,74,0.07),transparent_60%)]" />

      {/* Optional back button for nested flows - responsive positioning */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute left-4 sm:left-6 top-4 sm:top-6 min-h-[44px] px-2 -mx-2 flex items-center gap-2 text-neutral-dark-500 transition-colors hover:text-proofound-charcoal z-20"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-medium">Back</span>
        </button>
      )}

      {/* Elevating the card to mirror the Figma panel */}
      {/* Responsive: Full width on mobile with margin, constrained on larger screens */}
      <div
        className="relative z-10 w-full max-w-[480px] px-0 sm:px-4"
        data-testid="login-form-shell"
      >
        <Card className="mx-auto overflow-hidden rounded-[24px] border border-proofound-stone bg-white/95 p-5 shadow-[0_4px_24px_rgba(29,51,48,0.08)] backdrop-blur sm:p-10 md:p-12">
          {/* Brand mark and welcoming copy */}
          <div className="mb-8 text-center sm:mb-10">
            <div className="mb-4">
              <Image
                src="/logo.png"
                alt="Proofound"
                width={48}
                height={48}
                className="mx-auto h-12 w-12"
                priority
              />
            </div>
            <h1 className="font-display text-[28px] font-semibold leading-9 tracking-[-0.01em] text-foreground">
              Welcome back
            </h1>
            <p className="mt-3 text-[15px] leading-[22px] text-muted-foreground">
              Sign in to continue to Proofound
            </p>
          </div>

          {/* Friendly error surface aligned with brand colors with proper ARIA */}
          {error && (
            <div
              ref={errorRef}
              className="mb-6 rounded-2xl border border-[#B5542D]/25 bg-[#B5542D]/10 px-4 py-3"
              role="alert"
              aria-live="assertive"
              data-testid="login-error"
              tabIndex={-1}
            >
              <p id="signin-error" className="text-sm font-medium text-[#8A3F21]">
                {error}
              </p>
            </div>
          )}

          {/* Email + password form with proper ARIA attributes */}
          <form
            action={formAction}
            onSubmit={handleSubmit}
            className="space-y-6"
            aria-label="Sign in form"
            noValidate
            data-testid="login-form"
          >
            <input type="hidden" name="next" value={nextPath || ''} />
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.08em] text-foreground"
              >
                <Mail className="h-4 w-4 text-proofound-forest" aria-hidden="true" />
                Email address
                <span
                  className="text-[#B5542D] text-base lowercase normal-case"
                  aria-label="required"
                >
                  *
                </span>
              </Label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-sage"
                  aria-hidden="true"
                />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  data-testid="login-email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={false}
                  required
                  aria-required="true"
                  aria-invalid={emailInvalid ? 'true' : 'false'}
                  aria-describedby={emailInvalid ? 'signin-error' : undefined}
                  className="h-11 rounded-xl border border-proofound-stone bg-white pl-12 pr-4 text-[15px] text-foreground transition-all focus-visible:border-2 focus-visible:border-proofound-forest focus-visible:px-[43px] focus-visible:ring-[3px] focus-visible:ring-proofound-forest/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.08em] text-foreground"
              >
                <Lock className="h-4 w-4 text-proofound-forest" aria-hidden="true" />
                Password
                <span
                  className="text-[#B5542D] text-base lowercase normal-case"
                  aria-label="required"
                >
                  *
                </span>
              </Label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-sage"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  data-testid="login-password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={false}
                  required
                  aria-required="true"
                  aria-invalid={passwordInvalid ? 'true' : 'false'}
                  aria-describedby={passwordInvalid ? 'signin-error' : undefined}
                  className="h-11 rounded-xl border border-proofound-stone bg-white pl-12 pr-12 text-[15px] text-foreground transition-all focus-visible:border-2 focus-visible:border-proofound-forest focus-visible:px-[43px] focus-visible:ring-[3px] focus-visible:ring-proofound-forest/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground transition-colors hover:text-proofound-charcoal focus:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label
                htmlFor="remember"
                className="flex cursor-pointer items-center gap-2 text-[14px] text-foreground min-h-[44px] py-1"
              >
                <Checkbox
                  id="remember"
                  aria-label="Remember me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  className="h-6 w-6 rounded-md border-proofound-stone bg-white data-[state=checked]:bg-proofound-forest data-[state=checked]:text-white focus-visible:ring-proofound-forest/30"
                />
                Remember me
              </label>
              <Link
                href="/reset-password"
                className="-mx-2 inline-flex min-h-[44px] items-center rounded-sm px-2 text-[14px] font-medium text-proofound-forest transition-colors hover:text-[#2D5D4A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
              >
                Forgot password?
              </Link>
            </div>

            <SignInSubmitButton />
          </form>

          {/* Divider with soft typography */}
          <div className="my-7 flex items-center gap-3">
            <Separator className="flex-1 bg-proofound-stone" />
            <span className="shrink-0 whitespace-nowrap bg-white text-center overline">
              Or continue with
            </span>
            <Separator className="flex-1 bg-proofound-stone" />
          </div>

          {/* Social sign-in mirrors the rounded Figma buttons */}
          <SocialSignInButtons className="space-y-3" nextPath={nextPath} />

          {/* Create account helper */}
          <div className="mt-7 text-center text-sm text-neutral-dark-500">
            <span>Don&apos;t have an account? </span>
            <Link
              href={nextPath ? `/signup?next=${encodeURIComponent(nextPath)}` : '/signup'}
              onClick={(event) => {
                if (onCreateAccount) {
                  event.preventDefault();
                  onCreateAccount();
                }
              }}
              className="-mx-2 inline-flex min-h-[44px] items-center rounded-sm px-2 font-medium text-proofound-forest transition-colors hover:text-[#2D5D4A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
            >
              Create account
            </Link>
          </div>
        </Card>

        {/* Legal copy stays subtle */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          By signing in, you agree to our{' '}
          <a
            href="/terms"
            className="inline-flex min-h-11 items-center rounded-sm px-1 font-medium text-proofound-forest underline underline-offset-2 hover:text-[#2D5D4A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            href="/privacy"
            className="inline-flex min-h-11 items-center rounded-sm px-1 font-medium text-proofound-forest underline underline-offset-2 hover:text-[#2D5D4A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </main>
  );
}
