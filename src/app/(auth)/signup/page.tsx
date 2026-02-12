import { SignupContent } from './SignupContent';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign Up | Proofound',
  description: 'Create your Proofound account.',
};

interface SignupPageProps {
  searchParams?: Promise<{ type?: string | string[] }>;
}

function normalizeSignupType(
  value: string | string[] | undefined
): 'individual' | 'organization' | null {
  if (!value) return null;

  const raw = Array.isArray(value) ? value[0] : value;
  const normalized = raw.trim().toLowerCase();

  if (normalized === 'individual') return 'individual';
  if (normalized === 'organization' || normalized === 'org' || normalized === 'org_member') {
    return 'organization';
  }

  return null;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = (await searchParams) ?? {};
  const signupType = normalizeSignupType(params.type);

  if (signupType === 'individual') {
    redirect('/signup/individual');
  }

  if (signupType === 'organization') {
    redirect('/signup/organization');
  }

  return <SignupContent />;
}
