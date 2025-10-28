'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import SocialSignInButtons from '@/components/auth/social-sign-in-buttons';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Building2, User } from 'lucide-react';

interface SignInProps {
  onBack?: () => void;
  onCreateAccount?: () => void;
}

export function SignIn({ onBack, onCreateAccount }: SignInProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [accountType, setAccountType] = useState<'individual' | 'organization'>('individual');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Handle the Supabase email + password sign-in flow
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        router.push('/app/i/home');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Layout container with Figma background tokens and animated accents
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-proofound-parchment px-6 py-16 text-proofound-charcoal">
      {/* Subtle parchment grain pulled from the Figma background */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <svg className="h-full w-full">
          <defs>
            <pattern
              id="proofound-signin-pattern"
              x="0"
              y="0"
              width="64"
              height="64"
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx="8"
                cy="8"
                r="2"
                className="text-brand-sage"
                fill="currentColor"
                opacity="0.45"
              />
              <circle
                cx="40"
                cy="32"
                r="1.75"
                className="text-brand-teal"
                fill="currentColor"
                opacity="0.35"
              />
              <path
                d="M 0 48 L 24 24"
                className="text-brand-ochre"
                stroke="currentColor"
                strokeWidth="0.6"
                opacity="0.18"
              />
            </pattern>
            <radialGradient id="proofound-signin-halo" cx="50%" cy="15%" r="65%">
              <stop offset="0%" stopColor="rgba(122,146,120,0.4)" />
              <stop offset="100%" stopColor="rgba(247,246,241,0)" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#proofound-signin-pattern)" />
          <rect width="100%" height="100%" fill="url(#proofound-signin-halo)" />
        </svg>
      </div>

      {/* Floating geometric accents inspired by the Figma canvas */}
      <motion.div
        className="absolute top-24 left-16 h-40 w-40 rounded-full bg-gradient-to-br from-brand-sage/15 via-brand-teal/10 to-transparent blur-3xl"
        animate={{
          x: [0, 28, 0],
          y: [0, -18, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-24 right-16 h-44 w-44 rounded-full bg-gradient-to-tl from-proofound-terracotta/18 via-ochre/12 to-transparent blur-3xl"
        animate={{
          x: [0, -22, 0],
          y: [0, 26, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Optional back button for nested flows */}
      {onBack && (
        <motion.button
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="absolute left-6 top-6 flex items-center gap-2 text-neutral-dark-500 transition-colors hover:text-proofound-charcoal"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back</span>
        </motion.button>
      )}

      {/* Elevating the card to mirror the Figma panel */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="overflow-hidden rounded-[28px] border border-proofound-stone/70 bg-white/90 p-10 shadow-[0_24px_60px_-24px_rgba(28,77,58,0.55)] backdrop-blur-sm">
          {/* Brand mark and welcoming copy */}
          <div className="mb-10 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.45, ease: 'easeOut' }}
              className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-sage to-brand-teal/90 shadow-[0_12px_30px_rgba(92,139,137,0.35)]"
            >
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-2xl font-display font-semibold text-white">P</span>
              </div>
            </motion.div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-proofound-charcoal">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-neutral-dark-500">
              Sign in to continue your work in Proofound.
            </p>
          </div>

          {/* Account type toggle mirrors the Figma pill control */}
          <div className="mb-8 flex gap-2 rounded-full bg-proofound-stone/50 p-1">
            <button
              type="button"
              onClick={() => setAccountType('individual')}
              className={`flex-1 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                accountType === 'individual'
                  ? 'bg-brand-sage text-white shadow-[0_12px_24px_-12px_rgba(28,77,58,0.65)]'
                  : 'text-neutral-dark-500 hover:text-proofound-charcoal'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <User className="h-4 w-4" />
                Individual
              </span>
            </button>
            <button
              type="button"
              onClick={() => setAccountType('organization')}
              className={`flex-1 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                accountType === 'organization'
                  ? 'bg-brand-sage text-white shadow-[0_12px_24px_-12px_rgba(28,77,58,0.65)]'
                  : 'text-neutral-dark-500 hover:text-proofound-charcoal'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Building2 className="h-4 w-4" />
                Organization
              </span>
            </button>
          </div>

          {/* Friendly error surface aligned with brand colors */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-2xl border border-[#B5542D]/25 bg-[#B5542D]/10 px-4 py-3"
            >
              <p className="text-sm font-medium text-[#8A3F21]">{error}</p>
            </motion.div>
          )}

          {/* Email + password form in Figma typography */}
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="flex items-center gap-2 text-sm text-neutral-dark-500"
              >
                <Mail className="h-4 w-4 text-brand-sage" />
                Email address
              </Label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-sage"
                  aria-hidden="true"
                />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-2xl border-proofound-stone/80 bg-white/90 pl-12 text-base text-proofound-charcoal placeholder:text-neutral-dark-400 focus-visible:border-brand-sage focus-visible:ring-brand-sage/40"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="flex items-center gap-2 text-sm text-neutral-dark-500"
              >
                <Lock className="h-4 w-4 text-brand-sage" />
                Password
              </Label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-sage"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-2xl border-proofound-stone/80 bg-white/90 pl-12 pr-12 text-base text-proofound-charcoal placeholder:text-neutral-dark-400 focus-visible:border-brand-sage focus-visible:ring-brand-sage/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-dark-400 transition-colors hover:text-proofound-charcoal"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label
                htmlFor="remember"
                className="flex cursor-pointer items-center gap-2 text-sm text-neutral-dark-500"
              >
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                Remember me
              </label>
              <button
                type="button"
                className="text-sm font-medium text-brand-teal transition-colors hover:text-brand-teal/80"
                onClick={() => router.push('/reset-password')}
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="w-full rounded-full bg-brand-sage py-6 text-base font-semibold text-white shadow-[0_18px_32px_-18px_rgba(28,77,58,0.7)] transition-transform hover:scale-[1.01] hover:bg-brand-sage/90"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          {/* Divider with soft typography */}
          <div className="relative my-7">
            <Separator className="bg-proofound-stone/70" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 px-3 text-[11px] tracking-[0.16em] text-neutral-dark-400 uppercase">
              Or continue with
            </span>
          </div>

          {/* Social sign-in mirrors the rounded Figma buttons */}
          <SocialSignInButtons className="space-y-3" />

          {/* Create account helper */}
          <div className="mt-7 text-center text-sm text-neutral-dark-500">
            <span>Don&apos;t have an account? </span>
            <button
              type="button"
              onClick={onCreateAccount || (() => router.push('/signup'))}
              className="font-semibold text-brand-teal transition-colors hover:text-brand-teal/80"
            >
              Create account
            </button>
          </div>
        </Card>

        {/* Legal copy stays subtle */}
        <p className="mt-8 text-center text-xs text-neutral-dark-400">
          By signing in, you agree to our{' '}
          <a href="/terms" className="underline underline-offset-2 hover:text-proofound-charcoal">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="underline underline-offset-2 hover:text-proofound-charcoal">
            Privacy Policy
          </a>
        </p>
      </motion.div>
    </div>
  );
}
