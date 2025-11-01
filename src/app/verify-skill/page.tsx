'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

function VerifySkillContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const action = searchParams.get('action');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [responseAction, setResponseAction] = useState<'approve' | 'decline' | null>(null);

  // Form state
  const [verifierName, setVerifierName] = useState('');
  const [verifierTitle, setVerifierTitle] = useState('');
  const [verifierCompany, setVerifierCompany] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (action === 'approve' || action === 'decline') {
      setResponseAction(action);
    }
  }, [action]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Invalid verification link');
      return;
    }

    if (!responseAction) {
      toast.error('Please select an action');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/verification/skill/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          action: responseAction,
          verifierName: anonymous ? undefined : verifierName,
          verifierTitle: anonymous ? undefined : verifierTitle,
          verifierCompany: anonymous ? undefined : verifierCompany,
          anonymous,
          comment,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        toast.success(
          responseAction === 'approve' ? 'Skill verified successfully!' : 'Verification declined'
        );
      } else {
        toast.error(data.error || 'Failed to submit verification');
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F3EE] p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid Link</CardTitle>
            <CardDescription>This verification link is invalid or has expired.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F3EE] p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              {responseAction === 'approve' ? (
                <CheckCircle2 className="w-16 h-16 text-green-600" />
              ) : (
                <XCircle className="w-16 h-16 text-gray-600" />
              )}
            </div>
            <CardTitle className="text-center">
              {responseAction === 'approve' ? 'Verification Complete!' : 'Response Submitted'}
            </CardTitle>
            <CardDescription className="text-center">
              {responseAction === 'approve'
                ? 'Thank you for verifying this skill. Your verification helps build trust in the Proofound community.'
                : 'Thank you for your response. The requester has been notified.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full" variant="outline">
              Return to Proofound
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F3EE] p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="font-['Crimson_Pro'] text-2xl">
            Skill Verification Request
          </CardTitle>
          <CardDescription>
            Someone has requested that you verify their skill. Please review and respond below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Action Selection */}
            {!action && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Your Response</Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    onClick={() => setResponseAction('approve')}
                    variant={responseAction === 'approve' ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Verify Skill
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setResponseAction('decline')}
                    variant={responseAction === 'decline' ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                </div>
              </div>
            )}

            {responseAction === 'approve' && (
              <>
                {/* Verifier Information */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="anonymous"
                      checked={anonymous}
                      onCheckedChange={(checked) => setAnonymous(checked as boolean)}
                    />
                    <Label htmlFor="anonymous" className="text-sm font-normal cursor-pointer">
                      Verify anonymously (your name won&apos;t be shown)
                    </Label>
                  </div>

                  {!anonymous && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="verifierName">Your Name (Optional)</Label>
                        <Input
                          id="verifierName"
                          value={verifierName}
                          onChange={(e) => setVerifierName(e.target.value)}
                          placeholder="e.g., John Smith"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="verifierTitle">Your Title (Optional)</Label>
                        <Input
                          id="verifierTitle"
                          value={verifierTitle}
                          onChange={(e) => setVerifierTitle(e.target.value)}
                          placeholder="e.g., Senior Engineer"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="verifierCompany">Your Company (Optional)</Label>
                        <Input
                          id="verifierCompany"
                          value={verifierCompany}
                          onChange={(e) => setVerifierCompany(e.target.value)}
                          placeholder="e.g., Tech Corp"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Comment */}
                <div className="space-y-2">
                  <Label htmlFor="comment">Additional Comments (Optional)</Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add any additional context about your verification..."
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">{comment.length}/500 characters</p>
                </div>
              </>
            )}

            {responseAction === 'decline' && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  By declining, you&apos;re letting the requester know that you&apos;re not able to
                  verify this skill. No reason will be shared with them.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              {!action && responseAction && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResponseAction(null)}
                  className="flex-1"
                >
                  Back
                </Button>
              )}
              <Button type="submit" disabled={!responseAction || loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Response'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifySkillPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F5F3EE]">
          <Loader2 className="w-8 h-8 animate-spin text-[#7A9278]" />
        </div>
      }
    >
      <VerifySkillContent />
    </Suspense>
  );
}
