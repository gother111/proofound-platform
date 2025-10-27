'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { signUp, type SignUpState } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Building2 } from 'lucide-react';
import SocialSignInButtons from '@/components/auth/social-sign-in-buttons';

const initialState: SignUpState = {
  error: null,
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="w-full bg-proofound-forest hover:bg-proofound-forest/90 text-white"
      disabled={pending}
    >
      {pending ? 'Creating account…' : 'Sign up'}
    </Button>
  );
}

export default function SignUpPage() {
  const [step, setStep] = useState<'persona' | 'credentials'>('persona');
  const [persona, setPersona] = useState<'individual' | 'org_member' | null>(null);
  const [state, formAction] = useFormState(signUp, initialState);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (state.success) {
      setPassword('');
    }
  }, [state.success]);

  // Show persona selection first
  if (step === 'persona') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-proofound-parchment dark:bg-background px-4 py-12">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-['Crimson_Pro'] font-semibold text-proofound-forest dark:text-primary mb-2">
              Welcome to Proofound
            </h1>
            <p className="text-lg text-proofound-charcoal/70 dark:text-muted-foreground">
              Choose how you want to use Proofound
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card
              className="border-2 border-proofound-stone hover:border-proofound-forest dark:border-border dark:hover:border-primary transition-colors cursor-pointer group rounded-2xl"
              onClick={() => {
                setPersona('individual');
                setStep('credentials');
              }}
            >
              <CardHeader className="text-center space-y-4 p-8">
                <div className="mx-auto w-16 h-16 rounded-full bg-proofound-forest/10 flex items-center justify-center group-hover:bg-proofound-forest/20 transition-colors">
                  <User className="w-8 h-8 text-proofound-forest dark:text-primary" />
                </div>
                <div>
                  <CardTitle className="mb-2 font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
                    Individual
                  </CardTitle>
                  <CardDescription className="text-base text-proofound-charcoal/70 dark:text-muted-foreground">
                    Build your personal profile, showcase your skills, and connect with
                    opportunities
                  </CardDescription>
                </div>
                <Button
                  className="w-full bg-proofound-forest hover:bg-proofound-forest/90 text-white"
                  size="lg"
                >
                  Continue as Individual
                </Button>
              </CardHeader>
            </Card>

            <Card
              className="border-2 border-proofound-stone hover:border-proofound-forest dark:border-border dark:hover:border-primary transition-colors cursor-pointer group rounded-2xl"
              onClick={() => {
                setPersona('org_member');
                setStep('credentials');
              }}
            >
              <CardHeader className="text-center space-y-4 p-8">
                <div className="mx-auto w-16 h-16 rounded-full bg-proofound-forest/10 flex items-center justify-center group-hover:bg-proofound-forest/20 transition-colors">
                  <Building2 className="w-8 h-8 text-proofound-forest dark:text-primary" />
                </div>
                <div>
                  <CardTitle className="mb-2 font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
                    Organization
                  </CardTitle>
                  <CardDescription className="text-base text-proofound-charcoal/70 dark:text-muted-foreground">
                    Create an organization, manage your team, and build credibility together
                  </CardDescription>
                </div>
                <Button
                  className="w-full bg-proofound-forest hover:bg-proofound-forest/90 text-white"
                  size="lg"
                >
                  Continue as Organization
                </Button>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show credentials form after persona selection
  return (
    <div className="min-h-screen flex items-center justify-center bg-proofound-parchment dark:bg-background px-4">
      <div className="w-full max-w-md bg-white dark:bg-card p-8 rounded-2xl shadow-lg border border-proofound-stone dark:border-border">
        <div className="mb-6">
          <button
            onClick={() => setStep('persona')}
            className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground hover:text-proofound-forest dark:hover:text-primary transition-colors flex items-center gap-2 mb-4"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-proofound-forest dark:bg-primary flex items-center justify-center">
              <span className="text-white text-sm font-medium">2</span>
            </div>
            <h1 className="text-2xl font-['Crimson_Pro'] font-semibold text-proofound-forest dark:text-primary">
              Create your account
            </h1>
          </div>
          <p className="text-proofound-charcoal/70 dark:text-muted-foreground">
            Join Proofound as an {persona === 'individual' ? 'Individual' : 'Organization'}
          </p>
        </div>

        <SocialSignInButtons className="mb-6" />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <span className="w-full border-t border-proofound-stone dark:border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="px-2 bg-white dark:bg-card text-proofound-charcoal/70 dark:text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        {state.error && !state.success && (
          <div
            id="signup-error"
            role="alert"
            className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {state.error}
          </div>
        )}

        {state.success && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 rounded-xl border border-proofound-forest/30 bg-proofound-forest/10 px-4 py-3 text-sm text-proofound-forest dark:text-primary"
          >
            Check {email || 'your email'} for a verification link to finish setting up your account.
          </div>
        )}

        <form action={formAction} className="space-y-6">
          <input type="hidden" name="persona" value={persona || ''} />

          <div>
            <Label htmlFor="email" className="text-proofound-charcoal dark:text-foreground">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-describedby={state.error && !state.success ? 'signup-error' : undefined}
              className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-proofound-charcoal dark:text-foreground">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="At least 8 characters"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
            />
          </div>

          <SubmitButton />
        </form>

        <div className="mt-8 pt-6 border-t border-proofound-stone dark:border-border text-center">
          <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-proofound-forest dark:text-primary hover:text-proofound-forest/80 dark:hover:text-primary/80 font-medium"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
