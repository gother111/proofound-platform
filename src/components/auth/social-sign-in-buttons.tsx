'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, type ReactNode } from 'react';

type Provider = 'google';

type SocialSignInButtonsProps = {
  className?: string;
};

export default function SocialSignInButtons({ className }: SocialSignInButtonsProps) {
  const [pendingProvider, setPendingProvider] = useState<Provider | null>(null);

  return (
    <div className={cn('space-y-3', className)}>
      <OAuthProviderButton
        label="Continue with Google"
        href="/api/auth/google"
        isPending={pendingProvider === 'google'}
        onRequestStart={() => setPendingProvider('google')}
      >
        <GoogleIcon className="h-4 w-4" aria-hidden="true" />
      </OAuthProviderButton>
    </div>
  );
}

type OAuthProviderButtonProps = {
  label: string;
  href: string;
  isPending: boolean;
  onRequestStart: () => void;
  children: ReactNode;
};

function OAuthProviderButton({
  label,
  href,
  isPending,
  onRequestStart,
  children,
}: OAuthProviderButtonProps) {
  return (
    <Button asChild variant="outline" className="w-full flex items-center gap-2" aria-live="polite">
      <a href={href} onClick={onRequestStart} className="flex w-full items-center gap-2">
        {isPending ? (
          <span className="flex-1 text-center">Redirecting...</span>
        ) : (
          <>
            {children}
            <span className="flex-1 text-center">{label}</span>
          </>
        )}
      </a>
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
