'use client';

import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import SocialSignInButtons from '@/components/auth/social-sign-in-buttons';
import { NetworkBackground } from '@/components/NetworkBackground';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Building2, User, CheckCircle2 } from 'lucide-react';
import { signUp, type SignUpState } from '@/actions/auth';

interface SignupFormProps {
  accountType: 'individual' | 'organization';
  onBack?: () => void;
}

const INITIAL_STATE: SignUpState = { error: null, success: false };

function SignupSubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <Button
      data-testid="signup-submit"
      type="submit"
      className="w-full rounded-xl bg-proofound-forest py-[14px] text-[15px] font-semibold tracking-[0.01em] text-white shadow-sm transition-all hover:-translate-y-[1px] hover:bg-[#2D5D4A] hover:shadow-md disabled:bg-proofound-stone disabled:text-foreground/40"
      size="lg"
      disabled={pending}
    >
      {pending ? 'Creating account…' : children}
    </Button>
  );
}

export function SignupForm({ accountType, onBack }: SignupFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams?.get('next');
  const [showPassword, setShowPassword] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  const personaValue = useMemo(
    () => (accountType === 'organization' ? 'org_member' : 'individual'),
    [accountType]
  );

  const [formState, formAction] = useActionState(signUp, INITIAL_STATE);
  const state = formState ?? INITIAL_STATE;
  const errorMessage = clientError ?? state.error;

  const focusErrorMessage = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    errorRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' });
    errorRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!errorMessage) return;

    requestAnimationFrame(() => {
      focusErrorMessage();
    });
  }, [errorMessage, focusErrorMessage]);

  const setValidationError = (message: string) => {
    setClientError(message);
    setTimeout(focusErrorMessage, 0);
  };

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    setClientError(null);

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      event.preventDefault();
      setValidationError('Please enter your email address.');
      return;
    }

    if (!validateEmail(normalizedEmail)) {
      event.preventDefault();
      setValidationError('Enter a valid email address.');
      return;
    }

    if (!password) {
      event.preventDefault();
      setValidationError('Please enter a password.');
      return;
    }

    if (password.length < 8) {
      event.preventDefault();
      setValidationError('Password must be at least 8 characters');
      return;
    }

    // Validate GDPR consent (required)
    if (!gdprConsent) {
      event.preventDefault();
      setValidationError(
        'You must agree to the Privacy Policy and Terms of Service to create an account'
      );
      return;
    }

    // Keep password fields in sync
    if (password !== confirmPassword) {
      event.preventDefault();
      setValidationError('Passwords do not match');
      return;
    }
  };

  if (state.success) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-japandi-bg px-4 py-10 text-foreground sm:px-6 sm:py-16">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <NetworkBackground />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(28,77,58,0.08),transparent_55%),radial-gradient(circle_at_85%_80%,rgba(199,107,74,0.07),transparent_65%)]" />

        <div className="relative z-10 w-full max-w-md px-0 sm:px-4" data-testid="signup-success">
          <Card className="mx-auto rounded-[24px] border border-proofound-stone bg-white/95 p-6 text-center shadow-[0_4px_24px_rgba(29,51,48,0.08)] sm:p-10">
            <div
              className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ${
                accountType === 'organization'
                  ? 'bg-proofound-terracotta shadow-[0_8px_18px_rgba(199,107,74,0.32)]'
                  : 'bg-proofound-forest shadow-[0_8px_18px_rgba(28,77,58,0.28)]'
              }`}
            >
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Check your email
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              We&apos;ve sent a verification link to{' '}
              <span
                className={`font-medium ${
                  accountType === 'organization'
                    ? 'text-proofound-terracotta'
                    : 'text-proofound-forest'
                }`}
              >
                {email}
              </span>
            </p>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Click the link in the email to verify your account and complete your registration.
            </p>
            <Button
              asChild
              variant="outline"
              className={`mt-6 border-proofound-stone ${
                accountType === 'organization'
                  ? 'text-proofound-terracotta hover:border-proofound-terracotta hover:bg-proofound-terracotta/5'
                  : 'text-proofound-forest hover:border-proofound-forest hover:bg-proofound-forest/5'
              }`}
            >
              <Link href="/login">Return to login</Link>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-japandi-bg px-4 py-10 text-foreground sm:px-6 sm:py-16">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <NetworkBackground />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(28,77,58,0.08),transparent_55%),radial-gradient(circle_at_85%_80%,rgba(199,107,74,0.07),transparent_65%)]" />

      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute left-6 top-6 flex min-h-[44px] items-center gap-2 px-2 -mx-2 text-muted-foreground transition-colors hover:text-proofound-charcoal"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
      )}

      {/* Signup Form Card */}
      <div className="relative z-10 w-full max-w-md px-0 sm:px-4" data-testid="signup-form-shell">
        <Card className="mx-auto rounded-[24px] border border-proofound-stone bg-white/95 p-5 shadow-[0_4px_24px_rgba(29,51,48,0.08)] backdrop-blur sm:p-10">
          {/* Logo/Title */}
          <div className="mb-6 text-center sm:mb-8">
            <div className="mb-4">
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
                  accountType === 'organization'
                    ? 'bg-proofound-terracotta shadow-[0_8px_18px_rgba(199,107,74,0.32)]'
                    : 'bg-proofound-forest shadow-[0_8px_18px_rgba(28,77,58,0.28)]'
                }`}
              >
                {accountType === 'individual' ? (
                  <User className="h-8 w-8 text-white" />
                ) : (
                  <Building2 className="h-8 w-8 text-white" />
                )}
              </div>
            </div>
            <h1 className="font-display text-[28px] font-semibold leading-9 tracking-[-0.01em] text-foreground">
              Create your {accountType} account
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Start with a calm proof-first account. You can add details after sign-up.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              ref={errorRef}
              className="mb-6 rounded-2xl border border-[#B5542D]/25 bg-[#B5542D]/10 px-4 py-3"
              data-testid="signup-error"
              tabIndex={-1}
            >
              <p className="text-sm font-medium text-[#8A3F21]" role="alert" aria-live="polite">
                {errorMessage}
              </p>
            </div>
          )}

          {/* Signup Form */}
          <form
            action={formAction}
            onSubmit={handleSubmit}
            className="space-y-6"
            noValidate
            data-testid="signup-form"
          >
            <input type="hidden" name="next" value={nextPath || ''} />
            <input type="hidden" name="persona" value={personaValue} />
            <input type="hidden" name="gdprConsent" value={gdprConsent.toString()} />
            <input type="hidden" name="marketingOptIn" value={marketingOptIn.toString()} />
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.08em] text-foreground"
              >
                <Mail
                  className={`h-4 w-4 ${accountType === 'organization' ? 'text-proofound-terracotta' : 'text-proofound-forest'}`}
                />
                Email address
              </Label>
              <div className="relative">
                <Mail
                  className={`absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${accountType === 'organization' ? 'text-proofound-terracotta' : 'text-proofound-forest'}`}
                  aria-hidden="true"
                />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  data-testid="signup-email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`h-11 rounded-xl border border-proofound-stone bg-white pl-12 pr-4 text-[15px] text-foreground transition-all focus-visible:border-2 focus-visible:px-[43px] focus-visible:ring-[3px] ${
                    accountType === 'organization'
                      ? 'focus-visible:border-proofound-terracotta focus-visible:ring-proofound-terracotta/10'
                      : 'focus-visible:border-proofound-forest focus-visible:ring-proofound-forest/10'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.08em] text-foreground"
              >
                <Lock
                  className={`h-4 w-4 ${accountType === 'organization' ? 'text-proofound-terracotta' : 'text-proofound-forest'}`}
                />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  data-testid="signup-password"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  disabled={false}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className={`h-11 rounded-xl border border-proofound-stone bg-white pl-12 pr-12 text-[15px] text-foreground transition-all focus-visible:border-2 focus-visible:px-[43px] focus-visible:ring-[3px] ${
                    accountType === 'organization'
                      ? 'focus-visible:border-proofound-terracotta focus-visible:ring-proofound-terracotta/10'
                      : 'focus-visible:border-proofound-forest focus-visible:ring-proofound-forest/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-proofound-charcoal focus:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirm-password"
                className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.08em] text-foreground"
              >
                <Lock
                  className={`h-4 w-4 ${accountType === 'organization' ? 'text-proofound-terracotta' : 'text-proofound-forest'}`}
                />
                Confirm password
              </Label>
              <Input
                id="confirm-password"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                data-testid="signup-confirm-password"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                disabled={false}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className={`h-11 rounded-xl border border-proofound-stone bg-white px-4 text-[15px] text-foreground transition-all focus-visible:border-2 focus-visible:px-[15px] focus-visible:ring-[3px] ${
                  accountType === 'organization'
                    ? 'focus-visible:border-proofound-terracotta focus-visible:ring-proofound-terracotta/10'
                    : 'focus-visible:border-proofound-forest focus-visible:ring-proofound-forest/10'
                }`}
              />
            </div>

            {/* GDPR Consent Checkboxes */}
            <div className="space-y-4 pt-2">
              {/* Required: Privacy Policy & Terms of Service */}
              <div className="flex min-h-[44px] items-start gap-3 py-1">
                <Checkbox
                  id="signup-gdpr-consent"
                  data-testid="gdpr-consent"
                  aria-label="I agree to the Privacy Policy and Terms of Service"
                  checked={gdprConsent}
                  onCheckedChange={(checked) => setGdprConsent(checked === true)}
                  required
                  className={`mt-0.5 h-6 w-6 cursor-pointer rounded-md border-proofound-stone bg-white ${
                    accountType === 'organization'
                      ? 'data-[state=checked]:bg-proofound-terracotta data-[state=checked]:text-white focus-visible:ring-proofound-terracotta/20'
                      : 'data-[state=checked]:bg-proofound-forest data-[state=checked]:text-white focus-visible:ring-proofound-forest/20'
                  }`}
                />
                <label
                  htmlFor="signup-gdpr-consent"
                  className="cursor-pointer text-sm leading-5 text-foreground"
                >
                  I agree to the{' '}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex min-h-[44px] items-center rounded-sm font-medium underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 ${
                      accountType === 'organization'
                        ? 'text-proofound-terracotta hover:text-[#B5673F]'
                        : 'text-proofound-forest hover:text-[#2D5D4A]'
                    }`}
                  >
                    Privacy Policy
                  </a>{' '}
                  and{' '}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex min-h-[44px] items-center rounded-sm font-medium underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 ${
                      accountType === 'organization'
                        ? 'text-proofound-terracotta hover:text-[#B5673F]'
                        : 'text-proofound-forest hover:text-[#2D5D4A]'
                    }`}
                  >
                    Terms of Service
                  </a>
                  <span className="ml-1 text-[#B5542D]">*</span>
                </label>
              </div>

              {/* Optional: Marketing emails */}
              <div className="flex min-h-[44px] items-start gap-3 py-1">
                <Checkbox
                  id="signup-marketing-opt-in"
                  data-testid="marketing-opt-in"
                  aria-label="Send me updates about new features and matching opportunities"
                  checked={marketingOptIn}
                  onCheckedChange={(checked) => setMarketingOptIn(checked === true)}
                  className={`mt-0.5 h-6 w-6 cursor-pointer rounded-md border-proofound-stone bg-white ${
                    accountType === 'organization'
                      ? 'data-[state=checked]:bg-proofound-terracotta data-[state=checked]:text-white focus-visible:ring-proofound-terracotta/20'
                      : 'data-[state=checked]:bg-proofound-forest data-[state=checked]:text-white focus-visible:ring-proofound-forest/20'
                  }`}
                />
                <label
                  htmlFor="signup-marketing-opt-in"
                  className="cursor-pointer text-sm leading-5 text-muted-foreground"
                >
                  Send me updates about new features and matching opportunities
                </label>
              </div>
            </div>

            <SignupSubmitButton>
              {accountType === 'organization' ? 'Create organization account' : 'Create account'}
            </SignupSubmitButton>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1 bg-proofound-stone" />
            <span className="shrink-0 whitespace-nowrap bg-white text-center overline">
              Or continue with
            </span>
            <Separator className="flex-1 bg-proofound-stone" />
          </div>

          {/* Social Sign In - Using existing configured component */}
          <SocialSignInButtons />

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/login')}
                className={`inline-flex min-h-[44px] items-center rounded-sm px-2 font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 ${
                  accountType === 'organization'
                    ? 'text-proofound-terracotta hover:text-[#B5673F]'
                    : 'text-proofound-forest hover:text-[#2D5D4A]'
                }`}
              >
                Sign in
              </button>
            </p>
          </div>
        </Card>

        {/* Footer Text */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By creating an account, you agree to our{' '}
          <a
            href="/terms"
            className={`rounded-sm font-medium underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 ${
              accountType === 'organization'
                ? 'text-proofound-terracotta hover:text-[#B5673F]'
                : 'text-proofound-forest hover:text-[#2D5D4A]'
            }`}
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            href="/privacy"
            className={`rounded-sm font-medium underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 ${
              accountType === 'organization'
                ? 'text-proofound-terracotta hover:text-[#B5673F]'
                : 'text-proofound-forest hover:text-[#2D5D4A]'
            }`}
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
