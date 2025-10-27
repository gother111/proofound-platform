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
          <div className="absolute inset-0 bg-gradient-to-br from-[#C67B5C]/5 to-[#D4A574]/5 -z-10" />

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
            className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#E8E6DD' }}
          >
            {step === 'success' ? (
              <CheckCircle2 className="w-8 h-8" style={{ color: '#C67B5C' }} />
            ) : (
              <Building2 className="w-8 h-8" style={{ color: '#6B6760' }} />
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

          {/* Step indicator */}
          {step !== 'success' && (
            <div className="flex gap-2 mb-6">
              {['details', 'auth', 'verification'].map((s, i) => (
                <div
                  key={s}
                  className="h-1 flex-1 rounded-full transition-colors"
                  style={{ 
                    backgroundColor: 
                      s === step || 
                      (step === 'auth' && s === 'details') ||
                      (step === 'verification' && (s === 'details' || s === 'auth'))
                        ? '#C67B5C' 
                        : '#E8E6DD' 
                  }}
                />
              ))}
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
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm" style={{ color: '#6B6760' }}>
                    Organization name
                  </Label>
                  <Input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Corporation"
                    required
                    autoFocus
                  />
                  <p className="text-xs" style={{ color: '#6B6760' }}>
                    The public-facing name of your organization
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legalName" className="text-sm" style={{ color: '#6B6760' }}>
                    Legal name
                  </Label>
                  <Input
                    id="legalName"
                    type="text"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    placeholder="Acme Corporation Ltd."
                    required
                  />
                  <p className="text-xs" style={{ color: '#6B6760' }}>
                    Official registered legal name
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm" style={{ color: '#6B6760' }}>
                    Organization type
                  </Label>
                  <RadioGroup
                    value={organizationType}
                    onValueChange={(value) => setOrganizationType(value as 'profit' | 'non-profit')}
                  >
                    <div className="flex items-center space-x-2 p-3 rounded-lg border" style={{ borderColor: organizationType === 'profit' ? '#C67B5C' : '#E8E6DD' }}>
                      <RadioGroupItem value="profit" id="profit" />
                      <Label htmlFor="profit" className="flex-1 cursor-pointer">
                        <div>
                          <div className="text-sm" style={{ color: '#2D3330' }}>For-profit</div>
                          <div className="text-xs" style={{ color: '#6B6760' }}>Commercial organization</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border" style={{ borderColor: organizationType === 'non-profit' ? '#C67B5C' : '#E8E6DD' }}>
                      <RadioGroupItem value="non-profit" id="non-profit" />
                      <Label htmlFor="non-profit" className="flex-1 cursor-pointer">
                        <div>
                          <div className="text-sm" style={{ color: '#2D3330' }}>Non-profit</div>
                          <div className="text-xs" style={{ color: '#6B6760' }}>NGO, charity, or social enterprise</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  style={{ backgroundColor: '#C67B5C', color: '#F7F6F1' }}
                >
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
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm" style={{ color: '#6B6760' }}>
                    Corporate email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6B6760' }} />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@acme.com"
                      className="pl-10"
                      required
                      autoFocus
                    />
                  </div>
                  <p className="text-xs" style={{ color: '#6B6760' }}>
                    Use your organization's domain email
                  </p>
                </div>

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
                      required
                      minLength={8}
                    />
                  </div>
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
                  style={{ backgroundColor: '#C67B5C', color: '#F7F6F1' }}
                  disabled={isLoading || !email || !password || !confirmPassword || password !== confirmPassword}
                >
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
                className="text-center space-y-4"
              >
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#FFF3E0' }}>
                  <CheckCircle2 className="w-10 h-10" style={{ color: '#C67B5C' }} />
                </div>
                <p className="text-sm" style={{ color: '#6B6760' }}>
                  Redirecting to your organization dashboard...
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

