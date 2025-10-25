'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { signIn, type SignInState } from '@/actions/auth';
import SocialSignInButtons from '@/components/auth/social-sign-in-buttons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PERSONA, type PersonaValue } from '@/constants/persona';

const initialState: SignInState = {
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Logging in...' : 'Log in'}
    </Button>
  );
}

type PersonaChoice = 'auto' | PersonaValue;

const personaOptions: { value: PersonaChoice; title: string; description: string }[] = [
  {
    value: 'auto',
    title: 'Smart default',
    description: 'We will route you based on your most recent membership.',
  },
  {
    value: PERSONA.INDIVIDUAL,
    title: 'Individual',
    description: 'Go to your personal dashboard and profile.',
  },
  {
    value: PERSONA.ORG_MEMBER,
    title: 'Organization',
    description: 'Jump into your organization workspace.',
  },
];

export default function LoginPage() {
  const [state, formAction] = useFormState(signIn, initialState);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [personaChoice, setPersonaChoice] = useState<PersonaChoice>('auto');
  const [organizationSlug, setOrganizationSlug] = useState('');

  const selectedPersona: PersonaValue | null = useMemo(() => {
    if (personaChoice === 'auto') {
      return null;
    }
    return personaChoice;
  }, [personaChoice]);

  const personaForForm = selectedPersona ?? '';
  const slugForForm =
    selectedPersona === PERSONA.ORG_MEMBER && organizationSlug.trim().length > 0
      ? organizationSlug.trim().toLowerCase()
      : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-display font-semibold text-primary-500 mb-2">Welcome back</h1>
        <p className="text-neutral-dark-600 mb-6">Log in to your Proofound account</p>

        <div className="mb-6 space-y-3">
          <p className="text-sm font-medium text-neutral-dark-700">
            Choose how you want to continue
          </p>
          <fieldset className="space-y-2">
            <legend className="sr-only">Persona</legend>
            {personaOptions.map((option) => {
              const isSelected = option.value === personaChoice;
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
          {personaChoice === PERSONA.ORG_MEMBER ? (
            <div className="space-y-2">
              <Label htmlFor="organizationSlug">Organization slug (optional)</Label>
              <Input
                id="organizationSlug"
                name="organizationSlug-input"
                type="text"
                placeholder="your-organization"
                autoCapitalize="none"
                autoComplete="organization"
                value={organizationSlug}
                onChange={(event) => setOrganizationSlug(event.target.value)}
                aria-describedby={state.error ? 'login-error' : undefined}
              />
              <p className="text-xs text-neutral-dark-500">
                We&apos;ll open this organization if you&apos;re a member. Leave blank to use your
                most recent organization.
              </p>
            </div>
          ) : null}
        </div>

        <SocialSignInButtons
          className="mb-6"
          persona={selectedPersona}
          organizationSlug={slugForForm || null}
        />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <span className="w-full border-t border-neutral-light-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="px-2 bg-white text-neutral-dark-500">Or continue with email</span>
          </div>
        </div>

        {state.error && (
          <div
            id="login-error"
            role="alert"
            className="mb-6 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
          >
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-6">
          <input type="hidden" name="persona" value={personaForForm} />
          <input type="hidden" name="organizationSlug" value={slugForForm} />

          <div className="space-y-2">
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
              aria-describedby={state.error ? 'login-error' : undefined}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <SubmitButton />
        </form>

        <div className="mt-6 text-center">
          <Link href="/reset-password" className="text-sm text-primary-600 hover:text-primary-700">
            Forgot password?
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-light-300 text-center">
          <p className="text-sm text-neutral-dark-600">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
