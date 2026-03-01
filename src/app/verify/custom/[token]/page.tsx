'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Clock, Loader2, Shield, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  relationshipDisplayLabel,
  type CustomVerificationRelationship,
} from '@/lib/verification/custom-verification';

type VerifyItem = {
  id: string;
  artifact_type: 'skill' | 'experience' | 'education' | 'impact_story' | 'project' | 'volunteering';
  artifact_id: string;
  display_label: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
};

type VerificationData = {
  id: string;
  requester_name: string;
  requester_avatar?: string | null;
  relationship: CustomVerificationRelationship;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  expires_at: string;
  responded_at?: string;
  response_message?: string;
  items: VerifyItem[];
};

function artifactTypeLabel(type: VerifyItem['artifact_type']): string {
  switch (type) {
    case 'impact_story':
      return 'Impact story';
    case 'project':
      return 'Project';
    case 'experience':
      return 'Experience';
    case 'education':
      return 'Education';
    case 'volunteering':
      return 'Volunteering';
    case 'skill':
    default:
      return 'Skill';
  }
}

export default function VerifyCustomRequestPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VerificationData | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittedAction, setSubmittedAction] = useState<'accepted' | 'declined' | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(`/api/verify/custom/${token}`);

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to load verification request');
          return;
        }

        const result = await response.json();
        setData(result.request);
      } catch (_loadError) {
        setError('Failed to load verification request');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadData();
    }
  }, [token]);

  const handleSubmit = async (action: 'accept' | 'decline') => {
    if (!data) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/verify/custom/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          message: responseMessage.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit response');
        return;
      }

      setSubmitted(true);
      setSubmittedAction(action === 'accept' ? 'accepted' : 'declined');
    } catch (_submitError) {
      setError('Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F6F1] to-[#E5E3DA] flex items-center justify-center p-4">
        <Card className="w-full max-w-xl">
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-proofound-forest mx-auto mb-4" />
            <p className="text-muted-foreground">Loading verification request...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F6F1] to-[#E5E3DA] flex items-center justify-center p-4">
        <Card className="w-full max-w-xl">
          <CardContent className="pt-12 pb-12 text-center">
            <AlertCircle className="h-12 w-12 text-proofound-terracotta mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Unable to Load Request</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button variant="outline" onClick={() => router.push('/')}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data?.status !== 'pending') {
    const statusConfig = {
      accepted: {
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        title: 'Already Verified',
        message: 'This request has already been accepted. Thank you for your response.',
      },
      declined: {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        title: 'Already Declined',
        message: 'This verification request has already been declined.',
      },
      expired: {
        icon: Clock,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        title: 'Request Expired',
        message:
          'This verification request has expired. The requester will need to send a new one.',
      },
    };

    const config = statusConfig[data?.status as keyof typeof statusConfig] || statusConfig.expired;
    const Icon = config.icon;

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F6F1] to-[#E5E3DA] flex items-center justify-center p-4">
        <Card className="w-full max-w-xl">
          <CardContent className={`pt-12 pb-12 text-center ${config.bgColor} rounded-lg`}>
            <Icon className={`h-16 w-16 ${config.color} mx-auto mb-4`} />
            <h2 className="text-xl font-semibold text-foreground mb-2">{config.title}</h2>
            <p className="text-muted-foreground">{config.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F6F1] to-[#E5E3DA] flex items-center justify-center p-4">
        <Card className="w-full max-w-xl">
          <CardContent className="pt-12 pb-12 text-center">
            {submittedAction === 'accepted' ? (
              <>
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-foreground mb-2">Thank You!</h2>
                <p className="text-muted-foreground mb-4">
                  You've verified <strong>{data?.requester_name}</strong>'s selected profile
                  artifacts.
                </p>
                <p className="text-sm text-muted-foreground">
                  Your response helps strengthen trust and credibility on Proofound.
                </p>
              </>
            ) : (
              <>
                <XCircle className="h-16 w-16 text-proofound-terracotta mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-foreground mb-2">Response Recorded</h2>
                <p className="text-muted-foreground">
                  You've declined this verification request. The requester has been notified.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F6F1] to-[#E5E3DA] flex items-center justify-center p-4">
      <Card className="w-full max-w-xl">
        <CardHeader className="bg-gradient-to-r from-[#1C4D3A] to-[#2D5F4A] text-white rounded-t-lg">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8" />
            <CardTitle className="text-xl">Custom Verification Request</CardTitle>
          </div>
          <p className="text-white/80 text-sm">Review one request that covers multiple artifacts</p>
        </CardHeader>

        <CardContent className="pt-6 space-y-5">
          <div className="flex items-center gap-4 p-4 bg-japandi-bg rounded-lg">
            <div className="h-12 w-12 rounded-full bg-proofound-forest text-white flex items-center justify-center text-lg font-semibold">
              {data?.requester_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-semibold text-foreground">{data?.requester_name}</p>
              <p className="text-sm text-muted-foreground">is requesting your verification</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Your Relationship</p>
            <Badge variant="outline" className="text-proofound-forest border-proofound-forest">
              {relationshipDisplayLabel(data?.relationship || 'peer')}
            </Badge>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Artifacts to Verify</p>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {data?.items?.map((item) => (
                <div
                  key={item.id}
                  className="rounded-md border border-proofound-stone bg-white px-3 py-2 flex items-start justify-between gap-3"
                >
                  <p className="text-sm text-foreground">{item.display_label}</p>
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    {artifactTypeLabel(item.artifact_type)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {data?.message && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Message from {data.requester_name}
              </p>
              <div className="p-3 bg-japandi-bg rounded-lg italic text-foreground">
                &ldquo;{data.message}&rdquo;
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="custom-response-message"
              className="text-sm font-medium text-muted-foreground"
            >
              Add a note (optional)
            </label>
            <Textarea
              id="custom-response-message"
              className="mt-2"
              rows={3}
              placeholder="Share any context for your decision..."
              value={responseMessage}
              onChange={(event) => setResponseMessage(event.target.value)}
            />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            This request expires on {new Date(data?.expires_at || '').toLocaleDateString()}
          </p>
        </CardContent>

        <CardFooter className="flex gap-3 border-t pt-6">
          <Button
            variant="outline"
            className="flex-1 border-[#C76B4A] text-proofound-terracotta hover:bg-[#FFF0F0]"
            onClick={() => handleSubmit('decline')}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            Decline
          </Button>
          <Button
            className="flex-1 bg-proofound-forest text-white hover:bg-proofound-forest/90"
            onClick={() => handleSubmit('accept')}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Verify Artifacts
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
