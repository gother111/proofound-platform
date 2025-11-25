'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Shield, Loader2, AlertCircle } from 'lucide-react';

interface VerificationData {
  id: string;
  skill_name: string;
  skill_code: string | null;
  requester_name: string;
  requester_email: string;
  requester_avatar?: string;
  verifier_source: 'peer' | 'manager' | 'external';
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  expires_at: string;
}

export default function VerifySkillPage() {
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

  // Load verification request data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(`/api/verify/${token}`);

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to load verification request');
          return;
        }

        const result = await response.json();
        setData(result.verification);
      } catch (err) {
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
    if (!data) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/verify/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          message: responseMessage || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit response');
        return;
      }

      setSubmitted(true);
      setSubmittedAction(action === 'accept' ? 'accepted' : 'declined');
    } catch (err) {
      setError('Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'manager':
        return 'Manager / Supervisor';
      case 'external':
        return 'Client / External';
      default:
        return 'Peer / Colleague';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F6F1] to-[#E5E3DA] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#1C4D3A] mx-auto mb-4" />
            <p className="text-[#6B6760]">Loading verification request...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F6F1] to-[#E5E3DA] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-12 pb-12 text-center">
            <AlertCircle className="h-12 w-12 text-[#C76B4A] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[#2D3330] mb-2">Unable to Load Request</h2>
            <p className="text-[#6B6760] mb-6">{error}</p>
            <Button variant="outline" onClick={() => router.push('/')}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already responded or expired
  if (data?.status !== 'pending') {
    const statusConfig = {
      accepted: {
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        title: 'Already Verified',
        message: 'This skill has already been verified. Thank you for your response!',
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
          'This verification request has expired. The requester will need to send a new request.',
      },
    };

    const config = statusConfig[data?.status as keyof typeof statusConfig] || statusConfig.expired;
    const Icon = config.icon;

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F6F1] to-[#E5E3DA] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className={`pt-12 pb-12 text-center ${config.bgColor} rounded-lg`}>
            <Icon className={`h-16 w-16 ${config.color} mx-auto mb-4`} />
            <h2 className="text-xl font-semibold text-[#2D3330] mb-2">{config.title}</h2>
            <p className="text-[#6B6760]">{config.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state after submission
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F6F1] to-[#E5E3DA] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-12 pb-12 text-center">
            {submittedAction === 'accepted' ? (
              <>
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-[#2D3330] mb-2">Thank You!</h2>
                <p className="text-[#6B6760] mb-4">
                  You've successfully verified <strong>{data?.requester_name}</strong>'s expertise
                  in <strong>{data?.skill_name}</strong>.
                </p>
                <p className="text-sm text-[#6B6760]">
                  Your verification helps build trust and credibility on Proofound.
                </p>
              </>
            ) : (
              <>
                <XCircle className="h-16 w-16 text-[#C76B4A] mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-[#2D3330] mb-2">Response Recorded</h2>
                <p className="text-[#6B6760]">
                  You've declined to verify this skill. The requester has been notified.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main verification form
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F6F1] to-[#E5E3DA] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="bg-gradient-to-r from-[#1C4D3A] to-[#2D5F4A] text-white rounded-t-lg">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8" />
            <CardTitle className="text-xl">Skill Verification Request</CardTitle>
          </div>
          <p className="text-white/80 text-sm">
            You're being asked to verify someone's professional skills
          </p>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Requester Info */}
          <div className="flex items-center gap-4 p-4 bg-[#F7F6F1] rounded-lg">
            <div className="h-12 w-12 rounded-full bg-[#1C4D3A] text-white flex items-center justify-center text-lg font-semibold">
              {data?.requester_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-semibold text-[#2D3330]">{data?.requester_name}</p>
              <p className="text-sm text-[#6B6760]">is requesting your verification</p>
            </div>
          </div>

          {/* Skill Details */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#6B6760]">Skill to Verify</p>
            <div className="p-4 border-l-4 border-[#1C4D3A] bg-white rounded-r-lg">
              <p className="font-semibold text-lg text-[#1C4D3A]">{data?.skill_name}</p>
              {data?.skill_code && (
                <p className="text-xs text-[#6B6760] font-mono mt-1">{data.skill_code}</p>
              )}
            </div>
          </div>

          {/* Relationship */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#6B6760]">Your Relationship</p>
            <Badge variant="outline" className="text-[#1C4D3A] border-[#1C4D3A]">
              {getSourceLabel(data?.verifier_source || 'peer')}
            </Badge>
          </div>

          {/* Message from requester */}
          {data?.message && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-[#6B6760]">
                Message from {data.requester_name}
              </p>
              <div className="p-3 bg-[#F7F6F1] rounded-lg italic text-[#2D3330]">
                &ldquo;{data.message}&rdquo;
              </div>
            </div>
          )}

          {/* Verifier's response message (optional) */}
          <div className="space-y-2">
            <label htmlFor="response-message" className="text-sm font-medium text-[#6B6760]">
              Add a note (optional)
            </label>
            <Textarea
              id="response-message"
              placeholder="Share context about how you've seen this skill demonstrated..."
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              rows={3}
              className="bg-white"
            />
          </div>

          {/* Expiration notice */}
          <p className="text-xs text-[#6B6760] text-center">
            This request expires on {new Date(data?.expires_at || '').toLocaleDateString()}
          </p>
        </CardContent>

        <CardFooter className="flex gap-3 border-t pt-6">
          <Button
            variant="outline"
            className="flex-1 border-[#C76B4A] text-[#C76B4A] hover:bg-[#FFF0F0]"
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
            className="flex-1 bg-[#1C4D3A] text-white hover:bg-[#2D5F4A]"
            onClick={() => handleSubmit('accept')}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Verify Skill
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
