"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { trackSignUp } from '@/lib/analytics';
import { getErrorMessage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Mail, Lock, CheckCircle2, User, X } from 'lucide-react';

interface IndividualSignupProps {
  onClose?: () => void;
  onComplete?: () => void;
}

type SignupStep = 'email' | 'password' | 'verification' | 'success';

export function IndividualSignup({ onClose, onComplete }: IndividualSignupProps) {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setError(null);
    setStep('password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;

    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            account_type: 'individual',
          }
        }
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        await trackSignUp('email');

        // Check if email confirmation is required
        if (data.session) {
          // User is auto-confirmed, create profile and redirect
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: email,
              account_type: 'individual',
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
          }

          // Redirect to home dashboard
          setStep('success');
          setTimeout(() => {
            router.push('/home');
            router.refresh();
          }, 1500);
        } else {
          // Email confirmation required
          setStep('verification');
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Just show success message - actual verification happens via email link
    setStep('success');
  };

  const getStepTitle = () => {
    switch (step) {
      case 'email':
        return 'Create your account';
      case 'password':
        return 'Secure your account';
      case 'verification':
        return 'Verify your email';
      case 'success':
        return 'Welcome to Proofound!';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'email':
        return 'Enter your email address to get started';
      case 'password':
        return 'Choose a strong password for your account';
      case 'verification':
        return `We've sent a verification link to ${email}`;
      case 'success':
        return 'Your account has been created successfully';
    }
  };

  const handleClose = () => {
    onClose?.() || router.push('/');
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#7A9278]/5 to-[#5C8B89]/5 -z-10" />

          {/* Back button */}
          {step === 'password' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep('email')}
              className="absolute top-4 left-4"
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}

          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute top-4 right-4"
            disabled={isLoading}
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#E8E6DD' }}
          >
            {step === 'success' ? (
              <CheckCircle2 className="w-8 h-8" style={{ color: '#4A5943' }} />
            ) : (
              <User className="w-8 h-8" style={{ color: '#6B6760' }} />
            )}
          </motion.div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl mb-2" style={{ color: '#2D3330' }}>
              {getStepTitle()}
            </h2>
            <p className="text-sm" style={{ color: '#6B6760' }}>
              {getStepDescription()}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-lg bg-destructive/10 border border-destructive/20 p-4"
            >
              <p className="text-sm text-destructive font-medium">{error}</p>
            </motion.div>
          )}

          {/* Forms */}
          <AnimatePresence mode="wait">
            {step === 'email' && (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleEmailSubmit}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm" style={{ color: '#6B6760' }}>
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6B6760' }} />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  style={{ backgroundColor: '#4A5943', color: '#F7F6F1' }}
                >
                  Continue
                </Button>

                <p className="text-xs text-center" style={{ color: '#6B6760' }}>
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
              </motion.form>
            )}

            {step === 'password' && (
              <motion.form
                key="password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handlePasswordSubmit}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm" style={{ color: '#6B6760' }}>
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6B6760' }} />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10"
                      autoFocus
                      required
                      minLength={8}
                    />
                  </div>
                  <p className="text-xs" style={{ color: '#6B6760' }}>
                    Must be at least 8 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm" style={{ color: '#6B6760' }}>
                    Confirm password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6B6760' }} />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="pl-10"
                      required
                      minLength={8}
                    />
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive">
                      Passwords do not match
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  style={{ backgroundColor: '#4A5943', color: '#F7F6F1' }}
                  disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
                >
                  {isLoading ? 'Creating account...' : 'Create account'}
                </Button>
              </motion.form>
            )}

            {step === 'verification' && (
              <motion.div
                key="verification"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center py-8">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 mx-auto mb-6 rounded-full bg-sage/20 flex items-center justify-center"
                  >
                    <Mail className="w-10 h-10 text-sage" />
                  </motion.div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Please check your email and click the verification link to complete your signup.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Didn't receive the email?{' '}
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => {/* Resend logic */}}
                    >
                      Resend
                    </button>
                  </p>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#E8F5E9' }}>
                  <CheckCircle2 className="w-10 h-10" style={{ color: '#4A5943' }} />
                </div>
                <p className="text-sm" style={{ color: '#6B6760' }}>
                  Redirecting to your profile...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sign In Link */}
          {step === 'email' && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}

