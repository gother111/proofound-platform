'use client';

import { useState } from 'react';
import { ShieldCheck, Clock, CheckCircle2, XCircle, User, Briefcase, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RespondDialog } from './components/RespondDialog';

interface VerificationRequest {
  id: string;
  skill_id: string;
  requester_profile_id: string;
  verifier_email: string;
  verifier_source: 'peer' | 'manager' | 'external';
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  responded_at?: string;
  response_message?: string;
  expires_at?: string;
  skills?: {
    id: string;
    competency_level: number;
    name_i18n?: any;
    skills_taxonomy?: {
      name_i18n?: any;
      skills_l3?: {
        name_i18n?: any;
        skills_subcategories?: {
          name_i18n?: any;
          skills_categories?: {
            name_i18n?: any;
          };
        };
      };
    };
  };
  profiles?: {
    id: string;
    display_name?: string;
    handle?: string;
    avatar_url?: string;
  };
}

interface VerificationsClientProps {
  requests: VerificationRequest[];
  userEmail: string;
}

export function VerificationsClient({ requests: initialRequests, userEmail }: VerificationsClientProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [respondAction, setRespondAction] = useState<'accept' | 'decline'>('accept');

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const acceptedRequests = requests.filter(r => r.status === 'accepted');
  const declinedRequests = requests.filter(r => r.status === 'declined');

  const handleRespond = (request: VerificationRequest, action: 'accept' | 'decline') => {
    setSelectedRequest(request);
    setRespondAction(action);
    setRespondDialogOpen(true);
  };

  const handleResponseComplete = (updatedRequest: VerificationRequest) => {
    // Update the request in the list
    setRequests(prev =>
      prev.map(r => (r.id === updatedRequest.id ? updatedRequest : r))
    );
    setRespondDialogOpen(false);
    setSelectedRequest(null);
  };

  const getSkillName = (request: VerificationRequest): string => {
    const skill = request.skills;
    if (!skill) return 'Unknown Skill';
    
    // Custom skill
    if (skill.name_i18n && typeof skill.name_i18n === 'object' && skill.name_i18n.en) {
      return skill.name_i18n.en;
    }
    
    // Taxonomy skill
    if (skill.skills_taxonomy?.name_i18n) {
      const taxName = skill.skills_taxonomy.name_i18n;
      if (typeof taxName === 'object' && taxName.en) {
        return taxName.en;
      }
      if (typeof taxName === 'string') {
        return taxName;
      }
    }
    
    return 'Unknown Skill';
  };

  const getBreadcrumb = (request: VerificationRequest): string => {
    const skill = request.skills;
    if (!skill?.skills_taxonomy?.skills_l3) return '';
    
    const l3 = skill.skills_taxonomy.skills_l3;
    const l2 = l3.skills_subcategories;
    const l1 = l2?.skills_categories;
    
    const parts: string[] = [];
    
    if (l1?.name_i18n) {
      const l1Name = typeof l1.name_i18n === 'object' ? l1.name_i18n.en : l1.name_i18n;
      if (l1Name) parts.push(l1Name);
    }
    
    if (l2?.name_i18n) {
      const l2Name = typeof l2.name_i18n === 'object' ? l2.name_i18n.en : l2.name_i18n;
      if (l2Name) parts.push(l2Name);
    }
    
    if (l3.name_i18n) {
      const l3Name = typeof l3.name_i18n === 'object' ? l3.name_i18n.en : l3.name_i18n;
      if (l3Name) parts.push(l3Name);
    }
    
    return parts.join(' › ');
  };

  const getRequesterName = (request: VerificationRequest): string => {
    const profile = request.profiles;
    return profile?.display_name || profile?.handle || 'Unknown User';
  };

  const getRequesterInitials = (request: VerificationRequest): string => {
    const name = getRequesterName(request);
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getCompetencyLabel = (level: number): string => {
    const labels = ['', 'Novice', 'Competent', 'Proficient', 'Advanced', 'Expert'];
    return labels[level] || 'Unknown';
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const renderRequestCard = (request: VerificationRequest) => (
    <Card
      key={request.id}
      className="p-6 hover:shadow-md transition-shadow"
      style={{ backgroundColor: '#FDFCFA', borderColor: 'rgba(232, 230, 221, 0.6)' }}
    >
      <div className="flex gap-4">
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#E8E6DD', color: '#2D3330' }}
        >
          <span className="text-sm font-medium">{getRequesterInitials(request)}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base mb-1" style={{ color: '#2D3330' }}>
                {getRequesterName(request)}
              </h3>
              <p className="text-sm" style={{ color: '#6B7470' }}>
                wants you to verify their skill
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge
                variant="outline"
                className="capitalize"
                style={{
                  borderColor:
                    request.status === 'pending'
                      ? '#F59E0B'
                      : request.status === 'accepted'
                      ? '#10B981'
                      : '#EF4444',
                  color:
                    request.status === 'pending'
                      ? '#F59E0B'
                      : request.status === 'accepted'
                      ? '#10B981'
                      : '#EF4444',
                  backgroundColor:
                    request.status === 'pending'
                      ? '#FEF3C7'
                      : request.status === 'accepted'
                      ? '#D1FAE5'
                      : '#FEE2E2',
                }}
              >
                {request.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                {request.status === 'accepted' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                {request.status === 'declined' && <XCircle className="w-3 h-3 mr-1" />}
                {request.status}
              </Badge>
              <Badge
                variant="outline"
                className="capitalize"
                style={{
                  borderColor: '#1C4D3A',
                  color: '#1C4D3A',
                  backgroundColor: '#E8F5E9',
                }}
              >
                {request.verifier_source === 'peer' && <User className="w-3 h-3 mr-1" />}
                {request.verifier_source === 'manager' && <Briefcase className="w-3 h-3 mr-1" />}
                {request.verifier_source === 'external' && <ExternalLink className="w-3 h-3 mr-1" />}
                {request.verifier_source}
              </Badge>
            </div>
          </div>

          {/* Skill Info */}
          <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: '#F7F6F1' }}>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4" style={{ color: '#1C4D3A' }} />
              <span className="font-medium text-sm" style={{ color: '#2D3330' }}>
                {getSkillName(request)}
              </span>
            </div>
            {getBreadcrumb(request) && (
              <p className="text-xs ml-6" style={{ color: '#6B7470' }}>
                {getBreadcrumb(request)}
              </p>
            )}
            {request.skills?.competency_level && (
              <p className="text-xs ml-6 mt-1" style={{ color: '#6B7470' }}>
                Competency: {getCompetencyLabel(request.skills.competency_level)}
              </p>
            )}
          </div>

          {/* Message */}
          {request.message && (
            <div className="mb-3 p-3 rounded border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
              <p className="text-sm" style={{ color: '#2D3330' }}>
                &ldquo;{request.message}&rdquo;
              </p>
            </div>
          )}

          {/* Response Message (if responded) */}
          {request.response_message && (
            <div className="mb-3 p-3 rounded border" style={{ borderColor: 'rgba(232, 230, 221, 0.6)', backgroundColor: '#F7F6F1' }}>
              <p className="text-xs font-medium mb-1" style={{ color: '#6B7470' }}>
                Your response:
              </p>
              <p className="text-sm" style={{ color: '#2D3330' }}>
                &ldquo;{request.response_message}&rdquo;
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 mt-4">
            <p className="text-xs" style={{ color: '#6B7470' }}>
              Requested {formatDate(request.created_at)}
              {request.responded_at && ` • Responded ${formatDate(request.responded_at)}`}
            </p>
            
            {/* Action Buttons (pending only) */}
            {request.status === 'pending' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRespond(request, 'decline')}
                  style={{
                    borderColor: '#EF4444',
                    color: '#EF4444',
                  }}
                  className="hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleRespond(request, 'accept')}
                  style={{
                    backgroundColor: '#1C4D3A',
                    color: '#F7F6F1',
                  }}
                  className="hover:opacity-90"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Accept
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  const renderEmptyState = (status: string) => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: '#E8E6DD' }}
      >
        <ShieldCheck className="w-8 h-8" style={{ color: '#6B7470' }} />
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: '#2D3330' }}>
        No {status} requests
      </h3>
      <p className="text-sm text-center max-w-sm" style={{ color: '#6B7470' }}>
        {status === 'pending'
          ? "You don't have any pending verification requests to review."
          : status === 'accepted'
          ? "You haven't accepted any verification requests yet."
          : "You haven't declined any verification requests yet."}
      </p>
    </div>
  );

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#2D3330' }}>
            Verification Requests
          </h1>
          <p className="text-base" style={{ color: '#6B7470' }}>
            Review and respond to verification requests from others
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="pending" className="relative">
              Pending
              {pendingRequests.length > 0 && (
                <span
                  className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: '#F59E0B', color: '#FFF' }}
                >
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="accepted">
              Accepted
              {acceptedRequests.length > 0 && (
                <span className="ml-2 text-xs" style={{ color: '#6B7470' }}>
                  ({acceptedRequests.length})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="declined">
              Declined
              {declinedRequests.length > 0 && (
                <span className="ml-2 text-xs" style={{ color: '#6B7470' }}>
                  ({declinedRequests.length})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">
              All
              {requests.length > 0 && (
                <span className="ml-2 text-xs" style={{ color: '#6B7470' }}>
                  ({requests.length})
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-4">
            {pendingRequests.length === 0
              ? renderEmptyState('pending')
              : pendingRequests.map(renderRequestCard)}
          </TabsContent>

          {/* Accepted Tab */}
          <TabsContent value="accepted" className="space-y-4">
            {acceptedRequests.length === 0
              ? renderEmptyState('accepted')
              : acceptedRequests.map(renderRequestCard)}
          </TabsContent>

          {/* Declined Tab */}
          <TabsContent value="declined" className="space-y-4">
            {declinedRequests.length === 0
              ? renderEmptyState('declined')
              : declinedRequests.map(renderRequestCard)}
          </TabsContent>

          {/* All Tab */}
          <TabsContent value="all" className="space-y-4">
            {requests.length === 0
              ? renderEmptyState('all')
              : requests.map(renderRequestCard)}
          </TabsContent>
        </Tabs>
      </div>

      {/* Respond Dialog */}
      {selectedRequest && (
        <RespondDialog
          open={respondDialogOpen}
          onOpenChange={setRespondDialogOpen}
          request={selectedRequest}
          action={respondAction}
          onComplete={handleResponseComplete}
          getSkillName={getSkillName}
          getBreadcrumb={getBreadcrumb}
          getRequesterName={getRequesterName}
          getCompetencyLabel={getCompetencyLabel}
        />
      )}
    </div>
  );
}

