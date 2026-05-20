'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';

interface VeriffVerificationProps {
  onSuccess: () => void;
}

export function VeriffVerification({ onSuccess }: VeriffVerificationProps) {
  return (
    <div className="space-y-4">
      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertDescription>
          Third-party ID verification is archived outside the locked launch corridor. Use work
          email, Proof Pack verification requests, and organization review consent for current
          launch checks.
        </AlertDescription>
      </Alert>

      <Button type="button" variant="outline" disabled onClick={onSuccess} className="w-full">
        ID Verification Archived
      </Button>
    </div>
  );
}
