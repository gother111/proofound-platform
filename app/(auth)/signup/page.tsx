"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IndividualSignup } from '@/components/auth/IndividualSignup';
import { OrganizationSignup } from '@/components/auth/OrganizationSignup';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { User, Building2, ArrowLeft } from 'lucide-react';

type SignupType = 'choose' | 'individual' | 'organization';

export default function SignupPage() {
  const router = useRouter();
  const [signupType, setSignupType] = useState<SignupType>('choose');

  if (signupType === 'individual') {
    return (
      <IndividualSignup 
        onClose={() => setSignupType('choose')}
        onComplete={() => router.push('/home')}
      />
    );
  }

  if (signupType === 'organization') {
    return (
      <OrganizationSignup 
        onClose={() => setSignupType('choose')}
        onComplete={() => router.push('/home')}
      />
    );
  }

  // Account type selection screen
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20 dark:opacity-10">
        <svg className="w-full h-full">
          <defs>
            <pattern id="signup-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="2" fill="currentColor" className="text-sage" />
              <path d="M 30 30 L 45 45 M 30 30 L 15 15" stroke="currentColor" strokeWidth="0.5" className="text-sage" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#signup-pattern)" />
        </svg>
      </div>

      {/* Floating Shapes */}
      <motion.div
        className="absolute top-20 left-20 w-32 h-32 rounded-full bg-gradient-to-br from-sage/10 to-teal/10 blur-3xl"
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-40 h-40 rounded-full bg-gradient-to-br from-proofound-terracotta/10 to-ochre/10 blur-3xl"
        animate={{
          x: [0, -20, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Back to Home */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.push('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </motion.button>

      {/* Account Type Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl relative z-10"
      >
        <Card className="p-8 md:p-12 backdrop-blur-sm bg-card/95">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-proofound-forest to-sage flex items-center justify-center">
                <span className="text-2xl font-display text-white">P</span>
              </div>
            </motion.div>
            <h1 className="text-3xl font-display font-semibold text-foreground mb-3">
              Join Proofound
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Choose your account type to get started
            </p>
          </div>

          {/* Account Type Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Individual Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={() => setSignupType('individual')}
                className="w-full h-full text-left group"
              >
                <Card className="p-8 h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50 group-hover:scale-[1.02]">
                  <div className="flex flex-col items-start gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-sage/20 to-teal/20 group-hover:from-sage/30 group-hover:to-teal/30 transition-colors">
                      <User className="w-8 h-8 text-sage" />
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-semibold text-foreground mb-2">
                        Individual
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        For professionals looking to showcase expertise, get matched with opportunities, and build verified credentials.
                      </p>
                    </div>
                    <div className="mt-auto">
                      <span className="text-sm text-primary font-medium group-hover:underline">
                        Continue as Individual →
                      </span>
                    </div>
                  </div>
                </Card>
              </button>
            </motion.div>

            {/* Organization Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <button
                onClick={() => setSignupType('organization')}
                className="w-full h-full text-left group"
              >
                <Card className="p-8 h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50 group-hover:scale-[1.02]">
                  <div className="flex flex-col items-start gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-proofound-terracotta/20 to-ochre/20 group-hover:from-proofound-terracotta/30 group-hover:to-ochre/30 transition-colors">
                      <Building2 className="w-8 h-8 text-proofound-terracotta" />
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-semibold text-foreground mb-2">
                        Organization
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        For organizations seeking verified experts, posting assignments, and building trusted teams.
                      </p>
                    </div>
                    <div className="mt-auto">
                      <span className="text-sm text-primary font-medium group-hover:underline">
                        Continue as Organization →
                      </span>
                    </div>
                  </div>
                </Card>
              </button>
            </motion.div>
          </div>

          {/* Sign In Link */}
          <div className="mt-10 text-center">
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
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By creating an account, you agree to our{' '}
          <a href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </a>
        </p>
      </motion.div>
    </div>
  );
}
