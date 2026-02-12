'use client';

import { useEffect, useState, useActionState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { motion } from 'framer-motion';
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

function SignInSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="w-full rounded-xl bg-proofound-forest py-[14px] text-[15px] font-semibold tracking-[0.01em] text-white shadow-sm transition-all hover:-translate-y-[1px] hover:bg-[#2D5D4A] hover:shadow-md disabled:bg-[#E8E6DD] disabled:text-[#2D3330]/40"
    >
      {pending ? 'Signing in…' : 'Sign in'}
    </Button>
  );
}

export function SignIn({ onBack, onCreateAccount }: SignInProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [formState, formAction, _isPending] = useActionState(signIn, INITIAL_STATE);

  // Surface OAuth errors passed back via the callback route
  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      setClientError(oauthError);
    }
  }, [searchParams]);

  // Safely extract error message (protects against Event objects)
  const error = clientError ?? (formState?.error ? getUserErrorMessage(formState.error) : null);

  // Email validation helper
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    setClientError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (!email) {
      event.preventDefault();
      setClientError('Please enter your email address.');
      return;
    }

    if (!validateEmail(email)) {
      event.preventDefault();
      setClientError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      event.preventDefault();
      setClientError('Please enter your password.');
      return;
    }
  };

  // Layout container with Figma background tokens and animated accents
  // Responsive: Adapts padding and card size for mobile/tablet/desktop
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F7F6F1] px-4 sm:px-6 py-8 sm:py-16 text-[#2D3330]">
      {/* Network background from design system */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <NetworkBackground />
      </div>

      {/* Warm glow overlay to match Figma lighting */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(28,77,58,0.08),transparent_55%),radial-gradient(circle_at_85%_80%,rgba(199,107,74,0.07),transparent_60%)]" />

      {/* Optional back button for nested flows - responsive positioning */}
      {onBack && (
        <motion.button
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="absolute left-4 sm:left-6 top-4 sm:top-6 flex items-center gap-2 text-neutral-dark-500 transition-colors hover:text-proofound-charcoal z-20"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-medium">Back</span>
        </motion.button>
      )}

      {/* Elevating the card to mirror the Figma panel */}
      {/* Responsive: Full width on mobile with margin, constrained on larger screens */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[480px] px-2 sm:px-4"
      >
        <Card className="mx-auto overflow-hidden rounded-[24px] border border-[#E8E6DD] bg-white/95 p-6 sm:p-10 md:p-12 shadow-[0_4px_24px_rgba(29,51,48,0.08)] backdrop-blur">
          {/* Brand mark and welcoming copy */}
          <div className="mb-10 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.45, ease: 'easeOut' }}
              className="mb-4"
            >
              <Image
                src="/logo.png"
                alt="Proofound"
                width={120}
                height={48}
                className="mx-auto h-12 w-auto"
                priority
              />
            </motion.div>
            <h1 className="font-display text-[28px] font-semibold leading-9 tracking-[-0.01em] text-[#2D3330]">
              Welcome back
            </h1>
            <p className="mt-3 text-[15px] leading-[22px] text-muted-foreground">
              Sign in to continue to Proofound
            </p>
          </div>

          {/* Friendly error surface aligned with brand colors with proper ARIA */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-2xl border border-[#B5542D]/25 bg-[#B5542D]/10 px-4 py-3"
              role="alert"
              aria-live="assertive"
            >
              <p id="signin-error" className="text-sm font-medium text-[#8A3F21]">
                {error}
              </p>
            </motion.div>
          )}

          {/* Email + password form with proper ARIA attributes */}
          <form
            action={formAction}
            onSubmit={handleSubmit}
            className="space-y-6"
            aria-label="Sign in form"
            noValidate
          >
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.08em] text-[#2D3330]"
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
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={false}
                  required
                  aria-required="true"
                  aria-invalid={error ? 'true' : 'false'}
                  aria-describedby={error ? 'signin-error' : undefined}
                  className="h-11 rounded-xl border border-[#E8E6DD] bg-white pl-12 pr-4 text-[15px] text-[#2D3330] transition-all focus-visible:border-2 focus-visible:border-proofound-forest focus-visible:px-[43px] focus-visible:ring-[3px] focus-visible:ring-proofound-forest/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.08em] text-[#2D3330]"
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
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={false}
                  required
                  aria-required="true"
                  aria-invalid={error ? 'true' : 'false'}
                  aria-describedby={error ? 'signin-error' : undefined}
                  className="h-11 rounded-xl border border-[#E8E6DD] bg-white pl-12 pr-12 text-[15px] text-[#2D3330] transition-all focus-visible:border-2 focus-visible:border-proofound-forest focus-visible:px-[43px] focus-visible:ring-[3px] focus-visible:ring-proofound-forest/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-proofound-charcoal focus:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest rounded"
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
                className="flex cursor-pointer items-center gap-2 text-[14px] text-[#2D3330]"
              >
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                Remember me
              </label>
              <Link
                href="/reset-password"
                className="text-[14px] font-medium text-proofound-forest transition-colors hover:text-[#2D5D4A]"
              >
                Forgot password?
              </Link>
            </div>

            <SignInSubmitButton />
          </form>

          {/* Divider with soft typography */}
          <div className="relative my-7">
            <Separator className="bg-[#E8E6DD]" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-center text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Or continue with
            </span>
          </div>

          {/* Social sign-in mirrors the rounded Figma buttons */}
          <SocialSignInButtons className="space-y-3" />

          {/* Create account helper */}
          <div className="mt-7 text-center text-sm text-neutral-dark-500">
            <span>Don&apos;t have an account? </span>
            <Link
              href="/signup"
              onClick={(event) => {
                if (onCreateAccount) {
                  event.preventDefault();
                  onCreateAccount();
                }
              }}
              className="font-medium text-proofound-forest transition-colors hover:text-[#2D5D4A]"
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
            className="font-medium text-proofound-forest underline underline-offset-2 hover:text-[#2D5D4A]"
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            href="/privacy"
            className="font-medium text-proofound-forest underline underline-offset-2 hover:text-[#2D5D4A]"
          >
            Privacy Policy
          </a>
        </p>
      </motion.div>
    </div>
  );
}
