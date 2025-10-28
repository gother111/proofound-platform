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
import { NetworkBackground } from '@/components/NetworkBackground';
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F7F6F1] px-6 py-16 text-[#2D3330]">
      {/* Network background from design system */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <NetworkBackground />
      </div>

      {/* Warm glow overlay to match Figma lighting */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(28,77,58,0.08),transparent_55%),radial-gradient(circle_at_85%_80%,rgba(199,107,74,0.07),transparent_60%)]" />

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
        className="relative z-10 w-full max-w-[480px] px-4"
      >
        <Card className="mx-auto overflow-hidden rounded-[24px] border border-[#E8E6DD] bg-white/95 p-12 shadow-[0_4px_24px_rgba(29,51,48,0.08)] backdrop-blur">
          {/* Brand mark and welcoming copy */}
          <div className="mb-10 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.45, ease: 'easeOut' }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-proofound-forest shadow-[0_8px_18px_rgba(28,77,58,0.28)]"
            >
              <span className="text-2xl font-display font-semibold text-white">P</span>
            </motion.div>
            <h1 className="font-display text-[28px] font-semibold leading-9 tracking-[-0.01em] text-[#2D3330]">
              Welcome back
            </h1>
            <p className="mt-3 text-[15px] leading-[22px] text-[#2D333099]">
              Sign in to continue to Proofound
            </p>
          </div>

          {/* Account type toggle mirrors the Figma pill control */}
          <div className="mb-8 flex gap-2 rounded-full bg-[#E8E6DD]/60 p-1">
            <button
              type="button"
              onClick={() => setAccountType('individual')}
              className={`flex-1 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                accountType === 'individual'
                  ? 'bg-proofound-forest text-white shadow-[0_12px_24px_-12px_rgba(28,77,58,0.45)]'
                  : 'text-[#2D333099] hover:text-[#2D3330]'
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
                  ? 'bg-proofound-forest text-white shadow-[0_12px_24px_-12px_rgba(28,77,58,0.45)]'
                  : 'text-[#2D333099] hover:text-[#2D3330]'
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
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.08em] text-[#2D3330]"
              >
                <Mail className="h-4 w-4 text-proofound-forest" />
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
                  className="h-11 rounded-xl border border-[#E8E6DD] bg-white pl-12 pr-4 text-[15px] text-[#2D3330] placeholder:text-[#2D3330]/40 transition-all focus-visible:border-2 focus-visible:border-proofound-forest focus-visible:px-[43px] focus-visible:ring-[3px] focus-visible:ring-proofound-forest/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.08em] text-[#2D3330]"
              >
                <Lock className="h-4 w-4 text-proofound-forest" />
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
                  className="h-11 rounded-xl border border-[#E8E6DD] bg-white pl-12 pr-12 text-[15px] text-[#2D3330] placeholder:text-[#2D3330]/40 transition-all focus-visible:border-2 focus-visible:border-proofound-forest focus-visible:px-[43px] focus-visible:ring-[3px] focus-visible:ring-proofound-forest/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2D333099] transition-colors hover:text-[#2D3330]"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
              <button
                type="button"
                className="text-[14px] font-medium text-proofound-forest transition-colors hover:text-[#2D5D4A]"
                onClick={() => router.push('/reset-password')}
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="w-full rounded-xl bg-proofound-forest py-[14px] text-[15px] font-semibold tracking-[0.01em] text-white shadow-sm transition-all hover:-translate-y-[1px] hover:bg-[#2D5D4A] hover:shadow-md disabled:bg-[#E8E6DD] disabled:text-[#2D3330]/40"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          {/* Divider with soft typography */}
          <div className="relative my-7">
            <Separator className="bg-[#E8E6DD]" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-xs font-medium uppercase tracking-[0.16em] text-[#2D333099]">
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
              className="font-medium text-proofound-forest transition-colors hover:text-[#2D5D4A]"
            >
              Create account
            </button>
          </div>
        </Card>

        {/* Legal copy stays subtle */}
        <p className="mt-8 text-center text-xs text-[#2D333099]">
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
