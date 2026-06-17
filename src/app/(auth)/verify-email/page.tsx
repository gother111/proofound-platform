import { Suspense } from 'react';
import { VerifyEmailContent } from './VerifyEmailContent';
import { VerifyEmailPageFallback } from './VerifyEmailPageFallback';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Verify Email | Proofound',
  description: 'Verify your Proofound account email address.',
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailPageFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
