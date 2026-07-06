'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowDownWideNarrow,
  User,
  Briefcase,
  ExternalLink,
  Mail,
  Send,
  Trash2,
  Wand2,
  ListFilter,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { apiFetch } from '@/lib/api/fetch';
import type {
  VerificationComposerProofPackOption,
  VerificationRequestView,
} from '@/lib/verification/request-feed';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { verificationStatusLabel } from '@/lib/copy/labels';
import {
  relationshipDisplayLabel,
  type CustomVerificationRelationship,
} from '@/lib/verification/custom-verification-labels';
import { RespondDialog } from './components/RespondDialog';
import { BundleCancelDialog } from './components/BundleCancelDialog';
import { VerificationRequestComposerDialog } from './components/VerificationRequestComposerDialog';
import { useAssistiveAiFlag } from '@/hooks/useAssistiveAiFlag';

type VerificationRequest = VerificationRequestView;

export interface VerificationsClientProps {
  incomingRequests: VerificationRequest[];
  sentRequests: VerificationRequest[];
  composerProofPacks?: VerificationComposerProofPackOption[];
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

type RequestStatusFilter =
  | 'all'
  | 'active'
  | 'pending'
  | 'needs_attention'
  | 'declined'
  | 'expired_stale'
  | 'revoked_corrected';
type RequestSortMode = 'recency' | 'scope';

const STATUS_FILTERS: Array<{ value: RequestStatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'needs_attention', label: 'Needs attention' },
  { value: 'declined', label: 'Declined' },
  { value: 'expired_stale', label: 'Expired / stale' },
  { value: 'revoked_corrected', label: 'Revoked / corrected' },
];

const ATTENTION_STATUSES = new Set<VerificationRequest['status']>([
  'failed',
  'contradicted',
  'disputed',
]);
const REVOKED_OR_CORRECTED_STATUSES = new Set<VerificationRequest['status']>([
  'revoked',
  'corrected',
  'cancelled',
]);

function parseTime(value: string | null | undefined): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function isPastExpiry(request: VerificationRequest, nowMs: number) {
  const expiresAtMs = parseTime(request.expiresAt);
  return expiresAtMs > 0 && expiresAtMs < nowMs;
}

function isExpiredOrStale(request: VerificationRequest, nowMs: number) {
  return request.status === 'expired' || isPastExpiry(request, nowMs);
}

function isActiveVerification(request: VerificationRequest, nowMs: number) {
  return request.status === 'accepted' && !isExpiredOrStale(request, nowMs);
}

function isPendingVerification(request: VerificationRequest, nowMs: number) {
  return request.status === 'pending' && !isExpiredOrStale(request, nowMs);
}

function isNeedsAttention(request: VerificationRequest, nowMs: number) {
  if (ATTENTION_STATUSES.has(request.status)) {
    return true;
  }

  const expiresAtMs = parseTime(request.expiresAt);
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  return request.status === 'pending' && expiresAtMs > nowMs && expiresAtMs - nowMs <= sevenDaysMs;
}

function filterByStatus(
  requests: VerificationRequest[],
  filter: RequestStatusFilter,
  nowMs: number
): VerificationRequest[] {
  if (filter === 'all') {
    return requests;
  }

  return requests.filter((request) => {
    if (filter === 'active') {
      return isActiveVerification(request, nowMs);
    }
    if (filter === 'pending') {
      return isPendingVerification(request, nowMs);
    }
    if (filter === 'needs_attention') {
      return isNeedsAttention(request, nowMs);
    }
    if (filter === 'declined') {
      return request.status === 'declined';
    }
    if (filter === 'expired_stale') {
      return isExpiredOrStale(request, nowMs);
    }
    return REVOKED_OR_CORRECTED_STATUSES.has(request.status);
  });
}

export function VerificationsClient({
  incomingRequests: initialIncomingRequests,
  sentRequests: initialSentRequests,
  composerProofPacks = [],
}: VerificationsClientProps) {
  const router = useRouter();
  const assistiveAiEnabled = useAssistiveAiFlag();
  const [incomingRequests, setIncomingRequests] = useState(initialIncomingRequests);
  const [sentRequests, setSentRequests] = useState(initialSentRequests);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [respondAction, setRespondAction] = useState<'accept' | 'decline'>('accept');
  const [bundleDialogOpen, setBundleDialogOpen] = useState(false);
  const [bundleRequestId, setBundleRequestId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [deletingRequestIds, setDeletingRequestIds] = useState<Record<string, boolean>>({});
  const [resendingRequestIds, setResendingRequestIds] = useState<Record<string, boolean>>({});
  const [incomingFilter, setIncomingFilter] = useState<RequestStatusFilter>('all');
  const [sentFilter, setSentFilter] = useState<RequestStatusFilter>('all');
  const [sortMode, setSortMode] = useState<RequestSortMode>('recency');
  const nowMs = Date.now();

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
    if (request.subjectType === 'custom_bundle') {
      return request.status === 'pending';
    }

    if (request.subjectType === 'skill') {
      return request.status === 'pending';
    }

    return request.status === 'pending' || request.status === 'failed';
  };

  const canResendSentRequest = (request: VerificationRequest) => {
    if (request.subjectType === 'custom_bundle') {
      return (
        request.status === 'pending' ||
        request.status === 'declined' ||
        request.status === 'expired' ||
        request.status === 'revoked'
      );
    }

    if (request.subjectType === 'skill') {
      return (
        request.status === 'pending' ||
        request.status === 'declined' ||
        request.status === 'expired' ||
        request.status === 'revoked'
      );
    }

    return (
      request.status === 'pending' ||
      request.status === 'failed' ||
      request.status === 'declined' ||
      request.status === 'expired' ||
      request.status === 'revoked'
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
    router.refresh();
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

    if (request.subjectType === 'custom_bundle') {
      openBundleCancelDialog(request.id);
      return;
    }

    if (request.subjectType === 'skill' && request.bundleId) {
      openBundleCancelDialog(request.bundleId);
      return;
    }

    setDeletingRequestIds((prev) => ({ ...prev, [request.id]: true }));
    try {
      const response = await apiFetch(
        `/api/verification/requests/${
          request.subjectType === 'impact_story' ? 'impact-story' : 'skill'
        }/${request.id}`,
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
        `/api/verification/requests/${
          request.subjectType === 'custom_bundle'
            ? 'bundles'
            : request.subjectType === 'impact_story'
              ? 'impact-story'
              : 'skill'
        }/${request.id}`,
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
        request.subjectType === 'custom_bundle' ||
          (request.subjectType === 'skill' && request.bundleId)
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
    if (request.proofLabel) {
      return request.proofLabel;
    }

    if (request.canonicalPackTitle) {
      return request.canonicalPackTitle;
    }

    if (request.subjectType === 'custom_bundle') {
      const preview = request.bundlePreviewLabels || [];
      if (preview.length === 0) {
        return request.bundleItemCount
          ? `Custom verification bundle (${request.bundleItemCount} artifacts)`
          : 'Custom verification bundle';
      }

      const extraCount = Math.max((request.bundleItemCount || preview.length) - preview.length, 0);
      return extraCount > 0 ? `${preview.join(', ')} + ${extraCount} more` : preview.join(', ');
    }

    if (request.subjectType === 'impact_story') {
      return request.impactStoryTitle || 'Impact Story';
    }
    return getSkillName(request);
  };

  const getClaimSummary = (request: VerificationRequest): string => {
    if (request.claimSummary) {
      return request.claimSummary;
    }

    if (request.subjectType === 'impact_story') {
      return 'Confirm the role, outcomes, and evidence attached to this proof.';
    }

    if (request.subjectType === 'custom_bundle') {
      return 'Confirm the grouped proof items attached to this legacy request.';
    }

    return 'Confirm this skill claim from direct observation.';
  };

  const getConfirmationOutcome = (request: VerificationRequest): string => {
    if (request.confirmationOutcome) {
      return request.confirmationOutcome;
    }

    if (request.subjectType === 'impact_story') {
      return 'This proof gains a non-self confirmation signal for introduction readiness review.';
    }

    if (request.subjectType === 'custom_bundle') {
      return 'These legacy bundle items retain a bounded confirmation record.';
    }

    return 'This skill keeps a bounded confirmation linked to the attached proof.';
  };

  const getScopeLabel = (request: VerificationRequest): string => {
    if (request.subjectType === 'custom_bundle') {
      return 'Proof record bundle';
    }

    if (request.subjectType === 'impact_story') {
      return 'Proof record outcome';
    }

    if (request.requestKind === 'human_observed_attestation') {
      return 'Skill observed in context';
    }

    return 'Skill claim';
  };

  const getRequestedPersonLabel = (request: VerificationRequest): string => {
    const source = request.verifierRelationship || request.verifierSource || 'verifier';
    return request.verifierEmail ? `${request.verifierEmail} (${source})` : source;
  };

  const renderCanonicalProofContext = (request: VerificationRequest) => {
    if (
      !request.canonicalPackSummary &&
      !request.canonicalOutcomesSummary &&
      !request.canonicalVerificationStatus &&
      !(request.canonicalEvidenceTitles?.length ?? 0)
    ) {
      return null;
    }

    return (
      <div className="mt-3 ml-6 rounded-md border border-proofound-stone/70 bg-white/70 p-3 dark:border-border dark:bg-background/50">
        {request.canonicalVerificationStatus && (
          <p className="text-xs font-medium text-proofound-forest dark:text-primary">
            Proof record status: {verificationStatusLabel(request.canonicalVerificationStatus)}
          </p>
        )}
        {request.canonicalPackSummary && (
          <p className="mt-1 text-xs text-muted-foreground">{request.canonicalPackSummary}</p>
        )}
        {request.canonicalOutcomesSummary && (
          <p className="mt-1 text-xs text-muted-foreground">
            Outcomes: {request.canonicalOutcomesSummary}
          </p>
        )}
        {(request.canonicalEvidenceTitles?.length ?? 0) > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Evidence: {request.canonicalEvidenceTitles?.join('; ')}
          </p>
        )}
      </div>
    );
  };

  const getBreadcrumb = (request: VerificationRequest): string => {
    if (request.subjectType !== 'skill') return '';

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
    if (status === 'declined' || status === 'failed' || status === 'contradicted') {
      return 'border-destructive text-destructive bg-destructive/10';
    }
    if (status === 'revoked' || status === 'corrected' || status === 'cancelled') {
      return 'border-slate-500 text-slate-600 bg-slate-100 dark:bg-slate-500/10 dark:text-slate-300';
    }
    if (status === 'disputed') {
      return 'border-orange-500 text-orange-600 bg-orange-100 dark:bg-orange-500/10';
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
      {(request.status === 'failed' ||
        request.status === 'contradicted' ||
        request.status === 'disputed') && <AlertCircle className="w-3 h-3 mr-1" />}
      {request.status === 'expired' && <Clock className="w-3 h-3 mr-1" />}
      {(request.status === 'revoked' ||
        request.status === 'corrected' ||
        request.status === 'cancelled') && <XCircle className="w-3 h-3 mr-1" />}
      {verificationStatusLabel(request.status)}
    </Badge>
  );

  const renderSourceBadge = (request: VerificationRequest) => {
    if (!request.verifierSource) return null;

    return (
      <Badge
        variant="outline"
        className="capitalize border-proofound-forest text-proofound-forest bg-proofound-forest/10 dark:border-primary dark:text-primary dark:bg-primary/10"
      >
        {request.verifierSource === 'peer' && <User className="w-3 h-3 mr-1" />}
        {request.verifierSource === 'manager' && <Briefcase className="w-3 h-3 mr-1" />}
        {request.verifierSource === 'external' && <ExternalLink className="w-3 h-3 mr-1" />}
        {relationshipDisplayLabel(request.verifierSource as CustomVerificationRelationship)}
      </Badge>
    );
  };

  const renderIncomingRequestCard = (request: VerificationRequest) => (
    <Card
      variant="bento"
      key={`${request.subjectType}-${request.id}`}
      className="p-4 sm:p-6"
      role="listitem"
      data-testid="verification-request-row"
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-proofound-stone text-proofound-charcoal dark:bg-muted dark:text-foreground">
          <span className="text-sm font-medium">{getRequesterInitials(request)}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base mb-1 text-proofound-charcoal dark:text-foreground">
                {getRequesterName(request)}
              </h3>
              <p className="text-sm text-muted-foreground">
                Asked you to confirm a proof-backed claim
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:flex-shrink-0">
              {renderStatusBadge(request)}
              {renderSourceBadge(request)}
            </div>
          </div>

          <div className="mb-3 grid gap-3 rounded-lg bg-proofound-parchment p-3 dark:bg-muted/50 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Scope
              </p>
              <p className="mt-1 text-sm font-medium text-proofound-charcoal dark:text-foreground">
                {getScopeLabel(request)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Tied to
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium text-proofound-charcoal dark:text-foreground">
                <ShieldCheck className="h-4 w-4 text-proofound-forest dark:text-primary" />
                {getRequestSubject(request)}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Claim
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{getClaimSummary(request)}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Outcome if confirmed
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {getConfirmationOutcome(request)}
              </p>
            </div>
            {getBreadcrumb(request) && (
              <p className="text-xs text-muted-foreground sm:col-span-2">
                {getBreadcrumb(request)}
              </p>
            )}
            {request.subjectType === 'skill' && request.skills?.competency_level && (
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Competency: {getCompetencyLabel(request.skills.competency_level)}
              </p>
            )}
            {request.subjectType === 'impact_story' && request.verifierRelationship && (
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Relationship: {request.verifierRelationship}
              </p>
            )}
            {renderCanonicalProofContext(request)}
          </div>

          {request.message && (
            <div className="mb-3 p-3 rounded border border-proofound-stone/60 dark:border-border">
              <p className="text-xs font-medium mb-1 text-muted-foreground">Request note</p>
              <p className="text-sm text-proofound-charcoal dark:text-foreground">
                &ldquo;{request.message}&rdquo;
              </p>
            </div>
          )}

          {request.responseMessage && (
            <div className="mb-3 p-3 rounded border border-proofound-stone/60 bg-proofound-parchment dark:border-border dark:bg-muted/50">
              <p className="text-xs font-medium mb-1 text-muted-foreground">Your response:</p>
              <p className="text-sm text-proofound-charcoal dark:text-foreground">
                &ldquo;{request.responseMessage}&rdquo;
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-xs leading-5 text-muted-foreground">
              Requested {formatDate(request.createdAt)}
              {request.respondedAt && ` • Responded ${formatDate(request.respondedAt)}`}
            </p>

            {request.subjectType === 'skill' && request.status === 'pending' && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRespond(request, 'decline')}
                  className="w-full border-destructive text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 sm:w-auto"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleRespond(request, 'accept')}
                  className="w-full bg-proofound-forest text-white hover:bg-proofound-forest/90 dark:bg-primary dark:text-primary-foreground hover:opacity-90 sm:w-auto"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Confirm observation
                </Button>
              </div>
            )}
            {request.subjectType === 'impact_story' && request.status === 'pending' && (
              <p className="text-xs text-muted-foreground">
                Use the emailed link to respond to this proof confirmation request.
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  const renderSentRequestCard = (request: VerificationRequest) => (
    <Card
      variant="bento"
      key={`${request.subjectType}-${request.id}`}
      className="p-4 sm:p-6"
      role="listitem"
      data-testid="verification-request-row"
    >
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base mb-1 flex items-center gap-2 text-proofound-charcoal dark:text-foreground">
            <Mail className="w-4 h-4" />
            {request.verifierEmail}
          </h3>
          <p className="text-sm text-muted-foreground">
            {request.subjectType === 'custom_bundle'
              ? 'Legacy bundle request sent'
              : 'Proof confirmation request sent'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:flex-shrink-0">
          {renderStatusBadge(request)}
          {renderSourceBadge(request)}
        </div>
      </div>

      <div className="mb-3 grid gap-3 rounded-lg bg-proofound-parchment p-3 dark:bg-muted/50 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Scope
          </p>
          <p className="mt-1 text-sm font-medium text-proofound-charcoal dark:text-foreground">
            {getScopeLabel(request)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Tied to
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm font-medium text-proofound-charcoal dark:text-foreground">
            <ShieldCheck className="h-4 w-4 text-proofound-forest dark:text-primary" />
            {getRequestSubject(request)}
          </p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Claim
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{getClaimSummary(request)}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Requested from
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{getRequestedPersonLabel(request)}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Outcome if confirmed
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{getConfirmationOutcome(request)}</p>
        </div>
        {getBreadcrumb(request) && (
          <p className="text-xs text-muted-foreground sm:col-span-2">{getBreadcrumb(request)}</p>
        )}
        {request.subjectType !== 'skill' && request.verifierRelationship && (
          <p className="text-xs text-muted-foreground sm:col-span-2">
            Relationship: {request.verifierRelationship}
          </p>
        )}
        {request.subjectType === 'custom_bundle' && request.bundleItemCount ? (
          <p className="text-xs text-muted-foreground sm:col-span-2">
            {request.bundleItemCount} artifact{request.bundleItemCount === 1 ? '' : 's'}
          </p>
        ) : null}
        {renderCanonicalProofContext(request)}
      </div>

      {request.message && (
        <div className="mb-3 p-3 rounded border border-proofound-stone/60 dark:border-border">
          <p className="text-xs font-medium mb-1 text-muted-foreground">Request note</p>
          <p className="text-sm text-proofound-charcoal dark:text-foreground">
            &ldquo;{request.message}&rdquo;
          </p>
        </div>
      )}

      {request.responseMessage && (
        <div className="mb-3 p-3 rounded border border-proofound-stone/60 bg-proofound-parchment dark:border-border dark:bg-muted/50">
          <p className="text-xs font-medium mb-1 text-muted-foreground">Verifier response:</p>
          <p className="text-sm text-proofound-charcoal dark:text-foreground">
            &ldquo;{request.responseMessage}&rdquo;
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-xs leading-5 text-muted-foreground">
          Sent {formatDate(request.createdAt)}
          {request.respondedAt && ` • Responded ${formatDate(request.respondedAt)}`}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {canResendSentRequest(request) && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                void handleResendSentRequest(request);
              }}
              disabled={Boolean(resendingRequestIds[request.id])}
              className="w-full border-proofound-forest text-proofound-forest hover:bg-[#E8F5E9] sm:w-auto"
            >
              <Send className="h-4 w-4 mr-1" />
              {resendingRequestIds[request.id]
                ? 'Resending...'
                : request.subjectType === 'custom_bundle' ||
                    (request.subjectType === 'skill' && request.bundleId)
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
              className="w-full border-[#C76B4A] text-[#8B4A36] hover:bg-[#FFF0F0] sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {deletingRequestIds[request.id]
                ? 'Deleting...'
                : request.subjectType === 'custom_bundle' ||
                    (request.subjectType === 'skill' && request.bundleId)
                  ? 'Manage legacy bundle'
                  : 'Delete'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  const renderEmptyState = (status: RequestStatusFilter, mode: 'incoming' | 'sent') => {
    const modeText = mode === 'incoming' ? 'incoming' : 'sent';
    const statusLabel = STATUS_FILTERS.find((item) => item.value === status)?.label ?? 'filtered';
    const statusText = status === 'all' ? '' : `${statusLabel.toLowerCase()} `;

    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-proofound-stone/80 bg-white/55 px-4 py-14">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-proofound-stone dark:bg-muted">
          <ShieldCheck className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-proofound-charcoal dark:text-foreground">
          No {statusText}
          {modeText} proof requests
        </h3>
        <p className="max-w-sm text-center text-sm leading-6 text-muted-foreground">
          {mode === 'incoming'
            ? 'Nothing is waiting here. New proof confirmations will arrive with the claim and expected outcome attached.'
            : 'Nothing has been sent in this view yet. Requests you send will keep the proof, verifier, and outcome together.'}
        </p>
      </div>
    );
  };

  const sortRequests = (requests: VerificationRequest[]) =>
    [...requests].sort((left, right) => {
      const recencyDelta = parseTime(right.createdAt) - parseTime(left.createdAt);
      if (sortMode === 'recency') {
        return recencyDelta;
      }

      const leftScope = `${getScopeLabel(left)} ${getRequestSubject(left)}`.toLowerCase();
      const rightScope = `${getScopeLabel(right)} ${getRequestSubject(right)}`.toLowerCase();
      const scopeDelta = leftScope.localeCompare(rightScope);
      return scopeDelta === 0 ? recencyDelta : scopeDelta;
    });

  const renderListControls = (
    requests: VerificationRequest[],
    mode: 'incoming' | 'sent',
    activeFilter: RequestStatusFilter,
    onFilterChange: (filter: RequestStatusFilter) => void
  ) => (
    <div className="mb-6 space-y-4 rounded-xl border border-proofound-stone/70 bg-white/80 p-3 dark:border-border dark:bg-background/70">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="group"
          aria-label={`${mode} verification filters`}
          className="flex max-w-full flex-wrap gap-2"
        >
          {STATUS_FILTERS.map((filter) => {
            const filteredCount = filterByStatus(requests, filter.value, nowMs).length;
            const isSelected = activeFilter === filter.value;

            return (
              <Button
                key={filter.value}
                type="button"
                size="sm"
                variant={isSelected ? 'default' : 'outline'}
                aria-pressed={isSelected}
                onClick={() => onFilterChange(filter.value)}
                className={cn(
                  'h-auto min-h-9 justify-start gap-2 rounded-md px-3 py-2 text-xs',
                  isSelected
                    ? 'bg-proofound-forest text-white hover:bg-proofound-forest/90'
                    : 'bg-white text-muted-foreground hover:text-foreground dark:bg-background'
                )}
              >
                {filter.label}
                {filteredCount > 0 && (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-medium',
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-proofound-stone text-proofound-charcoal dark:bg-muted dark:text-foreground'
                    )}
                  >
                    {filteredCount}
                  </span>
                )}
              </Button>
            );
          })}
        </div>

        <div role="group" aria-label="Sort verifications" className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={sortMode === 'recency' ? 'default' : 'outline'}
            aria-pressed={sortMode === 'recency'}
            onClick={() => setSortMode('recency')}
            className={cn(
              'h-auto min-h-9 rounded-md px-3 py-2 text-xs',
              sortMode === 'recency'
                ? 'bg-proofound-charcoal text-white hover:bg-proofound-charcoal/90'
                : 'bg-white dark:bg-background'
            )}
          >
            <ArrowDownWideNarrow className="mr-2 h-3.5 w-3.5" />
            Newest
          </Button>
          <Button
            type="button"
            size="sm"
            variant={sortMode === 'scope' ? 'default' : 'outline'}
            aria-pressed={sortMode === 'scope'}
            onClick={() => setSortMode('scope')}
            className={cn(
              'h-auto min-h-9 rounded-md px-3 py-2 text-xs',
              sortMode === 'scope'
                ? 'bg-proofound-charcoal text-white hover:bg-proofound-charcoal/90'
                : 'bg-white dark:bg-background'
            )}
          >
            <ListFilter className="mr-2 h-3.5 w-3.5" />
            Scope
          </Button>
        </div>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        Active means accepted and current. Pending requests are waiting for a response and do not
        count as active proof.
      </p>
    </div>
  );

  const renderRequestList = (
    requests: VerificationRequest[],
    mode: 'incoming' | 'sent',
    activeFilter: RequestStatusFilter,
    onFilterChange: (filter: RequestStatusFilter) => void
  ) => {
    const filteredRequests = sortRequests(filterByStatus(requests, activeFilter, nowMs));

    return (
      <div>
        {renderListControls(requests, mode, activeFilter, onFilterChange)}
        {filteredRequests.length === 0 ? (
          renderEmptyState(activeFilter, mode)
        ) : (
          <div role="list" className="space-y-4">
            {filteredRequests.map(
              mode === 'incoming' ? renderIncomingRequestCard : renderSentRequestCard
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <AppSurface>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="mb-2 font-display text-3xl font-semibold text-proofound-charcoal dark:text-foreground">
              Proof verification requests
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Follow which proof, claim, verifier, and bounded outcome each request is tied to.
            </p>
          </div>
          {assistiveAiEnabled ? (
            <Button
              type="button"
              onClick={() => setComposerOpen(true)}
              className="w-full bg-proofound-forest text-white hover:bg-proofound-forest/90 md:w-auto"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Draft scoped request
            </Button>
          ) : null}
        </div>

        <Tabs defaultValue="incoming" className="w-full">
          <TabsList className="mb-6 max-w-full overflow-x-auto">
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
            {renderRequestList(incomingRequests, 'incoming', incomingFilter, setIncomingFilter)}
          </TabsContent>

          <TabsContent value="sent">
            {renderRequestList(sentRequests, 'sent', sentFilter, setSentFilter)}
          </TabsContent>
        </Tabs>
      </div>

      {selectedRequest && selectedRequest.subjectType === 'skill' && (
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
      <BundleCancelDialog
        open={bundleDialogOpen}
        onOpenChange={handleBundleDialogOpenChange}
        requestId={bundleRequestId}
        onCanceled={handleBundleItemsCanceled}
      />
      <VerificationRequestComposerDialog
        open={composerOpen}
        onOpenChange={setComposerOpen}
        proofPacks={composerProofPacks}
        onSent={() => router.refresh()}
      />
    </AppSurface>
  );
}
