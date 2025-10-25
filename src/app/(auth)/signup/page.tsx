'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { signUp, type SignUpState } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SocialSignInButtons from '@/components/auth/social-sign-in-buttons';
import { PERSONA, type PersonaValue } from '@/constants/persona';

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

type PersonaChoice = PersonaValue;

const personaOptions: { value: PersonaChoice; title: string; description: string }[] = [
  {
    value: PERSONA.INDIVIDUAL,
    title: 'Individual',
    description: 'Create a personal profile and explore opportunities for yourself.',
  },
  {
    value: PERSONA.ORG_MEMBER,
    title: 'Organization',
    description: 'Represent an organization, invite team members, and manage your impact.',
  },
];

export default function SignUpPage() {
  const [state, formAction] = useFormState(signUp, initialState);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [personaChoice, setPersonaChoice] = useState<PersonaChoice>(PERSONA.INDIVIDUAL);

  useEffect(() => {
    if (state.success) {
      setPassword('');
    }
  }, [state.success]);

  const personaForForm = useMemo(() => personaChoice, [personaChoice]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-display font-semibold text-primary-500 mb-2">
          Create your account
        </h1>
        <p className="text-neutral-dark-600 mb-8">Join Proofound and get started</p>

        <div className="mb-6 space-y-3">
          <p className="text-sm font-medium text-neutral-dark-700">How will you use Proofound?</p>
          <fieldset className="space-y-2">
            <legend className="sr-only">Persona</legend>
            {personaOptions.map((option) => {
              const isSelected = personaChoice === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPersonaChoice(option.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                    isSelected
                      ? 'border-primary-400 bg-primary-50 text-primary-800'
                      : 'border-neutral-light-300 hover:border-primary-300'
                  }`}
                  aria-pressed={isSelected}
                >
                  <span className="block text-sm font-semibold">{option.title}</span>
                  <span className="block text-xs text-neutral-dark-500">{option.description}</span>
                </button>
              );
            })}
          </fieldset>
        </div>

        <SocialSignInButtons className="mb-6" persona={personaForForm} />

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
          <input type="hidden" name="persona" value={personaForForm} />

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
