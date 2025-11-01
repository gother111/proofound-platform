'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  XCircle,
  Award,
  Users,
  TrendingUp,
  Calendar,
  Briefcase,
  Camera,
  ExternalLink,
  Linkedin,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface VerificationSignals {
  hasVerificationBadge: boolean;
  connectionCount: number | null;
  experienceCount: number;
  profileCompleteness: number;
  hasProfilePhoto: boolean;
  accountAge: 'new' | 'medium' | 'old';
}

interface VerificationItem {
  userId: string;
  userName: string;
  userEmail: string | null;
  userAvatar: string | null;
  linkedinUrl: string;
  verificationData: any;
  verificationStatus: string;
  createdAt: string;
  confidence: number;
  hasVerificationBadge: boolean;
  recommendation: 'approve' | 'review_manually' | 'reject';
  signals: VerificationSignals;
  sources: string[];
}

interface AdminReviewModalProps {
  verification: VerificationItem;
  onClose: () => void;
  onComplete: (userId: string) => void;
}

export function AdminReviewModal({ verification, onClose, onComplete }: AdminReviewModalProps) {
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);

  const handleSubmitDecision = async (selectedDecision: 'approved' | 'rejected') => {
    if (
      !confirm(
        `Are you sure you want to ${selectedDecision === 'approved' ? 'APPROVE' : 'REJECT'} verification for ${verification.userName}?`
      )
    ) {
      return;
    }

    try {
      setProcessing(true);
      setDecision(selectedDecision);

      const response = await fetch(
        `/api/admin/verification/linkedin/${verification.userId}/review`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision: selectedDecision,
            notes: notes.trim() || null,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit review');
      }

      toast.success(
        `Verification ${selectedDecision === 'approved' ? 'approved' : 'rejected'} for ${verification.userName}`
      );
      onComplete(verification.userId);
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit review');
      setDecision(null);
    } finally {
      setProcessing(false);
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white text-lg px-4 py-2">
          {confidence}% - High Confidence
        </Badge>
      );
    } else if (confidence >= 50) {
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-lg px-4 py-2">
          {confidence}% - Medium Confidence
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-500 hover:bg-gray-600 text-white text-lg px-4 py-2">
          {confidence}% - Low Confidence
        </Badge>
      );
    }
  };

  const getAccountAgeLabel = (age: string) => {
    switch (age) {
      case 'old':
        return { label: 'Established Account', color: 'text-green-600' };
      case 'medium':
        return { label: 'Moderate Age Account', color: 'text-amber-600' };
      case 'new':
        return { label: 'New Account', color: 'text-gray-600' };
      default:
        return { label: 'Unknown', color: 'text-gray-600' };
    }
  };

  const accountAge = getAccountAgeLabel(verification.signals.accountAge);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Review LinkedIn Verification</DialogTitle>
          <DialogDescription>
            Carefully review the automated analysis and make a decision
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Profile Section */}
          <div className="flex items-start gap-4 p-4 bg-[#F7F6F1] rounded-lg">
            <Avatar className="w-16 h-16 flex-shrink-0">
              {verification.userAvatar ? (
                <img
                  src={verification.userAvatar}
                  alt={verification.userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#E8E6DD] flex items-center justify-center text-[#6B6760] text-2xl font-semibold">
                  {verification.userName.charAt(0).toUpperCase()}
                </div>
              )}
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-[#2D3330] mb-1">{verification.userName}</h3>
              {verification.userEmail && (
                <p className="text-sm text-[#6B6760] mb-3">{verification.userEmail}</p>
              )}
              <a
              href={verification.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[#0A66C2] hover:underline transition-all duration-200 hover:gap-3"
            >
                <Linkedin className="w-4 h-4" />
                View LinkedIn Profile
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Confidence Score */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[#2D3330]">Automated Confidence Score</h4>
            <div className="flex items-center gap-3">
              {getConfidenceBadge(verification.confidence)}
              {verification.hasVerificationBadge && (
                <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50 px-3 py-2">
                  <Award className="w-4 h-4 mr-1" />
                  LinkedIn Verified Badge Detected
                </Badge>
              )}
            </div>
            <p className="text-sm text-[#6B6760]">
              {verification.confidence >= 80
                ? 'High confidence - Profile shows strong trust signals. Consider quick approval.'
                : verification.confidence >= 50
                ? 'Medium confidence - Profile shows some trust signals. Manual review recommended.'
                : 'Low confidence - Profile has weak trust signals. Consider alternative verification method.'}
            </p>
          </div>

          {/* Detailed Signals */}
          <div className="space-y-4">
            <h4 className="font-semibold text-[#2D3330]">Detected Trust Signals</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-300">
              {/* Verification Badge */}
              <div className="flex items-start gap-3 p-4 border border-[#E8E6DD] rounded-lg transition-all duration-200 hover:shadow-md hover:border-[#D0CEC5]">
                <div
                  className={`p-2 rounded-full ${
                    verification.signals.hasVerificationBadge ? 'bg-green-100' : 'bg-gray-100'
                  }`}
                >
                  {verification.signals.hasVerificationBadge ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm text-[#2D3330]">LinkedIn Verification Badge</p>
                  <p className="text-xs text-[#6B6760]">
                    {verification.signals.hasVerificationBadge ? 'Detected' : 'Not detected'}
                  </p>
                </div>
              </div>

              {/* Connection Count */}
              <div className="flex items-start gap-3 p-4 border border-[#E8E6DD] rounded-lg transition-all duration-200 hover:shadow-md hover:border-[#D0CEC5]">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-[#2D3330]">Connections</p>
                  <p className="text-xs text-[#6B6760]">
                    {verification.signals.connectionCount
                      ? `${verification.signals.connectionCount.toLocaleString()} connections`
                      : 'Not available'}
                  </p>
                  {verification.signals.connectionCount && verification.signals.connectionCount >= 500 && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      500+ Network
                    </Badge>
                  )}
                </div>
              </div>

              {/* Profile Completeness */}
              <div className="flex items-start gap-3 p-4 border border-[#E8E6DD] rounded-lg transition-all duration-200 hover:shadow-md hover:border-[#D0CEC5]">
                <div className="p-2 bg-purple-100 rounded-full">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-[#2D3330] mb-2">Profile Completeness</p>
                  <Progress value={verification.signals.profileCompleteness} className="h-2 mb-1" />
                  <p className="text-xs text-[#6B6760]">{verification.signals.profileCompleteness}% complete</p>
                </div>
              </div>

              {/* Account Age */}
              <div className="flex items-start gap-3 p-4 border border-[#E8E6DD] rounded-lg transition-all duration-200 hover:shadow-md hover:border-[#D0CEC5]">
                <div className="p-2 bg-amber-100 rounded-full">
                  <Calendar className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-[#2D3330]">Account Age</p>
                  <p className={`text-xs font-medium ${accountAge.color}`}>{accountAge.label}</p>
                </div>
              </div>

              {/* Experience Count */}
              <div className="flex items-start gap-3 p-4 border border-[#E8E6DD] rounded-lg transition-all duration-200 hover:shadow-md hover:border-[#D0CEC5]">
                <div className="p-2 bg-indigo-100 rounded-full">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-[#2D3330]">Work Experience</p>
                  <p className="text-xs text-[#6B6760]">
                    {verification.signals.experienceCount} position{verification.signals.experienceCount !== 1 ? 's' : ''} listed
                  </p>
                </div>
              </div>

              {/* Profile Photo */}
              <div className="flex items-start gap-3 p-4 border border-[#E8E6DD] rounded-lg transition-all duration-200 hover:shadow-md hover:border-[#D0CEC5]">
                <div
                  className={`p-2 rounded-full ${
                    verification.signals.hasProfilePhoto ? 'bg-green-100' : 'bg-gray-100'
                  }`}
                >
                  {verification.signals.hasProfilePhoto ? (
                    <Camera className="w-5 h-5 text-green-600" />
                  ) : (
                    <Camera className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm text-[#2D3330]">Profile Photo</p>
                  <p className="text-xs text-[#6B6760]">
                    {verification.signals.hasProfilePhoto ? 'Present' : 'Not detected'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Automated Recommendation */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-blue-900 mb-1">Automated Recommendation</p>
                <p className="text-sm text-blue-700">
                  {verification.recommendation === 'approve'
                    ? 'System recommends APPROVAL - Strong trust signals detected'
                    : verification.recommendation === 'reject'
                    ? 'System recommends REJECTION - Weak trust signals detected'
                    : 'System recommends MANUAL REVIEW - Mixed signals detected'}
                </p>
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          <div className="space-y-2">
            <label className="font-semibold text-[#2D3330]">
              Admin Notes <span className="text-[#9B9891] font-normal">(Optional)</span>
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about your decision..."
              className="min-h-[100px]"
              maxLength={500}
              disabled={processing}
            />
            <p className="text-xs text-[#9B9891] text-right">{notes.length}/500 characters</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={processing} className="transition-all duration-200 hover:scale-105">
            Cancel
          </Button>
          <Button
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 transition-all duration-200 hover:scale-105"
            onClick={() => handleSubmitDecision('rejected')}
            disabled={processing}
          >
            {processing && decision === 'rejected' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Reject Verification
              </>
            )}
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white transition-all duration-200 hover:scale-105"
            onClick={() => handleSubmitDecision('approved')}
            disabled={processing}
          >
            {processing && decision === 'approved' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve Verification
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
