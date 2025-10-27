"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Badge } from './ui/badge';
import { 
  FileText, 
  Upload, 
  Link as LinkIcon, 
  Award,
  Briefcase,
  GraduationCap,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface ProofSubmissionProps {
  profileId: string;
  onComplete?: () => void;
}

export function ProofSubmission({ profileId, onComplete }: ProofSubmissionProps) {
  const router = useRouter();
  const supabase = createClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [claimType, setClaimType] = useState<'skill' | 'work_experience' | 'education' | 'certification' | 'achievement'>('skill');
  const [claimText, setClaimText] = useState('');
  const [proofType, setProofType] = useState<'verified_reference' | 'document' | 'self_attested'>('verified_reference');
  const [artifactUrl, setArtifactUrl] = useState('');
  const [verifierName, setVerifierName] = useState('');
  const [verifierEmail, setVerifierEmail] = useState('');
  const [verifierOrganization, setVerifierOrganization] = useState('');
  const [verifierRelationship, setVerifierRelationship] = useState('');
  const [contextNotes, setContextNotes] = useState('');

  const totalSteps = 3;

  const getClaimTypeIcon = () => {
    switch (claimType) {
      case 'skill': return Award;
      case 'work_experience': return Briefcase;
      case 'education': return GraduationCap;
      case 'certification': return ShieldCheck;
      case 'achievement': return CheckCircle2;
      default: return FileText;
    }
  };

  const ClaimIcon = getClaimTypeIcon();

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Create the proof
      const { data: proof, error: proofError } = await (supabase
        .from('proofs') as any)
        .insert({
          profile_id: profileId,
          claim_type: claimType,
          claim_text: claimText,
          proof_type: proofType,
          verification_status: proofType === 'self_attested' ? 'approved' : 'pending',
          artifact_url: artifactUrl || null
        })
        .select()
        .single();

      if (proofError) throw proofError;

      // If verified reference, create verification request
      if (proofType === 'verified_reference' && verifierEmail) {
        const { error: verificationError } = await (supabase
          .from('verification_requests') as any)
          .insert({
            proof_id: proof.id,
            requester_id: profileId,
            verifier_name: verifierName,
            verifier_email: verifierEmail,
            verifier_organization: verifierOrganization || null,
            verifier_relationship: verifierRelationship,
            context_notes: contextNotes || null,
            status: 'pending',
            verification_token: crypto.randomUUID(),
            token_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
          });

        if (verificationError) throw verificationError;
      }

      // Navigate back or call onComplete
      if (onComplete) {
        onComplete();
      } else {
        router.push('/profile/proofs');
      }
    } catch (error) {
      console.error('Error creating proof:', error);
      alert('Failed to create proof. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F6F1' }}>
      {/* Header */}
      <div className="border-b px-6 py-4" style={{ borderColor: '#E8E6DD', backgroundColor: '#FDFCFA' }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-semibold" style={{ color: '#2D3330' }}>
                Submit Proof
              </h1>
              <p className="text-sm mt-1" style={{ color: '#6B6760' }}>
                Step {currentStep} of {totalSteps}
              </p>
            </div>
            <Badge variant="outline">Draft</Badge>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-3" style={{ backgroundColor: '#FDFCFA' }}>
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="h-2 flex-1 rounded-full transition-colors"
              style={{ backgroundColor: i < currentStep ? '#1C4D3A' : '#E8E6DD' }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Step 1: Claim Details */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClaimIcon className="w-5 h-5" style={{ color: '#1C4D3A' }} />
                  What are you claiming?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="mb-3 block">Claim Type *</Label>
                  <RadioGroup value={claimType} onValueChange={(value: string) => setClaimType(value as any)}>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center space-x-3 p-4 rounded-lg border" style={{ borderColor: claimType === 'skill' ? '#1C4D3A' : '#E8E6DD' }}>
                        <RadioGroupItem value="skill" id="skill" />
                        <Label htmlFor="skill" className="flex items-center gap-2 flex-1 cursor-pointer">
                          <Award className="w-4 h-4" />
                          Skill
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 rounded-lg border" style={{ borderColor: claimType === 'work_experience' ? '#1C4D3A' : '#E8E6DD' }}>
                        <RadioGroupItem value="work_experience" id="work_experience" />
                        <Label htmlFor="work_experience" className="flex items-center gap-2 flex-1 cursor-pointer">
                          <Briefcase className="w-4 h-4" />
                          Work Experience
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 rounded-lg border" style={{ borderColor: claimType === 'education' ? '#1C4D3A' : '#E8E6DD' }}>
                        <RadioGroupItem value="education" id="education" />
                        <Label htmlFor="education" className="flex items-center gap-2 flex-1 cursor-pointer">
                          <GraduationCap className="w-4 h-4" />
                          Education
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 rounded-lg border" style={{ borderColor: claimType === 'certification' ? '#1C4D3A' : '#E8E6DD' }}>
                        <RadioGroupItem value="certification" id="certification" />
                        <Label htmlFor="certification" className="flex items-center gap-2 flex-1 cursor-pointer">
                          <ShieldCheck className="w-4 h-4" />
                          Certification
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 rounded-lg border col-span-2" style={{ borderColor: claimType === 'achievement' ? '#1C4D3A' : '#E8E6DD' }}>
                        <RadioGroupItem value="achievement" id="achievement" />
                        <Label htmlFor="achievement" className="flex items-center gap-2 flex-1 cursor-pointer">
                          <CheckCircle2 className="w-4 h-4" />
                          Achievement / Award
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="claimText">Describe Your Claim *</Label>
                  <Textarea
                    id="claimText"
                    value={claimText}
                    onChange={(e) => setClaimText(e.target.value)}
                    placeholder="e.g., Led a team of 5 developers to build a climate impact tracking platform"
                    rows={4}
                    required
                  />
                  <p className="text-xs mt-2" style={{ color: '#6B6760' }}>
                    Be specific and factual. This will be verified by your referee.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Proof Type */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>How would you like to prove this?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="mb-3 block">Proof Type *</Label>
                  <RadioGroup value={proofType} onValueChange={(value: string) => setProofType(value as any)}>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-4 rounded-lg border" style={{ borderColor: proofType === 'verified_reference' ? '#1C4D3A' : '#E8E6DD' }}>
                        <RadioGroupItem value="verified_reference" id="verified_reference" />
                        <Label htmlFor="verified_reference" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2 mb-1">
                            <ShieldCheck className="w-4 h-4" style={{ color: '#7A9278' }} />
                            <span className="font-semibold">Verified Reference</span>
                            <Badge style={{ backgroundColor: '#7A927820', color: '#7A9278' }}>Recommended</Badge>
                          </div>
                          <p className="text-xs" style={{ color: '#6B6760' }}>
                            Someone who can verify this claim will receive an email
                          </p>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 rounded-lg border" style={{ borderColor: proofType === 'document' ? '#1C4D3A' : '#E8E6DD' }}>
                        <RadioGroupItem value="document" id="document" />
                        <Label htmlFor="document" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2 mb-1">
                            <Upload className="w-4 h-4" style={{ color: '#C76B4A' }} />
                            <span className="font-semibold">Document Upload</span>
                          </div>
                          <p className="text-xs" style={{ color: '#6B6760' }}>
                            Upload a certificate, transcript, or other documentation
                          </p>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 rounded-lg border" style={{ borderColor: proofType === 'self_attested' ? '#1C4D3A' : '#E8E6DD' }}>
                        <RadioGroupItem value="self_attested" id="self_attested" />
                        <Label htmlFor="self_attested" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-4 h-4" style={{ color: '#5C8B89' }} />
                            <span className="font-semibold">Self-Attested</span>
                          </div>
                          <p className="text-xs" style={{ color: '#6B6760' }}>
                            No external verification required
                          </p>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {(proofType === 'document' || proofType === 'verified_reference') && (
                  <div>
                    <Label htmlFor="artifactUrl">Supporting Link (Optional)</Label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6B6760' }} />
                      <Input
                        id="artifactUrl"
                        type="url"
                        value={artifactUrl}
                        onChange={(e) => setArtifactUrl(e.target.value)}
                        placeholder="https://example.com/certificate"
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs mt-2" style={{ color: '#6B6760' }}>
                      Link to a certificate, portfolio, or other supporting evidence
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Verifier Details (if needed) */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {proofType === 'verified_reference' ? 'Who can verify this?' : 'Review & Submit'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {proofType === 'verified_reference' ? (
                  <>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: '#7A927810', borderLeft: '3px solid #7A9278' }}>
                      <p className="text-sm" style={{ color: '#2D3330' }}>
                        Your referee will receive an email with a secure link to verify your claim. Choose someone who can credibly confirm this information.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="verifierName">Referee Name *</Label>
                        <Input
                          id="verifierName"
                          value={verifierName}
                          onChange={(e) => setVerifierName(e.target.value)}
                          placeholder="e.g., Jane Smith"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="verifierEmail">Referee Email *</Label>
                        <Input
                          id="verifierEmail"
                          type="email"
                          value={verifierEmail}
                          onChange={(e) => setVerifierEmail(e.target.value)}
                          placeholder="jane@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="verifierOrganization">Organization (Optional)</Label>
                      <Input
                        id="verifierOrganization"
                        value={verifierOrganization}
                        onChange={(e) => setVerifierOrganization(e.target.value)}
                        placeholder="e.g., Acme Corp"
                      />
                    </div>

                    <div>
                      <Label htmlFor="verifierRelationship">Relationship *</Label>
                      <Input
                        id="verifierRelationship"
                        value={verifierRelationship}
                        onChange={(e) => setVerifierRelationship(e.target.value)}
                        placeholder="e.g., Former Manager, Professor, Colleague"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="contextNotes">Additional Context (Optional)</Label>
                      <Textarea
                        id="contextNotes"
                        value={contextNotes}
                        onChange={(e) => setContextNotes(e.target.value)}
                        placeholder="Any additional information to help the referee verify your claim"
                        rows={3}
                      />
                    </div>
                  </>
                ) : (
                  <div className="p-6 rounded-lg" style={{ backgroundColor: '#F7F6F1' }}>
                    <h3 className="font-semibold mb-3" style={{ color: '#2D3330' }}>
                      Review Your Submission
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span style={{ color: '#6B6760' }}>Claim Type:</span>
                        <span className="ml-2 font-medium" style={{ color: '#2D3330' }}>{claimType.replace('_', ' ')}</span>
                      </div>
                      <div>
                        <span style={{ color: '#6B6760' }}>Claim:</span>
                        <p className="mt-1" style={{ color: '#2D3330' }}>{claimText}</p>
                      </div>
                      <div>
                        <span style={{ color: '#6B6760' }}>Proof Type:</span>
                        <span className="ml-2 font-medium" style={{ color: '#2D3330' }}>{proofType.replace('_', ' ')}</span>
                      </div>
                      {artifactUrl && (
                        <div>
                          <span style={{ color: '#6B6760' }}>Link:</span>
                          <a href={artifactUrl} target="_blank" rel="noopener noreferrer" className="ml-2 underline" style={{ color: '#1C4D3A' }}>
                            {artifactUrl}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="border-t p-6 fixed bottom-0 left-0 right-0" style={{ borderColor: '#E8E6DD', backgroundColor: '#FDFCFA' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={currentStep === 1 && !claimText}
              style={{ backgroundColor: '#1C4D3A', color: 'white' }}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !claimText || (proofType === 'verified_reference' && (!verifierName || !verifierEmail || !verifierRelationship))}
              style={{ backgroundColor: '#1C4D3A', color: 'white' }}
            >
              {isLoading ? 'Submitting...' : 'Submit Proof'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

