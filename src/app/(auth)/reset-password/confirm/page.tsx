import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ConfirmResetPasswordForm } from './ConfirmResetPasswordForm';

export const dynamic = 'force-dynamic';

export default function ConfirmResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-secondary-100">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      }
    >
      <ConfirmResetPasswordForm />
    </Suspense>
  );
}
