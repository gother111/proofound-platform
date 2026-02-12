import type { Metadata } from 'next';
import { SignupForm } from '@/components/auth/SignupForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Individual Sign Up | Proofound',
  description: 'Create your individual Proofound account.',
};

export default function IndividualSignupPage() {
  return <SignupForm accountType="individual" />;
}
