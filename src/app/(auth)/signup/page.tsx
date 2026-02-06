import { SignupContent } from './SignupContent';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign Up | Proofound',
  description: 'Create your Proofound account.',
};

export default function SignupPage() {
  return <SignupContent />;
}
