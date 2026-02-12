import type { Metadata } from 'next';
import { SignupForm } from '@/components/auth/SignupForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Organization Sign Up | Proofound',
  description: 'Create your organization Proofound account.',
};

export default function OrganizationSignupPage() {
  return <SignupForm accountType="organization" />;
}
