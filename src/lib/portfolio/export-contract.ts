import type { TrustSignals } from '@/lib/portfolio/trust-signals';
import type { VisibilityFlags } from '@/lib/portfolio/visibility';

export const PORTFOLIO_EXPORT_SCHEMA_VERSION = 'proofound.portfolio-export.v1' as const;

export type PortfolioExportSchemaVersion = typeof PORTFOLIO_EXPORT_SCHEMA_VERSION;

export type PortfolioExportSurface =
  | 'individual_owner'
  | 'individual_public'
  | 'organization_public';

export type PortfolioExportProofPack = {
  id: string;
  scope: 'owner_full' | 'public_safe';
  status: string;
  title: string;
  summary: string | null;
  ownershipStatement: string | null;
  evidenceSummary: string | null;
  outcomesSummary: string | null;
  verificationStatus: string;
  verificationSummary: string;
  freshnessState: string;
  proofQualityScore?: number | null;
  schemaVersion: string;
  artifactCount: number;
  contextLabel: string | null;
  selectedEvidence: Array<{
    title: string;
    artifactDisplayName?: string | null;
    href: string | null;
    artifactKind: string | null;
    issuedAt: string | null;
    description: string | null;
    semanticsNote: string;
  }>;
};

export type PortfolioAssignmentSnapshot = {
  role: string;
  engagementType: string | null;
  businessValue: string | null;
  description: string | null;
  expectedImpact: string | null;
  outcomes: string[];
};

export type PortfolioExportEnvelope = {
  schemaVersion: PortfolioExportSchemaVersion;
  surface: PortfolioExportSurface;
  exportedAt: string;
  shareUrl: string;
};

export type PortfolioExportVisibility = Required<VisibilityFlags>;

export type IndividualPortfolioExportData = PortfolioExportEnvelope & {
  profile: {
    id: string;
    handle: string;
    displayName: string;
    headline: string;
    bio?: string;
    contactEmail?: string;
  };
  publication: {
    requestedState: string;
    effectiveState: string;
    searchIndexingEnabled: boolean;
  };
  signals: TrustSignals;
  skills: Array<{ id: string; name: string; level: number }>;
  proofPacks: PortfolioExportProofPack[];
  visibility: PortfolioExportVisibility;
};

export type OrganizationPortfolioExportData = PortfolioExportEnvelope & {
  organization: {
    id: string;
    slug: string;
    displayName: string;
    verifiedDomainPath?: string;
    mission?: string;
    whyWorkMatters?: string;
    operatingContext?: string;
    website?: string;
    verified: boolean;
  };
  assignmentSnapshot?: PortfolioAssignmentSnapshot;
};
