"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  User
} from 'lucide-react';

interface RefereeVerificationProps {
  verificationRequest: any;
  proof: any;
  requester: any;
}

export function RefereeVerification({ verificationRequest, proof, requester }: RefereeVerificationProps) {
  const supabase = createClient();
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async () => {
    if (!decision) return;

    setIsSubmitting(true);
    try {
      // Update verification request
      const { error: requestError } = await (supabase
        .from('verification_requests') as any)
        .update({
          status: decision === 'approve' ? 'approved' : 'rejected',
          verifier_comments: comments || null,
          verified_at: new Date().toISOString()
        })
        .eq('id', verificationRequest.id);

      if (requestError) throw requestError;

      // Update proof status
      const { error: proofError } = await (supabase
        .from('proofs') as any)
        .update({
          verification_status: decision === 'approve' ? 'approved' : 'rejected',
          verified_at: decision === 'approve' ? new Date().toISOString() : null
        })
        .eq('id', proof.id);

      if (proofError) throw proofError;

      setIsComplete(true);
    } catch (error) {
      console.error('Error submitting verification:', error);
      alert('Failed to submit verification. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F6F1' }}>
        <Card className="w-full max-w-2xl mx-6">
          <CardContent className="text-center py-12">
            <CheckCircle2 className="w-20 h-20 mx-auto mb-6" style={{ color: '#7A9278' }} />
            <h1 className="text-3xl font-display font-semibold mb-4" style={{ color: '#2D3330' }}>
              Thank You!
            </h1>
            <p className="text-lg mb-6" style={{ color: '#6B6760' }}>
              Your verification has been recorded. {requester.full_name} will be notified of your decision.
            </p>
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#7A927810' }}>
              <p className="text-sm" style={{ color: '#2D3330' }}>
                Your feedback helps build a more trustworthy professional community. Thank you for taking the time to verify this claim.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F6F1' }}>
      {/* Header */}
      <div className="border-b px-6 py-8" style={{ borderColor: '#E8E6DD', backgroundColor: '#FDFCFA' }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: '#1C4D3A20' }}>
            <ShieldCheck className="w-8 h-8" style={{ color: '#1C4D3A' }} />
          </div>
          <h1 className="text-3xl font-display font-semibold mb-2" style={{ color: '#2D3330' }}>
            Verification Request
          </h1>
          <p className="text-sm" style={{ color: '#6B6760' }}>
            You've been asked to verify a professional claim
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Requester Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              About the Requester
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#7A9278', color: 'white' }}>
                <span className="text-lg font-semibold">
                  {requester.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                </span>
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: '#2D3330' }}>
                  {requester.full_name || 'User'}
                </h3>
                {requester.tagline && (
                  <p className="text-sm" style={{ color: '#6B6760' }}>
                    {requester.tagline}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Claim Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Claim to Verify</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-xs" style={{ color: '#6B6760' }}>Claim Type</Label>
                <Badge variant="outline" className="mt-1 capitalize">
                  {proof.claim_type?.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <Label className="text-xs mb-2 block" style={{ color: '#6B6760' }}>Claim Statement</Label>
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#F7F6F1' }}>
                  <p style={{ color: '#2D3330' }}>{proof.claim_text}</p>
                </div>
              </div>
              {proof.artifact_url && (
                <div>
                  <Label className="text-xs" style={{ color: '#6B6760' }}>Supporting Evidence</Label>
                  <a
                    href={proof.artifact_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm underline flex items-center gap-1 mt-1"
                    style={{ color: '#1C4D3A' }}
                  >
                    View supporting link
                  </a>
                </div>
              )}
              <div>
                <Label className="text-xs" style={{ color: '#6B6760' }}>Your Relationship</Label>
                <p className="text-sm mt-1" style={{ color: '#2D3330' }}>
                  {verificationRequest.verifier_relationship}
                </p>
              </div>
              {verificationRequest.context_notes && (
                <div>
                  <Label className="text-xs" style={{ color: '#6B6760' }}>Additional Context</Label>
                  <p className="text-sm mt-1" style={{ color: '#2D3330' }}>
                    {verificationRequest.context_notes}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Verification Decision */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="mb-3 block">Can you verify this claim? *</Label>
              <RadioGroup value={decision || ''} onValueChange={(value: string) => setDecision(value as 'approve' | 'reject')}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-4 rounded-lg border" style={{ borderColor: decision === 'approve' ? '#7A9278' : '#E8E6DD', backgroundColor: decision === 'approve' ? '#7A927810' : 'transparent' }}>
                    <RadioGroupItem value="approve" id="approve" />
                    <Label htmlFor="approve" className="flex items-center gap-2 flex-1 cursor-pointer">
                      <CheckCircle2 className="w-5 h-5" style={{ color: '#7A9278' }} />
                      <div>
                        <div className="font-semibold" style={{ color: '#2D3330' }}>Yes, I can verify this</div>
                        <p className="text-xs" style={{ color: '#6B6760' }}>This claim is accurate to the best of my knowledge</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border" style={{ borderColor: decision === 'reject' ? '#C76B4A' : '#E8E6DD', backgroundColor: decision === 'reject' ? '#C76B4A10' : 'transparent' }}>
                    <RadioGroupItem value="reject" id="reject" />
                    <Label htmlFor="reject" className="flex items-center gap-2 flex-1 cursor-pointer">
                      <XCircle className="w-5 h-5" style={{ color: '#C76B4A' }} />
                      <div>
                        <div className="font-semibold" style={{ color: '#2D3330' }}>No, I cannot verify this</div>
                        <p className="text-xs" style={{ color: '#6B6760' }}>This claim is inaccurate or I cannot confirm it</p>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="comments">Additional Comments (Optional)</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add any context or clarification about your verification decision"
                rows={4}
              />
            </div>

            <div className="p-4 rounded-lg flex items-start gap-2" style={{ backgroundColor: '#5C8B8910', borderLeft: '3px solid #5C8B89' }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#5C8B89' }} />
              <div className="text-sm" style={{ color: '#2D3330' }}>
                <p className="font-medium mb-1">Your verification matters</p>
                <p style={{ color: '#6B6760' }}>
                  By verifying this claim, you're helping build a more trustworthy professional ecosystem. Only verify what you can personally confirm.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={!decision || isSubmitting}
            size="lg"
            style={{ backgroundColor: '#1C4D3A', color: 'white' }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Verification'}
          </Button>
        </div>
      </div>
    </div>
  );
}

