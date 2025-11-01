'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import {
  Linkedin,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Eye,
  Award,
  Users,
  TrendingUp,
  Calendar,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminReviewModal } from './AdminReviewModal';

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

interface QueueData {
  all: VerificationItem[];
  highConfidence: VerificationItem[];
  mediumConfidence: VerificationItem[];
  lowConfidence: VerificationItem[];
}

interface QueueStats {
  total: number;
  high: number;
  medium: number;
  low: number;
}

export function AdminVerificationDashboard() {
  const [queue, setQueue] = useState<QueueData | null>(null);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedVerification, setSelectedVerification] = useState<VerificationItem | null>(null);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/verification/linkedin/queue');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load verification queue');
      }

      const data = await response.json();
      setQueue(data.queue);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to load verification queue:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickApprove = async (verification: VerificationItem) => {
    if (!confirm(`Are you sure you want to approve verification for ${verification.userName}?`)) {
      return;
    }

    try {
      setProcessingUserId(verification.userId);
      const response = await fetch(
        `/api/admin/verification/linkedin/${verification.userId}/review`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision: 'approved',
            notes: 'Quick approved - high confidence',
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve verification');
      }

      toast.success(`Verification approved for ${verification.userName}`);
      
      // Remove from queue optimistically
      if (queue) {
        setQueue({
          all: queue.all.filter((v) => v.userId !== verification.userId),
          highConfidence: queue.highConfidence.filter((v) => v.userId !== verification.userId),
          mediumConfidence: queue.mediumConfidence.filter((v) => v.userId !== verification.userId),
          lowConfidence: queue.lowConfidence.filter((v) => v.userId !== verification.userId),
        });
        if (stats) {
          setStats({
            ...stats,
            total: stats.total - 1,
            high: verification.confidence >= 80 ? stats.high - 1 : stats.high,
            medium: verification.confidence >= 50 && verification.confidence < 80 ? stats.medium - 1 : stats.medium,
            low: verification.confidence < 50 ? stats.low - 1 : stats.low,
          });
        }
      }
    } catch (error) {
      console.error('Failed to approve verification:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleQuickReject = async (verification: VerificationItem) => {
    const reason = prompt(`Why are you rejecting ${verification.userName}'s verification?`);
    if (reason === null) return; // User cancelled

    try {
      setProcessingUserId(verification.userId);
      const response = await fetch(
        `/api/admin/verification/linkedin/${verification.userId}/review`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision: 'rejected',
            notes: reason || 'Quick rejected',
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject verification');
      }

      toast.success(`Verification rejected for ${verification.userName}`);
      
      // Remove from queue optimistically
      if (queue) {
        setQueue({
          all: queue.all.filter((v) => v.userId !== verification.userId),
          highConfidence: queue.highConfidence.filter((v) => v.userId !== verification.userId),
          mediumConfidence: queue.mediumConfidence.filter((v) => v.userId !== verification.userId),
          lowConfidence: queue.lowConfidence.filter((v) => v.userId !== verification.userId),
        });
        if (stats) {
          setStats({
            ...stats,
            total: stats.total - 1,
            high: verification.confidence >= 80 ? stats.high - 1 : stats.high,
            medium: verification.confidence >= 50 && verification.confidence < 80 ? stats.medium - 1 : stats.medium,
            low: verification.confidence < 50 ? stats.low - 1 : stats.low,
          });
        }
      }
    } catch (error) {
      console.error('Failed to reject verification:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleReviewComplete = (userId: string) => {
    // Remove from queue after review
    if (queue) {
      const verification = queue.all.find((v) => v.userId === userId);
      setQueue({
        all: queue.all.filter((v) => v.userId !== userId),
        highConfidence: queue.highConfidence.filter((v) => v.userId !== userId),
        mediumConfidence: queue.mediumConfidence.filter((v) => v.userId !== userId),
        lowConfidence: queue.lowConfidence.filter((v) => v.userId !== userId),
      });
      if (stats && verification) {
        setStats({
          ...stats,
          total: stats.total - 1,
          high: verification.confidence >= 80 ? stats.high - 1 : stats.high,
          medium: verification.confidence >= 50 && verification.confidence < 80 ? stats.medium - 1 : stats.medium,
          low: verification.confidence < 50 ? stats.low - 1 : stats.low,
        });
      }
    }
    setSelectedVerification(null);
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white">
          {confidence}% High
        </Badge>
      );
    } else if (confidence >= 50) {
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
          {confidence}% Medium
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-500 hover:bg-gray-600 text-white">
          {confidence}% Low
        </Badge>
      );
    }
  };

  const getAccountAgeLabel = (age: string) => {
    switch (age) {
      case 'old':
        return 'Established';
      case 'medium':
        return 'Moderate';
      case 'new':
        return 'New Account';
      default:
        return 'Unknown';
    }
  };

  const renderVerificationCard = (verification: VerificationItem) => {
    const isProcessing = processingUserId === verification.userId;

    return (
      <Card key={verification.userId} className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
        <CardContent className="p-6">
          {/* Header with avatar and user info */}
          <div className="flex items-start gap-4 mb-4">
            <Avatar className="w-12 h-12 flex-shrink-0">
              {verification.userAvatar ? (
                <img
                  src={verification.userAvatar}
                  alt={verification.userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#E8E6DD] flex items-center justify-center text-[#6B6760] font-semibold">
                  {verification.userName.charAt(0).toUpperCase()}
                </div>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[#2D3330] truncate">{verification.userName}</h3>
              {verification.userEmail && (
                <p className="text-sm text-[#6B6760] truncate">{verification.userEmail}</p>
              )}
            </div>
          </div>

          {/* Confidence score */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              {getConfidenceBadge(verification.confidence)}
              {verification.hasVerificationBadge && (
                <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
                  <Award className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>

          {/* Key signals */}
          <div className="space-y-2 mb-4 text-sm text-[#6B6760]">
            {verification.signals.connectionCount && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{verification.signals.connectionCount.toLocaleString()} connections</span>
              </div>
            )}
            {verification.signals.profileCompleteness > 0 && (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>{verification.signals.profileCompleteness}% profile complete</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{getAccountAgeLabel(verification.signals.accountAge)} account</span>
            </div>
          </div>

          {/* LinkedIn profile link */}
          <a
            href={verification.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-[#0A66C2] hover:underline mb-4 transition-all duration-200 hover:gap-3"
          >
            <Linkedin className="w-4 h-4" />
            View LinkedIn Profile
            <ExternalLink className="w-3 h-3" />
          </a>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 transition-all duration-200 hover:scale-105"
              onClick={() => setSelectedVerification(verification)}
              disabled={isProcessing}
            >
              <Eye className="w-4 h-4 mr-1" />
              View Details
            </Button>
            {verification.confidence >= 80 && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white transition-all duration-200 hover:scale-105"
                onClick={() => handleQuickApprove(verification)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Approve
                  </>
                )}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 transition-all duration-200 hover:scale-105"
              onClick={() => handleQuickReject(verification)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTabContent = (verifications: VerificationItem[]) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-[#6B6760] animate-spin mx-auto mb-2" />
            <p className="text-[#6B6760]">Loading verifications...</p>
          </div>
        </div>
      );
    }

    if (verifications.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-[#9B9891] mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-[#2D3330] mb-2">No verifications pending</h3>
            <p className="text-[#6B6760]">
              {selectedTab === 'all'
                ? 'All LinkedIn verifications have been reviewed.'
                : `No ${selectedTab} confidence verifications at this time.`}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {verifications.map((verification) => renderVerificationCard(verification))}
      </div>
    );
  };

  if (loading && !queue) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-[#6B6760] animate-spin mx-auto mb-2" />
          <p className="text-[#6B6760]">Loading verification queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Overview */}
      {stats && stats.total > 0 && (
        <Card className="mb-6 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B6760]">Pending Verifications</p>
                <p className="text-3xl font-bold text-[#2D3330]">{stats.total}</p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.high}</p>
                  <p className="text-xs text-[#6B6760]">High Confidence</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{stats.medium}</p>
                  <p className="text-xs text-[#6B6760]">Medium</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-600">{stats.low}</p>
                  <p className="text-xs text-[#6B6760]">Low</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)} className="w-full">
        <TabsList className="w-full justify-start mb-6 bg-white border border-[#E8E6DD] transition-all duration-300">
          <TabsTrigger value="all" className="gap-2 transition-all duration-200">
            All
            {stats && <Badge variant="secondary" className="transition-all duration-200">{stats.total}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="high" className="gap-2 transition-all duration-200">
            High Confidence
            {stats && <Badge variant="secondary" className="transition-all duration-200">{stats.high}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="medium" className="gap-2 transition-all duration-200">
            Medium Confidence
            {stats && <Badge variant="secondary" className="transition-all duration-200">{stats.medium}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="low" className="gap-2 transition-all duration-200">
            Low Confidence
            {stats && <Badge variant="secondary" className="transition-all duration-200">{stats.low}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">{queue && renderTabContent(queue.all)}</TabsContent>
        <TabsContent value="high">{queue && renderTabContent(queue.highConfidence)}</TabsContent>
        <TabsContent value="medium">{queue && renderTabContent(queue.mediumConfidence)}</TabsContent>
        <TabsContent value="low">{queue && renderTabContent(queue.lowConfidence)}</TabsContent>
      </Tabs>

      {/* Review Modal */}
      {selectedVerification && (
        <AdminReviewModal
          verification={selectedVerification}
          onClose={() => setSelectedVerification(null)}
          onComplete={handleReviewComplete}
        />
      )}
    </div>
  );
}
