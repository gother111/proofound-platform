'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Briefcase,
  ExternalLink,
  Mail,
  Send,
  Trash2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { apiFetch } from '@/lib/api/fetch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { RespondDialog } from './components/RespondDialog';
import { CustomVerificationRequestDialog } from './components/CustomVerificationRequestDialog';
import { BundleCancelDialog } from './components/BundleCancelDialog';

interface VerificationRequest {
  request_type: 'skill' | 'impact_story';
  id: string;
  skill_id?: string;
  custom_request_id?: string | null;
  impact_story_id?: string;
  impact_story_title?: string | null;
  requester_profile_id: string;
  verifier_email: string;
  verifier_source?: 'peer' | 'manager' | 'external';
  verifier_name?: string | null;
  verifier_relationship?: string | null;
  request_kind?: 'generic_verification' | 'human_observed_attestation' | null;
  attestation_request?: {
    skillIds: string[];
    skillLabels: string[];
  } | null;
  message?: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'failed';
  created_at: string;
  responded_at?: string | null;
  response_message?: string | null;
  expires_at?: string | null;
  canonical_pack_id?: string | null;
  canonical_pack_title?: string | null;
  canonical_pack_summary?: string | null;
  canonical_outcomes_summary?: string | null;
  canonical_verification_status?: string | null;
  canonical_evidence_titles?: string[];
  skills?: {
    id: string;
    competency_level: number;
    name_i18n?: unknown;
    skills_taxonomy?: {
      name_i18n?: unknown;
      skills_l3?: {
        name_i18n?: unknown;
        skills_subcategories?: {
          name_i18n?: unknown;
          skills_categories?: {
            name_i18n?: unknown;
          };
        };
      };
    };
  };
  profiles?: {
    id: string;
    display_name?: string | null;
    handle?: string | null;
    avatar_url?: string | null;
  };
}

interface VerificationsClientProps {
  incomingRequests: VerificationRequest[];
  sentRequests: VerificationRequest[];
  userEmail: string;
}

type DeleteSentRequestResponse = {
  error?: string;
  code?: string;
  customRequestId?: string;
};

type ResendSentRequestResponse = {
  error?: string;
  resentRequestId?: string;
  reusedRecord?: boolean;
  bundled?: boolean;
};

type RequestStatusFilter = 'pending' | 'accepted' | 'declined' | 'all';

const STATUS_FILTERS: RequestStatusFilter[] = ['pending', 'accepted', 'declined', 'all'];

function filterByStatus(
  requests: VerificationRequest[],
  filter: RequestStatusFilter
): VerificationRequest[] {
  if (filter === 'all') {
    return requests;
  }
  return requests.filter((request) => request.status === filter);
}

export function VerificationsClient({
  incomingRequests: initialIncomingRequests,
  sentRequests: initialSentRequests,
}: VerificationsClientProps) {
  const router = useRouter();
  const [incomingRequests, setIncomingRequests] = useState(initialIncomingRequests);
  const [sentRequests, setSentRequests] = useState(initialSentRequests);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [respondAction, setRespondAction] = useState<'accept' | 'decline'>('accept');
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [bundleDialogOpen, setBundleDialogOpen] = useState(false);
  const [bundleRequestId, setBundleRequestId] = useState<string | null>(null);
  const [deletingRequestIds, setDeletingRequestIds] = useState<Record<string, boolean>>({});
  const [resendingRequestIds, setResendingRequestIds] = useState<Record<string, boolean>>({});

  const handleRespond = (request: VerificationRequest, action: 'accept' | 'decline') => {
    setSelectedRequest(request);
    setRespondAction(action);
    setRespondDialogOpen(true);
  };

  const handleResponseComplete = (
    updatedRequest: Partial<VerificationRequest> & { id: string }
  ) => {
    setIncomingRequests((prev) =>
      prev.map((request) =>
        request.id === updatedRequest.id ? { ...request, ...updatedRequest } : request
      )
    );
    setRespondDialogOpen(false);
    setSelectedRequest(null);
  };

  const canDeleteSentRequest = (request: VerificationRequest) => {
    if (request.request_type === 'skill') {
      return request.status === 'pending';
    }

    return request.status === 'pending' || request.status === 'failed';
  };

  const canResendSentRequest = (request: VerificationRequest) => {
    if (request.request_type === 'skill') {
      return (
        request.status === 'pending' ||
        request.status === 'declined' ||
        request.status === 'expired'
      );
    }

    return (
      request.status === 'pending' ||
      request.status === 'failed' ||
      request.status === 'declined' ||
      request.status === 'expired'
    );
  };

  const openBundleCancelDialog = (customRequestId: string) => {
    setBundleRequestId(customRequestId);
    setBundleDialogOpen(true);
  };

  const handleBundleItemsCanceled = (removedSkillRequestIds: string[]) => {
    if (removedSkillRequestIds.length > 0) {
      const removedSet = new Set(removedSkillRequestIds);
      setSentRequests((prev) => prev.filter((item) => !removedSet.has(item.id)));
    }
  };

  const handleBundleDialogOpenChange = (open: boolean) => {
    setBundleDialogOpen(open);
    if (!open) {
      setBundleRequestId(null);
    }
  };

  const handleDeleteSentRequest = async (request: VerificationRequest) => {
    if (!canDeleteSentRequest(request)) {
      return;
    }

    if (request.request_type === 'skill' && request.custom_request_id) {
      openBundleCancelDialog(request.custom_request_id);
      return;
    }

    setDeletingRequestIds((prev) => ({ ...prev, [request.id]: true }));
    try {
      const response = await apiFetch(
        `/api/expertise/verifications/sent/${request.request_type}/${request.id}`,
        {
          method: 'DELETE',
        }
      );

      let body: DeleteSentRequestResponse = {};
      try {
        body = (await response.json()) as DeleteSentRequestResponse;
      } catch {
        body = {};
      }

      if (response.ok) {
        setSentRequests((prev) => prev.filter((item) => item.id !== request.id));
        toast.success('Verification request deleted.');
        return;
      }

      if (response.status === 409 && body.code === 'BUNDLED_REQUEST' && body.customRequestId) {
        openBundleCancelDialog(body.customRequestId);
        return;
      }

      toast.error(body.error || 'Failed to delete verification request.');
    } catch (error) {
      console.error('Failed to delete sent verification request:', error);
      toast.error('Failed to delete verification request.');
    } finally {
      setDeletingRequestIds((prev) => {
        const next = { ...prev };
        delete next[request.id];
        return next;
      });
    }
  };

  const handleResendSentRequest = async (request: VerificationRequest) => {
    if (!canResendSentRequest(request)) {
      return;
    }

    setResendingRequestIds((prev) => ({ ...prev, [request.id]: true }));
    try {
      const response = await apiFetch(
        `/api/expertise/verifications/sent/${request.request_type}/${request.id}`,
        {
          method: 'POST',
        }
      );

      let body: ResendSentRequestResponse = {};
      try {
        body = (await response.json()) as ResendSentRequestResponse;
      } catch {
        body = {};
      }

      if (!response.ok) {
        toast.error(body.error || 'Failed to resend verification request.');
        return;
      }

      const createdNewRequest = Boolean(
        body.resentRequestId && body.resentRequestId !== request.id
      );
      if (createdNewRequest || body.bundled) {
        router.refresh();
      }

      toast.success(
        request.request_type === 'skill' && request.custom_request_id
          ? 'Bundled verification request resent.'
          : 'Verification request resent.'
      );
    } catch (error) {
      console.error('Failed to resend sent verification request:', error);
      toast.error('Failed to resend verification request.');
    } finally {
      setResendingRequestIds((prev) => {
        const next = { ...prev };
        delete next[request.id];
        return next;
      });
    }
  };

  const getSkillName = (request: VerificationRequest): string => {
    const skill = request.skills;
    if (!skill) return 'Unknown Skill';

    if (skill.name_i18n && typeof skill.name_i18n === 'object' && 'en' in skill.name_i18n) {
      return String((skill.name_i18n as Record<string, unknown>).en || 'Unknown Skill');
    }

    if (skill.skills_taxonomy?.name_i18n) {
      const taxName = skill.skills_taxonomy.name_i18n;
      if (typeof taxName === 'object' && taxName && 'en' in taxName) {
        return String((taxName as Record<string, unknown>).en || 'Unknown Skill');
      }
      if (typeof taxName === 'string') {
        return taxName;
      }
    }

    return 'Unknown Skill';
  };

  const getRequestSubject = (request: VerificationRequest): string => {
    if (request.canonical_pack_title) {
      return request.canonical_pack_title;
    }

    if (request.request_type === 'impact_story') {
      return request.impact_story_title || 'Impact Story';
    }
    return getSkillName(request);
  };

  const renderCanonicalProofContext = (request: VerificationRequest) => {
    if (
      !request.canonical_pack_summary &&
      !request.canonical_outcomes_summary &&
      !request.canonical_verification_status &&
      !(request.canonical_evidence_titles?.length ?? 0)
    ) {
      return null;
    }

    return (
      <div className="mt-3 ml-6 rounded-md border border-proofound-stone/70 bg-white/70 p-3 dark:border-border dark:bg-background/50">
        {request.canonical_verification_status && (
          <p className="text-xs font-medium text-proofound-forest dark:text-primary">
            Proof Pack status: {request.canonical_verification_status.replace(/_/g, ' ')}
          </p>
        )}
        {request.canonical_pack_summary && (
          <p className="mt-1 text-xs text-muted-foreground">{request.canonical_pack_summary}</p>
        )}
        {request.canonical_outcomes_summary && (
          <p className="mt-1 text-xs text-muted-foreground">
            Outcomes: {request.canonical_outcomes_summary}
          </p>
        )}
        {(request.canonical_evidence_titles?.length ?? 0) > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Evidence: {request.canonical_evidence_titles?.join('; ')}
          </p>
        )}
      </div>
    );
  };

  const getBreadcrumb = (request: VerificationRequest): string => {
    if (request.request_type !== 'skill') return '';

    const skill = request.skills;
    if (!skill?.skills_taxonomy?.skills_l3) return '';

    const l3 = skill.skills_taxonomy.skills_l3;
    const l2 = l3.skills_subcategories;
    const l1 = l2?.skills_categories;

    const parts: string[] = [];

    if (l1?.name_i18n) {
      const l1Name =
        typeof l1.name_i18n === 'object'
          ? (l1.name_i18n as Record<string, unknown>).en
          : l1.name_i18n;
      if (typeof l1Name === 'string' && l1Name) {
        parts.push(l1Name);
      }
    }

    if (l2?.name_i18n) {
      const l2Name =
        typeof l2.name_i18n === 'object'
          ? (l2.name_i18n as Record<string, unknown>).en
          : l2.name_i18n;
      if (typeof l2Name === 'string' && l2Name) {
        parts.push(l2Name);
      }
    }

    if (l3.name_i18n) {
      const l3Name =
        typeof l3.name_i18n === 'object'
          ? (l3.name_i18n as Record<string, unknown>).en
          : l3.name_i18n;
      if (typeof l3Name === 'string' && l3Name) {
        parts.push(l3Name);
      }
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
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getCompetencyLabel = (level: number): string => {
    const labels = ['', 'Novice', 'Competent', 'Proficient', 'Advanced', 'Expert'];
    return labels[level] || 'Unknown';
  };

  const getStatusClasses = (status: VerificationRequest['status']) => {
    if (status === 'pending') {
      return 'border-amber-500 text-amber-500 bg-amber-100 dark:bg-amber-500/10';
    }
    if (status === 'accepted') {
      return 'border-emerald-500 text-emerald-500 bg-emerald-100 dark:bg-emerald-500/10';
    }
    if (status === 'declined' || status === 'failed') {
      return 'border-destructive text-destructive bg-destructive/10';
    }
    return 'border-muted-foreground text-muted-foreground bg-muted';
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

  const renderStatusBadge = (request: VerificationRequest) => (
    <Badge variant="outline" className={cn('capitalize', getStatusClasses(request.status))}>
      {request.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
      {request.status === 'accepted' && <CheckCircle2 className="w-3 h-3 mr-1" />}
      {request.status === 'declined' && <XCircle className="w-3 h-3 mr-1" />}
      {request.status === 'failed' && <AlertCircle className="w-3 h-3 mr-1" />}
      {request.status === 'expired' && <Clock className="w-3 h-3 mr-1" />}
      {request.status}
    </Badge>
  );

  const renderSourceBadge = (request: VerificationRequest) => {
    if (!request.verifier_source) return null;

    return (
      <Badge
        variant="outline"
        className="capitalize border-proofound-forest text-proofound-forest bg-proofound-forest/10 dark:border-primary dark:text-primary dark:bg-primary/10"
      >
        {request.verifier_source === 'peer' && <User className="w-3 h-3 mr-1" />}
        {request.verifier_source === 'manager' && <Briefcase className="w-3 h-3 mr-1" />}
        {request.verifier_source === 'external' && <ExternalLink className="w-3 h-3 mr-1" />}
        {request.verifier_source}
      </Badge>
    );
  };

  const renderIncomingRequestCard = (request: VerificationRequest) => (
    <Card variant="bento" key={`${request.request_type}-${request.id}`} className="p-6">
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-proofound-stone text-proofound-charcoal dark:bg-muted dark:text-foreground">
          <span className="text-sm font-medium">{getRequesterInitials(request)}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base mb-1 text-proofound-charcoal dark:text-foreground">
                {getRequesterName(request)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {request.request_type === 'impact_story'
                  ? 'wants you to verify their impact story'
                  : 'wants you to verify their skill'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {renderStatusBadge(request)}
              {renderSourceBadge(request)}
            </div>
          </div>

          <div className="mb-3 p-3 rounded-lg bg-proofound-parchment dark:bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-proofound-forest dark:text-primary" />
              <span className="font-medium text-sm text-proofound-charcoal dark:text-foreground">
                {getRequestSubject(request)}
              </span>
            </div>
            {getBreadcrumb(request) && (
              <p className="text-xs ml-6 text-muted-foreground">{getBreadcrumb(request)}</p>
            )}
            {request.request_type === 'skill' && request.skills?.competency_level && (
              <p className="text-xs ml-6 mt-1 text-muted-foreground">
                Competency: {getCompetencyLabel(request.skills.competency_level)}
              </p>
            )}
            {request.request_type === 'impact_story' && request.verifier_relationship && (
              <p className="text-xs ml-6 mt-1 text-muted-foreground">
                Relationship: {request.verifier_relationship}
              </p>
            )}
            {renderCanonicalProofContext(request)}
          </div>

          {request.message && (
            <div className="mb-3 p-3 rounded border border-proofound-stone/60 dark:border-border">
              <p className="text-sm text-proofound-charcoal dark:text-foreground">
                &ldquo;{request.message}&rdquo;
              </p>
            </div>
          )}

          {request.response_message && (
            <div className="mb-3 p-3 rounded border border-proofound-stone/60 bg-proofound-parchment dark:border-border dark:bg-muted/50">
              <p className="text-xs font-medium mb-1 text-muted-foreground">Your response:</p>
              <p className="text-sm text-proofound-charcoal dark:text-foreground">
                &ldquo;{request.response_message}&rdquo;
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 mt-4">
            <p className="text-xs text-muted-foreground">
              Requested {formatDate(request.created_at)}
              {request.responded_at && ` • Responded ${formatDate(request.responded_at)}`}
            </p>

            {request.request_type === 'skill' && request.status === 'pending' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRespond(request, 'decline')}
                  className="border-destructive text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleRespond(request, 'accept')}
                  className="bg-proofound-forest text-white hover:bg-proofound-forest/90 dark:bg-primary dark:text-primary-foreground hover:opacity-90"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Accept
                </Button>
              </div>
            )}
            {request.request_type === 'impact_story' && request.status === 'pending' && (
              <p className="text-xs text-muted-foreground">
                Respond using the verification link that was sent to your email.
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  const renderSentRequestCard = (request: VerificationRequest) => (
    <Card variant="bento" key={`${request.request_type}-${request.id}`} className="p-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base mb-1 flex items-center gap-2 text-proofound-charcoal dark:text-foreground">
            <Mail className="w-4 h-4" />
            {request.verifier_email}
          </h3>
          <p className="text-sm text-muted-foreground">
            {request.request_type === 'impact_story'
              ? 'Impact story verification request sent'
              : 'Verification request sent'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {renderStatusBadge(request)}
          {renderSourceBadge(request)}
        </div>
      </div>

      <div className="mb-3 p-3 rounded-lg bg-proofound-parchment dark:bg-muted/50">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-proofound-forest dark:text-primary" />
          <span className="font-medium text-sm text-proofound-charcoal dark:text-foreground">
            {getRequestSubject(request)}
          </span>
        </div>
        {getBreadcrumb(request) && (
          <p className="text-xs ml-6 text-muted-foreground">{getBreadcrumb(request)}</p>
        )}
        {request.request_type === 'impact_story' && request.verifier_relationship && (
          <p className="text-xs ml-6 mt-1 text-muted-foreground">
            Relationship: {request.verifier_relationship}
          </p>
        )}
        {renderCanonicalProofContext(request)}
      </div>

      {request.message && (
        <div className="mb-3 p-3 rounded border border-proofound-stone/60 dark:border-border">
          <p className="text-xs font-medium mb-1 text-muted-foreground">Your message:</p>
          <p className="text-sm text-proofound-charcoal dark:text-foreground">
            &ldquo;{request.message}&rdquo;
          </p>
        </div>
      )}

      {request.response_message && (
        <div className="mb-3 p-3 rounded border border-proofound-stone/60 bg-proofound-parchment dark:border-border dark:bg-muted/50">
          <p className="text-xs font-medium mb-1 text-muted-foreground">Verifier response:</p>
          <p className="text-sm text-proofound-charcoal dark:text-foreground">
            &ldquo;{request.response_message}&rdquo;
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Sent {formatDate(request.created_at)}
          {request.responded_at && ` • Responded ${formatDate(request.responded_at)}`}
        </p>
        <div className="flex items-center gap-2">
          {canResendSentRequest(request) && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                void handleResendSentRequest(request);
              }}
              disabled={Boolean(resendingRequestIds[request.id])}
              className="border-proofound-forest text-proofound-forest hover:bg-[#E8F5E9]"
            >
              <Send className="h-4 w-4 mr-1" />
              {resendingRequestIds[request.id]
                ? 'Resending...'
                : request.request_type === 'skill' && request.custom_request_id
                  ? 'Resend bundle'
                  : 'Resend request'}
            </Button>
          )}
          {canDeleteSentRequest(request) && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                void handleDeleteSentRequest(request);
              }}
              disabled={Boolean(deletingRequestIds[request.id])}
              className="border-[#C76B4A] text-[#8B4A36] hover:bg-[#FFF0F0]"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {deletingRequestIds[request.id]
                ? 'Deleting...'
                : request.request_type === 'skill' && request.custom_request_id
                  ? 'Manage Bundle'
                  : 'Delete'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  const renderEmptyState = (status: RequestStatusFilter, mode: 'incoming' | 'sent') => {
    const modeText = mode === 'incoming' ? 'incoming' : 'sent';

    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-proofound-stone dark:bg-muted">
          <ShieldCheck className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-proofound-charcoal dark:text-foreground">
          No {status} {modeText} requests
        </h3>
        <p className="text-sm text-center max-w-sm text-muted-foreground">
          {mode === 'incoming'
            ? 'You do not have verification requests in this view yet.'
            : 'You have not sent verification requests in this view yet.'}
        </p>
      </div>
    );
  };

  const renderStatusTabs = (requests: VerificationRequest[], mode: 'incoming' | 'sent') => (
    <Tabs defaultValue="pending" className="w-full">
      <TabsList className="mb-6">
        {STATUS_FILTERS.map((status) => {
          const filteredCount = filterByStatus(requests, status).length;
          const label = status.charAt(0).toUpperCase() + status.slice(1);

          return (
            <TabsTrigger key={status} value={status} className="relative">
              {label}
              {filteredCount > 0 && (
                <span
                  className={cn(
                    'ml-2 px-2 py-0.5 rounded-full text-xs font-medium',
                    status === 'pending'
                      ? 'bg-amber-500 text-white dark:bg-amber-500/10 dark:text-amber-500'
                      : 'bg-proofound-stone text-proofound-charcoal dark:bg-muted dark:text-foreground'
                  )}
                >
                  {filteredCount}
                </span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {STATUS_FILTERS.map((status) => {
        const filteredRequests = filterByStatus(requests, status);
        return (
          <TabsContent key={status} value={status} className="space-y-4">
            {filteredRequests.length === 0
              ? renderEmptyState(status, mode)
              : filteredRequests.map(
                  mode === 'incoming' ? renderIncomingRequestCard : renderSentRequestCard
                )}
          </TabsContent>
        );
      })}
    </Tabs>
  );

  return (
    <AppSurface>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-proofound-charcoal dark:text-foreground">
              Verification Requests
            </h1>
            <p className="text-base text-muted-foreground">
              Track requests sent by you and review incoming verification requests
            </p>
          </div>
          <Button
            onClick={() => setCustomDialogOpen(true)}
            className="bg-proofound-forest text-white hover:bg-proofound-forest/90 dark:bg-primary dark:text-primary-foreground hover:opacity-90 w-full md:w-auto"
          >
            <Send className="w-4 h-4 mr-2" />
            Custom verification request
          </Button>
        </div>

        <Tabs defaultValue="incoming" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="incoming" className="relative">
              Incoming
              {incomingRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500 text-white dark:bg-amber-500/10 dark:text-amber-500">
                  {incomingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="relative">
              Sent
              {sentRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-proofound-stone text-proofound-charcoal dark:bg-muted dark:text-foreground">
                  {sentRequests.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="incoming">
            {renderStatusTabs(incomingRequests, 'incoming')}
          </TabsContent>

          <TabsContent value="sent">{renderStatusTabs(sentRequests, 'sent')}</TabsContent>
        </Tabs>
      </div>

      {selectedRequest && selectedRequest.request_type === 'skill' && (
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
      <CustomVerificationRequestDialog
        open={customDialogOpen}
        onOpenChange={setCustomDialogOpen}
        onCreated={() => router.refresh()}
      />
      <BundleCancelDialog
        open={bundleDialogOpen}
        onOpenChange={handleBundleDialogOpenChange}
        requestId={bundleRequestId}
        onCanceled={handleBundleItemsCanceled}
      />
    </AppSurface>
  );
}
