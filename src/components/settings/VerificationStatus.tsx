'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, ShieldCheck, Mail, Loader2, AlertCircle, XCircle } from 'lucide-react';
import { WorkEmailVerificationForm } from './WorkEmailVerificationForm';
import { VeriffVerification } from './VeriffVerification';

interface VerificationStatusData {
  verified: boolean;
  verificationMethod: 'veriff' | 'work_email' | null;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'failed';
  verifiedAt: string | null;
  workEmail: string | null;
  workEmailVerified: boolean;
}

export function VerificationStatus() {
  const [status, setStatus] = useState<VerificationStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWorkEmailForm, setShowWorkEmailForm] = useState(false);
  const [showVeriffFlow, setShowVeriffFlow] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/verification/status');
      
      if (!response.ok) {
        throw new Error('Failed to fetch verification status');
      }
      
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load verification status');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSuccess = () => {
    setShowWorkEmailForm(false);
    setShowVeriffFlow(false);
    fetchStatus(); // Refresh status
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-proofound-forest" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!status) {
    return null;
  }

  // Show verification options based on status
  if (status.verificationStatus === 'verified' && status.verified) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl">
          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-green-900 dark:text-green-100">
              Identity Verified
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Verified via {status.verificationMethod === 'veriff' ? 'Government ID' : 'Work Email'}
              {status.verifiedAt && ` on ${new Date(status.verifiedAt).toLocaleDateString()}`}
            </p>
            {status.workEmail && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Work email: {status.workEmail}
              </p>
            )}
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Your verified badge is now visible on your profile to organizations.
        </p>
      </div>
    );
  }

  if (status.verificationStatus === 'pending') {
    return (
      <div className="space-y-4">
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Verification in progress... This may take a few moments.
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={fetchStatus}
          className="w-full"
        >
          Refresh Status
        </Button>
      </div>
    );
  }

  if (status.verificationStatus === 'failed') {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Verification failed. Please try again or contact support if the issue persists.
          </AlertDescription>
        </Alert>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => setShowVeriffFlow(true)}
            className="flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Retry with Government ID
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowWorkEmailForm(true)}
            className="flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Retry with Work Email
          </Button>
        </div>
      </div>
    );
  }

  // Unverified state - show options
  if (showVeriffFlow) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setShowVeriffFlow(false)}
          className="mb-2"
        >
          ← Back to options
        </Button>
        <VeriffVerification onSuccess={handleVerificationSuccess} />
      </div>
    );
  }

  if (showWorkEmailForm) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setShowWorkEmailForm(false)}
          className="mb-2"
        >
          ← Back to options
        </Button>
        <WorkEmailVerificationForm onSuccess={handleVerificationSuccess} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Verify your identity to unlock the verified badge on your profile. Choose one of the following methods:
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Veriff Option */}
        <Card className="border-2 hover:border-proofound-forest/30 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-proofound-forest/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-proofound-forest" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Government ID Verification</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Quick and secure verification using your passport, driver's license, or national ID. Powered by Veriff.
                </p>
                <Button
                  onClick={() => setShowVeriffFlow(true)}
                  className="bg-proofound-forest hover:bg-proofound-forest/90"
                >
                  Verify with ID
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Email Option */}
        <Card className="border-2 hover:border-proofound-teal/30 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-proofound-teal/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-proofound-teal" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Work Email Verification</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Verify using your company email address. This will also link your profile to your organization.
                </p>
                <Button
                  onClick={() => setShowWorkEmailForm(true)}
                  variant="outline"
                  className="border-proofound-teal text-proofound-teal hover:bg-proofound-teal/10"
                >
                  Verify with Work Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertDescription>
          <strong>Why verify?</strong> Verified profiles get a badge that helps organizations trust your identity and improves match quality.
        </AlertDescription>
      </Alert>
    </div>
  );
}

