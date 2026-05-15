import crypto from 'node:crypto';
import { resolvePublicSnippetBaseUrl } from '@/lib/profile/snippet-generator';
export {
  CANDIDATE_INVITE_EXPIRY_DAYS,
  CANDIDATE_INVITE_FLOW_TYPE,
  CANDIDATE_INVITE_STATUS,
} from '@/lib/candidate-invites-shared';
export type {
  CandidateInviteFlowType,
  CandidateInviteStatus,
} from '@/lib/candidate-invites-shared';

export function normalizeInviteEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generateCandidateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashCandidateInviteToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

export function maskInviteEmail(email: string): string {
  const normalized = normalizeInviteEmail(email);
  const [localPart, domain] = normalized.split('@');
  if (!localPart || !domain) {
    return '***';
  }

  if (localPart.length <= 2) {
    return `${localPart[0] ?? '*'}***@${domain}`;
  }

  const prefix = localPart.slice(0, 2);
  return `${prefix}***@${domain}`;
}

export function isInviteExpired(expiresAt: Date | string): boolean {
  return new Date(expiresAt).getTime() <= Date.now();
}

export function buildCandidateInviteUrl(token: string): string {
  const baseUrl = resolvePublicSnippetBaseUrl();
  return `${baseUrl}/candidate-invite/${encodeURIComponent(token)}`;
}
