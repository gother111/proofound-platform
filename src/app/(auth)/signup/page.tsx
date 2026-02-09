import { SignupContent } from './SignupContent';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign Up | Proofound',
  description: 'Create your Proofound account.',
};

export default async function SignupPage({
  searchParams,
}: {
  // Next.js App Router provides searchParams as a Promise in server components.
  searchParams?: Promise<{ type?: string }>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const typeParam = sp?.type;

  const initialSignupType =
    typeParam === 'individual' || typeParam === 'organization' ? typeParam : undefined;

  return <SignupContent initialSignupType={initialSignupType} />;
}
