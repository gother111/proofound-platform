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
  TrendingUp,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';

interface LinkedInVerificationProps {
  onSuccess?: () => void;
  autoStart?: boolean;
  onAutoStartHandled?: () => void;
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

export function LinkedInVerification({
  onSuccess,
  autoStart = false,
  onAutoStartHandled,
}: LinkedInVerificationProps) {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [loading, setLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<AutomatedCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoStartTriggeredRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchConnectionStatus() {
      setCheckingConnection(true);
      try {
        const res = await fetch('/api/expertise/linkedin-status');
        const data = res.ok ? await res.json() : null;
        if (!cancelled) setConnected(Boolean(data?.connected));
      } catch (err) {
        console.error('Failed to fetch LinkedIn connection status:', err);
        if (!cancelled) setConnected(false);
      } finally {
        if (!cancelled) setCheckingConnection(false);
      }
    }

    fetchConnectionStatus();

    return () => {
      cancelled = true;
    };
  }, []);

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
            <strong>
              {checkResult.linkedinVerificationStatus === 'verified'
                ? checkResult.linkedinVerificationLevel === 'identity'
                  ? 'LinkedIn Identity Verification Approved!'
                  : 'LinkedIn Workplace Verification Approved!'
                : 'Verification Check Complete!'}
            </strong>
            <p className="mt-2">
              {checkResult.linkedinVerificationLevel === 'identity'
                ? 'LinkedIn identity verification was detected and your profile now has identity-level verification.'
                : checkResult.linkedinVerificationLevel === 'workplace'
                  ? 'LinkedIn workplace verification was detected. Your profile now has workplace-level verification.'
                  : 'Your LinkedIn profile has been analyzed. Pending admin review.'}
            </p>
          </AlertDescription>
        </Alert>

        <Card className="p-6">
          <div className="space-y-4">
            {/* Confidence Score */}
            <div>
              <h4 className="font-semibold mb-2">Confidence Score</h4>
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
                    <strong>Next Steps:</strong> Your workplace verification is active. Run the
                    check again after enabling LinkedIn identity verification to upgrade.
                  </>
                ) : (
                  <>
                    <strong>Next Steps:</strong> Your verification request is now pending admin
                    review. You&apos;ll receive a notification once the review is complete.
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
      <Card className="p-6 border-[#0A66C2]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#0A66C2]/10 flex items-center justify-center flex-shrink-0">
            <Linkedin className="w-6 h-6 text-[#0A66C2]" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">LinkedIn Identity Verification</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We&apos;ll automatically check if your LinkedIn profile has an identity verification
              badge and analyze other trust signals. Fast and free!
            </p>

            {/* How it works */}
            <div className="space-y-2 mb-4">
              <h4 className="font-medium text-sm">How it works:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Connect your LinkedIn account (OAuth)</li>
                <li>Automated check runs in 5-10 seconds</li>
                <li>Auto-approval happens for LinkedIn identity or workplace signals</li>
                <li>Without official signals, admins review the automated findings</li>
              </ol>
            </div>

            {/* What we check */}
            <div className="space-y-2 mb-6">
              <h4 className="font-medium text-sm">What we check:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  <span>LinkedIn verification badge</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Connection count</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Profile completeness</span>
                </div>
                <div className="flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  <span>Account age</span>
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
                  Analyzing LinkedIn Profile...
                </>
              ) : (
                <>
                  <Linkedin className="w-4 h-4 mr-2" />
                  {connected ? 'Start Verification Check' : 'Connect LinkedIn'}
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-3">
              {connected
                ? 'We will use your connected LinkedIn account to fetch your public profile and run a quick verification check.'
                : 'Connect your LinkedIn account via OAuth. We only read public profile information.'}
            </p>
          </div>
        </div>
      </Card>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Privacy:</strong> We use automated tools to check your public LinkedIn profile.
          Your data is only used for verification and is not shared with third parties.
        </AlertDescription>
      </Alert>
    </div>
  );
}
