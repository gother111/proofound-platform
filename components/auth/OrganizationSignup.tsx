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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Mail, Lock, CheckCircle2, Building2, X } from 'lucide-react';

interface OrganizationSignupProps {
  onClose?: () => void;
  onComplete?: () => void;
}

type SignupStep = 'details' | 'auth' | 'verification' | 'success';

export function OrganizationSignup({ onClose, onComplete }: OrganizationSignupProps) {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>('details');
  const [companyName, setCompanyName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [organizationType, setOrganizationType] = useState<'profit' | 'non-profit'>('non-profit');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !legalName) return;
    
    setError(null);
    setStep('auth');
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) return;
    
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
      
      // Create auth account
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            account_type: 'organization',
            company_name: companyName,
            legal_name: legalName,
            organization_type: organizationType,
          }
        }
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        await trackSignUp('email');
        setStep('verification');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length === 6) {
      setStep('success');
      setTimeout(() => {
        onComplete?.() || router.push('/home');
      }, 2000);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'details':
        return 'Organization details';
      case 'auth':
        return 'Admin account';
      case 'verification':
        return 'Verify your email';
      case 'success':
        return 'Welcome to Proofound!';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'details':
        return 'Tell us about your organization';
      case 'auth':
        return 'Set up your admin credentials';
      case 'verification':
        return `We've sent a verification link to ${email}`;
      case 'success':
        return 'Your organization has been created successfully';
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
          <div className="absolute inset-0 bg-gradient-to-br from-proofound-terracotta/5 to-ochre/5 -z-10" />

          {/* Back button */}
          {(step === 'auth' || step === 'verification') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(step === 'auth' ? 'details' : 'auth')}
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
            className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-proofound-terracotta to-ochre flex items-center justify-center"
          >
            {step === 'success' ? (
              <CheckCircle2 className="w-8 h-8 text-white" />
            ) : (
              <Building2 className="w-8 h-8 text-white" />
            )}
          </motion.div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-display font-semibold text-foreground mb-2">
              {getStepTitle()}
            </h2>
            <p className="text-sm text-muted-foreground">
              {getStepDescription()}
            </p>
          </div>

          {/* Progress Indicator */}
          {step !== 'success' && (
            <div className="flex gap-2 mb-8">
              <div className={`h-1 flex-1 rounded-full transition-colors ${step === 'details' || step === 'auth' || step === 'verification' ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`h-1 flex-1 rounded-full transition-colors ${step === 'auth' || step === 'verification' ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`h-1 flex-1 rounded-full transition-colors ${step === 'verification' ? 'bg-primary' : 'bg-muted'}`} />
            </div>
          )}

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
            {step === 'details' && (
              <motion.form
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleDetailsSubmit}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    Company name
                  </Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Corp"
                    autoFocus
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legalName">
                    Legal name
                  </Label>
                  <Input
                    id="legalName"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    placeholder="Acme Corporation Ltd."
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label>Organization type</Label>
                  <RadioGroup
                    value={organizationType}
                    onValueChange={(value: string) => setOrganizationType(value as 'profit' | 'non-profit')}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="non-profit" id="non-profit" />
                      <Label htmlFor="non-profit" className="font-normal cursor-pointer">
                        Non-profit / Social Good
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="profit" id="profit" />
                      <Label htmlFor="profit" className="font-normal cursor-pointer">
                        For-profit
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Continue
                </Button>
              </motion.form>
            )}

            {step === 'auth' && (
              <motion.form
                key="auth"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleAuthSubmit}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    Admin email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@company.com"
                    autoFocus
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirm password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? 'Creating organization...' : 'Create organization'}
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
                    className="w-20 h-20 mx-auto mb-6 rounded-full bg-proofound-terracotta/20 flex items-center justify-center"
                  >
                    <Mail className="w-10 h-10 text-proofound-terracotta" />
                  </motion.div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Please check your email and click the verification link to complete your organization setup.
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
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-20 h-20 mx-auto mb-6 rounded-full bg-proofound-terracotta/20 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-12 h-12 text-proofound-terracotta" />
                </motion.div>
                <p className="text-muted-foreground">
                  Redirecting to your dashboard...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sign In Link */}
          {step === 'details' && (
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

