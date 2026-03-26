/**
 * LinkedIn Verification Component
 *
 * Handles the user flow for LinkedIn identity verification
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api/fetch';
import {
  Linkedin,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';

interface LinkedInVerificationProps {
  onSuccess?: () => void;
  autoStart?: boolean;
  onAutoStartHandled?: () => void;
  connectedByDefault?: boolean;
}

interface AutomatedCheckResult {
  confidence: number;
  hasIdentityVerification?: boolean;
  hasWorkplaceVerification?: boolean;
  linkedinVerificationStatus: 'verified' | 'pending';
  linkedinVerificationLevel: 'identity' | 'workplace' | 'pending';
  identityGranted: boolean;
  hasVerificationBadge: boolean;
  signals?: {
    hasVerificationBadge: boolean;
    connectionCount: number | null;
    experienceCount: number;
    profileCompleteness: number;
    hasProfilePhoto: boolean;
    accountAge: 'new' | 'medium' | 'old';
  };
  recommendation: 'approve' | 'review_manually' | 'reject';
  sources: string[];
}

function getResultHeadline(result: AutomatedCheckResult) {
  if (result.linkedinVerificationStatus === 'verified') {
    if (result.linkedinVerificationLevel === 'identity') {
      return 'LinkedIn identity signal recorded';
    }

    if (result.linkedinVerificationLevel === 'workplace') {
      return 'LinkedIn workplace signal recorded';
    }
  }

  return 'LinkedIn compatibility check complete';
}

function getResultBody(result: AutomatedCheckResult) {
  if (result.linkedinVerificationLevel === 'identity') {
    return 'LinkedIn returned an identity signal. Proofound keeps that as an account-side compatibility signal only, not as public proof trust.';
  }

  if (result.linkedinVerificationLevel === 'workplace') {
    return 'LinkedIn returned a workplace signal. Proofound keeps that as an account-side compatibility signal only, not as public proof trust.';
  }

  return 'The LinkedIn check ran successfully. If further review is needed, it stays account-side and does not change proof trust on its own.';
}

export function LinkedInVerification({
  onSuccess,
  autoStart = false,
  onAutoStartHandled,
  connectedByDefault = false,
}: LinkedInVerificationProps) {
  const [connected, setConnected] = useState<boolean | null>(connectedByDefault);
  const [checkingConnection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<AutomatedCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoStartTriggeredRef = useRef(false);

  useEffect(() => {
    if (connectedByDefault) {
      setConnected(true);
    }
  }, [connectedByDefault]);

  const handleConnectLinkedIn = () => {
    // Redirect to LinkedIn OAuth
    window.location.href = '/api/auth/linkedin?context=verification';
  };

  const handleInitiateVerification = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch('/api/verification/linkedin/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate verification');
      }

      const data = await response.json();
      const warnings: Array<{ code?: string; message?: string }> = Array.isArray(data.warnings)
        ? data.warnings
        : [];

      setCheckResult({
        ...data.automatedCheck,
        hasIdentityVerification: Boolean(data.hasIdentityVerification),
        hasWorkplaceVerification: Boolean(data.hasWorkplaceVerification),
        linkedinVerificationStatus: data.linkedinVerificationStatus,
        linkedinVerificationLevel:
          data.linkedinVerificationLevel ||
          (data.hasIdentityVerification
            ? 'identity'
            : data.linkedinVerificationStatus === 'verified'
              ? 'workplace'
              : 'pending'),
        identityGranted: Boolean(data.identityGranted),
      });

      if (warnings.length > 0 && warnings[0].message) {
        toast.warning(warnings[0].message, {
          duration: 6000,
        });
      }

      toast.success(data.message || 'Verification check complete!', {
        duration: 5000,
      });

      // For pending reviews, call out quick-review expectation at high confidence.
      if (data.linkedinVerificationLevel === 'pending' && data.automatedCheck.confidence >= 80) {
        toast.info('High confidence detected! Admin review typically completes within 1 hour.', {
          duration: 5000,
        });
      }

      // Call onSuccess after a short delay
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate verification';
      console.error('LinkedIn verification error:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  useEffect(() => {
    if (!autoStart || autoStartTriggeredRef.current) return;
    if (checkingConnection || loading || checkResult) return;

    if (connected === true) {
      autoStartTriggeredRef.current = true;
      onAutoStartHandled?.();
      void handleInitiateVerification();
    } else {
      onAutoStartHandled?.();
    }
  }, [
    autoStart,
    checkingConnection,
    loading,
    checkResult,
    connected,
    handleInitiateVerification,
    onAutoStartHandled,
  ]);

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600">{confidence}% - High Confidence</Badge>
      );
    } else if (confidence >= 50) {
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600">{confidence}% - Medium Confidence</Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-500 hover:bg-gray-600">{confidence}% - Low Confidence</Badge>
      );
    }
  };

  // Show results if we have them
  if (checkResult) {
    return (
      <div className="space-y-4">
        <Alert className="border-[#0A66C2] bg-[#0A66C2]/5">
          <CheckCircle2 className="h-4 w-4 text-[#0A66C2]" />
          <AlertDescription>
            <strong>{getResultHeadline(checkResult)}</strong>
            <p className="mt-2">{getResultBody(checkResult)}</p>
          </AlertDescription>
        </Alert>

        <Card variant="bento" className="p-6">
          <div className="space-y-4">
            {/* Confidence Score */}
            <div>
              <h4 className="font-semibold mb-2">Check result</h4>
              <div className="flex items-center gap-3">
                {getConfidenceBadge(checkResult.confidence)}
                {checkResult.hasIdentityVerification && (
                  <Badge variant="outline" className="border-green-500 text-green-700">
                    <Award className="w-3 h-3 mr-1" />
                    Identity Verification Detected
                  </Badge>
                )}
                {!checkResult.hasIdentityVerification && checkResult.hasWorkplaceVerification && (
                  <Badge variant="outline" className="border-blue-500 text-blue-700">
                    <Award className="w-3 h-3 mr-1" />
                    Workplace Verification Detected
                  </Badge>
                )}
                {!checkResult.hasIdentityVerification && checkResult.hasVerificationBadge && (
                  <Badge variant="outline" className="border-green-500 text-green-700">
                    <Award className="w-3 h-3 mr-1" />
                    Verification Badge Detected
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {checkResult.linkedinVerificationLevel === 'identity'
                  ? 'Auto-approved using LinkedIn official identity verification.'
                  : checkResult.linkedinVerificationLevel === 'workplace'
                    ? 'Auto-approved using LinkedIn official workplace verification.'
                    : checkResult.confidence >= 80
                      ? 'High confidence - Quick admin approval typically within 1 hour'
                      : checkResult.confidence >= 50
                        ? 'Medium confidence - Manual admin review within 1-2 business days'
                        : 'Low confidence - Consider using another verification method'}
              </p>
            </div>

            {/* Signals */}
            {checkResult.signals && (
              <div>
                <h4 className="font-semibold mb-3">Detected Signals</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {checkResult.signals.hasVerificationBadge && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Verification Badge</span>
                    </div>
                  )}
                  {checkResult.signals.connectionCount &&
                    checkResult.signals.connectionCount >= 500 && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>{checkResult.signals.connectionCount}+ Connections</span>
                      </div>
                    )}
                  {checkResult.signals.profileCompleteness >= 70 && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>{checkResult.signals.profileCompleteness}% Complete Profile</span>
                    </div>
                  )}
                  {checkResult.signals.accountAge === 'old' && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Established Account</span>
                    </div>
                  )}
                  {checkResult.signals.experienceCount >= 2 && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>{checkResult.signals.experienceCount} Work Experiences</span>
                    </div>
                  )}
                  {checkResult.signals.hasProfilePhoto && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Profile Photo</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recommendation */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {checkResult.linkedinVerificationLevel === 'identity' ? (
                  <>
                    <strong>Next Steps:</strong> No further action is required. Your identity
                    verification is active.
                  </>
                ) : checkResult.linkedinVerificationLevel === 'workplace' ? (
                  <>
                    <strong>Next Steps:</strong> Your workplace signal is recorded for account-side
                    compatibility. Run the check again later only if your LinkedIn status changes.
                  </>
                ) : (
                  <>
                    <strong>Next Steps:</strong> No immediate action is required. If a manual review
                    happens, it stays account-side and does not replace proof-scoped trust.
                  </>
                )}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Main verification flow
  return (
    <div className="space-y-6">
      <Card variant="bento" className="p-6 border-[#0A66C2]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#0A66C2]/10 flex items-center justify-center flex-shrink-0">
            <Linkedin className="w-6 h-6 text-[#0A66C2]" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">LinkedIn compatibility signal</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Run an account-side check against LinkedIn official signals. This can support
              compatibility and organization linking, but it never creates public trust by itself.
            </p>

            {/* How it works */}
            <div className="space-y-2 mb-4">
              <h4 className="font-medium text-sm">How it works:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Connect your LinkedIn account (OAuth)</li>
                <li>Proofound checks for official LinkedIn identity or workplace signals</li>
                <li>The result is stored as an account compatibility signal</li>
                <li>Proof-backed trust still comes from proof-scoped attestations and reviews</li>
              </ol>
            </div>

            {/* What we check */}
            <div className="space-y-2 mb-6">
              <h4 className="font-medium text-sm">What we check:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  <span>Official LinkedIn signal</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Profile consistency</span>
                </div>
                <div className="flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  <span>Public profile metadata</span>
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={connected ? handleInitiateVerification : handleConnectLinkedIn}
              disabled={loading || checkingConnection}
              className="w-full bg-[#0A66C2] hover:bg-[#004182]"
            >
              {checkingConnection ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking LinkedIn connection...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running LinkedIn check...
                </>
              ) : (
                <>
                  <Linkedin className="w-4 h-4 mr-2" />
                  {connected ? 'Run LinkedIn check' : 'Connect LinkedIn'}
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-3">
              {connected
                ? 'We use your connected LinkedIn account to read public profile information and check for official LinkedIn signals.'
                : 'Connect your LinkedIn account via OAuth. Proofound only reads public profile information for this check.'}
            </p>
          </div>
        </div>
      </Card>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Privacy:</strong> Proofound uses automated tools to check your public LinkedIn
          profile for account compatibility signals. The result stays account-side and does not
          replace proof-scoped trust.
        </AlertDescription>
      </Alert>
    </div>
  );
}
