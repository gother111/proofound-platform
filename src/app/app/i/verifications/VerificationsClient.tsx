'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Mail,
  Send,
  Trash2,
  Wand2,
  ArrowDownWideNarrow,
  ListFilter,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { apiFetch } from '@/lib/api/fetch';
import type {
  VerificationComposerProofPackOption,
  VerificationRequestView,
} from '@/lib/verification/request-feed';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { verificationStatusLabel } from '@/lib/copy/labels';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
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
type RequestSummary = {
  total: number;
  active: number;
  pending: number;
  needsAttention: number;
};
type SentRequestActionError = {
  action: 'delete' | 'resend';
  message: string;
};

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
const MISSING_REQUESTER_LABEL = 'Requester details pending';
const MISSING_SKILL_LABEL = 'Skill details pending';
const MISSING_COMPETENCY_LABEL = 'Level not specified';
const SENT_REQUEST_DELETE_FAILED_MESSAGE =
  'Verification request could not be deleted. Your request is unchanged; review it and try again.';
const SENT_REQUEST_RESEND_FAILED_MESSAGE =
  'Verification request could not be resent. The original request is still active; retry before creating a new request.';

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
  const [deleteConfirmRequest, setDeleteConfirmRequest] = useState<VerificationRequest | null>(
    null
  );
  const [composerOpen, setComposerOpen] = useState(false);
  const [deletingRequestIds, setDeletingRequestIds] = useState<Record<string, boolean>>({});
  const [resendingRequestIds, setResendingRequestIds] = useState<Record<string, boolean>>({});
  const [sentRequestActionErrors, setSentRequestActionErrors] = useState<
    Record<string, SentRequestActionError>
  >({});
  const [incomingFilter, setIncomingFilter] = useState<RequestStatusFilter>('all');
  const [sentFilter, setSentFilter] = useState<RequestStatusFilter>('all');
  const [sortMode, setSortMode] = useState<RequestSortMode>('recency');
  const nowMs = Date.now();

  const clearSentRequestActionError = (requestId: string) => {
    setSentRequestActionErrors((prev) => {
      if (!prev[requestId]) {
        return prev;
      }
      const next = { ...prev };
      delete next[requestId];
      return next;
    });
  };

  const summarizeRequests = (requests: VerificationRequest[]): RequestSummary => ({
    total: requests.length,
    active: filterByStatus(requests, 'active', nowMs).length,
    pending: filterByStatus(requests, 'pending', nowMs).length,
    needsAttention: filterByStatus(requests, 'needs_attention', nowMs).length,
  });

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

  const openDeleteSentRequestDialog = (request: VerificationRequest) => {
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

    setDeleteConfirmRequest(request);
  };

  const handleDeleteSentRequest = async (request: VerificationRequest) => {
    if (!canDeleteSentRequest(request)) {
      return;
    }

    setDeletingRequestIds((prev) => ({ ...prev, [request.id]: true }));
    clearSentRequestActionError(request.id);
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
        clearSentRequestActionError(request.id);
        setDeleteConfirmRequest(null);
        toast.success('Verification request deleted.');
        return;
      }

      if (response.status === 409 && body.code === 'BUNDLED_REQUEST' && body.customRequestId) {
        setDeleteConfirmRequest(null);
        openBundleCancelDialog(body.customRequestId);
        return;
      }

      if (body.error) {
        dispatchClientErrorDiagnostic(
          'verifications.client.sent_request_delete_failed',
          new Error(body.error)
        );
      }
      const message = SENT_REQUEST_DELETE_FAILED_MESSAGE;
      setSentRequestActionErrors((prev) => ({
        ...prev,
        [request.id]: { action: 'delete', message },
      }));
      toast.error(message);
    } catch (error) {
      dispatchClientErrorDiagnostic('verifications.client.sent_request_delete_failed', error);
      const message = SENT_REQUEST_DELETE_FAILED_MESSAGE;
      setSentRequestActionErrors((prev) => ({
        ...prev,
        [request.id]: { action: 'delete', message },
      }));
      toast.error(message);
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
    clearSentRequestActionError(request.id);
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
        if (body.error) {
          dispatchClientErrorDiagnostic(
            'verifications.client.sent_request_resend_failed',
            new Error(body.error)
          );
        }
        const message = SENT_REQUEST_RESEND_FAILED_MESSAGE;
        setSentRequestActionErrors((prev) => ({
          ...prev,
          [request.id]: { action: 'resend', message },
        }));
        toast.error(message);
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
      clearSentRequestActionError(request.id);
    } catch (error) {
      dispatchClientErrorDiagnostic('verifications.client.sent_request_resend_failed', error);
      const message = SENT_REQUEST_RESEND_FAILED_MESSAGE;
      setSentRequestActionErrors((prev) => ({
        ...prev,
        [request.id]: { action: 'resend', message },
      }));
      toast.error(message);
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
    if (!skill) return MISSING_SKILL_LABEL;

    if (skill.name_i18n && typeof skill.name_i18n === 'object' && 'en' in skill.name_i18n) {
      return String((skill.name_i18n as Record<string, unknown>).en || MISSING_SKILL_LABEL);
    }

    if (skill.skills_taxonomy?.name_i18n) {
      const taxName = skill.skills_taxonomy.name_i18n;
      if (typeof taxName === 'object' && taxName && 'en' in taxName) {
        return String((taxName as Record<string, unknown>).en || MISSING_SKILL_LABEL);
      }
      if (typeof taxName === 'string') {
        return taxName.trim() || MISSING_SKILL_LABEL;
      }
    }

    return MISSING_SKILL_LABEL;
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

  const getScopeLabel = (request: VerificationRequest): string => {
    if (request.subjectType === 'custom_bundle') {
      return 'Proof Pack bundle';
    }
    if (request.subjectType === 'impact_story') {
      return 'Proof Pack outcome';
    }
    if (request.requestKind === 'human_observed_attestation') {
      return 'Skill observed in context';
    }
    return 'Skill claim';
  };

  const getGuidanceForRequests = (summary: RequestSummary, mode: 'incoming' | 'sent') => {
    if (summary.total === 0) {
      return mode === 'incoming'
        ? {
            title: 'No one is waiting on you.',
            description:
              'New confirmation requests will appear here with the claim and outcome attached.',
            actionLabel: 'Show all',
            filter: 'all' as RequestStatusFilter,
          }
        : {
            title: 'No requests have been sent.',
            description: 'Draft a scoped request when a proof needs an outside confirmation.',
            actionLabel: 'Show all',
            filter: 'all' as RequestStatusFilter,
          };
    }

    if (summary.needsAttention > 0) {
      return {
        title: `${summary.needsAttention} ${
          summary.needsAttention === 1 ? 'request needs' : 'requests need'
        } attention.`,
        description:
          'Start here for failed, disputed, contradicted, or soon-expiring confirmations.',
        actionLabel: 'Show attention',
        filter: 'needs_attention' as RequestStatusFilter,
      };
    }

    if (summary.pending > 0) {
      return mode === 'incoming'
        ? {
            title: `${summary.pending} ${
              summary.pending === 1 ? 'request is' : 'requests are'
            } waiting for your response.`,
            description: 'Confirm or decline the pending items that you can verify directly.',
            actionLabel: 'Show pending',
            filter: 'pending' as RequestStatusFilter,
          }
        : {
            title: `${summary.pending} ${
              summary.pending === 1 ? 'request is' : 'requests are'
            } waiting on a verifier.`,
            description: 'Follow up only when the claim still needs outside confirmation.',
            actionLabel: 'Show pending',
            filter: 'pending' as RequestStatusFilter,
          };
    }

    return {
      title: `${summary.active} ${summary.active === 1 ? 'request is' : 'requests are'} active.`,
      description: 'Accepted verification remains scoped to the proof or context it confirms.',
      actionLabel: 'Show active',
      filter: 'active' as RequestStatusFilter,
    };
  };

  const getRequesterName = (request: VerificationRequest): string => {
    const profile = request.profiles;
    return profile?.display_name || profile?.handle || MISSING_REQUESTER_LABEL;
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
    return labels[level] || MISSING_COMPETENCY_LABEL;
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
      if (typeof l1Name === 'string' && l1Name) parts.push(l1Name);
    }
    if (l2?.name_i18n) {
      const l2Name =
        typeof l2.name_i18n === 'object'
          ? (l2.name_i18n as Record<string, unknown>).en
          : l2.name_i18n;
      if (typeof l2Name === 'string' && l2Name) parts.push(l2Name);
    }
    if (l3.name_i18n) {
      const l3Name =
        typeof l3.name_i18n === 'object'
          ? (l3.name_i18n as Record<string, unknown>).en
          : l3.name_i18n;
      if (typeof l3Name === 'string' && l3Name) parts.push(l3Name);
    }
    return parts.join(' › ');
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

  const renderStatusBadge = (request: VerificationRequest) => (
    <Badge
      variant="outline"
      className={cn('capitalize text-[11px] px-2 py-0.5', getStatusClasses(request.status))}
    >
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

  const renderIncomingRequestCard = (request: VerificationRequest) => (
    <Card
      variant="bento"
      key={`${request.subjectType}-${request.id}`}
      className="p-4 sm:p-5"
      role="listitem"
      data-testid="verification-request-row"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-proofound-stone text-proofound-charcoal dark:bg-muted dark:text-foreground">
            <span className="text-xs font-semibold">{getRequesterInitials(request)}</span>
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-proofound-charcoal dark:text-foreground truncate">
              {getRequesterName(request)}
            </h3>
            <p className="text-xs leading-5 text-muted-foreground sm:truncate">
              Verification subject:{' '}
              <span className="font-medium text-proofound-charcoal">
                {getRequestSubject(request)}
              </span>
            </p>
            {request.claimSummary ? (
              <div className="mt-2 rounded-md border border-proofound-stone/60 bg-white/70 p-2 text-xs leading-5 text-muted-foreground break-words">
                <span className="font-medium text-proofound-charcoal">Claim</span>
                <span className="mx-1">-</span>
                {request.claimSummary}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center justify-start gap-3 sm:w-auto sm:justify-end sm:shrink-0">
          {renderStatusBadge(request)}
          {request.status === 'pending' && request.subjectType === 'skill' && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRespond(request, 'decline')}
                className="border-destructive text-destructive hover:bg-destructive/10 text-xs px-3 h-8"
              >
                Decline
              </Button>
              <Button
                size="sm"
                onClick={() => handleRespond(request, 'accept')}
                className="bg-proofound-forest text-white hover:bg-proofound-forest/90 text-xs px-3 h-8"
              >
                Confirm
              </Button>
            </div>
          )}
          {request.status === 'pending' && request.subjectType === 'impact_story' && (
            <span className="text-[11px] text-muted-foreground italic">
              Use the emailed link to respond to this proof confirmation request.
            </span>
          )}
        </div>
      </div>
    </Card>
  );

  const renderSentRequestCard = (request: VerificationRequest) => {
    const actionError = sentRequestActionErrors[request.id];

    return (
      <Card
        variant="bento"
        key={`${request.subjectType}-${request.id}`}
        className="p-4 sm:p-5"
        role="listitem"
        data-testid="verification-request-row"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3 sm:items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[#eef3e8] text-proofound-forest">
              <Mail className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-proofound-charcoal dark:text-foreground truncate">
                {request.verifierEmail}
              </h3>
              <p className="text-xs leading-5 text-muted-foreground sm:truncate">
                Verification subject:{' '}
                <span className="font-medium text-proofound-charcoal">
                  {getRequestSubject(request)}
                </span>
              </p>
              {request.subjectType === 'custom_bundle' ? (
                <p className="mt-1 text-xs text-proofound-forest">Proof Pack bundle request sent</p>
              ) : null}
              {request.claimSummary ? (
                <div className="mt-2 rounded-md border border-proofound-stone/60 bg-white/70 p-2 text-xs leading-5 text-muted-foreground break-words">
                  <span className="font-medium text-proofound-charcoal">Claim</span>
                  <span className="mx-1">-</span>
                  {request.claimSummary}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center justify-start gap-3 sm:w-auto sm:justify-end sm:shrink-0">
            {renderStatusBadge(request)}
            <div className="flex flex-wrap items-center gap-2">
              {canResendSentRequest(request) && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void handleResendSentRequest(request);
                  }}
                  disabled={Boolean(resendingRequestIds[request.id])}
                  className="border-proofound-forest text-proofound-forest hover:bg-[#E8F5E9] text-xs px-3 h-8"
                >
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
                    openDeleteSentRequestDialog(request);
                  }}
                  disabled={Boolean(deletingRequestIds[request.id])}
                  className="border-[#C76B4A] text-[#8B4A36] hover:bg-[#FFF0F0] text-xs px-3 h-8"
                >
                  {deletingRequestIds[request.id]
                    ? 'Deleting...'
                    : request.subjectType === 'custom_bundle' ||
                        (request.subjectType === 'skill' && request.bundleId)
                      ? 'Manage bundle'
                      : 'Delete'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {actionError ? (
          <div
            className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900"
            role="alert"
          >
            <p className="font-semibold">
              {actionError.action === 'resend'
                ? 'Verification request could not be resent'
                : 'Verification request could not be deleted'}
            </p>
            <p>{actionError.message}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                if (actionError.action === 'resend') {
                  void handleResendSentRequest(request);
                  return;
                }
                openDeleteSentRequestDialog(request);
              }}
              disabled={
                actionError.action === 'resend'
                  ? Boolean(resendingRequestIds[request.id])
                  : Boolean(deletingRequestIds[request.id])
              }
              className="mt-2 h-8 rounded-full border-amber-300 bg-white px-3 text-xs font-semibold text-amber-950 hover:bg-amber-100"
            >
              {actionError.action === 'resend' ? 'Retry resend' : 'Review delete'}
            </Button>
          </div>
        ) : null}
      </Card>
    );
  };

  const renderEmptyState = (status: RequestStatusFilter, mode: 'incoming' | 'sent') => {
    const statusText = status === 'all' ? '' : `${status} `;
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-proofound-stone/80 bg-white/55 px-4 py-12">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-proofound-stone dark:bg-muted">
          <ShieldCheck className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold mb-1 text-proofound-charcoal dark:text-foreground">
          No {statusText}
          {mode} verifications
        </h3>
        <p className="max-w-xs text-center text-xs text-muted-foreground">
          No requests match the current selection.
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

  const renderRequestList = (
    requests: VerificationRequest[],
    mode: 'incoming' | 'sent',
    activeFilter: RequestStatusFilter,
    onFilterChange: (filter: RequestStatusFilter) => void
  ) => {
    const filteredRequests = sortRequests(filterByStatus(requests, activeFilter, nowMs));
    const summary = summarizeRequests(requests);
    const guidance = getGuidanceForRequests(summary, mode);
    const summaryItems = [
      { label: 'Attention', value: summary.needsAttention, filter: 'needs_attention' },
      { label: 'Pending', value: summary.pending, filter: 'pending' },
      { label: 'Active', value: summary.active, filter: 'active' },
    ] as const;

    return (
      <div className="space-y-4">
        <section
          aria-label={`${mode} verification guidance`}
          className="min-w-0 rounded-xl border border-proofound-stone/70 bg-white/80 p-4"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-proofound-charcoal">{guidance.title}</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground break-words">
                {guidance.description}
              </p>
            </div>
            <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              {summaryItems.map((item) => (
                <Button
                  key={item.label}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onFilterChange(item.filter)}
                  className="min-h-11 justify-start rounded-md bg-white px-3 py-2 text-xs sm:justify-center"
                >
                  <span className="font-semibold">{item.value}</span>
                  <span>{item.label}</span>
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                onClick={() => onFilterChange(guidance.filter)}
                className="col-span-2 min-h-11 justify-start rounded-md bg-proofound-forest px-3 py-2 text-xs text-white sm:col-span-1 sm:justify-center"
              >
                {guidance.actionLabel}
              </Button>
            </div>
          </div>
        </section>
        <div className="flex flex-col gap-3 bg-white/80 p-2.5 rounded-lg border border-proofound-stone/70 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid min-w-0 grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:items-center">
            {STATUS_FILTERS.map((f) => {
              const isSelected = activeFilter === f.value;
              const count = filterByStatus(requests, f.value, nowMs).length;
              return (
                <Button
                  key={f.value}
                  size="sm"
                  variant={isSelected ? 'default' : 'ghost'}
                  onClick={() => onFilterChange(f.value)}
                  className={cn(
                    'min-h-11 justify-start whitespace-normal rounded-md px-3 py-2 text-left text-xs sm:justify-center sm:text-center',
                    isSelected
                      ? 'bg-proofound-forest text-white hover:bg-proofound-forest/90'
                      : 'text-muted-foreground hover:text-proofound-charcoal'
                  )}
                >
                  {f.label}
                  {count > 0 && (
                    <span className="ml-1.5 text-[10px] opacity-75 font-semibold">({count})</span>
                  )}
                </Button>
              );
            })}
          </div>
          <div
            role="group"
            aria-label="Sort verifications"
            className="grid min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap"
          >
            <Button
              type="button"
              size="sm"
              variant={sortMode === 'recency' ? 'default' : 'outline'}
              aria-pressed={sortMode === 'recency'}
              onClick={() => setSortMode('recency')}
              className={cn(
                'min-h-11 justify-start rounded-md px-3 py-2 text-xs sm:justify-center',
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
                'min-h-11 justify-start rounded-md px-3 py-2 text-xs sm:justify-center',
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

        {filteredRequests.length === 0 ? (
          requests.length === 0 ? null : (
            renderEmptyState(activeFilter, mode)
          )
        ) : (
          <div role="list" className="space-y-3">
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
      <div className="mx-auto w-full min-w-0 max-w-4xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold text-proofound-charcoal dark:text-foreground">
              Proof verification requests
            </h1>
            <p className="max-w-xl break-words text-xs leading-5 text-muted-foreground">
              Follow which proof, claim, verifier, and bounded outcome each request is tied to.
            </p>
          </div>
          {assistiveAiEnabled ? (
            <Button
              type="button"
              onClick={() => setComposerOpen(true)}
              className="bg-proofound-forest text-white hover:bg-proofound-forest/90 text-xs px-4 h-9"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Draft scoped request
            </Button>
          ) : null}
        </div>

        <Tabs defaultValue="incoming" className="w-full">
          <TabsList className="mb-4 h-10 p-0.5 bg-proofound-stone/30 rounded-lg">
            <TabsTrigger value="incoming" className="min-h-11 text-xs px-4 py-2 rounded-md">
              Incoming
              {incomingRequests.length > 0 && (
                <span className="ml-1.5 bg-amber-500 text-white px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                  {incomingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="min-h-11 text-xs px-4 py-2 rounded-md">
              Sent
              {sentRequests.length > 0 && (
                <span className="ml-1.5 bg-proofound-forest text-white px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                  {sentRequests.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="incoming" className="space-y-4 outline-none">
            {renderRequestList(incomingRequests, 'incoming', incomingFilter, setIncomingFilter)}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4 outline-none">
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
      <AlertDialog
        open={Boolean(deleteConfirmRequest)}
        onOpenChange={(open) => {
          if (!open && !deleteConfirmRequest?.id) {
            setDeleteConfirmRequest(null);
            return;
          }
          if (!open && !deletingRequestIds[deleteConfirmRequest?.id ?? '']) {
            setDeleteConfirmRequest(null);
          }
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete verification request?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the pending request sent to{' '}
              <span className="font-medium text-proofound-charcoal">
                {deleteConfirmRequest?.verifierEmail ?? 'this verifier'}
              </span>{' '}
              for {deleteConfirmRequest ? getRequestSubject(deleteConfirmRequest) : 'this proof'}.
              Accepted verification records are not changed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteConfirmRequest &&
          sentRequestActionErrors[deleteConfirmRequest.id]?.action === 'delete' ? (
            <div
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900"
              role="alert"
            >
              <p className="font-semibold">Verification request could not be deleted</p>
              <p>{sentRequestActionErrors[deleteConfirmRequest.id].message}</p>
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={Boolean(deletingRequestIds[deleteConfirmRequest?.id ?? ''])}
            >
              Keep request
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={Boolean(deletingRequestIds[deleteConfirmRequest?.id ?? ''])}
              onClick={(event) => {
                if (!deleteConfirmRequest) {
                  return;
                }
                event.preventDefault();
                void handleDeleteSentRequest(deleteConfirmRequest);
              }}
            >
              {deletingRequestIds[deleteConfirmRequest?.id ?? '']
                ? 'Deleting request...'
                : 'Delete request'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <VerificationRequestComposerDialog
        open={composerOpen}
        onOpenChange={setComposerOpen}
        proofPacks={composerProofPacks}
        onSent={() => router.refresh()}
      />
    </AppSurface>
  );
}
