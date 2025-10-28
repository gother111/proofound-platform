'use client';

import { useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
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
      type="submit"
      className="w-full rounded-xl bg-proofound-forest py-[14px] text-[15px] font-semibold tracking-[0.01em] text-white shadow-sm transition-all hover:-translate-y-[1px] hover:bg-[#2D5D4A] hover:shadow-md disabled:bg-[#E8E6DD] disabled:text-[#2D3330]/40"
      size="lg"
      disabled={pending}
    >
      {pending ? 'Creating account…' : children}
    </Button>
  );
}

export function SignupForm({ accountType, onBack }: SignupFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const personaValue = useMemo(
    () => (accountType === 'organization' ? 'org_member' : 'individual'),
    [accountType]
  );

  const [formState, formAction] = useFormState(signUp, INITIAL_STATE);
  const state = formState ?? INITIAL_STATE;
  const errorMessage = clientError ?? state.error;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    setClientError(null);

    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (trimmedPassword !== trimmedConfirmPassword) {
      event.preventDefault();
      setClientError('Passwords do not match');
      return;
    }

    if (trimmedPassword.length < 8) {
      event.preventDefault();
      setClientError('Password must be at least 8 characters');
    }
  };

  if (state.success) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F7F6F1] px-6 py-16 text-[#2D3330]">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <NetworkBackground />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(28,77,58,0.08),transparent_55%),radial-gradient(circle_at_85%_80%,rgba(199,107,74,0.07),transparent_65%)]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md px-4"
        >
          <Card className="mx-auto rounded-[24px] border border-[#E8E6DD] bg-white/95 p-10 text-center shadow-[0_4px_24px_rgba(29,51,48,0.08)]">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ${
                accountType === 'organization'
                  ? 'bg-proofound-terracotta shadow-[0_8px_18px_rgba(199,107,74,0.32)]'
                  : 'bg-proofound-forest shadow-[0_8px_18px_rgba(28,77,58,0.28)]'
              }`}
            >
              <CheckCircle2 className="h-8 w-8 text-white" />
            </motion.div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-[#2D3330]">
              Check your email
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#2D333099]">
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
            <p className="mt-4 text-sm leading-6 text-[#2D333099]">
              Click the link in the email to verify your account and complete your registration.
            </p>
            <Button
              onClick={() => router.push('/login')}
              variant="outline"
              className={`mt-6 border-[#E8E6DD] ${
                accountType === 'organization'
                  ? 'text-proofound-terracotta hover:border-proofound-terracotta hover:bg-proofound-terracotta/5'
                  : 'text-proofound-forest hover:border-proofound-forest hover:bg-proofound-forest/5'
              }`}
            >
              Return to login
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F7F6F1] px-6 py-16 text-[#2D3330]">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <NetworkBackground />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(28,77,58,0.08),transparent_55%),radial-gradient(circle_at_85%_80%,rgba(199,107,74,0.07),transparent_65%)]" />

      {/* Back Button */}
      {onBack && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="absolute left-6 top-6 flex items-center gap-2 text-[#2D333099] transition-colors hover:text-[#2D3330]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </motion.button>
      )}

      {/* Signup Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <Card className="mx-auto rounded-[24px] border border-[#E8E6DD] bg-white/95 p-10 shadow-[0_4px_24px_rgba(29,51,48,0.08)] backdrop-blur">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4"
            >
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
            </motion.div>
            <h1 className="font-display text-[28px] font-semibold leading-9 tracking-[-0.01em] text-[#2D3330]">
              Create your {accountType} account
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#2D333099]">
              Join Proofound and start building credibility.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-2xl border border-[#B5542D]/25 bg-[#B5542D]/10 px-4 py-3"
            >
              <p className="text-sm font-medium text-[#8A3F21]">{error}</p>
            </motion.div>
          )}

          {/* Signup Form */}
          <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
            <input type="hidden" name="persona" value={personaValue} />
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.08em] text-[#2D3330]"
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
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`h-11 rounded-xl border border-[#E8E6DD] bg-white pl-12 pr-4 text-[15px] text-[#2D3330] placeholder:text-[#2D3330]/40 transition-all focus-visible:border-2 focus-visible:px-[43px] focus-visible:ring-[3px] ${
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
                className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.08em] text-[#2D3330]"
              >
                <Lock
                  className={`h-4 w-4 ${accountType === 'organization' ? 'text-proofound-terracotta' : 'text-proofound-forest'}`}
                />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  disabled={false}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className={`h-11 rounded-xl border border-[#E8E6DD] bg-white pl-12 pr-12 text-[15px] text-[#2D3330] placeholder:text-[#2D3330]/40 transition-all focus-visible:border-2 focus-visible:px-[43px] focus-visible:ring-[3px] ${
                    accountType === 'organization'
                      ? 'focus-visible:border-proofound-terracotta focus-visible:ring-proofound-terracotta/10'
                      : 'focus-visible:border-proofound-forest focus-visible:ring-proofound-forest/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2D333099] transition-colors hover:text-[#2D3330]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirm-password"
                className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.08em] text-[#2D3330]"
              >
                <Lock
                  className={`h-4 w-4 ${accountType === 'organization' ? 'text-proofound-terracotta' : 'text-proofound-forest'}`}
                />
                Confirm password
              </Label>
              <Input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                disabled={false}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className={`h-11 rounded-xl border border-[#E8E6DD] bg-white px-4 text-[15px] text-[#2D3330] placeholder:text-[#2D3330]/40 transition-all focus-visible:border-2 focus-visible:px-[15px] focus-visible:ring-[3px] ${
                  accountType === 'organization'
                    ? 'focus-visible:border-proofound-terracotta focus-visible:ring-proofound-terracotta/10'
                    : 'focus-visible:border-proofound-forest focus-visible:ring-proofound-forest/10'
                }`}
              />
            </div>

            <SignupSubmitButton>
              {accountType === 'organization' ? 'Create organization account' : 'Create account'}
            </SignupSubmitButton>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <Separator className="bg-[#E8E6DD]" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-center text-xs font-medium uppercase tracking-[0.16em] text-[#2D333099]">
              Or continue with
            </span>
          </div>

          {/* Social Sign In - Using existing configured component */}
          <SocialSignInButtons />

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#2D333099]">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/login')}
                className={`font-medium hover:underline ${
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
        <p className="mt-6 text-center text-xs text-[#2D333099]">
          By creating an account, you agree to our{' '}
          <a
            href="/terms"
            className={`font-medium underline underline-offset-2 ${
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
            className={`font-medium underline underline-offset-2 ${
              accountType === 'organization'
                ? 'text-proofound-terracotta hover:text-[#B5673F]'
                : 'text-proofound-forest hover:text-[#2D5D4A]'
            }`}
          >
            Privacy Policy
          </a>
        </p>
      </motion.div>
    </div>
  );
}
