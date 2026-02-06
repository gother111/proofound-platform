import { ResetPasswordForm } from './ResetPasswordForm';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Reset Password | Proofound',
  description: 'Request a password reset email for your Proofound account.',
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
