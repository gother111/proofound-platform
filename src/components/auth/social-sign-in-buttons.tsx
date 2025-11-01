'use client';

import { signInWithOAuth, type OAuthState } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

type Provider = 'google' | 'linkedin_oidc';

type SocialSignInButtonsProps = {
  className?: string;
};

const initialState: OAuthState = {
  error: null,
};

export default function SocialSignInButtons({ className }: SocialSignInButtonsProps) {
  const [state, formAction] = useFormState(signInWithOAuth, initialState);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-1 gap-3">
        <OAuthProviderForm provider="google" label="Google" action={formAction}>
          <GoogleIcon className="h-5 w-5" aria-hidden="true" />
        </OAuthProviderForm>
        <OAuthProviderForm provider="linkedin_oidc" label="LinkedIn" action={formAction}>
          <LinkedInIcon className="h-5 w-5" aria-hidden="true" />
        </OAuthProviderForm>
      </div>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
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
};

function OAuthProviderForm({ provider, label, action, children }: OAuthProviderFormProps) {
  return (
    <form action={action} className="w-full">
      <input type="hidden" name="provider" value={provider} />
      <OAuthSubmitButton>
        <span className="mr-2">{children}</span>
        {label}
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
      className="w-full flex items-center gap-2 border-proofound-stone dark:border-border hover:bg-proofound-stone/10 dark:hover:bg-muted"
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

function LinkedInIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" focusable="false" {...props}>
      <path
        fill="#0A66C2"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
    </svg>
  );
}
