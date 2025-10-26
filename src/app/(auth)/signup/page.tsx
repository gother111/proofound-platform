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
    <Button type="submit" className="w-full" disabled={pending}>
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
      <div className="min-h-screen flex items-center justify-center bg-secondary-100 px-4 py-12">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-semibold text-primary-500 mb-2">
              Welcome to Proofound
            </h1>
            <p className="text-lg text-neutral-dark-600">Choose how you want to use Proofound</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card
              className="border-2 hover:border-primary-300 transition-colors cursor-pointer group"
              onClick={() => {
                setPersona('individual');
                setStep('credentials');
              }}
            >
              <CardHeader className="text-center space-y-4 p-8">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                  <User className="w-8 h-8 text-primary-500" />
                </div>
                <div>
                  <CardTitle className="mb-2">Individual</CardTitle>
                  <CardDescription className="text-base">
                    Build your personal profile, showcase your skills, and connect with
                    opportunities
                  </CardDescription>
                </div>
                <Button className="w-full" size="lg">
                  Continue as Individual
                </Button>
              </CardHeader>
            </Card>

            <Card
              className="border-2 hover:border-primary-300 transition-colors cursor-pointer group"
              onClick={() => {
                setPersona('org_member');
                setStep('credentials');
              }}
            >
              <CardHeader className="text-center space-y-4 p-8">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                  <Building2 className="w-8 h-8 text-primary-500" />
                </div>
                <div>
                  <CardTitle className="mb-2">Organization</CardTitle>
                  <CardDescription className="text-base">
                    Create an organization, manage your team, and build credibility together
                  </CardDescription>
                </div>
                <Button className="w-full" size="lg">
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
    <div className="min-h-screen flex items-center justify-center bg-secondary-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <div className="mb-6">
          <button
            onClick={() => setStep('persona')}
            className="text-sm text-neutral-dark-600 hover:text-primary-500 transition-colors flex items-center gap-2 mb-4"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
              <span className="text-white text-sm font-medium">2</span>
            </div>
            <h1 className="text-2xl font-display font-semibold text-primary-500">
              Create your account
            </h1>
          </div>
          <p className="text-neutral-dark-600">
            Join Proofound as an {persona === 'individual' ? 'Individual' : 'Organization'}
          </p>
        </div>

        <SocialSignInButtons className="mb-6" />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <span className="w-full border-t border-neutral-light-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="px-2 bg-white text-neutral-dark-500">Or continue with email</span>
          </div>
        </div>

        {state.error && !state.success && (
          <div
            id="signup-error"
            role="alert"
            className="mb-6 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
          >
            {state.error}
          </div>
        )}

        {state.success && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
          >
            Check {email || 'your email'} for a verification link to finish setting up your account.
          </div>
        )}

        <form action={formAction} className="space-y-6">
          <input type="hidden" name="persona" value={persona || ''} />

          <div>
            <Label htmlFor="email">Email</Label>
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
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
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
            />
          </div>

          <SubmitButton />
        </form>

        <div className="mt-8 pt-6 border-t border-neutral-light-300 text-center">
          <p className="text-sm text-neutral-dark-600">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
