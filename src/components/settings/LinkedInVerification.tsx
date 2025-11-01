/**
 * LinkedIn Verification Component
 * 
 * Handles the user flow for LinkedIn identity verification
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
}

interface AutomatedCheckResult {
  confidence: number;
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

export function LinkedInVerification({ onSuccess }: LinkedInVerificationProps) {
  const [loading, setLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<AutomatedCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnectLinkedIn = () => {
    // Redirect to LinkedIn OAuth
    window.location.href = '/api/auth/linkedin';
  };

  const handleInitiateVerification = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/verification/linkedin/initiate', {
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

      setCheckResult(data.automatedCheck);
      
      toast.success(data.message || 'Verification check complete!', {
        duration: 5000,
      });

      // If high confidence, notify user of quick approval
      if (data.automatedCheck.confidence >= 80) {
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
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600">
          {confidence}% - High Confidence
        </Badge>
      );
    } else if (confidence >= 50) {
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600">
          {confidence}% - Medium Confidence
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-500 hover:bg-gray-600">
          {confidence}% - Low Confidence
        </Badge>
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
            <strong>Verification Check Complete!</strong>
            <p className="mt-2">Your LinkedIn profile has been analyzed. Pending admin review.</p>
          </AlertDescription>
        </Alert>

        <Card className="p-6">
          <div className="space-y-4">
            {/* Confidence Score */}
            <div>
              <h4 className="font-semibold mb-2">Confidence Score</h4>
              <div className="flex items-center gap-3">
                {getConfidenceBadge(checkResult.confidence)}
                {checkResult.hasVerificationBadge && (
                  <Badge variant="outline" className="border-green-500 text-green-700">
                    <Award className="w-3 h-3 mr-1" />
                    Verification Badge Detected
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {checkResult.confidence >= 80
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
                  {checkResult.signals.connectionCount && checkResult.signals.connectionCount >= 500 && (
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
                <strong>Next Steps:</strong> Your verification request is now pending admin review.
                You'll receive a notification once the review is complete.
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
              We'll automatically check if your LinkedIn profile has an identity verification badge and
              analyze other trust signals. Fast and free!
            </p>

            {/* How it works */}
            <div className="space-y-2 mb-4">
              <h4 className="font-medium text-sm">How it works:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Connect your LinkedIn account (OAuth)</li>
                <li>Automated check runs in 5-10 seconds</li>
                <li>Admin reviews the automated findings</li>
                <li>Get verified badge on your profile</li>
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
              onClick={handleInitiateVerification}
              disabled={loading}
              className="w-full bg-[#0A66C2] hover:bg-[#004182]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing LinkedIn Profile...
                </>
              ) : (
                <>
                  <Linkedin className="w-4 h-4 mr-2" />
                  Start Verification Check
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-3">
              This will connect to your LinkedIn account via OAuth. We only read public profile information.
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

