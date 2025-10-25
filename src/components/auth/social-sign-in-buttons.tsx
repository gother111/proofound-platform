'use client';

import { signInWithOAuth, type OAuthState } from '@/actions/auth';
import type { PersonaValue } from '@/constants/persona';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

type Provider = 'google';

type SocialSignInButtonsProps = {
  className?: string;
  persona?: PersonaValue | null;
  organizationSlug?: string | null;
};

const initialState: OAuthState = {
  error: null,
};

export default function SocialSignInButtons({
  className,
  persona = null,
  organizationSlug = null,
}: SocialSignInButtonsProps) {
  const [state, formAction] = useFormState(signInWithOAuth, initialState);

  return (
    <div className={cn('space-y-3', className)}>
      <OAuthProviderForm
        provider="google"
        label="Continue with Google"
        action={formAction}
        persona={persona}
        organizationSlug={organizationSlug}
      >
        <GoogleIcon className="h-4 w-4" aria-hidden="true" />
      </OAuthProviderForm>
      {state.error ? (
        <p className="text-sm text-error" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}

type OAuthProviderFormProps = {
  provider: Provider;
  label: string;
  action: (payload: FormData) => void;
  children: ReactNode;
  persona: PersonaValue | null;
  organizationSlug: string | null;
};

function OAuthProviderForm({
  provider,
  label,
  action,
  children,
  persona,
  organizationSlug,
}: OAuthProviderFormProps) {
  return (
    <form action={action} className="w-full">
      <input type="hidden" name="provider" value={provider} />
      <input type="hidden" name="persona" value={persona ?? ''} />
      <input type="hidden" name="organizationSlug" value={organizationSlug ?? ''} />
      <OAuthSubmitButton>
        {children}
        <span className="flex-1 text-center">{label}</span>
      </OAuthSubmitButton>
    </form>
  );
}

type OAuthSubmitButtonProps = {
  children: ReactNode;
};

function OAuthSubmitButton({ children }: OAuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      className="w-full flex items-center gap-2"
      disabled={pending}
    >
      {pending ? <span className="flex-1 text-center">Redirecting...</span> : children}
    </Button>
  );
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" focusable="false" {...props}>
      <path
        fill="#4285F4"
        d="M23.52 12.273c0-.851-.076-1.67-.218-2.455H12v4.649h6.476a5.54 5.54 0 0 1-2.403 3.635v3.02h3.888c2.276-2.095 3.559-5.184 3.559-8.849Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.955-1.074 7.94-2.918l-3.888-3.02c-1.08.724-2.46 1.152-4.052 1.152-3.116 0-5.756-2.103-6.698-4.938H1.293v3.104A11.997 11.997 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.302 14.276a7.2 7.2 0 0 1 0-4.552V6.62H1.293a12.003 12.003 0 0 0 0 10.76l4.009-3.104Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.764 0 3.348.607 4.593 1.8l3.445-3.445C17.951 1.248 15.24 0 12 0 7.347 0 3.359 2.69 1.293 6.62l4.009 3.104C6.244 6.853 8.884 4.75 12 4.75Z"
      />
    </svg>
  );
}
